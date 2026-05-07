(function () {
    const CONFIG = window.AIGuideConfig;

    // --- Module A: TDVBridge (Tour Control) ---
    const TDVBridge = {
        _panoramas: [],
        init: function (callback) {
            const checkReady = () => {
                if (
                    window.tour &&
                    window.tour.player &&
                    window.tour.player.getById("mainPlayList")
                ) {
                    this._extractPanoramas();
                    if (callback) callback();
                } else {
                    setTimeout(checkReady, 500);
                }
            };
            checkReady();
        },
        _extractPanoramas: function () {
            const items = window.tour.player.getById("mainPlayList").get("items");
            this._panoramas = items.map((item, idx) => {
                const media = item.get("media");
                const data = media.get("data");
                return {
                    id: media.get("id"),
                    label: data && data.label ? data.label : "Panorama " + (idx + 1),
                    playlistIndex: idx,
                };
            });
        },
        navigateByLabel: function (label) {
            if (!label) return false;

            // 1. Exact match first (fastest)
            const exactMatch = this._panoramas.find(
                (p) => p.label.toLowerCase() === label.toLowerCase().trim(),
            );
            if (exactMatch) {
                window.tour.setMediaByIndex(exactMatch.playlistIndex);
                return true;
            }

            // 2. Fuzzy match using Fuse.js
            if (window.Fuse && this._panoramas.length > 0) {
                const fuse = new window.Fuse(this._panoramas, {
                    includeScore: true,
                    threshold: 0.5,
                    keys: ["label"],
                });
                const result = fuse.search(label);
                if (result.length > 0) {
                    console.log(
                        "[TDVBridge] Fuzzy Navigating to:",
                        result[0].item.label,
                        "(index:",
                        result[0].item.playlistIndex + ")",
                    );
                    window.tour.setMediaByIndex(result[0].item.playlistIndex);
                    return true;
                }
            }

            // 3. Fallback: use 3DVista's built-in name lookup
            console.log("[TDVBridge] Trying setMediaByName fallback for:", label);
            if (window.tour && window.tour.setMediaByName) {
                window.tour.setMediaByName(label);
                return true;
            }

            console.warn("[TDVBridge] Panorama not found:", label);
            return false;
        },

        // --- Sequential Panorama Navigation ---
        navigateFirst: function () {
            if (this._panoramas.length > 0) {
                window.tour.setMediaByIndex(this._panoramas[0].playlistIndex);
                return true;
            }
            return false;
        },
        navigateLast: function () {
            if (this._panoramas.length > 0) {
                window.tour.setMediaByIndex(
                    this._panoramas[this._panoramas.length - 1].playlistIndex,
                );
                return true;
            }
            return false;
        },
        navigateNext: function () {
            if (this._panoramas.length === 0) return false;
            // Use .trim() on both sides — 3DVista locale labels can carry whitespace
            const currentLabel = this.getCurrentLocation().trim();
            const currentIndex = this._panoramas.findIndex(
                (p) => p.label.trim() === currentLabel,
            );
            if (currentIndex >= 0 && currentIndex < this._panoramas.length - 1) {
                window.tour.setMediaByIndex(
                    this._panoramas[currentIndex + 1].playlistIndex,
                );
                return true;
            }
            return false; // Already at the end or not found
        },
        navigatePrevious: function () {
            if (this._panoramas.length === 0) return false;
            const currentLabel = this.getCurrentLocation().trim();
            const currentIndex = this._panoramas.findIndex(
                (p) => p.label.trim() === currentLabel,
            );
            if (currentIndex > 0) {
                window.tour.setMediaByIndex(
                    this._panoramas[currentIndex - 1].playlistIndex,
                );
                return true;
            }
            return false; // Already at the beginning or not found
        },

        controlCamera: function (direction, degrees = 45) {
            const root = window.tour._getRootPlayer();
            const viewer = root.getMainViewer();
            const player = root.getActivePlayerWithViewer(viewer);

            let yaw = player.get("yaw");
            let pitch = player.get("pitch");
            const hfov = player.get("hfov");
            const roll = 0; // Usually 0

            if (direction === "left") yaw -= degrees;
            if (direction === "right") yaw += degrees;
            if (direction === "up") pitch -= degrees;
            if (direction === "down") pitch += degrees;
            if (direction === "behind") yaw += 180;

            player.moveTo(yaw, pitch, roll, hfov, 1000); // 1000ms animation
        },
        zoomCamera: function (direction, amount = 20) {
            const root = window.tour._getRootPlayer();
            const viewer = root.getMainViewer();
            const player = root.getActivePlayerWithViewer(viewer);

            const yaw = player.get("yaw");
            const pitch = player.get("pitch");
            let hfov = player.get("hfov");
            const roll = 0;

            if (direction === "in") hfov -= amount;
            if (direction === "out") hfov += amount;

            // Constrain hfov
            if (hfov < 10) hfov = 10;
            if (hfov > 120) hfov = 120;

            player.moveTo(yaw, pitch, roll, hfov, 1000);
        },
        toggleFullscreen: function () {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch((err) => {
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
            const data = media.get("data");
            return data && data.label ? data.label : "Unknown Location";
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
                const safeResolve = () => {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                };
                const safetyTimeout = setTimeout(safeResolve, durationMs + 1000);

                try {
                    const root = window.tour._getRootPlayer();
                    const viewer = root.getMainViewer();
                    const player = root.getActivePlayerWithViewer(viewer);
                    if (!player) {
                        clearTimeout(safetyTimeout);
                        safeResolve();
                        return;
                    }

                    const startYaw = player.get("yaw");
                    const pitch = player.get("pitch");
                    const hfov = player.get("hfov");
                    const startTime = performance.now();
                    self._rotationCancelled = false;

                    function tick(now) {
                        // ── FIX: RAF tick has its own try-catch ──────────────────────
                        // Errors inside RAF are NOT caught by outer try-catch.
                        // Without this, a setPosition() crash = Promise hangs forever = tour freezes.
                        try {
                            if (self._rotationCancelled) {
                                clearTimeout(safetyTimeout);
                                safeResolve();
                                return;
                            }

                            const elapsed = now - startTime;
                            const progress = Math.min(elapsed / durationMs, 1);
                            const eased =
                                progress < 0.5
                                    ? 2 * progress * progress
                                    : -1 + (4 - 2 * progress) * progress;

                            player.setPosition(startYaw + 360 * eased, pitch, 0, hfov);

                            if (progress < 1) {
                                self._rotationFrame = requestAnimationFrame(tick);
                            } else {
                                self._rotationFrame = null;
                                clearTimeout(safetyTimeout);
                                safeResolve();
                            }
                        } catch (rafErr) {
                            // Player was replaced/destroyed mid-rotation (common on pano switch)
                            console.warn(
                                "[TDVBridge] Rotation tick error (safe):",
                                rafErr.message,
                            );
                            self._rotationFrame = null;
                            clearTimeout(safetyTimeout);
                            safeResolve(); // ← never hangs
                        }
                    }

                    self._rotationFrame = requestAnimationFrame(tick);
                } catch (e) {
                    console.warn("[TDVBridge] lookAround setup error:", e.message);
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
        isMenuOpen: () =>
            typeof window.isMenuOpen === "function" && window.isMenuOpen(),
        openMenu: () => typeof window.openMenu === "function" && window.openMenu(),
        closeMenu: () =>
            typeof window.closeMenu === "function" && window.closeMenu(),

        isSearchOpen: () => {
            const searchBox = document.getElementById("container_search");
            return searchBox && searchBox.classList.contains("show");
        },
        openSearch: function () {
            if (!this.isSearchOpen() && typeof window.toggleSearchBox === "function")
                window.toggleSearchBox();
        },
        closeSearch: function () {
            if (this.isSearchOpen() && typeof window.toggleSearchBox === "function")
                window.toggleSearchBox();
        },

        isContactOpen: () =>
            typeof window.isContactOpen === "function" && window.isContactOpen(),
        openContact: () =>
            typeof window.openContact === "function" && window.openContact(),
        closeContact: () =>
            typeof window.closeContact === "function" && window.closeContact(),

        isPanoramaListOpen: () => {
            const container = document.getElementById("pano-modal-container");
            return container && container.classList.contains("show");
        },
        openPanoramaList: function () {
            if (
                !this.isPanoramaListOpen() &&
                typeof window.togglePanoList === "function"
            )
                window.togglePanoList();
        },
        closePanoramaList: function () {
            if (
                this.isPanoramaListOpen() &&
                typeof window.togglePanoList === "function"
            )
                window.togglePanoList();
        },
        openStreetView: () =>
            typeof window.openGsvPopup === "function" && window.openGsvPopup(),
        // Navigate by playlist index (used by go_back, go_to_start, random_panorama)
        navigateToPanorama: function (index) {
            if (window.tour && typeof window.tour.setMediaByIndex === "function") {
                window.tour.setMediaByIndex(index);
            }
        },
        // Reset camera to default forward-facing view
        resetView: function () {
            try {
                const root = window.tour._getRootPlayer();
                const viewer = root.getMainViewer();
                const player = root.getActivePlayerWithViewer(viewer);
                if (player) player.moveTo(0, 0, 0, 90, 800);
            } catch (e) {
                console.warn("[TDVBridge] resetView error:", e.message);
            }
        },
    };

    // --- Module B: Local Intent Router (Replaces API Client) ---
    const LocalIntentRouter = {
        fuse: null,
        init: function () {
            const intents = [
                {
                    action: "start_guided_tour",
                    phrases: [
                        "start tour",
                        "begin tour",
                        "give me a tour",
                        "show me around",
                        "launch tour",
                        "campus tour",
                        "guided tour",
                        "give me a campus tour",
                        "start guided tour",
                        "start tour again",
                        "resume tour",
                        "take me on a tour",
                        "start a tour",
                        "tour the campus",
                        "tour please",
                    ],
                },
                {
                    action: "stop_guided_tour",
                    phrases: [
                        "stop tour",
                        "end tour",
                        "cancel tour",
                        "quit tour",
                        "exit tour",
                    ],
                },
                {
                    action: "next_tour_stop",
                    phrases: [
                        "next",
                        "continue",
                        "go",
                        "proceed",
                        "ok",
                        "yes",
                        "next stop",
                        "next room",
                    ],
                },
                {
                    action: "previous_tour_stop",
                    phrases: ["previous stop", "go back a stop", "last stop"],
                },
                {
                    action: "get_current_location",
                    phrases: [
                        "where am i",
                        "what is this place",
                        "where are we",
                        "location",
                    ],
                },
                {
                    action: "describe_current_location",
                    phrases: [
                        "tell me about this place",
                        "tell about",
                        "describe this place",
                        "what is here",
                        "what is this room",
                        "information",
                        "more info",
                    ],
                },
                {
                    action: "toggle_fullscreen",
                    phrases: [
                        "fullscreen",
                        "full screen",
                        "maximize",
                        "make it bigger",
                        "expand",
                        "exit fullscreen",
                        "close fullscreen",
                    ],
                },
                {
                    action: "toggle_music",
                    phrases: [
                        "music",
                        "play music",
                        "stop music",
                        "mute",
                        "unmute",
                        "sound",
                        "audio",
                    ],
                },
                {
                    action: "set_music_volume",
                    phrases: [
                        "volume",
                        "turn it up",
                        "turn it down",
                        "louder",
                        "quieter",
                    ],
                },
                { action: "open_menu", phrases: ["menu", "open menu", "show menu"] },
                { action: "close_menu", phrases: ["close menu", "hide menu"] },
                {
                    action: "open_panorama_list",
                    phrases: [
                        "panorama list",
                        "panoramas",
                        "show list",
                        "locations list",
                        "facilities",
                        "show me the Menu List",
                    ],
                },
                {
                    action: "close_panorama_list",
                    phrases: ["close panorama list", "hide list"],
                },
                { action: "open_search", phrases: ["search", "find", "looking for"] },
                { action: "close_search", phrases: ["close search", "hide search"] },
                {
                    action: "open_contact",
                    phrases: [
                        "contact us",
                        "contact",
                        "get in touch",
                        "phone number",
                        "email",
                    ],
                },
                { action: "close_contact", phrases: ["close contact", "hide contact"] },
                {
                    action: "open_street_view",
                    phrases: ["street view", "google street view", "outside", "open gsv"],
                },
                {
                    action: "close_street_view",
                    phrases: ["close street view", "hide street view", "close gsv"],
                },
                {
                    action: "navigate_previous",
                    phrases: [
                        "go back",
                        "back",
                        "previous",
                        "return",
                        "previous pano",
                        "go back pano",
                        "go prious pano",
                    ],
                },
                {
                    action: "navigate_first",
                    phrases: [
                        "home",
                        "beginning",
                        "go to start",
                        "go first pano",
                        "go to the first pano",
                        "first panorama",
                        "start from the beginning",
                        "back to entrance",
                        "go to entrance",
                    ],
                },
                {
                    action: "navigate_last",
                    phrases: [
                        "go last pano",
                        "last panorama",
                        "go to the last panorama",
                        "skip to the end",
                    ],
                },
                {
                    action: "navigate_next",
                    phrases: ["next pano", "go next pano", "move forward"],
                },
                {
                    action: "random_panorama",
                    phrases: [
                        "random",
                        "surprise me",
                        "take me somewhere new",
                        "anywhere",
                    ],
                },
                {
                    action: "look_around",
                    phrases: ["look around", "rotate", "spin", "show me the room"],
                },
                {
                    action: "reset_view",
                    phrases: ["reset view", "center", "look forward"],
                },
                { action: "zoom_in", phrases: ["zoom in", "closer", "magnify"] },
                { action: "zoom_out", phrases: ["zoom out", "farther", "further"] },
                {
                    action: "open_related_campus",
                    phrases: ["other campus", "related campus", "visit another campus"],
                },
                // Chit-Chat
                {
                    action: "chitchat_hello",
                    phrases: [
                        "hello",
                        "hi",
                        "hey",
                        "greetings",
                        "good morning",
                        "good afternoon",
                    ],
                },
                {
                    action: "chitchat_how_are_you",
                    phrases: ["how are you", "how are you doing", "whats up"],
                },
                {
                    action: "chitchat_who_are_you",
                    phrases: [
                        "who are you",
                        "what are you",
                        "who made you",
                        "who built you",
                    ],
                },
                {
                    action: "chitchat_help",
                    phrases: [
                        "help",
                        "what can you do",
                        "how does this work",
                        "instructions",
                    ],
                },
            ];
            this.fuse = new window.Fuse(intents, {
                includeScore: true,
                threshold: 0.4,
                keys: ["phrases"],
            });
        },
        parse: function (text) {
            if (!this.fuse) this.init();

            const lowerText = text.toLowerCase();

            // 0. Check for specific numerical panorama navigation (e.g., "go to 2nd pano", "panorama 5")
            const wordToNum = {
                first: 1,
                second: 2,
                third: 3,
                fourth: 4,
                fifth: 5,
                sixth: 6,
                seventh: 7,
                eighth: 8,
                ninth: 9,
                tenth: 10,
            };
            const numberPattern =
                /(?:go(?: to)? |take me to |show me )?(?:the )?(1?\d|20|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)(?:st|nd|rd|th)?\s+(?:pano|panorama|stop|room|location)/i;
            const alternatePattern =
                /(?:pano|panorama|stop|room|location)\s+(1?\d|20|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)/i;
            const indexMatch =
                lowerText.match(numberPattern) || lowerText.match(alternatePattern);

            if (indexMatch) {
                let numStr = indexMatch[1].toLowerCase();
                let panoNumber = parseInt(numStr, 10);
                if (isNaN(panoNumber) && wordToNum[numStr]) {
                    panoNumber = wordToNum[numStr];
                }

                if (!isNaN(panoNumber)) {
                    let functionCall = {
                        name: "navigate_to_index",
                        args: { index: panoNumber - 1 },
                    }; // 0-based
                    return {
                        text: ChatManager._getFallbackText([functionCall]),
                        function_calls: [functionCall],
                        suggestions: ChatManager.getContextualSuggestions(
                            TDVBridge.getCurrentLocation(),
                            "navigate_to_index",
                        ),
                    };
                }
            }

            // 1. Check general commands first (so "open menu" isn't intercepted by panorama navigation)
            const result = this.fuse.search(text);
            if (result.length > 0 && result[0].score < 0.5) {
                // 0.5 threshold to capture components and settings
                const action = result[0].item.action;

                // Handle chit-chat directly
                if (action.startsWith("chitchat_")) {
                    let responseText = "";
                    if (action === "chitchat_hello") {
                        const hellos = [
                            "Hello there! Ready to explore the campus?",
                            "Hi! How can I help you today?",
                            "Greetings! Where would you like to go?",
                        ];
                        responseText = hellos[Math.floor(Math.random() * hellos.length)];
                    } else if (action === "chitchat_how_are_you") {
                        responseText =
                            "I'm doing great, thanks for asking! Ready to guide you around.";
                    } else if (action === "chitchat_who_are_you") {
                        responseText =
                            "I am your virtual campus guide. I can help you navigate the school, control the tour, and show you around.";
                    } else if (action === "chitchat_help") {
                        const panoNames = TDVBridge._panoramas.length > 0
                            ? TDVBridge._panoramas.map((p) => p.label.trim()).join(", ")
                            : "the Library, Computer Lab, Sports Facility";
                        responseText =
                            `You can ask me to: 'Start a guided tour', 'Go to the Library', 'Zoom in', ` +
                            `'Open the menu', or 'Look around'. You can also navigate to: ${panoNames}. What would you like to do?`;
                    }
                    return {
                        text: responseText,
                        function_calls: [],
                        suggestions: ChatManager.getContextualSuggestions(
                            TDVBridge.getCurrentLocation(),
                            action,
                        ),
                    };
                }

                let functionCall = { name: action, args: {} };

                // Map specific zooming actions
                if (action === "zoom_in")
                    functionCall = {
                        name: "zoom_camera",
                        args: { direction: "in", amount: 20 },
                    };
                if (action === "zoom_out")
                    functionCall = {
                        name: "zoom_camera",
                        args: { direction: "out", amount: 20 },
                    };

                // Map specific volume arguments
                if (action === "set_music_volume") {
                    if (lowerText.includes("down") || lowerText.includes("quiet"))
                        functionCall.args = { level: 20 };
                    else if (lowerText.includes("up") || lowerText.includes("loud"))
                        functionCall.args = { level: 80 };
                    else functionCall.args = { level: 50 };
                }

                return {
                    text: ChatManager._getFallbackText([functionCall]),
                    function_calls: [functionCall],
                    suggestions: ChatManager.getContextualSuggestions(
                        TDVBridge.getCurrentLocation(),
                        action,
                    ),
                };
            }

            // 2. Check if it's a navigation request to a specific panorama
            if (TDVBridge._panoramas.length > 0) {
                const panoFuse = new window.Fuse(TDVBridge._panoramas, {
                    includeScore: true,
                    threshold: 0.25, // Stricter matching
                    keys: ["label"],
                });
                // Extract potential location name (strip common prefixes to improve fuzzy matching)
                let query = lowerText
                    .replace(
                        /\b(go to|go|take me to|take me|show me|show|navigate to|navigate|where is|where|open|the)\b/g,
                        "",
                    )
                    .replace(/\s+/g, " ")
                    .trim();
                if (!query) query = lowerText;

                const panoMatch = panoFuse.search(query);
                if (panoMatch.length > 0 && panoMatch[0].score < 0.25) {
                    const targetLocation = panoMatch[0].item.label.trim();
                    const currentLocation = TDVBridge.getCurrentLocation().trim();

                    if (targetLocation === currentLocation) {
                        return {
                            text: `You are currently at ${targetLocation}.`,
                            function_calls: [],
                            suggestions: ChatManager.getContextualSuggestions(
                                currentLocation,
                                "navigate_to_panorama",
                            ),
                        };
                    } else {
                        return {
                            text: `Taking you to ${targetLocation} now!`,
                            function_calls: [
                                {
                                    name: "navigate_to_panorama",
                                    args: { location: targetLocation },
                                },
                            ],
                            suggestions: ChatManager.getContextualSuggestions(
                                targetLocation,
                                "navigate_to_panorama",
                            ),
                        };
                    }
                } else if (
                    lowerText.match(
                        /\b(go to|go|take me to|take me|show me|show|navigate to|navigate|where is|where|open)\b/,
                    )
                ) {
                    // Navigation intent detected, but no confident match found! Show all panos as chips.
                    return {
                        text: "I couldn't find that exact location. Here are the places you can visit:",
                        function_calls: [],
                        suggestions: TDVBridge._panoramas.map((p) => ({
                            label: p.label.trim(),
                            action: "navigate_panorama",
                            payload: { location: p.label.trim() }
                        })),
                        error: false,
                    };
                }
            }

            // 3. Fallback Chit-Chat (Since AI is removed)
            const fallbacks = [
                "I didn't quite catch that. You can ask me to navigate to a place, or start a guided tour.",
                "Hmm, I'm not sure what you mean. Would you like to look around or see the menu?",
                "Could you try rephrasing that? You can always say 'help' for options.",
            ];
            return {
                text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
                function_calls: [],
                suggestions: ChatManager.getContextualSuggestions(
                    TDVBridge.getCurrentLocation(),
                    "fallback",
                ),
                error: false,
            };
        },
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
            const btn = document.createElement("div");
            btn.className = "ai-guide-btn";
            btn.innerHTML = `
                <div class="ai-callout-badge">
                    <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: white; margin-right: 6px; vertical-align: middle; transform: translateY(-1px);"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                    Say "Hey Vista AI"
                </div>
                <svg class="ai-btn-icon" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                <div class="ai-guide-ring-text">
                    <svg viewBox="0 0 100 100">
                        <path id="ai-ring-curve" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="transparent" />
                        <text>
                            <textPath href="#ai-ring-curve" startOffset="0">
                                3D VISTA AI • 3D VISTA AI • 
                            </textPath>
                        </text>
                    </svg>
                </div>
            `;
            document.body.appendChild(btn);

            this.floatingBtn = btn;

            // Trigger the expand/collapse callout animation after 2 seconds
            setTimeout(() => {
                const badge = btn.querySelector('.ai-callout-badge');
                if (badge) {
                    badge.classList.add('show');
                    // Hide after 8 seconds
                    setTimeout(() => {
                        if (badge) badge.classList.remove('show');
                    }, 8000);
                }
            }, 2000);

            btn.addEventListener("click", () => {
                if (this.panel.classList.contains("active")) {
                    this.panel.classList.remove("active");
                } else {
                    this.panel.classList.add("active");
                    this.floatingBtn.style.display = "none"; // Hide when dashboard opens
                    ChatManager.playGreeting();
                }
            });
            return btn;
        },

        createChatPanel: function () {
            const panel = document.createElement("div");
            panel.className = "ai-dashboard-overlay";
            panel.innerHTML = `
                <div class="ai-dashboard-grid">
                    <div class="ai-center-stage">
                        <div class="ai-orb-container">
                            <div class="ai-orb-glass">
                                <div class="ai-orb idle"></div>
                            </div>
                        </div>
                        <div class="ai-status-text"></div>
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
            this.orb = panel.querySelector(".ai-orb");
            this.orbGlass = panel.querySelector(".ai-orb-glass");
            this.statusText = panel.querySelector(".ai-status-text");
            this.suggestionsArea = panel.querySelector(".ai-suggestions-list");
            this.locationName = panel.querySelector(".ai-location-name");
            this.micBtn = panel.querySelector("#ai-dock-mic");
            this.inputField = panel.querySelector("#ai-keyboard-text");
            this.keyboardOverlay = panel.querySelector(".ai-keyboard-input");

            // Events
            panel.querySelector("#ai-dock-close").addEventListener("click", () => {
                panel.classList.remove("active");
                if (this.floatingBtn) this.floatingBtn.style.display = "flex";
            });
            panel.querySelector("#ai-dock-keyboard").addEventListener("click", () => {
                this.keyboardOverlay.classList.toggle("active");
                if (this.keyboardOverlay.classList.contains("active"))
                    this.inputField.focus();
            });

            this.micBtn.addEventListener("click", () =>
                VoiceManager.toggleListening(),
            );
            panel
                .querySelector("#ai-keyboard-send")
                .addEventListener("click", () => ChatManager.handleInputSend());
            this.inputField.addEventListener("keypress", (e) => {
                if (e.key === "Enter") ChatManager.handleInputSend();
            });
        },
    };

    // --- Module D: Chat Manager ---
    const ChatManager = {
        isTyping: false,
        _lastUIState: { menu: false, search: false, contact: false },
        _greetingPlayed: false,

        playGreeting: function () {
            if (this._greetingPlayed) return;
            this._greetingPlayed = true;

            var greeting = "Hi! I'm your AI campus guide for Mount Zion International School. How can I help you today?";
            this.addMessage("assistant", greeting);

            if (CONFIG.VOICE_ENABLED) {
                if (!VoiceManager._useBrowserTTS) {
                    VoiceManager.speak(greeting, greeting);
                } else {
                    VoiceManager._browserSpeak(greeting, greeting);
                }
            } else if (CONFIG.SUBTITLES_ENABLED) {
                SubtitleManager.showWordHighlight(greeting);
            }
            this.showSuggestions([
                { label: "Start Campus Tour", action: "start_guided_tour" },
                { label: "Sports Facility", action: "navigate_panorama", payload: { location: "Sports Facility" } },
                { label: "All Locations", action: "open_panorama_list" },
            ]);
        },

        _monitorUIState: function () {
            setInterval(() => {
                if (this.isTyping) return;
                // GUARD: never overwrite TourManager's own progress UI
                if (TourManager && TourManager.activePlan) return;

                const isMenu = TDVBridge.isMenuOpen && TDVBridge.isMenuOpen();
                const isSearch = TDVBridge.isSearchOpen && TDVBridge.isSearchOpen();
                const isContact = TDVBridge.isContactOpen && TDVBridge.isContactOpen();

                if (this._lastUIState.menu !== isMenu ||
                    this._lastUIState.search !== isSearch ||
                    this._lastUIState.contact !== isContact) {

                    this._lastUIState = { menu: isMenu, search: isSearch, contact: isContact };

                    // Component just opened or closed — refresh chips immediately
                    const newSuggestions = this.getContextualSuggestions(TDVBridge.getCurrentLocation(), null);
                    this.showSuggestions(newSuggestions);
                }
            }, 500);
        },

        handleInputSend: function () {
            const text = UI.inputField.value.trim();
            if (!text || this.isTyping) return;

            UI.inputField.value = "";
            // Hide keyboard if it was open
            if (UI.keyboardOverlay) UI.keyboardOverlay.classList.remove("active");
            this.sendMessage(text);
        },

        sendMessage: async function (text) {
            // Guard against concurrent calls
            if (this.isTyping) return;
            // Cut any playing audio immediately
            VoiceManager.stopSpeaking();

            // If a guided tour is running, pause it so user can ask freely
            const tourInterrupted = !!(
                TourManager &&
                TourManager.activePlan &&
                !TourManager._isPaused
            );
            if (tourInterrupted) TourManager.pause();

            // Add user message to UI
            this.addMessage("user", text);
            this.clearSuggestions();

            // Process locally via Fuzzy String Matcher (Fuse.js)
            const response = LocalIntentRouter.parse(text);

            // Display matched response immediately (no thinking delay needed)
            this.displayResponse(response, tourInterrupted);
        },

        addMessage: function (role, content) {
            // Show user input in status — but don't overwrite tour status messages
            if (role === "user") {
                const isTourActive = TourManager && TourManager.activePlan;
                if (!isTourActive) {
                    UI.statusText.textContent = `"${content}"`;
                }
            }
        },

        // Contextual fallback text when LLM returns only function calls with no text
        _getFallbackText: function (calls) {
            const v = (arr) => arr[Math.floor(Math.random() * arr.length)];
            const fallbacks = {
                get_current_location: () => {
                    const loc = TDVBridge.getCurrentLocation();
                    return v([
                        `You are currently at ${loc}.`,
                        `This is ${loc}.`,
                        `We are at ${loc} right now.`,
                    ]);
                },
                describe_current_location: () => {
                    const currentLocation = TDVBridge.getCurrentLocation().trim();
                    const panos = TDVBridge._panoramas;
                    if (TourManager._about_narrations[currentLocation]) {
                        return TourManager._about_narrations[currentLocation];
                    }
                    return v([
                        `This is the ${currentLocation}. Feel free to look around.`,
                        `We are currently at the ${currentLocation}.`,
                    ]);
                },
                navigate_to_panorama: (a) =>
                    v([
                        `Taking you to ${a.location || "that location"} now!`,
                        `Heading over to ${a.location || "that spot"}.`,
                        `Let's go to ${a.location || "there"}!`,
                    ]),
                // Alias: chips remap navigate_panorama → navigate_to_panorama before calling
                // FunctionExecutor, but _getFallbackText runs on the original calls[] array
                navigate_panorama: (a) =>
                    v([
                        `Taking you to ${a.location || "that location"} now!`,
                        `Heading over to ${a.location || "that spot"}.`,
                        `Let's go to ${a.location || "there"}!`,
                    ]),
                control_camera: (a) =>
                    v([`Looking ${a.direction}.`, `Turning ${a.direction}.`]),
                zoom_camera: (a) =>
                    v([`Zooming ${a.direction}.`, `Getting a closer look.`]),
                toggle_music: () =>
                    v(["Toggling the background music.", "Adjusting the music."]),
                toggle_fullscreen: () =>
                    v(["Switching fullscreen mode.", "Changing view mode."]),
                look_around: () =>
                    v(["Let's take a look around!", "Scanning the room."]),
                stop_guided_tour: () =>
                    v([
                        "Tour stopped. Let me know if you need anything.",
                        "Tour cancelled.",
                    ]),
                next_tour_stop: () =>
                    v(["Moving to the next stop!", "Onward to the next location."]),
                previous_tour_stop: () =>
                    v([
                        "Going back to the previous stop!",
                        "Returning to the last stop.",
                    ]),
                jump_to_tour_stop: (a) =>
                    v([
                        `Jumping to ${a.location || "that stop"} now!`,
                        `Skipping to ${a.location}.`,
                    ]),
                open_panorama_list: () =>
                    TDVBridge.isPanoramaListOpen()
                        ? "The location list is already visible."
                        : v(["Opening the panorama list.", "Here are the locations."]),
                close_panorama_list: () =>
                    !TDVBridge.isPanoramaListOpen()
                        ? "The location list is not open."
                        : v(["Closing the panorama list.", "List hidden."]),
                open_search: (a) =>
                    TDVBridge.isSearchOpen()
                        ? "Search is already open."
                        : a.query
                            ? `Searching for "${a.query}"...`
                            : v(["Opening search.", "Let's find something."]),
                close_search: () =>
                    !TDVBridge.isSearchOpen()
                        ? "Search is not currently open."
                        : v(["Closing search.", "Search hidden."]),
                open_contact: () =>
                    TDVBridge.isContactOpen()
                        ? "The contact info is already on screen."
                        : v([
                            "Opening the contact information.",
                            "Here are our contact details.",
                        ]),
                close_contact: () =>
                    !TDVBridge.isContactOpen()
                        ? "The contact info is not open."
                        : v(["Closing the contact panel.", "Contact info hidden."]),
                open_menu: () =>
                    TDVBridge.isMenuOpen()
                        ? "The menu is already open."
                        : v(["Opening the menu.", "Here is the menu."]),
                close_menu: () =>
                    !TDVBridge.isMenuOpen()
                        ? "The menu is already closed."
                        : v(["Closing the menu.", "Menu hidden."]),
                open_street_view: () =>
                    v(["Opening Google Street View.", "Taking you outside."]),
                close_street_view: () =>
                    v(["Closing Google Street View.", "Returning inside."]),
                navigate_previous: () => {
                    const c = TDVBridge.getCurrentLocation().trim();
                    const i = TDVBridge._panoramas.findIndex((p) => p.label.trim() === c);
                    return i > 0
                        ? v([
                            "Going back to the previous location.",
                            "Returning to where we were.",
                        ])
                        : "You are currently at the first panorama, so we can't go back further.";
                },
                navigate_first: () => {
                    const c = TDVBridge.getCurrentLocation().trim();
                    const i = TDVBridge._panoramas.findIndex((p) => p.label.trim() === c);
                    return i > 0
                        ? v(["Heading back to the entrance.", "Going to the start."])
                        : "You are already at the first panorama.";
                },
                navigate_last: () => {
                    const c = TDVBridge.getCurrentLocation().trim();
                    const i = TDVBridge._panoramas.findIndex((p) => p.label.trim() === c);
                    return i >= 0 && i < TDVBridge._panoramas.length - 1
                        ? v(["Taking you to the last panorama.", "Skipping to the end."])
                        : "You are already at the very last panorama.";
                },
                navigate_next: () => {
                    const c = TDVBridge.getCurrentLocation().trim();
                    const i = TDVBridge._panoramas.findIndex((p) => p.label.trim() === c);
                    return i >= 0 && i < TDVBridge._panoramas.length - 1
                        ? v([
                            "Taking you to the next panorama now.",
                            "Moving to the next location.",
                        ])
                        : "You are already at the very last panorama in the tour.";
                },
                navigate_to_index: (a) => {
                    if (a.index >= 0 && a.index < TDVBridge._panoramas.length) {
                        return v([
                            `Taking you to panorama ${a.index + 1}.`,
                            `Moving to location ${a.index + 1}.`,
                        ]);
                    }
                    return "That panorama number does not exist in this tour.";
                },
                random_panorama: () =>
                    v([
                        "Taking you somewhere new — enjoy the surprise!",
                        "Let's explore a random spot.",
                    ]),
                reset_view: () =>
                    v(["Camera reset to the default view.", "View centered."]),
                set_music_volume: (a) =>
                    a.level === 0 ? "Music muted." : `Volume set to ${a.level}%.`,
                open_related_campus: (a) =>
                    `Opening the ${a.campus_name || "related campus"} virtual tour in a new tab.`,
            };
            const primary = calls[0];
            const fn = fallbacks[primary.name];
            return fn ? fn(primary.args || {}) : "";
        },

        getContextualSuggestions: function (locationName, lastAction) {
            // Helper shorthand for nav chips
            const nav = (label, location) => ({ label, action: "navigate_panorama", payload: { location } });

            // ── 1. Paused tour ─────────────────────────────────────────────
            if (TourManager && TourManager.activePlan && TourManager._isPaused) {
                return [
                    { label: "Resume Tour", action: "start_guided_tour" },
                    { label: "Stop Tour", action: "stop_guided_tour" },
                ];
            }

            // ── 2. Open UI component — contextual close chips ───────────────
            if (TDVBridge.isMenuOpen && TDVBridge.isMenuOpen()) {
                return [
                    { label: "Close Menu", action: "close_menu" },
                    { label: "Contact Us", action: "open_contact" },
                    { label: "Search", action: "open_search" },
                ];
            }
            if (TDVBridge.isSearchOpen && TDVBridge.isSearchOpen()) {
                return [
                    { label: "Close Search", action: "close_search" },
                    { label: "Menu", action: "open_menu" },
                ];
            }
            if (TDVBridge.isContactOpen && TDVBridge.isContactOpen()) {
                return [
                    { label: "Close Contact", action: "close_contact" },
                    nav("Main Entrance", "Main Entrance"),
                ];
            }

            // ── 3. Action-context awareness ────────────────────────────────
            if (lastAction === "toggle_music" || lastAction === "set_music_volume") {
                return [
                    { label: "Toggle Music", action: "toggle_music" },
                    { label: "Next Room", action: "navigate_next" },
                    { label: "Look Around", action: "look_around" },
                ];
            }
            if (lastAction === "look_around" || lastAction === "reset_view") {
                return [
                    { label: "Next Panorama", action: "navigate_next" },
                    { label: "All Locations", action: "open_panorama_list" },
                    { label: "Start Tour", action: "start_guided_tour" },
                ];
            }
            if (lastAction === "toggle_fullscreen") {
                return [
                    { label: "Look Around", action: "look_around" },
                    { label: "Next Room", action: "navigate_next" },
                    { label: "All Locations", action: "open_panorama_list" },
                ];
            }
            if (lastAction === "get_current_location" || lastAction === "describe_current_location") {
                return [
                    { label: "Start Guided Tour", action: "start_guided_tour" },
                    { label: "Next Panorama", action: "navigate_next" },
                    { label: "All Locations", action: "open_panorama_list" },
                ];
            }

            // ── 4. Location-based suggestions (all 8 panoramas) ────────────
            const loc = (locationName || "").toLowerCase().trim();

            if (loc.includes("entrance") || loc === "main entrance") return [
                { label: "Start Guided Tour", action: "start_guided_tour" },
                nav("Sports Facility", "Sports Facility"),
                nav("School Courtyard", "School Courtyard"),
                { label: "All Locations", action: "open_panorama_list" },
            ];
            if (loc.includes("sports") || loc.includes("facility")) return [
                nav("Main Building", "Main Building"),
                nav("School Courtyard", "School Courtyard"),
                { label: "Start Tour", action: "start_guided_tour" },
                { label: "Look Around", action: "look_around" },
            ];
            if (loc.includes("main building") || loc.includes("front entrance")) return [
                nav("School Courtyard", "School Courtyard"),
                nav("Computer Lab", "Computer Lab"),
                { label: "Start Tour", action: "start_guided_tour" },
                { label: "Look Around", action: "look_around" },
            ];
            if (loc.includes("courtyard")) return [
                nav("Computer Lab", "Computer Lab"),
                nav("Chemistry Lab", "Chemistry Lab"),
                nav("Main Building", "Main Building"),
                { label: "Look Around", action: "look_around" },
            ];
            if (loc.includes("computer")) return [
                nav("Chemistry Lab", "Chemistry Lab"),
                nav("Library", "Library"),
                { label: "Previous Room", action: "navigate_previous" },
                { label: "Look Around", action: "look_around" },
            ];
            if (loc.includes("chemistry")) return [
                nav("Computer Lab", "Computer Lab"),
                nav("Library", "Library"),
                nav("KG Classroom", "Kindergarten Classroom"),
                { label: "Look Around", action: "look_around" },
            ];
            if (loc.includes("library")) return [
                nav("Chemistry Lab", "Chemistry Lab"),
                nav("KG Classroom", "Kindergarten Classroom"),
                { label: "Previous Room", action: "navigate_previous" },
                { label: "Look Around", action: "look_around" },
            ];
            if (loc.includes("kindergarten") || loc.includes("kg class")) return [
                nav("Library", "Library"),
                { label: "Back to Entrance", action: "navigate_first" },
                { label: "Start Tour Again", action: "start_guided_tour" },
                { label: "Look Around", action: "look_around" },
            ];

            // ── 5. Default fallback ────────────────────────────────────────
            return [
                { label: "Where Am I?", action: "get_current_location" },
                { label: "Next Panorama", action: "navigate_next" },
                { label: "All Locations", action: "open_panorama_list" },
                { label: "Start Tour", action: "start_guided_tour" },
            ];
        },

        displayResponse: function (response, tourWasInterrupted) {
            // Determine spoken text (with fallback for function-only responses)
            let spokenText = response.text || "";
            if (
                !spokenText &&
                response.function_calls &&
                response.function_calls.length > 0
            ) {
                spokenText = this._getFallbackText(response.function_calls);
            }

            if (spokenText) {
                if (CONFIG.VOICE_ENABLED) {
                    VoiceManager.speak(spokenText, spokenText);
                } else if (CONFIG.SUBTITLES_ENABLED) {
                    // FIX 4: Use karaoke highlight even when voice is off
                    SubtitleManager.showWordHighlight(spokenText);
                    SubtitleManager.scheduleHide(Math.max(3000, spokenText.length * 80));
                }
            }

            // Track whether a tour function was executed
            let tourFunctionExecuted = false;
            if (response.function_calls && response.function_calls.length > 0) {
                const tourFunctions = [
                    "start_guided_tour",
                    "stop_guided_tour",
                    "next_tour_stop",
                ];
                tourFunctionExecuted = response.function_calls.some((c) =>
                    tourFunctions.includes(c.name),
                );
                FunctionExecutor.execute(response.function_calls);
            }

            // If the tour was just cancelled by FunctionExecutor, the pre-generated suggestions are stale.
            if (
                response.suggestions &&
                response.suggestions.includes("Resume tour") &&
                (!TourManager || !TourManager.activePlan)
            ) {
                let primaryAction =
                    response.function_calls && response.function_calls.length > 0
                        ? response.function_calls[0].name
                        : "";
                response.suggestions = this.getContextualSuggestions(
                    TDVBridge.getCurrentLocation(),
                    primaryAction,
                );
            }

            // Don't show AI suggestions if a tour function just ran —
            // TourManager renders its own UI in the suggestions area
            if (
                response.suggestions &&
                response.suggestions.length > 0 &&
                !tourFunctionExecuted
            ) {
                this.showSuggestions(response.suggestions);
            }

            // If tour was interrupted by this message, schedule resume countdown
            // ONLY starts AFTER the AI's voice response finishes — so user gets full 5s
            if (
                tourWasInterrupted &&
                TourManager &&
                TourManager.activePlan &&
                TourManager._isPaused
            ) {
                TourManager._scheduleResumeAfterSpeech();
            }
        },

        showTypingIndicator: function () {
            this.isTyping = true;
            UI.orb.classList.remove("idle");
            UI.orb.classList.add("thinking");
            UI.statusText.textContent = "Thinking...";
        },

        hideTypingIndicator: function () {
            this.isTyping = false;
            UI.orb.classList.remove("thinking");
            UI.orb.classList.add("idle");
            // FIX 2: Don't blank statusText here — displayResponse() calls speak() immediately
            // after, which renders the subtitle synchronously. Clearing here causes a visible
            // blank flash between "Thinking..." ending and the subtitle appearing.
        },

        showSuggestions: function (suggestions) {
            this.clearSuggestions();
            const sidePanel = document.querySelector(".ai-side-panel.left");
            if (suggestions.length > 0 && sidePanel) sidePanel.style.display = "flex";
            suggestions.forEach((item) => {
                const text = typeof item === "string" ? item : item.label;
                const chip = document.createElement("button");
                chip.className = "ai-suggestion-chip";
                chip.textContent = text;
                // Guard chip clicks — isTyping check prevents concurrent requests
                chip.addEventListener("click", () => {
                    if (this.isTyping) return;

                    if (typeof item === "object" && item.action) {
                        // ── Direct action execution — bypass fuzzy NLP entirely ──
                        ChatManager.addMessage("user", text);
                        this.clearSuggestions();
                        if (sidePanel) sidePanel.style.display = "none";

                        // BUG FIX: Map chip action name → FunctionExecutor [{name, args}] format.
                        // "navigate_panorama" (chip) → "navigate_to_panorama" (executor).
                        // Previously: execute(string, payload, callback) — iterated string chars → silent fail.
                        const callName = item.action === "navigate_panorama"
                            ? "navigate_to_panorama"
                            : item.action;
                        const callArgs = item.payload || {};
                        const calls = [{ name: callName, args: callArgs }];

                        // Speak/subtitle the action response
                        const spoken = ChatManager._getFallbackText(calls);
                        if (spoken && CONFIG.VOICE_ENABLED) {
                            VoiceManager.speak(spoken, spoken);
                        } else if (spoken && CONFIG.SUBTITLES_ENABLED) {
                            SubtitleManager.showWordHighlight(spoken);
                            SubtitleManager.scheduleHide(Math.max(3000, spoken.length * 80));
                        }

                        // Execute synchronously — navigation/camera calls are instant.
                        // No isTyping lock needed — that's only for async API calls.
                        FunctionExecutor.execute(calls);

                        // Refresh suggestions to reflect new context after nav settles.
                        // GUARD: skip if TourManager just took over the suggestions area
                        // (start_guided_tour fires at 600ms; this timeout fires at 800ms —
                        //  without the guard it wipes the tour's own progress UI).
                        setTimeout(() => {
                            if (TourManager && TourManager.activePlan) return;
                            const newSuggestions = ChatManager.getContextualSuggestions(
                                TDVBridge.getCurrentLocation(), callName
                            );
                            if (newSuggestions && newSuggestions.length > 0) {
                                ChatManager.showSuggestions(newSuggestions);
                            }
                        }, 800);
                    } else {
                        // Fallback: plain string chip → run through NLP router
                        this.sendMessage(text);
                    }
                });
                UI.suggestionsArea.appendChild(chip);
            });
        },

        clearSuggestions: function () {
            UI.suggestionsArea.innerHTML = "";
            const sidePanel = document.querySelector(".ai-side-panel.left");
            if (sidePanel) sidePanel.style.display = "none";
        },
    };

    // --- Module E: Voice Manager ---
    const VoiceManager = {
        recognition: null,
        isListening: false,
        isAwake: false, // For Wake Word detection
        wakeWord: "hey vista", // Change this to your preferred wake word
        _commandTimeout: null,
        _cancelledAutoListen: false,
        synth: window.speechSynthesis,
        _useBrowserTTS: true, // ← DEFAULT: browser TTS (free). Overridden by init() if user chose AI HD.
        _browserSpeaking: false, // visual state only (orb animation)
        _isFetchingGroq: false, // True while waiting for TTS API response
        _currentSpeechPromise: null, // resolves when current browser utterance truly ends
        _audioContext: null,
        _analyser: null,
        _source: null,
        _animationFrame: null,

        init: function () {
            this._useBrowserTTS = false; // Try Node.js TTS backend first, fallback to browser if it fails
            const SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;

                this.recognition.onstart = () => {
                    this.isListening = true;
                    if (this.isAwake) {
                        UI.micBtn.classList.add("active");
                        UI.orb.classList.remove("idle");
                        UI.orb.classList.add("listening");
                    }
                };

                this.recognition.onend = () => {
                    this.isListening = false;
                    if (!this._cancelledAutoListen) {
                        setTimeout(() => {
                            try { this.recognition.start(); } catch (e) { }
                        }, 250);
                    } else if (this.isAwake) {
                        this.sleep();
                    }
                };

                this.recognition.onresult = (event) => {
                    let interimTranscript = '';
                    let finalTranscript = '';

                    for (let i = Math.max(0, event.resultIndex - 5); i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    const fullTranscript = (finalTranscript + " " + interimTranscript).toLowerCase().trim();

                    if (!this.isAwake) {
                        // Check for wake word using fuzzy match
                        if (fullTranscript.includes(this.wakeWord) ||
                            fullTranscript.includes("hey ai") ||
                            fullTranscript.includes("hey vista") ||
                            fullTranscript.includes("hey") ||
                            fullTranscript.includes("hey guide") ||
                            fullTranscript.includes("hey vista ai") ||
                            fullTranscript.includes("assistant")) {

                            console.log("[WakeWord] Detected wake word:", fullTranscript);
                            this.wakeUp();

                            // Extract anything said AFTER the wake word
                            const wakeWordRegex = new RegExp(`(${this.wakeWord}|hey from|hay vista|hey mr|hey guide|hey ai|hey vista ai|assistant)`);
                            const parts = fullTranscript.split(wakeWordRegex);
                            const command = parts.length > 2 ? parts.pop().trim() : "";

                            if (command) {
                                UI.statusText.textContent = `"${command}"`;
                                this.resetCommandTimeout(command);
                            }
                        }
                    } else {
                        // We are awake, capture command
                        const wakeWordRegex = new RegExp(`(${this.wakeWord}|hey from|hay vista|hey mr|hey guide|hey ai|hey vista ai|assistant)`);
                        const parts = fullTranscript.split(wakeWordRegex);
                        const command = parts.length > 2 ? parts.pop().trim() : fullTranscript;

                        // Only process if the command isn't empty (e.g. they just said the wake word)
                        if (command) {
                            UI.statusText.textContent = `"${command}"`;
                            this.resetCommandTimeout(command);
                        }
                    }
                };

                this.recognition.onerror = (event) => {
                    console.error("Speech recognition error:", event.error);
                    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                        this._cancelledAutoListen = true;
                        
                        // --- FALLBACK UI ---
                        if (UI.statusText) {
                            UI.statusText.innerHTML = `<span style="color: #ffaaaa;">Microphone access denied.</span> Type below 👇`;
                        }
                        const badge = document.querySelector('.ai-callout-badge');
                        if (badge) badge.classList.remove('show');
                        if (UI.micBtn) {
                            UI.micBtn.style.opacity = "0.5";
                            UI.micBtn.style.pointerEvents = "none";
                        }
                        if (UI.keyboardOverlay) {
                            UI.keyboardOverlay.classList.add("active");
                        }
                    }
                    if (this.isAwake) this.sleep();
                };

                // Start background listening immediately
                try {
                    this.recognition.start();
                } catch (e) {
                    document.body.addEventListener('click', () => {
                        if (!this.isListening && !this._cancelledAutoListen) {
                            try { this.recognition.start(); } catch (err) { }
                        }
                    }, { once: true });
                }
            } else {
                // FALLBACK for unsupported browsers
                UI.micBtn.style.display = "none"; 
                if (UI.statusText) {
                    UI.statusText.innerHTML = `<span style="color: #ffaaaa;">Voice not supported.</span> Type below 👇`;
                }
                const badge = document.querySelector('.ai-callout-badge');
                if (badge) badge.classList.remove('show');
                if (UI.keyboardOverlay) {
                    UI.keyboardOverlay.classList.add("active");
                }
            }
        },

        wakeUp: function () {
            this.isAwake = true;
            // Play a subtle ding sound
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.start();
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
                oscillator.stop(audioCtx.currentTime + 0.5);
            } catch (e) { }

            if (UI.panel && !UI.panel.classList.contains("active")) {
                UI.panel.classList.add("active");
                if (UI.floatingBtn) UI.floatingBtn.style.display = "none";
                ChatManager.playGreeting();
            }

            UI.micBtn.classList.add("active");
            UI.orb.classList.remove("idle");
            UI.orb.classList.add("listening");
            UI.statusText.textContent = "I'm listening...";
        },

        sleep: function () {
            this.isAwake = false;
            UI.micBtn.classList.remove("active");
            UI.orb.classList.remove("listening");
            UI.orb.classList.add("idle");
            if (UI.statusText.textContent === "I'm listening...") {
                UI.statusText.textContent = "";
            }
            if (this._commandTimeout) clearTimeout(this._commandTimeout);
        },

        resetCommandTimeout: function (command) {
            if (this._commandTimeout) clearTimeout(this._commandTimeout);
            this._commandTimeout = setTimeout(() => {
                if (command && command.length > 0) {
                    UI.inputField.value = command;
                    ChatManager.handleInputSend();
                }
                this.sleep();
            }, 1500);
        },

        toggleListening: function () {
            if (!this.recognition) return;
            if (this.isAwake) {
                this.sleep();
            } else {
                this.stopSpeaking();
                if (!this.isListening) {
                    try { this.recognition.start(); } catch (e) { }
                }
                this.wakeUp();
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

            // If Node.js TTS failed previously, use browser directly
            if (this._useBrowserTTS) {
                this._browserSpeak(text, subtitleText);
                return;
            }

            // Split into sentences — first sentence plays FAST, rest queue up
            const sentences = this._splitSentences(text);
            this._speakQueue(sentences, 0, subtitleText);
        },

        // Play sentences one by one via Free Node.js TTS
        _speakQueue: function (sentences, index, subtitleText) {
            if (this._cancelled || index >= sentences.length) return;

            const sentence = sentences[index].trim();
            if (!sentence) {
                this._speakQueue(sentences, index + 1, subtitleText);
                return;
            }

            const apiUrl = CONFIG.TTS_API;
            const self = this;

            // Schedule pre-fetch of the NEXT sentence
            const scheduleNextPrefetch = () => {
                if (index + 1 < sentences.length) {
                    const next = sentences[index + 1].trim();
                    const nextIndex = index + 1;
                    if (next && self._prefetchedBlobForIndex !== nextIndex) {
                        setTimeout(() => {
                            if (self._cancelled) return;
                            fetch(apiUrl, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ text: next }),
                            })
                                .then((r) => (r.ok ? r.blob() : null))
                                .then((blob) => {
                                    if (!self._cancelled && blob) {
                                        self._prefetchedBlob = blob;
                                        self._prefetchedBlobForIndex = nextIndex;
                                    }
                                })
                                .catch(() => { });
                        }, 500);
                    }
                }
            };

            // Core: fetch blob for this sentence then play it
            const run = () => {
                if (self._cancelled) return;
                self._isFetchingGroq = true;

                const cachedBlobReady =
                    self._prefetchedBlobForIndex === index && self._prefetchedBlob;
                const blobToUse = cachedBlobReady ? self._prefetchedBlob : null;

                if (cachedBlobReady) {
                    self._prefetchedBlob = null;
                    self._prefetchedBlobForIndex = null;
                }

                const getBlob = blobToUse
                    ? Promise.resolve(blobToUse)
                    : fetch(apiUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: sentence }),
                    }).then((response) => {
                        if (!response.ok) throw new Error("TTS failed");
                        return response.blob();
                    });

                scheduleNextPrefetch();

                getBlob
                    .then((blob) => {
                        self._isFetchingGroq = false;
                        if (!blob || self._cancelled) return;
                        const audioUrl = URL.createObjectURL(blob);
                        self._currentAudio = new Audio(audioUrl);
                        self._currentAudio.playbackRate = 1.15;
                        self._currentAudio.crossOrigin = "anonymous";

                        // Karaoke: render this sentence's words as highlight spans
                        // Uses word-length-proportional timing — each word is allocated
                        // time proportional to its character count (+ punctuation weight),
                        // which tracks natural speech rhythm far better than linear progress.
                        let groqWordMap = [];
                        let _highlightRafId = null;

                        const buildWordTimings = (wMap, duration) => {
                            // Calculate total weight: char count + 0.5 extra for each punctuation char
                            const weights = wMap.map((w) => {
                                const punctBonus =
                                    (w.word.match(/[,;:—–]/g) || []).length * 0.5;
                                return w.length + punctBonus;
                            });
                            const totalWeight = weights.reduce((a, b) => a + b, 0);
                            // Assign start/end time in seconds to each word
                            let elapsed = 0;
                            return wMap.map((w, i) => {
                                const frac = weights[i] / totalWeight;
                                const start = elapsed;
                                const end = elapsed + frac * duration;
                                elapsed = end;
                                return { ...w, timeStart: start, timeEnd: end };
                            });
                        };

                        let wordTimings = [];

                        const updateHighlight = () => {
                            if (!self._currentAudio || !wordTimings.length) return;
                            const t = self._currentAudio.currentTime;
                            // Find the word whose window contains t
                            let activeIdx = 0;
                            for (let i = 0; i < wordTimings.length; i++) {
                                if (t >= wordTimings[i].timeStart) activeIdx = i;
                            }
                            SubtitleManager.highlightWordByIndex(activeIdx);
                            if (!self._currentAudio.paused && !self._currentAudio.ended) {
                                _highlightRafId = requestAnimationFrame(updateHighlight);
                            }
                        };

                        self._currentAudio.onplay = () => {
                            if (UI.orb) UI.orb.classList.add("speaking");
                            self._startVisualizer(self._currentAudio);
                            if (CONFIG.SUBTITLES_ENABLED) {
                                groqWordMap = SubtitleManager.showWordHighlight(sentence);
                            }
                        };

                        // Build timings once duration is known (fires after metadata loads)
                        self._currentAudio.onloadedmetadata = () => {
                            if (groqWordMap.length && self._currentAudio) {
                                wordTimings = buildWordTimings(
                                    groqWordMap,
                                    self._currentAudio.duration,
                                );
                                if (_highlightRafId) cancelAnimationFrame(_highlightRafId);
                                _highlightRafId = requestAnimationFrame(updateHighlight);
                            }
                        };

                        self._currentAudio.onended = () => {
                            if (_highlightRafId) cancelAnimationFrame(_highlightRafId);
                            if (UI.orb) {
                                UI.orb.classList.remove("speaking");
                                UI.orb.style.transform = "";
                            }
                            SubtitleManager.clearWordHighlight();
                            self._stopVisualizer();
                            URL.revokeObjectURL(audioUrl);
                            self._currentAudio = null;
                            wordTimings = [];
                            if (index + 1 >= sentences.length) {
                                SubtitleManager.scheduleHide(3000);
                            }
                            self._speakQueue(sentences, index + 1, subtitleText);
                        };
                        self._currentAudio.play();
                    })
                    .catch((err) => {
                        self._isFetchingGroq = false;
                        console.warn("[TTS] Falling back to browser:", err.message);
                        const remaining = sentences.slice(index).join(" ");
                        // FIX 3b: catch() path also gets subtitle
                        self._browserSpeak(remaining, subtitleText || remaining);
                    });
            };

            // No rate-limit stagger needed for local TTS
            run();
        },

        // Browser speech synthesis
        // Returns a Promise that resolves when the utterance truly ends.
        _browserSpeak: function (text, subtitleText) {
            if (!this.synth) {
                this._currentSpeechPromise = Promise.resolve();
                return;
            }

            // Only cancel previous speech when no tour is active.
            const isTourActive =
                typeof TourManager !== "undefined" &&
                TourManager &&
                TourManager.activePlan;
            if (!isTourActive) {
                this.synth.cancel();
                this._browserSpeaking = false;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            const voices = this.synth.getVoices();
            const preferred =
                voices.find(
                    (v) =>
                        v.name.includes("Microsoft Zira") ||
                        v.name.includes("Google UK English Female") ||
                        v.lang.includes("en-GB"),
                ) || voices.find((v) => v.lang.includes("en-US"));
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

            this._currentSpeechPromise = new Promise((resolve) => {
                let started = false;

                // ── 2-second start watchdog ────────────────────────────────
                // Chrome bug: synth.cancel() + immediate synth.speak() can silently
                // drop the utterance (onend/onerror never fire). If onstart hasn't
                // fired within 2s, the utterance was dropped — resolve anyway.
                const startWatchdog = setTimeout(() => {
                    if (!started) {
                        console.warn(
                            "[TTS] Utterance start timeout — browser may have dropped it (Chrome cancel bug)",
                        );
                        done();
                    }
                }, 2000);

                const done = () => {
                    clearTimeout(startWatchdog);
                    this._browserSpeaking = false;
                    SubtitleManager.clearWordHighlight(); // remove karaoke highlight
                    SubtitleManager.scheduleHide(3000); // auto-hide text
                    if (UI.orb) {
                        UI.orb.classList.remove("speaking");
                        UI.orb.classList.add("idle");
                    }
                    if (UI.orbGlass) {
                        UI.orbGlass.classList.remove("browser-tts-pulse");
                        UI.orbGlass.style.transform = "";
                    }
                    resolve();
                };

                utterance.onstart = () => {
                    started = true;
                    clearTimeout(startWatchdog); // utterance started OK
                    this._browserSpeaking = true;
                    if (UI.orb) {
                        UI.orb.classList.remove("idle");
                        UI.orb.classList.add("speaking");
                    }
                    if (UI.orbGlass) UI.orbGlass.classList.add("browser-tts-pulse");
                    // subtitle already rendered synchronously above — nothing to do here
                };
                // Highlight each word as the browser reads it
                utterance.onboundary = (event) => {
                    if (event.name === "word" && wordMap.length > 0) {
                        SubtitleManager.highlightWord(event.charIndex, wordMap);
                    }
                };
                utterance.onend = done;
                utterance.onerror = (e) => {
                    console.warn("[TTS] Browser utterance error:", e.error);
                    done();
                };
            });

            // ── FIX: Chrome cancel() + speak() silent-drop bug ────────────────
            // Calling synth.speak() in the same tick as synth.cancel() causes Chrome
            // to silently drop the new utterance. Deferring by one event-loop tick
            // (setTimeout 0) lets the cancel settle before the next speak().
            setTimeout(() => this.synth.speak(utterance), 0);
        },

        _startVisualizer: function (audioElement) {
            try {
                if (!this._audioContext) {
                    this._audioContext = new (
                        window.AudioContext || window.webkitAudioContext
                    )();
                    this._analyser = this._audioContext.createAnalyser();
                    this._analyser.fftSize = 256;
                }

                if (this._audioContext.state === "suspended") {
                    this._audioContext.resume();
                }

                // Connect source
                this._source =
                    this._audioContext.createMediaElementSource(audioElement);
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
                    for (let i = 0; i < dataArray.length; i++) {
                        if (dataArray[i] > peak) peak = dataArray[i];
                    }

                    // Map peak (0-255) to target scale (1.0 to 1.15)
                    const targetScale = 1.0 + Math.pow(peak / 255, 1.5) * 0.15;

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

        _stopVisualizer: function () {
            if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
            if (this._source) {
                this._source.disconnect();
                this._source = null;
            }
        },

        stopSpeaking: function () {
            this._cancelled = true;
            this._browserSpeaking = false;
            this._currentSpeechPromise = null; // discard pending utterance promise
            this._prefetchedBlob = null;
            if (UI.orb) {
                UI.orb.classList.remove("speaking");
                UI.orb.classList.add("idle");
            }
            if (UI.orbGlass) {
                UI.orbGlass.classList.remove("browser-tts-pulse");
                UI.orbGlass.style.transform = "";
            }
            this._stopVisualizer();
            if (this._currentAudio) {
                this._currentAudio.pause();
                this._currentAudio = null;
            }
            if (this.synth && this.synth.speaking) this.synth.cancel();

            // Clear any lingering subtitle text
            if (typeof SubtitleManager !== "undefined") {
                SubtitleManager.hideSubtitle();
            }
        },
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
            let html = "";
            const wordMap = [];

            for (const part of parts) {
                if (part.trim()) {
                    // Escape HTML entities to prevent XSS in subtitle display
                    const safe = part
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                    html += `<span class="tts-word" data-word="${wordIndex}">${safe}</span>`;
                    wordMap.push({
                        start: pos,
                        length: part.length,
                        index: wordIndex,
                        word: part,
                    });
                    wordIndex++;
                } else {
                    html += part; // spaces as plain text
                }
                pos += part.length;
            }

            UI.statusText.innerHTML = html;
            return wordMap;
        },

        // Highlight the word at charIndex (for browser onboundary events)
        highlightWord: function (charIndex, wordMap) {
            if (!UI.statusText || !wordMap || wordMap.length === 0) return;
            let activeIdx = 0;
            // Scan full array — no early break so last-word always activates
            for (let i = 0; i < wordMap.length; i++) {
                if (wordMap[i].start <= charIndex) activeIdx = i;
            }
            this.highlightWordByIndex(activeIdx);
        },

        // Highlight the word at an explicit index (for Node TTS time-based highlight)
        highlightWordByIndex: function (activeIdx) {
            if (!UI.statusText) return;
            const spans = UI.statusText.querySelectorAll(".tts-word");
            if (!spans.length) return;
            let prevActive = UI.statusText.querySelector(".tts-word-active");
            // Skip DOM update if already the same word (prevents flicker)
            if (prevActive && parseInt(prevActive.dataset.word) === activeIdx) return;
            spans.forEach((el, i) =>
                el.classList.toggle("tts-word-active", i === activeIdx),
            );
            // Auto-scroll active word into view
            const activeEl = spans[activeIdx];
            if (activeEl) {
                activeEl.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "nearest",
                });
            }
        },

        // Clear all word highlights without wiping the innerHTML
        clearWordHighlight: function () {
            if (!UI.statusText) return;
            UI.statusText
                .querySelectorAll(".tts-word-active")
                .forEach((el) => el.classList.remove("tts-word-active"));
        },

        scheduleHide: function (delay) {
            if (this.timeoutId) clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => {
                this.hideSubtitle();
            }, delay || 3000);
        },

        hideSubtitle: function () {
            if (this._typewriterInterval) {
                clearInterval(this._typewriterInterval);
                this._typewriterInterval = null;
            }
            UI.statusText.textContent = "";
        },

        typewriterEffect: function (text, element, speed) {
            // Cancel any existing typewriter animation
            if (this._typewriterInterval) {
                clearInterval(this._typewriterInterval);
                this._typewriterInterval = null;
            }
            element.textContent = "";
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
        },
    };

    // --- Module G: Function Executor ---
    const FunctionExecutor = {
        execute: function (calls) {
            for (const call of calls) {
                console.log("[FunctionExecutor] Executing:", call.name, call.args);

                try {
                    // Cancel the tour if a conflicting command is requested
                    const allowedDuringTour = [
                        "stop_guided_tour",
                        "next_tour_stop",
                        "previous_tour_stop",
                        "look_around",
                        "toggle_fullscreen",
                        "toggle_music",
                        "set_music_volume",
                    ];
                    if (
                        TourManager &&
                        TourManager.activePlan &&
                        !allowedDuringTour.includes(call.name)
                    ) {
                        console.log(
                            `[FunctionExecutor] Cancelling active tour due to conflicting request: ${call.name}`,
                        );
                        TourManager.stop("user");
                    }

                    switch (call.name) {
                        // ── Original 12 ──────────────────────────────────────────
                        case "navigate_to_panorama":
                        case "navigate_panorama": // ← alias used by suggestion chips
                            TDVBridge.navigateByLabel(call.args.location);
                            break;
                        case "control_camera":
                            TDVBridge.controlCamera(call.args.direction, call.args.degrees);
                            break;
                        case "zoom_camera":
                            TDVBridge.zoomCamera(call.args.direction, call.args.amount);
                            break;
                        case "toggle_fullscreen":
                            TDVBridge.toggleFullscreen();
                            break;
                        case "toggle_music":
                            TDVBridge.toggleMusic();
                            break;
                        case "get_current_location": {
                            const loc = TDVBridge.getCurrentLocation();
                            console.log("[FunctionExecutor] Current location:", loc);
                            break;
                        }
                        case "start_guided_tour":
                            // Delay start so any preceding speech utterance (e.g. "Starting tour now!")
                            // has time to fire synth.speak() before TourManager.start() cancels it.
                            UI.statusText.textContent = "Starting tour...";
                            if (UI.orb) {
                                UI.orb.classList.remove("thinking");
                                UI.orb.classList.add("idle");
                            }
                            setTimeout(() => TourManager.start(call.args.tour_name), 600);
                            break;
                        case "stop_guided_tour":
                            TourManager.stop("user");
                            break;
                        case "next_tour_stop":
                            TourManager.nextStop();
                            break;
                        case "open_panorama_list":
                            TDVBridge.openPanoramaList();
                            break;
                        case "close_panorama_list":
                            TDVBridge.closePanoramaList();
                            break;
                        case "open_menu":
                            TDVBridge.openMenu();
                            break;
                        case "close_menu":
                            TDVBridge.closeMenu();
                            break;
                        case "look_around":
                            TDVBridge.lookAround();
                            break;
                        case "open_search":
                            TDVBridge.openSearch();
                            if (call.args && call.args.query) {
                                setTimeout(() => {
                                    const inp = document.getElementById("searchInput");
                                    if (inp) {
                                        inp.value = call.args.query;
                                        inp.dispatchEvent(new Event("input"));
                                    }
                                }, 100);
                            }
                            break;
                        case "close_search":
                            TDVBridge.closeSearch();
                            break;
                        case "open_contact":
                            TDVBridge.openContact();
                            break;
                        case "close_contact":
                            TDVBridge.closeContact();
                            break;
                        case "open_street_view":
                            TDVBridge.openStreetView();
                            break;
                        case "close_street_view":
                            // Emulate Escape key to close the GSV popup if it's open
                            document.dispatchEvent(
                                new KeyboardEvent("keydown", { key: "Escape" }),
                            );
                            break;

                        // ── Sequential Navigation ────────────────────────────────
                        case "navigate_previous":
                            TDVBridge.navigatePrevious();
                            break;
                        case "navigate_first":
                            TDVBridge.navigateFirst();
                            break;
                        case "navigate_last":
                            TDVBridge.navigateLast();
                            break;
                        case "navigate_next":
                            TDVBridge.navigateNext();
                            break;
                        case "navigate_to_index":
                            if (
                                call.args &&
                                call.args.index >= 0 &&
                                call.args.index < TDVBridge._panoramas.length
                            ) {
                                window.tour.setMediaByIndex(
                                    TDVBridge._panoramas[call.args.index].playlistIndex,
                                );
                            }
                            break;

                        // ── F23: random_panorama ─────────────────────────────────
                        case "random_panorama": {
                            const panos = TDVBridge._panoramas;
                            if (panos.length > 0) {
                                const currLoc = TDVBridge.getCurrentLocation();
                                const currI = panos.findIndex((p) => p.label === currLoc);
                                let rnd;
                                do {
                                    rnd = Math.floor(Math.random() * panos.length);
                                } while (rnd === currI && panos.length > 1);
                                TDVBridge.navigateToPanorama(panos[rnd].playlistIndex);
                            }
                            break;
                        }

                        // ── F24: previous_tour_stop ──────────────────────────────
                        case "previous_tour_stop":
                            if (TourManager.activePlan) {
                                TourManager.prevStop();
                            } else {
                                UI.statusText.textContent =
                                    "No guided tour is currently active.";
                            }
                            break;

                        // ── F25: jump_to_tour_stop ───────────────────────────────
                        case "jump_to_tour_stop": {
                            if (TourManager.activePlan) {
                                const panos = TDVBridge._panoramas;
                                const idx = panos.findIndex((p) =>
                                    p.label
                                        .toLowerCase()
                                        .includes((call.args.location || "").toLowerCase()),
                                );
                                if (idx >= 0) {
                                    TourManager.currentStopIndex = idx; // _playCurrentStop reads index directly
                                    TourManager._playCurrentStop();
                                } else {
                                    UI.statusText.textContent = `No stop found for "${call.args.location}".`;
                                }
                            } else {
                                UI.statusText.textContent =
                                    'No guided tour is currently active. Say "Start the tour" first.';
                            }
                            break;
                        }

                        // ── F26: reset_view ──────────────────────────────────────
                        case "reset_view":
                            TDVBridge.resetView();
                            break;

                        // ── F27: set_music_volume ────────────────────────────────
                        case "set_music_volume":
                            if (window.bgAudio) {
                                const vol = Math.max(
                                    0,
                                    Math.min(100, Number(call.args.level) || 0),
                                );
                                window.bgAudio.volume = vol / 100;
                                // If muting, pause; if un-muting and paused, play
                                if (vol === 0 && !window.bgAudio.paused) window.bgAudio.pause();
                                else if (vol > 0 && window.bgAudio.paused)
                                    window.bgAudio.play();
                            }
                            break;

                        // ── F28: open_related_campus ─────────────────────────────
                        case "open_related_campus": {
                            const campuses = window.relatedCampuses || [];
                            const query = (call.args.campus_name || "").toLowerCase();
                            const match = campuses.find((c) =>
                                c.title.toLowerCase().includes(query),
                            );
                            if (match) {
                                window.open(match.url, "_blank");
                            } else {
                                const names = campuses.map((c) => c.title).join(", ");
                                UI.statusText.textContent = names
                                    ? `Available campuses: ${names}`
                                    : "No related campuses configured.";
                            }
                            break;
                        }
                    }
                } catch (e) {
                    console.error(
                        `[FunctionExecutor] Failed to execute ${call.name}:`,
                        e,
                    );
                }
            }
        },
    };

    // --- Module H: Tour Manager (Guided Tours) ---
    // The tour sequence ALWAYS follows the exact dynamic panolist order
    // from TDVBridge._panoramas (extracted at runtime from the 3DVista engine).
    const TourManager = {
        activePlan: null,
        currentStopIndex: 0,
        advanceTimeout: null,
        _narrations: {
            "Main Entrance":
                "Welcome to Mount Zion International School! Let's begin our tour right here, at the Main Entrance. Every single morning, over a thousand students walk through these gates to start their learning journey. Notice the warm and welcoming design. It really sets the perfect tone for everything you're about to see inside.",
            "Sports Facility":
                "Here we are, at the Sports Facility! This sprawling ground comes alive with energy every single day. From football matches to athletic training, this is exactly where our students build teamwork, discipline, and physical fitness.",
            "Main Building":
                "This is the front entrance of our main academic building. The architecture beautifully blends modern design with practical, student-friendly spaces. Right behind this facade are the major classrooms and offices that make up the heart of our academic life.",
            "School Courtyard":
                "Welcome to the School Courtyard. You could say this is truly the soul of campus life! Every morning, the entire school gathers right here for assembly. It's a vibrant open space where cultural programs, celebrations, and even spontaneous games take place.",
            "Computer Lab":
                "Let's step into the Computer Lab. It's a state-of-the-art facility, equipped with modern systems and high-speed internet. In fact, coding is taught here from as early as Grade Three! It truly reflects our commitment to preparing students for a technology-driven world.",
            "Chemistry Lab":
                "Welcome to the Chemistry Lab, where science really comes to life! Following strict safety standards, students perform dozens of hands-on experiments here every year. We have individual workstations, a fume hood, and fully stocked equipment benches. Learning by doing is our motto!",
            Library:
                "Ah, the Library. It's a quiet sanctuary housing over five thousand books, spanning every subject and reading level. There's even a dedicated children's section for our youngest readers. This space is perfectly designed to nurture a lifelong love of learning.",
            "Kindergarten Classroom":
                "And finally, here is our Kindergarten Classroom! This is a colorful and joyful space, designed specifically for the youngest minds on campus. We focus heavily on play-based learning. With interactive boards, art supplies, and learning aids, we make sure every day is an adventure!",
        },
        _about_narrations: {
            "Main Entrance":
                "This is the Main Entrance of Mount Zion International School. Every morning, over a thousand students walk through these gates to start their learning journey. The warm and welcoming design sets the perfect tone for the campus.",
            "Sports Facility":
                "This is the Sports Facility. This sprawling ground comes alive with energy every single day. From football matches to athletic training, this is where our students build teamwork, discipline, and physical fitness.",
            "Main Building":
                "This is the front entrance of the main academic building. The architecture blends modern design with practical, student-friendly spaces. Right behind this facade are the major classrooms and offices.",
            "School Courtyard":
                "This is the School Courtyard, the soul of campus life. Every morning, the entire school gathers here for assembly. It's a vibrant open space where cultural programs, celebrations, and spontaneous games take place.",
            "Computer Lab":
                "This is the Computer Lab, a state-of-the-art facility equipped with modern systems and high-speed internet. Coding is taught here from as early as Grade Three, reflecting a commitment to preparing students for a technology-driven world.",
            "Chemistry Lab":
                "This is the Chemistry Lab. Following strict safety standards, students perform dozens of hands-on experiments here every year. We have individual workstations, a fume hood, and fully stocked equipment benches.",
            Library:
                "This is the Library, a quiet sanctuary housing over five thousand books spanning every subject and reading level. There is even a dedicated children's section, designed to nurture a lifelong love of learning.",
            "Kindergarten Classroom":
                "This is the Kindergarten Classroom, a colorful and joyful space designed specifically for the youngest minds on campus. We focus heavily on play-based learning with interactive boards, art supplies, and learning aids.",
        },
        _isPaused: false,
        _resumeCountdown: null,
        _viewerListenerActive: false,
        _interactionDebounce: null,

        // Detect when user manually drags/zooms the panorama during a tour
        _setupViewerInteraction: function () {
            if (this._viewerListenerActive) return;
            const viewer = document.getElementById("viewer");
            if (!viewer) return;

            const handler = this._onViewerInteraction.bind(this);
            // Use capture so we catch events before 3DVista's own handlers
            viewer.addEventListener("mousedown", handler, true);
            viewer.addEventListener("touchstart", handler, true);
            viewer.addEventListener("wheel", handler, true);
            this._viewerListenerActive = true;
            console.log("[TourManager] Viewer interaction listeners attached");
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
            const panoName = pano ? pano.label : "current location";
            const planName = this.activePlan ? this.activePlan.name : "Guided Tour";

            const leftSidePanel = document.querySelector(".ai-side-panel.left");
            if (leftSidePanel) leftSidePanel.style.display = "flex";

            UI.suggestionsArea.innerHTML = `
                <div class="ai-suggestion-chip" style="background: rgba(255,200,0,0.08); border-color: #FFC800; cursor: default; text-align: center;">
                    <b>${planName}</b> — <span style="color:#FFC800">Paused</span><br/>
                    <span style="opacity:0.7">${panoName}</span><br/>
                    <span style="font-size:0.85em;">Ask me anything! Tour will resume shortly.</span>
                </div>
                <button class="ai-suggestion-chip" id="ai-tour-resume-now-btn" style="color: #00F0FF; border-color: #00F0FF;">&#9654; Resume Now</button>
                <button class="ai-suggestion-chip" id="ai-tour-stop-btn" style="color: #FF4545;">Stop Tour</button>
            `;
            document
                .getElementById("ai-tour-resume-now-btn")
                ?.addEventListener("click", () => {
                    this._isPaused = false;
                    this._playCurrentStop();
                });
            document
                .getElementById("ai-tour-stop-btn")
                ?.addEventListener("click", () => {
                    this.stop("user");
                });

            console.log(
                "[TourManager] ⏸ Tour paused at stop",
                this.currentStopIndex + 1,
                ":",
                panoName,
            );
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
                        console.log(
                            "[TourManager] ▶ Resuming tour from stop",
                            this.currentStopIndex + 1,
                        );
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
            const panoName = pano ? pano.label : "current location";
            const planName = this.activePlan ? this.activePlan.name : "Guided Tour";

            const leftSidePanel = document.querySelector(".ai-side-panel.left");
            if (leftSidePanel) leftSidePanel.style.display = "flex";

            UI.suggestionsArea.innerHTML = `
                <div class="ai-suggestion-chip" style="background: rgba(0,240,255,0.08); border-color: #00F0FF; cursor: default; text-align: center;">
                    <b>${planName}</b><br/>
                    <span style="opacity:0.7">Paused at: ${panoName}</span><br/>
                    <span style="color:#00F0FF; font-size:1.15em; font-weight:600">⏱ Resuming in ${seconds}s…</span>
                </div>
                <button class="ai-suggestion-chip" id="ai-tour-resume-now-btn" style="color: #00F0FF; border-color: #00F0FF;">&#9654; Resume Now</button>
                <button class="ai-suggestion-chip" id="ai-tour-stop-btn" style="color: #FF4545;">Stop Tour</button>
            `;

            document
                .getElementById("ai-tour-resume-now-btn")
                ?.addEventListener("click", () => {
                    if (this._resumeCountdown) clearInterval(this._resumeCountdown);
                    this._resumeCountdown = null;
                    this._isPaused = false;
                    this._playCurrentStop();
                });
            document
                .getElementById("ai-tour-stop-btn")
                ?.addEventListener("click", () => {
                    if (this._resumeCountdown) clearInterval(this._resumeCountdown);
                    this._resumeCountdown = null;
                    this.stop("user");
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
                    const groqPlaying =
                        VoiceManager._currentAudio && !VoiceManager._currentAudio.paused;
                    const browserPlaying =
                        VoiceManager.synth && VoiceManager.synth.speaking;
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
            this.stop("silent"); // Stop any existing tour silently
            this._setupViewerInteraction(); // Listen for manual pano interaction

            // The tour sequence comes from the DYNAMIC panolist
            const panoramas = TDVBridge._panoramas;
            if (!panoramas || panoramas.length === 0) {
                console.warn("[TourManager] No panoramas available from TDVBridge");
                VoiceManager.speak(
                    "I'm sorry, I couldn't load the panorama list. Please try again in a moment.",
                    true,
                );
                return;
            }

            // ALWAYS start from the very first panorama in panolist order
            this.currentStopIndex = 0;
            this.activePlan = {
                name: tourName || "Full Campus Tour",
                description: "Complete guided tour",
            };

            // Update panel title to show tour is running
            const leftPanelTitle = document.querySelector(
                ".ai-side-panel.left .ai-panel-title",
            );
            if (leftPanelTitle) leftPanelTitle.textContent = "Guided Tour";

            // Make sure the AI panel is open so user can see tour progress
            if (UI.panel && !UI.panel.classList.contains("active")) {
                UI.panel.classList.add("active");
                if (UI.floatingBtn) UI.floatingBtn.style.display = "none";
            }

            // Show the left side panel immediately so chip appears before navigation
            const leftSidePanel = document.querySelector(".ai-side-panel.left");
            if (leftSidePanel) leftSidePanel.style.display = "flex";

            console.log(
                "[TourManager] Starting tour with",
                panoramas.length,
                "stops in panolist order",
            );

            console.log("[TourManager] Narrations ready (global).");

            // _playCurrentStop() owns ALL navigation — no double-navigate here
            this._playCurrentStop();
        },

        nextStop: function () {
            if (!this.activePlan) return;

            this.currentStopIndex++;
            const panoramas = TDVBridge._panoramas;

            if (this.currentStopIndex >= panoramas.length) {
                // ── Tour complete ──────────────────────────────────────────
                const completionMsg = `That concludes our guided tour of Mount Zion International School! We have visited all ${panoramas.length} locations. I hope you enjoyed the experience. Feel free to explore any area further, or ask me anything about the campus.`;
                this.stop("silent"); // Reset state silently first
                // Then speak + show completion message
                if (CONFIG.VOICE_ENABLED)
                    VoiceManager.speak(completionMsg, completionMsg);
                else if (CONFIG.SUBTITLES_ENABLED)
                    SubtitleManager.showSubtitle(completionMsg);
                ChatManager.showSuggestions([
                    { label: "Start Tour Again", action: "start_guided_tour" },
                    { label: "Go to Library", action: "navigate_panorama", payload: { location: "Library" } },
                    { label: "All Locations", action: "open_panorama_list" },
                ]);
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
                UI.statusText.textContent =
                    "You're already at the first stop of the tour.";
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
            this._waitingForSpeech = false;
            if (this.advanceTimeout) clearTimeout(this.advanceTimeout);
            TDVBridge.cancelRotation();
            VoiceManager.stopSpeaking();

            // Restore UI
            const leftPanelTitle = document.querySelector(
                ".ai-side-panel.left .ai-panel-title",
            );
            if (leftPanelTitle) leftPanelTitle.textContent = "Suggestions";

            if (reason !== "silent" && wasActive) {
                const byeMsg =
                    reason === "user"
                        ? "Tour stopped! You can explore freely or ask me to start again anytime."
                        : "The guided tour has ended. Let me know if you'd like to explore more!";
                if (CONFIG.VOICE_ENABLED) VoiceManager.speak(byeMsg, byeMsg);
                else if (CONFIG.SUBTITLES_ENABLED) SubtitleManager.showSubtitle(byeMsg);
                ChatManager.showSuggestions([
                    { label: "Start Tour Again", action: "start_guided_tour" },
                    { label: "Where Am I?", action: "get_current_location" },
                    { label: "All Locations", action: "open_panorama_list" },
                ]);
            } else {
                ChatManager.clearSuggestions();
            }
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
                const finish = () => {
                    if (!done) {
                        done = true;
                        self._waitingForSpeech = false;
                        resolve();
                    }
                };
                const maxWait = setTimeout(finish, 60000);

                // ── Groq TTS: poll _currentAudio and fetching state ───────────────────────────
                if (!VoiceManager._useBrowserTTS) {
                    var check = setInterval(function () {
                        if (!self._waitingForSpeech) {
                            clearInterval(check);
                            clearTimeout(maxWait);
                            finish();
                            return;
                        }
                        var playing =
                            (VoiceManager._currentAudio &&
                                !VoiceManager._currentAudio.paused) ||
                            VoiceManager._isFetchingGroq;
                        if (!playing) {
                            clearInterval(check);
                            clearTimeout(maxWait);
                            finish();
                        }
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
                p.then(() => {
                    clearTimeout(maxWait);
                    finish();
                });
            });
        },

        _playCurrentStop: async function () {
            if (!this.activePlan || this._isPaused) return;
            if (this.advanceTimeout) clearTimeout(this.advanceTimeout);

            const panoramas = TDVBridge._panoramas;
            const totalStops = panoramas.length;
            const currentPano = panoramas[this.currentStopIndex];

            // Fallback: pano missing from list
            if (!currentPano) {
                console.warn(
                    "[TourManager] No panorama at index",
                    this.currentStopIndex,
                    "— skipping to next",
                );
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

                if (UI.orb) {
                    UI.orb.classList.remove("thinking", "speaking");
                    UI.orb.classList.add("idle");
                }

                // Make sure the suggestions panel (left side) is visible
                const leftSidePanel = document.querySelector(".ai-side-panel.left");
                if (leftSidePanel) leftSidePanel.style.display = "flex";

                UI.suggestionsArea.innerHTML = `
                    <div class="ai-suggestion-chip" style="background: rgba(0,240,255,0.1); border-color: #00F0FF; cursor: default;">
                        <b>${this.activePlan.name}</b><br/>📍 ${currentPano.label}
                    </div>
                    <button class="ai-suggestion-chip" id="ai-tour-stop-btn" style="color: #FF4545;">Stop Tour</button>
                `;
                const stopBtn = document.getElementById("ai-tour-stop-btn");
                if (stopBtn) stopBtn.addEventListener("click", () => this.stop("user"));

                // ── 2. Navigate to panorama ────────────────────────────
                console.log(
                    "[TourManager] ► Stop",
                    this.currentStopIndex + 1,
                    "/",
                    totalStops,
                    ":",
                    currentPano.label,
                );
                try {
                    window.tour.setMediaByIndex(currentPano.playlistIndex);
                } catch (navErr) {
                    console.warn(
                        "[TourManager] Navigation failed for stop",
                        this.currentStopIndex,
                        "— skipping:",
                        navErr.message,
                    );
                    await new Promise((r) => setTimeout(r, 500));
                    if (!this.activePlan) return;
                    this.nextStop();
                    return;
                }

                // Wait for panorama to load
                await new Promise((r) => setTimeout(r, 1000));
                if (!this.activePlan || this._isPaused) return;

                // ── 3. Narration text ──────────────────────────────────
                const narration =
                    this._narrations[currentPano.label.trim()] ||
                    `Welcome to ${currentPano.label}. Take a moment to look around this beautiful area.`;

                ChatManager.addMessage("assistant", narration);

                // ── 4. Narration + 360° rotation simultaneously ────────
                if (CONFIG.VOICE_ENABLED) {
                    VoiceManager.speak(narration, narration);
                } else if (CONFIG.SUBTITLES_ENABLED) {
                    SubtitleManager.showSubtitle(narration);
                }

                console.log(
                    "[TourManager] ↻ Rotation + narration in parallel at",
                    currentPano.label,
                );

                await Promise.all([
                    this._waitForSpeechEnd(),
                    TDVBridge.lookAround().catch((e) => {
                        console.warn(
                            "[TourManager] Rotation failed — continuing anyway:",
                            e.message,
                        );
                    }),
                ]);

                if (!this.activePlan || this._isPaused) return;

                // ── 5. Brief pause then advance ────────────────────────
                await new Promise((r) => setTimeout(r, 1200));
                if (!this.activePlan || this._isPaused) return;

                this.nextStop();
            } catch (err) {
                // ── Global fallback: any unexpected error skips this stop
                console.error(
                    "[TourManager] Unexpected error at stop",
                    this.currentStopIndex,
                    ":",
                    err.message,
                );
                if (this.activePlan && !this._isPaused) {
                    await new Promise((r) => setTimeout(r, 1000));
                    if (this.activePlan && !this._isPaused) this.nextStop();
                }
            }
        },
    };

    // --- Module I: Init ---
    // This script is loaded dynamically AFTER DOMContentLoaded,
    // so we run immediately instead of waiting for that event.
    function initAIGuide() {
        console.log("[AIGuide] Initializing AI Guide component...");
        TDVBridge.init(function () {
            console.log(
                "[AIGuide] Tour engine ready. Panoramas extracted:",
                TDVBridge._panoramas.length,
            );

            // Build UI
            UI.createFloatingButton();
            UI.createChatPanel();

            // Init voice
            VoiceManager.init();

            // Monitor UI state changes for suggestion chips
            ChatManager._monitorUIState();

            // Keep AI dashboard closed by default
            setTimeout(function () {
                // UI.panel.classList.add("active");
                // if (UI.floatingBtn) UI.floatingBtn.style.display = "none";
            }, 1500);
        });
    }

    // Run immediately — DOM is already loaded by the time this script executes
    initAIGuide();
})();
