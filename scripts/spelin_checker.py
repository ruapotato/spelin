#!/usr/bin/env python3
"""
·spelin Consistency Checker v2

Scans books for common spelling errors and inconsistencies.
More refined to reduce false positives.
"""

import re
import sys
from pathlib import Path
from collections import defaultdict

# English words that are DEFINITELY wrong (phonetically different in spelin)
# Excludes words like "and" which are phonetically similar
DEFINITELY_WRONG_ENGLISH = [
    # Words where traditional spelling differs phonetically
    (r'\bthe\b', '8u'),
    (r'\bof\b', '4v'),
    (r'\bwith\b', 'wi3'),
    (r'\bfor\b', 'f9r'),
    (r'\bthat\b', '8at'),
    (r'\bthis\b', '8is'),
    (r'\bthey\b', '8A'),
    (r'\btheir\b', '8Er'),
    (r'\bthere\b', '8Er'),
    (r'\bthen\b', '8en'),
    (r'\bthan\b', '8an'),
    (r'\bthose\b', '8Oz'),
    (r'\bthese\b', '8Ez'),
    (r'\bthough\b', '8O'),
    (r'\bthrough\b', '3rW'),
    (r'\bthink\b', '3iqk'),
    (r'\bthing\b', '3iq'),
    (r'\bthings\b', '3iqz'),
    (r'\bwhat\b', 'w9t'),
    (r'\bwhen\b', 'wen'),
    (r'\bwhere\b', 'wer'),
    (r'\bwhich\b', 'wic'),
    (r'\bwho\b', 'hW'),
    (r'\bwhy\b', 'wI'),
    (r'\bhow\b', 'h1'),
    (r'\bwould\b', 'w0d'),
    (r'\bcould\b', 'k0d'),
    (r'\bshould\b', 'x0d'),
    (r'\bsaid\b', 'sed'),
    (r'\bsays\b', 'sez'),
    (r'\bpeople\b', 'pEp4l'),
    (r'\bknow\b', 'nO'),
    (r'\bknowledge\b', 'n9lij'),
    (r'\bknew\b', 'nU'),
    (r'\bword\b', 'w7d'),
    (r'\bwords\b', 'w7dz'),
    (r'\bworld\b', 'w7ld'),
    (r'\bwork\b', 'w7k'),
    (r'\bworking\b', 'w7kiq'),
    (r'\bworked\b', 'w7kt'),
    (r'\bwere\b', 'w7'),
    (r'\byou\b', 'U'),
    (r'\byour\b', 'Ur'),
    (r'\bhave\b', 'hav'),
    (r'\bbeen\b', 'bEn'),
    (r'\bbeing\b', 'bEiq'),
    (r'\bbefore\b', 'bEf9r'),
    (r'\bafter\b', 'aft7'),
    (r'\bbecause\b', 'bEk9z'),
    (r'\bbecome\b', 'bik4m'),
    (r'\bbetween\b', 'bitwEn'),
    (r'\bbeyond\b', 'biy9nd'),
    (r'\bfrom\b', 'fr4m'),
    (r'\binto\b', 'intW'),
    (r'\bover\b', 'Ov7'),
    (r'\bunder\b', '4nd7'),
    (r'\bother\b', '487'),
    (r'\banother\b', '4n487'),
    (r'\btogether\b', 't4ge87'),
    (r'\bfather\b', 'f687'),
    (r'\bmother\b', 'm487'),
    (r'\bbrother\b', 'br487'),
    (r'\bsomething\b', 's4m3iq'),
    (r'\bnothing\b', 'n43iq'),
    (r'\beverything\b', 'evE3iq'),
    (r'\banything\b', 'enE3iq'),
    (r'\bunderstand\b', '4nd7stand'),
    (r'\bunderstanding\b', '4nd7standiq'),
    (r'\btruth\b', 'trW3'),
    (r'\bheart\b', 'h6rt'),
    (r'\bhearts\b', 'h6rts'),
    (r'\bheaven\b', 'hev4n'),
    (r'\bheavens\b', 'hev4nz'),
    (r'\bearth\b', '7r3'),
    (r'\btime\b', 'tIm'),
    (r'\btimes\b', 'tImz'),
    (r'\bnight\b', 'nIt'),
    (r'\bnights\b', 'nIts'),
    (r'\blight\b', 'lIt'),
    (r'\blights\b', 'lIts'),
    (r'\bright\b', 'rIt'),
    (r'\brighteous\b', 'rIc4s'),
    (r'\blife\b', 'lIf'),
    (r'\blive\b', 'liv'),
    (r'\bliving\b', 'liviq'),
    (r'\bdeath\b', 'de3'),
    (r'\bpeace\b', 'pEs'),
    (r'\bglory\b', 'gl9rE'),
    (r'\bking\b', 'kiq'),
    (r'\bkings\b', 'kiqz'),
    (r'\bkingdom\b', 'kiqd4m'),
    (r'\bpower\b', 'p17'),
    (r'\bpowerful\b', 'p17f4l'),
    (r'\bspirit\b', 'spirit'),
    (r'\bspelling\b', 'speliq'),
    (r'\bchapter\b', 'capt7'),
    (r'\bchapters\b', 'capt7z'),
    (r'\bverse\b', 'v7s'),
    (r'\bverses\b', 'v7siz'),
    (r'\bbook\b', 'bUk'),
    (r'\bbooks\b', 'bUks'),
    (r'\bletter\b', 'let7'),
    (r'\bletters\b', 'let7z'),
    (r'\bsound\b', 's1nd'),
    (r'\bsounds\b', 's1ndz'),
    (r'\bspeak\b', 'spEk'),
    (r'\bspeaking\b', 'spEkiq'),
    (r'\bspoke\b', 'spOk'),
    (r'\bspoken\b', 'spOk4n'),
    (r'\bspeech\b', 'spEc'),
    (r'\bhear\b', 'hir'),
    (r'\bheard\b', 'h7d'),
    (r'\bhearing\b', 'hiriq'),
    (r'\blisten\b', 'lis4n'),
    (r'\blistening\b', 'lis4niq'),
    (r'\bread\b', 'rEd'),
    (r'\breading\b', 'rEdiq'),
    (r'\bwrite\b', 'rIt'),
    (r'\bwriting\b', 'rItiq'),
    (r'\bwritten\b', 'rit4n'),
    (r'\bteach\b', 'tEc'),
    (r'\bteacher\b', 'tEc7'),
    (r'\bteaching\b', 'tEciq'),
    (r'\bteachings\b', 'tEciqz'),
    (r'\blearn\b', 'l7n'),
    (r'\blearning\b', 'l7niq'),
    (r'\blearned\b', 'l7nd'),
    (r'\bwise\b', 'wIz'),
    (r'\bwisdom\b', 'wizd4m'),
    (r'\bfool\b', 'fWl'),
    (r'\bfoolish\b', 'fWlix'),
    (r'\btrue\b', 'trW'),
    (r'\btruly\b', 'trWlE'),
    (r'\bfalse\b', 'f9ls'),
    (r'\bgood\b', 'g0d'),
    (r'\bevil\b', 'Ev4l'),
    (r'\bblessing\b', 'blesiq'),
    (r'\bblessings\b', 'blesiqz'),
    (r'\bblessed\b', 'blest'),
    (r'\bcurse\b', 'k7s'),
    (r'\bcursed\b', 'k7st'),
    (r'\bpraise\b', 'prAz'),
    (r'\bpraised\b', 'prAzd'),
    (r'\bpraising\b', 'prAziq'),
    (r'\bprayer\b', 'prAr'),
    (r'\bprayers\b', 'prArz'),
    (r'\bfaith\b', 'fA3'),
    (r'\bfaithful\b', 'fA3f4l'),
    (r'\bhope\b', 'hOp'),
    (r'\bhopes\b', 'hOps'),
    (r'\blove\b', 'l4v'),
    (r'\bloving\b', 'l4viq'),
    (r'\bloved\b', 'l4vd'),
    (r'\bjoy\b', 'j2'),
    (r'\bjoyful\b', 'j2f4l'),
    (r'\bsorrow\b', 's9rO'),
    (r'\banger\b', 'aq7'),
    (r'\bangry\b', 'aqrE'),
    (r'\bpatience\b', 'pAx4ns'),
    (r'\bpatient\b', 'pAx4nt'),
    (r'\bhumble\b', 'h4mb4l'),
    (r'\bproud\b', 'pr1d'),
    (r'\bpride\b', 'prId'),
    (r'\bchild\b', 'cIld'),
    (r'\bchildren\b', 'cildr4n'),
    (r'\bwoman\b', 'w0m4n'),
    (r'\bwomen\b', 'wim4n'),
    (r'\bhouse\b', 'h1s'),
    (r'\bhouses\b', 'h1ziz'),
    (r'\bcity\b', 'sitE'),
    (r'\bcities\b', 'sitEz'),
    (r'\bwater\b', 'w9t7'),
    (r'\bwaters\b', 'w9t7z'),
    (r'\bfire\b', 'fI7'),
    (r'\bmountain\b', 'm1nt4n'),
    (r'\bmountains\b', 'm1nt4nz'),
    (r'\btree\b', 'trE'),
    (r'\btrees\b', 'trEz'),
    (r'\bstone\b', 'stOn'),
    (r'\bstones\b', 'stOnz'),
    (r'\bbread\b', 'bred'),
    (r'\bwine\b', 'wIn'),
    (r'\bblood\b', 'bl4d'),
    (r'\bbody\b', 'b9dE'),
    (r'\bbodies\b', 'b9dEz'),
    (r'\bmouth\b', 'm13'),
    (r'\bmouths\b', 'm13z'),
    (r'\btongue\b', 't4q'),
    (r'\btongues\b', 't4qz'),
    (r'\bvoice\b', 'v2s'),
    (r'\bvoices\b', 'v2siz'),
    (r'\bname\b', 'nAm'),
    (r'\bnames\b', 'nAmz'),
    (r'\bnamed\b', 'nAmd'),
    (r'\bnumber\b', 'n4mb7'),
    (r'\bnumbers\b', 'n4mb7z'),
    (r'\bsilence\b', 'sIl4ns'),
    (r'\bsilent\b', 'sIl4nt'),
    (r'\bcommunication\b', 'k4mUnEkAx4n'),
    (r'\bcommunicate\b', 'k4mUnEkAt'),
    (r'\bconfusion\b', 'k4nfUX4n'),
    (r'\bconfused\b', 'k4nfUzd'),
    (r'\bconfusing\b', 'k4nfUziq'),
    (r'\bclarity\b', 'kler4tE'),
    (r'\bclear\b', 'klir'),
    (r'\balphabet\b', 'alfabet'),
    (r'\balphabets\b', 'alfabets'),
    (r'\bphonetic\b', 'f4netik'),
    (r'\bpronunciation\b', 'pr4n4nsEAx4n'),
    (r'\bpronounce\b', 'pr4n1ns'),
]

# Undefined IPA/Unicode symbols that should not appear
UNDEFINED_SYMBOLS = [
    (r'θ', '3 (voiceless th)'),
    (r'ð', '8 (voiced th)'),
    (r'ŋ', 'q (ng sound)'),
    (r'ʃ', 'x (sh sound)'),
    (r'ʒ', 'X (zh sound)'),
    (r'ʧ', 'c (ch sound)'),
    (r'ʤ', 'j (j sound)'),
    (r'ə', '4 (schwa)'),
    (r'ɜ', '7 (bird vowel)'),
    (r'ɔ', '9 (law vowel)'),
    (r'ɑ', '6 (father vowel)'),
    (r'ʊ', '0 (book vowel)'),
    (r'ɪ', 'i (bit vowel)'),
    (r'æ', 'a (cat vowel)'),
    (r'ʌ', 'u (but vowel)'),
]

# Common wrong th usage (should be voiceless 3 not voiced 8)
WRONG_TH = [
    (r'\bwi8\b', 'wi3', 'with - voiceless th'),
    (r'\bwi8in\b', 'wi3in', 'within'),
    (r'\bwi81t\b', 'wi31t', 'without'),
    (r'\b8ank', '3ank', 'thank'),
    (r'\b8anks\b', '3anks', 'thanks'),
    (r'\b8ink\b', '3ink', 'think'),
    (r'\b8inkiq\b', '3inkiq', 'thinking'),
    (r'\b89t\b', '39t', 'thought'),
    (r'\b8rW\b', '3rW', 'through'),
    (r'\b8rE\b', '3rE', 'three'),
    (r'\b8rOn\b', '3rOn', 'throne'),
    (r'\b8r1\b', '3r1', 'throw'),
    (r'\bn48iq\b', 'n43iq', 'nothing'),
    (r'\bs4m8iq\b', 's4m3iq', 'something'),
    (r'\bevE8iq\b', 'evE3iq', 'everything'),
    (r'\benE8iq\b', 'enE3iq', 'anything'),
    (r'\bm18\b', 'm13', 'mouth'),
    (r'\bm18s\b', 'm13s', 'mouths'),
    (r'\bt7r8\b', 't7r3', 'truth'),  # if spelled this way
    (r'\bfA8\b', 'fA3', 'faith'),
    (r'\bE8iks\b', 'E3iks', 'ethics'),
    (r'\bpa8\b', 'pa3', 'path'),
    (r'\bde8\b', 'de3', 'death'),
    (r'\bDE8\b', 'DE3', 'death'),
    (r'\bbre8\b', 'bre3', 'breath'),
    (r'\bkl98\b', 'kl93', 'cloth'),
    (r'\bn9r8\b', 'n9r3', 'north'),
    (r'\bs18\b', 's13', 'south'),
    (r'\b7r8\b', '7r3', 'earth'),
    (r'\bb7r8\b', 'b7r3', 'birth'),
    (r'\bw7r8\b', 'w7r3', 'worth'),
]

# Check for common typos and malformed words
TYPO_PATTERNS = [
    (r'\b(\w)\1{3,}\b', 'repeated letter 4+ times'),
    (r'\b[a-z]*[A-Z][a-z]*[A-Z][a-z]*\b', 'mixed case in middle of word (might be error)'),
    (r'\s{2,}', 'multiple spaces'),
    (r'\b\w+\s+\w\b(?=\s)', 'single letter word (might be typo)'),
]

# Known proper nouns that need namer dots
PROPER_NOUNS_MISSING_DOT = [
    'spelin', 'iqglix', 'bab4l', 'bab4l6n', 'j4rWs4l4m', 'jerWs4l4m',
    'Ijpt', 'Ejpt', 'rOm', 'grEs', 'hEbrW',
]


def check_file(filepath):
    """Check a single file for issues."""
    issues = []

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')

    for line_num, line in enumerate(lines, 1):
        # Skip markdown headers
        if line.strip().startswith('#'):
            continue
        # Skip lines that are mostly in quotes (intentional examples)
        quote_count = line.count('"') + line.count("'")
        if quote_count >= 4:
            continue

        # Check for definitely wrong English words
        for pattern, suggestion in DEFINITELY_WRONG_ENGLISH:
            matches = list(re.finditer(pattern, line, re.IGNORECASE))
            for match in matches:
                # Skip if in quotes
                start = max(0, match.start() - 1)
                end = min(len(line), match.end() + 1)
                if '"' in line[start:end] or "'" in line[start:end]:
                    continue
                # Skip if preceded by namer dot (proper noun)
                if match.start() > 0 and line[match.start()-1] == '·':
                    continue
                issues.append({
                    'type': 'ENGLISH',
                    'line': line_num,
                    'word': match.group(),
                    'suggestion': suggestion,
                    'context': line.strip()[:100],
                    'severity': 'HIGH'
                })

        # Check for undefined symbols
        for symbol, replacement in UNDEFINED_SYMBOLS:
            if symbol in line:
                issues.append({
                    'type': 'SYMBOL',
                    'line': line_num,
                    'word': symbol,
                    'suggestion': replacement,
                    'context': line.strip()[:100],
                    'severity': 'HIGH'
                })

        # Check wrong th
        for wrong, right, note in WRONG_TH:
            matches = list(re.finditer(wrong, line, re.IGNORECASE))
            for match in matches:
                issues.append({
                    'type': 'WRONG_TH',
                    'line': line_num,
                    'word': match.group(),
                    'suggestion': right,
                    'note': note,
                    'context': line.strip()[:100],
                    'severity': 'MEDIUM'
                })

        # Check for proper nouns missing dots
        for noun in PROPER_NOUNS_MISSING_DOT:
            pattern = rf'(?<![·\w]){noun}(?=\s|[,.\-!?;:]|$)'
            matches = list(re.finditer(pattern, line, re.IGNORECASE))
            for match in matches:
                issues.append({
                    'type': 'MISSING_DOT',
                    'line': line_num,
                    'word': match.group(),
                    'suggestion': f'·{match.group()}',
                    'context': line.strip()[:100],
                    'severity': 'LOW'
                })

        # Check typo patterns
        for pattern, note in TYPO_PATTERNS:
            matches = list(re.finditer(pattern, line))
            for match in matches:
                if note == 'multiple spaces':
                    issues.append({
                        'type': 'TYPO',
                        'line': line_num,
                        'word': repr(match.group()),
                        'note': note,
                        'context': line.strip()[:100],
                        'severity': 'LOW'
                    })

    return issues


def main():
    books_dir = Path('/home/david/hamnerin/books')

    all_issues = defaultdict(list)
    total_issues = 0

    for filepath in sorted(books_dir.glob('*.md')):
        if filepath.name == 'TABLE_OF_CONTENTS.md':
            continue
        issues = check_file(filepath)
        if issues:
            all_issues[filepath.name] = issues
            total_issues += len(issues)

    # Print summary
    print("=" * 80)
    print("·spelin CONSISTENCY CHECK REPORT v2")
    print("=" * 80)
    print()

    high = sum(1 for f in all_issues.values() for i in f if i.get('severity') == 'HIGH')
    medium = sum(1 for f in all_issues.values() for i in f if i.get('severity') == 'MEDIUM')
    low = sum(1 for f in all_issues.values() for i in f if i.get('severity') == 'LOW')

    print(f"Total issues: {total_issues}")
    print(f"  HIGH:   {high}")
    print(f"  MEDIUM: {medium}")
    print(f"  LOW:    {low}")
    print()

    # Group issues by type across all files
    by_type = defaultdict(list)
    for filename, issues in all_issues.items():
        for issue in issues:
            by_type[issue['type']].append((filename, issue))

    # Print by type
    for issue_type in ['ENGLISH', 'SYMBOL', 'WRONG_TH', 'MISSING_DOT', 'TYPO']:
        items = by_type.get(issue_type, [])
        if items:
            print("-" * 80)
            print(f"{issue_type} ({len(items)} issues)")
            print("-" * 80)

            # Group by word
            by_word = defaultdict(list)
            for filename, issue in items:
                key = issue.get('word', 'unknown')
                by_word[key].append((filename, issue))

            for word, occurrences in sorted(by_word.items(), key=lambda x: -len(x[1]))[:30]:
                files = set(f for f, _ in occurrences)
                suggestion = occurrences[0][1].get('suggestion', '')
                note = occurrences[0][1].get('note', '')
                print(f"  '{word}' -> '{suggestion}' {note}")
                print(f"    Found {len(occurrences)}x in: {', '.join(sorted(files)[:5])}")

            if len(by_word) > 30:
                print(f"  ... and {len(by_word) - 30} more unique issues")
            print()

    # Per-file breakdown
    print("=" * 80)
    print("PER-FILE SUMMARY")
    print("=" * 80)
    for filename, issues in sorted(all_issues.items(), key=lambda x: -len(x[1])):
        high_c = sum(1 for i in issues if i.get('severity') == 'HIGH')
        med_c = sum(1 for i in issues if i.get('severity') == 'MEDIUM')
        low_c = sum(1 for i in issues if i.get('severity') == 'LOW')
        print(f"  {filename}: {len(issues)} total (H:{high_c} M:{med_c} L:{low_c})")

    return total_issues


if __name__ == '__main__':
    issues = main()
    sys.exit(0 if issues == 0 else 1)
