package ai.progenius.emefa.voice

import ai.progenius.emefa.KVUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.UUID

/**
 * Gestionnaire de tokens LiveKit pour EMEFA
 * Génère des tokens d'accès aux rooms vocales
 */
object LiveKitTokenManager {

    // Clés de configuration (stockées dans les paramètres de l'app)
    private const val KEY_LIVEKIT_URL = "livekit_url"
    private const val KEY_LIVEKIT_API_KEY = "livekit_api_key"
    private const val KEY_LIVEKIT_API_SECRET = "livekit_api_secret"
    private const val KEY_TOKEN_SERVER_URL = "livekit_token_server_url"

    // URL par défaut (à configurer dans les paramètres)
    private const val DEFAULT_LIVEKIT_URL = "wss://emefa-assistant.livekit.cloud"

    /**
     * Obtenir l'URL du serveur LiveKit configurée
     */
    fun getLiveKitUrl(): String {
        return KVUtils.getString(KEY_LIVEKIT_URL, DEFAULT_LIVEKIT_URL)
    }

    /**
     * Sauvegarder la configuration LiveKit
     */
    fun saveConfig(url: String, tokenServerUrl: String) {
        KVUtils.putString(KEY_LIVEKIT_URL, url)
        KVUtils.putString(KEY_TOKEN_SERVER_URL, tokenServerUrl)
    }

    /**
     * Obtenir un token d'accès depuis le serveur de tokens
     * Le serveur de tokens est un endpoint simple qui génère des tokens JWT LiveKit
     */
    suspend fun getAccessToken(
        roomName: String = "emefa-${UUID.randomUUID().toString().take(8)}",
        participantName: String = "user-${UUID.randomUUID().toString().take(6)}"
    ): Result<Pair<String, String>> = withContext(Dispatchers.IO) {
        try {
            val tokenServerUrl = KVUtils.getString(KEY_TOKEN_SERVER_URL, "")
            val livekitUrl = getLiveKitUrl()

            if (tokenServerUrl.isBlank()) {
                // Mode sandbox LiveKit Cloud (pour les tests)
                return@withContext Result.failure(
                    Exception("Serveur de tokens non configuré. Allez dans Paramètres → Voix → Configurer LiveKit")
                )
            }

            val client = OkHttpClient()
            val url = "$tokenServerUrl?roomName=$roomName&participantName=$participantName"
            val request = Request.Builder().url(url).get().build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                return@withContext Result.failure(
                    Exception("Erreur serveur tokens: ${response.code}")
                )
            }

            val body = response.body?.string() ?: ""
            val json = JSONObject(body)
            val token = json.optString("accessToken") 
                ?: json.optString("token")
                ?: return@withContext Result.failure(Exception("Token introuvable dans la réponse"))
            
            val serverUrl = json.optString("url", livekitUrl)

            Result.success(Pair(serverUrl, token))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Vérifier si LiveKit est configuré
     */
    fun isConfigured(): Boolean {
        val tokenServerUrl = KVUtils.getString(KEY_TOKEN_SERVER_URL, "")
        return tokenServerUrl.isNotBlank()
    }
}
