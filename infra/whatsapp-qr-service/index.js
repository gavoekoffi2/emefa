/**
 * EMEFA WhatsApp QR Bridge (UNOFFICIAL)
 *
 * WARNING: This uses Baileys (unofficial WhatsApp Web API).
 * Risks: Account ban, instability, breaks with WA updates.
 * This is isolated as a separate microservice with quotas.
 * For production, use WhatsApp Cloud API instead.
 */

const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8095;
const SESSIONS_DIR = process.env.SESSIONS_DIR || './sessions';
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || '10');
const MESSAGE_QUOTA_PER_HOUR = parseInt(process.env.MESSAGE_QUOTA || '50');

const logger = pino({ level: 'info' });

// In-memory session store
const sessions = new Map();
const messageCounters = new Map();

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/**
 * Create or reconnect a WhatsApp session
 */
async function createSession(sessionId) {
  if (sessions.size >= MAX_SESSIONS) {
    throw new Error(`Maximum sessions (${MAX_SESSIONS}) reached`);
  }

  const sessionPath = path.join(SESSIONS_DIR, sessionId);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
  });

  const sessionData = {
    socket: sock,
    qr: null,
    connected: false,
    lastActivity: Date.now(),
  };

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      sessionData.qr = qr;
      logger.info({ sessionId }, 'QR code generated');
    }

    if (connection === 'open') {
      sessionData.connected = true;
      sessionData.qr = null;
      logger.info({ sessionId }, 'Connected to WhatsApp');
    }

    if (connection === 'close') {
      sessionData.connected = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        logger.info({ sessionId }, 'Reconnecting...');
        setTimeout(() => createSession(sessionId), 5000);
      } else {
        logger.info({ sessionId }, 'Session logged out');
        sessions.delete(sessionId);
      }
    }
  });

  // Handle incoming messages (forward to EMEFA backend via webhook)
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      if (!text) continue;

      const from = msg.key.remoteJid;
      logger.info({ sessionId, from }, `Incoming message: ${text.substring(0, 50)}`);

      // Forward to EMEFA backend webhook
      try {
        const webhookUrl = process.env.WEBHOOK_URL || 'http://backend:8000/api/v1/webhooks/whatsapp-qr';
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            from: from,
            text: text,
            timestamp: msg.messageTimestamp,
          }),
        });
      } catch (err) {
        logger.error({ err, sessionId }, 'Failed to forward message');
      }
    }
  });

  sessions.set(sessionId, sessionData);
  return sessionData;
}

/**
 * Rate limiting check
 */
function checkQuota(sessionId) {
  const now = Date.now();
  const key = `${sessionId}-${Math.floor(now / 3600000)}`;
  const count = messageCounters.get(key) || 0;
  if (count >= MESSAGE_QUOTA_PER_HOUR) {
    return false;
  }
  messageCounters.set(key, count + 1);
  return true;
}

// ============ API Routes ============

app.get('/health', (req, res) => {
  res.json({ status: 'ok', sessions: sessions.size, maxSessions: MAX_SESSIONS });
});

// Start a new session / get QR
app.post('/session/:sessionId/start', async (req, res) => {
  const { sessionId } = req.params;
  try {
    let session = sessions.get(sessionId);
    if (!session) {
      session = await createSession(sessionId);
    }
    // Wait for QR or connection
    await new Promise(r => setTimeout(r, 2000));
    session = sessions.get(sessionId);

    res.json({
      connected: session?.connected || false,
      hasQR: !!session?.qr,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get QR code as base64 image
app.get('/session/:sessionId/qr', async (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found. POST /session/:id/start first.' });
  }

  if (session.connected) {
    return res.json({ connected: true, qr: null });
  }

  if (!session.qr) {
    return res.json({ connected: false, qr: null, message: 'QR not ready yet, try again' });
  }

  const qrImage = await QRCode.toDataURL(session.qr);
  res.json({ connected: false, qr: qrImage });
});

// Send a message
app.post('/session/:sessionId/send', async (req, res) => {
  const { sessionId } = req.params;
  const { to, text } = req.body;

  const session = sessions.get(sessionId);
  if (!session?.connected) {
    return res.status(400).json({ error: 'Session not connected' });
  }

  if (!checkQuota(sessionId)) {
    return res.status(429).json({ error: 'Message quota exceeded' });
  }

  try {
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    await session.socket.sendMessage(jid, { text });
    session.lastActivity = Date.now();
    res.json({ status: 'sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session status
app.get('/session/:sessionId/status', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ exists: false });
  }

  res.json({
    exists: true,
    connected: session.connected,
    lastActivity: session.lastActivity,
  });
});

// Close session
app.delete('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (session) {
    session.socket.end();
    sessions.delete(sessionId);
  }

  res.json({ status: 'closed' });
});

app.listen(PORT, () => {
  logger.info(`WhatsApp QR Bridge running on port ${PORT}`);
  logger.info('WARNING: This is an UNOFFICIAL WhatsApp integration. Use at your own risk.');
});
