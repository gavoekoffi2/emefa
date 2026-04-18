package ai.progenius.emefa.voice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import io.livekit.android.LiveKit
import io.livekit.android.events.RoomEvent
import io.livekit.android.events.collect
import io.livekit.android.room.Room
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import ai.progenius.emefa.R
import ai.progenius.emefa.ui.chat.ComposeChatActivity

/**
 * Service de conversation vocale EMEFA via LiveKit
 */
class VoiceService : Service() {

    companion object {
        const val CHANNEL_ID = "emefa_voice_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "ai.progenius.emefa.voice.START"
        const val ACTION_STOP = "ai.progenius.emefa.voice.STOP"
        const val ACTION_MUTE = "ai.progenius.emefa.voice.MUTE"
        const val EXTRA_URL = "livekit_url"
        const val EXTRA_TOKEN = "livekit_token"

        fun startVoice(context: Context, url: String, token: String) {
            val intent = Intent(context, VoiceService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_URL, url)
                putExtra(EXTRA_TOKEN, token)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopVoice(context: Context) {
            context.startService(Intent(context, VoiceService::class.java).apply {
                action = ACTION_STOP
            })
        }
    }

    sealed class VoiceState {
        object Idle : VoiceState()
        object Connecting : VoiceState()
        object Connected : VoiceState()
        object AgentSpeaking : VoiceState()
        data class Error(val message: String) : VoiceState()
    }

    private val _state = MutableStateFlow<VoiceState>(VoiceState.Idle)
    val state: StateFlow<VoiceState> = _state.asStateFlow()

    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var room: Room? = null
    private var roomEventsJob: Job? = null

    inner class VoiceBinder : Binder() {
        fun getService(): VoiceService = this@VoiceService
    }

    private val binder = VoiceBinder()

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val url = intent.getStringExtra(EXTRA_URL) ?: return START_NOT_STICKY
                val token = intent.getStringExtra(EXTRA_TOKEN) ?: return START_NOT_STICKY
                startForeground(NOTIFICATION_ID, buildNotification("Connexion..."))
                connectToRoom(url, token)
            }
            ACTION_STOP -> disconnectAndStop()
            ACTION_MUTE -> toggleMute()
        }
        return START_NOT_STICKY
    }

    private fun connectToRoom(url: String, token: String) {
        serviceScope.launch {
            try {
                _state.value = VoiceState.Connecting
                updateNotification("Connexion a EMEFA...")

                val newRoom = LiveKit.create(appContext = applicationContext)
                room = newRoom

                roomEventsJob = launch {
                    newRoom.events.collect { event ->
                        handleRoomEvent(event)
                    }
                }

                newRoom.connect(url, token)
                newRoom.localParticipant.setMicrophoneEnabled(true)

                _state.value = VoiceState.Connected
                updateNotification("EMEFA a l'ecoute...")

            } catch (e: Exception) {
                _state.value = VoiceState.Error(e.message ?: "Erreur de connexion")
                updateNotification("Erreur: ${e.message}")
            }
        }
    }

    private fun handleRoomEvent(event: RoomEvent) {
        when (event) {
            is RoomEvent.TrackSubscribed -> {
                _state.value = VoiceState.AgentSpeaking
                updateNotification("EMEFA repond...")
            }
            is RoomEvent.TrackUnsubscribed -> {
                if (_state.value == VoiceState.AgentSpeaking) {
                    _state.value = VoiceState.Connected
                    updateNotification("EMEFA a l'ecoute...")
                }
            }
            is RoomEvent.Disconnected -> {
                _state.value = VoiceState.Idle
                stopSelf()
            }
            else -> {}
        }
    }

    fun toggleMute() {
        serviceScope.launch {
            val newMuted = !_isMuted.value
            _isMuted.value = newMuted
            room?.localParticipant?.setMicrophoneEnabled(!newMuted)
            updateNotification(if (newMuted) "Micro coupe" else "EMEFA a l'ecoute...")
        }
    }

    fun disconnect() {
        disconnectAndStop()
    }

    private fun disconnectAndStop() {
        serviceScope.launch {
            roomEventsJob?.cancel()
            room?.disconnect()
            room = null
            _state.value = VoiceState.Idle
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "EMEFA Voix",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Session vocale avec EMEFA"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        val mainIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, ComposeChatActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        val stopIntent = PendingIntent.getService(
            this, 1,
            Intent(this, VoiceService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("EMEFA - Assistante vocale")
            .setContentText(text)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(mainIntent)
            .addAction(0, "Terminer", stopIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, buildNotification(text))
    }
}
