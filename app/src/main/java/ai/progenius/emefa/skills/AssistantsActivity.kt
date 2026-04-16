// Copyright 2026 EMEFA (progenius.ai). All rights reserved.
// Licensed under the Apache License, Version 2.0.
package ai.progenius.emefa.skills

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import ai.progenius.emefa.base.BaseActivity
import ai.progenius.emefa.ui.chat.ThemeManager

/**
 * Écran de sélection des Assistants EMEFA
 * Pro Genius AI
 */
class AssistantsActivity : BaseActivity() {

    companion object {
        fun start(context: Context) {
            context.startActivity(Intent(context, AssistantsActivity::class.java))
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val themeColors = ThemeManager.getColors()
        window.statusBarColor = themeColors.toolbarBg

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(themeColors.bg)
        }

        // Header
        val headerLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(themeColors.toolbarBg)
            setPadding(48, 48, 48, 32)
        }

        val titleView = TextView(this).apply {
            text = "Assistants EMEFA"
            textSize = 22f
            setTextColor(themeColors.aiText)
        }
        headerLayout.addView(titleView)

        val subtitleView = TextView(this).apply {
            text = "Choisissez votre assistant spécialisé"
            textSize = 14f
            setTextColor(themeColors.aiText)
            setPadding(0, 8, 0, 0)
        }
        headerLayout.addView(subtitleView)
        layout.addView(headerLayout)

        // Assistants actif
        val activeAssistant = SkillsManager.getActiveAssistant()
        val activeView = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(0xFF1B5E20.toInt())
            setPadding(48, 24, 48, 24)
        }
        val activeLabel = TextView(this).apply {
            text = "✅ Actif: ${activeAssistant.icon} ${activeAssistant.name}"
            textSize = 14f
            setTextColor(0xFFFFFFFF.toInt())
        }
        activeView.addView(activeLabel)
        layout.addView(activeView)

        // RecyclerView des assistants
        val recyclerView = RecyclerView(this).apply {
            layoutManager = GridLayoutManager(context, 2)
            setPadding(16, 16, 16, 16)
        }

        val adapter = AssistantAdapter(SkillsManager.BUILT_IN_ASSISTANTS, activeAssistant.id) { assistant ->
            SkillsManager.setActiveAssistant(assistant.id)
            Toast.makeText(
                this,
                "✅ Assistant activé: ${assistant.name}",
                Toast.LENGTH_SHORT
            ).show()
            finish()
        }
        recyclerView.adapter = adapter
        layout.addView(recyclerView)

        setContentView(layout)

        supportActionBar?.apply {
            title = "Assistants"
            setDisplayHomeAsUpEnabled(true)
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    inner class AssistantAdapter(
        private val assistants: List<SkillsManager.Assistant>,
        private var activeId: String,
        private val onSelect: (SkillsManager.Assistant) -> Unit
    ) : RecyclerView.Adapter<AssistantAdapter.ViewHolder>() {

        inner class ViewHolder(val view: LinearLayout) : RecyclerView.ViewHolder(view)

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val themeColors = ThemeManager.getColors()
            val card = LinearLayout(parent.context).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(24, 24, 24, 24)
                setBackgroundColor(themeColors.aiBubble)
                val params = ViewGroup.MarginLayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
                params.setMargins(8, 8, 8, 8)
                layoutParams = params
            }
            return ViewHolder(card)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val assistant = assistants[position]
            val themeColors = ThemeManager.getColors()
            val isActive = assistant.id == activeId

            holder.view.removeAllViews()

            if (isActive) {
                holder.view.setBackgroundColor(0xFF1B5E20.toInt())
            } else {
                holder.view.setBackgroundColor(themeColors.aiBubble)
            }

            val iconView = TextView(holder.view.context).apply {
                text = assistant.icon
                textSize = 36f
                gravity = android.view.Gravity.CENTER
            }
            holder.view.addView(iconView)

            val nameView = TextView(holder.view.context).apply {
                text = assistant.name
                textSize = 14f
                setTextColor(if (isActive) 0xFFFFFFFF.toInt() else themeColors.aiText)
                gravity = android.view.Gravity.CENTER
                setPadding(0, 8, 0, 4)
            }
            holder.view.addView(nameView)

            val descView = TextView(holder.view.context).apply {
                text = assistant.description
                textSize = 11f
                setTextColor(if (isActive) 0xFFCCCCCC.toInt() else themeColors.aiText)
                gravity = android.view.Gravity.CENTER
            }
            holder.view.addView(descView)

            val categoryView = TextView(holder.view.context).apply {
                text = assistant.category.displayName
                textSize = 10f
                setTextColor(if (isActive) 0xFF88FF88.toInt() else 0xFF1565C0.toInt())
                gravity = android.view.Gravity.CENTER
                setPadding(0, 8, 0, 0)
            }
            holder.view.addView(categoryView)

            holder.view.setOnClickListener {
                activeId = assistant.id
                onSelect(assistant)
                notifyDataSetChanged()
            }
        }

        override fun getItemCount() = assistants.size
    }
}
