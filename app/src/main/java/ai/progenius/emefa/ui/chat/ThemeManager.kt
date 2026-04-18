// Copyright 2026 EMEFA (progenius.ai). All rights reserved.
// Licensed under the Apache License, Version 2.0.
package ai.progenius.emefa.ui.chat
import android.graphics.Color
import ai.progenius.emefa.utils.KVUtils

/**
 * Runtime theme color provider — EMEFA Premium Design System
 *
 * Palette identitaire :
 *   Orange foncé  : #E85D04 / #C94D00
 *   Bleu nuit     : #080F1E / #1A2B5E / #2563EB
 *   Blanc/Crème   : #FFFFFF / #F8F9FC
 */
object ThemeManager {
    data class ChatColors(
        val bg: Int,
        val toolbarBg: Int,
        val userBubble: Int,
        val userText: Int,
        val aiBubble: Int,
        val aiBubbleBorder: Int,
        val aiText: Int,
        val avatarBg: Int,
        val inputBorder: Int,
        val sendColor: Int,
        val toolOk: Int,
        val toolDefault: Int,
        val divider: Int
    )

    private val themes = mapOf(

        // ── THÈME SOMBRE : Orange + Bleu Nuit (par défaut) ─────────────────
        "emefa_dark" to ChatColors(
            bg               = Color.parseColor("#080F1E"),
            toolbarBg        = Color.parseColor("#0F1829"),
            userBubble       = Color.parseColor("#C94D00"),
            userText         = Color.parseColor("#FFFFFF"),
            aiBubble         = Color.parseColor("#131F35"),
            aiBubbleBorder   = Color.parseColor("#1E3050"),
            aiText           = Color.parseColor("#D8E4F0"),
            avatarBg         = Color.parseColor("#E85D04"),
            inputBorder      = Color.parseColor("#1A2B45"),
            sendColor        = Color.parseColor("#E85D04"),
            toolOk           = Color.parseColor("#E85D04"),
            toolDefault      = Color.parseColor("#4A6080"),
            divider          = Color.parseColor("#0F1A2E")
        ),

        // ── THÈME CLAIR : Orange + Bleu + Blanc ────────────────────────────
        "emefa_light" to ChatColors(
            bg               = Color.parseColor("#F8F9FC"),
            toolbarBg        = Color.parseColor("#FFFFFF"),
            userBubble       = Color.parseColor("#E85D04"),
            userText         = Color.parseColor("#FFFFFF"),
            aiBubble         = Color.parseColor("#EEF3FC"),
            aiBubbleBorder   = Color.parseColor("#C8D8F0"),
            aiText           = Color.parseColor("#1A2B5E"),
            avatarBg         = Color.parseColor("#1A2B5E"),
            inputBorder      = Color.parseColor("#D0DCF0"),
            sendColor        = Color.parseColor("#E85D04"),
            toolOk           = Color.parseColor("#E85D04"),
            toolDefault      = Color.parseColor("#8A9AB8"),
            divider          = Color.parseColor("#E0E8F5")
        ),

        // ── THÈME MINUIT : Nuit profonde + Orange lumineux ──────────────────
        "emefa_midnight" to ChatColors(
            bg               = Color.parseColor("#020810"),
            toolbarBg        = Color.parseColor("#080F1E"),
            userBubble       = Color.parseColor("#D45500"),
            userText         = Color.parseColor("#FFFFFF"),
            aiBubble         = Color.parseColor("#0C1628"),
            aiBubbleBorder   = Color.parseColor("#162440"),
            aiText           = Color.parseColor("#C8D8EC"),
            avatarBg         = Color.parseColor("#E85D04"),
            inputBorder      = Color.parseColor("#101E35"),
            sendColor        = Color.parseColor("#FF6B1A"),
            toolOk           = Color.parseColor("#FF6B1A"),
            toolDefault      = Color.parseColor("#3A5070"),
            divider          = Color.parseColor("#0A1525")
        ),

        // ── THÈME BLANC PREMIUM : Blanc pur + Orange + Bleu Royal ──────────
        "emefa_white" to ChatColors(
            bg               = Color.parseColor("#FFFFFF"),
            toolbarBg        = Color.parseColor("#FAFBFF"),
            userBubble       = Color.parseColor("#E85D04"),
            userText         = Color.parseColor("#FFFFFF"),
            aiBubble         = Color.parseColor("#F0F4FF"),
            aiBubbleBorder   = Color.parseColor("#C0D0F0"),
            aiText           = Color.parseColor("#0F1E40"),
            avatarBg         = Color.parseColor("#1A2B5E"),
            inputBorder      = Color.parseColor("#D8E4F8"),
            sendColor        = Color.parseColor("#E85D04"),
            toolOk           = Color.parseColor("#E85D04"),
            toolDefault      = Color.parseColor("#7A90B8"),
            divider          = Color.parseColor("#E8EFF8")
        )
    )

    fun getColors(): ChatColors {
        val id = KVUtils.getString("THEME_ID", "emefa_dark")
        return themes[id] ?: themes["emefa_dark"]!!
    }

    fun getAllThemeIds(): List<String> = themes.keys.toList()

    fun getThemeDisplayName(id: String): String = when (id) {
        "emefa_dark"     -> "Sombre — Orange & Bleu Nuit"
        "emefa_light"    -> "Clair — Orange & Bleu & Blanc"
        "emefa_midnight" -> "Minuit — Nuit Profonde"
        "emefa_white"    -> "Blanc Premium"
        else             -> id
    }

    fun ChatColors.toComposeColors(): EmefaColors {
        val dark = isDark()
        return EmefaColors(
            background     = androidx.compose.ui.graphics.Color(bg),
            surface        = androidx.compose.ui.graphics.Color(toolbarBg),
            userBubble     = androidx.compose.ui.graphics.Color(userBubble),
            userText       = androidx.compose.ui.graphics.Color(userText),
            aiBubble       = androidx.compose.ui.graphics.Color(aiBubble),
            aiBubbleBorder = androidx.compose.ui.graphics.Color(aiBubbleBorder),
            aiText         = androidx.compose.ui.graphics.Color(aiText),
            avatar         = androidx.compose.ui.graphics.Color(avatarBg),
            accent         = androidx.compose.ui.graphics.Color(sendColor),
            textPrimary    = if (dark)
                                 androidx.compose.ui.graphics.Color(0xFFF0EEF8.toInt())
                             else
                                 androidx.compose.ui.graphics.Color(0xFF0F1E40.toInt()),
            textSecondary  = if (dark)
                                 androidx.compose.ui.graphics.Color(0xFFA0B4CC.toInt())
                             else
                                 androidx.compose.ui.graphics.Color(0xFF3A5070.toInt()),
            textTertiary   = if (dark)
                                 androidx.compose.ui.graphics.Color(0xFF506880.toInt())
                             else
                                 androidx.compose.ui.graphics.Color(0xFF7A90B8.toInt()),
            divider        = androidx.compose.ui.graphics.Color(divider),
            inputBorder    = androidx.compose.ui.graphics.Color(inputBorder),
        )
    }

    fun isDark(): Boolean {
        val id = KVUtils.getString("THEME_ID", "emefa_dark")
        return id == "emefa_dark" || id == "emefa_midnight"
    }
}
