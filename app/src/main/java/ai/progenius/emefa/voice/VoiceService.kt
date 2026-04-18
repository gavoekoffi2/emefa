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
import io.livekit.android.LiveKitOverrides
import io.livekit.android.RoomOptions
import io.livekit.android.audio.AudioSwitchHandler
import io.livekit.android.events.RoomEvent
import io.livekit.android.events.collect
import io.livekit.android.room.Room
import io.livekit.android.room.track.LocalAudioTrack
import io.livekit.android.room.track.LocalAudioTrackOptions
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
import ai.progenius.emefa.ui.main.MainActivity

/**
 * Service de conversation vocale EMEFA via LiveKit
 * Fonctionne en arrière-plan, accessible depuis tout l'app via le bouton flottant
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

    // État de la session vocale
    sealed class VoiceState {
        object Idle : VoiceState()
        object Connecting : VoiceState()
        object Connected : VoiceState()
        object Speaking : VoiceState()       // L'utilisateur parle
        object AgentSpeaking : VoiceState()  // L'assistante répond
        data class Error(val message: String) : VoiceState()
    }

    private val _state = MutableStateFlow<VoiceState>(VoiceState.Idle)
    val state: StateFlow<VoiceState> = _state.asStateFlow()

    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var room: Room? = null
    private var localAudioTrack: LocalAudioTrack? = null
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
            ACTION_STOP -> {
                disconnectAndStop()
            }
            ACTION_MUTE -> {
                toggleMute()
            }
        }
        return START_NOT_STICKY
    }

    private fun connectToRoom(url: String, token: String) {
        serviceScope.launch {
            try {
                _state.value = VoiceState.Connecting
                updateNotification("Connexion à EMEFA...")

                // Créer la room LiveKit
                val newRoom = LiveKit.create(
                    appContext = applicationContext,
                    overrides = LiveKitOverrides(
                        audioHandler = AudioSwitchHandler(applicationContext)
                    )
                )
                room = newRoom

                // Écouter les événements de la room
                roomEventsJob = launch {
                    newRoom.events.collect { event ->
                        handleRoomEvent(event)
                    }
                }

                // Se connecter à la room
                newRoom.connect(url, token, RoomOptions())

                // Activer le micro
                localAudioTrack = newRoom.localParticipant.setMicrophoneEnabled(true)

                _state.value = VoiceState.Connected
                updateNotification("EMEFA à l'écoute...")

            } catch (e: Exception) {
                _state.value = VoiceState.Error(e.message ?: "Erreur de connexion")
                updateNotification("Erreur: ${e.message}")
            }
        }
    }

    private fun handleRoomEvent(event: RoomEvent) {
        when (event) {
            is RoomEvent.TrackSubscribed -> {
                // L'agent a commencé à parler
                _state.value = VoiceState.AgentSpeaking
                updateNotification("EMEFA répond...")
            }
            is RoomEvent.TrackUnsubscribed -> {
                // L'agent a fini de parler
                if (_state.value == VoiceState.AgentSpeaking) {
                    _state.value = VoiceState.Connected
                    updateNotification("EMEFA à l'écoute...")
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
            localAudioTrack?.enabled = !newMuted
            updateNotification(if (newMuted) "Micro coupé" else "EMEFA à l'écoute...")
        }
    }

    fun disconnect() {
        disconnectAndStop()
    }

    private fun disconnectAndStop() {
        serviceScope.launch {
            roomEventsJob?.cancel()
            room?.disconnect()
            room?.release()
            room = null
            localAudioTrack = null
            _state.value = VoiceState.Idle
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        room?.release()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "EMEFA Voix",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Session vocale avec l'assistante EMEFA"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        val mainIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        val stopIntent = PendingIntent.getService(
            this, 1,
            Intent(this, VoiceService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("EMEFA — Assistante vocale")
            .setContentText(text)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(mainIntent)
            .addAction(R.drawable.ic_close, "Terminer", stopIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, buildNotification(text))
    }
}
