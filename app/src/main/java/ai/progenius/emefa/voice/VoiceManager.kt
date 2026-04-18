package ai.progenius.emefa.voice

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * VoiceManager - Orchestre le bouton flottant et le service vocal EMEFA
 * Point d'entrée unique pour la gestion de la voix dans toute l'application
 */
object VoiceManager {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var floatingButton: VoiceFloatingButton? = null
    private var isVoiceActive = false

    /**
     * Initialiser le bouton flottant vocal
     * À appeler depuis MainActivity après l'obtention des permissions
     */
    fun init(context: Context) {
        if (floatingButton != null) return

        floatingButton = VoiceFloatingButton(
            context = context.applicationContext,
            onTap = { toggleVoice(context.applicationContext) },
            onLongPress = { openVoiceSettings(context) }
        )
    }

    /**
     * Afficher le bouton flottant
     * Vérifie d'abord la permission d'overlay
     */
    fun showFloatingButton(context: Context) {
        if (!canDrawOverlays(context)) {
            requestOverlayPermission(context)
            return
        }
        floatingButton?.show()
    }

    /**
     * Masquer le bouton flottant
     */
    fun hideFloatingButton() {
        floatingButton?.hide()
    }

    /**
     * Basculer la session vocale (démarrer / arrêter)
     */
    fun toggleVoice(context: Context) {
        if (isVoiceActive) {
            stopVoice(context)
        } else {
            startVoice(context)
        }
    }

    /**
     * Démarrer une session vocale avec l'assistante EMEFA
     */
    fun startVoice(context: Context) {
        if (!LiveKitTokenManager.isConfigured()) {
            Toast.makeText(
                context,
                "Configurez LiveKit dans Paramètres → Voix pour activer la conversation vocale",
                Toast.LENGTH_LONG
            ).show()
            return
        }

        scope.launch {
            val result = LiveKitTokenManager.getAccessToken()
            result.fold(
                onSuccess = { (url, token) ->
                    isVoiceActive = true
                    VoiceService.startVoice(context, url, token)
                    floatingButton?.updateState(VoiceService.VoiceState.Connecting)
                },
                onFailure = { error ->
                    Toast.makeText(
                        context,
                        "Erreur de connexion: ${error.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                    floatingButton?.updateState(VoiceService.VoiceState.Error(error.message ?: ""))
                }
            )
        }
    }

    /**
     * Arrêter la session vocale
     */
    fun stopVoice(context: Context) {
        isVoiceActive = false
        VoiceService.stopVoice(context)
        floatingButton?.updateState(VoiceService.VoiceState.Idle)
    }

    /**
     * Vérifier la permission d'affichage en overlay
     */
    fun canDrawOverlays(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }

    /**
     * Demander la permission d'affichage en overlay
     */
    fun requestOverlayPermission(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            ).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            Toast.makeText(
                context,
                "Activez 'Afficher par-dessus les autres apps' pour EMEFA",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    private fun openVoiceSettings(context: Context) {
        // Ouvrir les paramètres de voix (à implémenter dans SettingsActivity)
        Toast.makeText(context, "Paramètres vocaux → Paramètres → Voix", Toast.LENGTH_SHORT).show()
    }

    fun cleanup() {
        floatingButton?.hide()
        floatingButton = null
    }
}
