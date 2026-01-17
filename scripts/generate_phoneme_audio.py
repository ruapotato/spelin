#!/usr/bin/env python3
"""Generate audio files for each spelin phoneme using espeak."""

import subprocess
import os

# Map spelin symbols to espeak phoneme notation
# Using [[...]] to speak raw phonemes
SPELIN_TO_ESPEAK = {
    # Consonants
    'p': 'p',
    'b': 'b',
    't': 't',
    'd': 'd',
    'k': 'k',
    'g': 'g',
    'f': 'f',
    'v': 'v',
    's': 's',
    'z': 'z',
    'h': 'h',
    'm': 'm',
    'n': 'n',
    'l': 'l',
    'r': 'r',
    'w': 'w',
    'y': 'j',  # espeak uses j for /y/ sound
    'c': 'tS',  # ch as in chip
    'j': 'dZ',  # j as in judge
    'x': 'S',   # sh as in ship
    'X': 'Z',   # zh as in measure
    'q': 'N',   # ng as in sing
    '3': 'T',   # th as in think (voiceless)
    '8': 'D',   # th as in they (voiced)

    # Short vowels
    'a': 'a',   # cat
    'e': 'E',   # bed
    'i': 'I',   # bit
    'o': '0',   # hot (espeak uses 0 for this)
    'u': 'V',   # but (espeak uses V for strut vowel)

    # Long vowels (letter names)
    'A': 'eI',  # day
    'E': 'i:',  # see
    'I': 'aI',  # my
    'O': 'oU',  # go
    'U': 'ju:',  # use (y + oo)

    # Extended vowels
    'W': 'u:',  # boot
    '0': 'U',   # book (espeak uses U for foot vowel)
    '4': '@',   # schwa - about
    '7': '3:',  # bird
    '9': 'O:',  # law
    '6': 'A:',  # father
    '1': 'aU',  # out
    '2': 'OI',  # oil
}

def generate_phoneme_wav(spelin_char, espeak_phoneme, output_dir):
    """Generate a WAV file for a single phoneme."""
    # Use a safe filename
    if spelin_char == '0':
        filename = 'zero'
    elif spelin_char == '1':
        filename = 'one'
    elif spelin_char == '2':
        filename = 'two'
    elif spelin_char == '3':
        filename = 'three'
    elif spelin_char == '4':
        filename = 'four'
    elif spelin_char == '6':
        filename = 'six'
    elif spelin_char == '7':
        filename = 'seven'
    elif spelin_char == '8':
        filename = 'eight'
    elif spelin_char == '9':
        filename = 'nine'
    elif spelin_char == 'X':
        filename = 'X_upper'
    else:
        filename = spelin_char

    wav_path = os.path.join(output_dir, f"{filename}.wav")

    # Generate with espeak - use phoneme notation
    # Adding a brief vowel sound after consonants for audibility
    if espeak_phoneme in ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z',
                          'h', 'm', 'n', 'l', 'r', 'w', 'j', 'tS', 'dZ',
                          'S', 'Z', 'N', 'T', 'D']:
        # Consonants - add schwa for audibility
        phoneme_text = f"[[{espeak_phoneme}@]]"
    else:
        # Vowels - just the vowel
        phoneme_text = f"[[{espeak_phoneme}]]"

    cmd = [
        'espeak', '-v', 'en-us',
        '-s', '180',  # moderate speed
        '-p', '35',   # lower pitch (default is 50)
        '-a', '180',  # louder
        '-w', wav_path,
        phoneme_text
    ]

    print(f"Generating {spelin_char} -> {espeak_phoneme}: {wav_path}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"  Error: {result.stderr}")
        return None

    return wav_path

def main():
    output_dir = "/home/david/hamnerin/web/audio"
    os.makedirs(output_dir, exist_ok=True)

    print(f"Generating phoneme audio files in {output_dir}")
    print("=" * 50)

    generated = []
    for spelin_char, espeak_phoneme in SPELIN_TO_ESPEAK.items():
        wav_path = generate_phoneme_wav(spelin_char, espeak_phoneme, output_dir)
        if wav_path:
            generated.append((spelin_char, wav_path))

    print("=" * 50)
    print(f"Generated {len(generated)} phoneme audio files")

    # List the files
    print("\nFiles created:")
    for char, path in generated:
        size = os.path.getsize(path)
        print(f"  {char}: {os.path.basename(path)} ({size} bytes)")

if __name__ == "__main__":
    main()
