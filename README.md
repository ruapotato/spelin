# ·spelin

A reading-optimized phonemic alphabet for English using Latin letters and numbers.

> **Note:** In spelin, uppercase letters have phonetic meaning, so we can't use them for proper nouns. Instead, we use a **namer dot** (·) before names: ·spelin, ·j6n, ·lund4n

## The Problem

English spelling is a mess. We use the wrong alphabet — the Roman alphabet was designed for Latin, not English. That's why:

- We need digraphs: **sh**, **ch**, **th**, **ng**
- We have silent letters: k**n**ow, **w**rite, thum**b**
- One letter makes multiple sounds: **c**at vs **c**ity
- Multiple letters make one sound: **f**ish, **ph**one, enou**gh**

## The Solution

**·spelin** — 42 symbols (letters + numbers) where each symbol represents exactly one sound.

- Uses familiar Latin letters
- Repurposes redundant letters (c, q, x)
- Uses uppercase/lowercase cleverly
- Adds numbers for remaining sounds
- Optimized for reading, not just writing

---

## Consonants (24)

| Sound | Symbol | Example | Traditional |
|-------|--------|---------|-------------|
| /p/ | p | pE | pea |
| /b/ | b | bE | bee |
| /t/ | t | tE | tea |
| /d/ | d | dW | do |
| /k/ | k | kik | kick |
| /g/ | g | gO | go |
| /f/ | f | fE | fee |
| /v/ | v | v1 | vow |
| /s/ | s | sE | see |
| /z/ | z | zW | zoo |
| /h/ | h | hE | he |
| /m/ | m | mE | me |
| /n/ | n | nO | no |
| /l/ | l | lol | loll |
| /r/ | r | rOr | roar |
| /w/ | w | wE | we |
| /j/ | y | yes | yes |
| /dʒ/ | j | juj | judge |
| /tʃ/ | c | cip | chip |
| /ʃ/ | x | xip | ship |
| /ʒ/ | X | meX4r | measure |
| /ŋ/ | q | siq | sing |
| /θ/ | 3 | 3rE | three |
| /ð/ | 8 | 8A | they |

### Key changes from traditional:
- **c** = /tʃ/ (ch sound) — "chip" → "cip"
- **x** = /ʃ/ (sh sound) — "ship" → "xip"
- **X** = /ʒ/ (zh sound) — "measure" → "meX4r"
- **q** = /ŋ/ (ng sound) — "sing" → "siq"
- **3** = /θ/ (th in "three") — mnemonic: "3" for "three"!
- **8** = /ð/ (th in "they") — voiced version

---

## Vowels (18)

### Core vowels (uppercase = letter name, lowercase = short)

| Sound | Symbol | Example | Traditional | Logic |
|-------|--------|---------|-------------|-------|
| /eɪ/ | A | dA | day | A says "ay" |
| /æ/ | a | kat | cat | short a |
| /iː/ | E | sE | see | E says "ee" |
| /ɛ/ | e | bed | bed | short e |
| /aɪ/ | I | mI | my | I says "eye" |
| /ɪ/ | i | bit | bit | short i |
| /oʊ/ | O | gO | go | O says "oh" |
| /ɒ/ | o | hot | hot | short o |
| /juː/ | U | Us | use | U says "you" |
| /ʌ/ | u | but | but | short u |

### Extended vowels (numbers)

| Sound | Symbol | Example | Traditional | Logic |
|-------|--------|---------|-------------|-------|
| /uː/ | W | bWt | boot | "double-u" has "oo" |
| /ʊ/ | 0 | b0k | book | round mouth shape |
| /ə/ | 4 | 4b1t | about | looks like "a" |
| /ɜː/ | 7 | b7d | bird | — |
| /ɔː/ | 9 | l9 | law | — |
| /ɑː/ | 6 | f68r | father | — |
| /aʊ/ | 1 | 1t | out | — |
| /ɔɪ/ | 2 | 2l | oil | — |

---

## Rules

1. **One symbol = one sound** — no silent letters
2. **No double letters** — unless both are pronounced (e.g., "unnamed" → "unnAmd")
3. **Uppercase vowels** = long/letter-name sound
4. **Lowercase vowels** = short sound
5. **X vs x** = voiced (/ʒ/) vs unvoiced (/ʃ/)
6. **Proper nouns** use a namer dot (·) or dash (-) prefix instead of capitalization

---

## Proper Nouns

Since uppercase letters have phonetic meaning in ·spelin, we can't capitalize names. Instead, use a **namer dot** (·) or **dash** (-) before proper nouns:

| Traditional | ·spelin |
|-------------|---------|
| John | ·j6n |
| London | ·lund4n |
| England | ·iqgl4nd |
| Shavian | ·xAvE4n |
| spelin | ·spelin |

The namer dot (·) is preferred, but a dash (-) works on systems without easy Unicode access:
- ·j6n or -j6n

---

## Examples

### Words

| Traditional | ·spelin |
|-------------|---------|
| thought | 39t |
| through | 3rW |
| though | 8O |
| the | 8u |
| ship | xip |
| chip | cip |
| measure | meX4r |
| sing | siq |
| think | 3iqk |
| judge | juj |
| book | b0k |
| boot | bWt |
| bird | b7d |
| father | f68r |
| about | 4b1t |
| oil | 2l |
| out | 1t |

### Sentences

| Traditional | ·spelin |
|-------------|---------|
| The quick brown fox jumps over the lazy dog. | 8u kwik br1n foks jumps Ov4r 8u lAzE dog. |
| She thinks about three things. | xE 3iqks 4b1t 3rE 3iqz. |
| I saw my father at the shop. | I s9 mI f68r at 8u xop. |
| The boy found the oil. | 8u b2 f1nd 8u 2l. |

---

## Comparison with ·xAvE4n (Shavian)

| Feature | ·xAvE4n | ·spelin |
|---------|---------|---------|
| Total symbols | 48 | 42 |
| Script type | New glyphs | Latin + numbers |
| Learning curve | High (new shapes) | Lower (familiar letters) |
| Typing | Needs Unicode keyboard | Standard keyboard |
| R-colored vowels | Dedicated symbols | Vowel + r |
| Optimized for | Writing (single strokes) | Reading (visual distinction) |

---

## Quick Reference

```
CONSONANTS
p b t d k g f v s z h m n l r w y j
c = ch    x = sh    X = zh    q = ng
3 = th (three)      8 = th (they)

VOWELS
A = ay    a = cat     E = ee    e = bed
I = eye   i = bit     O = oh    o = hot
U = you   u = but     W = oo (boot)

0 = book  4 = about   7 = bird
9 = law   6 = father  1 = out   2 = oil
```

---

## Why "·spelin"?

It's "spelling" written in ·spelin:
- sp + e + l + i + n
- (We dropped the redundant second "l" and use "n" for the casual pronunciation)

---

## Inspiration

·spelin was inspired by the [·xAvE4n alphabet](https://shavian.info), created after ·j9rj ·b7n4rd ·x9's death to make English spelling more logical. While ·xAvE4n invented entirely new letter shapes, ·spelin reuses familiar Latin letters and numbers for easier adoption.

---

## License

[CC0 1.0 Universal](LICENSE) — Public domain. No rights reserved. Use it however you like!
