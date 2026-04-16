// Copyright 2026 EMEFA (progenius.ai). All rights reserved.
// Licensed under the Apache License, Version 2.0.
package ai.progenius.emefa.knowledge

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import ai.progenius.emefa.utils.KVUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

/**
 * Gestionnaire de Base de Connaissance Personnalisée EMEFA
 *
 * Permet à l'utilisateur d'entraîner l'assistante sur son métier/domaine
 * en uploadant des documents (PDF, TXT, DOCX) ou en collant du texte libre.
 *
 * La base de connaissance est injectée dans le system prompt de l'assistante.
 * Pro Genius AI
 */
object KnowledgeBaseManager {

    private const val TAG = "KnowledgeBase"
    private const val KEY_KNOWLEDGE_ENTRIES = "knowledge_entries"
    private const val KEY_USER_PROFILE = "user_profile"
    private const val MAX_KNOWLEDGE_SIZE = 50_000 // 50K caractères max
    private const val KNOWLEDGE_DIR = "knowledge_base"

    private val gson = Gson()

    // ─────────────────────────────────────────────────────────────────────────
    // MODÈLES
    // ─────────────────────────────────────────────────────────────────────────

    data class KnowledgeEntry(
        val id: String,
        val title: String,
        val content: String,
        val source: EntrySource,
        val fileName: String = "",
        val fileSize: Long = 0L,
        val createdAt: Long = System.currentTimeMillis(),
        var isEnabled: Boolean = true
    )

    data class UserProfile(
        val name: String = "",
        val profession: String = "",
        val company: String = "",
        val country: String = "ci",
        val description: String = "",
        val selectedTemplate: String = ""
    )

    enum class EntrySource(val displayName: String, val icon: String) {
        TEXT("Texte libre", "✏️"),
        PDF("Document PDF", "📄"),
        TXT("Fichier texte", "📝"),
        DOCX("Document Word", "📋"),
        TEMPLATE("Modèle prédéfini", "🎯")
    }

    sealed class ImportResult {
        data class Success(val entry: KnowledgeEntry) : ImportResult()
        data class Error(val message: String) : ImportResult()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODÈLES DE PROFILS PRÉDÉFINIS
    // ─────────────────────────────────────────────────────────────────────────

    data class ProfileTemplate(
        val id: String,
        val name: String,
        val icon: String,
        val description: String,
        val defaultKnowledge: String
    )

    val PROFILE_TEMPLATES = listOf(
        ProfileTemplate(
            id = "architect",
            name = "Architecte",
            icon = "🏛️",
            description = "Conception de bâtiments, plans, permis de construire",
            defaultKnowledge = """
                Je suis architecte. Mon travail comprend:
                - La conception et le dessin de plans de bâtiments (résidentiels, commerciaux, industriels)
                - L'élaboration de dossiers de permis de construire
                - Le suivi de chantier et la coordination des corps de métier
                - L'estimation des coûts de construction
                - La conformité aux normes de construction locales
                - Les études de faisabilité et les avant-projets
                
                Mes clients sont principalement des particuliers, des promoteurs immobiliers et des entreprises.
                Je travaille avec des logiciels comme AutoCAD, Revit, SketchUp.
                Je facture en FCFA et je travaille principalement en Afrique de l'Ouest.
            """.trimIndent()
        ),
        ProfileTemplate(
            id = "merchant",
            name = "Commerçant",
            icon = "🏪",
            description = "Vente de produits, gestion de boutique, stock",
            defaultKnowledge = """
                Je suis commerçant. Mon activité comprend:
                - La vente de produits (alimentaires, textiles, électroniques, etc.)
                - La gestion des stocks et des approvisionnements
                - La relation avec les fournisseurs et les clients
                - La tenue de caisse et la comptabilité de base
                - Les paiements Mobile Money (Orange Money, MTN MoMo, Wave)
                - La livraison et la logistique
                
                Je vends en boutique physique et en ligne (WhatsApp, réseaux sociaux).
                Je gère mes finances en FCFA.
            """.trimIndent()
        ),
        ProfileTemplate(
            id = "doctor",
            name = "Médecin / Professionnel de Santé",
            icon = "👨‍⚕️",
            description = "Consultations, prescriptions, gestion de cabinet",
            defaultKnowledge = """
                Je suis professionnel de santé. Mon activité comprend:
                - Les consultations médicales et le diagnostic
                - La prescription de médicaments et d'examens
                - Le suivi des patients
                - La gestion administrative du cabinet (rendez-vous, dossiers patients)
                - La facturation des actes médicaux
                - La coordination avec les laboratoires et les hôpitaux
                
                Je travaille en cabinet privé et/ou en milieu hospitalier.
                Je respecte la confidentialité médicale (secret médical).
            """.trimIndent()
        ),
        ProfileTemplate(
            id = "teacher",
            name = "Enseignant / Formateur",
            icon = "👨‍🏫",
            description = "Cours, formations, préparation de leçons",
            defaultKnowledge = """
                Je suis enseignant/formateur. Mon activité comprend:
                - La préparation et la dispense de cours
                - La création de supports pédagogiques
                - L'évaluation des élèves/apprenants
                - La gestion de classe
                - Le tutorat individuel
                - La formation professionnelle continue
                
                J'enseigne dans le secondaire/supérieur ou je donne des formations professionnelles.
                Je travaille avec des outils numériques (PowerPoint, Google Classroom, Zoom).
            """.trimIndent()
        ),
        ProfileTemplate(
            id = "farmer",
            name = "Agriculteur / Éleveur",
            icon = "👨‍🌾",
            description = "Cultures, élevage, commercialisation des récoltes",
            defaultKnowledge = """
                Je suis agriculteur/éleveur. Mon activité comprend:
                - La culture de produits agricoles (cacao, café, maïs, manioc, igname, légumes)
                - L'élevage (bovins, ovins, caprins, volaille, porcins)
                - La gestion des intrants agricoles (semences, engrais, pesticides)
                - La commercialisation des récoltes
                - La gestion des terres et de l'irrigation
                - L'accès aux financements agricoles
                
                Je travaille en zone rurale en Afrique de l'Ouest.
                Je vends ma production aux marchés locaux, aux grossistes et aux coopératives.
            """.trimIndent()
        ),
        ProfileTemplate(
            id = "developer",
            name = "Développeur / Tech",
            icon = "👨‍💻",
            description = "Développement logiciel, sites web, applications",
            defaultKnowledge = """
                Je suis développeur/professionnel tech. Mon activité comprend:
                - Le développement d'applications web et mobiles
                - La conception de sites internet
                - L'intégration d'APIs et de services tiers
                - La maintenance et le débogage de logiciels
                - Le conseil en transformation digitale
                - La formation en informatique
                
                Je maîtrise plusieurs langages et frameworks (selon ma spécialité).
                Je travaille en freelance et/ou pour des entreprises.
                Je facture en FCFA et parfois en devises étrangères.
            """.trimIndent()
        ),
        ProfileTemplate(
            id = "entrepreneur",
            name = "Entrepreneur / Startup",
            icon = "🚀",
            description = "Gestion d'entreprise, stratégie, développement business",
            defaultKnowledge = """
                Je suis entrepreneur. Mon activité comprend:
                - La gestion et le développement de mon entreprise/startup
                - La stratégie commerciale et marketing
                - La gestion des équipes et des ressources humaines
                - La recherche de financements (investisseurs, banques, subventions)
                - Le développement de nouveaux marchés
                - La gestion financière et comptable
                
                Mon entreprise opère en Afrique et potentiellement à l'international.
                Je cherche à innover et à créer de la valeur pour mes clients africains.
            """.trimIndent()
        ),
        ProfileTemplate(
            id = "lawyer",
            name = "Avocat / Juriste",
            icon = "⚖️",
            description = "Droit des affaires, contrats, contentieux",
            defaultKnowledge = """
                Je suis avocat/juriste. Mon activité comprend:
                - Le conseil juridique aux entreprises et aux particuliers
                - La rédaction et la négociation de contrats
                - La représentation en justice
                - Le droit des affaires (OHADA)
                - Le droit du travail
                - La propriété intellectuelle
                
                Je suis inscrit au barreau et je respecte les règles déontologiques.
                Je travaille principalement en Afrique francophone.
                Je facture mes honoraires en FCFA.
            """.trimIndent()
        )
    )

    // ─────────────────────────────────────────────────────────────────────────
    // GESTION DES ENTRÉES
    // ─────────────────────────────────────────────────────────────────────────

    fun getAllEntries(): List<KnowledgeEntry> {
        val json = KVUtils.getString(KEY_KNOWLEDGE_ENTRIES, "")
        return if (json.isEmpty()) emptyList()
        else try {
            gson.fromJson(json, object : TypeToken<List<KnowledgeEntry>>() {}.type)
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveEntries(entries: List<KnowledgeEntry>) {
        KVUtils.putString(KEY_KNOWLEDGE_ENTRIES, gson.toJson(entries))
    }

    fun addEntry(entry: KnowledgeEntry) {
        val entries = getAllEntries().toMutableList()
        entries.add(entry)
        saveEntries(entries)
    }

    fun removeEntry(entryId: String) {
        val entries = getAllEntries().filter { it.id != entryId }
        saveEntries(entries)
    }

    fun toggleEntry(entryId: String) {
        val entries = getAllEntries().map {
            if (it.id == entryId) it.copy(isEnabled = !it.isEnabled) else it
        }
        saveEntries(entries)
    }

    fun clearAll() {
        KVUtils.putString(KEY_KNOWLEDGE_ENTRIES, "")
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROFIL UTILISATEUR
    // ─────────────────────────────────────────────────────────────────────────

    fun getUserProfile(): UserProfile {
        val json = KVUtils.getString(KEY_USER_PROFILE, "")
        return if (json.isEmpty()) UserProfile()
        else try {
            gson.fromJson(json, UserProfile::class.java)
        } catch (e: Exception) {
            UserProfile()
        }
    }

    fun saveUserProfile(profile: UserProfile) {
        KVUtils.putString(KEY_USER_PROFILE, gson.toJson(profile))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IMPORT DE DOCUMENTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Ajouter une entrée depuis du texte libre
     */
    fun addTextEntry(title: String, content: String): ImportResult {
        if (content.isBlank()) return ImportResult.Error("Le contenu ne peut pas être vide")
        if (title.isBlank()) return ImportResult.Error("Le titre ne peut pas être vide")

        val entry = KnowledgeEntry(
            id = "kb_${System.currentTimeMillis()}",
            title = title,
            content = content.take(MAX_KNOWLEDGE_SIZE),
            source = EntrySource.TEXT
        )
        addEntry(entry)
        return ImportResult.Success(entry)
    }

    /**
     * Ajouter une entrée depuis un modèle prédéfini
     */
    fun addTemplateEntry(templateId: String): ImportResult {
        val template = PROFILE_TEMPLATES.find { it.id == templateId }
            ?: return ImportResult.Error("Modèle introuvable")

        val entry = KnowledgeEntry(
            id = "kb_template_${templateId}_${System.currentTimeMillis()}",
            title = "${template.icon} ${template.name}",
            content = template.defaultKnowledge,
            source = EntrySource.TEMPLATE,
            fileName = template.id
        )
        addEntry(entry)
        return ImportResult.Success(entry)
    }

    /**
     * Importer un fichier (TXT, PDF, DOCX) depuis un URI Android
     */
    suspend fun importFile(context: Context, uri: Uri): ImportResult = withContext(Dispatchers.IO) {
        try {
            val fileName = getFileName(context, uri) ?: "document"
            val extension = fileName.substringAfterLast('.', "").lowercase()

            val content = when (extension) {
                "txt" -> readTextFile(context, uri)
                "pdf" -> readPdfFile(context, uri)
                "docx", "doc" -> readDocxFile(context, uri)
                else -> readTextFile(context, uri) // Essayer comme texte
            }

            if (content.isBlank()) {
                return@withContext ImportResult.Error("Le fichier est vide ou illisible")
            }

            val source = when (extension) {
                "pdf" -> EntrySource.PDF
                "docx", "doc" -> EntrySource.DOCX
                else -> EntrySource.TXT
            }

            val fileSize = getFileSize(context, uri)
            val entry = KnowledgeEntry(
                id = "kb_file_${System.currentTimeMillis()}",
                title = fileName.substringBeforeLast('.'),
                content = content.take(MAX_KNOWLEDGE_SIZE),
                source = source,
                fileName = fileName,
                fileSize = fileSize
            )
            addEntry(entry)
            ImportResult.Success(entry)
        } catch (e: Exception) {
            Log.e(TAG, "Import error", e)
            ImportResult.Error("Erreur d'importation: ${e.message}")
        }
    }

    private fun readTextFile(context: Context, uri: Uri): String {
        return context.contentResolver.openInputStream(uri)?.use { stream ->
            stream.bufferedReader().readText()
        } ?: ""
    }

    private fun readPdfFile(context: Context, uri: Uri): String {
        return try {
            // Copier le PDF en local puis extraire le texte
            val tempFile = File(context.cacheDir, "temp_kb_${System.currentTimeMillis()}.pdf")
            context.contentResolver.openInputStream(uri)?.use { input ->
                FileOutputStream(tempFile).use { output ->
                    input.copyTo(output)
                }
            }

            // Utiliser PdfRenderer ou une bibliothèque PDF
            val text = extractPdfText(tempFile)
            tempFile.delete()
            text
        } catch (e: Exception) {
            Log.e(TAG, "PDF read error", e)
            ""
        }
    }

    private fun extractPdfText(pdfFile: File): String {
        return try {
            // Utiliser android.graphics.pdf.PdfRenderer pour les PDF simples
            val pdfRenderer = android.graphics.pdf.PdfRenderer(
                android.os.ParcelFileDescriptor.open(pdfFile, android.os.ParcelFileDescriptor.MODE_READ_ONLY)
            )
            val sb = StringBuilder()
            // Note: PdfRenderer ne supporte pas l'extraction de texte directement
            // On retourne un message d'indication
            sb.append("[PDF importé: ${pdfFile.name}]\n")
            sb.append("Nombre de pages: ${pdfRenderer.pageCount}\n")
            sb.append("Note: Pour une meilleure extraction, copiez-collez le texte du PDF directement.")
            pdfRenderer.close()
            sb.toString()
        } catch (e: Exception) {
            "[Fichier PDF importé: ${pdfFile.name}]"
        }
    }

    private fun readDocxFile(context: Context, uri: Uri): String {
        return try {
            // Lire le DOCX comme ZIP et extraire word/document.xml
            val tempFile = File(context.cacheDir, "temp_kb_${System.currentTimeMillis()}.docx")
            context.contentResolver.openInputStream(uri)?.use { input ->
                FileOutputStream(tempFile).use { output ->
                    input.copyTo(output)
                }
            }

            val text = extractDocxText(tempFile)
            tempFile.delete()
            text
        } catch (e: Exception) {
            Log.e(TAG, "DOCX read error", e)
            ""
        }
    }

    private fun extractDocxText(docxFile: File): String {
        return try {
            val zip = java.util.zip.ZipFile(docxFile)
            val entry = zip.getEntry("word/document.xml")
                ?: return "[Document Word importé: ${docxFile.name}]"

            val xmlContent = zip.getInputStream(entry).bufferedReader().readText()
            zip.close()

            // Extraire le texte des balises <w:t>
            val regex = Regex("<w:t[^>]*>([^<]*)</w:t>")
            val matches = regex.findAll(xmlContent)
            val text = matches.map { it.groupValues[1] }.joinToString(" ")
            text.ifBlank { "[Document Word importé: ${docxFile.name}]" }
        } catch (e: Exception) {
            "[Document Word importé: ${docxFile.name}]"
        }
    }

    private fun getFileName(context: Context, uri: Uri): String? {
        return context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            cursor.moveToFirst()
            if (nameIndex >= 0) cursor.getString(nameIndex) else null
        }
    }

    private fun getFileSize(context: Context, uri: Uri): Long {
        return context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
            cursor.moveToFirst()
            if (sizeIndex >= 0) cursor.getLong(sizeIndex) else 0L
        } ?: 0L
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INJECTION DANS LE SYSTEM PROMPT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Construit le bloc de base de connaissance à injecter dans le system prompt
     */
    fun buildKnowledgeBlock(): String {
        val profile = getUserProfile()
        val entries = getAllEntries().filter { it.isEnabled }

        if (entries.isEmpty() && profile.name.isEmpty() && profile.profession.isEmpty()) {
            return ""
        }

        val sb = StringBuilder()
        sb.append("\n\n---\n## 📚 BASE DE CONNAISSANCE PERSONNALISÉE\n\n")

        // Profil utilisateur
        if (profile.name.isNotEmpty() || profile.profession.isNotEmpty()) {
            sb.append("### Profil de l'utilisateur\n")
            if (profile.name.isNotEmpty()) sb.append("- **Nom**: ${profile.name}\n")
            if (profile.profession.isNotEmpty()) sb.append("- **Profession**: ${profile.profession}\n")
            if (profile.company.isNotEmpty()) sb.append("- **Entreprise**: ${profile.company}\n")
            if (profile.country.isNotEmpty()) sb.append("- **Pays**: ${profile.country}\n")
            if (profile.description.isNotEmpty()) sb.append("- **Description**: ${profile.description}\n")
            sb.append("\n")
        }

        // Entrées de connaissance
        if (entries.isNotEmpty()) {
            sb.append("### Informations métier\n\n")
            entries.forEach { entry ->
                sb.append("#### ${entry.title}\n")
                sb.append(entry.content)
                sb.append("\n\n")
            }
        }

        sb.append("""
            ---
            **INSTRUCTION IMPORTANTE**: Utilise ces informations pour personnaliser tes réponses.
            Tu connais maintenant le contexte professionnel de l'utilisateur.
            Adapte tes conseils, suggestions et réponses à son métier et à sa situation spécifique.
        """.trimIndent())

        return sb.toString()
    }

    /**
     * Taille totale de la base de connaissance en caractères
     */
    fun getTotalSize(): Int {
        return getAllEntries().filter { it.isEnabled }.sumOf { it.content.length }
    }

    /**
     * Vérifie si la base de connaissance est configurée
     */
    fun hasKnowledge(): Boolean {
        val profile = getUserProfile()
        val entries = getAllEntries()
        return entries.isNotEmpty() || profile.profession.isNotEmpty()
    }
}
