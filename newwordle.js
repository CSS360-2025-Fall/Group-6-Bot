import { readFile } from 'fs/promises';

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;
let number_of_guesses = 0;
let guessed_words = [];

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

const the_word = get_word_of_day();

function validGuess(guess) {
  return typeof guess === 'string' && guess.length === WORD_LEN && /^[A-Za-z]+$/.test(guess);
}

function in_list(guess) {
    for(w = 0; w < words.length; w++){
        if (guess === w){
            return true
        }
    }
}

function guess(guess){
    if (!guessed_words.length < 6){
        return { content: `You've already completed today's game!`}
    }
    if (!validGuess(guess)) {
        return { content: `Guesses must be a valid ${WORD_LEN}-letter word (A–Z).` };
    }
    if (!in_list(guess)) {
        return { content: `Guess must be a valid word!`};
    }
    guessed_words.push("guess");
}

export function play_wordle(){
    
}