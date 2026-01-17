/* ============================================================================
   SPELIN AUDIO MODULE
   Handles phoneme audio playback, word reading, and hover-to-speak
   ============================================================================ */

// =============================================================================
// PHONEME DEFINITIONS
// =============================================================================

// Map spelin characters to audio file names
const PHONEME_FILES = {
    // Consonants
    'p': 'p', 'b': 'b', 't': 't', 'd': 'd', 'k': 'k', 'g': 'g',
    'f': 'f', 'v': 'v', 's': 's', 'z': 'z', 'h': 'h',
    'm': 'm', 'n': 'n', 'l': 'l', 'r': 'r', 'w': 'w', 'y': 'y',
    'c': 'c', 'j': 'j', 'x': 'x', 'X': 'X_upper', 'q': 'q',
    '3': 'three', '8': 'eight',
    // Short vowels
    'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
    // Long vowels
    'A': 'A', 'E': 'E', 'I': 'I', 'O': 'O', 'U': 'U',
    // Extended vowels
    'W': 'W', '0': 'zero', '4': 'four', '7': 'seven',
    '9': 'nine', '6': 'six', '1': 'one', '2': 'two'
};

// Phoneme metadata for tooltips and learning
const PHONEME_DATA = {
    // Consonants
    'p': { sound: 'p', example: 'pea', ipa: '/p/' },
    'b': { sound: 'b', example: 'bee', ipa: '/b/' },
    't': { sound: 't', example: 'tea', ipa: '/t/' },
    'd': { sound: 'd', example: 'do', ipa: '/d/' },
    'k': { sound: 'k', example: 'key', ipa: '/k/' },
    'g': { sound: 'g', example: 'go', ipa: '/ɡ/' },
    'f': { sound: 'f', example: 'fee', ipa: '/f/' },
    'v': { sound: 'v', example: 'vow', ipa: '/v/' },
    's': { sound: 's', example: 'see', ipa: '/s/' },
    'z': { sound: 'z', example: 'zoo', ipa: '/z/' },
    'h': { sound: 'h', example: 'he', ipa: '/h/' },
    'm': { sound: 'm', example: 'me', ipa: '/m/' },
    'n': { sound: 'n', example: 'no', ipa: '/n/' },
    'l': { sound: 'l', example: 'low', ipa: '/l/' },
    'r': { sound: 'r', example: 'row', ipa: '/ɹ/' },
    'w': { sound: 'w', example: 'we', ipa: '/w/' },
    'y': { sound: 'y', example: 'yes', ipa: '/j/' },
    'c': { sound: 'ch', example: 'chip', ipa: '/tʃ/' },
    'j': { sound: 'j', example: 'judge', ipa: '/dʒ/' },
    'x': { sound: 'sh', example: 'ship', ipa: '/ʃ/' },
    'X': { sound: 'zh', example: 'measure', ipa: '/ʒ/' },
    'q': { sound: 'ng', example: 'sing', ipa: '/ŋ/' },
    '3': { sound: 'th', example: 'think', ipa: '/θ/' },
    '8': { sound: 'th', example: 'they', ipa: '/ð/' },
    // Short vowels
    'a': { sound: 'a', example: 'cat', ipa: '/æ/' },
    'e': { sound: 'e', example: 'bed', ipa: '/ɛ/' },
    'i': { sound: 'i', example: 'bit', ipa: '/ɪ/' },
    'o': { sound: 'o', example: 'hot', ipa: '/ɒ/' },
    'u': { sound: 'u', example: 'but', ipa: '/ʌ/' },
    // Long vowels
    'A': { sound: 'ay', example: 'day', ipa: '/eɪ/' },
    'E': { sound: 'ee', example: 'see', ipa: '/iː/' },
    'I': { sound: 'eye', example: 'my', ipa: '/aɪ/' },
    'O': { sound: 'oh', example: 'go', ipa: '/oʊ/' },
    'U': { sound: 'you', example: 'use', ipa: '/juː/' },
    // Extended vowels
    'W': { sound: 'oo', example: 'boot', ipa: '/uː/' },
    '0': { sound: 'oo', example: 'book', ipa: '/ʊ/' },
    '4': { sound: 'uh', example: 'about', ipa: '/ə/' },
    '7': { sound: 'er', example: 'bird', ipa: '/ɜːr/' },
    '9': { sound: 'aw', example: 'law', ipa: '/ɔː/' },
    '6': { sound: 'ah', example: 'father', ipa: '/ɑː/' },
    '1': { sound: 'ow', example: 'out', ipa: '/aʊ/' },
    '2': { sound: 'oy', example: 'oil', ipa: '/ɔɪ/' }
};

// Phoneme categories for the learn page
const PHONEME_CATEGORIES = {
    consonants: ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'h', 'm', 'n', 'l', 'r', 'w', 'y'],
    specialConsonants: ['c', 'j', 'x', 'X', 'q', '3', '8'],
    shortVowels: ['a', 'e', 'i', 'o', 'u'],
    longVowels: ['A', 'E', 'I', 'O', 'U'],
    extendedVowels: ['W', '0', '4', '7', '9', '6', '1', '2']
};

// =============================================================================
// SPELIN READER CLASS
// =============================================================================

class SpelinReader {
    constructor(audioPath = 'audio/') {
        this.audioPath = audioPath;
        this.words = [];
        this.currentWordIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.speed = 1.0;
        this.audioLoaded = false;
        this.pendingTimeout = null;

        // Callbacks
        this.onWordChange = null;
        this.onEnd = null;
        this.onLoadProgress = null;

        // Web Audio API
        this.audioCtx = null;
        this.phonemeBuffers = {};
        this.activeSources = [];

        // Hover-to-speak
        this.hoverDebounce = null;
        this.lastHoveredChar = null;
    }

    async init() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Web Audio API initialized');
            await this.loadPhonemes();
            return true;
        } catch (e) {
            console.warn('Web Audio API not available:', e);
            return false;
        }
    }

    async loadPhonemes() {
        const phonemes = Object.keys(PHONEME_FILES);
        let loaded = 0;

        console.log(`Loading ${phonemes.length} phoneme audio files...`);

        const loadPromises = phonemes.map(async (char) => {
            const filename = PHONEME_FILES[char];
            const url = `${this.audioPath}${filename}.mp3`;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
                this.phonemeBuffers[char] = audioBuffer;

                loaded++;
                if (this.onLoadProgress) {
                    this.onLoadProgress(loaded, phonemes.length);
                }
            } catch (e) {
                console.warn(`Failed to load phoneme ${char}: ${e.message}`);
            }
        });

        await Promise.all(loadPromises);
        this.audioLoaded = Object.keys(this.phonemeBuffers).length > 0;
        console.log(`Loaded ${Object.keys(this.phonemeBuffers).length}/${phonemes.length} phonemes`);
    }

    // Check if sound is enabled in settings
    isSoundEnabled() {
        const settings = window.spelinNav?.getSettings?.();
        return settings?.soundEnabled !== false;
    }

    // Play a single phoneme audio buffer with envelope
    playPhoneme(char, startTime = null, duration = null, gainValue = 0.7) {
        if (!this.isSoundEnabled()) return 0;

        const buffer = this.phonemeBuffers[char];
        if (!buffer || !this.audioCtx) return 0;

        // Resume audio context if suspended
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const currentTime = startTime ?? this.audioCtx.currentTime;
        const actualDuration = duration ?? (buffer.duration * 0.8);

        const source = this.audioCtx.createBufferSource();
        const gainNode = this.audioCtx.createGain();

        source.buffer = buffer;
        source.playbackRate.value = this.speed;

        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        // Envelope: quick attack, sustain, fade out for smooth blending
        const attackTime = 0.01;
        const releaseTime = 0.08;
        gainNode.gain.setValueAtTime(0.001, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(gainValue, currentTime + attackTime);
        gainNode.gain.setValueAtTime(gainValue, currentTime + actualDuration - releaseTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + actualDuration);

        source.start(currentTime);
        source.stop(currentTime + actualDuration + 0.05);
        this.activeSources.push(source);

        return actualDuration;
    }

    // Play a single phoneme immediately (for hover/click)
    playSinglePhoneme(char) {
        if (!this.isSoundEnabled()) return;

        const buffer = this.phonemeBuffers[char];
        if (!buffer || !this.audioCtx) return;

        // Resume audio context if suspended
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const source = this.audioCtx.createBufferSource();
        const gainNode = this.audioCtx.createGain();

        source.buffer = buffer;
        source.playbackRate.value = 1.0;

        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        gainNode.gain.value = 0.7;

        source.start(0);
        this.activeSources.push(source);
    }

    // Check if character is a vowel
    isVowel(char) {
        return /[AEIOUaeiouW01246789]/.test(char);
    }

    // Play all phonemes in a word with heavy overlap for natural blending
    playWord(word) {
        if (!this.audioLoaded || !this.audioCtx || !this.isSoundEnabled()) return 0;

        // Resume audio context if suspended
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // Clean word of punctuation
        const clean = word.replace(/[.,!?;:'"·\-]/g, '');
        if (!clean) return 0.1;

        const chars = clean.split('').filter(c => PHONEME_FILES[c]);
        if (chars.length === 0) return 0.1;

        let currentTime = this.audioCtx.currentTime;

        // Phoneme timing - vowels longer, consonants shorter
        const vowelDuration = 0.25 / this.speed;
        const consonantDuration = 0.18 / this.speed;
        // Moderate overlap - blend but keep clarity
        const overlapRatio = 0.4;

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const isVowelSound = this.isVowel(char);

            // Vowels get more time, consonants are quick
            let duration = isVowelSound ? vowelDuration : consonantDuration;

            // Last phoneme in word gets slightly more time
            if (i === chars.length - 1) {
                duration *= 1.2;
            }

            this.playPhoneme(char, currentTime, duration, 0.5);

            // Move forward with overlap
            currentTime += duration * (1 - overlapRatio);
        }

        // Return total word duration (add a tiny gap at end)
        return (currentTime - this.audioCtx.currentTime) + 0.05;
    }

    setText(spelinText) {
        this.words = this.parseWords(spelinText);
        this.currentWordIndex = 0;
    }

    parseWords(text) {
        let words = [];
        let regex = /(\S+)/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            words.push({
                text: match[1],
                start: match.index,
                end: match.index + match[1].length
            });
        }

        return words;
    }

    play() {
        if (this.isPaused) {
            this.isPaused = false;
            this.isPlaying = true;
            this.runPlayback();
            return;
        }

        if (this.words.length === 0) return;

        // Resume audio context on user interaction
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.isPlaying = true;
        this.currentWordIndex = 0;
        this.runPlayback();
    }

    runPlayback() {
        const tick = () => {
            if (!this.isPlaying || this.isPaused) return;

            if (this.currentWordIndex >= this.words.length) {
                this.isPlaying = false;
                if (this.onEnd) this.onEnd();
                return;
            }

            const word = this.words[this.currentWordIndex];

            // Play word audio and get duration
            const wordDuration = this.playWord(word.text);

            if (this.onWordChange) {
                this.onWordChange(this.currentWordIndex, word.text);
            }

            this.currentWordIndex++;

            // Minimal gap between words - just enough to distinguish
            const gap = 0.03 / this.speed;
            const delay = (wordDuration + gap) * 1000;

            // Schedule next word
            if (this.isPlaying && this.currentWordIndex < this.words.length) {
                this.pendingTimeout = setTimeout(tick, delay);
            } else if (this.currentWordIndex >= this.words.length) {
                this.pendingTimeout = setTimeout(() => {
                    this.isPlaying = false;
                    if (this.onEnd) this.onEnd();
                }, delay);
            }
        };

        tick();
    }

    pause() {
        if (this.isPlaying) {
            this.isPaused = true;
            this.isPlaying = false;
            if (this.pendingTimeout) {
                clearTimeout(this.pendingTimeout);
                this.pendingTimeout = null;
            }
            this.stopAllSources();
        }
    }

    stop() {
        if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }
        this.stopAllSources();
        this.isPlaying = false;
        this.isPaused = false;
        this.currentWordIndex = 0;
    }

    stopAllSources() {
        for (const source of this.activeSources) {
            try {
                source.stop();
            } catch (e) {
                // Already stopped
            }
        }
        this.activeSources = [];
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    // Get phoneme data for tooltips
    getPhonemeData(char) {
        return PHONEME_DATA[char] || null;
    }

    // Check if character is a valid phoneme
    isPhoneme(char) {
        return PHONEME_FILES.hasOwnProperty(char);
    }
}

// =============================================================================
// HOVER-TO-SPEAK FUNCTIONALITY
// =============================================================================

class HoverToSpeak {
    constructor(reader) {
        this.reader = reader;
        this.debounceTime = 150; // ms between sounds
        this.lastPlayTime = 0;
        this.enabled = true;

        // Listen for settings changes
        window.addEventListener('spelinSettingsChanged', (e) => {
            this.enabled = e.detail.hoverSpeak && e.detail.soundEnabled;
        });
    }

    init() {
        // Add global mouseover listener for spelin characters
        document.addEventListener('mouseover', (e) => this.handleHover(e));
    }

    handleHover(e) {
        if (!this.enabled) return;

        const target = e.target;

        // Check if it's a spelin character element
        if (target.classList?.contains('spelin-char')) {
            const char = target.dataset.char;
            if (char && this.reader.isPhoneme(char)) {
                this.playWithDebounce(char, target);
            }
        }

        // Also check for phoneme-item elements (in learn page)
        if (target.classList?.contains('phoneme-item') || target.closest('.phoneme-item')) {
            const item = target.classList.contains('phoneme-item') ? target : target.closest('.phoneme-item');
            const char = item.dataset.phoneme;
            if (char && this.reader.isPhoneme(char)) {
                this.playWithDebounce(char, item);
            }
        }
    }

    playWithDebounce(char, element) {
        const now = Date.now();
        if (now - this.lastPlayTime < this.debounceTime) return;

        this.lastPlayTime = now;
        this.reader.playSinglePhoneme(char);

        // Add visual feedback
        element.classList.add('playing');
        setTimeout(() => {
            element.classList.remove('playing');
        }, 200);
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Wrap spelin text with hoverable character spans
 * @param {string} text - The spelin text to wrap
 * @returns {string} HTML with each phoneme character wrapped in a span
 */
function wrapSpelinText(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (PHONEME_FILES[char]) {
            result += `<span class="spelin-char" data-char="${char}">${escapeHtml(char)}</span>`;
        } else {
            result += escapeHtml(char);
        }
    }
    return result;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get all phonemes in a category
 */
function getPhonemesInCategory(category) {
    return PHONEME_CATEGORIES[category] || [];
}

/**
 * Get all phoneme characters
 */
function getAllPhonemes() {
    return Object.keys(PHONEME_FILES);
}

// =============================================================================
// EXPORTS
// =============================================================================

// Create global instance
let spelinReader = null;
let hoverToSpeak = null;

async function initSpelinAudio(audioPath = 'audio/') {
    spelinReader = new SpelinReader(audioPath);
    await spelinReader.init();

    hoverToSpeak = new HoverToSpeak(spelinReader);
    hoverToSpeak.init();

    return spelinReader;
}

// Export to window for use by other scripts
window.SpelinReader = SpelinReader;
window.HoverToSpeak = HoverToSpeak;
window.initSpelinAudio = initSpelinAudio;
window.wrapSpelinText = wrapSpelinText;
window.PHONEME_DATA = PHONEME_DATA;
window.PHONEME_CATEGORIES = PHONEME_CATEGORIES;
window.PHONEME_FILES = PHONEME_FILES;
window.getAllPhonemes = getAllPhonemes;
window.getPhonemesInCategory = getPhonemesInCategory;

// Auto-init if audio.js is loaded with data-auto-init attribute
if (document.currentScript?.hasAttribute('data-auto-init')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initSpelinAudio());
    } else {
        initSpelinAudio();
    }
}
