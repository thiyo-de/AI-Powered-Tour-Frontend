(function () {
    const CONFIG = window.AIGuideConfig;

    // --- Module A: TDVBridge (Tour Control) ---
    const TDVBridge = {
        _panoramas: [],
        init: function (callback) {
            const checkReady = () => {
                if (window.tour && window.tour.player && window.tour.player.getById('mainPlayList')) {
                    this._extractPanoramas();
                    if (callback) callback();
                } else {
                    setTimeout(checkReady, 500);
                }
            };
            checkReady();
        },
        _extractPanoramas: function () {
            const items = window.tour.player.getById('mainPlayList').get('items');
            this._panoramas = items.map((item, idx) => {
                const media = item.get('media');
                const data = media.get('data');
                return {
                    id: media.get('id'),
                    label: (data && data.label) ? data.label : 'Panorama ' + (idx + 1),
                    playlistIndex: idx
                };
            });
        },
        navigateByLabel: function (label) {
            if (!label) return false;
            const search = label.toLowerCase().trim();
            
            // 1. Exact match
            let match = this._panoramas.find(p => p.label.toLowerCase() === search);
            
            // 2. Partial/fuzzy match (e.g. "front" matches "Front Entrance")
            if (!match) {
                match = this._panoramas.find(p => p.label.toLowerCase().includes(search));
            }
            if (!match) {
                match = this._panoramas.find(p => search.includes(p.label.toLowerCase()));
            }
            
            if (match) {
                console.log('[TDVBridge] Navigating to:', match.label, '(index:', match.playlistIndex + ')');
                window.tour.setMediaByIndex(match.playlistIndex);
                return true;
            }
            
            // 3. Fallback: use 3DVista's built-in name lookup
            console.log('[TDVBridge] Trying setMediaByName fallback for:', label);
            if (window.tour && window.tour.setMediaByName) {
                window.tour.setMediaByName(label);
                return true;
            }
            
            console.warn('[TDVBridge] Panorama not found:', label);
            return false;
        },
        controlCamera: function (direction, degrees = 45) {
            const root = window.tour._getRootPlayer();
            const viewer = root.getMainViewer();
            const player = root.getActivePlayerWithViewer(viewer);

            let yaw = player.get('yaw');
            let pitch = player.get('pitch');
            const hfov = player.get('hfov');
            const roll = 0; // Usually 0

            if (direction === 'left') yaw -= degrees;
            if (direction === 'right') yaw += degrees;
            if (direction === 'up') pitch -= degrees;
            if (direction === 'down') pitch += degrees;
            if (direction === 'behind') yaw += 180;

            player.moveTo(yaw, pitch, roll, hfov, 1000); // 1000ms animation
        },
        zoomCamera: function (direction, amount = 20) {
            const root = window.tour._getRootPlayer();
            const viewer = root.getMainViewer();
            const player = root.getActivePlayerWithViewer(viewer);

            const yaw = player.get('yaw');
            const pitch = player.get('pitch');
            let hfov = player.get('hfov');
            const roll = 0;

            if (direction === 'in') hfov -= amount;
            if (direction === 'out') hfov += amount;

            // Constrain hfov
            if (hfov < 10) hfov = 10;
            if (hfov > 120) hfov = 120;

            player.moveTo(yaw, pitch, roll, hfov, 1000);
        },
        toggleFullscreen: function () {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        },
        toggleMusic: function () {
            if (window.bgAudio) {
                if (window.bgAudio.paused) {
                    window.bgAudio.play();
                } else {
                    window.bgAudio.pause();
                }
            }
        },
        getCurrentLocation: function () {
            const root = window.tour._getRootPlayer();
            const viewer = root.getMainViewer();
            const media = root.getActiveMediaWithViewer(viewer);
            const data = media.get('data');
            return data && data.label ? data.label : 'Unknown Location';
        },
        // Smooth 360° rotation using requestAnimationFrame — buttery at 60fps
        _rotationFrame: null,
        _rotationCancelled: false,
        lookAround: function (durationMs) {
            const self = this;
            durationMs = durationMs || 14000;
            return new Promise(function (resolve) {
                // ── Hard timeout failsafe ──────────────────────────────────
                // Promise.all in _playCurrentStop can NEVER hang:
                // If RAF silently fails (e.g. player replaced mid-pano), resolve after durationMs+1s
                let resolved = false;
                const safeResolve = () => { if (!resolved) { resolved = true; resolve(); } };
                const safetyTimeout = setTimeout(safeResolve, durationMs + 1000);

                try {
                    const root = window.tour._getRootPlayer();
                    const viewer = root.getMainViewer();
                    const player = root.getActivePlayerWithViewer(viewer);
                    if (!player) { clearTimeout(safetyTimeout); safeResolve(); return; }

                    const startYaw = player.get('yaw');
                    const pitch    = player.get('pitch');
                    const hfov     = player.get('hfov');
                    const startTime = performance.now();
                    self._rotationCancelled = false;

                    function tick(now) {
                        // ── FIX: RAF tick has its own try-catch ──────────────────────
                        // Errors inside RAF are NOT caught by outer try-catch.
                        // Without this, a setPosition() crash = Promise hangs forever = tour freezes.
                        try {
                            if (self._rotationCancelled) { clearTimeout(safetyTimeout); safeResolve(); return; }

                            const elapsed  = now - startTime;
                            const progress = Math.min(elapsed / durationMs, 1);
                            const eased = progress < 0.5
                                ? 2 * progress * progress
                                : -1 + (4 - 2 * progress) * progress;

                            player.setPosition(startYaw + (360 * eased), pitch, 0, hfov);

                            if (progress < 1) {
                                self._rotationFrame = requestAnimationFrame(tick);
                            } else {
                                self._rotationFrame = null;
                                clearTimeout(safetyTimeout);
                                safeResolve();
                            }
                        } catch (rafErr) {
                            // Player was replaced/destroyed mid-rotation (common on pano switch)
                            console.warn('[TDVBridge] Rotation tick error (safe):', rafErr.message);
                            self._rotationFrame = null;
                            clearTimeout(safetyTimeout);
                            safeResolve(); // ← never hangs
                        }
                    }

                    self._rotationFrame = requestAnimationFrame(tick);
                } catch (e) {
                    console.warn('[TDVBridge] lookAround setup error:', e.message);
                    clearTimeout(safetyTimeout);
                    safeResolve();
                }
            });
        },
        cancelRotation: function () {
            this._rotationCancelled = true;
            if (this._rotationFrame) {
                cancelAnimationFrame(this._rotationFrame);
                this._rotationFrame = null;
            }
        },
        openPanoramaList: function () {
            document.dispatchEvent(new CustomEvent('menuItemClick', { detail: { id: 'menu-panorama' } }));
        },
        openMenu: function () {
            // Use the globally exposed window.openMenu patched in menu.js
            if (typeof window.openMenu === 'function') {
                window.openMenu();
            } else {
                // Fallback: fire event so menu.js handles it
                document.dispatchEvent(new CustomEvent('menuItemClick', { detail: { id: 'menu-home' } }));
            }
        },
        // Navigate by playlist index (used by go_back, go_to_start, random_panorama)
        navigateToPanorama: function (index) {
            if (window.tour && typeof window.tour.setMediaByIndex === 'function') {
                window.tour.setMediaByIndex(index);
            }
        },
        // Reset camera to default forward-facing view
        resetView: function () {
            try {
                const root   = window.tour._getRootPlayer();
                const viewer = root.getMainViewer();
                const player = root.getActivePlayerWithViewer(viewer);
                if (player) player.moveTo(0, 0, 0, 90, 800);
            } catch (e) {
                console.warn('[TDVBridge] resetView error:', e.message);
            }
        }
    };

    // --- Module B: API Client ---
    const APIClient = {
        async callChat(message, currentPanorama) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

                const res = await fetch(`${CONFIG.API_URL}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message,
                        session_id: CONFIG.SESSION_ID,
                        current_panorama: currentPanorama,
                        tour_active: !!(TourManager && TourManager.activePlan)
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!res.ok) throw new Error('API Error');
                return await res.json();
            } catch (error) {
                console.error('[API] Chat error:', error);
                return {
                    text: "I'm having trouble connecting right now. Please try again later.",
                    function_calls: [],
                    suggestions: ['Try again'],
                    error: true
                };
            }
        },
        async fetchPanoramas() {
            try {
                const res = await fetch(`${CONFIG.API_URL}/api/tour/panoramas`);
                if (!res.ok) throw new Error('API Error');
                return await res.json();
            } catch (error) {
                console.error('[API] Fetch panoramas error:', error);
                return [];
            }
        },
        async logAnalytics(eventType, eventData) {
            try {
                await fetch(`${CONFIG.API_URL}/api/analytics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: CONFIG.SESSION_ID,
                        event_type: eventType,
                        event_data: eventData
                    })
                });
            } catch (e) { /* ignore analytics errors */ }
        }
    };

    // --- Module C: UI Builder ---
    const UI = {
        panel: null,
        messagesArea: null,
        inputField: null,
        micBtn: null,
        floatingBtn: null,
        subtitleBar: null,
        progressBar: null,
        suggestionsArea: null,
        ttsBtn: null,

        createFloatingButton: function () {
            const btn = document.createElement('div');
            btn.className = 'ai-guide-btn';
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`;
            document.body.appendChild(btn);
            
            this.floatingBtn = btn;

            btn.addEventListener('click', () => {
                if (this.panel.classList.contains('active')) {
                    this.panel.classList.remove('active');
                } else {
                    this.panel.classList.add('active');
                    this.floatingBtn.style.display = 'none'; // Hide when dashboard opens
                    APIClient.logAnalytics('open_panel', {});
                }
            });
            return btn;
        },

        createChatPanel: function () {
            const panel = document.createElement('div');
            panel.className = 'ai-dashboard-overlay';
            panel.innerHTML = `
                <div class="ai-dashboard-grid">
                    <div class="ai-center-stage">
                        <div class="ai-orb-container">
                            <div class="ai-orb-glass">
                                <div class="ai-orb idle"></div>
                            </div>
                        </div>
                        <div class="ai-status-text">Hi, how can I help?</div>
                    </div>
                    <div class="ai-side-panel left">
                        <div class="ai-panel-title">Suggestions</div>
                        <div class="ai-suggestions-list"></div>
                    </div>
                </div>
                <div class="ai-control-dock">
                    <button class="ai-dock-btn close-btn" id="ai-dock-close">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                    <button class="ai-dock-btn" id="ai-dock-keyboard">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>
                    </button>
                    <button class="ai-dock-btn ai-tts-toggle" id="ai-dock-tts" title="Voice: Browser TTS (free) — click to switch">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                        <span class="ai-tts-badge">HD</span>
                    </button>
                    <button class="ai-dock-btn" id="ai-dock-mic">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                    </button>
                </div>
                <div class="ai-keyboard-input">
                    <input type="text" placeholder="Type a message..." id="ai-keyboard-text" />
                    <button id="ai-keyboard-send"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
                </div>
            `;
            document.body.appendChild(panel);

            this.panel = panel;
            this.orb = panel.querySelector('.ai-orb');
            this.orbGlass = panel.querySelector('.ai-orb-glass');
            this.statusText = panel.querySelector('.ai-status-text');
            this.suggestionsArea = panel.querySelector('.ai-suggestions-list');
            this.locationName = panel.querySelector('.ai-location-name');
            this.ttsBtn  = panel.querySelector('#ai-dock-tts');
            this.micBtn  = panel.querySelector('#ai-dock-mic');
            this.inputField = panel.querySelector('#ai-keyboard-text');
            this.keyboardOverlay = panel.querySelector('.ai-keyboard-input');
            
            // Events
            panel.querySelector('#ai-dock-close').addEventListener('click', () => {
                panel.classList.remove('active');
                if (this.floatingBtn) this.floatingBtn.style.display = 'flex';
            });
            panel.querySelector('#ai-dock-keyboard').addEventListener('click', () => {
                this.keyboardOverlay.classList.toggle('active');
                if (this.keyboardOverlay.classList.contains('active')) this.inputField.focus();
            });

            // ── TTS Mode Toggle ────────────────────────────────────────
            if (this.ttsBtn) {
                // Render initial state
                VoiceManager._syncTTSBtn(this.ttsBtn);
                this.ttsBtn.addEventListener('click', () => {
                    const newMode = VoiceManager._useBrowserTTS ? 'ai' : 'browser';
                    VoiceManager.setTTSMode(newMode);
                    VoiceManager._syncTTSBtn(this.ttsBtn);
                    // Persist choice for THIS SESSION ONLY (sessionStorage resets on new tab/load)
                    try { sessionStorage.setItem('ai_guide_tts_mode', newMode); } catch(e) {}
                });
            }

            this.micBtn.addEventListener('click', () => VoiceManager.toggleListening());
            panel.querySelector('#ai-keyboard-send').addEventListener('click', () => ChatManager.handleInputSend());
            this.inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') ChatManager.handleInputSend(); });
        },
    };

    // --- Module D: Chat Manager ---
    const ChatManager = {
        isTyping: false,

        handleInputSend: function () {
            const text = UI.inputField.value.trim();
            if (!text || this.isTyping) return;

            UI.inputField.value = '';
            // Hide keyboard if it was open
            if(UI.keyboardOverlay) UI.keyboardOverlay.classList.remove('active');
            this.sendMessage(text);
        },

        sendMessage: async function (text) {
            // Guard against concurrent calls
            if (this.isTyping) return;
            // Cut any playing audio immediately
            VoiceManager.stopSpeaking();

            // If a guided tour is running, pause it so user can ask freely
            const tourInterrupted = !!(TourManager && TourManager.activePlan && !TourManager._isPaused);
            if (tourInterrupted) TourManager.pause();

            // ── LOCAL INTENT ROUTER ──────────────────────────────────────────────────
            // High-frequency commands handled instantly, no API call.
            // Eliminates rate-limit latency + tool_use_failed errors for tour actions.

            // TOUR START — broad pattern match
            const TOUR_START_RE = /\b(start|begin|give me|take me on|show me|launch)\b.{0,20}\b(tour|guide|around|campus)\b|\b(campus tour|guided tour|tour guide|tour please|tour the campus)\b/i;
            if (!TourManager.activePlan && TOUR_START_RE.test(text)) {
                this.addMessage('user', text);
                this.addMessage('assistant', 'Starting your guided campus tour now!');
                // Set text directly — no typewriter, since tour overwrites status immediately
                if (UI.statusText) UI.statusText.textContent = 'Starting campus tour...';
                if (UI.orb) { UI.orb.classList.remove('thinking'); UI.orb.classList.add('idle'); }
                this.showSuggestions(['Next stop', 'Pause tour', 'Stop the tour']);
                TourManager.start();
                return;
            }

            // TOUR STOP — only when active
            if (TourManager.activePlan && /\b(stop|end|cancel|quit|exit)\b.{0,10}\b(tour|guide)\b|\b(stop the tour|end the tour|cancel tour)\b/i.test(text)) {
                TourManager.stop('user');
                return;
            }

            // TOUR NEXT — single-word affirmatives
            if (TourManager.activePlan && /^\s*(next|continue|go|proceed|ok|okay|yes|sure|alright|yep|next stop)\s*[.!]?\s*$/i.test(text)) {
                TourManager.nextStop();
                return;
            }

            // LOCATION: where am i — local reply, no API
            const lower = text.toLowerCase().trim();
            if (lower === 'where am i?' || lower === 'where am i' || lower === 'where am i now') {
                const loc = TDVBridge.getCurrentLocation();
                const reply = `You're currently at ${loc}.`;
                this.addMessage('user', text);
                this.addMessage('assistant', reply);
                if (CONFIG.VOICE_ENABLED) VoiceManager.speak(reply, reply);
                else if (CONFIG.SUBTITLES_ENABLED) SubtitleManager.showSubtitle(reply);
                if (tourInterrupted && TourManager.activePlan && TourManager._isPaused) {
                    TourManager._scheduleResumeAfterSpeech();
                }
                return;
            }

            this.addMessage('user', text);
            this.showTypingIndicator();
            this.clearSuggestions();
            APIClient.logAnalytics('send_message', { text });

            const currentLoc = TDVBridge.getCurrentLocation();
            const response = await APIClient.callChat(text, currentLoc);

            this.hideTypingIndicator();
            this.displayResponse(response, tourInterrupted);
        },

        addMessage: function (role, content) {
            // Show user input in status — but don't overwrite tour status messages
            if (role === 'user') {
                const isTourActive = TourManager && TourManager.activePlan;
                if (!isTourActive) {
                    UI.statusText.textContent = `"${content}"`;
                }
            }
        },

        // Contextual fallback text when LLM returns only function calls with no text
        _getFallbackText: function (calls) {
            const fallbacks = {
                navigate_to_panorama:  (a) => `Taking you to ${a.location || 'that location'} now!`,
                control_camera:        (a) => `Looking ${a.direction}.`,
                zoom_camera:           (a) => `Zooming ${a.direction}.`,
                toggle_music:          ()  => 'Toggling the background music.',
                toggle_fullscreen:     ()  => 'Switching fullscreen mode.',
                look_around:           ()  => "Let's take a look around!",
                start_guided_tour:     ()  => 'Starting the guided tour now!',
                stop_guided_tour:      ()  => 'Tour stopped. Let me know if you need anything.',
                next_tour_stop:        ()  => 'Moving to the next stop!',
                previous_tour_stop:    ()  => 'Going back to the previous stop!',
                jump_to_tour_stop:     (a) => `Jumping to ${a.location || 'that stop'} now!`,
                open_panorama_list:    ()  => 'Opening the panorama list.',
                close_panorama_list:   ()  => 'Closing the panorama list.',
                open_search:           (a) => a.query ? `Searching for "${a.query}"...` : 'Opening search.',
                open_contact:          ()  => 'Opening the contact information.',
                close_contact:         ()  => 'Closing the contact panel.',
                open_menu:             ()  => 'Opening the menu.',
                close_menu:            ()  => 'Closing the menu.',
                open_street_view:      ()  => 'Opening Google Street View.',
                go_back:               ()  => 'Going back to the previous location.',
                go_to_start:           ()  => 'Heading back to the entrance.',
                random_panorama:       ()  => 'Taking you somewhere new — enjoy the surprise!',
                reset_view:            ()  => 'Camera reset to the default view.',
                set_music_volume:      (a) => a.level === 0 ? 'Music muted.' : `Volume set to ${a.level}%.`,
                open_related_campus:   (a) => `Opening the ${a.campus_name || 'related campus'} virtual tour in a new tab.`,
            };
            const primary = calls[0];
            const fn = fallbacks[primary.name];
            return fn ? fn(primary.args || {}) : '';
        },

        displayResponse: function (response, tourWasInterrupted) {
            // Determine spoken text (with fallback for function-only responses)
            let spokenText = response.text || '';
            if (!spokenText && response.function_calls && response.function_calls.length > 0) {
                spokenText = this._getFallbackText(response.function_calls);
            }

            if (spokenText) {
                if (CONFIG.VOICE_ENABLED) {
                    VoiceManager.speak(spokenText, spokenText);
                } else if (CONFIG.SUBTITLES_ENABLED) {
                    // FIX 4: Use karaoke highlight even when voice is off
                    SubtitleManager.showWordHighlight(spokenText);
                }
            }

            // Track whether a tour function was executed
            let tourFunctionExecuted = false;
            if (response.function_calls && response.function_calls.length > 0) {
                const tourFunctions = ['start_guided_tour', 'stop_guided_tour', 'next_tour_stop'];
                tourFunctionExecuted = response.function_calls.some(c => tourFunctions.includes(c.name));
                FunctionExecutor.execute(response.function_calls);
            }

            // Don't show AI suggestions if a tour function just ran —
            // TourManager renders its own UI in the suggestions area
            if (response.suggestions && response.suggestions.length > 0 && !tourFunctionExecuted) {
                this.showSuggestions(response.suggestions);
            }

            // If tour was interrupted by this message, schedule resume countdown
            // ONLY starts AFTER the AI's voice response finishes — so user gets full 5s
            if (tourWasInterrupted && TourManager && TourManager.activePlan && TourManager._isPaused) {
                TourManager._scheduleResumeAfterSpeech();
            }
        },

        showTypingIndicator: function () {
            this.isTyping = true;
            UI.orb.classList.remove('idle');
            UI.orb.classList.add('thinking');
            UI.statusText.textContent = "Thinking...";
        },

        hideTypingIndicator: function () {
            this.isTyping = false;
            UI.orb.classList.remove('thinking');
            UI.orb.classList.add('idle');
            // FIX 2: Don't blank statusText here — displayResponse() calls speak() immediately
            // after, which renders the subtitle synchronously. Clearing here causes a visible
            // blank flash between "Thinking..." ending and the subtitle appearing.
        },

        showSuggestions: function (suggestions) {
            this.clearSuggestions();
            const sidePanel = document.querySelector('.ai-side-panel.left');
            if (suggestions.length > 0 && sidePanel) sidePanel.style.display = 'flex';
            suggestions.forEach(text => {
                const chip = document.createElement('button');
                chip.className = 'ai-suggestion-chip';
                chip.textContent = text;
                // FIX 1: Guard chip clicks — isTyping check prevents concurrent requests
                chip.addEventListener('click', () => {
                    if (this.isTyping) return;
                    this.sendMessage(text);
                });
                UI.suggestionsArea.appendChild(chip);
            });
        },

        clearSuggestions: function () {
            UI.suggestionsArea.innerHTML = '';
            const sidePanel = document.querySelector('.ai-side-panel.left');
            if (sidePanel) sidePanel.style.display = 'none';
        }
    };

    // --- Module E: Voice Manager ---
    const VoiceManager = {
        recognition: null,
        isListening: false,
        synth: window.speechSynthesis,
        _useBrowserTTS: true,  // ← DEFAULT: browser TTS (free). Overridden by init() if user chose AI HD.
        _browserSpeaking: false, // visual state only (orb animation)
        _currentSpeechPromise: null, // resolves when current browser utterance truly ends
        _audioContext: null,
        _analyser: null,
        _source: null,
        _animationFrame: null,

        init: function () {
            // Always default to browser TTS on every page load (saves Groq quota).
            // sessionStorage is used only to recall a switch made in THE SAME SESSION —
            // closing/refreshing the tab always resets back to browser TTS.
            const sessionMode = (() => {
                try { return sessionStorage.getItem('ai_guide_tts_mode'); } catch(e) { return null; }
            })();
            // Clear any stale localStorage value from old versions
            try { localStorage.removeItem('ai_guide_tts_mode'); } catch(e) {}

            this._useBrowserTTS = (sessionMode !== 'ai'); // null → true (browser)
            console.log(`[VoiceManager] TTS mode: ${this._useBrowserTTS ? '🔊 Browser TTS (default, 0 quota)' : '✨ AI HD (Groq Orpheus, user switched)'}`);
            // Sync toggle button state
            if (UI.ttsBtn) this._syncTTSBtn(UI.ttsBtn);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = false;
                this.recognition.interimResults = false;

                this.recognition.onstart = () => {
                    this.isListening = true;
                    UI.micBtn.classList.add('active');
                    UI.orb.classList.remove('idle');
                    UI.orb.classList.add('listening');
                    UI.statusText.textContent = "I'm listening...";
                };

                this.recognition.onend = () => {
                    this.isListening = false;
                    UI.micBtn.classList.remove('active');
                    UI.orb.classList.remove('listening');
                    UI.orb.classList.add('idle');
                    if (UI.statusText.textContent === "I'm listening...") UI.statusText.textContent = "";
                };

                this.recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    UI.inputField.value = transcript;
                    UI.statusText.textContent = `"${transcript}"`;
                    ChatManager.handleInputSend();
                };

                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    this.isListening = false;
                    UI.micBtn.classList.remove('active');
                    UI.orb.classList.remove('listening');
                    UI.orb.classList.add('idle');
                };
            } else {
                UI.micBtn.style.display = 'none'; // hide if not supported
            }
        },

        toggleListening: function () {
            if (!this.recognition) return;
            if (this.isListening) {
                this.recognition.stop();
            } else {
                this.stopSpeaking();
                this.recognition.start();
            }
        },

        // Split text into sentences for fast playback
        _splitSentences: function (text) {
            return text.match(/[^.!?]+[.!?]+/g) || [text];
        },

        // FIX 3: speak() now accepts subtitleText — CC fires on audio onplay, not before
        speak: function (text, subtitleText) {
            this.stopSpeaking();
            this._cancelled = false;

            // If Groq TTS exhausted, use browser directly
            if (this._useBrowserTTS) {
                this._browserSpeak(text, subtitleText);
                return;
            }

            // Split into sentences — first sentence plays FAST, rest queue up
            const sentences = this._splitSentences(text);
            this._speakQueue(sentences, 0, subtitleText);
        },

        // Play sentences one by one via Groq TTS
        // Play sentences one by one via Groq TTS
        // OPT-2: inter-sentence delay prevents rapid-fire 429 cascades (10 RPM/key × 3 keys)
        _speakQueue: function (sentences, index, subtitleText) {
            if (this._cancelled || index >= sentences.length) return;

            const sentence = sentences[index].trim();
            if (!sentence) { this._speakQueue(sentences, index + 1, subtitleText); return; }

            const apiUrl = CONFIG.API_BASE + '/tts';
            const self = this;

            // Schedule pre-fetch of the NEXT sentence (runs 2.1s after this one starts)
            const scheduleNextPrefetch = () => {
                if (index + 1 < sentences.length) {
                    const next = sentences[index + 1].trim();
                    if (next && !self._prefetchedBlob) {
                        setTimeout(() => {
                            if (self._cancelled) return;
                            fetch(apiUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text: next })
                            })
                                .then(r => r.ok ? r.blob() : null)
                                .then(blob => { self._prefetchedBlob = blob; })
                                .catch(() => {});
                        }, 2100);
                    }
                }
            };

            // Core: fetch blob for this sentence then play it
            const run = () => {
                if (self._cancelled) return;
                self._prefetchedBlob = null;

                const getBlob = (self._prefetchedBlobForIndex === index && self._prefetchedBlob)
                    ? Promise.resolve(self._prefetchedBlob)
                    : fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: sentence })
                    }).then(response => {
                        if (response.status === 429) {
                            console.warn('[TTS] Groq limit reached. Switching to browser TTS.');
                            self._useBrowserTTS = true;
                            if (UI.ttsBtn) VoiceManager._syncTTSBtn(UI.ttsBtn);
                            const remaining = sentences.slice(index).join(' ');
                        // FIX 3: Always pass the full subtitle for Groq→browser fallback
                        self._browserSpeak(remaining, subtitleText || remaining);
                            return null;
                        }
                        if (!response.ok) throw new Error('TTS failed');
                        return response.blob();
                    });

                scheduleNextPrefetch();

                getBlob
                    .then(blob => {
                        if (!blob || self._cancelled) return;
                        const audioUrl = URL.createObjectURL(blob);
                        self._currentAudio = new Audio(audioUrl);
                        self._currentAudio.playbackRate = 1.30;
                        self._currentAudio.crossOrigin = 'anonymous';

                        // Karaoke: render this sentence's words as highlight spans
                        let groqWordMap = [];
                        self._currentAudio.onplay = () => {
                            if (UI.orb) UI.orb.classList.add('speaking');
                            self._startVisualizer(self._currentAudio);
                            // Show full subtitle text on first sentence, then per-sentence karaoke
                            if (CONFIG.SUBTITLES_ENABLED) {
                                groqWordMap = SubtitleManager.showWordHighlight(
                                    index === 0 && subtitleText ? subtitleText : sentence
                                );
                            }
                        };

                        // timeupdate fires ~4x/sec — estimate current word from playback progress
                        self._currentAudio.addEventListener('timeupdate', () => {
                            if (!groqWordMap.length || !self._currentAudio) return;
                            const dur = self._currentAudio.duration;
                            if (!dur || isNaN(dur)) return;
                            const progress = self._currentAudio.currentTime / dur;
                            // Map playback progress to a char position in the displayed text
                            const displayText = (index === 0 && subtitleText) ? subtitleText : sentence;
                            const estimatedChar = Math.floor(progress * displayText.length);
                            SubtitleManager.highlightWord(estimatedChar, groqWordMap);
                        });

                        self._currentAudio.onended = () => {
                            if (UI.orb) {
                                UI.orb.classList.remove('speaking');
                                UI.orb.style.transform = '';
                            }
                            SubtitleManager.clearWordHighlight();
                            self._stopVisualizer();
                            URL.revokeObjectURL(audioUrl);
                            self._currentAudio = null;
                        // FIX 5: Always propagate subtitleText through the queue.
                        // Passing null for index>0 means subsequent sentences never get karaoke.
                        // Each sentence shows its own text as the subtitle instead.
                        self._speakQueue(sentences, index + 1, subtitleText);
                        };
                        self._currentAudio.play();

                    })
                    .catch(err => {
                        console.warn('[TTS] Falling back to browser:', err.message);
                        const remaining = sentences.slice(index).join(' ');
                        // FIX 3b: catch() path also gets subtitle
                        self._browserSpeak(remaining, subtitleText || remaining);
                    });
            };

            // ── OPT-2: Rate-limit stagger ─────────────────────────────────
            // Sentence 0 fires immediately. Sentences 1+ wait 2.1s so we never
            // exceed 10 RPM/key. With 3 keys: effectively 1 safe req/~2s total.
            if (index === 0) {
                run();
            } else {
                setTimeout(() => { if (!self._cancelled) run(); }, 2100);
            }
        },


        // Browser speech synthesis
        // Returns a Promise that resolves when the utterance truly ends.
        _browserSpeak: function (text, subtitleText) {
            if (!this.synth) {
                this._currentSpeechPromise = Promise.resolve();
                return;
            }

            // Only cancel previous speech when no tour is active.
            if (!TourManager.activePlan) {
                this.synth.cancel();
                this._browserSpeaking = false;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            const voices = this.synth.getVoices();
            const preferred = voices.find(v => v.name.includes('Microsoft Zira') || v.name.includes('Google UK English Female') || v.lang.includes('en-GB')) || voices.find(v => v.lang.includes('en-US'));
            if (preferred) utterance.voice = preferred;
            utterance.rate = 0.95;
            utterance.pitch = 1.05;

            // ── FIX 1: Show subtitle SYNCHRONOUSLY ────────────────────────────────
            // If we wait for onstart, Chrome's silent-drop bug means subtitle never
            // appears (onstart never fires). Show word spans immediately so the user
            // always sees the text — onboundary then highlights them word by word.
            const displayText = subtitleText || text; // always have something to show
            let wordMap = [];
            if (displayText && CONFIG.SUBTITLES_ENABLED) {
                wordMap = SubtitleManager.showWordHighlight(displayText);
            }

            this._currentSpeechPromise = new Promise(resolve => {
                let started = false;

                // ── 2-second start watchdog ────────────────────────────────
                // Chrome bug: synth.cancel() + immediate synth.speak() can silently
                // drop the utterance (onend/onerror never fire). If onstart hasn't
                // fired within 2s, the utterance was dropped — resolve anyway.
                const startWatchdog = setTimeout(() => {
                    if (!started) {
                        console.warn('[TTS] Utterance start timeout — browser may have dropped it (Chrome cancel bug)');
                        done();
                    }
                }, 2000);

                const done = () => {
                    clearTimeout(startWatchdog);
                    this._browserSpeaking = false;
                    SubtitleManager.clearWordHighlight(); // remove karaoke highlight
                    if (UI.orb) { UI.orb.classList.remove('speaking'); UI.orb.classList.add('idle'); }
                    if (UI.orbGlass) { UI.orbGlass.classList.remove('browser-tts-pulse'); UI.orbGlass.style.transform = ''; }
                    resolve();
                };

                utterance.onstart = () => {
                    started = true;
                    clearTimeout(startWatchdog); // utterance started OK
                    this._browserSpeaking = true;
                    if (UI.orb) { UI.orb.classList.remove('idle'); UI.orb.classList.add('speaking'); }
                    if (UI.orbGlass) UI.orbGlass.classList.add('browser-tts-pulse');
                    // subtitle already rendered synchronously above — nothing to do here
                };
                // Highlight each word as the browser reads it
                utterance.onboundary = (event) => {
                    if (event.name === 'word' && wordMap.length > 0) {
                        SubtitleManager.highlightWord(event.charIndex, wordMap);
                    }
                };
                utterance.onend   = done;
                utterance.onerror = (e) => { console.warn('[TTS] Browser utterance error:', e.error); done(); };
            });

            // ── FIX: Chrome cancel() + speak() silent-drop bug ────────────────
            // Calling synth.speak() in the same tick as synth.cancel() causes Chrome
            // to silently drop the new utterance. Deferring by one event-loop tick
            // (setTimeout 0) lets the cancel settle before the next speak().
            setTimeout(() => this.synth.speak(utterance), 0);
        },

        _startVisualizer: function(audioElement) {
            try {
                if (!this._audioContext) {
                    this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    this._analyser = this._audioContext.createAnalyser();
                    this._analyser.fftSize = 256;
                }
                
                if (this._audioContext.state === 'suspended') {
                    this._audioContext.resume();
                }

                // Connect source
                this._source = this._audioContext.createMediaElementSource(audioElement);
                this._source.connect(this._analyser);
                this._analyser.connect(this._audioContext.destination);

                const dataArray = new Uint8Array(this._analyser.frequencyBinCount);
                
                // Add smoothing (lerp) variable
                let currentScale = 1.0;

                const renderFrame = () => {
                    this._animationFrame = requestAnimationFrame(renderFrame);
                    this._analyser.getByteFrequencyData(dataArray);
                    
                    // Find the peak volume instead of average
                    let peak = 0;
                    for(let i=0; i<dataArray.length; i++) {
                        if (dataArray[i] > peak) peak = dataArray[i];
                    }
                    
                    // Map peak (0-255) to target scale (1.0 to 1.15)
                    const targetScale = 1.0 + Math.pow((peak / 255), 1.5) * 0.15;
                    
                    // Smooth lerp (linear interpolation) to prevent jitter
                    // Moves 20% of the way to the target scale every frame (approx 60fps)
                    currentScale += (targetScale - currentScale) * 0.2;
                    
                    if (UI.orbGlass) {
                        UI.orbGlass.style.transform = `scale(${currentScale})`;
                    }
                };
                renderFrame();
            } catch (e) {
                console.warn("[TTS] Visualizer failed to start", e);
            }
        },

        _stopVisualizer: function() {
            if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
            if (this._source) {
                this._source.disconnect();
                this._source = null;
            }
        },

        // Set TTS mode programmatically ('browser' | 'ai')
        setTTSMode: function (mode) {
            this._useBrowserTTS = (mode !== 'ai');
            console.log(`[VoiceManager] TTS mode switched to: ${mode}`);
            // If AI mode, reset the TTS-exhausted flag so Groq is tried again
            if (!this._useBrowserTTS) this._useBrowserTTS = false;
        },

        // Sync the dock button label/style to current mode
        _syncTTSBtn: function (btn) {
            if (!btn) return;
            const badge = btn.querySelector('.ai-tts-badge');
            if (this._useBrowserTTS) {
                btn.classList.remove('ai-tts-active');
                btn.title = 'Voice: Browser TTS (free) — click for AI HD Voice';
                if (badge) badge.style.display = 'none';
            } else {
                btn.classList.add('ai-tts-active');
                btn.title = 'Voice: AI HD (Groq Orpheus) — click for Browser TTS';
                if (badge) badge.style.display = 'flex';
            }
        },

        stopSpeaking: function () {
            this._cancelled = true;
            this._browserSpeaking = false;
            this._currentSpeechPromise = null; // discard pending utterance promise
            this._prefetchedBlob = null;
            if (UI.orb) { UI.orb.classList.remove('speaking'); UI.orb.classList.add('idle'); }
            if (UI.orbGlass) { UI.orbGlass.classList.remove('browser-tts-pulse'); UI.orbGlass.style.transform = ''; }
            this._stopVisualizer();
            if (this._currentAudio) { this._currentAudio.pause(); this._currentAudio = null; }
            if (this.synth && this.synth.speaking) this.synth.cancel();
        }
    };

    // --- Module F: Subtitle Manager ---
    const SubtitleManager = {
        timeoutId: null,
        _typewriterInterval: null,

        showSubtitle: function (text) {
            // Cancel any in-progress typewriter before starting a new one
            if (this._typewriterInterval) {
                clearInterval(this._typewriterInterval);
                this._typewriterInterval = null;
            }
            this.typewriterEffect(text, UI.statusText, 30);

            if (this.timeoutId) clearTimeout(this.timeoutId);

            // Auto hide based on text length (min 5s)
            const hideDelay = Math.max(5000, text.length * 80);
            this.timeoutId = setTimeout(() => {
                this.hideSubtitle();
            }, hideDelay);
        },

        // ── Karaoke word highlight ────────────────────────────────────────
        // Renders spoken text as individual <span> elements so each word
        // can be lit up via .tts-word-active when utterance.onboundary fires.
        // Returns a wordMap array [{word, start}] for onboundary lookups.
        showWordHighlight: function (text) {
            if (!UI.statusText || !text) return [];
            if (this._typewriterInterval) {
                clearInterval(this._typewriterInterval);
                this._typewriterInterval = null;
            }

            // Split text preserving spaces between words
            const parts = text.split(/(\s+)/);
            let pos = 0;
            let wordIndex = 0;
            let html = '';
            const wordMap = [];

            for (const part of parts) {
                if (part.trim()) {
                    html += `<span class="tts-word" data-word="${wordIndex}">${part}</span>`;
                    wordMap.push({ start: pos, length: part.length, index: wordIndex });
                    wordIndex++;
                } else {
                    html += part; // spaces as plain text
                }
                pos += part.length;
            }

            UI.statusText.innerHTML = html;
            return wordMap;
        },

        // Highlight the word at charIndex, clear the previous active word
        highlightWord: function (charIndex, wordMap) {
            if (!UI.statusText || !wordMap || wordMap.length === 0) return;
            let activeIdx = 0;
            for (let i = 0; i < wordMap.length; i++) {
                if (wordMap[i].start <= charIndex) activeIdx = i;
                else break;
            }
            const spans = UI.statusText.querySelectorAll('.tts-word');
            spans.forEach((el, i) => {
                el.classList.toggle('tts-word-active', i === activeIdx);
            });
            // Auto-scroll: keep the active word visible inside the status container
            const activeEl = spans[activeIdx];
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        },

        // Clear all word highlights (call on utterance end)
        clearWordHighlight: function () {
            if (!UI.statusText) return;
            UI.statusText.querySelectorAll('.tts-word').forEach(el => el.classList.remove('tts-word-active'));
        },

        hideSubtitle: function () {
            if (this._typewriterInterval) {
                clearInterval(this._typewriterInterval);
                this._typewriterInterval = null;
            }
            UI.statusText.textContent = '';
        },

        typewriterEffect: function (text, element, speed) {
            // Cancel any existing typewriter animation
            if (this._typewriterInterval) {
                clearInterval(this._typewriterInterval);
                this._typewriterInterval = null;
            }
            element.textContent = '';
            let i = 0;
            this._typewriterInterval = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(this._typewriterInterval);
                    this._typewriterInterval = null;
                }
            }, speed);
        }
    };

    // --- Module G: Function Executor ---
    const FunctionExecutor = {
        execute: function (calls) {
            for (const call of calls) {
                console.log('[FunctionExecutor] Executing:', call.name, call.args);

                try {
                    switch (call.name) {

                        // ── Original 12 ──────────────────────────────────────────
                        case 'navigate_to_panorama':
                            TDVBridge.navigateByLabel(call.args.location);
                            break;
                        case 'control_camera':
                            TDVBridge.controlCamera(call.args.direction, call.args.degrees);
                            break;
                        case 'zoom_camera':
                            TDVBridge.zoomCamera(call.args.direction, call.args.amount);
                            break;
                        case 'toggle_fullscreen':
                            TDVBridge.toggleFullscreen();
                            break;
                        case 'toggle_music':
                            TDVBridge.toggleMusic();
                            break;
                        case 'get_current_location': {
                            const loc = TDVBridge.getCurrentLocation();
                            console.log('[FunctionExecutor] Current location:', loc);
                            break;
                        }
                        case 'start_guided_tour':
                            // Delay start so any preceding speech utterance (e.g. "Starting tour now!")
                            // has time to fire synth.speak() before TourManager.start() cancels it.
                            UI.statusText.textContent = 'Starting tour...';
                            if (UI.orb) { UI.orb.classList.remove('thinking'); UI.orb.classList.add('idle'); }
                            setTimeout(() => TourManager.start(call.args.tour_name), 600);
                            break;
                        case 'stop_guided_tour':
                            TourManager.stop('user');
                            break;
                        case 'next_tour_stop':
                            TourManager.nextStop();
                            break;
                        case 'open_panorama_list':
                            TDVBridge.openPanoramaList();
                            break;
                        case 'open_menu':
                            TDVBridge.openMenu();
                            break;
                        case 'look_around':
                            TDVBridge.lookAround();
                            break;

                        // ── F13: close_panorama_list ─────────────────────────────
                        case 'close_panorama_list':
                            if (document.getElementById('pano-modal-container')?.classList.contains('show'))
                                window.togglePanoList?.();
                            break;

                        // ── F15: open_search ─────────────────────────────────────
                        case 'open_search':
                            if (!window.SearchBox?.classList.contains('show')) window.toggleSearchBox?.();
                            if (call.args && call.args.query) {
                                const inp = document.getElementById('searchInput');
                                if (inp) { inp.value = call.args.query; inp.dispatchEvent(new Event('input')); }
                            }
                            break;

                        // ── F16: open_contact ────────────────────────────────────
                        case 'open_contact':
                            window.openContact?.();
                            break;

                        // ── F17: close_contact ───────────────────────────────────
                        case 'close_contact':
                            window.closeContact?.();
                            break;

                        // ── F19: close_menu ──────────────────────────────────────
                        case 'close_menu':
                            window.closeMenu?.();
                            break;

                        // ── F20: open_street_view ────────────────────────────────
                        case 'open_street_view':
                            window.openGsvPopup?.();
                            break;

                        // ── F21: go_back ─────────────────────────────────────────
                        case 'go_back': {
                            const panoramas = TDVBridge._panoramas;
                            const currIdx = panoramas.findIndex(p =>
                                p.label === TDVBridge.getCurrentLocation()
                            );
                            const prevIdx = currIdx > 0 ? currIdx - 1 : 0;
                            if (currIdx <= 0) {
                                ChatManager.showSuggestions(["You're at the first location."]);
                            } else {
                                TDVBridge.navigateToPanorama(panoramas[prevIdx].playlistIndex);
                            }
                            break;
                        }

                        // ── F22: go_to_start ─────────────────────────────────────
                        case 'go_to_start':
                            TDVBridge.navigateToPanorama(0);
                            break;

                        // ── F23: random_panorama ─────────────────────────────────
                        case 'random_panorama': {
                            const panos = TDVBridge._panoramas;
                            if (panos.length > 0) {
                                const currLoc = TDVBridge.getCurrentLocation();
                                const currI   = panos.findIndex(p => p.label === currLoc);
                                let rnd;
                                do { rnd = Math.floor(Math.random() * panos.length); }
                                while (rnd === currI && panos.length > 1);
                                TDVBridge.navigateToPanorama(panos[rnd].playlistIndex);
                            }
                            break;
                        }

                        // ── F24: previous_tour_stop ──────────────────────────────
                        case 'previous_tour_stop':
                            if (TourManager.activePlan) {
                                TourManager.prevStop();
                            } else {
                                UI.statusText.textContent = 'No guided tour is currently active.';
                            }
                            break;

                        // ── F25: jump_to_tour_stop ───────────────────────────────
                        case 'jump_to_tour_stop': {
                            if (TourManager.activePlan) {
                                const panos = TDVBridge._panoramas;
                                const idx = panos.findIndex(p =>
                                    p.label.toLowerCase().includes((call.args.location || '').toLowerCase())
                                );
                                if (idx >= 0) {
                                    TourManager.currentStopIndex = idx; // _playCurrentStop reads index directly
                                    TourManager._playCurrentStop();
                                } else {
                                    UI.statusText.textContent = `No stop found for "${call.args.location}".`;
                                }
                            } else {
                                UI.statusText.textContent = 'No guided tour is currently active. Say "Start the tour" first.';
                            }
                            break;
                        }

                        // ── F26: reset_view ──────────────────────────────────────
                        case 'reset_view':
                            TDVBridge.resetView();
                            break;

                        // ── F27: set_music_volume ────────────────────────────────
                        case 'set_music_volume':
                            if (window.bgAudio) {
                                const vol = Math.max(0, Math.min(100, Number(call.args.level) || 0));
                                window.bgAudio.volume = vol / 100;
                                // If muting, pause; if un-muting and paused, play
                                if (vol === 0 && !window.bgAudio.paused) window.bgAudio.pause();
                                else if (vol > 0 && window.bgAudio.paused) window.bgAudio.play();
                            }
                            break;

                        // ── F28: open_related_campus ─────────────────────────────
                        case 'open_related_campus': {
                            const campuses = window.relatedCampuses || [];
                            const query = (call.args.campus_name || '').toLowerCase();
                            const match = campuses.find(c => c.title.toLowerCase().includes(query));
                            if (match) {
                                window.open(match.url, '_blank');
                            } else {
                                const names = campuses.map(c => c.title).join(', ');
                                UI.statusText.textContent = names
                                    ? `Available campuses: ${names}`
                                    : 'No related campuses configured.';
                            }
                            break;
                        }

                    }
                } catch (e) {
                    console.error(`[FunctionExecutor] Failed to execute ${call.name}:`, e);
                }
            }
        }
    };

    // --- Module H: Tour Manager (Guided Tours) ---
    // The tour sequence ALWAYS follows the exact dynamic panolist order
    // from TDVBridge._panoramas (extracted at runtime from the 3DVista engine).
    const TourManager = {
        activePlan: null,
        currentStopIndex: 0,
        advanceTimeout: null,
        _narrations: {},
        _isPaused: false,
        _resumeCountdown: null,
        _viewerListenerActive: false,
        _interactionDebounce: null,

        // Detect when user manually drags/zooms the panorama during a tour
        _setupViewerInteraction: function () {
            if (this._viewerListenerActive) return;
            const viewer = document.getElementById('viewer');
            if (!viewer) return;

            const handler = this._onViewerInteraction.bind(this);
            // Use capture so we catch events before 3DVista's own handlers
            viewer.addEventListener('mousedown', handler, true);
            viewer.addEventListener('touchstart', handler, true);
            viewer.addEventListener('wheel', handler, true);
            this._viewerListenerActive = true;
            console.log('[TourManager] Viewer interaction listeners attached');
        },

        // Fired on every mousedown/touchstart/wheel on the panorama viewer
        _onViewerInteraction: function () {
            // Only care during an active tour
            if (!this.activePlan) return;

            // If not paused yet, pause now (stops rotation + narration)
            if (!this._isPaused) {
                this.pause();
            }

            // Reset ALL resume timers — user is still exploring
            if (this._resumeCountdown) {
                clearInterval(this._resumeCountdown);
                this._resumeCountdown = null;
            }
            if (this._resumeSpeechDelay) {
                clearTimeout(this._resumeSpeechDelay);
                this._resumeSpeechDelay = null;
            }
            if (this._resumeSpeechWait) {
                clearInterval(this._resumeSpeechWait);
                this._resumeSpeechWait = null;
            }
            if (this._interactionDebounce) {
                clearTimeout(this._interactionDebounce);
            }

            // After 3s of no further interaction, start the 5s countdown
            const self = this;
            this._interactionDebounce = setTimeout(function () {
                if (self.activePlan && self._isPaused) {
                    self.resume(5000);
                }
            }, 3000);
        },


        // Pause tour mid-stop (keeps activePlan so resume works)
        pause: function () {
            if (!this.activePlan || this._isPaused) return;
            this._isPaused = true;
            this._waitingForSpeech = false; // Release any pending _waitForSpeechEnd
            TDVBridge.cancelRotation();
            VoiceManager.stopSpeaking();

            // Show "Paused" UI immediately so user knows they can interact
            const panoramas = TDVBridge._panoramas;
            const pano = panoramas[this.currentStopIndex];
            const panoName = pano ? pano.label : 'current location';
            const planName = this.activePlan ? this.activePlan.name : 'Guided Tour';

            const leftSidePanel = document.querySelector('.ai-side-panel.left');
            if (leftSidePanel) leftSidePanel.style.display = 'flex';

            UI.suggestionsArea.innerHTML = `
                <div class="ai-suggestion-chip" style="background: rgba(255,200,0,0.08); border-color: #FFC800; cursor: default; text-align: center;">
                    <b>${planName}</b> — <span style="color:#FFC800">Paused</span><br/>
                    <span style="opacity:0.7">${panoName}</span><br/>
                    <span style="font-size:0.85em;">Ask me anything! Tour will resume shortly.</span>
                </div>
                <button class="ai-suggestion-chip" id="ai-tour-resume-now-btn" style="color: #00F0FF; border-color: #00F0FF;">&#9654; Resume Now</button>
                <button class="ai-suggestion-chip" id="ai-tour-stop-btn" style="color: #FF4545;">Stop Tour</button>
            `;
            document.getElementById('ai-tour-resume-now-btn')?.addEventListener('click', () => {
                this._isPaused = false;
                this._playCurrentStop();
            });
            document.getElementById('ai-tour-stop-btn')?.addEventListener('click', () => {
                this.stop('user');
            });

            console.log('[TourManager] ⏸ Tour paused at stop', this.currentStopIndex + 1, ':', panoName);
        },

        // Resume after a countdown, replaying the current stop
        resume: function (delayMs) {
            if (!this.activePlan || !this._isPaused) return;
            delayMs = delayMs || 5000;

            // Cancel any previous countdown
            if (this._resumeCountdown) {
                clearInterval(this._resumeCountdown);
                this._resumeCountdown = null;
            }

            let remaining = Math.ceil(delayMs / 1000);
            this._updateResumeUI(remaining); // Show immediately

            this._resumeCountdown = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                    clearInterval(this._resumeCountdown);
                    this._resumeCountdown = null;
                    if (this.activePlan && this._isPaused) {
                        this._isPaused = false;
                        console.log('[TourManager] ▶ Resuming tour from stop', this.currentStopIndex + 1);
                        this._playCurrentStop();
                    }
                } else {
                    this._updateResumeUI(remaining);
                }
            }, 1000);
        },

        // Show countdown UI in the suggestions area
        _updateResumeUI: function (seconds) {
            const panoramas = TDVBridge._panoramas;
            const pano = panoramas[this.currentStopIndex];
            const panoName = pano ? pano.label : 'current location';
            const planName = this.activePlan ? this.activePlan.name : 'Guided Tour';

            const leftSidePanel = document.querySelector('.ai-side-panel.left');
            if (leftSidePanel) leftSidePanel.style.display = 'flex';

            UI.suggestionsArea.innerHTML = `
                <div class="ai-suggestion-chip" style="background: rgba(0,240,255,0.08); border-color: #00F0FF; cursor: default; text-align: center;">
                    <b>${planName}</b><br/>
                    <span style="opacity:0.7">Paused at: ${panoName}</span><br/>
                    <span style="color:#00F0FF; font-size:1.15em; font-weight:600">⏱ Resuming in ${seconds}s…</span>
                </div>
                <button class="ai-suggestion-chip" id="ai-tour-resume-now-btn" style="color: #00F0FF; border-color: #00F0FF;">&#9654; Resume Now</button>
                <button class="ai-suggestion-chip" id="ai-tour-stop-btn" style="color: #FF4545;">Stop Tour</button>
            `;

            document.getElementById('ai-tour-resume-now-btn')?.addEventListener('click', () => {
                if (this._resumeCountdown) clearInterval(this._resumeCountdown);
                this._resumeCountdown = null;
                this._isPaused = false;
                this._playCurrentStop();
            });
            document.getElementById('ai-tour-stop-btn')?.addEventListener('click', () => {
                if (this._resumeCountdown) clearInterval(this._resumeCountdown);
                this._resumeCountdown = null;
                this.stop('user');
            });
        },

        // Wait for AI voice response to finish, THEN show the 5s resume countdown.
        // Has a 2s initial delay so Groq TTS has time to arrive and start playing.
        _scheduleResumeAfterSpeech: function () {
            const self = this;
            if (this._resumeSpeechWait) clearInterval(this._resumeSpeechWait);
            if (this._resumeSpeechDelay) clearTimeout(this._resumeSpeechDelay);

            // 2s buffer — Groq TTS fetch takes 500ms-2s to arrive.
            // Without this, the poller fires at 300ms while _currentAudio is still null,
            // incorrectly concludes speech is done, and starts countdown too early.
            this._resumeSpeechDelay = setTimeout(function () {
                if (!self.activePlan || !self._isPaused) return;

                self._resumeSpeechWait = setInterval(function () {
                    if (!self.activePlan || !self._isPaused) {
                        clearInterval(self._resumeSpeechWait);
                        self._resumeSpeechWait = null;
                        return;
                    }
                    const groqPlaying = VoiceManager._currentAudio && !VoiceManager._currentAudio.paused;
                    const browserPlaying = VoiceManager.synth && VoiceManager.synth.speaking;
                    if (!groqPlaying && !browserPlaying) {
                        clearInterval(self._resumeSpeechWait);
                        self._resumeSpeechWait = null;
                        if (self.activePlan && self._isPaused) {
                            self.resume(5000);
                        }
                    }
                }, 300);
            }, 2000);
        },

        start: async function (tourName) {
            this.stop('silent'); // Stop any existing tour silently
            this._setupViewerInteraction(); // Listen for manual pano interaction

            // The tour sequence comes from the DYNAMIC panolist
            const panoramas = TDVBridge._panoramas;
            if (!panoramas || panoramas.length === 0) {
                console.warn('[TourManager] No panoramas available from TDVBridge');
                VoiceManager.speak('I\'m sorry, I couldn\'t load the panorama list. Please try again in a moment.', true);
                return;
            }

            // ALWAYS start from the very first panorama in panolist order
            this.currentStopIndex = 0;
            this.activePlan = { name: tourName || 'Full Campus Tour', description: 'Complete guided tour' };

            // Update panel title to show tour is running
            const leftPanelTitle = document.querySelector('.ai-side-panel.left .ai-panel-title');
            if (leftPanelTitle) leftPanelTitle.textContent = 'Guided Tour';

            // Make sure the AI panel is open so user can see tour progress
            if (UI.panel && !UI.panel.classList.contains('active')) {
                UI.panel.classList.add('active');
                if (UI.floatingBtn) UI.floatingBtn.style.display = 'none';
            }

            // Show the left side panel immediately so chip appears before navigation
            const leftSidePanel = document.querySelector('.ai-side-panel.left');
            if (leftSidePanel) leftSidePanel.style.display = 'flex';

            console.log('[TourManager] Starting tour with', panoramas.length, 'stops in panolist order');

            // _playCurrentStop() owns ALL navigation — no double-navigate here
            this._playCurrentStop();

            // ── Hardcoded narrations — zero API calls, zero glitching ──────────
            // Written from actual campus data. Tour runs 100% on-device.
            this._narrations = {
                '0': "Welcome to Mount Zion International School! We're starting our tour right here at the Main Entrance — the gateway where over a thousand students begin their learning journey every single morning. Notice the warm, welcoming design that sets the tone for everything inside.",
                '1': "Here we are at the Sports Facility — a sprawling ground that comes alive with energy every day. From football matches to athletic training, this is where students build teamwork, discipline, and physical fitness. The school regularly hosts inter-school tournaments right on this very ground!",
                '2': "This is the Front Entrance of our main academic building. The architecture blends modern design with practical, student-friendly spaces. Behind this facade are all the major classrooms, offices, and facilities that make up the heart of academic life at Mount Zion.",
                '3': "Welcome to the School Courtyard — truly the soul of campus life! Every morning, the entire school gathers here for assembly. Cultural programs, annual day celebrations, and spontaneous games during break time all happen in this vibrant open space connecting every wing of the school.",
                '4': "Step into the Computer Lab — a state-of-the-art facility equipped with modern systems and high-speed internet. What's impressive is that coding is taught here from as early as Grade Three! This lab reflects the school's commitment to preparing students for a technology-driven world.",
                '5': "This is the Chemistry Lab, where science truly comes to life. Students perform over thirty different experiments every academic year, following all CBSE safety standards with individual workstations, a fume hood, and fully stocked equipment benches. Learning by doing is the motto here!",
                '6': "Ahh — the Library. A quiet sanctuary housing over five thousand books spanning every subject and reading level. There's even a dedicated children's section for the youngest readers. Whether it's research, reference, or just getting lost in a story — this space nurtures the love of learning.",
                '7': "And finally, our Kindergarten Classroom — a colorful, joyful space designed for the youngest minds on campus. Play-based learning is the philosophy here, with interactive boards, art supplies, learning aids, and age-appropriate furniture that makes every day an adventure for our little ones."
            };
            console.log('[TourManager] Narrations loaded: 8 stops (hardcoded, offline)');

            APIClient.logAnalytics('tour_started', { tourName: this.activePlan?.name, totalStops: panoramas.length });
        },

        nextStop: function () {
            if (!this.activePlan) return;

            this.currentStopIndex++;
            const panoramas = TDVBridge._panoramas;

            if (this.currentStopIndex >= panoramas.length) {
                // ── Tour complete ──────────────────────────────────────────
                const completionMsg = `That concludes our guided tour of Mount Zion International School — all ${panoramas.length} locations visited! I hope you enjoyed the experience. Feel free to explore any area further or ask me anything about the campus.`;
                this.stop('silent');  // Reset state silently first
                // Then speak + show completion message
                if (CONFIG.VOICE_ENABLED) VoiceManager.speak(completionMsg, completionMsg);
                else if (CONFIG.SUBTITLES_ENABLED) SubtitleManager.showSubtitle(completionMsg);
                ChatManager.showSuggestions(['Show me the Library', 'Where am I?', 'Start tour again']);
                APIClient.logAnalytics('tour_completed', { totalStops: panoramas.length });
                return;
            }

            this._playCurrentStop();
        },

        // Go back one stop — replay the previous stop with narration
        prevStop: function () {
            if (!this.activePlan) return;
            if (this.currentStopIndex > 0) {
                // _playCurrentStop reads currentStopIndex directly — just decrement by 1
                this.currentStopIndex = Math.max(0, this.currentStopIndex - 1);
                this._playCurrentStop();
            } else {
                UI.statusText.textContent = "You're already at the first stop of the tour.";
            }
        },

        // stop(reason) — 'silent': no voice/CC (used internally)
        //              — 'user': user cancelled (plays goodbye)
        //              — default/undefined: stopped by system
        stop: function (reason) {
            const wasActive = !!this.activePlan;

            // Clear pause countdown and speech-wait timers if running
            if (this._resumeCountdown) {
                clearInterval(this._resumeCountdown);
                this._resumeCountdown = null;
            }
            if (this._resumeSpeechWait) {
                clearInterval(this._resumeSpeechWait);
                this._resumeSpeechWait = null;
            }
            if (this._resumeSpeechDelay) {
                clearTimeout(this._resumeSpeechDelay);
                this._resumeSpeechDelay = null;
            }
            if (this._interactionDebounce) {
                clearTimeout(this._interactionDebounce);
                this._interactionDebounce = null;
            }
            this._isPaused = false;

            // Clear all tour state
            this.activePlan = null;
            this._narrations = {};
            this._waitingForSpeech = false;
            if (this.advanceTimeout) clearTimeout(this.advanceTimeout);
            TDVBridge.cancelRotation();
            VoiceManager.stopSpeaking();

            // Restore UI
            const leftPanelTitle = document.querySelector('.ai-side-panel.left .ai-panel-title');
            if (leftPanelTitle) leftPanelTitle.textContent = 'Suggestions';

            if (reason !== 'silent' && wasActive) {
                const byeMsg = reason === 'user'
                    ? 'Tour stopped! You can explore freely or ask me to start again anytime.'
                    : 'The guided tour has ended. Let me know if you\'d like to explore more!';
                if (CONFIG.VOICE_ENABLED) VoiceManager.speak(byeMsg, byeMsg);
                else if (CONFIG.SUBTITLES_ENABLED) SubtitleManager.showSubtitle(byeMsg);
                ChatManager.showSuggestions(['Start tour again', 'Where am I?', 'Show me the Library']);
            } else {
                ChatManager.clearSuggestions();
            }

            APIClient.logAnalytics('tour_stopped', { reason: reason || 'system' });
        },

        _waitingForSpeech: false,

        // Waits for TTS (Groq or browser) to finish speaking
        _waitForSpeechEnd: function () {
            const self = this;
            return new Promise(function (resolve) {
                self._waitingForSpeech = true;

                // ── Hard max wait: 60s failsafe ──────────────────────────────
                // Tour NEVER stays stuck forever regardless of TTS state.
                let done = false;
                const finish = () => { if (!done) { done = true; self._waitingForSpeech = false; resolve(); } };
                const maxWait = setTimeout(finish, 60000);

                // ── Groq TTS: poll _currentAudio ───────────────────────────
                if (!VoiceManager._useBrowserTTS) {
                    var check = setInterval(function () {
                        if (!self._waitingForSpeech) { clearInterval(check); clearTimeout(maxWait); finish(); return; }
                        var playing = VoiceManager._currentAudio && !VoiceManager._currentAudio.paused;
                        if (!playing) { clearInterval(check); clearTimeout(maxWait); finish(); }
                    }, 300);
                    return;
                }

                // ── Browser TTS: await the utterance promise directly ────────────
                // _currentSpeechPromise is set in _browserSpeak() and resolves exactly
                // when utterance.onend or utterance.onerror fires — zero polling, zero race.
                const p = VoiceManager._currentSpeechPromise;
                if (!p) {
                    // No speech was queued (e.g. VOICE_ENABLED=false), proceed immediately
                    clearTimeout(maxWait);
                    finish();
                    return;
                }
                p.then(() => { clearTimeout(maxWait); finish(); });
            });
        },

        _playCurrentStop: async function () {
            if (!this.activePlan || this._isPaused) return;
            if (this.advanceTimeout) clearTimeout(this.advanceTimeout);

            const panoramas  = TDVBridge._panoramas;
            const totalStops = panoramas.length;
            const currentPano = panoramas[this.currentStopIndex];

            // Fallback: pano missing from list
            if (!currentPano) {
                console.warn('[TourManager] No panorama at index', this.currentStopIndex, '— skipping to next');
                this.nextStop();
                return;
            }

            try {
                // ── 1. Update tour progress UI ─────────────────────────
                // Immediately show stop info and reset orb so UI never stays
                // stuck on "Preparing your tour..." from the function executor.
                // Cancel any in-progress typewriter before overwriting statusText —
                // otherwise SubtitleManager keeps appending chars (the concat bug).
                if (SubtitleManager._typewriterInterval) {
                    clearInterval(SubtitleManager._typewriterInterval);
                    SubtitleManager._typewriterInterval = null;
                }

                if (UI.orb) { UI.orb.classList.remove('thinking', 'speaking'); UI.orb.classList.add('idle'); }

                // Make sure the suggestions panel (left side) is visible
                const leftSidePanel = document.querySelector('.ai-side-panel.left');
                if (leftSidePanel) leftSidePanel.style.display = 'flex';

                UI.suggestionsArea.innerHTML = `
                    <div class="ai-suggestion-chip" style="background: rgba(0,240,255,0.1); border-color: #00F0FF; cursor: default;">
                        <b>${this.activePlan.name}</b><br/>📍 ${currentPano.label}
                    </div>
                    <button class="ai-suggestion-chip" id="ai-tour-stop-btn" style="color: #FF4545;">Stop Tour</button>
                `;
                const stopBtn = document.getElementById('ai-tour-stop-btn');
                if (stopBtn) stopBtn.addEventListener('click', () => this.stop('user'));

                // ── 2. Navigate to panorama ────────────────────────────
                console.log('[TourManager] ► Stop', this.currentStopIndex + 1, '/', totalStops, ':', currentPano.label);
                try {
                    window.tour.setMediaByIndex(currentPano.playlistIndex);
                } catch (navErr) {
                    console.warn('[TourManager] Navigation failed for stop', this.currentStopIndex, '— skipping:', navErr.message);
                    await new Promise(r => setTimeout(r, 500));
                    if (!this.activePlan) return;
                    this.nextStop();
                    return;
                }

                // Wait for panorama to load
                await new Promise(r => setTimeout(r, 1000));
                if (!this.activePlan || this._isPaused) return;

                // ── 3. Narration text ──────────────────────────────────
                const narration = this._narrations[currentPano.playlistIndex.toString()]
                    || `Welcome to ${currentPano.label}. Take a moment to look around this beautiful area.`;

                ChatManager.addMessage('assistant', narration);

                // ── 4. Narration + 360° rotation simultaneously ────────
                if (CONFIG.VOICE_ENABLED) {
                    VoiceManager.speak(narration, narration);
                } else if (CONFIG.SUBTITLES_ENABLED) {
                    SubtitleManager.showSubtitle(narration);
                }

                console.log('[TourManager] ↻ Rotation + narration in parallel at', currentPano.label);

                await Promise.all([
                    this._waitForSpeechEnd(),
                    TDVBridge.lookAround().catch(e => {
                        console.warn('[TourManager] Rotation failed — continuing anyway:', e.message);
                    })
                ]);

                if (!this.activePlan || this._isPaused) return;

                // ── 5. Brief pause then advance ────────────────────────
                await new Promise(r => setTimeout(r, 1200));
                if (!this.activePlan || this._isPaused) return;

                this.nextStop();

            } catch (err) {
                // ── Global fallback: any unexpected error skips this stop
                console.error('[TourManager] Unexpected error at stop', this.currentStopIndex, ':', err.message);
                if (this.activePlan && !this._isPaused) {
                    await new Promise(r => setTimeout(r, 1000));
                    if (this.activePlan && !this._isPaused) this.nextStop();
                }
            }
        }
    };

    // --- Module I: Init ---
    // This script is loaded dynamically AFTER DOMContentLoaded,
    // so we run immediately instead of waiting for that event.
    function initAIGuide() {
        console.log('[AIGuide] Initializing AI Guide component...');
        TDVBridge.init(function () {
            console.log('[AIGuide] Tour engine ready. Panoramas extracted:', TDVBridge._panoramas.length);

            // Build UI
            UI.createFloatingButton();
            UI.createChatPanel();

            // Init voice
            VoiceManager.init();

            // Auto-open the AI dashboard when the tour loads
            setTimeout(function () {
                UI.panel.classList.add('active');
                if (UI.floatingBtn) UI.floatingBtn.style.display = 'none';

                // ── OPT-4: Greeting — always browser TTS (free) unless user opted into AI HD ──
                var greeting = "Hi! I'm your AI campus guide for Mount Zion International School. How can I help you today?";
                ChatManager.addMessage('assistant', greeting);
                SubtitleManager.showSubtitle(greeting);
                if (CONFIG.VOICE_ENABLED) {
                    if (!VoiceManager._useBrowserTTS) {
                        // AI HD mode opted in — use Groq TTS
                        VoiceManager.speak(greeting, greeting);
                    } else {
                        // Default browser mode — free, no quota used
                        VoiceManager._browserSpeak(greeting, greeting);
                    }
                }
                ChatManager.showSuggestions(['Give me a campus tour', 'Where am I?', 'Show me the facilities']);
            }, 1500);
        });
    }

    // Run immediately — DOM is already loaded by the time this script executes
    initAIGuide();

})();
