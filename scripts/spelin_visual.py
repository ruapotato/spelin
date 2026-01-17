#!/usr/bin/env python3
"""
·spelin Visual Reader - Pygame Edition

A visual text-to-speech reader that highlights letters as they're spoken.

Usage:
    spelin_visual.py "8u kwik br1n foks"
    spelin_visual.py -f file.txt
    spelin_visual.py --demo
"""

import pygame
import subprocess
import tempfile
import argparse
import os
import sys
import re

# Initialize pygame
pygame.init()
pygame.mixer.init(frequency=22050, size=-16, channels=1)

# ============================================================================
# SPELIN PHONEME MAPPING (same as spelin_speak.py)
# ============================================================================

SPELIN_TO_ESPEAK = {
    # Consonants
    'p': 'p', 'b': 'b', 't': 't', 'd': 'd', 'k': 'k', 'g': 'g',
    'f': 'f', 'v': 'v', 's': 's', 'z': 'z', 'h': 'h',
    'm': 'm', 'n': 'n', 'l': 'l', 'r': 'r', 'w': 'w',
    'y': 'j', 'j': 'dZ', 'c': 'tS', 'x': 'S', 'X': 'Z',
    'q': 'N', '3': 'T', '8': 'D',
    # Vowels
    'A': 'eI', 'a': 'a', 'E': 'i:', 'e': 'E', 'I': 'aI', 'i': 'I',
    'O': 'oU', 'o': '0', 'U': 'ju:', 'u': 'V',
    # Extended vowels
    'W': 'u:', '0': 'U', '4': '@', '7': '3:', '9': 'O:', '6': 'A:',
    '1': 'aU', '2': 'OI',
}

SPECIAL_PATTERNS = {
    '8u': 'D@',
    '4v': '@v',
}


# ============================================================================
# COLORS
# ============================================================================

class Colors:
    BG = (25, 25, 35)
    TEXT = (220, 220, 230)
    TEXT_DIM = (100, 100, 120)
    HIGHLIGHT = (0, 200, 255)
    HIGHLIGHT_BG = (0, 80, 120)
    PHONEME = (255, 200, 100)
    PROGRESS_BG = (50, 50, 60)
    PROGRESS_FG = (0, 180, 120)
    TITLE = (180, 180, 200)
    BORDER = (60, 60, 80)

# ============================================================================
# TEXT PARSING
# ============================================================================

def parse_into_words(text: str) -> list:
    """
    Parse spelin text into words with positions.
    Returns: [{'word': 'kwik', 'start': 3, 'end': 7, 'phonemes': 'kwIk'}, ...]
    """
    result = []
    i = 0

    while i < len(text):
        # Skip whitespace
        while i < len(text) and text[i] in ' \t\n':
            i += 1

        if i >= len(text):
            break

        # Collect word characters
        start = i
        while i < len(text) and text[i] not in ' \t\n':
            i += 1

        word = text[start:i]
        if word:
            # Get phonemes for this word
            phonemes = spelin_to_phonemes(word)
            result.append({
                'word': word,
                'start': start,
                'end': i,
                'phonemes': phonemes,
            })

    return result


def spelin_to_phonemes(text: str) -> str:
    """Convert spelin text to espeak phoneme string."""
    result = []
    text = text.replace('·', '')
    i = 0

    while i < len(text):
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
        elif char in ' \t\n':
            result.append(' ')
        elif char in '.,!?;:':
            result.append(' ')

        i += 1

    return ''.join(result)


# ============================================================================
# AUDIO
# ============================================================================

def generate_word_audio(phonemes: str, speed: int = 150, pitch: int = 50) -> str:
    """Generate WAV file for a word's phonemes, return path."""
    if not phonemes:
        return None

    phoneme_input = f'[[{phonemes}]]'

    fd, path = tempfile.mkstemp(suffix='.wav')
    os.close(fd)

    cmd = [
        'espeak', '-v', 'en',
        '-s', str(speed),
        '-p', str(pitch),
        '-w', path,
        phoneme_input
    ]

    subprocess.run(cmd, capture_output=True)
    return path


def get_audio_duration(path: str) -> float:
    """Get duration of WAV file in seconds."""
    try:
        sound = pygame.mixer.Sound(path)
        return sound.get_length()
    except:
        return 0.5  # Fallback


def trim_silence(path: str, threshold: int = 100) -> None:
    """Trim leading/trailing silence from WAV file in place."""
    import wave
    import struct

    try:
        with wave.open(path, 'rb') as w:
            params = w.getparams()
            frames = w.readframes(params.nframes)

        samples = list(struct.unpack(f'<{len(frames)//2}h', frames))
        sample_rate = params.framerate

        # Find first non-silent sample
        start = 0
        for i, s in enumerate(samples):
            if abs(s) > threshold:
                # Tiny buffer before (1ms)
                start = max(0, i - int(sample_rate * 0.001))
                break

        # Find last non-silent sample
        end = len(samples)
        for i in range(len(samples) - 1, -1, -1):
            if abs(samples[i]) > threshold:
                # Tiny buffer after (5ms) - just enough to not clip
                end = min(len(samples), i + int(sample_rate * 0.005))
                break

        trimmed = samples[start:end]
        if len(trimmed) > 100:
            with wave.open(path, 'wb') as w:
                w.setparams(params)
                w.writeframes(struct.pack(f'<{len(trimmed)}h', *trimmed))
    except:
        pass


# ============================================================================
# VISUAL READER
# ============================================================================

class SpelinVisualReader:
    def __init__(self, width=900, height=600):
        self.width = width
        self.height = height
        self.screen = pygame.display.set_mode((width, height), pygame.RESIZABLE)
        pygame.display.set_caption('·spelin Visual Reader')

        # Fonts
        self.load_fonts()

        # State
        self.text = ""
        self.words = []  # List of word dicts from parse_into_words
        self.current_word_idx = 0
        self.playing = False
        self.paused = False
        self.speed = 150

        # Word audio
        self.audio_clips = []  # List of (path, pygame.Sound, duration) per word
        self.current_sound = None
        self.current_duration = 0
        self.sound_channel = None
        self.word_start_time = 0
        self.word_overlap = 0.05  # Start next word 50ms before current ends

        # Scroll
        self.scroll_y = 0
        self.target_scroll_y = 0

        # Layout
        self.margin = 40
        self.line_height = 60
        self.text_start_y = 120

        # Status
        self.status_msg = ""

    def load_fonts(self):
        """Load fonts, with fallbacks."""
        font_names = [
            'DejaVu Sans Mono',
            'Liberation Mono',
            'Courier New',
            'monospace',
            None  # Default
        ]

        self.font_large = None
        self.font_medium = None
        self.font_small = None

        for name in font_names:
            try:
                if name:
                    self.font_large = pygame.font.SysFont(name, 36)
                    self.font_medium = pygame.font.SysFont(name, 28)
                    self.font_small = pygame.font.SysFont(name, 20)
                else:
                    self.font_large = pygame.font.Font(None, 42)
                    self.font_medium = pygame.font.Font(None, 32)
                    self.font_small = pygame.font.Font(None, 24)
                break
            except:
                continue

    def set_text(self, text: str):
        """Set the text to read."""
        self.text = text
        self.words = parse_into_words(text)
        self.current_word_idx = 0
        self.scroll_y = 0
        self.target_scroll_y = 0

        # Clean up old audio clips
        self.cleanup_audio()

        # Generate audio for each word
        self.status_msg = "Generating audio..."
        self.draw()
        pygame.display.flip()

        self.audio_clips = []
        seen_words = {}  # Cache: phonemes -> (path, Sound)

        for i, word in enumerate(self.words):
            phonemes = word['phonemes']

            # Check cache first (same phoneme sequence = same sound)
            if phonemes in seen_words:
                self.audio_clips.append(seen_words[phonemes])
                continue

            # Generate audio for this word
            path = generate_word_audio(phonemes, self.speed)
            if path and os.path.exists(path):
                trim_silence(path)
                try:
                    sound = pygame.mixer.Sound(path)
                    duration = sound.get_length()
                    entry = (path, sound, duration)
                    seen_words[phonemes] = entry
                    self.audio_clips.append(entry)
                except:
                    self.audio_clips.append(None)
            else:
                self.audio_clips.append(None)

            # Update progress
            self.status_msg = f"Generating audio... {i+1}/{len(self.words)}"
            self.draw()
            pygame.display.flip()
            pygame.event.pump()

        self.status_msg = ""

    def cleanup_audio(self):
        """Clean up temporary audio files."""
        seen_paths = set()
        for clip in self.audio_clips:
            if clip and clip[0] not in seen_paths:
                seen_paths.add(clip[0])
                try:
                    os.unlink(clip[0])
                except:
                    pass
        self.audio_clips = []

    def play(self):
        """Start playback."""
        if not self.words:
            return

        if self.paused:
            # Resume
            self.paused = False
            if self.sound_channel:
                self.sound_channel.unpause()
        else:
            # Fresh start
            self.current_word_idx = 0
            self.playing = True
            self.paused = False
            self.play_current_word()

    def play_current_word(self):
        """Play the sound for the current word."""
        if self.current_word_idx >= len(self.audio_clips):
            self.playing = False
            return

        clip = self.audio_clips[self.current_word_idx]
        if clip:
            path, sound, duration = clip
            self.current_sound = sound
            self.current_duration = duration
            self.sound_channel = sound.play()
            self.word_start_time = pygame.time.get_ticks() / 1000.0
        else:
            self.current_sound = None
            self.current_duration = 0
            self.sound_channel = None
            self.word_start_time = pygame.time.get_ticks() / 1000.0

    def pause(self):
        """Pause playback."""
        if self.playing and not self.paused:
            self.paused = True
            if self.sound_channel:
                self.sound_channel.pause()

    def stop(self):
        """Stop playback."""
        self.playing = False
        self.paused = False
        self.current_word_idx = 0
        if self.sound_channel:
            self.sound_channel.stop()
        self.current_sound = None
        self.current_duration = 0
        self.sound_channel = None
        self.word_start_time = 0

    def update(self):
        """Update state based on sound playback."""
        if not self.playing or self.paused:
            return

        now = pygame.time.get_ticks() / 1000.0
        elapsed = now - self.word_start_time

        # Calculate when to advance (overlap with next word)
        advance_time = max(0.05, self.current_duration - self.word_overlap)

        # Check if time to move to next word
        should_advance = False
        if self.current_sound is None:
            should_advance = True
        elif elapsed >= advance_time:
            should_advance = True

        if should_advance:
            self.current_word_idx += 1

            if self.current_word_idx >= len(self.words):
                # Finished all - wait for last sound to complete
                if self.sound_channel and not self.sound_channel.get_busy():
                    self.playing = False
                    self.current_word_idx = max(0, len(self.words) - 1)
                else:
                    self.current_word_idx = len(self.words) - 1
            else:
                # Play next word (overlapping with current)
                self.play_current_word()

        # Auto-scroll
        self.update_scroll()

    def update_scroll(self):
        """Update scroll position to keep current word visible."""
        if not self.words:
            return

        # Calculate current word position
        word_y = self.get_word_y(self.current_word_idx)

        visible_top = self.scroll_y + self.text_start_y + 50
        visible_bottom = self.scroll_y + self.height - 150

        if word_y < visible_top:
            self.target_scroll_y = word_y - self.text_start_y - 100
        elif word_y > visible_bottom:
            self.target_scroll_y = word_y - self.height + 200

        self.target_scroll_y = max(0, self.target_scroll_y)

        # Smooth scroll
        diff = self.target_scroll_y - self.scroll_y
        self.scroll_y += diff * 0.2

    def get_word_y(self, word_idx: int) -> int:
        """Get Y position of word at index."""
        if word_idx >= len(self.words):
            word_idx = len(self.words) - 1

        x = self.margin
        y = self.text_start_y
        space_width = self.font_large.size(' ')[0]

        for i, word in enumerate(self.words[:word_idx + 1]):
            word_width = self.font_large.size(word['word'])[0]

            # Check if word fits on current line
            if x + word_width > self.width - self.margin and x > self.margin:
                x = self.margin
                y += self.line_height

            if i == word_idx:
                return y

            x += word_width + space_width

        return y

    def draw(self):
        """Draw the visual reader."""
        self.screen.fill(Colors.BG)

        # Title
        title = self.font_medium.render('·spelin Visual Reader', True, Colors.TITLE)
        self.screen.blit(title, (self.margin, 20))

        # Divider
        pygame.draw.line(self.screen, Colors.BORDER,
                        (self.margin, 70), (self.width - self.margin, 70), 2)

        # Text area (clipped)
        text_rect = pygame.Rect(0, 80, self.width, self.height - 180)

        # Draw text with highlighting
        self.draw_text(text_rect)

        # Bottom panel
        self.draw_bottom_panel()

    def draw_text(self, clip_rect):
        """Draw the main text with word highlighting."""
        if not self.words:
            return

        x = self.margin
        y = self.text_start_y - int(self.scroll_y)
        space_width = self.font_large.size(' ')[0]

        for i, word in enumerate(self.words):
            word_text = word['word']
            word_surface = self.font_large.render(word_text, True, Colors.TEXT)
            word_width = word_surface.get_width()
            word_height = word_surface.get_height()

            # Word wrap
            if x + word_width > self.width - self.margin and x > self.margin:
                x = self.margin
                y += self.line_height

            # Only draw if visible
            if clip_rect.top - 50 < y < clip_rect.bottom + 50:
                # Determine style based on playback state
                if i == self.current_word_idx and self.playing:
                    # Current word - highlight with background
                    padding = 6
                    bg_rect = pygame.Rect(x - padding, y - padding,
                                         word_width + padding * 2, word_height + padding * 2)
                    pygame.draw.rect(self.screen, Colors.HIGHLIGHT_BG, bg_rect, border_radius=6)
                    pygame.draw.rect(self.screen, Colors.HIGHLIGHT, bg_rect, 3, border_radius=6)
                    word_surface = self.font_large.render(word_text, True, Colors.HIGHLIGHT)
                elif i < self.current_word_idx:
                    # Already spoken - dim
                    word_surface = self.font_large.render(word_text, True, Colors.TEXT_DIM)

                self.screen.blit(word_surface, (x, y))

            x += word_width + space_width

    def draw_bottom_panel(self):
        """Draw the bottom control panel."""
        panel_y = self.height - 100

        # Background
        pygame.draw.rect(self.screen, Colors.BORDER,
                        (0, panel_y - 10, self.width, 110))

        # Progress bar
        bar_x = self.margin
        bar_y = panel_y
        bar_width = self.width - 2 * self.margin
        bar_height = 12

        pygame.draw.rect(self.screen, Colors.PROGRESS_BG,
                        (bar_x, bar_y, bar_width, bar_height), border_radius=6)

        # Progress based on word position
        if len(self.words) > 0:
            progress = (self.current_word_idx + 1) / len(self.words)
            fill_width = int(bar_width * progress)

            if fill_width > 0:
                pygame.draw.rect(self.screen, Colors.PROGRESS_FG,
                                (bar_x, bar_y, fill_width, bar_height), border_radius=6)

        # Current word phonemes display
        if not self.status_msg and self.words and 0 <= self.current_word_idx < len(self.words):
            word = self.words[self.current_word_idx]
            phoneme_text = f"/{word['phonemes']}/"
            phoneme_surface = self.font_medium.render(phoneme_text, True, Colors.PHONEME)
            self.screen.blit(phoneme_surface, (self.margin, panel_y + 25))

        # Status message (for loading)
        if self.status_msg:
            status_surface = self.font_small.render(self.status_msg, True, Colors.PHONEME)
            self.screen.blit(status_surface, (self.margin, panel_y + 25))

        # Controls hint
        if self.playing:
            if self.paused:
                hint = "[SPACE] Resume  [S] Stop  [R] Restart"
            else:
                hint = "[SPACE] Pause  [S] Stop  [R] Restart"
        else:
            hint = "[SPACE] Play  [R] Restart  [Q] Quit"

        hint_surface = self.font_small.render(hint, True, Colors.TEXT_DIM)
        self.screen.blit(hint_surface, (self.margin, panel_y + 60))

        # Speed indicator
        speed_text = f"Speed: {self.speed}"
        speed_surface = self.font_small.render(speed_text, True, Colors.TEXT_DIM)
        self.screen.blit(speed_surface, (self.width - self.margin - speed_surface.get_width(), panel_y + 60))

    def handle_event(self, event):
        """Handle pygame events."""
        if event.type == pygame.QUIT:
            return False

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                if self.playing:
                    if self.paused:
                        self.play()  # Resume
                    else:
                        self.pause()
                else:
                    self.play()

            elif event.key == pygame.K_s:
                self.stop()

            elif event.key == pygame.K_q or event.key == pygame.K_ESCAPE:
                return False

            elif event.key == pygame.K_UP:
                self.speed = min(300, self.speed + 20)
                # Don't regenerate during playback - too slow
                # Speed will apply on next play

            elif event.key == pygame.K_DOWN:
                self.speed = max(50, self.speed - 20)
                # Don't regenerate during playback - too slow
                # Speed will apply on next play

            elif event.key == pygame.K_r:
                # Restart
                self.stop()
                self.play()

        if event.type == pygame.VIDEORESIZE:
            self.width = event.w
            self.height = event.h
            self.screen = pygame.display.set_mode((self.width, self.height), pygame.RESIZABLE)

        return True

    def run(self):
        """Main loop."""
        clock = pygame.time.Clock()
        running = True

        while running:
            for event in pygame.event.get():
                if not self.handle_event(event):
                    running = False

            self.update()
            self.draw()
            pygame.display.flip()
            clock.tick(60)

        # Cleanup
        self.cleanup_audio()
        pygame.quit()


# ============================================================================
# FILE LOADING
# ============================================================================

def load_file(filepath: str) -> str:
    """Load and process a file for reading."""
    with open(filepath, 'r') as f:
        text = f.read()

    # Process markdown if .md file
    if filepath.endswith('.md'):
        lines = []
        for line in text.split('\n'):
            if line.startswith('#'):
                header = line.lstrip('#').strip()
                if header:
                    lines.append(header)
                continue
            if line.startswith('---'):
                continue
            if not line.strip():
                lines.append('')
                continue
            line = line.lstrip('0123456789.¹²³⁴⁵⁶⁷⁸⁹⁰ ')
            lines.append(line)
        text = '\n'.join(lines)

    return text


# ============================================================================
# DEMO
# ============================================================================

DEMO_TEXT = """in 8u biginiq w6z 8u w7d,
and 8u w7d w6z wi3 god,
and 8u w7d w6z god.

8u sAm w6z in 8u biginiq wi3 god.
9l 3iqz w7 mAd 3rW him,
and wi81t him w6z not enE3iq mAd
8at w6z mAd.

in him w6z lIf,
and 8u lIf w6z 8u lIt 4v men."""


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='·spelin Visual Reader - Pygame Edition',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Controls:
  SPACE     Play/Pause
  S         Stop
  R         Restart
  UP/DOWN   Adjust speed
  Q/ESC     Quit

Examples:
  %(prog)s "8u kwik br1n foks"
  %(prog)s -f books/spelin/01.md
  %(prog)s --demo
        """
    )

    parser.add_argument('text', nargs='*', help='Spelin text to read')
    parser.add_argument('-f', '--file', help='Read from file')
    parser.add_argument('--demo', action='store_true', help='Run demo')
    parser.add_argument('-s', '--speed', type=int, default=150, help='Speed (default: 150)')

    args = parser.parse_args()

    # Determine text
    if args.demo:
        text = DEMO_TEXT
    elif args.file:
        text = load_file(args.file)
    elif args.text:
        text = ' '.join(args.text)
    else:
        text = DEMO_TEXT

    # Create and run reader
    reader = SpelinVisualReader()
    reader.speed = args.speed
    reader.set_text(text)
    reader.run()


if __name__ == '__main__':
    main()
