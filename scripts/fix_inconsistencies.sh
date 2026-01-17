#!/bin/bash
# Fix known inconsistencies in spelin books

BOOKS_DIR="/home/david/hamnerin/books"

echo "Fixing inconsistencies..."

# Fix ·god -> ·g6d (the vowel in "god" is the "father" sound = 6)
echo "Fixing ·god -> ·g6d..."
for f in "$BOOKS_DIR"/*.md; do
    sed -i 's/·god\b/·g6d/g' "$f"
    sed -i 's/·God\b/·G6d/g' "$f"
done
echo "  Done."

# Fix standalone "lord" -> "l9rd" (but not inside words)
echo "Fixing lord -> l9rd..."
for f in "$BOOKS_DIR"/*.md; do
    sed -i 's/\blord\b/l9rd/g' "$f"
    sed -i 's/\bLord\b/L9rd/g' "$f"
done
echo "  Done."

# Fix pepul -> pEp4l
echo "Fixing pepul -> pEp4l..."
for f in "$BOOKS_DIR"/*.md; do
    sed -i 's/\bpepul\b/pEp4l/g' "$f"
done
echo "  Done."

# Fix p7p4l -> pEp4l (wrong vowel)
echo "Fixing p7p4l -> pEp4l..."
for f in "$BOOKS_DIR"/*.md; do
    sed -i 's/\bp7p4l\b/pEp4l/g' "$f"
done
echo "  Done."

# Fix "hEld held" duplicate in akts.md
echo "Fixing duplicate 'hEld held'..."
sed -i 's/hEld held/hEld/g' "$BOOKS_DIR/akts.md"
echo "  Done."

# Fix "6nd" -> "and" or "4nd" (6nd is wrong - 'and' has short 'a', not 'ah')
echo "Fixing 6nd -> and..."
for f in "$BOOKS_DIR"/*.md; do
    sed -i 's/\b6nd\b/and/g' "$f"
done
echo "  Done."

# Fix standalone "god" without namer dot (should be ·g6d when referring to deity)
# Be careful - some uses might be common noun
echo "Checking for 'god' without namer dot..."
grep -n '\bgod\b' "$BOOKS_DIR"/*.md | grep -v '·g6d' | head -20

echo ""
echo "All fixes applied!"
