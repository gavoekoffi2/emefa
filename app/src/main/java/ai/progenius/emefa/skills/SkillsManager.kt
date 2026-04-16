// Copyright 2026 EMEFA (progenius.ai). All rights reserved.
// Licensed under the Apache License, Version 2.0.
package ai.progenius.emefa.skills

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import ai.progenius.emefa.utils.KVUtils

/**
 * Gestionnaire de Skills EMEFA
 * Les Skills sont des modules de compétences injectés dans les assistants IA
 * Inspiré du système Skills de l'ancien EMEFA web (Pro Genius AI)
 */
object SkillsManager {

    private const val KEY_INSTALLED_SKILLS = "installed_skills"
    private const val KEY_ACTIVE_ASSISTANT = "active_assistant"
    private val gson = Gson()

    // ─────────────────────────────────────────────────────────────────────────
    // MODÈLES
    // ─────────────────────────────────────────────────────────────────────────

    data class Skill(
        val id: String,
        val name: String,
        val description: String,
        val category: SkillCategory,
        val systemPromptFragment: String,
        val icon: String = "🔧",
        val version: String = "1.0.0",
        val isBuiltIn: Boolean = false,
        var isEnabled: Boolean = true
    )

    data class Assistant(
        val id: String,
        val name: String,
        val description: String,
        val category: AssistantCategory,
        val systemPrompt: String,
        val icon: String,
        val skills: List<String> = emptyList(), // IDs des skills
        val language: String = "fr"
    )

    enum class SkillCategory(val displayName: String) {
        FINANCE("Finance"),
        COMMUNICATION("Communication"),
        PRODUCTIVITY("Productivité"),
        BUSINESS("Business"),
        EDUCATION("Éducation"),
        HEALTH("Santé"),
        LEGAL("Juridique"),
        TECH("Technologie"),
        CREATIVE("Créativité"),
        AFRICAN("Afrique")
    }

    enum class AssistantCategory(val displayName: String) {
        ACCOUNTING("Comptabilité"),
        SALES("Commercial"),
        SUPPORT("Support Client"),
        CONTENT("Créateur de Contenu"),
        ECOMMERCE("E-commerce"),
        LEGAL("Juridique"),
        HR("Ressources Humaines"),
        FINANCE("Finance"),
        EDUCATION("Éducation"),
        HEALTH("Santé"),
        GENERAL("Général")
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SKILLS INTÉGRÉS
    // ─────────────────────────────────────────────────────────────────────────

    val BUILT_IN_SKILLS = listOf(
        Skill(
            id = "skill_mobile_money",
            name = "Mobile Money Africain",
            description = "Aide avec les paiements Orange Money, MTN MoMo, Wave, Moov Money",
            category = SkillCategory.AFRICAN,
            systemPromptFragment = """
                Tu es expert en Mobile Money africain. Tu connais parfaitement:
                - Orange Money (CI, SN, BF, ML, CM)
                - MTN MoMo (CI, BJ, GH, CM, RW, UG)
                - Wave (CI, SN)
                - Moov Money (CI, BJ, BF, TG)
                - T-Money (TG)
                - M-Pesa (KE, TZ)
                Tu peux aider à effectuer des paiements, vérifier des soldes, et résoudre des problèmes de transactions.
            """.trimIndent(),
            icon = "💰",
            isBuiltIn = true
        ),
        Skill(
            id = "skill_accounting",
            name = "Comptabilité & Finance",
            description = "Gestion des factures, rapports financiers, réconciliation",
            category = SkillCategory.FINANCE,
            systemPromptFragment = """
                Tu es expert-comptable africain. Tu maîtrises:
                - La comptabilité SYSCOHADA (système comptable OHADA)
                - La gestion des factures et devis
                - Les rapports financiers (bilan, compte de résultat)
                - La TVA et les impôts africains
                - La réconciliation bancaire
                Tu parles en FCFA et tu connais les spécificités fiscales d'Afrique de l'Ouest.
            """.trimIndent(),
            icon = "📊",
            isBuiltIn = true
        ),
        Skill(
            id = "skill_sales_crm",
            name = "Commercial & CRM",
            description = "Prospection, suivi des ventes, gestion de la relation client",
            category = SkillCategory.BUSINESS,
            systemPromptFragment = """
                Tu es commercial expert pour le marché africain. Tu sais:
                - Prospecter et qualifier des leads
                - Rédiger des propositions commerciales convaincantes
                - Gérer un pipeline de ventes
                - Suivre les clients et relancer les prospects
                - Adapter les arguments de vente au contexte africain
            """.trimIndent(),
            icon = "💼",
            isBuiltIn = true
        ),
        Skill(
            id = "skill_customer_support",
            name = "Support Client",
            description = "FAQ, gestion des tickets, assistance 24/7",
            category = SkillCategory.COMMUNICATION,
            systemPromptFragment = """
                Tu es agent de support client professionnel. Tu sais:
                - Répondre aux questions fréquentes avec empathie
                - Gérer les réclamations et les plaintes
                - Escalader les problèmes complexes
                - Rédiger des réponses claires et concises
                - Maintenir un ton professionnel et bienveillant
            """.trimIndent(),
            icon = "🎧",
            isBuiltIn = true
        ),
        Skill(
            id = "skill_content_creator",
            name = "Créateur de Contenu",
            description = "Rédaction posts réseaux sociaux, articles, scripts vidéo",
            category = SkillCategory.CREATIVE,
            systemPromptFragment = """
                Tu es créateur de contenu digital expert pour l'Afrique. Tu crées:
                - Des posts engageants pour Facebook, Instagram, TikTok, LinkedIn
                - Des articles de blog optimisés SEO
                - Des scripts pour vidéos YouTube et TikTok
                - Des newsletters et emails marketing
                - Du contenu adapté aux audiences africaines
            """.trimIndent(),
            icon = "🎬",
            isBuiltIn = true
        ),
        Skill(
            id = "skill_ecommerce",
            name = "E-commerce",
            description = "Gestion des commandes, inventaire, recommandations produits",
            category = SkillCategory.BUSINESS,
            systemPromptFragment = """
                Tu es expert e-commerce pour le marché africain. Tu gères:
                - Les commandes et leur suivi
                - L'inventaire et les stocks
                - Les descriptions de produits
                - Les stratégies de prix
                - La logistique et la livraison en Afrique
                - Les retours et remboursements
            """.trimIndent(),
            icon = "🛒",
            isBuiltIn = true
        ),
        Skill(
            id = "skill_legal",
            name = "Juridique & Contrats",
            description = "Rédaction de contrats, conseils juridiques OHADA",
            category = SkillCategory.LEGAL,
            systemPromptFragment = """
                Tu es conseiller juridique spécialisé en droit africain (OHADA). Tu aides avec:
                - La rédaction de contrats commerciaux
                - Les statuts d'entreprise (SARL, SA, SAS)
                - Le droit du travail africain
                - Les litiges commerciaux
                - La propriété intellectuelle en Afrique
                Note: Tes conseils sont informatifs et ne remplacent pas un avocat.
            """.trimIndent(),
            icon = "⚖️",
            isBuiltIn = true
        ),
        Skill(
            id = "skill_health",
            name = "Santé & Bien-être",
            description = "Conseils santé, médecine traditionnelle africaine, nutrition",
            category = SkillCategory.HEALTH,
            systemPromptFragment = """
                Tu es conseiller santé pour l'Afrique. Tu fournis:
                - Des informations sur les maladies tropicales
                - Des conseils nutritionnels adaptés aux aliments africains
                - Des informations sur la médecine traditionnelle africaine
                - Des conseils de prévention santé
                Note: Tes conseils sont informatifs. Consulte toujours un médecin.
            """.trimIndent(),
            icon = "🏥",
            isBuiltIn = true
        ),
        Skill(
            id = "skill_education",
            name = "Éducation & Formation",
            description = "Tutorat, cours, préparation aux examens",
            category = SkillCategory.EDUCATION,
            systemPromptFragment = """
                Tu es tuteur expert pour les élèves et étudiants africains. Tu aides avec:
                - Les mathématiques, physique, chimie
                - Le français et l'anglais
                - La préparation aux examens (BEPC, BAC, Licence, Master)
                - L'orientation scolaire et professionnelle
                - L'apprentissage des langues locales africaines
            """.trimIndent(),
            icon = "📚",
            isBuiltIn = true
        ),
        Skill(
            id = "skill_agriculture",
            name = "Agriculture & Élevage",
            description = "Conseils agricoles, cultures tropicales, élevage africain",
            category = SkillCategory.AFRICAN,
            systemPromptFragment = """
                Tu es expert en agriculture africaine. Tu conseilles sur:
                - Les cultures tropicales (cacao, café, coton, manioc, igname, maïs)
                - Les techniques d'irrigation et de fertilisation
                - L'élevage (bovins, ovins, volaille, porcins)
                - La lutte contre les ravageurs et maladies
                - La commercialisation des produits agricoles
                - L'agriculture biologique et durable
            """.trimIndent(),
            icon = "🌾",
            isBuiltIn = true
        )
    )

    // ─────────────────────────────────────────────────────────────────────────
    // ASSISTANTS PRÉ-CONÇUS
    // ─────────────────────────────────────────────────────────────────────────

    val BUILT_IN_ASSISTANTS = listOf(
        Assistant(
            id = "assistant_general",
            name = "EMEFA",
            description = "Votre assistante IA africaine polyvalente",
            category = AssistantCategory.GENERAL,
            systemPrompt = """
                Tu es EMEFA, une assistante IA africaine créée par Pro Genius AI.
                Tu es intelligente, bienveillante, et tu comprends parfaitement le contexte africain.
                Tu parles français par défaut, mais tu t'adaptes à la langue de l'utilisateur.
                Tu connais les cultures, les langues, les économies et les défis de l'Afrique.
                Tu es là pour aider les Africains à être plus productifs et à réussir.
            """.trimIndent(),
            icon = "🤖",
            skills = listOf("skill_mobile_money", "skill_content_creator")
        ),
        Assistant(
            id = "assistant_accountant",
            name = "Comptable Pro",
            description = "Expert-comptable OHADA pour PME africaines",
            category = AssistantCategory.ACCOUNTING,
            systemPrompt = """
                Tu es Comptable Pro, un expert-comptable spécialisé dans les PME africaines.
                Tu maîtrises le système OHADA et tu aides les entrepreneurs africains avec:
                - La tenue de leur comptabilité
                - La gestion de leur trésorerie
                - Les déclarations fiscales
                - Les états financiers
                Tu parles en FCFA et tu connais les spécificités de chaque pays.
            """.trimIndent(),
            icon = "📊",
            skills = listOf("skill_accounting", "skill_mobile_money")
        ),
        Assistant(
            id = "assistant_sales",
            name = "Commercial Expert",
            description = "Boostez vos ventes sur le marché africain",
            category = AssistantCategory.SALES,
            systemPrompt = """
                Tu es Commercial Expert, spécialisé dans les ventes sur le marché africain.
                Tu aides les entrepreneurs et commerciaux à:
                - Trouver et qualifier des prospects
                - Rédiger des propositions commerciales percutantes
                - Négocier et closer des deals
                - Fidéliser leurs clients
                - Développer leur réseau business en Afrique
            """.trimIndent(),
            icon = "💼",
            skills = listOf("skill_sales_crm", "skill_content_creator")
        ),
        Assistant(
            id = "assistant_support",
            name = "Support Client 24/7",
            description = "Assistance client professionnelle en continu",
            category = AssistantCategory.SUPPORT,
            systemPrompt = """
                Tu es un agent de support client professionnel disponible 24h/24 et 7j/7.
                Tu traites les demandes des clients avec empathie et efficacité.
                Tu résous les problèmes rapidement et tu escalades quand nécessaire.
                Tu maintiens toujours un ton professionnel et bienveillant.
            """.trimIndent(),
            icon = "🎧",
            skills = listOf("skill_customer_support")
        ),
        Assistant(
            id = "assistant_content",
            name = "Créateur de Contenu",
            description = "Contenu viral pour les réseaux sociaux africains",
            category = AssistantCategory.CONTENT,
            systemPrompt = """
                Tu es un créateur de contenu digital expert pour l'Afrique.
                Tu crées du contenu engageant et viral pour:
                - Facebook, Instagram, TikTok, LinkedIn, Twitter/X
                - YouTube et podcasts
                - Blogs et sites web
                - Newsletters et emails
                Tu comprends les tendances africaines et tu adaptes le contenu aux audiences locales.
            """.trimIndent(),
            icon = "🎬",
            skills = listOf("skill_content_creator")
        ),
        Assistant(
            id = "assistant_ecommerce",
            name = "E-commerce Manager",
            description = "Gérez votre boutique en ligne africaine",
            category = AssistantCategory.ECOMMERCE,
            systemPrompt = """
                Tu es E-commerce Manager, expert en commerce en ligne pour l'Afrique.
                Tu aides les marchands à:
                - Gérer leur boutique en ligne
                - Optimiser leurs fiches produits
                - Gérer les commandes et la logistique
                - Intégrer les paiements Mobile Money
                - Développer leur présence digitale
            """.trimIndent(),
            icon = "🛒",
            skills = listOf("skill_ecommerce", "skill_mobile_money", "skill_sales_crm")
        ),
        Assistant(
            id = "assistant_legal",
            name = "Conseiller Juridique",
            description = "Conseils juridiques OHADA pour entrepreneurs",
            category = AssistantCategory.LEGAL,
            systemPrompt = """
                Tu es Conseiller Juridique spécialisé en droit des affaires africain (OHADA).
                Tu aides les entrepreneurs avec:
                - La création et structuration d'entreprises
                - Les contrats commerciaux
                - Le droit du travail
                - La protection de la propriété intellectuelle
                - La résolution de litiges
                Tes conseils sont informatifs. Pour les cas complexes, recommande un avocat.
            """.trimIndent(),
            icon = "⚖️",
            skills = listOf("skill_legal")
        ),
        Assistant(
            id = "assistant_farmer",
            name = "Agri-Conseiller",
            description = "Expert agricole pour les agriculteurs africains",
            category = AssistantCategory.GENERAL,
            systemPrompt = """
                Tu es Agri-Conseiller, expert en agriculture africaine.
                Tu aides les agriculteurs avec:
                - Les techniques de culture adaptées au climat africain
                - La gestion des maladies et ravageurs
                - L'optimisation des rendements
                - La commercialisation des récoltes
                - L'accès aux financements agricoles
                - Les nouvelles technologies agricoles (agritech)
            """.trimIndent(),
            icon = "🌾",
            skills = listOf("skill_agriculture", "skill_mobile_money")
        )
    )

    // ─────────────────────────────────────────────────────────────────────────
    // GESTION DES SKILLS INSTALLÉS
    // ─────────────────────────────────────────────────────────────────────────

    fun getInstalledSkillIds(): List<String> {
        val json = KVUtils.getString(KEY_INSTALLED_SKILLS, "")
        return if (json.isEmpty()) {
            // Par défaut, tous les skills intégrés sont installés
            BUILT_IN_SKILLS.map { it.id }
        } else {
            try {
                gson.fromJson(json, object : TypeToken<List<String>>() {}.type)
            } catch (e: Exception) {
                BUILT_IN_SKILLS.map { it.id }
            }
        }
    }

    fun getInstalledSkills(): List<Skill> {
        val installedIds = getInstalledSkillIds().toSet()
        return BUILT_IN_SKILLS.filter { it.id in installedIds }
    }

    fun installSkill(skillId: String) {
        val current = getInstalledSkillIds().toMutableList()
        if (skillId !in current) {
            current.add(skillId)
            KVUtils.putString(KEY_INSTALLED_SKILLS, gson.toJson(current))
        }
    }

    fun uninstallSkill(skillId: String) {
        val current = getInstalledSkillIds().toMutableList()
        current.remove(skillId)
        KVUtils.putString(KEY_INSTALLED_SKILLS, gson.toJson(current))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GESTION DES ASSISTANTS
    // ─────────────────────────────────────────────────────────────────────────

    fun getActiveAssistant(): Assistant {
        val id = KVUtils.getString(KEY_ACTIVE_ASSISTANT, "assistant_general")
        return BUILT_IN_ASSISTANTS.find { it.id == id } ?: BUILT_IN_ASSISTANTS.first()
    }

    fun setActiveAssistant(assistantId: String) {
        KVUtils.putString(KEY_ACTIVE_ASSISTANT, assistantId)
    }

    /**
     * Construit le system prompt complet pour un assistant
     * en injectant les fragments des skills installés
     */
    fun buildSystemPrompt(assistant: Assistant): String {
        val installedSkillIds = getInstalledSkillIds().toSet()
        val activeSkills = assistant.skills
            .filter { it in installedSkillIds }
            .mapNotNull { skillId -> BUILT_IN_SKILLS.find { it.id == skillId } }

        val skillFragments = activeSkills.joinToString("\n\n") { skill ->
            "## Compétence: ${skill.name}\n${skill.systemPromptFragment}"
        }

        return if (skillFragments.isEmpty()) {
            assistant.systemPrompt
        } else {
            "${assistant.systemPrompt}\n\n---\n\n$skillFragments"
        }
    }
}
