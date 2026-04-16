// Copyright 2026 EMEFA (progenius.ai). All rights reserved.
// Licensed under the Apache License, Version 2.0.
package ai.progenius.emefa.utils

import android.content.Context
import android.content.res.Configuration
import java.util.Locale

/**
 * Gestionnaire de langue pour EMEFA
 * Supporte le Français (fr) et l'Anglais (en)
 * Pro Genius AI
 */
object LanguageManager {

    const val LANG_FRENCH = "fr"
    const val LANG_ENGLISH = "en"
    const val DEFAULT_LANG = LANG_FRENCH

    private const val PREF_KEY = "emefa_language"

    /**
     * Retourne la langue actuellement sélectionnée
     */
    fun getCurrentLanguage(context: Context): String {
        val prefs = context.getSharedPreferences("emefa_prefs", Context.MODE_PRIVATE)
        return prefs.getString(PREF_KEY, DEFAULT_LANG) ?: DEFAULT_LANG
    }

    /**
     * Enregistre la langue sélectionnée
     */
    fun setLanguage(context: Context, lang: String) {
        val prefs = context.getSharedPreferences("emefa_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString(PREF_KEY, lang).apply()
    }

    /**
     * Applique la langue au contexte
     */
    fun applyLanguage(context: Context): Context {
        val lang = getCurrentLanguage(context)
        return applyLocale(context, Locale(lang))
    }

    /**
     * Applique une locale spécifique au contexte
     */
    fun applyLocale(context: Context, locale: Locale): Context {
        Locale.setDefault(locale)
        val config = Configuration(context.resources.configuration)
        config.setLocale(locale)
        return context.createConfigurationContext(config)
    }

    /**
     * Retourne le nom affiché de la langue
     */
    fun getLanguageDisplayName(lang: String): String {
        return when (lang) {
            LANG_FRENCH -> "Français 🇫🇷"
            LANG_ENGLISH -> "English 🇬🇧"
            else -> "Français 🇫🇷"
        }
    }

    /**
     * Liste des langues disponibles
     */
    fun getAvailableLanguages(): List<Pair<String, String>> {
        return listOf(
            LANG_FRENCH to "Français 🇫🇷",
            LANG_ENGLISH to "English 🇬🇧"
        )
    }
}
