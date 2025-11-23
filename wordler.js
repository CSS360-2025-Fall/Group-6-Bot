import { readFile } from 'fs/promises';
import fs from 'fs';
import Canvas from 'canvas';

// curl --location --request POST "https://api.imgbb.com/1/upload?expiration=600&key=cad93104ca28e3a641679cf17212d2e5" --form "image=@/home/richipeu/Group-6-Bot/data/board.png"

const wordle_file = './data/wordledata.json';
const MAX_ATTEMPTS = 6;
const WORD_LEN = 5;

function get_image(guess, answer, i) {
    if (guess === undefined) { return 0; }
    else if (guess.charAt(i) == answer.charAt(i)) { return 1; }
    else if (answer.includes(guess.charAt(i))) { return 2; }
    else { return 3; }
}

export async function load_board(userId) {
    const guesses = get_list_of_guesses(userId);
    const answer = get_answer(userId);

    const canvas = Canvas.createCanvas(330, 397);
    const context = canvas.getContext('2d');

    const background = await Canvas.loadImage('./images/BlankImage.png');
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    context.font = '42px Clear Sans, Helvetica Neue, Arial, sans-serif';
    context.textAlign = 'center';
    context.fillStyle = '#d7dadc';

    const absent_square = await Canvas.loadImage('./images/ColorAbsent.png');
    const empty_square = await Canvas.loadImage('./images/EmptySquare.png');
    const green_square = await Canvas.loadImage('./images/GreenSquare.png');
    const yellow_square = await Canvas.loadImage('./images/YellowSquare.png');
    let square = absent_square;

    let square_size = 62;
    let row_offset = 0;
    let buffer = 0;

    for (let j = 0; j < MAX_ATTEMPTS; j++) {
        for (let i = 0; i < WORD_LEN; i++) {
            const image_number = get_image(guesses[j], answer, i);

            if (image_number == 0) { square = empty_square; }
            else if (image_number == 1) { square = green_square; }
            else if (image_number == 2) { square = yellow_square; }
            else if (image_number == 3) { square = absent_square; }

            context.drawImage(square, i * square_size + buffer, row_offset, square_size, square_size);
            if (guesses[j] != undefined) {
                context.fillText(guesses[j].charAt(i), (square_size / 2) + buffer + square_size * i, row_offset + 42);
            }

            buffer += 5;
        }
        buffer = 0;
        row_offset += square_size + 5;
    }
    fs.writeFileSync("./data/board.png", canvas.toBuffer());
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
    const guess_amount = get_number_of_guesses(userId);
    if (!word_in_list(guess) || !(typeof guess === 'string' && guess.length === WORD_LEN && /^[A-Za-z]+$/.test(guess)) || !(guess_amount < MAX_ATTEMPTS)) {
        return false;
    }
    console.log(user.guesses);
    user.guesses.push(guess);
    console.log(user.guesses);
    fs.writeFileSync(wordle_file, JSON.stringify(users, null, 2));
    return true;
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
    console.log(user.guesses, Array.isArray(user.guesses));
    return user.guesses;
}


export function does_user_exist(userId) {
    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);
    let user = users.find(user => user.userID === userId);
    return user;
}

function find_user(userId) {
    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    const users = JSON.parse(raw_data);
    return users.find(user => user.userID === userId);
}

function get_users() {
    const raw_data = fs.readFileSync(wordle_file, 'utf8');
    return JSON.parse(raw_data);
}