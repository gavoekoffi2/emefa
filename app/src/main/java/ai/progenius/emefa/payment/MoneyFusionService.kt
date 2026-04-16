// Copyright 2026 EMEFA (progenius.ai). All rights reserved.
// Licensed under the Apache License, Version 2.0.
package ai.progenius.emefa.payment

import android.util.Log
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * MoneyFusion FusionPay - Agrégateur de paiement africain
 * Documentation: https://docs.moneyfusion.net
 *
 * Supporte: Orange Money, MTN MoMo, Wave, Moov Money, M-Pesa, etc.
 * Pays: Côte d'Ivoire, Sénégal, Togo, Bénin, Burkina Faso, Mali, Cameroun, etc.
 *
 * Pro Genius AI
 */
object MoneyFusionService {

    private const val TAG = "MoneyFusion"
    private const val BASE_URL = "https://www.pay.moneyfusion.net"
    private const val STATUS_URL = "https://www.pay.moneyfusion.net/paiementNotif"
    private const val PAYOUT_URL = "https://pay.moneyfusion.net/api/v1/withdraw"

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()

    // ─────────────────────────────────────────────────────────────────────────
    // MODÈLES DE DONNÉES
    // ─────────────────────────────────────────────────────────────────────────

    data class PaymentRequest(
        @SerializedName("totalPrice") val totalPrice: Double,
        @SerializedName("article") val article: List<Map<String, Any>>,
        @SerializedName("numeroSend") val numeroSend: String,
        @SerializedName("nomclient") val nomclient: String,
        @SerializedName("personal_Info") val personalInfo: List<Map<String, Any>> = emptyList(),
        @SerializedName("return_url") val returnUrl: String = "",
        @SerializedName("webhook_url") val webhookUrl: String = ""
    )

    data class PaymentResponse(
        @SerializedName("statut") val statut: Boolean = false,
        @SerializedName("token") val token: String = "",
        @SerializedName("message") val message: String = "",
        @SerializedName("url") val url: String = ""
    )

    data class PaymentStatus(
        @SerializedName("statut") val statut: Boolean = false,
        @SerializedName("data") val data: PaymentStatusData? = null,
        @SerializedName("message") val message: String = ""
    )

    data class PaymentStatusData(
        @SerializedName("_id") val id: String = "",
        @SerializedName("tokenPay") val tokenPay: String = "",
        @SerializedName("numeroSend") val numeroSend: String = "",
        @SerializedName("nomclient") val nomclient: String = "",
        @SerializedName("numeroTransaction") val numeroTransaction: String = "",
        @SerializedName("Montant") val montant: Double = 0.0,
        @SerializedName("frais") val frais: Double = 0.0,
        @SerializedName("statut") val statut: String = "pending",
        @SerializedName("moyen") val moyen: String = "",
        @SerializedName("createdAt") val createdAt: String = ""
    )

    data class PayoutRequest(
        @SerializedName("countryCode") val countryCode: String,
        @SerializedName("phone") val phone: String,
        @SerializedName("amount") val amount: Double,
        @SerializedName("withdraw_mode") val withdrawMode: String,
        @SerializedName("webhook_url") val webhookUrl: String = ""
    )

    data class PayoutResponse(
        @SerializedName("tokenPay") val tokenPay: String = "",
        @SerializedName("statut") val statut: Boolean = false,
        @SerializedName("message") val message: String = ""
    )

    sealed class PaymentResult<out T> {
        data class Success<T>(val data: T) : PaymentResult<T>()
        data class Error(val message: String, val code: Int = 0) : PaymentResult<Nothing>()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MÉTHODES DE PAIEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Initier un paiement MoneyFusion
     * @param apiUrl URL API depuis le tableau de bord MoneyFusion
     * @param amount Montant à payer
     * @param phoneNumber Numéro de téléphone du client
     * @param clientName Nom du client
     * @param description Description de l'article/service
     * @param orderId Identifiant de la commande
     * @return PaymentResult avec l'URL de paiement
     */
    suspend fun initiatePayment(
        apiUrl: String,
        amount: Double,
        phoneNumber: String,
        clientName: String,
        description: String = "Paiement EMEFA",
        orderId: String = System.currentTimeMillis().toString()
    ): PaymentResult<PaymentResponse> = withContext(Dispatchers.IO) {
        try {
            val paymentData = PaymentRequest(
                totalPrice = amount,
                article = listOf(mapOf(description to amount)),
                numeroSend = phoneNumber.trim(),
                nomclient = clientName.trim(),
                personalInfo = listOf(mapOf("orderId" to orderId, "app" to "EMEFA")),
                returnUrl = "",
                webhookUrl = ""
            )

            val body = gson.toJson(paymentData).toRequestBody(JSON_MEDIA)
            val request = Request.Builder()
                .url(apiUrl)
                .post(body)
                .addHeader("Content-Type", "application/json")
                .build()

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string() ?: ""
            Log.d(TAG, "Payment response: $responseBody")

            if (response.isSuccessful) {
                val result = gson.fromJson(responseBody, PaymentResponse::class.java)
                if (result.statut) {
                    PaymentResult.Success(result)
                } else {
                    PaymentResult.Error(result.message.ifEmpty { "Paiement refusé" })
                }
            } else {
                PaymentResult.Error("Erreur serveur: ${response.code}", response.code)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Payment error", e)
            PaymentResult.Error(e.message ?: "Erreur de connexion")
        }
    }

    /**
     * Vérifier le statut d'un paiement
     * @param token Token de paiement retourné par initiatePayment
     */
    suspend fun checkPaymentStatus(token: String): PaymentResult<PaymentStatus> =
        withContext(Dispatchers.IO) {
            try {
                val request = Request.Builder()
                    .url("$STATUS_URL/$token")
                    .get()
                    .build()

                val response = client.newCall(request).execute()
                val responseBody = response.body?.string() ?: ""
                Log.d(TAG, "Status response: $responseBody")

                if (response.isSuccessful) {
                    val result = gson.fromJson(responseBody, PaymentStatus::class.java)
                    PaymentResult.Success(result)
                } else {
                    PaymentResult.Error("Erreur: ${response.code}", response.code)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Status check error", e)
                PaymentResult.Error(e.message ?: "Erreur de connexion")
            }
        }

    /**
     * Effectuer un retrait (Payout)
     * @param apiKey Clé API privée MoneyFusion
     * @param phone Numéro de téléphone du bénéficiaire
     * @param amount Montant à retirer
     * @param countryCode Code pays (ci, sn, tg, bj, etc.)
     * @param withdrawMode Mode de retrait (orange-money-ci, mtn-ci, wave-ci, etc.)
     */
    suspend fun initiatePayout(
        apiKey: String,
        phone: String,
        amount: Double,
        countryCode: String,
        withdrawMode: String,
        webhookUrl: String = ""
    ): PaymentResult<PayoutResponse> = withContext(Dispatchers.IO) {
        try {
            val payoutData = PayoutRequest(
                countryCode = countryCode,
                phone = phone.trim(),
                amount = amount,
                withdrawMode = withdrawMode,
                webhookUrl = webhookUrl
            )

            val body = gson.toJson(payoutData).toRequestBody(JSON_MEDIA)
            val request = Request.Builder()
                .url(PAYOUT_URL)
                .post(body)
                .addHeader("Content-Type", "application/json")
                .addHeader("moneyfusion-private-key", apiKey)
                .build()

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string() ?: ""
            Log.d(TAG, "Payout response: $responseBody")

            if (response.isSuccessful) {
                val result = gson.fromJson(responseBody, PayoutResponse::class.java)
                if (result.statut) {
                    PaymentResult.Success(result)
                } else {
                    PaymentResult.Error(result.message.ifEmpty { "Retrait refusé" })
                }
            } else {
                PaymentResult.Error("Erreur serveur: ${response.code}", response.code)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Payout error", e)
            PaymentResult.Error(e.message ?: "Erreur de connexion")
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITAIRES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Retourne le mode de retrait pour un opérateur et un pays donnés
     */
    fun getWithdrawMode(operator: MobileOperator, countryCode: String): String {
        return when (operator) {
            MobileOperator.ORANGE_MONEY -> when (countryCode) {
                "ci" -> "orange-money-ci"
                "sn" -> "orange-money-senegal"
                "bf" -> "orange-money-burkina"
                "ml" -> "orange-money-mali"
                "cm" -> "orange-money-cm"
                "cf" -> "orange-cf"
                "gm" -> "orange-gm"
                "sl" -> "orange-sl"
                "gn" -> "orange-gn"
                else -> "orange-money-ci"
            }
            MobileOperator.MTN_MOMO -> when (countryCode) {
                "ci" -> "mtn-ci"
                "bj" -> "mtn-benin"
                "gh" -> "mtn-gh"
                "cm" -> "mtn-cm"
                "cg" -> "mtn-cg"
                "rw" -> "mtn-rw"
                "ug" -> "mtn-ug"
                "gn" -> "mtn-gn"
                "gw" -> "mtn-gw"
                "ne" -> "mtn-ne"
                else -> "mtn-ci"
            }
            MobileOperator.WAVE -> when (countryCode) {
                "ci" -> "wave-ci"
                "sn" -> "wave-senegal"
                else -> "wave-ci"
            }
            MobileOperator.MOOV_MONEY -> when (countryCode) {
                "ci" -> "moov-ci"
                "bj" -> "moov-benin"
                "bf" -> "moov-burkina-faso"
                "tg" -> "moov-togo"
                "td" -> "moov-td"
                else -> "moov-ci"
            }
            MobileOperator.T_MONEY -> "t-money-togo"
            MobileOperator.M_PESA -> when (countryCode) {
                "ke" -> "m-pesa-ke"
                "tz" -> "m-pesa-tz"
                else -> "m-pesa-ke"
            }
            MobileOperator.FREE_MONEY -> "free-money-senegal"
            MobileOperator.AIRTEL_MONEY -> when (countryCode) {
                "cd" -> "airtel-money-cd"
                "ga" -> "airtel-money-ga"
                "gh" -> "airtel-money-gh"
                "ne" -> "airtel-money-ne"
                "td" -> "airtel-money-td"
                "tz" -> "airtel-money-tz"
                else -> "airtel-money-cd"
            }
        }
    }

    /**
     * Opérateurs Mobile Money supportés par MoneyFusion
     */
    enum class MobileOperator(val displayName: String, val iconRes: String) {
        ORANGE_MONEY("Orange Money", "ic_orange_money"),
        MTN_MOMO("MTN MoMo", "ic_mtn_momo"),
        WAVE("Wave", "ic_wave"),
        MOOV_MONEY("Moov Money", "ic_moov_money"),
        T_MONEY("T-Money", "ic_t_money"),
        M_PESA("M-Pesa", "ic_m_pesa"),
        FREE_MONEY("Free Money", "ic_free_money"),
        AIRTEL_MONEY("Airtel Money", "ic_airtel_money");

        companion object {
            fun forCountry(countryCode: String): List<MobileOperator> {
                return when (countryCode) {
                    "ci" -> listOf(ORANGE_MONEY, MTN_MOMO, WAVE, MOOV_MONEY)
                    "sn" -> listOf(ORANGE_MONEY, WAVE, FREE_MONEY)
                    "tg" -> listOf(T_MONEY, MOOV_MONEY)
                    "bj" -> listOf(MTN_MOMO, MOOV_MONEY)
                    "bf" -> listOf(ORANGE_MONEY, MOOV_MONEY)
                    "ml" -> listOf(ORANGE_MONEY)
                    "cm" -> listOf(ORANGE_MONEY, MTN_MOMO)
                    "ke" -> listOf(M_PESA)
                    "gh" -> listOf(MTN_MOMO, AIRTEL_MONEY)
                    "rw" -> listOf(MTN_MOMO)
                    "ug" -> listOf(MTN_MOMO)
                    else -> listOf(ORANGE_MONEY, MTN_MOMO, WAVE)
                }
            }
        }
    }

    /**
     * Pays supportés par MoneyFusion
     */
    val SUPPORTED_COUNTRIES = mapOf(
        "ci" to "Côte d'Ivoire",
        "sn" to "Sénégal",
        "tg" to "Togo",
        "bj" to "Bénin",
        "bf" to "Burkina Faso",
        "ml" to "Mali",
        "cm" to "Cameroun",
        "cg" to "Congo Brazzaville",
        "cd" to "Congo RDC",
        "ga" to "Gabon",
        "gh" to "Ghana",
        "gn" to "Guinée Conakry",
        "gw" to "Guinée-Bissau",
        "ke" to "Kenya",
        "ne" to "Niger",
        "rw" to "Rwanda",
        "sl" to "Sierra Leone",
        "tz" to "Tanzanie",
        "td" to "Tchad",
        "gm" to "Gambie",
        "ug" to "Ouganda",
        "mr" to "Mauritanie",
        "cf" to "Centrafrique",
        "et" to "Éthiopie"
    )

    /**
     * Statuts de paiement
     */
    object PaymentStatuses {
        const val PENDING = "pending"
        const val PAID = "paid"
        const val FAILURE = "failure"
        const val NO_PAID = "no paid"

        fun getLabel(status: String): String = when (status) {
            PENDING -> "En attente"
            PAID -> "Payé"
            FAILURE -> "Échec"
            NO_PAID -> "Non payé"
            else -> status
        }
    }
}
