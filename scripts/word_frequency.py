#!/usr/bin/env python3
"""
Word Frequency Analyzer for Spelin Books

This script analyzes all .md files in the books directory to:
1. Count word frequency across all books
2. Group similar-looking words that might be variants
3. Identify potential typos (words appearing only once)
4. Find word pairs that differ by one character
5. Detect words with traditional English patterns
"""

import os
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Set, Tuple


def extract_words(text: str) -> List[str]:
    """
    Extract all words from text, including words with numbers.
    Converts to lowercase for consistent counting.
    """
    # Match words that can contain letters, numbers, and apostrophes
    # but must start and end with alphanumeric
    pattern = r"\b[a-zA-Z0-9]+(?:'[a-zA-Z0-9]+)*\b"
    words = re.findall(pattern, text.lower())
    return words


def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculate the Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)

    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def find_similar_words(words: Set[str], max_distance: int = 1) -> List[Tuple[str, str, int]]:
    """
    Find pairs of words that differ by at most max_distance characters.
    Returns list of (word1, word2, distance) tuples.
    """
    similar_pairs = []
    word_list = sorted(words)

    for i, word1 in enumerate(word_list):
        for word2 in word_list[i + 1:]:
            # Quick filter: if length differs by more than max_distance, skip
            if abs(len(word1) - len(word2)) > max_distance:
                continue

            # Only check words of reasonable length (3+ chars)
            if len(word1) < 3 or len(word2) < 3:
                continue

            dist = levenshtein_distance(word1, word2)
            if 0 < dist <= max_distance:
                similar_pairs.append((word1, word2, dist))

    return similar_pairs


def find_english_patterns(words: Set[str]) -> Dict[str, List[str]]:
    """
    Find words containing traditional English patterns.
    These might indicate inconsistent spelling or preserved English words.
    """
    patterns = {
        'ee': r'ee',
        'oo': r'oo',
        'th': r'th',
        'sh': r'sh',
        'ch': r'ch',
        'ing': r'ing',
        'tion': r'tion',
        'ight': r'ight',
        'ough': r'ough',
        'ould': r'ould',
        'tion': r'tion',
        'sion': r'sion',
        'ness': r'ness',
        'ment': r'ment',
        'able': r'able',
        'ible': r'ible',
    }

    results = defaultdict(list)

    for word in sorted(words):
        for pattern_name, pattern in patterns.items():
            if re.search(pattern, word):
                results[pattern_name].append(word)

    return dict(results)


def group_similar_words(words: Set[str]) -> Dict[str, List[str]]:
    """
    Group words that might be variants of each other based on common patterns.
    """
    # Group by removing numbers and comparing base forms
    base_forms = defaultdict(list)

    for word in words:
        # Create a base form by replacing common number-letter substitutions
        base = word
        # Common spelin substitutions that might vary
        base = re.sub(r'[0-9]', '', base)
        if len(base) >= 3:
            base_forms[base].append(word)

    # Only return groups with multiple variants
    return {k: v for k, v in base_forms.items() if len(v) > 1}


def read_all_books(books_dir: str) -> Tuple[str, Dict[str, str]]:
    """
    Read all .md files from the books directory.
    Returns combined text and dict of {filename: content}.
    """
    all_text = []
    file_contents = {}

    books_path = Path(books_dir)
    for md_file in sorted(books_path.glob("*.md")):
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
            all_text.append(content)
            file_contents[md_file.name] = content

    return "\n".join(all_text), file_contents


def main():
    books_dir = "/home/david/hamnerin/books/"

    print("=" * 80)
    print("WORD FREQUENCY ANALYSIS FOR SPELIN BOOKS")
    print("=" * 80)
    print()

    # Read all books
    print("Reading all .md files from:", books_dir)
    combined_text, file_contents = read_all_books(books_dir)
    print(f"Found {len(file_contents)} files")
    print()

    # Extract and count words
    all_words = extract_words(combined_text)
    word_counts = Counter(all_words)
    unique_words = set(all_words)

    print(f"Total words: {len(all_words):,}")
    print(f"Unique words: {len(unique_words):,}")
    print()

    # Section 1: Most common words (top 100)
    print("=" * 80)
    print("SECTION 1: MOST COMMON WORDS (TOP 100)")
    print("=" * 80)
    print()
    print(f"{'Rank':<6} {'Word':<25} {'Count':<10} {'Frequency %':<12}")
    print("-" * 55)

    for rank, (word, count) in enumerate(word_counts.most_common(100), 1):
        freq_pct = (count / len(all_words)) * 100
        print(f"{rank:<6} {word:<25} {count:<10} {freq_pct:.3f}%")

    print()

    # Section 2: Words that appear only once (potential typos)
    print("=" * 80)
    print("SECTION 2: WORDS APPEARING ONLY ONCE (POTENTIAL TYPOS)")
    print("=" * 80)
    print()

    hapax_legomena = [word for word, count in word_counts.items() if count == 1]
    hapax_legomena.sort()

    print(f"Total words appearing only once: {len(hapax_legomena)}")
    print()

    # Display in columns
    col_width = 20
    cols = 4
    for i in range(0, len(hapax_legomena), cols):
        row = hapax_legomena[i:i + cols]
        print("  ".join(f"{word:<{col_width}}" for word in row))

    print()

    # Section 3: Word pairs differing by one character
    print("=" * 80)
    print("SECTION 3: WORD PAIRS DIFFERING BY ONE CHARACTER")
    print("=" * 80)
    print("(Potential inconsistencies or typos)")
    print()

    # Only check words that appear more than once to reduce noise
    frequent_words = {word for word, count in word_counts.items() if count >= 2}
    similar_pairs = find_similar_words(frequent_words, max_distance=1)

    print(f"Found {len(similar_pairs)} similar word pairs (among words appearing 2+ times)")
    print()

    # Sort by combined frequency (most impactful differences first)
    similar_pairs.sort(key=lambda x: -(word_counts[x[0]] + word_counts[x[1]]))

    print(f"{'Word 1':<20} {'Count':<8} {'Word 2':<20} {'Count':<8}")
    print("-" * 60)

    for word1, word2, dist in similar_pairs[:50]:
        print(f"{word1:<20} {word_counts[word1]:<8} {word2:<20} {word_counts[word2]:<8}")

    if len(similar_pairs) > 50:
        print(f"\n... and {len(similar_pairs) - 50} more pairs")

    print()

    # Section 4: Words with traditional English patterns
    print("=" * 80)
    print("SECTION 4: WORDS WITH TRADITIONAL ENGLISH PATTERNS")
    print("=" * 80)
    print()

    english_patterns = find_english_patterns(unique_words)

    for pattern, words in sorted(english_patterns.items()):
        if words:
            print(f"\n--- Pattern '{pattern}' ({len(words)} words) ---")
            # Show words with their counts, sorted by frequency
            words_with_counts = [(w, word_counts[w]) for w in words]
            words_with_counts.sort(key=lambda x: -x[1])

            # Display in a compact format
            for i in range(0, len(words_with_counts), 4):
                row = words_with_counts[i:i + 4]
                formatted = ["  ".join(f"{w} ({c})" for w, c in row)]
                print("  " + formatted[0])

    print()

    # Section 5: Word variant groups
    print("=" * 80)
    print("SECTION 5: POTENTIAL WORD VARIANTS (GROUPED)")
    print("=" * 80)
    print("(Words that might be different spellings of the same concept)")
    print()

    variant_groups = group_similar_words(unique_words)

    # Sort by number of variants
    sorted_groups = sorted(variant_groups.items(), key=lambda x: -len(x[1]))

    for base, variants in sorted_groups[:30]:
        if len(variants) > 1:
            variants_with_counts = [(v, word_counts[v]) for v in variants]
            variants_with_counts.sort(key=lambda x: -x[1])
            formatted = ", ".join(f"{v} ({c})" for v, c in variants_with_counts)
            print(f"  Base '{base}': {formatted}")

    print()

    # Summary statistics
    print("=" * 80)
    print("SUMMARY STATISTICS")
    print("=" * 80)
    print()
    print(f"Total files analyzed: {len(file_contents)}")
    print(f"Total words: {len(all_words):,}")
    print(f"Unique words: {len(unique_words):,}")
    print(f"Words appearing only once (hapax legomena): {len(hapax_legomena)} ({len(hapax_legomena)/len(unique_words)*100:.1f}%)")
    print(f"Words with traditional 'th' pattern: {len(english_patterns.get('th', []))}")
    print(f"Words with traditional 'sh' pattern: {len(english_patterns.get('sh', []))}")
    print(f"Words with traditional 'ch' pattern: {len(english_patterns.get('ch', []))}")
    print(f"Words with traditional 'ing' pattern: {len(english_patterns.get('ing', []))}")
    print(f"Words with traditional 'ee' pattern: {len(english_patterns.get('ee', []))}")
    print(f"Words with traditional 'oo' pattern: {len(english_patterns.get('oo', []))}")
    print()

    # File-by-file breakdown
    print("=" * 80)
    print("FILE-BY-FILE WORD COUNTS")
    print("=" * 80)
    print()
    print(f"{'Filename':<30} {'Total Words':<15} {'Unique Words':<15}")
    print("-" * 60)

    for filename, content in sorted(file_contents.items()):
        words = extract_words(content)
        print(f"{filename:<30} {len(words):<15} {len(set(words)):<15}")

    print()


if __name__ == "__main__":
    main()
