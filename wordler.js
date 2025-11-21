import { readFile } from 'fs/promises';
import fs from 'fs';
import { log } from 'console';


const wordle_file = './data/wordledata.json';
const MAX_ATTEMPTS = 6;
const WORD_LEN = 5;

function create_JSON_object(userId, guesses) {
    return {
        userID: userId,
        guesses: guesses,
        last_day_played: null,
        answer: null,
        last_day_answer_generated: null,
        wins: 0,
        losses: 0,
    };
}

// Exported function to write JSON 
export function write_JSON_object(userId, guesses, todays_date) {

    // Ensure the leaderboard file exists
    if (!fs.existsSync(wordle_file)) {
        // If not, create an empty wordle file.
        fs.writeFileSync(wordle_file, JSON.stringify([], null, 2), 'utf8');
    }

    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);

    // Check if user exists
    let user = users.find(user => user.userID === userId);

    // If not found, create a new entry.
    if (!user) {
        user = create_JSON_object(userId, guesses);
        users.push(user);
    }

    user.guesses.push(guesses[0]);

    const word_of_day = get_word_of_day();

    if (!(user.last_day_answer_generated == todays_date)) {
        user.answer = word_of_day;
        user.last_day_answer_generated = todays_date;
    }

    // Write Updated Wordle Data back into file.
    fs.writeFileSync(wordle_file, JSON.stringify(users, null, 2));
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


export function validate_guess(guess, userId) {
    const guess_amount = get_number_of_guesses(userId);

    let response = "";
    if (!word_in_list(guess)) {
        response += "Word not in list!";
    }
    if (typeof guess === 'string' && guess.length === WORD_LEN && /^[A-Za-z]+$/.test(guess)) {
        response += "\nImproper format!";
    }
    if (!(guess_amount < MAX_ATTEMPTS)) {
        response += "\nYou've already completed today's game!";
    }

    return response;
}

function word_in_list(guess) {
    for (var w = 0; w < words.length; w++) {
        if (guess === w) {
            return true
        }
    }
}

export function get_answer(userId) {
    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);
    let user = users.find(user => user.userID === userId);
    return user.answer;
}



function get_number_of_guesses(userId) {
    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);
    let user = users.find(user => user.userID === userId);
    return user.guesses.length;
}

export function get_list_of_guesses(userId) {
    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);
    let user = users.find(user => user.userID === userId);
    if (!user) {
        console.error(`User ${userId} not found`);
        return []; // return empty array instead of crashing
    }
    return user.guesses;
}

export function does_user_exist(userId) {
    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);
    let user = users.find(user => user.userID === userId);
    return user;
}