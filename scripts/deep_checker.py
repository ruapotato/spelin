#!/usr/bin/env python3
"""
·spelin Deep Consistency Checker

Finds inconsistencies, repeated words, formatting issues, and more.
"""

import re
import sys
from pathlib import Path
from collections import defaultdict, Counter

BOOKS_DIR = Path('/home/david/hamnerin/books')

def find_word_variants():
    """Find words spelled differently across files."""
    word_files = defaultdict(lambda: defaultdict(int))

    for filepath in BOOKS_DIR.glob('*.md'):
        if filepath.name == 'TABLE_OF_CONTENTS.md':
            continue
        with open(filepath, 'r') as f:
            content = f.read()

        # Extract words (including numbers and special chars used in spelin)
        words = re.findall(r'[a-zA-Z0-9·]+', content.lower())
        for word in words:
            if len(word) > 2:  # Skip very short words
                word_files[word][filepath.name] += 1

    return word_files


def find_similar_words(word_files):
    """Find words that look similar (might be variants)."""
    words = list(word_files.keys())
    similar_groups = []

    # Common variant patterns
    variant_patterns = [
        (r'4', r'u'),  # schwa vs u
        (r'4', r'a'),  # schwa vs a
        (r'7', r'er'),  # bird vowel vs er
        (r'7', r'ir'),  # bird vowel vs ir
        (r'9', r'o'),  # law vowel vs o
        (r'0', r'u'),  # book vowel vs u
        (r'E', r'e'),  # ee vs e
        (r'I', r'i'),  # eye vs i
        (r'3', r'8'),  # voiceless vs voiced th
    ]

    seen = set()
    for i, w1 in enumerate(words):
        if w1 in seen:
            continue
        group = {w1}
        for w2 in words[i+1:]:
            if w2 in seen:
                continue
            # Check if words are similar
            if len(w1) == len(w2):
                diffs = sum(1 for a, b in zip(w1, w2) if a != b)
                if diffs == 1:
                    group.add(w2)
            # Check variant patterns
            for p1, p2 in variant_patterns:
                if w1.replace(p1, p2) == w2 or w2.replace(p1, p2) == w1:
                    group.add(w2)

        if len(group) > 1:
            similar_groups.append(group)
            seen.update(group)

    return similar_groups


def find_repeated_words():
    """Find repeated words (possible typos)."""
    issues = []

    for filepath in BOOKS_DIR.glob('*.md'):
        if filepath.name == 'TABLE_OF_CONTENTS.md':
            continue
        with open(filepath, 'r') as f:
            lines = f.readlines()

        for line_num, line in enumerate(lines, 1):
            # Find repeated words
            matches = re.finditer(r'\b(\w+)\s+\1\b', line, re.IGNORECASE)
            for match in matches:
                word = match.group(1)
                if word.lower() not in ['8u', '8at', 'had', 'very']:  # Some repeats are valid
                    issues.append({
                        'file': filepath.name,
                        'line': line_num,
                        'word': word,
                        'context': line.strip()[:80]
                    })

    return issues


def find_formatting_issues():
    """Find formatting problems."""
    issues = []

    for filepath in BOOKS_DIR.glob('*.md'):
        if filepath.name == 'TABLE_OF_CONTENTS.md':
            continue
        with open(filepath, 'r') as f:
            lines = f.readlines()

        for line_num, line in enumerate(lines, 1):
            # Multiple spaces
            if '  ' in line and not line.strip().startswith('#'):
                issues.append({
                    'file': filepath.name,
                    'line': line_num,
                    'type': 'double_space',
                    'context': line.strip()[:80]
                })

            # Space before punctuation
            if re.search(r'\s[,.\?!;:]', line):
                issues.append({
                    'file': filepath.name,
                    'line': line_num,
                    'type': 'space_before_punct',
                    'context': line.strip()[:80]
                })

            # Missing space after punctuation
            if re.search(r'[,.\?!;:][a-zA-Z0-9]', line) and '://' not in line:
                issues.append({
                    'file': filepath.name,
                    'line': line_num,
                    'type': 'missing_space_after_punct',
                    'context': line.strip()[:80]
                })

            # Orphaned quotes
            quote_count = line.count('"')
            if quote_count % 2 != 0:
                issues.append({
                    'file': filepath.name,
                    'line': line_num,
                    'type': 'unbalanced_quotes',
                    'context': line.strip()[:80]
                })

            # Very long lines (might have formatting issues)
            if len(line) > 500:
                issues.append({
                    'file': filepath.name,
                    'line': line_num,
                    'type': 'very_long_line',
                    'context': f"Line length: {len(line)} chars"
                })

    return issues


def find_suspicious_patterns():
    """Find patterns that might indicate errors."""
    issues = []

    suspicious = [
        (r'\b[A-Z]{3,}\b', 'all_caps_word'),  # Words in all caps (except short ones)
        (r'[a-z][A-Z]{2,}[a-z]', 'caps_in_middle'),  # Caps in middle of word
        (r'\d{4,}', 'long_number'),  # Long numbers (might be typos)
        (r'[a-zA-Z]\d[a-zA-Z]\d[a-zA-Z]', 'alternating_letter_number'),  # Weird alternation
        (r'·{2,}', 'multiple_dots'),  # Multiple namer dots
        (r'[^·\s]·', 'dot_not_at_start'),  # Namer dot not at word start
        (r'\b\w*[qxXcj]{3,}\w*\b', 'unlikely_consonant_cluster'),  # Unlikely consonant clusters
    ]

    for filepath in BOOKS_DIR.glob('*.md'):
        if filepath.name == 'TABLE_OF_CONTENTS.md':
            continue
        with open(filepath, 'r') as f:
            lines = f.readlines()

        for line_num, line in enumerate(lines, 1):
            if line.strip().startswith('#'):
                continue
            for pattern, issue_type in suspicious:
                matches = re.finditer(pattern, line)
                for match in matches:
                    issues.append({
                        'file': filepath.name,
                        'line': line_num,
                        'type': issue_type,
                        'match': match.group(),
                        'context': line.strip()[:80]
                    })

    return issues


def find_common_word_inconsistencies():
    """Check for specific common words that should be consistent."""
    # Words and their expected spellings
    expected = {
        'and': ['and', '4nd'],
        'the': ['8u'],
        'of': ['4v'],
        'to': ['tW', 'tu'],
        'in': ['in'],
        'is': ['iz'],
        'it': ['it'],
        'that': ['8at'],
        'was': ['woz', 'waz', 'w6z'],
        'for': ['f9r', 'fOr'],  # fOr is "four"
        'on': ['9n', 'on'],
        'are': ['6r', 'ar'],
        'as': ['az', '6z'],
        'with': ['wi3'],
        'his': ['hiz'],
        'they': ['8A'],
        'be': ['bE'],
        'at': ['at', '6t'],
        'one': ['wun'],
        'have': ['hav'],
        'this': ['8is'],
        'from': ['fr4m'],
        'by': ['bI'],
        'not': ['n9t', 'n6t'],
        'but': ['b4t'],
        'what': ['w9t', 'wot'],
        'all': ['9l'],
        'were': ['w7', 'wer'],
        'when': ['wen'],
        'we': ['wE'],
        'there': ['8Er'],
        'can': ['kan', 'k4n'],
        'had': ['had'],
        'her': ['h7', 'h4r'],
        'has': ['haz'],
        'him': ['him'],
        'been': ['bEn', 'bin'],
        'would': ['w0d'],
        'who': ['hW'],
        'will': ['wil'],
        'more': ['m9r'],
        'if': ['if'],
        'no': ['nO'],
        'out': ['1t'],
        'so': ['sO'],
        'said': ['sed'],
        'each': ['Ec'],
        'she': ['xE'],
        'which': ['wic'],
        'do': ['dW'],
        'their': ['8Er'],
        'time': ['tIm'],
        'very': ['verE'],
        'make': ['mAk'],
        'like': ['lIk'],
        'just': ['j4st'],
        'over': ['Ov7'],
        'such': ['s4c'],
        'into': ['intW'],
        'year': ['yir'],
        'your': ['Ur', 'y9r'],
        'good': ['g0d'],
        'some': ['s4m'],
        'could': ['k0d'],
        'them': ['8em'],
        'other': ['48r', '487'],
        'than': ['8an'],
        'then': ['8en'],
        'now': ['n1'],
        'look': ['l0k'],
        'only': ['OnlE'],
        'come': ['k4m'],
        'its': ['its'],
        'also': ['9lsO'],
        'back': ['bak'],
        'after': ['aft7'],
        'use': ['Uz', 'yWz'],
        'two': ['tW'],
        'how': ['h1'],
        'our': ['1r', 'ar'],
        'work': ['w7k'],
        'first': ['f7st'],
        'well': ['wel'],
        'way': ['wA'],
        'even': ['Ev4n'],
        'new': ['nU', 'nW'],
        'want': ['w9nt'],
        'because': ['bEk9z', 'bik9z'],
        'any': ['enE'],
        'these': ['8Ez'],
        'give': ['giv'],
        'day': ['dA'],
        'most': ['mOst'],
        'us': ['4s'],
    }

    issues = []
    word_variants = defaultdict(lambda: defaultdict(int))

    for filepath in BOOKS_DIR.glob('*.md'):
        if filepath.name == 'TABLE_OF_CONTENTS.md':
            continue
        with open(filepath, 'r') as f:
            content = f.read().lower()

        words = re.findall(r'\b[a-z0-9]+\b', content)
        for word in words:
            word_variants[word][filepath.name] += 1

    # Check for unexpected variants
    for english, valid_spellings in expected.items():
        valid_lower = [s.lower() for s in valid_spellings]
        # Look for words that are close to valid spellings but not quite
        for word, files in word_variants.items():
            if word in valid_lower:
                continue
            for valid in valid_lower:
                # Check if word is very similar to a valid spelling
                if len(word) == len(valid):
                    diffs = sum(1 for a, b in zip(word, valid) if a != b)
                    if diffs == 1 and sum(files.values()) > 5:
                        issues.append({
                            'word': word,
                            'expected': valid,
                            'english': english,
                            'count': sum(files.values()),
                            'files': list(files.keys())[:3]
                        })

    return issues


def main():
    print("=" * 80)
    print("·spelin DEEP CONSISTENCY CHECK")
    print("=" * 80)
    print()

    # 1. Find repeated words
    print("Checking for repeated words...")
    repeated = find_repeated_words()
    if repeated:
        print(f"\n### REPEATED WORDS ({len(repeated)} found)")
        for issue in repeated[:20]:
            print(f"  {issue['file']}:{issue['line']}: '{issue['word']}' repeated")
            print(f"    Context: {issue['context']}")
        if len(repeated) > 20:
            print(f"  ... and {len(repeated) - 20} more")
    else:
        print("  No repeated words found.")
    print()

    # 2. Find formatting issues
    print("Checking for formatting issues...")
    formatting = find_formatting_issues()
    if formatting:
        print(f"\n### FORMATTING ISSUES ({len(formatting)} found)")
        by_type = defaultdict(list)
        for issue in formatting:
            by_type[issue['type']].append(issue)
        for issue_type, issues in by_type.items():
            print(f"\n  {issue_type}: {len(issues)} issues")
            for issue in issues[:5]:
                print(f"    {issue['file']}:{issue['line']}: {issue['context'][:60]}")
            if len(issues) > 5:
                print(f"    ... and {len(issues) - 5} more")
    else:
        print("  No formatting issues found.")
    print()

    # 3. Find suspicious patterns
    print("Checking for suspicious patterns...")
    suspicious = find_suspicious_patterns()
    if suspicious:
        print(f"\n### SUSPICIOUS PATTERNS ({len(suspicious)} found)")
        by_type = defaultdict(list)
        for issue in suspicious:
            by_type[issue['type']].append(issue)
        for issue_type, issues in by_type.items():
            print(f"\n  {issue_type}: {len(issues)} issues")
            for issue in issues[:5]:
                print(f"    {issue['file']}:{issue['line']}: '{issue['match']}' - {issue['context'][:50]}")
            if len(issues) > 5:
                print(f"    ... and {len(issues) - 5} more")
    else:
        print("  No suspicious patterns found.")
    print()

    # 4. Word variant analysis
    print("Analyzing word variants...")
    word_files = find_word_variants()
    similar = find_similar_words(word_files)

    # Filter to interesting variants (appear in multiple files with different spellings)
    interesting = []
    for group in similar:
        group_list = list(group)
        files_per_word = {w: set(word_files[w].keys()) for w in group_list}
        total_files = set()
        for f in files_per_word.values():
            total_files.update(f)
        if len(total_files) > 1:  # Appears in multiple files
            total_count = sum(sum(word_files[w].values()) for w in group_list)
            if total_count > 10:  # Appears often enough to matter
                interesting.append((group_list, files_per_word, total_count))

    if interesting:
        print(f"\n### WORD VARIANTS ({len(interesting)} groups)")
        interesting.sort(key=lambda x: -x[2])
        for group, files_per_word, count in interesting[:30]:
            print(f"\n  Variants (total {count}x): {', '.join(group)}")
            for word in group:
                file_list = ', '.join(list(files_per_word[word])[:3])
                word_count = sum(word_files[word].values())
                print(f"    '{word}': {word_count}x in {file_list}")
    print()

    # 5. Check common word inconsistencies
    print("Checking common word spellings...")
    common_issues = find_common_word_inconsistencies()
    if common_issues:
        print(f"\n### POTENTIAL MISSPELLINGS ({len(common_issues)} found)")
        common_issues.sort(key=lambda x: -x['count'])
        for issue in common_issues[:20]:
            print(f"  '{issue['word']}' ({issue['count']}x) - expected '{issue['expected']}' for '{issue['english']}'")
            print(f"    Found in: {', '.join(issue['files'])}")
    print()

    total = len(repeated) + len(formatting) + len(suspicious)
    print("=" * 80)
    print(f"Total actionable issues: {total}")
    print("=" * 80)

    return total


if __name__ == '__main__':
    sys.exit(0 if main() == 0 else 1)
