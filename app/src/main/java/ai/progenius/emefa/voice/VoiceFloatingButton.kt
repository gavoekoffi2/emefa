package ai.progenius.emefa.voice

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.widget.ImageView
import androidx.core.content.ContextCompat
import ai.progenius.emefa.R
import ai.progenius.emefa.voice.VoiceService.VoiceState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

/**
 * Bouton flottant vocal EMEFA
 * Affiché en overlay sur tout l'écran, permet d'accéder à l'assistante vocale à tout moment
 */
class VoiceFloatingButton(
    private val context: Context,
    private val onTap: () -> Unit,
    private val onLongPress: () -> Unit
) {
    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var floatView: View? = null
    private var params: WindowManager.LayoutParams? = null
    private val scope = CoroutineScope(Dispatchers.Main)
    private var stateJob: Job? = null
    private var pulseAnimator: ObjectAnimator? = null

    // Position initiale (coin bas-droit)
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false
    private var longPressJob: Job? = null

    fun show() {
        if (floatView != null) return

        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM or Gravity.END
            x = 24
            y = 120
        }

        // Créer le bouton flottant
        val view = createFloatView()
        floatView = view

        setupTouchListener(view)
        windowManager.addView(view, params)
        animateIn(view)
    }

    private fun createFloatView(): View {
        // Créer une vue circulaire avec l'icône micro
        val imageView = ImageView(context).apply {
            setImageResource(R.drawable.ic_voice_fab)
            background = ContextCompat.getDrawable(context, R.drawable.bg_voice_fab)
            setPadding(20, 20, 20, 20)
            elevation = 12f
            alpha = 0.92f
        }
        return imageView
    }

    private fun setupTouchListener(view: View) {
        view.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params?.x ?: 0
                    initialY = params?.y ?: 0
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - initialTouchX
                    val dy = event.rawY - initialTouchY
                    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                        isDragging = true
                        params?.x = initialX - dx.toInt()
                        params?.y = initialY - dy.toInt()
                        try {
                            windowManager.updateViewLayout(view, params)
                        } catch (_: Exception) {}
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isDragging) {
                        // Simple tap = démarrer/arrêter la voix
                        onTap()
                        animateTap(view)
                    }
                    isDragging = false
                    true
                }
                else -> false
            }
        }
    }

    /**
     * Mettre à jour l'apparence du bouton selon l'état vocal
     */
    fun updateState(state: VoiceState) {
        val view = floatView as? ImageView ?: return
        scope.launch {
            when (state) {
                is VoiceState.Idle -> {
                    stopPulse()
                    view.setImageResource(R.drawable.ic_voice_fab)
                    view.alpha = 0.85f
                }
                is VoiceState.Connecting -> {
                    startPulse(view, slow = true)
                    view.setImageResource(R.drawable.ic_voice_fab_connecting)
                    view.alpha = 0.9f
                }
                is VoiceState.Connected -> {
                    stopPulse()
                    view.setImageResource(R.drawable.ic_voice_fab_active)
                    view.alpha = 1.0f
                }
                is VoiceState.Speaking -> {
                    startPulse(view, slow = false)
                    view.setImageResource(R.drawable.ic_voice_fab_active)
                    view.alpha = 1.0f
                }
                is VoiceState.AgentSpeaking -> {
                    startPulse(view, slow = false)
                    view.setImageResource(R.drawable.ic_voice_fab_agent)
                    view.alpha = 1.0f
                }
                is VoiceState.Error -> {
                    stopPulse()
                    view.setImageResource(R.drawable.ic_voice_fab)
                    view.alpha = 0.7f
                }
            }
        }
    }

    private fun startPulse(view: View, slow: Boolean) {
        pulseAnimator?.cancel()
        pulseAnimator = ObjectAnimator.ofFloat(view, "scaleX", 1.0f, 1.15f, 1.0f).apply {
            duration = if (slow) 1500L else 600L
            repeatCount = ValueAnimator.INFINITE
            interpolator = DecelerateInterpolator()
            start()
        }
        ObjectAnimator.ofFloat(view, "scaleY", 1.0f, 1.15f, 1.0f).apply {
            duration = if (slow) 1500L else 600L
            repeatCount = ValueAnimator.INFINITE
            interpolator = DecelerateInterpolator()
            start()
        }
    }

    private fun stopPulse() {
        pulseAnimator?.cancel()
        floatView?.scaleX = 1.0f
        floatView?.scaleY = 1.0f
    }

    private fun animateTap(view: View) {
        ObjectAnimator.ofFloat(view, "scaleX", 1.0f, 0.85f, 1.0f).apply {
            duration = 200
            start()
        }
        ObjectAnimator.ofFloat(view, "scaleY", 1.0f, 0.85f, 1.0f).apply {
            duration = 200
            start()
        }
    }

    private fun animateIn(view: View) {
        view.alpha = 0f
        view.scaleX = 0.5f
        view.scaleY = 0.5f
        view.animate()
            .alpha(0.92f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(300)
            .setInterpolator(DecelerateInterpolator())
            .start()
    }

    fun hide() {
        floatView?.let { view ->
            view.animate()
                .alpha(0f)
                .scaleX(0.5f)
                .scaleY(0.5f)
                .setDuration(200)
                .withEndAction {
                    try {
                        windowManager.removeView(view)
                    } catch (_: Exception) {}
                    floatView = null
                }
                .start()
        }
        stateJob?.cancel()
        pulseAnimator?.cancel()
    }

    fun isShowing() = floatView != null
}
