// ·spelin Web Reader
// Converts spelin text to speech with word highlighting

// =============================================================================
// SPELIN TO PRONUNCIATION MAPPING
// =============================================================================

const SPELIN_TO_SPEECH = {
    // Consonants (mostly same)
    'p': 'p', 'b': 'b', 't': 't', 'd': 'd', 'k': 'k', 'g': 'g',
    'f': 'f', 'v': 'v', 's': 's', 'z': 'z', 'h': 'h',
    'm': 'm', 'n': 'n', 'l': 'l', 'r': 'r', 'w': 'w',
    'y': 'y',
    'c': 'ch',   // chip
    'j': 'j',    // judge
    'x': 'sh',   // ship
    'X': 'zh',   // measure
    'q': 'ng',   // sing
    '3': 'th',   // think (voiceless)
    '8': 'th',   // they (voiced) - browser TTS handles context

    // Vowels - uppercase = long
    'A': 'ay',   // day
    'a': 'a',    // cat
    'E': 'ee',   // see
    'e': 'eh',   // bed
    'I': 'eye',  // my
    'i': 'ih',   // bit
    'O': 'oh',   // go
    'o': 'ah',   // hot
    'U': 'you',  // use
    'u': 'uh',   // but

    // Extended vowels
    'W': 'oo',   // boot
    '0': 'oo',   // book (shorter)
    '4': 'uh',   // schwa - about
    '7': 'er',   // bird
    '9': 'aw',   // law
    '6': 'ah',   // father
    '1': 'ow',   // out
    '2': 'oy',   // oil
};

// Special word pronunciations for better TTS
const SPECIAL_WORDS = {
    '8u': 'the',
    '4v': 'of',
    't4': 'to',
    '4nd': 'and',
    'w6z': 'was',
    'iz': 'is',
    'h6z': 'has',
    'w7': 'were',
    '6r': 'are',
};

// =============================================================================
// SAMPLE TEXTS
// =============================================================================

const SAMPLES = {
    quick: `8u kwik br1n f6ks jumps Ov7 8u lAzE d6g.`,

    genesis: `in 8u biginiq, 8er w6z kA6s. 4nd kA6s w6z wi31t f9rm, 4nd v2d, 4nd fraqklE n6t pAiq 4tenx4n.

4nd it kAm t4 pas 84t s7t4n p6rtik4lz did bump intW u87 p6rtik4lz, n6t f7 enE grand p7p4s, but bik6z p6rtik4lz 6r nOt9rE4slE bad at w6ciq wer 8A 6r gOiq.

4nd lO, frum 8is k6zmik fend7-bend7 did at4mz Em7j. 4nd 8u at4mz l0kt 4p6n 8emselvz 4nd sed nu3iq, f7 8A w7 at4mz 4nd had n6t yet inventid m1Tz.`,

    philosophy: `8is iz n6t 4 rElij4n. 8er iz nO g6d hEr hW dimandz w7xip.

8is iz n6t 4 sI4ns. 8er iz nO dAt4 hEr 84t prWvz wut k4n6t bE prWv4n.

8is iz 4 f4l6s4fE—4 wA 4v sEiq, 9f7d frElE, t4 bE tAk4n 7 left.

I am n6t 4 pr6f4t. I am 4 pat7n, lIk yW, trIiq t4 mAk sens 4v bEiq 4 pat7n.`,

    wisdom: `4nd 8er w6z 4 man hW sed, "I xal bigin liviq tWm6rO."

4nd tWm6rO kAm, 4nd hE sed it 4gAn. 4nd 4gAn.

4nd lO, hE iz stil sAiq it, 4nd hiz bOnz 6r in 8u 73, 4nd hiz tWm6rO nev7 4rIvd.

8u m9r4l: yW 6r 8u spex4l 4kAX4n. Et y9r sirE4l frum 8u fansE bOl.`
};

// =============================================================================
// SPELIN CONVERSION
// =============================================================================

function spelinToSpeakable(text) {
    // Convert spelin text to something the browser TTS can pronounce
    if (!text) return '';

    // Check special words first (whole word match)
    let lower = text.toLowerCase().replace(/[.,!?;:'"·]/g, '');
    let punct = text.match(/[.,!?;:'"]+$/)?.[0] || '';

    if (SPECIAL_WORDS[lower]) {
        return SPECIAL_WORDS[lower] + punct;
    }

    // Convert character by character
    let converted = '';
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (SPELIN_TO_SPEECH[char]) {
            converted += SPELIN_TO_SPEECH[char];
        } else if (/[.,!?;:'"]/.test(char)) {
            converted += char;
        } else if (char === '·') {
            // Namer dot - skip
            continue;
        } else if (/\s/.test(char)) {
            converted += char;
        } else {
            // Unknown char - keep as is
            converted += char;
        }
    }

    return converted.trim();
}

function getPhonemeDisplay(word) {
    // Get a phoneme representation for display
    let result = [];
    let clean = word.replace(/[.,!?;:'"·]/g, '');

    for (let char of clean) {
        if (SPELIN_TO_SPEECH[char]) {
            result.push(`/${SPELIN_TO_SPEECH[char]}/`);
        }
    }

    return result.join(' ');
}

// =============================================================================
// ENGLISH TO SPELIN CONVERTER (simplified)
// =============================================================================

// Basic phoneme mappings for common patterns
const ENGLISH_PATTERNS = [
    // Digraphs and special patterns first
    [/th/gi, (m) => m[0] === m[0].toUpperCase() ? '3' : '8'],
    [/sh/gi, 'x'],
    [/ch/gi, 'c'],
    [/ng/gi, 'q'],
    [/tion/gi, 'x4n'],
    [/sion/gi, 'X4n'],
    [/ough/gi, 'O'],
    [/igh/gi, 'I'],
    [/eigh/gi, 'A'],
    [/ould/gi, '0d'],
    [/ould/gi, '0d'],
    [/oo/gi, 'W'],
    [/ee/gi, 'E'],
    [/ea/gi, 'E'],
    [/ai/gi, 'A'],
    [/ay/gi, 'A'],
    [/oy/gi, '2'],
    [/oi/gi, '2'],
    [/ou/gi, '1'],
    [/ow/gi, '1'],
    [/aw/gi, '9'],
    [/au/gi, '9'],
    [/er/gi, '7'],
    [/ir/gi, '7'],
    [/ur/gi, '7'],
    [/or/gi, '9r'],
    [/ar/gi, '6r'],
    [/ph/gi, 'f'],
    [/wh/gi, 'w'],
    [/wr/gi, 'r'],
    [/kn/gi, 'n'],
    [/gn/gi, 'n'],
    [/mb$/gi, 'm'],
    [/ck/gi, 'k'],

    // Silent e patterns
    [/([bcdfghjklmnpqrstvwxyz])e$/gi, '$1'],

    // Single letters
    [/c(?=[eiy])/gi, 's'],
    [/c/gi, 'k'],
    [/q/gi, 'k'],
    [/x/gi, 'ks'],
    [/j/gi, 'j'],
    [/y(?=[aeiou])/gi, 'y'],
    [/y$/gi, 'E'],
    [/y/gi, 'i'],
];

function englishToSpelin(text) {
    // Very basic English to spelin - not as accurate as the Python version
    // but good enough for demo purposes
    let words = text.split(/(\s+)/);
    let result = [];

    for (let word of words) {
        if (/^\s+$/.test(word)) {
            result.push(word);
            continue;
        }

        let converted = word.toLowerCase();

        // Apply patterns
        for (let [pattern, replacement] of ENGLISH_PATTERNS) {
            converted = converted.replace(pattern, replacement);
        }

        // Handle remaining vowels
        converted = converted
            .replace(/a/g, 'a')
            .replace(/e/g, 'e')
            .replace(/i/g, 'i')
            .replace(/o/g, '6')
            .replace(/u/g, 'u');

        result.push(converted);
    }

    return result.join('');
}

// =============================================================================
// PHONEME AUDIO PLAYER
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

class SpelinReader {
    constructor() {
        this.words = [];
        this.currentWordIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.speed = 1.0;
        this.audioLoaded = false;
        this.pendingTimeout = null;

        this.onWordChange = null;
        this.onEnd = null;
        this.onLoadProgress = null;

        // Web Audio API
        this.audioCtx = null;
        this.phonemeBuffers = {};
        this.activeSources = [];

        this.initAudio();
    }

    async initAudio() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Web Audio API initialized');
            await this.loadPhonemes();
        } catch (e) {
            console.warn('Web Audio API not available:', e);
        }
    }

    async loadPhonemes() {
        const phonemes = Object.keys(PHONEME_FILES);
        let loaded = 0;

        console.log(`Loading ${phonemes.length} phoneme audio files...`);

        const loadPromises = phonemes.map(async (char) => {
            const filename = PHONEME_FILES[char];
            const url = `audio/${filename}.mp3`;

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

    // Play a single phoneme audio buffer with envelope
    playPhoneme(char, startTime, duration, gainValue = 0.7) {
        const buffer = this.phonemeBuffers[char];
        if (!buffer || !this.audioCtx) return 0;

        const source = this.audioCtx.createBufferSource();
        const gainNode = this.audioCtx.createGain();

        source.buffer = buffer;
        // Normal playback rate - audio already generated at good speed
        source.playbackRate.value = 1.0 * this.speed;

        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        // Envelope: quick attack, sustain, fade out for smooth blending
        const attackTime = 0.01;
        const releaseTime = 0.08;
        gainNode.gain.setValueAtTime(0.001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(gainValue, startTime + attackTime);
        gainNode.gain.setValueAtTime(gainValue, startTime + duration - releaseTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        source.start(startTime);
        source.stop(startTime + duration + 0.05); // Stop shortly after fade
        this.activeSources.push(source);

        return duration;
    }

    // Check if character is a vowel
    isVowel(char) {
        return /[AEIOUaeiouW01246789]/.test(char);
    }

    // Play all phonemes in a word with heavy overlap for natural blending
    playWord(word) {
        if (!this.audioLoaded || !this.audioCtx) return 0;

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
            // Stop all active audio sources
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
}

// =============================================================================
// UI
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const reader = new SpelinReader();

    // Elements
    const textDisplay = document.getElementById('textDisplay');
    const phonemeDisplay = document.getElementById('phonemeDisplay');
    const spelinInput = document.getElementById('spelinInput');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Loading progress callback
    reader.onLoadProgress = (loaded, total) => {
        const loadingText = loadingIndicator.querySelector('.loading-text');
        loadingText.textContent = `Loading phoneme audio... ${loaded}/${total}`;

        if (loaded === total) {
            loadingIndicator.classList.add('ready');
            loadingText.textContent = `Audio ready (${total} phonemes loaded)`;
            setTimeout(() => {
                loadingIndicator.classList.add('hidden');
            }, 2000);
        }
    };

    // Converter elements
    const englishInput = document.getElementById('englishInput');
    const spelinOutput = document.getElementById('spelinOutput');
    const convertBtn = document.getElementById('convertBtn');
    const copyBtn = document.getElementById('copyBtn');
    const readConvertedBtn = document.getElementById('readConvertedBtn');

    // Tab handling
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Sample buttons
    document.querySelectorAll('.sample-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sample = SAMPLES[btn.dataset.sample];
            spelinInput.value = sample;
            updateDisplay(sample);
        });
    });

    // Update display when input changes
    spelinInput.addEventListener('input', () => {
        updateDisplay(spelinInput.value);
    });

    function updateDisplay(text) {
        if (!text.trim()) {
            textDisplay.innerHTML = '<p class="placeholder">Enter spelin text below or choose a sample...</p>';
            return;
        }

        // Parse into words and create spans
        const words = text.split(/(\s+)/);
        let html = '';
        let wordIndex = 0;

        for (let part of words) {
            if (/^\s+$/.test(part)) {
                html += part.replace(/\n/g, '<br>');
            } else {
                html += `<span class="word" data-index="${wordIndex}">${escapeHtml(part)}</span>`;
                wordIndex++;
            }
        }

        textDisplay.innerHTML = html;
        reader.setText(text);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Reader callbacks
    reader.onWordChange = (index, word) => {
        // Remove previous highlights
        document.querySelectorAll('.word.current').forEach(el => {
            el.classList.remove('current');
            el.classList.add('spoken');
        });

        // Highlight current word
        const currentEl = document.querySelector(`.word[data-index="${index}"]`);
        if (currentEl) {
            currentEl.classList.add('current');
            currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Update phoneme display
        phonemeDisplay.textContent = getPhonemeDisplay(word);
    };

    reader.onEnd = () => {
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        playBtn.innerHTML = '<span class="play-icon">▶</span> Play';
        phonemeDisplay.textContent = '';
    };

    // Control buttons
    playBtn.addEventListener('click', () => {
        if (!spelinInput.value.trim()) return;

        updateDisplay(spelinInput.value);
        reader.play();

        playBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
    });

    pauseBtn.addEventListener('click', () => {
        if (reader.isPaused) {
            reader.play();
            pauseBtn.innerHTML = '<span>⏸</span> Pause';
        } else {
            reader.pause();
            pauseBtn.innerHTML = '<span>▶</span> Resume';
        }
    });

    stopBtn.addEventListener('click', () => {
        reader.stop();

        // Reset highlighting
        document.querySelectorAll('.word').forEach(el => {
            el.classList.remove('current', 'spoken');
        });

        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        phonemeDisplay.textContent = '';
    });

    // Speed control
    speedSlider.addEventListener('input', () => {
        const speed = parseFloat(speedSlider.value);
        reader.setSpeed(speed);
        speedValue.textContent = speed.toFixed(1) + 'x';
    });

    // Converter
    convertBtn.addEventListener('click', () => {
        const english = englishInput.value;
        const spelin = englishToSpelin(english);
        spelinOutput.value = spelin;
    });

    copyBtn.addEventListener('click', () => {
        spelinOutput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy ·spelin';
        }, 2000);
    });

    readConvertedBtn.addEventListener('click', () => {
        if (spelinOutput.value) {
            // Switch to reader tab
            document.querySelector('[data-tab="reader"]').click();
            spelinInput.value = spelinOutput.value;
            updateDisplay(spelinOutput.value);
        }
    });

    // Load initial sample
    spelinInput.value = SAMPLES.quick;
    updateDisplay(SAMPLES.quick);
});
