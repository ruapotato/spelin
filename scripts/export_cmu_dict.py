#!/usr/bin/env python3
"""
Export CMU Pronouncing Dictionary to compact JSON for client-side use.
"""

import json
import os
import sys

# Add venv to path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_SITE_PACKAGES = os.path.join(SCRIPT_DIR, '..', '.venv', 'lib', 'python3.13', 'site-packages')
if os.path.exists(VENV_SITE_PACKAGES):
    sys.path.insert(0, VENV_SITE_PACKAGES)

import pronouncing

OUTPUT_FILE = os.path.join(SCRIPT_DIR, '..', 'web', 'data', 'cmu-dict.json')

def main():
    print("Exporting CMU dictionary...")

    # Get all words
    words = {}
    for word in pronouncing.search('.*'):
        phones = pronouncing.phones_for_word(word)
        if phones:
            # Just take first pronunciation, store as compact string
            words[word.lower()] = phones[0]

    print(f"Total words: {len(words)}")

    # Write compact JSON (no pretty printing to save space)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(words, f, separators=(',', ':'))

    # Check file size
    size_bytes = os.path.getsize(OUTPUT_FILE)
    size_mb = size_bytes / (1024 * 1024)
    print(f"Output file: {OUTPUT_FILE}")
    print(f"Size: {size_mb:.2f} MB")

if __name__ == '__main__':
    main()
