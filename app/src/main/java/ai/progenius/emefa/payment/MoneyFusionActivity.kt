// Copyright 2026 EMEFA (progenius.ai). All rights reserved.
// Licensed under the Apache License, Version 2.0.
package ai.progenius.emefa.payment

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.*
import androidx.lifecycle.lifecycleScope
import ai.progenius.emefa.R
import ai.progenius.emefa.base.BaseActivity
import ai.progenius.emefa.utils.KVUtils
import kotlinx.coroutines.launch

/**
 * Écran de paiement MoneyFusion
 * Permet d'initier un paiement Mobile Money africain via FusionPay
 * Pro Genius AI
 */
class MoneyFusionActivity : BaseActivity() {

    companion object {
        const val EXTRA_AMOUNT = "amount"
        const val EXTRA_DESCRIPTION = "description"
        const val EXTRA_ORDER_ID = "order_id"

        fun start(context: Context, amount: Double = 0.0, description: String = "") {
            val intent = Intent(context, MoneyFusionActivity::class.java).apply {
                putExtra(EXTRA_AMOUNT, amount)
                putExtra(EXTRA_DESCRIPTION, description)
            }
            context.startActivity(intent)
        }
    }

    private var selectedCountry = "ci"
    private var selectedOperator: MoneyFusionService.MobileOperator =
        MoneyFusionService.MobileOperator.ORANGE_MONEY

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Appliquer le thème
        val themeColors = ai.progenius.emefa.ui.chat.ThemeManager.getColors()
        window.statusBarColor = themeColors.toolbarBg

        // Créer l'interface programmatiquement
        val scrollView = ScrollView(this).apply {
            setBackgroundColor(themeColors.bg)
        }

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
        }

        // Titre
        val titleView = TextView(this).apply {
            text = "MoneyFusion Pay"
            textSize = 22f
            setTextColor(themeColors.textPrimary)
            setPadding(0, 0, 0, 8)
        }
        layout.addView(titleView)

        val subtitleView = TextView(this).apply {
            text = "Paiement Mobile Money Africain"
            textSize = 14f
            setTextColor(themeColors.textSecondary)
            setPadding(0, 0, 0, 32)
        }
        layout.addView(subtitleView)

        // Montant
        val amountLabel = TextView(this).apply {
            text = "Montant (FCFA)"
            textSize = 14f
            setTextColor(themeColors.textPrimary)
        }
        layout.addView(amountLabel)

        val amountInput = EditText(this).apply {
            hint = "Ex: 5000"
            inputType = android.text.InputType.TYPE_CLASS_NUMBER or
                    android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL
            setTextColor(themeColors.textPrimary)
            setHintTextColor(themeColors.textSecondary)
            val prefilledAmount = intent.getDoubleExtra(EXTRA_AMOUNT, 0.0)
            if (prefilledAmount > 0) setText(prefilledAmount.toInt().toString())
            setPadding(0, 8, 0, 24)
        }
        layout.addView(amountInput)

        // Pays
        val countryLabel = TextView(this).apply {
            text = "Pays"
            textSize = 14f
            setTextColor(themeColors.textPrimary)
        }
        layout.addView(countryLabel)

        val countrySpinner = Spinner(this)
        val countries = MoneyFusionService.SUPPORTED_COUNTRIES.entries.toList()
        val countryAdapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            countries.map { "${it.value} (${it.key.uppercase()})" }
        )
        countrySpinner.adapter = countryAdapter
        countrySpinner.setPadding(0, 8, 0, 24)
        layout.addView(countrySpinner)

        // Opérateur
        val operatorLabel = TextView(this).apply {
            text = "Opérateur Mobile Money"
            textSize = 14f
            setTextColor(themeColors.textPrimary)
        }
        layout.addView(operatorLabel)

        val operatorSpinner = Spinner(this)
        var operatorAdapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            MoneyFusionService.MobileOperator.forCountry("ci").map { it.displayName }
        )
        operatorSpinner.adapter = operatorAdapter
        operatorSpinner.setPadding(0, 8, 0, 24)
        layout.addView(operatorSpinner)

        // Mettre à jour les opérateurs quand le pays change
        countrySpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                selectedCountry = countries[position].key
                val operators = MoneyFusionService.MobileOperator.forCountry(selectedCountry)
                operatorAdapter = ArrayAdapter(
                    this@MoneyFusionActivity,
                    android.R.layout.simple_spinner_dropdown_item,
                    operators.map { it.displayName }
                )
                operatorSpinner.adapter = operatorAdapter
                selectedOperator = operators.firstOrNull() ?: MoneyFusionService.MobileOperator.ORANGE_MONEY
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        operatorSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val operators = MoneyFusionService.MobileOperator.forCountry(selectedCountry)
                selectedOperator = operators.getOrElse(position) { MoneyFusionService.MobileOperator.ORANGE_MONEY }
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        // Numéro de téléphone
        val phoneLabel = TextView(this).apply {
            text = "Numéro de téléphone"
            textSize = 14f
            setTextColor(themeColors.textPrimary)
        }
        layout.addView(phoneLabel)

        val phoneInput = EditText(this).apply {
            hint = "Ex: 0701020304"
            inputType = android.text.InputType.TYPE_CLASS_PHONE
            setTextColor(themeColors.textPrimary)
            setHintTextColor(themeColors.textSecondary)
            setPadding(0, 8, 0, 24)
        }
        layout.addView(phoneInput)

        // Nom du client
        val nameLabel = TextView(this).apply {
            text = "Votre nom"
            textSize = 14f
            setTextColor(themeColors.textPrimary)
        }
        layout.addView(nameLabel)

        val nameInput = EditText(this).apply {
            hint = "Ex: Jean Dupont"
            inputType = android.text.InputType.TYPE_CLASS_TEXT or
                    android.text.InputType.TYPE_TEXT_FLAG_CAP_WORDS
            setTextColor(themeColors.textPrimary)
            setHintTextColor(themeColors.textSecondary)
            setPadding(0, 8, 0, 32)
        }
        layout.addView(nameInput)

        // Statut
        val statusView = TextView(this).apply {
            text = ""
            textSize = 14f
            setTextColor(themeColors.textSecondary)
            visibility = View.GONE
        }
        layout.addView(statusView)

        // Bouton de paiement
        val payButton = Button(this).apply {
            text = "Payer maintenant"
            setBackgroundColor(0xFFE65100.toInt()) // Orange EMEFA
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 16f
            setPadding(32, 24, 32, 24)
        }
        layout.addView(payButton)

        // Note sur la configuration
        val noteView = TextView(this).apply {
            text = "\n⚠️ Configurez votre URL API MoneyFusion dans Paramètres → Paiements"
            textSize = 12f
            setTextColor(themeColors.textSecondary)
        }
        layout.addView(noteView)

        // Lien vers MoneyFusion
        val linkView = TextView(this).apply {
            text = "Créer un compte MoneyFusion →"
            textSize = 12f
            setTextColor(0xFF1565C0.toInt())
            setPadding(0, 16, 0, 0)
            setOnClickListener {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://moneyfusion.net")))
            }
        }
        layout.addView(linkView)

        // Action du bouton
        payButton.setOnClickListener {
            val amount = amountInput.text.toString().toDoubleOrNull()
            val phone = phoneInput.text.toString().trim()
            val name = nameInput.text.toString().trim()
            val apiUrl = KVUtils.getString("MONEYFUSION_API_URL", "")

            when {
                amount == null || amount <= 0 -> {
                    Toast.makeText(this, "Veuillez entrer un montant valide", Toast.LENGTH_SHORT).show()
                }
                phone.isEmpty() -> {
                    Toast.makeText(this, "Veuillez entrer votre numéro de téléphone", Toast.LENGTH_SHORT).show()
                }
                name.isEmpty() -> {
                    Toast.makeText(this, "Veuillez entrer votre nom", Toast.LENGTH_SHORT).show()
                }
                apiUrl.isEmpty() -> {
                    Toast.makeText(this,
                        "URL API MoneyFusion non configurée. Allez dans Paramètres → Paiements",
                        Toast.LENGTH_LONG).show()
                }
                else -> {
                    payButton.isEnabled = false
                    payButton.text = "Traitement en cours..."
                    statusView.visibility = View.VISIBLE
                    statusView.text = "Connexion à MoneyFusion..."

                    lifecycleScope.launch {
                        val description = intent.getStringExtra(EXTRA_DESCRIPTION) ?: "Paiement EMEFA"
                        val orderId = intent.getStringExtra(EXTRA_ORDER_ID) ?: System.currentTimeMillis().toString()

                        when (val result = MoneyFusionService.initiatePayment(
                            apiUrl = apiUrl,
                            amount = amount,
                            phoneNumber = phone,
                            clientName = name,
                            description = description,
                            orderId = orderId
                        )) {
                            is MoneyFusionService.PaymentResult.Success -> {
                                val paymentData = result.data
                                statusView.text = "✅ ${paymentData.message}"
                                payButton.text = "Ouvrir la page de paiement"
                                payButton.isEnabled = true
                                payButton.setOnClickListener {
                                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(paymentData.url)))
                                    // Sauvegarder le token pour vérification ultérieure
                                    KVUtils.putString("LAST_PAYMENT_TOKEN", paymentData.token)
                                }
                            }
                            is MoneyFusionService.PaymentResult.Error -> {
                                statusView.text = "❌ ${result.message}"
                                payButton.text = "Réessayer"
                                payButton.isEnabled = true
                            }
                        }
                    }
                }
            }
        }

        scrollView.addView(layout)
        setContentView(scrollView)

        // Toolbar
        supportActionBar?.apply {
            title = "Paiement MoneyFusion"
            setDisplayHomeAsUpEnabled(true)
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
