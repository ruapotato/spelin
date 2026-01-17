#!/usr/bin/env python3
"""
·spelin text-to-speech reader using espeak.

Converts spelin text to espeak phonemes and speaks it.

Usage:
    spelin_speak.py "8u kwik br1n foks"     # Speak text
    spelin_speak.py -f file.md              # Speak a file
    spelin_speak.py -w out.wav "text"       # Write to WAV
    spelin_speak.py --demo                  # Run demo
    spelin_speak.py -V -f file.txt          # Visual mode with highlighting
"""

import subprocess
import sys
import argparse
import time
import threading
import re
import shutil
import os

# Spelin symbol to espeak phoneme mapping
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
    'y': 'j',      # "yes"
    'j': 'dZ',     # "judge"
    'c': 'tS',     # "chip"
    'x': 'S',      # "ship"
    'X': 'Z',      # "measure"
    'q': 'N',      # "sing"
    '3': 'T',      # "think" (voiceless th)
    '8': 'D',      # "they" (voiced th)

    # Vowels - uppercase = long/letter name
    'A': 'eI',     # "day"
    'a': 'a',      # "cat"
    'E': 'i:',     # "see"
    'e': 'E',      # "bed"
    'I': 'aI',     # "my"
    'i': 'I',      # "bit"
    'O': 'oU',     # "go"
    'o': '0',      # "hot"
    'U': 'ju:',    # "use"
    'u': 'V',      # "but"

    # Extended vowels (numbers)
    'W': 'u:',     # "boot"
    '0': 'U',      # "book"
    '4': '@',      # schwa "about"
    '7': '3:',     # "bird"
    '9': 'O:',     # "law"
    '6': 'A:',     # "father"
    '1': 'aU',     # "out"
    '2': 'OI',     # "oil"
}

# Special word patterns
SPECIAL_PATTERNS = {
    '8u': 'D@',    # "the" - common contraction
    '4v': '@v',    # "of"
}


def spelin_to_phonemes(text: str) -> str:
    """Convert spelin text to espeak phoneme string."""
    result = []
    i = 0

    # Remove namer dots (·) - they're just markers
    text = text.replace('·', '')

    while i < len(text):
        # Check for special patterns first
        matched = False
        for pattern, phoneme in SPECIAL_PATTERNS.items():
            if text[i:i+len(pattern)] == pattern:
                result.append(phoneme)
                i += len(pattern)
                matched = True
                break

        if matched:
            continue

        char = text[i]

        if char in SPELIN_TO_ESPEAK:
            result.append(SPELIN_TO_ESPEAK[char])
        elif char in ' \t':
            result.append(' ')
        elif char in '.,!?;:':
            # Punctuation becomes pauses
            result.append(' ')
        elif char == '\n':
            result.append(' ')
        elif char == '-':
            # Hyphen - small pause
            result.append(' ')
        else:
            # Unknown character - skip or pass through
            pass

        i += 1

    return ''.join(result)


def speak(text: str, speed: int = 150, pitch: int = 50, output_file: str = None):
    """Speak spelin text using espeak."""
    phonemes = spelin_to_phonemes(text)

    # espeak phoneme input mode uses [[...]]
    phoneme_input = f'[[{phonemes}]]'

    cmd = [
        'espeak',
        '-v', 'en',
        '-s', str(speed),
        '-p', str(pitch),
    ]

    if output_file:
        cmd.extend(['-w', output_file])

    cmd.append(phoneme_input)

    subprocess.run(cmd)


def speak_file(filepath: str, speed: int = 150, pitch: int = 50, output_file: str = None):
    """Read and speak a spelin file."""
    with open(filepath, 'r') as f:
        text = f.read()

    # Skip markdown headers and formatting
    lines = []
    for line in text.split('\n'):
        # Skip headers
        if line.startswith('#'):
            # But speak the header text (without the #)
            header_text = line.lstrip('#').strip()
            if header_text:
                lines.append(header_text)
            continue
        # Skip horizontal rules
        if line.startswith('---'):
            lines.append('')  # pause
            continue
        # Skip empty lines (but add pause)
        if not line.strip():
            lines.append('')
            continue
        # Remove verse numbers like "1." or "¹"
        line = line.lstrip('0123456789.¹²³⁴⁵⁶⁷⁸⁹⁰ ')
        lines.append(line)

    text = '\n'.join(lines)
    speak(text, speed, pitch, output_file)


# ANSI escape codes for terminal styling
class Style:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    UNDERLINE = '\033[4m'
    REVERSE = '\033[7m'

    # Colors
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'

    # Background colors
    BG_BLUE = '\033[44m'
    BG_CYAN = '\033[46m'
    BG_WHITE = '\033[47m'
    BG_YELLOW = '\033[43m'

    # Cursor control
    CLEAR_SCREEN = '\033[2J'
    HOME = '\033[H'
    CLEAR_LINE = '\033[2K'
    HIDE_CURSOR = '\033[?25l'
    SHOW_CURSOR = '\033[?25h'


def get_terminal_size():
    """Get terminal dimensions."""
    size = shutil.get_terminal_size((80, 24))
    return size.columns, size.lines


def count_phonemes(word: str) -> int:
    """Count approximate phonemes in a spelin word."""
    count = 0
    i = 0
    word = word.replace('·', '')

    while i < len(word):
        # Check special patterns
        matched = False
        for pattern, phonemes in SPECIAL_PATTERNS.items():
            if word[i:i+len(pattern)] == pattern:
                # Count actual phonemes in the pattern (rough estimate: 2 per pattern)
                count += 2
                i += len(pattern)
                matched = True
                break
        if matched:
            continue

        if word[i] in SPELIN_TO_ESPEAK:
            count += 1
        i += 1

    return max(count, 1)


def estimate_word_duration(word: str, speed: int) -> float:
    """Estimate how long a word takes to speak in seconds."""
    # espeak speed is roughly words per minute
    # But we want phoneme-based timing for accuracy
    phoneme_count = count_phonemes(word)

    # Base: about 10 phonemes per second at speed=150
    # Adjust for speed setting
    phonemes_per_second = (speed / 150) * 10

    # Add small pause between words
    duration = phoneme_count / phonemes_per_second + 0.05

    return duration


def parse_words(text: str) -> list:
    """Parse text into words with their positions."""
    words = []
    # Split on whitespace but keep track of positions
    pattern = re.compile(r'(\S+)')

    for match in pattern.finditer(text):
        words.append({
            'text': match.group(1),
            'start': match.start(),
            'end': match.end()
        })

    return words


def render_text_with_highlight(text: str, words: list, current_idx: int,
                                term_width: int, show_phonemes: bool = False) -> str:
    """Render text with the current word highlighted."""
    if current_idx < 0 or current_idx >= len(words):
        return text

    result = []
    last_end = 0

    for i, word in enumerate(words):
        # Add any text before this word
        result.append(text[last_end:word['start']])

        if i == current_idx:
            # Highlight current word
            result.append(f"{Style.BG_CYAN}{Style.BOLD}{word['text']}{Style.RESET}")
        elif i < current_idx:
            # Already spoken - dim
            result.append(f"{Style.DIM}{word['text']}{Style.RESET}")
        else:
            # Not yet spoken
            result.append(word['text'])

        last_end = word['end']

    # Add any remaining text
    result.append(text[last_end:])

    rendered = ''.join(result)

    # Add phoneme display if requested
    if show_phonemes and current_idx < len(words):
        current_word = words[current_idx]['text']
        phonemes = spelin_to_phonemes(current_word)
        rendered += f"\n\n{Style.YELLOW}Phonemes: {Style.CYAN}{phonemes}{Style.RESET}"

    return rendered


def visual_speak(text: str, speed: int = 150, pitch: int = 50, show_phonemes: bool = True):
    """Speak text with visual word highlighting in terminal."""
    words = parse_words(text)
    if not words:
        return

    term_width, term_height = get_terminal_size()

    # Calculate total duration for progress bar
    total_duration = sum(estimate_word_duration(w['text'], speed) for w in words)

    # Build full phoneme string for espeak
    phonemes = spelin_to_phonemes(text)
    phoneme_input = f'[[{phonemes}]]'

    # Start espeak in background
    cmd = ['espeak', '-v', 'en', '-s', str(speed), '-p', str(pitch), phoneme_input]
    audio_process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Hide cursor and clear screen
    print(Style.HIDE_CURSOR + Style.CLEAR_SCREEN + Style.HOME, end='', flush=True)

    try:
        # Header
        header = f"{Style.BOLD}·spelin Visual Reader{Style.RESET}"
        print(f"\n  {header}\n")
        print(f"  {Style.DIM}{'─' * (term_width - 4)}{Style.RESET}\n")

        start_time = time.time()
        current_word_idx = 0
        word_start_time = start_time

        while current_word_idx < len(words) and audio_process.poll() is None:
            current_time = time.time()

            # Check if we should move to next word
            word_duration = estimate_word_duration(words[current_word_idx]['text'], speed)
            if current_time - word_start_time >= word_duration:
                current_word_idx += 1
                word_start_time = current_time
                if current_word_idx >= len(words):
                    break

            # Render current state
            rendered = render_text_with_highlight(text, words, current_word_idx,
                                                   term_width, show_phonemes)

            # Progress bar
            elapsed = current_time - start_time
            progress = min(elapsed / total_duration, 1.0) if total_duration > 0 else 1.0
            bar_width = term_width - 10
            filled = int(bar_width * progress)
            bar = f"{Style.GREEN}{'█' * filled}{Style.DIM}{'░' * (bar_width - filled)}{Style.RESET}"

            # Clear and redraw
            print(Style.HOME, end='')
            print(f"\n  {Style.BOLD}·spelin Visual Reader{Style.RESET}\n")
            print(f"  {Style.DIM}{'─' * (term_width - 4)}{Style.RESET}\n")

            # Word wrap the rendered text
            lines = []
            current_line = "  "
            for segment in rendered.split('\n'):
                # Simple word wrap (accounting for ANSI codes is tricky, so approximate)
                clean_segment = re.sub(r'\033\[[0-9;]*m', '', segment)
                if len(clean_segment) + 4 < term_width:
                    lines.append(f"  {segment}")
                else:
                    lines.append(f"  {segment}")  # Let terminal wrap

            for line in lines:
                print(line)

            print(f"\n  {Style.DIM}{'─' * (term_width - 4)}{Style.RESET}")
            print(f"\n  {bar}  {int(progress * 100):3d}%")
            print(f"\n  {Style.DIM}Press Ctrl+C to stop{Style.RESET}")

            time.sleep(0.05)  # 50ms refresh rate

        # Wait for audio to finish
        audio_process.wait()

        # Final render with all words dimmed
        print(Style.HOME, end='')
        print(f"\n  {Style.BOLD}·spelin Visual Reader{Style.RESET}\n")
        print(f"  {Style.DIM}{'─' * (term_width - 4)}{Style.RESET}\n")

        final_text = f"  {Style.DIM}{text}{Style.RESET}"
        print(final_text)

        print(f"\n  {Style.DIM}{'─' * (term_width - 4)}{Style.RESET}")
        print(f"\n  {Style.GREEN}{'█' * (term_width - 10)}{Style.RESET}  100%")
        print(f"\n  {Style.GREEN}✓ Complete{Style.RESET}\n")

    except KeyboardInterrupt:
        audio_process.terminate()
        print(f"\n\n  {Style.YELLOW}Stopped{Style.RESET}\n")

    finally:
        # Show cursor again
        print(Style.SHOW_CURSOR, end='', flush=True)


def visual_speak_file(filepath: str, speed: int = 150, pitch: int = 50, show_phonemes: bool = True):
    """Read and visually speak a file with word highlighting."""
    with open(filepath, 'r') as f:
        text = f.read()

    # Process markdown if it's a .md file
    if filepath.endswith('.md'):
        lines = []
        for line in text.split('\n'):
            # Skip headers but keep text
            if line.startswith('#'):
                header_text = line.lstrip('#').strip()
                if header_text:
                    lines.append(header_text)
                continue
            # Skip horizontal rules
            if line.startswith('---'):
                continue
            # Skip empty lines
            if not line.strip():
                continue
            # Remove verse numbers
            line = line.lstrip('0123456789.¹²³⁴⁵⁶⁷⁸⁹⁰ ')
            lines.append(line)
        text = ' '.join(lines)

    visual_speak(text, speed, pitch, show_phonemes)


def demo():
    """Demo the spelin speaker."""
    examples = [
        ("8u", "the"),
        ("hElO", "hello"),
        ("w7ld", "world"),
        ("8u kwik br1n foks", "the quick brown fox"),
        ("I luv spelin", "I love spelin"),
        ("in 8u biginiq w6z 8u w7d", "in the beginning was the word"),
    ]

    print("·spelin Text-to-Speech Demo")
    print("=" * 40)
    print()

    for spelin, english in examples:
        phonemes = spelin_to_phonemes(spelin)
        print(f"  Spelin:   {spelin}")
        print(f"  English:  ({english})")
        print(f"  Phonemes: {phonemes}")
        print("  Speaking...")
        speak(spelin, speed=130)
        print()


def main():
    parser = argparse.ArgumentParser(
        description='·spelin text-to-speech reader',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "8u kwik br1n foks"          Speak text
  %(prog)s -f books/spelin/01.md        Speak a file
  %(prog)s -w output.wav "hElO w7ld"    Write to WAV file
  %(prog)s --demo                       Run demo
  %(prog)s --phonemes "8u w7ld"         Show phonemes only
  %(prog)s -V "8u kwik br1n foks"       Visual mode with highlighting
  %(prog)s -V -f file.txt               Visual mode from file
        """
    )

    parser.add_argument('text', nargs='*', help='Spelin text to speak')
    parser.add_argument('-f', '--file', help='Read from file')
    parser.add_argument('-w', '--wav', help='Output to WAV file')
    parser.add_argument('-s', '--speed', type=int, default=150, help='Speed (default: 150)')
    parser.add_argument('-p', '--pitch', type=int, default=50, help='Pitch (default: 50)')
    parser.add_argument('--demo', action='store_true', help='Run demo')
    parser.add_argument('--phonemes', action='store_true', help='Show phonemes only, don\'t speak')
    parser.add_argument('-V', '--visual', action='store_true', help='Visual mode with word highlighting')
    parser.add_argument('--no-phoneme-display', action='store_true', help='Hide phoneme display in visual mode')

    args = parser.parse_args()

    if args.demo:
        demo()
        return

    show_phonemes = not args.no_phoneme_display

    if args.file:
        if args.phonemes:
            with open(args.file) as f:
                text = f.read()
            print(spelin_to_phonemes(text))
        elif args.visual:
            visual_speak_file(args.file, args.speed, args.pitch, show_phonemes)
        else:
            speak_file(args.file, args.speed, args.pitch, args.wav)
        return

    if args.text:
        text = ' '.join(args.text)
        if args.phonemes:
            print(spelin_to_phonemes(text))
        elif args.visual:
            visual_speak(text, args.speed, args.pitch, show_phonemes)
        else:
            speak(text, args.speed, args.pitch, args.wav)
        return

    # No args - run demo
    demo()


if __name__ == '__main__':
    main()
