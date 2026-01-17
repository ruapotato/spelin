/* ============================================================================
   SPELIN GAMES MODULE
   Contains all game logic for Sound Match, Spell It, Read It, and Flash Cards
   ============================================================================ */

// =============================================================================
// GAME DATA
// =============================================================================

// Word lists by difficulty - only words where english != spelin
const WORD_LISTS = {
    easy: [
        { english: 'cat', spelin: 'kat' },
        { english: 'dog', spelin: 'd6g' },
        { english: 'cup', spelin: 'kup' },
        { english: 'box', spelin: 'b6ks' },
        { english: 'hot', spelin: 'h6t' },
        { english: 'top', spelin: 't6p' },
        { english: 'come', spelin: 'kum' },
        { english: 'love', spelin: 'luv' },
        { english: 'some', spelin: 'sum' },
        { english: 'done', spelin: 'dun' },
        { english: 'give', spelin: 'giv' },
        { english: 'have', spelin: 'hav' },
        { english: 'live', spelin: 'liv' },
        { english: 'sock', spelin: 's6k' },
        { english: 'rock', spelin: 'r6k' },
        { english: 'lock', spelin: 'l6k' },
        { english: 'knock', spelin: 'n6k' },
        { english: 'what', spelin: 'w6t' },
        { english: 'was', spelin: 'w6z' },
        { english: 'fox', spelin: 'f6ks' }
    ],
    medium: [
        { english: 'the', spelin: '8u' },
        { english: 'ship', spelin: 'xip' },
        { english: 'think', spelin: '3iqk' },
        { english: 'this', spelin: '8is' },
        { english: 'shop', spelin: 'x6p' },
        { english: 'ring', spelin: 'riq' },
        { english: 'much', spelin: 'muc' },
        { english: 'judge', spelin: 'juj' },
        { english: 'day', spelin: 'dA' },
        { english: 'see', spelin: 'sE' },
        { english: 'my', spelin: 'mI' },
        { english: 'go', spelin: 'gO' },
        { english: 'use', spelin: 'yWz' },
        { english: 'boot', spelin: 'bWt' },
        { english: 'book', spelin: 'b0k' },
        { english: 'bird', spelin: 'b7d' },
        { english: 'law', spelin: 'l9' },
        { english: 'out', spelin: '1t' },
        { english: 'oil', spelin: '2l' },
        { english: 'about', spelin: '4b1t' }
    ],
    hard: [
        { english: 'through', spelin: '3rW' },
        { english: 'thought', spelin: '39t' },
        { english: 'measure', spelin: 'meX7' },
        { english: 'vision', spelin: 'viX4n' },
        { english: 'question', spelin: 'kwesc4n' },
        { english: 'church', spelin: 'c7c' },
        { english: 'father', spelin: 'f68r' },
        { english: 'mother', spelin: 'mu87' },
        { english: 'weather', spelin: 'we87' },
        { english: 'together', spelin: 't4ge87' },
        { english: 'beautiful', spelin: 'byWtif4l' },
        { english: 'knowledge', spelin: 'n6lij' },
        { english: 'philosophy', spelin: 'f4l6s4fE' },
        { english: 'beginning', spelin: 'biginiq' },
        { english: 'understand', spelin: 'und7stand' },
        { english: 'everything', spelin: 'evrE3iq' },
        { english: 'important', spelin: 'imp9rt4nt' },
        { english: 'different', spelin: 'dif7ent' },
        { english: 'something', spelin: 'sum3iq' },
        { english: 'yesterday', spelin: 'yest7dA' }
    ]
};

// All phonemes for Sound Match game
const ALL_PHONEMES = Object.keys(window.PHONEME_FILES || {});

// =============================================================================
// GAME STATE
// =============================================================================

class GameState {
    constructor() {
        this.currentGame = null;
        this.score = 0;
        this.round = 0;
        this.totalRounds = 10;
        this.timeLeft = 0;
        this.timer = null;
        this.difficulty = 'easy';
        this.correct = 0;
        this.incorrect = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.reader = null;
    }

    reset() {
        this.score = 0;
        this.round = 0;
        this.correct = 0;
        this.incorrect = 0;
        this.streak = 0;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async initAudio() {
        if (!this.reader) {
            this.reader = new SpelinReader('audio/');
            await this.reader.init();
        }
        return this.reader;
    }
}

const gameState = new GameState();

// =============================================================================
// SOUND MATCH GAME
// =============================================================================

class SoundMatchGame {
    constructor(container, state) {
        this.container = container;
        this.state = state;
        this.currentPhoneme = null;
        this.options = [];
        this.optionCount = 4;
    }

    async start() {
        this.state.reset();
        this.state.currentGame = 'soundMatch';
        this.state.totalRounds = 10;
        await this.state.initAudio();
        this.nextRound();
    }

    nextRound() {
        this.state.round++;

        if (this.state.round > this.state.totalRounds) {
            this.showResults();
            return;
        }

        // Pick random phoneme
        this.currentPhoneme = ALL_PHONEMES[Math.floor(Math.random() * ALL_PHONEMES.length)];

        // Create options (1 correct, 3 wrong)
        this.options = [this.currentPhoneme];
        while (this.options.length < this.optionCount) {
            const random = ALL_PHONEMES[Math.floor(Math.random() * ALL_PHONEMES.length)];
            if (!this.options.includes(random)) {
                this.options.push(random);
            }
        }

        // Shuffle options
        this.options.sort(() => Math.random() - 0.5);

        this.render();
    }

    render() {
        const phonemeData = window.PHONEME_DATA?.[this.currentPhoneme] || {};

        this.container.innerHTML = `
            <div class="game-header">
                <a href="games.html" class="game-back">&larr; Back to Games</a>
                <h2 class="game-title">Sound Match</h2>
            </div>

            <div class="game-info">
                <div class="game-score">Score: <span>${this.state.score}</span></div>
                <div class="game-round">Round: <span>${this.state.round}/${this.state.totalRounds}</span></div>
                <div class="game-streak">Streak: <span>${this.state.streak}</span></div>
            </div>

            <div class="game-area">
                <div class="sound-match-prompt">
                    <h3>Listen and click the matching symbol</h3>
                    <button class="play-sound-btn" id="playSoundBtn" title="Click to hear the sound">
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </button>
                </div>

                <div class="sound-match-options">
                    ${this.options.map((opt, i) => `
                        <button class="sound-match-option" data-phoneme="${opt}">
                            ${opt}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('playSoundBtn').addEventListener('click', () => {
            this.playCurrentSound();
        });

        this.container.querySelectorAll('.sound-match-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleAnswer(e.target.dataset.phoneme, e.target);
            });
        });

        // Auto-play sound on new round
        setTimeout(() => this.playCurrentSound(), 300);
    }

    playCurrentSound() {
        const btn = document.getElementById('playSoundBtn');
        btn.classList.add('playing');
        this.state.reader.playSinglePhoneme(this.currentPhoneme);
        setTimeout(() => btn.classList.remove('playing'), 300);
    }

    handleAnswer(answer, element) {
        const isCorrect = answer === this.currentPhoneme;

        // Visual feedback
        element.classList.add(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            this.state.correct++;
            this.state.streak++;
            this.state.bestStreak = Math.max(this.state.bestStreak, this.state.streak);
            this.state.score += 10 + (this.state.streak * 2);
        } else {
            this.state.incorrect++;
            this.state.streak = 0;

            // Show correct answer
            this.container.querySelectorAll('.sound-match-option').forEach(btn => {
                if (btn.dataset.phoneme === this.currentPhoneme) {
                    btn.classList.add('correct');
                }
            });
        }

        // Disable all buttons
        this.container.querySelectorAll('.sound-match-option').forEach(btn => {
            btn.disabled = true;
        });

        // Next round after delay
        setTimeout(() => this.nextRound(), 1000);
    }

    showResults() {
        const accuracy = Math.round((this.state.correct / this.state.totalRounds) * 100);
        const message = accuracy >= 90 ? 'Excellent!' :
                       accuracy >= 70 ? 'Great job!' :
                       accuracy >= 50 ? 'Keep practicing!' : 'Don\'t give up!';

        this.container.innerHTML = `
            <div class="game-header">
                <a href="games.html" class="game-back">&larr; Back to Games</a>
                <h2 class="game-title">Sound Match</h2>
            </div>

            <div class="game-area">
                <div class="game-results">
                    <div class="game-results-icon">${accuracy >= 70 ? '🎉' : '💪'}</div>
                    <h3 class="game-results-title">${message}</h3>
                    <div class="game-results-score">${this.state.score} points</div>

                    <div class="game-results-stats">
                        <div class="game-results-stat">
                            <div class="game-results-stat-value">${this.state.correct}</div>
                            <div class="game-results-stat-label">Correct</div>
                        </div>
                        <div class="game-results-stat">
                            <div class="game-results-stat-value">${this.state.incorrect}</div>
                            <div class="game-results-stat-label">Incorrect</div>
                        </div>
                        <div class="game-results-stat">
                            <div class="game-results-stat-value">${accuracy}%</div>
                            <div class="game-results-stat-label">Accuracy</div>
                        </div>
                        <div class="game-results-stat">
                            <div class="game-results-stat-value">${this.state.bestStreak}</div>
                            <div class="game-results-stat-label">Best Streak</div>
                        </div>
                    </div>

                    <div class="game-results-actions">
                        <button class="btn btn--primary" id="playAgainBtn">Play Again</button>
                        <a href="games.html" class="btn btn--secondary">Other Games</a>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.start();
        });

        // Save high score
        saveHighScore('soundMatch', this.state.score);
    }
}

// =============================================================================
// SPELL IT GAME
// =============================================================================

class SpellItGame {
    constructor(container, state) {
        this.container = container;
        this.state = state;
        this.currentWord = null;
    }

    async start() {
        this.state.reset();
        this.state.currentGame = 'spellIt';
        this.state.totalRounds = 10;
        await this.state.initAudio();
        this.nextRound();
    }

    nextRound() {
        this.state.round++;

        if (this.state.round > this.state.totalRounds) {
            this.showResults();
            return;
        }

        // Filter out words where English and spelin are identical (no learning value)
        const wordList = WORD_LISTS[this.state.difficulty].filter(w => w.english !== w.spelin);
        this.currentWord = wordList[Math.floor(Math.random() * wordList.length)];

        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="game-header">
                <a href="games.html" class="game-back">&larr; Back to Games</a>
                <h2 class="game-title">Spell It</h2>
            </div>

            <div class="game-info">
                <div class="game-score">Score: <span>${this.state.score}</span></div>
                <div class="game-round">Round: <span>${this.state.round}/${this.state.totalRounds}</span></div>
            </div>

            <div class="difficulty-selector">
                <button class="difficulty-btn difficulty-btn--easy ${this.state.difficulty === 'easy' ? 'active' : ''}" data-difficulty="easy">Easy</button>
                <button class="difficulty-btn difficulty-btn--medium ${this.state.difficulty === 'medium' ? 'active' : ''}" data-difficulty="medium">Medium</button>
                <button class="difficulty-btn difficulty-btn--hard ${this.state.difficulty === 'hard' ? 'active' : ''}" data-difficulty="hard">Hard</button>
            </div>

            <div class="game-area">
                <div class="spell-it-word">
                    <h3>Spell this word in ·spelin:</h3>
                    <div class="spell-it-english">${this.currentWord.english}</div>
                    <button class="play-sound-btn" id="playSoundBtn" title="Click to hear the word">
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </button>
                </div>

                <div class="spell-it-input-container">
                    <input type="text" class="spell-it-input" id="spellingInput"
                           placeholder="Type the spelin spelling..."
                           autocomplete="off" autocapitalize="off" spellcheck="false">
                    <div class="spell-it-feedback" id="feedback"></div>
                </div>

                <div class="game-controls">
                    <button class="btn btn--primary" id="checkBtn">Check Answer</button>
                    <button class="btn btn--ghost" id="skipBtn">Skip</button>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('playSoundBtn').addEventListener('click', () => {
            this.playCurrentWord();
        });

        document.getElementById('checkBtn').addEventListener('click', () => {
            this.checkAnswer();
        });

        document.getElementById('skipBtn').addEventListener('click', () => {
            this.skipWord();
        });

        document.getElementById('spellingInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });

        // Difficulty buttons
        this.container.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.state.difficulty = e.target.dataset.difficulty;
                this.state.reset();
                this.state.currentGame = 'spellIt';
                this.nextRound();
            });
        });

        // Auto-play word
        setTimeout(() => {
            this.playCurrentWord();
            document.getElementById('spellingInput').focus();
        }, 300);
    }

    playCurrentWord() {
        const btn = document.getElementById('playSoundBtn');
        btn.classList.add('playing');

        // Use browser TTS to speak the English word naturally
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel(); // Stop any ongoing speech
            const utterance = new SpeechSynthesisUtterance(this.currentWord.english);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            utterance.onend = () => btn.classList.remove('playing');
            speechSynthesis.speak(utterance);
        } else {
            // Fallback to phoneme playback if TTS not available
            this.state.reader.setText(this.currentWord.spelin);
            this.state.reader.play();
            setTimeout(() => btn.classList.remove('playing'), 500);
        }
    }

    checkAnswer() {
        const input = document.getElementById('spellingInput');
        const feedback = document.getElementById('feedback');
        const answer = input.value.trim().toLowerCase();

        if (!answer) return;

        const isCorrect = answer === this.currentWord.spelin.toLowerCase();

        input.classList.remove('correct', 'incorrect');
        feedback.classList.remove('correct', 'incorrect');

        if (isCorrect) {
            input.classList.add('correct');
            feedback.classList.add('correct');
            feedback.innerHTML = 'Correct!';
            this.state.correct++;
            this.state.score += this.state.difficulty === 'hard' ? 30 :
                              this.state.difficulty === 'medium' ? 20 : 10;
        } else {
            input.classList.add('incorrect');
            feedback.classList.add('incorrect');
            feedback.innerHTML = `Incorrect! <div class="spell-it-answer">The answer was: <span>${this.currentWord.spelin}</span></div>`;
            this.state.incorrect++;
        }

        // Next round after delay
        setTimeout(() => this.nextRound(), 1500);
    }

    skipWord() {
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `Skipped. The answer was: <span style="color: var(--accent); font-family: var(--font-mono);">${this.currentWord.spelin}</span>`;
        this.state.incorrect++;
        setTimeout(() => this.nextRound(), 1500);
    }

    showResults() {
        const accuracy = Math.round((this.state.correct / this.state.totalRounds) * 100);

        this.container.innerHTML = `
            <div class="game-header">
                <a href="games.html" class="game-back">&larr; Back to Games</a>
                <h2 class="game-title">Spell It</h2>
            </div>

            <div class="game-area">
                <div class="game-results">
                    <div class="game-results-icon">${accuracy >= 70 ? '🎉' : '💪'}</div>
                    <h3 class="game-results-title">${accuracy >= 70 ? 'Well done!' : 'Keep practicing!'}</h3>
                    <div class="game-results-score">${this.state.score} points</div>

                    <div class="game-results-stats">
                        <div class="game-results-stat">
                            <div class="game-results-stat-value">${this.state.correct}</div>
                            <div class="game-results-stat-label">Correct</div>
                        </div>
                        <div class="game-results-stat">
                            <div class="game-results-stat-value">${accuracy}%</div>
                            <div class="game-results-stat-label">Accuracy</div>
                        </div>
                    </div>

                    <div class="game-results-actions">
                        <button class="btn btn--primary" id="playAgainBtn">Play Again</button>
                        <a href="games.html" class="btn btn--secondary">Other Games</a>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.start();
        });

        saveHighScore('spellIt', this.state.score);
    }
}

// =============================================================================
// READ IT GAME
// =============================================================================

class ReadItGame {
    constructor(container, state) {
        this.container = container;
        this.state = state;
        this.currentWord = null;
    }

    async start() {
        this.state.reset();
        this.state.currentGame = 'readIt';
        this.state.totalRounds = 10;
        await this.state.initAudio();
        this.nextRound();
    }

    nextRound() {
        this.state.round++;

        if (this.state.round > this.state.totalRounds) {
            this.showResults();
            return;
        }

        // Filter out words where English and spelin are identical (no learning value)
        const wordList = WORD_LISTS[this.state.difficulty].filter(w => w.english !== w.spelin);
        this.currentWord = wordList[Math.floor(Math.random() * wordList.length)];

        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="game-header">
                <a href="games.html" class="game-back">&larr; Back to Games</a>
                <h2 class="game-title">Read It</h2>
            </div>

            <div class="game-info">
                <div class="game-score">Score: <span>${this.state.score}</span></div>
                <div class="game-round">Round: <span>${this.state.round}/${this.state.totalRounds}</span></div>
            </div>

            <div class="difficulty-selector">
                <button class="difficulty-btn difficulty-btn--easy ${this.state.difficulty === 'easy' ? 'active' : ''}" data-difficulty="easy">Easy</button>
                <button class="difficulty-btn difficulty-btn--medium ${this.state.difficulty === 'medium' ? 'active' : ''}" data-difficulty="medium">Medium</button>
                <button class="difficulty-btn difficulty-btn--hard ${this.state.difficulty === 'hard' ? 'active' : ''}" data-difficulty="hard">Hard</button>
            </div>

            <div class="game-area">
                <div class="read-it-display">
                    <div class="read-it-spelin">${this.currentWord.spelin}</div>
                    <p class="read-it-hint">Read the spelin word above, type the English word</p>
                </div>

                <div class="spell-it-input-container">
                    <input type="text" class="spell-it-input" id="readingInput"
                           placeholder="Type the English word..."
                           autocomplete="off" spellcheck="false">
                    <div class="spell-it-feedback" id="feedback"></div>
                </div>

                <div class="game-controls">
                    <button class="btn btn--primary" id="checkBtn">Check Answer</button>
                    <button class="btn btn--ghost" id="hearItBtn">Hear It</button>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('checkBtn').addEventListener('click', () => {
            this.checkAnswer();
        });

        document.getElementById('hearItBtn').addEventListener('click', () => {
            this.state.reader.setText(this.currentWord.spelin);
            this.state.reader.play();
        });

        document.getElementById('readingInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });

        // Difficulty buttons
        this.container.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.state.difficulty = e.target.dataset.difficulty;
                this.state.reset();
                this.state.currentGame = 'readIt';
                this.nextRound();
            });
        });

        setTimeout(() => {
            document.getElementById('readingInput').focus();
        }, 100);
    }

    checkAnswer() {
        const input = document.getElementById('readingInput');
        const feedback = document.getElementById('feedback');
        const answer = input.value.trim().toLowerCase();

        if (!answer) return;

        const isCorrect = answer === this.currentWord.english.toLowerCase();

        input.classList.remove('correct', 'incorrect');
        feedback.classList.remove('correct', 'incorrect');

        if (isCorrect) {
            input.classList.add('correct');
            feedback.classList.add('correct');
            feedback.innerHTML = 'Correct!';
            this.state.correct++;
            this.state.score += this.state.difficulty === 'hard' ? 30 :
                              this.state.difficulty === 'medium' ? 20 : 10;
        } else {
            input.classList.add('incorrect');
            feedback.classList.add('incorrect');
            feedback.innerHTML = `Incorrect! The answer was: <span style="color: var(--accent);">${this.currentWord.english}</span>`;
            this.state.incorrect++;
        }

        setTimeout(() => this.nextRound(), 1500);
    }

    showResults() {
        const accuracy = Math.round((this.state.correct / this.state.totalRounds) * 100);

        this.container.innerHTML = `
            <div class="game-header">
                <a href="games.html" class="game-back">&larr; Back to Games</a>
                <h2 class="game-title">Read It</h2>
            </div>

            <div class="game-area">
                <div class="game-results">
                    <div class="game-results-icon">${accuracy >= 70 ? '🎉' : '💪'}</div>
                    <h3 class="game-results-title">${accuracy >= 70 ? 'Great reading!' : 'Keep practicing!'}</h3>
                    <div class="game-results-score">${this.state.score} points</div>

                    <div class="game-results-stats">
                        <div class="game-results-stat">
                            <div class="game-results-stat-value">${this.state.correct}</div>
                            <div class="game-results-stat-label">Correct</div>
                        </div>
                        <div class="game-results-stat">
                            <div class="game-results-stat-value">${accuracy}%</div>
                            <div class="game-results-stat-label">Accuracy</div>
                        </div>
                    </div>

                    <div class="game-results-actions">
                        <button class="btn btn--primary" id="playAgainBtn">Play Again</button>
                        <a href="games.html" class="btn btn--secondary">Other Games</a>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.start();
        });

        saveHighScore('readIt', this.state.score);
    }
}

// =============================================================================
// FLASH CARDS GAME
// =============================================================================

class FlashCardsGame {
    constructor(container, state) {
        this.container = container;
        this.state = state;
        this.cards = [];
        this.currentIndex = 0;
        this.isFlipped = false;
        this.mastered = [];
        this.needsReview = [];
    }

    async start() {
        this.state.reset();
        this.state.currentGame = 'flashCards';
        await this.state.initAudio();

        // Create cards from all phonemes
        this.cards = ALL_PHONEMES.map(char => ({
            char,
            data: window.PHONEME_DATA?.[char] || {}
        }));

        // Shuffle
        this.cards.sort(() => Math.random() - 0.5);
        this.currentIndex = 0;
        this.mastered = [];
        this.needsReview = [];

        this.render();
    }

    render() {
        if (this.currentIndex >= this.cards.length) {
            this.showResults();
            return;
        }

        const card = this.cards[this.currentIndex];
        const progress = Math.round((this.currentIndex / this.cards.length) * 100);

        this.container.innerHTML = `
            <div class="game-header">
                <a href="games.html" class="game-back">&larr; Back to Games</a>
                <h2 class="game-title">Flash Cards</h2>
            </div>

            <div class="game-info">
                <div class="game-round">Card: <span>${this.currentIndex + 1}/${this.cards.length}</span></div>
                <div class="game-score">Mastered: <span>${this.mastered.length}</span></div>
            </div>

            <div class="game-area">
                <div class="flashcard-container">
                    <div class="flashcard${this.isFlipped ? ' flipped' : ''}" id="flashcard">
                        <div class="flashcard-face flashcard-front">
                            <div class="flashcard-symbol">${card.char}</div>
                            <p class="flashcard-prompt">Click to reveal</p>
                        </div>
                        <div class="flashcard-face flashcard-back">
                            <div class="flashcard-sound">${card.data.sound || '?'}</div>
                            <div class="flashcard-example">"${card.data.example || '...'}"</div>
                            <div class="flashcard-ipa">${card.data.ipa || ''}</div>
                        </div>
                    </div>
                </div>

                <div class="flashcard-controls" id="cardControls" style="${this.isFlipped ? '' : 'visibility: hidden;'}">
                    <button class="flashcard-btn flashcard-btn--wrong" id="wrongBtn">
                        Review Again
                    </button>
                    <button class="flashcard-btn flashcard-btn--right" id="rightBtn">
                        Got It!
                    </button>
                </div>

                <button class="btn btn--ghost" id="hearBtn" style="margin-top: var(--space-lg);">
                    Hear Sound
                </button>

                <div class="flashcard-progress">
                    <div class="progress" style="width: 200px; margin: var(--space-md) auto;">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('flashcard').addEventListener('click', () => {
            this.flip();
        });

        document.getElementById('wrongBtn').addEventListener('click', () => {
            this.markReview();
        });

        document.getElementById('rightBtn').addEventListener('click', () => {
            this.markMastered();
        });

        document.getElementById('hearBtn').addEventListener('click', () => {
            this.playSound();
        });
    }

    flip() {
        this.isFlipped = !this.isFlipped;
        document.getElementById('flashcard').classList.toggle('flipped', this.isFlipped);
        document.getElementById('cardControls').style.visibility = this.isFlipped ? 'visible' : 'hidden';

        if (this.isFlipped) {
            this.playSound();
        }
    }

    playSound() {
        const card = this.cards[this.currentIndex];
        this.state.reader.playSinglePhoneme(card.char);
    }

    markMastered() {
        this.mastered.push(this.cards[this.currentIndex]);
        this.nextCard();
    }

    markReview() {
        this.needsReview.push(this.cards[this.currentIndex]);
        this.nextCard();
    }

    nextCard() {
        this.currentIndex++;
        this.isFlipped = false;
        this.render();
    }

    showResults() {
        const masteredPercent = Math.round((this.mastered.length / this.cards.length) * 100);

        this.container.innerHTML = `
            <div class="game-header">
                <a href="games.html" class="game-back">&larr; Back to Games</a>
                <h2 class="game-title">Flash Cards</h2>
            </div>

            <div class="game-area">
                <div class="game-results">
                    <div class="game-results-icon">📚</div>
                    <h3 class="game-results-title">Session Complete!</h3>

                    <div class="game-results-stats">
                        <div class="game-results-stat">
                            <div class="game-results-stat-value">${this.mastered.length}</div>
                            <div class="game-results-stat-label">Mastered</div>
                        </div>
                        <div class="game-results-stat">
                            <div class="game-results-stat-value">${this.needsReview.length}</div>
                            <div class="game-results-stat-label">Need Review</div>
                        </div>
                        <div class="game-results-stat">
                            <div class="game-results-stat-value">${masteredPercent}%</div>
                            <div class="game-results-stat-label">Success Rate</div>
                        </div>
                    </div>

                    ${this.needsReview.length > 0 ? `
                        <p class="game-results-message">
                            Cards to review: ${this.needsReview.map(c => c.char).join(', ')}
                        </p>
                    ` : ''}

                    <div class="game-results-actions">
                        ${this.needsReview.length > 0 ? `
                            <button class="btn btn--primary" id="reviewBtn">Review Missed</button>
                        ` : ''}
                        <button class="btn btn--${this.needsReview.length > 0 ? 'secondary' : 'primary'}" id="restartBtn">Start Over</button>
                        <a href="games.html" class="btn btn--ghost">Other Games</a>
                    </div>
                </div>
            </div>
        `;

        if (this.needsReview.length > 0) {
            document.getElementById('reviewBtn')?.addEventListener('click', () => {
                this.cards = [...this.needsReview];
                this.cards.sort(() => Math.random() - 0.5);
                this.currentIndex = 0;
                this.mastered = [];
                this.needsReview = [];
                this.render();
            });
        }

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.start();
        });
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function saveHighScore(game, score) {
    try {
        const scores = JSON.parse(localStorage.getItem('spelinHighScores') || '{}');
        if (!scores[game] || score > scores[game]) {
            scores[game] = score;
            localStorage.setItem('spelinHighScores', JSON.stringify(scores));
        }
    } catch (e) {
        console.warn('Failed to save high score:', e);
    }
}

function getHighScore(game) {
    try {
        const scores = JSON.parse(localStorage.getItem('spelinHighScores') || '{}');
        return scores[game] || 0;
    } catch (e) {
        return 0;
    }
}

function getGameStats() {
    try {
        return JSON.parse(localStorage.getItem('spelinHighScores') || '{}');
    } catch (e) {
        return {};
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

window.SoundMatchGame = SoundMatchGame;
window.SpellItGame = SpellItGame;
window.ReadItGame = ReadItGame;
window.FlashCardsGame = FlashCardsGame;
window.gameState = gameState;
window.getHighScore = getHighScore;
window.getGameStats = getGameStats;
window.WORD_LISTS = WORD_LISTS;
