/* ============================================================================
   SPELIN CONVERTER MODULE
   Handles English to Spelin conversion and vice versa
   ============================================================================ */

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
    '8': 'th',   // they (voiced)

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
// SPELIN TO SPEAKABLE CONVERSION
// =============================================================================

/**
 * Convert spelin text to something the browser TTS can pronounce
 */
function spelinToSpeakable(text) {
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

/**
 * Get a phoneme representation for display
 */
function getPhonemeDisplay(word) {
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
// ENGLISH TO SPELIN CONVERTER (CMU Dictionary based)
// =============================================================================

// ARPAbet to spelin mapping
const ARPABET_TO_SPELIN = {
    // Consonants
    'B': 'b', 'CH': 'c', 'D': 'd', 'DH': '8', 'F': 'f', 'G': 'g',
    'HH': 'h', 'JH': 'j', 'K': 'k', 'L': 'l', 'M': 'm', 'N': 'n',
    'NG': 'q', 'P': 'p', 'R': 'r', 'S': 's', 'SH': 'x', 'T': 't',
    'TH': '3', 'V': 'v', 'W': 'w', 'Y': 'y', 'Z': 'z', 'ZH': 'X',
    // Vowels (stress markers 0,1,2 are stripped)
    'AA': '6', 'AE': 'a', 'AH': 'u', 'AO': '9', 'AW': '1', 'AY': 'I',
    'EH': 'e', 'ER': '7', 'EY': 'A', 'IH': 'i', 'IY': 'E', 'OW': 'O',
    'OY': '2', 'UH': '0', 'UW': 'W'
};

// CMU dictionary storage
let cmuDict = null;
let cmuDictLoading = false;
let cmuDictLoadPromise = null;

/**
 * Load CMU dictionary JSON file
 */
async function loadCmuDict() {
    if (cmuDict) return cmuDict;
    if (cmuDictLoading) return cmuDictLoadPromise;

    cmuDictLoading = true;
    cmuDictLoadPromise = fetch('data/cmu-dict.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load CMU dictionary');
            return response.json();
        })
        .then(data => {
            cmuDict = data;
            cmuDictLoading = false;
            console.log(`CMU dictionary loaded: ${Object.keys(data).length} words`);
            return cmuDict;
        })
        .catch(err => {
            cmuDictLoading = false;
            console.error('Error loading CMU dictionary:', err);
            throw err;
        });

    return cmuDictLoadPromise;
}

/**
 * Convert ARPAbet phoneme string to spelin
 */
function arpabetToSpelin(arpabet) {
    const phones = arpabet.split(' ');
    let result = '';

    for (const phone of phones) {
        // Strip stress markers (0, 1, 2) from vowels
        const basePhone = phone.replace(/[012]$/, '');
        const stress = phone.match(/[012]$/)?.[0];

        // Special case: AH with stress 0 is schwa (4)
        if (basePhone === 'AH' && stress === '0') {
            result += '4';
        } else if (ARPABET_TO_SPELIN[basePhone]) {
            result += ARPABET_TO_SPELIN[basePhone];
        } else {
            // Unknown phoneme - skip or log
            console.warn('Unknown ARPAbet phoneme:', phone);
        }
    }

    return result;
}

/**
 * Convert a single word using CMU dictionary
 */
function convertWordWithDict(word, isProperNoun = false) {
    if (!cmuDict) return null;

    // Strip punctuation for lookup
    const cleanWord = word.replace(/[^a-zA-Z']/g, '').toLowerCase();
    if (!cleanWord) return null;

    const arpabet = cmuDict[cleanWord];
    if (!arpabet) return null;

    let spelin = arpabetToSpelin(arpabet);

    // Add namer dot for proper nouns
    if (isProperNoun && spelin) {
        spelin = '·' + spelin;
    }

    return spelin;
}

/**
 * Convert English text to spelin using CMU dictionary
 * Returns a promise that resolves to the converted text
 */
async function englishToSpelin(text) {
    // Ensure dictionary is loaded
    await loadCmuDict();

    // Split into tokens (words and whitespace/punctuation)
    const tokens = text.match(/([a-zA-Z']+|[^a-zA-Z']+)/g) || [];
    let result = '';

    for (const token of tokens) {
        // Check if it's a word
        if (/^[a-zA-Z']+$/.test(token)) {
            // Check if proper noun (starts with capital)
            const isProperNoun = /^[A-Z]/.test(token);

            // Try dictionary lookup
            const converted = convertWordWithDict(token, isProperNoun);

            if (converted) {
                result += converted;
            } else {
                // Word not in dictionary - keep original with marker
                result += `[${token}]`;
            }
        } else {
            // Whitespace or punctuation - keep as is
            result += token;
        }
    }

    return result;
}

/**
 * Synchronous version for when dictionary is already loaded
 */
function englishToSpelinSync(text) {
    if (!cmuDict) {
        return '[Dictionary not loaded]';
    }

    const tokens = text.match(/([a-zA-Z']+|[^a-zA-Z']+)/g) || [];
    let result = '';

    for (const token of tokens) {
        if (/^[a-zA-Z']+$/.test(token)) {
            const isProperNoun = /^[A-Z]/.test(token);
            const converted = convertWordWithDict(token, isProperNoun);

            if (converted) {
                result += converted;
            } else {
                result += `[${token}]`;
            }
        } else {
            result += token;
        }
    }

    return result;
}

/**
 * Check if CMU dictionary is loaded
 */
function isCmuDictLoaded() {
    return cmuDict !== null;
}

/**
 * Parse spelin text into words with positions
 */
function parseWords(text) {
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

/**
 * Check if a character is a valid spelin phoneme
 */
function isPhoneme(char) {
    return SPELIN_TO_SPEECH.hasOwnProperty(char);
}

/**
 * Get all valid spelin characters
 */
function getAllSpelinChars() {
    return Object.keys(SPELIN_TO_SPEECH);
}

// =============================================================================
// EXPORTS
// =============================================================================

window.spelinConverter = {
    spelinToSpeakable,
    getPhonemeDisplay,
    englishToSpelin,
    englishToSpelinSync,
    loadCmuDict,
    isCmuDictLoaded,
    arpabetToSpelin,
    parseWords,
    isPhoneme,
    getAllSpelinChars,
    SAMPLES,
    SPELIN_TO_SPEECH,
    SPECIAL_WORDS,
    ARPABET_TO_SPELIN
};

// Also export individual functions for convenience
window.spelinToSpeakable = spelinToSpeakable;
window.getPhonemeDisplay = getPhonemeDisplay;
window.englishToSpelin = englishToSpelin;
window.englishToSpelinSync = englishToSpelinSync;
window.loadCmuDict = loadCmuDict;
window.isCmuDictLoaded = isCmuDictLoaded;
window.SAMPLES = SAMPLES;
