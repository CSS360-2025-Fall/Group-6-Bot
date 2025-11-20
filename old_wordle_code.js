// wordle.js — interaction-friendly (ES6). Uses emoji board instead of image attachments.
import fs from 'fs';

// ---------- CONFIG ----------
const DATA_FILE = 'data.csv';
const MAX_TRIES = 6;
const WORD_LEN = 5;

// You can replace this with your own list; kept short for demo. Keep UPPERCASE.
const answers = [
  'APPLE', 'BRAIN', 'CRANE', 'PLANT', 'SMILE', 'GREEN', 'STEEL', 'MONEY', 'WATER', 'TRAIN',
  'LIGHT', 'SOUND', 'TRUST', 'STONE', 'NURSE', 'HOUSE', 'VIDEO', 'VOICE', 'WATCH', 'WORLD',
];

// ---------- UTIL: CSV I/O ----------
function ensureHeader(rows) {
  if (rows.length === 0) {
    rows[0] = [
      'user',          // 0
      'wordOfTheDay',  // 1
      'canGuess',      // 2 (unused; legacy)
      'lastGuessDate', // 3 (MM/DD/YYYY)
      'guesses',       // 4 space-delimited uppercase guesses
      'wins',          // 5 integer
      'games',         // 6 integer
      'hasCompletedToday', // 7 "true"/"false"
    ];
  }
  return rows;
}

function readCSV() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const rows = raw.split(/\r?\n/).filter(Boolean).map(line => line.split(','));
    return ensureHeader(rows);
  } catch {
    return ensureHeader([]);
  }
}

function writeCSV(rows) {
  const csv = rows.map(r => r.join(',')).join('\n');
  fs.writeFileSync(DATA_FILE, csv, 'utf8');
}

// ---------- DATE / GAME HELPERS ----------
function todayStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function getAnswer() {
  const j = Math.floor(Math.random() * answers.length);
  return answers[j].toUpperCase();
}

function validGuess(guess) {
  return typeof guess === 'string' && guess.length === WORD_LEN && /^[A-Za-z]+$/.test(guess);
}

function splitGuesses(s) {
  if (!s) return [];
  return s.trim().split(/\s+/).filter(Boolean);
}

// Build a Wordle-like emoji board from guesses vs answer
function buildBoard(guesses, answer) {
  const rows = [];
  for (let r = 0; r < MAX_TRIES; r++) {
    const guess = guesses[r] || ''.padEnd(WORD_LEN, ' ');
    let line = '';
    for (let i = 0; i < WORD_LEN; i++) {
      const g = guess[i] || ' ';
      if (g === ' ') { line += '⬛'; continue; }
      if (g === answer[i]) line += '🟩';
      else if (answer.includes(g)) line += '🟨';
      else line += '⬛';
    }
    // show letters under the row for entered guesses
    const letters = (guesses[r] || '').padEnd(WORD_LEN, ' ').split('').map(c => (c === ' ' ? '·' : c)).join('');
    rows.push(`${line}  \`${letters}\``);
  }
  return rows.join('\n');
}

// Compare two uppercase strings for exact match
function isExact(guess, answer) {
  if (!guess || !answer) return false;
  if (guess.length !== answer.length) return false;
  for (let i = 0; i < guess.length; i++) {
    if (guess.charCodeAt(i) !== answer.charCodeAt(i)) return false;
  }
  return true;
}

// ---------- CORE LOOKUP / MUTATION ----------
function findOrCreateUserRow(rows, userId) {
  // header at index 0
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === userId) return { idx: i, row: rows[i] };
  }
  const fresh = [userId, '', 'false', '', '', '0', '0', 'false'];
  rows.push(fresh);
  return { idx: rows.length - 1, row: fresh };
}

// ---------- PUBLIC API (for app.js) ----------
export async function startWordle(userId) {
  const rows = readCSV();
  const { idx, row } = findOrCreateUserRow(rows, userId);

  // If played today and completed, block restart
  const today = todayStr();
  const hasCompleted = String(row[7]) === 'true';
  if (row[3] === today && hasCompleted) {
    return { content: `You already completed today's game, <@${userId}>. Come back tomorrow!` };
  }

  // Start/Reset today's game
  row[1] = getAnswer();     // wordOfTheDay
  row[3] = today;           // lastGuessDate
  row[4] = '';              // guesses (space separated)
  row[7] = 'false';         // hasCompletedToday
  // Increment games only when a game actually starts (aligns with your old logic)
  row[6] = String(Number(row[6] || '0') + 1);

  rows[idx] = row;
  writeCSV(rows);

  const board = buildBoard([], row[1]);
  return {
    content:
      `**Wordle** — ${today}
<@${userId}>, game started! Use \`/dwordle guess <word>\`.
\`\`\`
- ${WORD_LEN} letters
- ${MAX_TRIES} tries
\`\`\`
${board}`
  };
}

export async function guessWordle(userId, guessRaw) {
  const guess = (guessRaw || '').trim().toUpperCase();
  const rows = readCSV();
  const { idx, row } = findOrCreateUserRow(rows, userId);

  // No active game today?
  const today = todayStr();
  if (row[3] !== today || !row[1]) {
    return { content: `No active game for today, <@${userId}>. Start one with \`/dwordle start\`.` };
  }

  if (String(row[7]) === 'true') {
    return { content: `You've already completed today's game, <@${userId}>. Come back tomorrow!` };
  }

  if (!validGuess(guess)) {
    return { content: `Guesses must be a valid ${WORD_LEN}-letter word (A–Z).` };
  }

  const answer = row[1];
  const guesses = splitGuesses(row[4]);

  if (guesses.length >= MAX_TRIES) {
    row[7] = 'true'; // mark complete
    writeCSV(rows);
    const board = buildBoard(guesses, answer);
    return { content: `Game over — out of tries!\n${board}\nAnswer: **${answer}**` };
  }

  // Add guess
  guesses.push(guess);
  row[4] = guesses.join(' ');

  if (isExact(guess, answer)) {
    row[7] = 'true';
    row[5] = String(Number(row[5] || '0') + 1); // wins++
    writeCSV(rows);
    const board = buildBoard(guesses, answer);
    return { content: `🎉 **Congratulations!** You guessed **${answer}** in **${guesses.length}** tries.\n${board}` };
  }

  // If that was the last attempt, mark game over
  if (guesses.length >= MAX_TRIES) {
    row[7] = 'true';
    writeCSV(rows);
    const board = buildBoard(guesses, answer);
    return { content: `Game over — out of tries!\n${board}\nAnswer: **${answer}**` };
  }

  // Otherwise, persist and show updated board
  writeCSV(rows);
  const board = buildBoard(guesses, answer);
  return { content: `${board}\nGuess **${guesses.length}/${MAX_TRIES}**. Use \`/dwordle guess <word>\`.` };
}

export async function getStats(userId) {
  const rows = readCSV();
  const { row } = findOrCreateUserRow(rows, userId);
  const wins = Number(row[5] || '0');
  const games = Number(row[6] || '0');
  const winPct = games > 0 ? Math.round((wins / games) * 100) : 0;
  return { content: `**Stats for <@${userId}>**\nPlayed: ${games}\nWins: ${wins}\nWin %: ${winPct}` };
}
