#!/usr/bin/env python3
"""
Export spelin book texts to JSON for the web reader.
Splits long texts into pages for pagination.
"""

import json
import os
import re

BOOKS_DIR = os.path.join(os.path.dirname(__file__), '..', 'books', 'spelin')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'web', 'data', 'texts.json')

# Max characters per page (roughly)
CHARS_PER_PAGE = 1500

def parse_markdown(content):
    """Extract title and clean text from markdown."""
    lines = content.strip().split('\n')

    # Extract title from first heading
    title = None
    for line in lines:
        if line.startswith('# '):
            title = line[2:].strip()
            break
        elif line.startswith('## '):
            title = line[3:].strip()
            break

    # Remove markdown headings but keep structure
    text = content
    # Remove # headers but keep the text
    text = re.sub(r'^#{1,3}\s+', '', text, flags=re.MULTILINE)

    return title, text.strip()

def split_into_pages(text, chars_per_page=CHARS_PER_PAGE):
    """Split text into pages, trying to break at paragraph boundaries."""
    paragraphs = text.split('\n\n')
    pages = []
    current_page = []
    current_length = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        # If this paragraph would make page too long, start new page
        if current_length + len(para) > chars_per_page and current_page:
            pages.append('\n\n'.join(current_page))
            current_page = []
            current_length = 0

        current_page.append(para)
        current_length += len(para) + 2  # +2 for \n\n

    # Don't forget last page
    if current_page:
        pages.append('\n\n'.join(current_page))

    return pages

def get_difficulty(filename):
    """Estimate difficulty based on file."""
    if '00_' in filename or '01_' in filename:
        return 'easy'
    elif '07_' in filename or '08_' in filename or '09_' in filename:
        return 'hard'
    return 'medium'

def get_category(filename):
    """Categorize based on filename."""
    if 'introduction' in filename:
        return 'philosophy'
    elif 'emergence' in filename or 'time' in filename:
        return 'philosophy'
    elif 'self' in filename or 'death' in filename:
        return 'philosophy'
    elif 'good_and_evil' in filename or 'love' in filename:
        return 'wisdom'
    elif 'wisdom' in filename:
        return 'wisdom'
    elif 'modern' in filename or 'spelin' in filename:
        return 'philosophy'
    return 'philosophy'

def main():
    books = []

    # Read all markdown files
    files = sorted(os.listdir(BOOKS_DIR))

    for filename in files:
        if not filename.endswith('.md'):
            continue

        filepath = os.path.join(BOOKS_DIR, filename)
        with open(filepath, 'r') as f:
            content = f.read()

        title, text = parse_markdown(content)
        pages = split_into_pages(text)

        # Create readable title from filename if not found
        if not title:
            title = filename.replace('.md', '').replace('_', ' ').title()
            # Remove leading number
            title = re.sub(r'^\d+\s*', '', title)

        book_id = filename.replace('.md', '').lower()

        books.append({
            'id': book_id,
            'title': title,
            'category': get_category(filename),
            'difficulty': get_difficulty(filename),
            'pages': pages,
            'totalPages': len(pages)
        })

        print(f"Processed {filename}: {title} ({len(pages)} pages)")

    # Write output
    output = {
        'books': books
    }

    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nExported {len(books)} books to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
