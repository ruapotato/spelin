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
// ENGLISH TO SPELIN CONVERTER
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

/**
 * Convert English text to spelin (simplified version)
 * Note: This is a basic converter - not as accurate as using a pronunciation dictionary
 */
function englishToSpelin(text) {
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
    parseWords,
    isPhoneme,
    getAllSpelinChars,
    SAMPLES,
    SPELIN_TO_SPEECH,
    SPECIAL_WORDS
};

// Also export individual functions for convenience
window.spelinToSpeakable = spelinToSpeakable;
window.getPhonemeDisplay = getPhonemeDisplay;
window.englishToSpelin = englishToSpelin;
window.SAMPLES = SAMPLES;
