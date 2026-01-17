#!/usr/bin/env python3
"""
English to ·spelin converter using CMU Pronouncing Dictionary.

Pipeline: English word → phonemes (CMU) → ·spelin symbols
"""

import pronouncing
import re
import sys

# ARPAbet to ·spelin mapping
CONSONANTS = {
    'B': 'b',
    'CH': 'c',
    'D': 'd',
    'DH': '8',   # voiced th (they)
    'F': 'f',
    'G': 'g',
    'HH': 'h',
    'JH': 'j',
    'K': 'k',
    'L': 'l',
    'M': 'm',
    'N': 'n',
    'NG': 'q',
    'P': 'p',
    'R': 'r',
    'S': 's',
    'SH': 'x',
    'T': 't',
    'TH': '3',   # voiceless th (think)
    'V': 'v',
    'W': 'w',
    'Y': 'y',
    'Z': 'z',
    'ZH': 'X',
}

# Vowels mapping
# Stress: 0 = no stress, 1 = primary, 2 = secondary
VOWELS = {
    'AA': '6',   # father, hot
    'AE': 'a',   # cat
    'AH': 'u',   # but (stressed) / 4 schwa (unstressed)
    'AO': '9',   # law, caught
    'AW': '1',   # out, cow
    'AY': 'I',   # my, ride
    'EH': 'e',   # bed
    'ER': '7',   # bird, her
    'EY': 'A',   # day, say
    'IH': 'i',   # bit
    'IY': 'E',   # see, bee
    'OW': 'O',   # go, know
    'OY': '2',   # oil, boy
    'UH': '0',   # book, put
    'UW': 'W',   # boot, food
}

# Only truly special contractions/spellings that CMU gets wrong
SPECIAL_WORDS = {
    'the': '8u',      # special short form
    'of': '4v',       # special short form
    'a': '4',         # schwa
    'to': 't4',       # reduced form
    'spelin': 'spelin',  # the alphabet name
    'speling': 'spelin', # alternate
    # Words not in CMU
    'influencer': 'influ4ns7',
    'influencers': 'influ4ns7z',
    'emojis': 'EmOjEz',
    'emoji': 'EmOjE',
    'verily': 'verilE',
    'usest': 'yWzest',
    'sharers': 'xer7z',
    'poisoners': 'p2z4n7z',
    'experiencer': 'ikspirE4ns7',
    'dreamless': 'drEmles',
    'afterword': 'aft7w7d',
    'epistles': 'Epis4lz',
    # Contraction fragments
    'isn': 'iz4n',
    'wasn': 'w6z4n',
    'll': 'l',
    # Made-up names/words in our texts
    'consumus': '·k4nsWm4s',
    'getmine': '·getmIn',
    'priya': '·prEy4',
    'maaah': 'm6',
    # Letter examples (keep as-is)
    'ough': 'O',
    'gh': '',
    # More missing words
    'whimpered': 'wimp7d',
    'cooperators': 'kOop7At7z',
    'simultaneity': 'sImult4nEitE',
    'doesn': 'd6z4n',
    'didn': 'did4n',
    'wouldn': 'w0d4n',
    'vasopressin': 'vAzOpresin',
    'limbic': 'limbik',
    'manyness': 'menEnes',
    'thinkest': '3iqkest',
    'callest': 'k9lest',
    'seest': 'sEest',
    'perceivest': 'p7sEvest',
    'saith': 'se3',
    'declareth': 'diklere3',
    'endeth': 'ende3',
    'hearken': 'h6rk4n',
    'reginalds': '·rejin4ldz',
    'selfing': 'selfiq',
    'chronopolis': '·kr4n6p4lis',
    'jonathans': '·j6n43anz',
    'rebeccas': '·ribek4z',
    'sundials': 'sundIalz',
    'philosophizing': 'fil6s4fIziq',
    'mournfully': 'm9rnf4lE',
    'podcasts': 'p6dkasts',
    'sagely': 'sAjlE',
    'mindfulness': 'mIndf4lnes',
    'deathbeds': 'de3bedz',
    'twiddles': 'twid4lz',
    'sourness': 's1rnes',
    'reductionist': 'ridukx4nist',
    'tiktok': '·tikt6k',
    'outbred': '1tbred',
    'subcategory': 'subkat4g9rE',
    # Roman numerals
    'ii': 'tW',
    'iii': '3rE',
    'iv': 'f9r',
}

# Proper nouns get a namer dot (·)
PROPER_NOUNS = {
    'god', 'lord', 'jesus', 'christ', 'adam', 'eve', 'noah',
    'moses', 'abraham', 'isaac', 'jacob', 'joseph', 'david',
    'solomon', 'daniel', 'isaiah', 'peter', 'paul', 'john',
    'mary', 'satan', 'lucifer', 'eden', 'israel', 'egypt',
    'babylon', 'jerusalem', 'heaven', 'hell',
}


def phonemes_to_spelin(phonemes: str) -> str:
    """Convert ARPAbet phoneme string to ·spelin."""
    result = []
    phones = phonemes.split()

    for phone in phones:
        # Strip stress markers (0, 1, 2) from vowels
        base_phone = phone.rstrip('012')
        stress = phone[-1] if phone[-1] in '012' else None

        if base_phone in CONSONANTS:
            result.append(CONSONANTS[base_phone])
        elif base_phone in VOWELS:
            # AH with no stress (0) is schwa → 4
            if base_phone == 'AH' and stress == '0':
                result.append('4')
            else:
                result.append(VOWELS[base_phone])
        else:
            # Unknown phoneme - shouldn't happen
            result.append(f'[{phone}]')

    return ''.join(result)


def select_california_pronunciation(pronunciations: list) -> str:
    """Select the pronunciation that best matches California English."""
    if len(pronunciations) == 1:
        return pronunciations[0]

    # California English preferences:
    # 1. Prefer EY over IY at end of words (day vs dee)
    # 2. Prefer AA over AO (cot-caught merger)
    # 3. Prefer UW over UH for "oo" words

    scored = []
    for p in pronunciations:
        score = 0
        phones = p.split()

        # Prefer EY endings over IY (Tuesday = tuez-DAY not tuez-dee)
        if phones and phones[-1].startswith('EY'):
            score += 10
        if phones and phones[-1].startswith('IY'):
            score -= 5

        # Prefer AA (cot-caught merger typical in California)
        score += p.count('AA') * 2

        # Slight preference for simpler pronunciations
        score -= len(phones) * 0.1

        scored.append((score, p))

    scored.sort(reverse=True)
    return scored[0][1]


def word_to_spelin(word: str) -> str:
    """Convert a single English word to ·spelin via phonemes."""
    word_lower = word.lower()

    # Check special words first
    if word_lower in SPECIAL_WORDS:
        result = SPECIAL_WORDS[word_lower]
    else:
        # Get phonemes from CMU dictionary
        pronunciations = pronouncing.phones_for_word(word_lower)
        if pronunciations:
            # Select California-style pronunciation
            phonemes = select_california_pronunciation(pronunciations)
            result = phonemes_to_spelin(phonemes)
        else:
            # Word not in dictionary - return marked
            return f'[{word}]'

    # Add namer dot for proper nouns
    if word_lower in PROPER_NOUNS:
        result = '·' + result

    return result


def convert_text(text: str) -> str:
    """Convert English text to ·spelin."""
    result = []
    # Split into words and non-words (punctuation, whitespace)
    tokens = re.findall(r"[a-zA-Z']+|[^a-zA-Z']+", text)

    for token in tokens:
        if re.match(r"[a-zA-Z']+", token):
            # Handle contractions
            if "'" in token:
                parts = token.split("'")
                converted = ["'".join(word_to_spelin(p) if p else '' for p in parts)]
                result.extend(converted)
            else:
                result.append(word_to_spelin(token))
        else:
            # Punctuation/whitespace - keep as-is
            result.append(token)

    return ''.join(result)


def convert_file(input_path: str, output_path: str = None):
    """Convert an English text file to ·spelin."""
    with open(input_path, 'r') as f:
        text = f.read()

    converted = convert_text(text)

    if output_path:
        with open(output_path, 'w') as f:
            f.write(converted)
        print(f"Converted {input_path} -> {output_path}")
    else:
        print(converted)


def show_conversion(word: str):
    """Show the conversion pipeline for a word."""
    word_lower = word.lower()
    pronunciations = pronouncing.phones_for_word(word_lower)
    if pronunciations:
        phonemes = pronunciations[0]
        spelin = phonemes_to_spelin(phonemes)
        print(f"  {word:15} → {phonemes:25} → {spelin}")
    else:
        print(f"  {word:15} → [not in CMU dictionary]")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        # Demo mode - show the pipeline
        print("English → Phonemes → ·spelin\n")

        test_words = [
            'goat', 'lemon', 'tree', 'sour', 'bitter',
            'tongue', 'lick', 'spit', 'shock', 'forget',
            'brain', 'hand', 'foot', 'climb', 'walk',
            'human', 'people', 'creature', 'world',
            'the', 'and', 'with', 'through', 'thought',
            'think', 'they', 'this', 'that', 'there',
        ]

        for word in test_words:
            show_conversion(word)

        print("\n\nSample sentence:")
        sample = "In the beginning, there was a goat."
        print(f"  English: {sample}")
        print(f"  ·spelin: {convert_text(sample)}")

    elif len(sys.argv) == 2:
        convert_file(sys.argv[1])
    else:
        convert_file(sys.argv[1], sys.argv[2])
