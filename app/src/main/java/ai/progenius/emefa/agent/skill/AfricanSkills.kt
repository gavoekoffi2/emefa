// Copyright 2026 EMEFA (progenius.ai). All rights reserved.
// Licensed under the Apache License, Version 2.0.
package ai.progenius.emefa.agent.skill

/**
 * EMEFA African Skills - Pro Genius AI
 * Compétences spécialisées pour le marché africain
 * Intégrations : Mobile Money, Wave, WhatsApp Business, Orange Money, MTN MoMo
 */

/**
 * Skill de paiement Mobile Money africain
 * Supporte : Wave, Orange Money, MTN MoMo, Moov Money, Airtel Money
 */
val SKILL_AFRICAN_PAYMENTS = """
name: african_payments
description: Effectue des paiements et transferts via les services de Mobile Money africains (Wave, Orange Money, MTN MoMo, Moov Money, Airtel Money). Peut envoyer de l'argent, vérifier le solde, et consulter l'historique des transactions.
examples:
  - "Envoie 5000 FCFA à Jean via Wave"
  - "Quel est mon solde Orange Money ?"
  - "Transfère 10000 FCFA sur MTN MoMo au +228 90 00 00 00"
  - "Montre-moi mes 5 dernières transactions Wave"
  - "Paye ma facture CEB via Mobile Money"
steps:
  1. Ouvrir l'application de paiement correspondante (Wave, Orange Money, etc.)
  2. Naviguer vers la section de transfert ou paiement
  3. Saisir le numéro du destinataire et le montant
  4. Confirmer la transaction avec le code PIN si nécessaire
  5. Vérifier la confirmation de la transaction
""".trimIndent()

/**
 * Skill WhatsApp Business pour les entrepreneurs africains
 */
val SKILL_WHATSAPP_BUSINESS = """
name: whatsapp_business
description: Gère les communications WhatsApp Business pour les entrepreneurs africains. Peut envoyer des messages, créer des catalogues produits, répondre aux clients, et gérer les commandes.
examples:
  - "Envoie le catalogue de produits à mes clients WhatsApp"
  - "Réponds à tous les messages WhatsApp non lus"
  - "Crée un message promotionnel pour mon business"
  - "Envoie la confirmation de commande à +228 90 12 34 56"
  - "Montre-moi les messages WhatsApp en attente"
steps:
  1. Ouvrir WhatsApp Business
  2. Naviguer vers les conversations ou le catalogue
  3. Effectuer l'action demandée (envoyer, répondre, créer)
  4. Confirmer l'envoi
""".trimIndent()

/**
 * Skill de traduction africaine
 * Supporte : Français, Anglais, Ewe, Kabiyè, Hausa, Yoruba, Wolof, Bambara
 */
val SKILL_AFRICAN_TRANSLATION = """
name: african_translation
description: Traduit du texte entre le français, l'anglais et les langues africaines locales (Ewe, Kabiyè, Hausa, Yoruba, Wolof, Bambara, Fon, Twi). Idéal pour les communications multilingues en Afrique de l'Ouest.
examples:
  - "Traduis 'Bonjour, comment allez-vous ?' en Ewe"
  - "Comment dit-on 'merci' en Hausa ?"
  - "Traduis ce message en Kabiyè"
  - "Traduis en anglais : 'Akpe na wo'"
steps:
  1. Identifier la langue source et cible
  2. Utiliser le modèle de traduction approprié
  3. Retourner la traduction avec la prononciation si disponible
""".trimIndent()

/**
 * Skill de gestion des contacts africains
 */
val SKILL_AFRICAN_CONTACTS = """
name: african_contacts
description: Gère les contacts téléphoniques avec support des formats de numéros africains (Togo +228, Côte d'Ivoire +225, Sénégal +221, Ghana +233, Nigeria +234, Cameroun +237, etc.)
examples:
  - "Ajoute Jean Kodjo au +228 90 12 34 56 dans mes contacts"
  - "Appelle Mama Ama sur WhatsApp"
  - "Trouve le numéro de Kofi dans mes contacts"
  - "Envoie un SMS à tous mes contacts au Togo"
steps:
  1. Ouvrir l'application Contacts ou Téléphone
  2. Rechercher ou créer le contact
  3. Effectuer l'action demandée
""".trimIndent()

/**
 * Skill de recherche locale africaine
 */
val SKILL_AFRICAN_LOCAL_SEARCH = """
name: african_local_search
description: Recherche des informations locales en Afrique de l'Ouest : restaurants, hôtels, services, prix du marché, taux de change FCFA/USD/EUR, actualités locales.
examples:
  - "Quel est le taux de change FCFA/Euro aujourd'hui ?"
  - "Trouve les meilleurs restaurants à Lomé"
  - "Quel est le prix du carburant au Togo ?"
  - "Actualités du Togo aujourd'hui"
  - "Trouve un médecin à Abidjan"
steps:
  1. Identifier le type de recherche (prix, lieu, actualité)
  2. Utiliser le navigateur ou une application appropriée
  3. Extraire et présenter les informations pertinentes
""".trimIndent()

/**
 * Registre des skills africains EMEFA
 */
object AfricanSkillsRegistry {
    val ALL_SKILLS = listOf(
        SKILL_AFRICAN_PAYMENTS,
        SKILL_WHATSAPP_BUSINESS,
        SKILL_AFRICAN_TRANSLATION,
        SKILL_AFRICAN_CONTACTS,
        SKILL_AFRICAN_LOCAL_SEARCH
    )

    fun getSkillNames(): List<String> = listOf(
        "african_payments",
        "whatsapp_business",
        "african_translation",
        "african_contacts",
        "african_local_search"
    )
}
