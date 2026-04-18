// Copyright 2026 EMEFA (progenius.ai). All rights reserved.
// Licensed under the Apache License, Version 2.0.

package ai.progenius.emefa.ui.settings

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatDelegate
import ai.progenius.emefa.R
import ai.progenius.emefa.base.BaseActivity
import ai.progenius.emefa.utils.KVUtils
import ai.progenius.emefa.widget.CommonToolbar

class ThemeActivity : BaseActivity() {

    data class ThemeConfig(
        val id: String,
        val name: String,
        val isDark: Boolean,
        val bg: Int,
        val userBubble: Int,
        val aiBubble: Int,
        val avatar: Int,
        val inputBar: Int,
        val accent: Int
    )

    // Thèmes EMEFA : Orange foncé + Bleu Nuit
    private val themes = listOf(
        ThemeConfig("emefa_dark",     "Sombre",         true,  Color.parseColor("#080F1E"), Color.parseColor("#C94D00"), Color.parseColor("#131F35"), Color.parseColor("#E85D04"), Color.parseColor("#0F1829"), Color.parseColor("#E85D04")),
        ThemeConfig("emefa_light",    "Clair",          false, Color.parseColor("#F8F9FC"), Color.parseColor("#E85D04"), Color.parseColor("#EEF3FC"), Color.parseColor("#1A2B5E"), Color.parseColor("#FFFFFF"), Color.parseColor("#E85D04")),
        ThemeConfig("emefa_midnight", "Minuit",         true,  Color.parseColor("#020810"), Color.parseColor("#D45500"), Color.parseColor("#0C1628"), Color.parseColor("#E85D04"), Color.parseColor("#080F1E"), Color.parseColor("#FF6B1A")),
        ThemeConfig("emefa_white",    "Blanc Premium",  false, Color.parseColor("#FFFFFF"), Color.parseColor("#E85D04"), Color.parseColor("#F0F4FF"), Color.parseColor("#1A2B5E"), Color.parseColor("#FAFBFF"), Color.parseColor("#E85D04")),
    )

    private var selectedThemeId = "emefa_dark"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val tc = ai.progenius.emefa.ui.chat.ThemeManager.getColors()
        window.statusBarColor = tc.toolbarBg
        window.decorView.setBackgroundColor(tc.bg)

        setContentView(R.layout.activity_theme)

        val contentFrame = findViewById<android.view.ViewGroup>(android.R.id.content)
        contentFrame?.setBackgroundColor(tc.bg)
        (contentFrame?.getChildAt(0) as? android.view.View)?.setBackgroundColor(tc.bg)

        findViewById<CommonToolbar>(R.id.toolbar).apply {
            setTitle("Appearance")
            setTitleColor(tc.aiText)
            setBackgroundColor(tc.toolbarBg)
            showBackButton(true) { finish() }
            findViewById<android.widget.ImageView>(R.id.ivBack)?.setColorFilter(tc.aiText)
        }
        findViewById<TextView>(R.id.tvCurrentTheme)?.setTextColor(tc.aiText)

        selectedThemeId = KVUtils.getString("THEME_ID", "emefa_dark")

        // Utiliser les 2 premiers slots de prévisualisation disponibles
        val viewIds = listOf(R.id.themeEmberDark, R.id.themeEmberLight, R.id.themeAbyssDark, R.id.themeAbyssLight)
        // Masquer les autres prévisualisations non utilisées
        listOf(R.id.themeMossDark, R.id.themeOnyxDark,
               R.id.themeMossLight, R.id.themeOnyxLight).forEach {
            findViewById<View>(it)?.visibility = View.GONE
        }

        themes.forEachIndexed { index, theme ->
            val view = findViewById<View>(viewIds[index])
            setupThemePreview(view, theme)
        }

        updateSelection()
    }

    private fun setupThemePreview(view: View, theme: ThemeConfig) {
        val card = view.findViewById<LinearLayout>(R.id.cardPreview)
        val userBubble = view.findViewById<View>(R.id.previewUserBubble)
        val userBubble2 = view.findViewById<View>(R.id.previewUserBubble2)
        val aiBubble = view.findViewById<View>(R.id.previewAiBubble)
        val avatar = view.findViewById<View>(R.id.previewAvatar)
        val inputBar = view.findViewById<View>(R.id.previewInputBar)
        val name = view.findViewById<TextView>(R.id.tvThemeName)

        // Card background
        val cardBg = GradientDrawable().apply {
            setColor(theme.bg)
            cornerRadius = dp(12f)
        }
        card.background = cardBg

        // User bubble
        userBubble.background = roundRect(theme.userBubble, 8f)
        userBubble2.background = roundRect(theme.userBubble, 8f)

        // AI bubble
        aiBubble.background = roundRect(theme.aiBubble, 8f)

        // Avatar
        avatar.background = oval(theme.avatar)

        // Input bar
        inputBar.background = GradientDrawable().apply {
            setColor(Color.TRANSPARENT)
            setStroke(dp(1).toInt(), theme.inputBar)
            cornerRadius = dp(6f)
        }

        name.text = theme.name

        view.setOnClickListener {
            selectedThemeId = theme.id
            KVUtils.putString("THEME_ID", theme.id)

            // Use system uimode command (works on MIUI where AppCompatDelegate doesn't)
            try {
                val mode = if (theme.isDark) "yes" else "no"
                Runtime.getRuntime().exec(arrayOf("cmd", "uimode", "night", mode))
            } catch (_: Exception) {
                // Fallback to AppCompatDelegate
                val newMode = if (theme.isDark) AppCompatDelegate.MODE_NIGHT_YES else AppCompatDelegate.MODE_NIGHT_NO
                AppCompatDelegate.setDefaultNightMode(newMode)
            }

            // Restart app to apply theme everywhere
            val intent = packageManager.getLaunchIntentForPackage(packageName)
            intent?.addFlags(android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP or android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
            finishAffinity()
        }
    }

    private fun updateSelection() {
        val allViews = listOf(R.id.themeEmberDark, R.id.themeEmberLight)

        themes.forEachIndexed { index, theme ->
            val view = findViewById<View>(allViews[index])
            val indicator = view.findViewById<View>(R.id.selectedIndicator)
            val isSelected = theme.id == selectedThemeId

            if (isSelected) {
                indicator.visibility = View.VISIBLE
                indicator.background = roundRect(theme.accent, 2f)
            } else {
                indicator.visibility = View.INVISIBLE
            }
        }

        val current = themes.find { it.id == selectedThemeId }
        val label = current?.name ?: selectedThemeId
        findViewById<TextView>(R.id.tvCurrentTheme).text = "Current: $label"
    }

    private fun roundRect(color: Int, radius: Float) = GradientDrawable().apply {
        setColor(color)
        cornerRadius = dp(radius)
    }

    private fun oval(color: Int) = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(color)
    }

    private fun dp(v: Float): Float = v * resources.displayMetrics.density
    private fun dp(v: Int): Float = v * resources.displayMetrics.density
}
