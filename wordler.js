import { readFile } from 'fs/promises';
import fs from 'fs';

// curl --location --request POST "https://api.imgbb.com/1/upload?expiration=600&key=cad93104ca28e3a641679cf17212d2e5" --form "image=@/home/richipeu/Group-6-Bot/data/board.png"

const wordle_file = './data/wordledata.json';
const MAX_ATTEMPTS = 6;
const WORD_LEN = 5;

export async function load_board(userId) {
    const guesses = get_list_of_guesses(userId);
    const answer = get_answer(userId);

    const rows = [];
    for (let r = 0; r < MAX_ATTEMPTS; r++) {
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

function create_JSON_object(userId, guesses = []) {
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
export function write_JSON_object(userId) {

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
        user = create_JSON_object(userId);
        users.push(user);
    }

    const word_of_day = get_word_of_day();
    const todays_date = get_date();

    if (!(user.last_day_answer_generated == todays_date)) {
        user.answer = word_of_day;
        user.last_day_answer_generated = todays_date;
    }

    // Write Updated Wordle Data back into file.
    fs.writeFileSync(wordle_file, JSON.stringify(users, null, 2));
}


export async function get_words() {
    try {
        const data = await readFile('./data/words.txt', 'utf8');
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
    if (!fs.existsSync(wordle_file)) {
        // If not, create an empty wordle file.
        fs.writeFileSync(wordle_file, JSON.stringify([], null, 2), 'utf8');
    }

    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);

    // Check if user exists
    let user = users.find(user => user.userID === userId);
    const guess_amount = get_list_of_guesses(userId).length;
    if (guess == user.answer || !(guess_amount < MAX_ATTEMPTS)) {
        user.last_day_played = get_date();
    }
    if (!word_in_list(guess) || !(typeof guess === 'string' && /^[A-Za-z]+$/.test(guess)) || !guess.length === WORD_LEN || !(guess_amount < MAX_ATTEMPTS)) {
        let error_response = "";
        if (!word_in_list(guess)) {
            error_response += "\nWord Not in List!";
        }
        if (!(typeof guess === 'string' && /^[A-Za-z]+$/.test(guess))) {
            error_response += "\nGuess Contains Invalid Characters!";
        }
        if (!(guess.length == WORD_LEN)) {
            error_response += "\nGuess Incorrect Length!";
        }
        if (!(guess_amount < MAX_ATTEMPTS)) {
            error_response += "\nYou've exceeded the amount of guesses you can make!";
            user.losses += 1;
            user.guesses.push(guess);
            fs.writeFileSync(wordle_file, JSON.stringify(users, null, 2));
        }
        return [false, error_response];
    }
    if (guess == user.answer) {
        user.wins += 1;
    }
    user.guesses.push(guess);
    fs.writeFileSync(wordle_file, JSON.stringify(users, null, 2));
    return [true, null];
}

function word_in_list(guess) {
    return words.includes(guess);
}

export function get_answer(userId) {
    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);
    let user = users.find(user => user.userID === userId);
    return user.answer;
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

export function game_won(userId) {
    return get_list_of_guesses(userId).includes(get_answer(userId));
}

export function already_played(userId) {
    // Ensure the leaderboard file exists
    if (!fs.existsSync(wordle_file)) {
        // If not, create an empty wordle file.
        fs.writeFileSync(wordle_file, JSON.stringify([], null, 2), 'utf8');
    }

    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);

    // Check if user exists
    let user = users.find(user => user.userID === userId);


    if (user.last_day_played == get_date()) {
        return true;
    }
    return false;
}

export function clear_guesses(userId) {
    if (!fs.existsSync(wordle_file)) {
        // If not, create an empty wordle file.
        fs.writeFileSync(wordle_file, JSON.stringify([], null, 2), 'utf8');
    }

    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);

    // Check if user exists
    let user = users.find(user => user.userID === userId);
    const empty_arr = [];
    user.guesses = empty_arr;
    fs.writeFileSync(wordle_file, JSON.stringify(users, null, 2));
}