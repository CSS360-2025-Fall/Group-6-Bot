import { readFile } from 'fs/promises';
import fs from 'fs';


const wordle_file = './data/wordledata.json';
const MAX_ATTEMPTS = 6;
const WORD_LEN = 5;

function create_JSON_object(userId, guesses, todays_date) {
    return {
        userID: userId,
        guesses: guesses,
        last_day_guessed: todays_date,
        wins: 0,
        losses: 0,
    };
}

// Exported function to write JSON 
export function write_JSON_object(userId, guesses, todays_date) {

    // Ensure the leaderboard file exists
    if (!fs.existsSync(wordle_file)){
        // If not, create an empty wordle file.
        fs.writeFileSync(wordle_file, JSON.stringify([], null, 2), 'utf8');
    }
    
    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);

    // Check if user exists
    let user = users.find(user => user.userID === userId);

    // If not found, create a new entry.
    if(!user) {
        user = create_JSON_object(userId, guesses, todays_date);
        users.push(user);
    } else {
        user.last_day_guessed = todays_date;
    }

    // Write Updated Leaderboard back into file.
    fs.writeFileSync(wordle_file, JSON.stringify(users, null, 2));
}

export function does_user_exist(userId) {
    const users = JSON.parse(fs.readFileSync('./data/wordledata.json', 'utf8'));
    return users.some(user => user.userID === userId);
}

export async function get_words() {
    try {
        const data = await readFile('./words.txt', 'utf8');
        const words = data.split('\n').map(word => word.trim()).filter(Boolean);
        return words;
    } catch (err) {
        console.error('Error reading file: ', err)
        return [];
    }
}

const words = await get_words();

export function get_word_of_day() {
    const r = Math.floor(Math.random() * words.length);
    return words[r];
}

export function get_date() {
    const today = new Date();
    let day = today.getDate();
    let month = today.getMonth() + 1; // Months are zero-based (0 = January)
    let year = today.getFullYear();

    // Add leading zeros if needed
    if (day < 10) day = '0' + day;
    if (month < 10) month = '0' + month;

    // Format as MM/DD/YYYY
    const formattedDate = `${month}/${day}/${year}`;

    return formattedDate;
}

const the_word = get_word_of_day();

function validGuess(guess) {
    return typeof guess === 'string' && guess.length === WORD_LEN && /^[A-Za-z]+$/.test(guess);
}

function in_list(guess) {
    for (var w = 0; w < words.length; w++) {
        if (guess === w) {
            return true
        }
    }
}

export function check_guess(guess, userID) {
    if (!(get_number_of_guesses(userID) < MAX_ATTEMPTS)) {
        return { content: `You've already completed today's game!` }
    }
    if (!validGuess(guess)) {
        return { content: `Guesses must be a valid ${WORD_LEN}-letter word (A–Z).` };
    }
    if (!in_list(guess)) {
        return { content: `Guess must be a valid word!` };
    }
}


function get_number_of_guesses(userID) {
    const users = JSON.parse(fs.readFileSync('./data/wordledata.json', 'utf8'));
    const user = users.find(u => u.userID === userID);
    return user ? user.guesses.length : 0;
}