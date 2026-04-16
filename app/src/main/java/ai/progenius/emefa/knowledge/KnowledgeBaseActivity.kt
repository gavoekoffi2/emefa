// Copyright 2026 EMEFA (progenius.ai). All rights reserved.
// Licensed under the Apache License, Version 2.0.
package ai.progenius.emefa.knowledge

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.*
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.lifecycleScope
import ai.progenius.emefa.base.BaseActivity
import ai.progenius.emefa.ui.chat.ThemeManager
import kotlinx.coroutines.launch

/**
 * Écran de Base de Connaissance Personnalisée EMEFA
 *
 * Permet à l'utilisateur de:
 * 1. Définir son profil professionnel
 * 2. Choisir un modèle prédéfini (architecte, commerçant, médecin...)
 * 3. Uploader des documents (PDF, TXT, DOCX)
 * 4. Coller du texte libre décrivant son activité
 *
 * Pro Genius AI
 */
class KnowledgeBaseActivity : BaseActivity() {

    companion object {
        fun start(context: Context) {
            context.startActivity(Intent(context, KnowledgeBaseActivity::class.java))
        }
    }

    private lateinit var entriesContainer: LinearLayout
    private lateinit var statusText: TextView
    private lateinit var sizeText: TextView

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { importFile(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val themeColors = ThemeManager.getColors()
        window.statusBarColor = themeColors.toolbarBg

        val scrollView = ScrollView(this).apply {
            setBackgroundColor(themeColors.bg)
        }

        val mainLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, 0, 0, 64)
        }

        // ── HEADER ──────────────────────────────────────────────────────────
        val headerLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(themeColors.toolbarBg)
            setPadding(48, 48, 48, 32)
        }
        headerLayout.addView(TextView(this).apply {
            text = "📚 Base de Connaissance"
            textSize = 22f
            setTextColor(themeColors.aiText)
        })
        headerLayout.addView(TextView(this).apply {
            text = "Entraînez EMEFA sur votre métier"
            textSize = 14f
            setTextColor(themeColors.aiText)
            alpha = 0.7f
            setPadding(0, 8, 0, 0)
        })

        sizeText = TextView(this).apply {
            textSize = 12f
            setTextColor(themeColors.toolOk)
            setPadding(0, 8, 0, 0)
        }
        headerLayout.addView(sizeText)
        mainLayout.addView(headerLayout)

        updateSizeText()

        // ── PROFIL UTILISATEUR ───────────────────────────────────────────────
        mainLayout.addView(buildSectionHeader("👤 Mon Profil", themeColors))
        mainLayout.addView(buildProfileSection(themeColors))

        // ── MODÈLES PRÉDÉFINIS ───────────────────────────────────────────────
        mainLayout.addView(buildSectionHeader("🎯 Modèles Prédéfinis", themeColors))
        mainLayout.addView(buildTemplatesSection(themeColors))

        // ── AJOUTER DU TEXTE ─────────────────────────────────────────────────
        mainLayout.addView(buildSectionHeader("✏️ Ajouter du Texte", themeColors))
        mainLayout.addView(buildTextInputSection(themeColors))

        // ── IMPORTER UN DOCUMENT ─────────────────────────────────────────────
        mainLayout.addView(buildSectionHeader("📁 Importer un Document", themeColors))
        mainLayout.addView(buildImportSection(themeColors))

        // ── BASE DE CONNAISSANCE ACTUELLE ────────────────────────────────────
        mainLayout.addView(buildSectionHeader("📋 Ma Base de Connaissance", themeColors))

        entriesContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 0, 24, 0)
        }
        mainLayout.addView(entriesContainer)
        refreshEntriesList(themeColors)

        // Statut
        statusText = TextView(this).apply {
            text = ""
            textSize = 13f
            setTextColor(themeColors.toolOk)
            setPadding(48, 16, 48, 0)
            visibility = View.GONE
        }
        mainLayout.addView(statusText)

        scrollView.addView(mainLayout)
        setContentView(scrollView)

        supportActionBar?.apply {
            title = "Base de Connaissance"
            setDisplayHomeAsUpEnabled(true)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTIONS UI
    // ─────────────────────────────────────────────────────────────────────────

    private fun buildSectionHeader(title: String, themeColors: ThemeManager.ChatColors): View {
        return TextView(this).apply {
            text = title
            textSize = 16f
            setTextColor(themeColors.aiText)
            setBackgroundColor(themeColors.toolbarBg)
            setPadding(48, 24, 48, 16)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }
    }

    private fun buildProfileSection(themeColors: ThemeManager.ChatColors): View {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 16, 48, 16)
        }

        val profile = KnowledgeBaseManager.getUserProfile()

        val nameInput = EditText(this).apply {
            hint = "Votre nom"
            setText(profile.name)
            setTextColor(themeColors.aiText)
            setHintTextColor(themeColors.aiText.and(0x80FFFFFF.toInt()))
            setPadding(0, 8, 0, 8)
        }
        layout.addView(nameInput)

        val professionInput = EditText(this).apply {
            hint = "Votre profession (ex: Architecte, Médecin, Commerçant...)"
            setText(profile.profession)
            setTextColor(themeColors.aiText)
            setHintTextColor(themeColors.aiText.and(0x80FFFFFF.toInt()))
            setPadding(0, 8, 0, 8)
        }
        layout.addView(professionInput)

        val companyInput = EditText(this).apply {
            hint = "Votre entreprise/cabinet (optionnel)"
            setText(profile.company)
            setTextColor(themeColors.aiText)
            setHintTextColor(themeColors.aiText.and(0x80FFFFFF.toInt()))
            setPadding(0, 8, 0, 8)
        }
        layout.addView(companyInput)

        val descInput = EditText(this).apply {
            hint = "Description courte de votre activité"
            setText(profile.description)
            setTextColor(themeColors.aiText)
            setHintTextColor(themeColors.aiText.and(0x80FFFFFF.toInt()))
            minLines = 2
            setPadding(0, 8, 0, 16)
        }
        layout.addView(descInput)

        val saveBtn = Button(this).apply {
            text = "💾 Sauvegarder le profil"
            setBackgroundColor(0xFF1565C0.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener {
                val updatedProfile = KnowledgeBaseManager.UserProfile(
                    name = nameInput.text.toString().trim(),
                    profession = professionInput.text.toString().trim(),
                    company = companyInput.text.toString().trim(),
                    description = descInput.text.toString().trim()
                )
                KnowledgeBaseManager.saveUserProfile(updatedProfile)
                showStatus("✅ Profil sauvegardé !")
                updateSizeText()
            }
        }
        layout.addView(saveBtn)

        return layout
    }

    private fun buildTemplatesSection(themeColors: ThemeManager.ChatColors): View {
        val scrollH = HorizontalScrollView(this).apply {
            setPadding(24, 8, 24, 8)
        }
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
        }

        KnowledgeBaseManager.PROFILE_TEMPLATES.forEach { template ->
            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setBackgroundColor(themeColors.aiBubble)
                setPadding(24, 24, 24, 24)
                val params = LinearLayout.LayoutParams(280, ViewGroup.LayoutParams.WRAP_CONTENT)
                params.setMargins(8, 8, 8, 8)
                layoutParams = params
            }

            card.addView(TextView(this).apply {
                text = template.icon
                textSize = 32f
                gravity = Gravity.CENTER
            })
            card.addView(TextView(this).apply {
                text = template.name
                textSize = 13f
                setTextColor(themeColors.aiText)
                gravity = Gravity.CENTER
                setPadding(0, 8, 0, 4)
            })
            card.addView(TextView(this).apply {
                text = template.description
                textSize = 10f
                setTextColor(themeColors.aiText)
                alpha = 0.7f
                gravity = Gravity.CENTER
            })

            val addBtn = Button(this).apply {
                text = "Utiliser"
                textSize = 11f
                setBackgroundColor(0xFFE65100.toInt())
                setTextColor(0xFFFFFFFF.toInt())
                val params = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
                params.topMargin = 12
                layoutParams = params
                setOnClickListener {
                    when (val result = KnowledgeBaseManager.addTemplateEntry(template.id)) {
                        is KnowledgeBaseManager.ImportResult.Success -> {
                            showStatus("✅ Modèle '${template.name}' ajouté !")
                            refreshEntriesList(themeColors)
                            updateSizeText()
                        }
                        is KnowledgeBaseManager.ImportResult.Error -> {
                            showStatus("❌ ${result.message}")
                        }
                    }
                }
            }
            card.addView(addBtn)
            row.addView(card)
        }

        scrollH.addView(row)
        return scrollH
    }

    private fun buildTextInputSection(themeColors: ThemeManager.ChatColors): View {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 16, 48, 16)
        }

        val titleInput = EditText(this).apply {
            hint = "Titre (ex: Mes produits, Mes services, Mon entreprise...)"
            setTextColor(themeColors.aiText)
            setHintTextColor(themeColors.aiText.and(0x80FFFFFF.toInt()))
            setPadding(0, 8, 0, 8)
        }
        layout.addView(titleInput)

        val contentInput = EditText(this).apply {
            hint = """Décrivez votre activité en détail...

Exemples:
- Je vends des vêtements importés de Chine et de Turquie
- Mes produits phares sont: robes, pantalons, chemises
- Je livre dans tout Abidjan via moto-taxi
- Mon numéro WhatsApp: 07 XX XX XX XX
- Je travaille du lundi au samedi de 8h à 18h"""
            setTextColor(themeColors.aiText)
            setHintTextColor(themeColors.aiText.and(0x80FFFFFF.toInt()))
            minLines = 6
            gravity = Gravity.TOP
            setPadding(0, 8, 0, 16)
        }
        layout.addView(contentInput)

        val addBtn = Button(this).apply {
            text = "➕ Ajouter à la base de connaissance"
            setBackgroundColor(0xFF2E7D32.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener {
                val title = titleInput.text.toString().trim()
                val content = contentInput.text.toString().trim()
                when (val result = KnowledgeBaseManager.addTextEntry(title, content)) {
                    is KnowledgeBaseManager.ImportResult.Success -> {
                        showStatus("✅ Ajouté: '${result.entry.title}'")
                        titleInput.text.clear()
                        contentInput.text.clear()
                        refreshEntriesList(themeColors)
                        updateSizeText()
                    }
                    is KnowledgeBaseManager.ImportResult.Error -> {
                        showStatus("❌ ${result.message}")
                    }
                }
            }
        }
        layout.addView(addBtn)

        return layout
    }

    private fun buildImportSection(themeColors: ThemeManager.ChatColors): View {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 16, 48, 24)
        }

        layout.addView(TextView(this).apply {
            text = "Formats supportés: PDF, TXT, DOCX, DOC"
            textSize = 12f
            setTextColor(themeColors.aiText)
            alpha = 0.7f
            setPadding(0, 0, 0, 12)
        })

        val importBtn = Button(this).apply {
            text = "📁 Choisir un fichier"
            setBackgroundColor(0xFF6A1B9A.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener {
                filePickerLauncher.launch("*/*")
            }
        }
        layout.addView(importBtn)

        layout.addView(TextView(this).apply {
            text = "💡 Conseil: Pour les PDF, copiez-collez le texte directement pour de meilleurs résultats."
            textSize = 11f
            setTextColor(themeColors.aiText)
            alpha = 0.6f
            setPadding(0, 12, 0, 0)
        })

        return layout
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LISTE DES ENTRÉES
    // ─────────────────────────────────────────────────────────────────────────

    private fun refreshEntriesList(themeColors: ThemeManager.ChatColors) {
        entriesContainer.removeAllViews()
        val entries = KnowledgeBaseManager.getAllEntries()

        if (entries.isEmpty()) {
            entriesContainer.addView(TextView(this).apply {
                text = "Aucune entrée. Ajoutez du texte ou importez un document ci-dessus."
                textSize = 13f
                setTextColor(themeColors.aiText)
                alpha = 0.6f
                setPadding(24, 16, 24, 16)
            })
            return
        }

        entries.forEach { entry ->
            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setBackgroundColor(if (entry.isEnabled) themeColors.aiBubble else themeColors.toolbarBg)
                setPadding(24, 16, 24, 16)
                val params = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                params.setMargins(0, 4, 0, 4)
                layoutParams = params
            }

            val headerRow = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
            }

            val titleText = TextView(this).apply {
                text = "${entry.source.icon} ${entry.title}"
                textSize = 14f
                setTextColor(themeColors.aiText)
                if (!entry.isEnabled) alpha = 0.4f
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            headerRow.addView(titleText)

            val toggleBtn = TextView(this).apply {
                text = if (entry.isEnabled) "✅" else "⬜"
                textSize = 18f
                setPadding(16, 0, 8, 0)
                setOnClickListener {
                    KnowledgeBaseManager.toggleEntry(entry.id)
                    refreshEntriesList(themeColors)
                    updateSizeText()
                }
            }
            headerRow.addView(toggleBtn)

            val deleteBtn = TextView(this).apply {
                text = "🗑️"
                textSize = 18f
                setPadding(8, 0, 0, 0)
                setOnClickListener {
                    KnowledgeBaseManager.removeEntry(entry.id)
                    showStatus("🗑️ '${entry.title}' supprimé")
                    refreshEntriesList(themeColors)
                    updateSizeText()
                }
            }
            headerRow.addView(deleteBtn)
            card.addView(headerRow)

            val previewText = entry.content.take(100) + if (entry.content.length > 100) "..." else ""
            card.addView(TextView(this).apply {
                text = previewText
                textSize = 11f
                setTextColor(themeColors.aiText)
                alpha = 0.6f
                setPadding(0, 4, 0, 0)
            })

            val metaText = "${entry.source.displayName} • ${entry.content.length} caractères"
            card.addView(TextView(this).apply {
                text = metaText
                textSize = 10f
                setTextColor(themeColors.toolOk)
                setPadding(0, 4, 0, 0)
            })

            entriesContainer.addView(card)
        }

        // Bouton tout effacer
        if (entries.isNotEmpty()) {
            entriesContainer.addView(Button(this).apply {
                text = "🗑️ Tout effacer"
                setBackgroundColor(0xFFB71C1C.toInt())
                setTextColor(0xFFFFFFFF.toInt())
                val params = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                params.topMargin = 16
                layoutParams = params
                setOnClickListener {
                    KnowledgeBaseManager.clearAll()
                    showStatus("🗑️ Base de connaissance effacée")
                    refreshEntriesList(themeColors)
                    updateSizeText()
                }
            })
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITAIRES
    // ─────────────────────────────────────────────────────────────────────────

    private fun importFile(uri: Uri) {
        val themeColors = ThemeManager.getColors()
        showStatus("⏳ Importation en cours...")
        lifecycleScope.launch {
            when (val result = KnowledgeBaseManager.importFile(this@KnowledgeBaseActivity, uri)) {
                is KnowledgeBaseManager.ImportResult.Success -> {
                    showStatus("✅ Importé: '${result.entry.title}' (${result.entry.content.length} caractères)")
                    refreshEntriesList(themeColors)
                    updateSizeText()
                }
                is KnowledgeBaseManager.ImportResult.Error -> {
                    showStatus("❌ ${result.message}")
                }
            }
        }
    }

    private fun showStatus(message: String) {
        statusText.text = message
        statusText.visibility = View.VISIBLE
    }

    private fun updateSizeText() {
        val size = KnowledgeBaseManager.getTotalSize()
        val entries = KnowledgeBaseManager.getAllEntries().size
        sizeText.text = "$entries entrée(s) • $size / 50 000 caractères utilisés"
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
