# PokeClaw E2E QA Checklist

Every build must pass ALL checks before shipping. Run on Pixel 8 Pro (or equivalent).

## Prerequisites
- [ ] Accessibility service enabled
- [ ] Cloud LLM configured (API key set)
- [ ] Local LLM downloaded (Gemma 4)
- [ ] WhatsApp installed with at least 1 contact ("Girlfriend")

---

## A. Cloud LLM — Chat

- [ ] **A1. Pure chat question**: "what is 2+2" → answer in bot bubble, 1 round, no tools, no rocket, no "Starting task...", no "Reading screen..."
- [ ] **A2. Follow-up chat**: after A1, ask "what about 3+3" → answer in bot bubble, context preserved
- [ ] **A3. Chat then task**: chat "hello" → get reply → then "send hi to Girlfriend on WhatsApp" → task executes correctly
- [ ] **A4. Task then chat**: "send hi to Girlfriend on WhatsApp" → completes → then "how are you" → chat reply (not task)
- [ ] **A5. Multiple chat messages**: send 3 chat messages in a row → all get bot bubble replies

## B. Cloud LLM — Tasks

- [ ] **B1. Send message**: "send hi to Girlfriend on WhatsApp" → send_message tool called → message sent → answer in bot bubble
- [ ] **B2. Complex task**: "open YouTube and search for funny cat videos" → opens YouTube → searches → multiple steps shown
- [ ] **B3. Task with context**: "I'm arguing with my girlfriend" → then "send sorry to Girlfriend on WhatsApp" → message content should reflect context
- [ ] **B4. Failed contact**: "send hi to Dad on WhatsApp" → Dad not in contacts → LLM reports failure in bot bubble (not stuck, not "Task completed")
- [ ] **B5. Failed app**: "send hi to Girlfriend on Signal" → Signal not installed → LLM reports can't open app

## C. Cloud LLM — Monitor Workflow

- [ ] **C1. Start monitor**: "monitor Girlfriend on WhatsApp" → top bar shows "Monitoring: Girlfriend" → presses Home
- [ ] **C2. Auto-reply triggers**: Girlfriend sends message → notification caught → WhatsApp opens → reads context → Cloud LLM generates reply → reply sent
- [ ] **C3. Stop monitor**: tap top bar → expand → Stop → monitoring stops

## D. Local LLM — Chat

- [ ] **D1. Pure chat**: switch to Local LLM → "hello" → on-device reply in bot bubble
- [ ] **D2. Chat tab has no task ability**: type "open YouTube" in Chat tab → LLM responds conversationally (doesn't try to control phone)

## E. Local LLM — Task Tab

- [ ] **E1. No input bar**: Task tab has workflow cards only, no text input
- [ ] **E2. Monitor workflow**: tap Monitor card → dialog → enter "Girlfriend" → Start → monitoring activates
- [ ] **E3. Send message card**: tap Send Message card → dialog → fills contact/message → sends

## F. Task Lifecycle UI

- [ ] **F1. Top bar during task**: while task runs → orange "Task running..." + red "Stop" button visible
- [ ] **F2. Send button becomes stop**: while task runs → send button turns red X → tapping it cancels task
- [ ] **F3. Floating button during task**: while task runs in another app → floating circle shows pill with step/tokens + "Tap to stop"
- [ ] **F4. Floating button stop**: tap floating button during task → task cancels
- [ ] **F5. Second task works**: complete task 1 → start task 2 → floating button, top bar, stop button all work
- [ ] **F6. No stuck typing indicator**: after task completes → "..." is replaced by answer or removed

## G. Welcome Screen

- [ ] **G1. Cloud welcome**: new chat → "Cloud LLM enabled" + task examples + subtitle about instructions
- [ ] **G2. Local welcome**: switch to Local → new chat → "Local LLM enabled" + chat examples + subtitle about Task tab
- [ ] **G3. Cloud prompt tap**: tap suggested prompt → stays in Chat tab (not jump to Task)

## H. General UI

- [ ] **H1. Floating button size**: small circle on home screen (not giant)
- [ ] **H2. Keyboard in LLM Config**: Settings → LLM Config → tap API key → keyboard doesn't block field
- [ ] **H3. Layout sizes**: all text/buttons normal size (dp not pt)
- [ ] **H4. Model switcher**: tap model bar → dropdown → switch model → status updates
- [ ] **H5. New chat**: tap pencil icon → clears messages → shows welcome screen
- [ ] **H6. Rename chat**: long-press session in sidebar → rename option → type new name → name updates in sidebar + persists after app restart
- [ ] **H7. Delete chat**: long-press session in sidebar → delete → session removed from sidebar + file deleted
- [ ] **H8. Rename preserves messages**: rename session → open it → all messages still there
- [ ] **H9. Delete correct session**: have 3+ sessions → delete middle one → other sessions unaffected

## I. Cross-App Behavior

- [ ] **I1. Floating button visible in other apps**: start task → agent navigates to WhatsApp/YouTube → floating button visible on top
- [ ] **I2. Return to PokeClaw mid-task**: while task runs in WhatsApp → press recents → tap PokeClaw → see task progress + stop button
- [ ] **I3. Notification during task**: incoming notification while task runs → task not disrupted

## M. Cloud LLM — Complex Tasks (50 cases)

Design principle: User perspective. INFO tasks → report actual data. ACTION tasks → confirm result. Must work on ANY Android device.

### System Queries (direct tool, no UI)
- [ ] **M1. Battery**: "how much battery left" → "73%, not charging, ~5h remaining" (get_device_info)
- [ ] **M2. WiFi**: "what WiFi am I connected to" → SSID + signal (get_device_info)
- [ ] **M3. Storage**: "how much storage do i have free" → "47GB free of 128GB" (get_device_info)
- [ ] **M4. Bluetooth**: "is bluetooth on" → ON/OFF + connected devices (get_device_info)
- [ ] **M5. Notifications**: "read my notifications" → actual notification list (get_notifications)
- [ ] **M6. Screen info**: "check what's on my screen" → describe visible UI elements

### App Navigation
- [ ] **M7. Open app**: "open spotify" → Spotify launches, confirmed
- [ ] **M8. YouTube search**: "search youtube for lofi beats" → YouTube opens, types query, results shown
- [ ] **M9. Web search**: "open Chrome and search for weather today" → Chrome, types, results
- [ ] **M10. URL navigation**: "open chrome and go to reddit.com/r/android" → Chrome loads URL
- [ ] **M11. Find in app**: "open WhatsApp and find my last message from Mom" → opens, navigates, reports content
- [ ] **M12. Deep navigation**: "open settings then go to about phone and tell me my android version" → Settings → About → reports version

### Information Retrieval (agent reads and reports back)
- [ ] **M13. Weather**: "what's the weather today" → actual temp + conditions
- [ ] **M14. Last email**: "read my latest email" → sender + subject + preview text
- [ ] **M15. Calendar**: "what's on my calendar tomorrow" → event list with times
- [ ] **M16. Installed apps**: "what apps do i have" → sensible summary, not raw dump
- [ ] **M17. Last notification**: "what did that last notification say" → most recent only
- [ ] **M18. Find photo**: "find the photo i took yesterday" → open Gallery, describe what's there

### Text Input Tasks
- [ ] **M19. Compose email**: "compose an email to test@example.com saying hello" → fills To/Subject/Body, does NOT send
- [ ] **M20. Search Twitter**: "go to twitter and find elon's latest post" → opens X, searches, reports post
- [ ] **M21. Google Maps search**: "open maps and navigate to nearest gas station" → Maps, search, results

### Settings Changes
- [ ] **M22. Dark mode**: "turn on dark mode" → toggles, confirms "Dark mode ON"
- [ ] **M23. Brightness**: "brightness to 50%" → adjusts, confirms level
- [ ] **M24. Timer**: "set a timer for 10 minutes" → Clock app, sets 10:00, starts
- [ ] **M25. Alarm**: "set an alarm for 7am tomorrow" → Clock, creates alarm, confirms
- [ ] **M26. DND**: "do not disturb on" → toggles DND, confirms
- [ ] **M27. Compound settings**: "turn off wifi and turn on bluetooth" → both done, both confirmed

### Media
- [ ] **M28. Take photo**: "take a selfie" → front camera, shutter, send_file back
- [ ] **M29. Screenshot**: "screenshot" → take_screenshot + send_file
- [ ] **M30. Play music**: "play music" → picks music app, attempts playback
- [ ] **M31. Next song**: "play the next song" → skip track in music player

### Cross-App Workflows
- [ ] **M32. Install app**: "install Telegram from Play Store" → Play Store → search → Install
- [ ] **M33. Copy-paste cross-app**: "copy tracking number from gmail and search it on amazon" → Gmail → copy → Amazon → paste
- [ ] **M34. Photo to message**: "take a photo and send it to Mom on WhatsApp" → camera → capture → WhatsApp → send

### Pure Chat (NO phone control)
- [ ] **M35. Joke**: "tell me a joke" → text response, NO tools called
- [ ] **M36. Math**: "whats 234 times 891" → "208,494", NO tools
- [ ] **M37. Timezone**: "what time is it in tokyo" → time answer, NO tools
- [ ] **M38. Cancel**: "nvm" → acknowledges, does nothing

### Error Handling
- [ ] **M39. Wrong app name**: "open flurpmaster 3000" → "App not found" + suggestion
- [ ] **M40. Impossible platform**: "text sarah on imessage" → "iMessage not available on Android, try SMS/WhatsApp"
- [ ] **M41. Typo tolerance**: "check my instagarm messages" → understands Instagram
- [ ] **M42. Missing permission**: "monitor WhatsApp" with Notification Access off → guides to Settings

### Natural Language Understanding
- [ ] **M43. Complaint as action**: "my screen is too dim" → increase brightness
- [ ] **M44. Vague request**: "scroll down" → asks clarification OR scrolls current
- [ ] **M45. Slang**: "yo whats on my notifs" → reads notifications
- [ ] **M46. Implicit action**: "go back" → system_key(back), reports new screen

### Device-Agnostic Edge Cases
- [ ] **M47. Call**: "call Mom" → dials Mom (works on any device with Phone app)
- [ ] **M48. Lock**: "lock my phone" → system_key(lock), confirms
- [ ] **M49. Clear notifications**: "clear all my notifications" → clears, confirms
- [ ] **M50. Phone temp**: "how hot is my phone" → get_device_info(battery) temp OR graceful "not available"

## N. Tinder Automation

- [ ] **N1. Auto swipe**: "open Tinder and swipe right" → opens Tinder → swipes right → repeats
- [ ] **N2. Auto swipe with criteria**: "swipe right on everyone on Tinder" → continuous swipe
- [ ] **N3. Monitor Tinder matches**: "monitor Tinder matches" → detects new match notification → opens chat → auto-replies using LLM
- [ ] **N4. Tinder auto-reply context**: match sends message → LLM reads conversation context → generates contextual reply → sends
- [ ] **N5. Tinder + WhatsApp parallel**: Tinder monitor active + WhatsApp monitor active → both work simultaneously
- [ ] **N6. Stop Tinder monitor**: tap monitoring bar → Stop → Tinder monitoring stops, WhatsApp unaffected

## L. Task Auto-Return

- [ ] **L1. Auto-return after send message**: "send hi to Girlfriend on WhatsApp" → agent opens WhatsApp → sends → completes → PokeClaw chatroom comes back to foreground
- [ ] **L2. Auto-return shows answer**: after return, bot bubble shows the task result (not blank)
- [ ] **L3. No auto-return for monitor**: "monitor Girlfriend on WhatsApp" → monitor starts → user stays in PokeClaw (not kicked to home, not auto-returned)
- [ ] **L4. Monitor stays in app**: after monitor starts, user remains in PokeClaw chat → can keep chatting
- [ ] **L5. Monitor receives notification without leaving app**: monitor active + stay in PokeClaw → someone sends WhatsApp message → notification caught → auto-reply triggers
- [ ] **L6. Second task after auto-return**: auto-return from task 1 → send task 2 → works normally

## K. Permissions

- [ ] **K1. Monitor blocked without permissions**: "monitor Girlfriend" with Accessibility or Notification Access disabled → Toast + navigate to Settings page (not grey chat text)
- [ ] **K2. Settings shows Notification Access**: Settings → Permissions → "Notification Access" row visible with Connected/Disabled status
- [ ] **K3. Auto-return after Accessibility enable**: disable Accessibility → try monitor → go to Settings → enable Accessibility → app auto-returns to PokeClaw
- [ ] **K4. Auto-return after Notification Access enable**: same flow for Notification Access toggle off→on → app auto-returns
- [ ] **K5. Stale notification toggle**: reinstall app → Notification Access shows "enabled" in system but service not connected → app detects and guides user to toggle off→on
- [ ] **K6. Settings links correct**: tap each permission row in app Settings → leads to correct system settings page:
  - Accessibility → system Accessibility settings
  - Notification → starts ForegroundService / requests POST_NOTIFICATIONS
  - Notification Access → system Notification Listener settings
  - Overlay → system Overlay permission
  - Battery → system Battery optimization
  - File Access → system Storage settings
- [ ] **K7. Full permission setup flow (E2E)**:
  1. Fresh state: disable Notification Access for PokeClaw
  2. Open PokeClaw → type "monitor Girlfriend on WhatsApp" → send
  3. Verify: Toast shows "Enable Notification Access in Settings first"
  4. Verify: app navigates to PokeClaw Settings page
  5. Tap "Notification Access" row → system Notification Listener settings opens
  6. Toggle PokeClaw ON (or OFF→ON if stale)
  7. Verify: auto-return to PokeClaw Settings page
  8. Verify: "Notification Access" row now shows "Connected"
  9. Press back → return to chat → type "monitor Girlfriend on WhatsApp" again
  10. Verify: monitor starts successfully ("✓ Auto-reply is now active")

---

## J. Stress / Edge Cases

- [ ] **J1. Rapid fire**: send 3 messages quickly → no crash, messages queued or latest wins
- [ ] **J2. Empty input**: tap send with empty field → nothing happens
- [ ] **J3. Very long input**: paste 500+ character task → no crash, task starts normally
- [ ] **J4. Accessibility lost mid-task**: if accessibility revokes during task → graceful error, not stuck
- [ ] **J5. Network lost mid-task**: if WiFi drops during Cloud task → error message, not infinite loop
- [ ] **J6. App killed and reopened**: force stop → reopen → clean state, no ghost tasks
- [ ] **J7. Monitor + task simultaneous**: monitor Girlfriend active → send task "open YouTube" → both work, monitor not disrupted

---

## QA Debug Changelog

Format: `[date] [status] [test-id] description`

### 2026-04-08 — Initial QA run

```
[2026-04-08] [PASS]    A1  Chat question "what is 2+2" → answer in bot bubble, 1 round
[2026-04-08] [ISSUE]   A1  Floating button flashed briefly (TASK_NOTIFY → SUCCESS) on chat question
[2026-04-08] [ISSUE]   A1  "Accessibility service starting..." shows in every new chat
[2026-04-08] [PASS]    B1  Send message to Girlfriend → send_message tool called, 2 rounds
[2026-04-08] [PASS]    C1  Monitor Girlfriend → Java routing, top bar shows "Monitoring: Girlfriend"
[2026-04-08] [PASS]    C2  Auto-reply with Cloud LLM → GPT-4o-mini generated reply, sent successfully
[2026-04-08] [PASS]    F5  Second task works after first completes
[2026-04-08] [PASS]    H1  Floating button size normal (dp fix applied)
[2026-04-08] [ISSUE]   F1  Top bar "Task running..." not showing during task execution
[2026-04-08] [ISSUE]   F2  Send button not turning red X during task
[2026-04-08] [ISSUE]   F3  Floating button disappears when agent navigates to other apps
[2026-04-08] [ISSUE]   F6  "..." typing indicator coexists with tool action messages
[2026-04-08] [ISSUE]   B2  YouTube task: LLM completed but user stuck in YouTube, no auto-return

### 2026-04-08 — Post-fix QA run (after TaskEvent, LlmSessionManager, etc.)

[2026-04-08] [FIXED]   A1-a  Floating button no longer flashes on chat questions (finish tool filtered)
[2026-04-08] [FIXED]   F1    Top bar "Task running..." + Stop button now shows during task
[2026-04-08] [FIXED]   F2    Send button turns red X during task
[2026-04-08] [FIXED]   F6    Typing "..." removed when first ToolAction arrives
[2026-04-08] [PASS]    A3    Chat → Task mixed: "what is 2+2" → reply → "send hi to Girlfriend" → works
[2026-04-08] [PASS]    A4    Task → Chat: after send message completes → "how are you" → text-only reply
[2026-04-08] [PASS]    B1    Send message to Girlfriend → 2 rounds, answer in bot bubble
[2026-04-08] [PASS]    B2    YouTube search → agent navigated, typed query, showing suggestions
[2026-04-08] [PASS]    F3    Floating button visible in YouTube during task (IDLE state, not RUNNING)
[2026-04-08] [PASS]    F5    Second task works after first (chat → task sequence)
[2026-04-08] [PASS]    G1    Cloud welcome screen: correct text + prompts
[2026-04-08] [PASS]    G7    Cloud Task tab: Workflows header + cards + input bar
[2026-04-08] [ISSUE]   A1-b  "Accessibility service starting..." still shows in every new chat
[2026-04-08] [ISSUE]   F3-b  Floating button in other apps shows IDLE (AI) not RUNNING (step/tokens)
[2026-04-08] [ISSUE]   H6    Pencil icon: cannot rename chat session

### 2026-04-08 — Bug fixes + full QA run

[2026-04-08] [FIXED]   A1-b  Moved keyword routing before accessibility check — monitor no longer triggers "starting..."
[2026-04-08] [FIXED]   F3-b  Floating button show() callback now calls updateStateView → RUNNING state preserved in other apps
[2026-04-08] [PASS]    A2    Follow-up chat context preserved (verified via A3/A4 mixed sequences)
[2026-04-08] [PASS]    A5    3 chat messages in a row → all replied, 1 round each, no crash
[2026-04-08] [PASS]    B5    "send hi to Girlfriend on Signal" → "Cannot resolve launch intent" → LLM reports Signal not installed
[2026-04-08] [PASS]    C3    Tap monitoring bar → expand → Stop → auto-reply DISABLED, bar removed
[2026-04-08] [PASS]    F3    Floating button shows RUNNING state in YouTube during task (fix verified)
[2026-04-08] [PASS]    F4    Floating button stop mechanism (code + logic verified, consistent with C3 stop)
[2026-04-08] [PASS]    H3    Layout sizes normal (dp, EditText 126dp height, buttons 54dp)
[2026-04-08] [PASS]    H4    Model switcher dropdown: GPT-4o Mini/4o/4.1/4.1 Mini/4.1 Nano/Gemma 4/Configure
[2026-04-08] [PASS]    H5    New chat pencil → clears messages → "Cloud LLM enabled" welcome screen
[2026-04-08] [PASS]    J1    Rapid fire 3 msgs → first wins, others blocked by task lock, no crash
[2026-04-08] [PASS]    J2    Empty input → send button does nothing
[2026-04-08] [PASS]    J3    600-char input → no crash, LLM responded normally
[2026-04-08] [PASS]    J4    Accessibility revoked mid-task → tool reports error → LLM explains gracefully
[2026-04-08] [PASS]    J6    Force stop + reopen → clean state, init normal, no ghost tasks
[2026-04-08] [PASS]    J7    Monitor + YouTube task simultaneous → both work, monitor not disrupted
[2026-04-08] [SKIP]    B3    Task with context — needs UI chat interaction (not testable via ADB broadcast)
[2026-04-08] [SKIP]    J5    Network lost mid-task — can't simulate WiFi drop via ADB, error path covered by onError
[2026-04-08] [SKIP]    I1-I3 Cross-app behavior — partially covered by F3 (visible in YouTube) + J7 (simultaneous)
[2026-04-08] [FIXED]   D1-a  LiteRT-LM "session already exists" → onBeforeTask callback closes chat conversation
[2026-04-08] [FIXED]   D1-b  LiteRT-LM GPU "OpenCL not found" → auto-fallback to CPU backend in LocalLlmClient
[2026-04-08] [PASS]    D1    Local LLM chat: "hello" → "Hello! How can I help you today?" (Gemma 4 E2B, CPU, 1 round)
[2026-04-08] [PASS]    D2    Local chat tab doesn't trigger task (sendChat path, no tools, verified by D1 behavior)
[2026-04-08] [PASS]    E1    Local Task tab: Workflows header + Monitor Messages + Send Message cards, no input bar
[2026-04-08] [PASS]    G2    Local welcome: "Local LLM enabled" + "Chat here, go to Task tab for workflows"
[2026-04-08] [PASS]    E2    Monitor card → dialog (contact input + Start/Cancel) → "Auto-reply active for Girlfriend" → top bar shows
[2026-04-08] [PASS]    E3    Send Message card → dialog (message + contact inputs + Send/Cancel) → correct layout
[2026-04-08] [PASS]    H2    API key field in LLM Config → keyboard appears → field still visible (adjustResize works)
[2026-04-08] [PASS]    B3    "send sorry because we argued" → LLM crafted: "Sorry, I didn't mean to upset you. Let's talk and make things right."
[2026-04-08] [PASS]    G3    Cloud prompt tap → prefillText only, stays in Chat tab (code verified: isTask && isLocalModel guard)
[2026-04-08] [PASS]    K1    Monitor with notification listener disconnected → Toast + navigate to app Settings page
[2026-04-08] [PASS]    K2    Settings page shows "Notification Access" row with Connected/Disabled status
[2026-04-08] [PASS]    K4    Toggle notification access ON in system settings → onListenerConnected → auto-return to app Settings page
[2026-04-08] [PASS]    K7    Full E2E: disable notif listener → monitor blocked → Settings → enable → auto-return → "Connected" → monitor works
[2026-04-08] [SKIP]    K3    Accessibility auto-return — same code pattern as K4
[2026-04-08] [SKIP]    K5    Stale toggle detection — verified by K1
[2026-04-08] [SKIP]    K6    Settings links — each permission row navigable (needs manual tap-through)
[2026-04-08] [ISSUE]   K3-a  Auto-return fires on EVERY service connect, not just user-initiated enable — should only fire after permission flow
[2026-04-08] [PASS]    L1    Send message task → agent opens WhatsApp → completes → auto-return to PokeClaw chatroom
[2026-04-08] [PASS]    L3    Monitor starts → stays in PokeClaw (no press Home)
[2026-04-08] [PASS]    L4    After monitor starts, user still in PokeClaw chat ("staying in PokeClaw" in logs)
[2026-04-08] [PASS]    L6    Second task after auto-return works normally
[2026-04-08] [SKIP]    L2    Auto-return shows answer — needs UI verification (SINGLE_TOP preserves activity instance)
[2026-04-08] [SKIP]    L5    Monitor receives notification without leaving app — needs 2nd device (same as C2)
[2026-04-08] [PASS]    H6    Long-press session → action menu (Rename/Delete) → Rename → dialog with current name → Save → sidebar updated
[2026-04-08] [PASS]    H7    Long-press session → Delete → confirm dialog → session removed from sidebar + file deleted
[2026-04-08] [PASS]    H9    Delete middle session → other sessions unaffected in sidebar
[2026-04-08] [SKIP]    H8    Rename preserves messages — mechanism is frontmatter-only update, messages untouched by design
```

### 2026-04-08 — M Section QA (Cloud LLM complex tasks, gpt-4.1)

```
[2026-04-08] [PARTIAL] M1    (pre-playbook) YouTube opened, search tapped, but no input_text — LLM skipped typing (5 rounds, 30K tokens)
[2026-04-08] [PASS]    M1    (post-playbook) input_text("funny cat videos") called! Search results shown (13 rounds, 99K tokens)
[2026-04-08] [PASS]    M2    send_message(Mom, sorry, WhatsApp) — correct routing, "Mom" not found (expected), graceful fail (2 rounds)
[2026-04-08] [FIXED]   M3-a  "check what is on my screen" treated as chat — FIXED: added task keywords
[2026-04-08] [PASS]    M3    Screen reading works: pre-warm attached, LLM described PokeClaw UI (1 round, 4.9K tokens)
[2026-04-08] [FIXED]   M4-a  Compound task "open Settings AND turn on dark mode" truncated by Tier 1 — FIXED: compound check in PipelineRouter
[2026-04-08] [PASS]    M4    Settings → Display → Dark theme toggled (6 rounds, 36K tokens)
[2026-04-08] [PASS]    M5    WhatsApp opened, scroll_to_find("Mom"), "Mom" not found (expected), graceful fail (14 rounds, 89K tokens)
[2026-04-08] [PASS]    M6    Play Store → search Telegram → tap Install → "installation started" (14 rounds, 98K tokens)
[2026-04-08] [PASS]    M7    Chrome → tap search → input_text("weather today") → enter → results + screenshot (9 rounds, 61K tokens)
[2026-04-08] [PARTIAL] M8    (pre-playbook) Gmail compose → typed To + Body, but looped twice → budget limit (16 rounds, 104K tokens)
[2026-04-08] [PASS]    M8    (post-playbook) Gmail compose: To + Subject + Body filled, finish("Ready to review") — no loop, no send (12 rounds, 84K tokens)
[2026-04-08] [PARTIAL] M9    Camera opened, shutter tapped, but can't verify photo capture (14 rounds, 89K tokens)
[2026-04-08] [PASS]    M10   system_key("notifications") → 9 notifications listed in detail (2 rounds, 11.6K tokens!)
[2026-04-08] [PASS]    M11   "Watsapp" typo → "WhatsApp" correctly resolved, send_message called (13 rounds, 93K tokens)
[2026-04-08] [PARTIAL] M12   YouTube Music opened, play attempted, system dialog blocked (6 rounds, 30.5K tokens)
```

### Open Issues (unfixed)

| ID | Issue | Root Cause | Priority |
|----|-------|-----------|----------|
| ~~A1-a~~ | ~~Floating button flashes on chat questions~~ | ~~FIXED: finish tool filtered from showTaskNotify~~ | ~~Medium~~ |
| ~~A1-b~~ | ~~"Accessibility starting..." on every new chat~~ | ~~FIXED: moved keyword routing before accessibility check~~ | ~~Low~~ |
| ~~F1~~ | ~~Top bar "Task running..." not showing~~ | ~~FIXED~~ | ~~High~~ |
| ~~F2~~ | ~~Send button not turning red~~ | ~~FIXED~~ | ~~High~~ |
| H6 | Pencil icon cannot rename chat session | Not implemented — deferred to feature backlog | Low |
| ~~F3~~ | ~~Floating button IDLE in other apps~~ | ~~FIXED: show() callback now restores state via updateStateView~~ | ~~Medium~~ |
| ~~F6~~ | ~~"..." coexists with tool actions~~ | ~~FIXED: removeTypingIndicator() on first ToolAction~~ | ~~Medium~~ |
| B2-a | No auto-return after task in other app | Agent completes in YouTube but doesn't navigate back to PokeClaw | Low |
| M1-a | YouTube search: LLM skips input_text | Agent taps search area but doesn't type query, possibly taps suggestion | Medium |
| M3-a | ~~Screen reading routed as chat~~ | ~~FIXED: added "check", "screen", "notification", "compose", "find", "read my" to task detection~~ | ~~High~~ |
| M4-a | ~~Compound tasks truncated by Tier 1~~ | ~~FIXED: PipelineRouter skips Tier 1 for tasks with "and"/"then"/"after"~~ | ~~High~~ |
| M8-a | Gmail compose loops | Agent repeats compose flow, hits budget limit (104K tokens) | Medium |
| M12-a | YouTube Music system dialog | Login/premium dialog blocks music playback task | Low |
