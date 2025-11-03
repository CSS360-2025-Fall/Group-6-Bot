# Report on the analysis of our bot's weaknesses and limitations. 
## Running ESLint on our repository
- app.js - unreachable code and undefined variable.
- commands.js - no errors.
- rps.js - no errors.
- utils.js - no errors.
- wordle.js - variable assigned but never used.
### What does this mean?
- JavaScript sometimes still tries to run scripts even if there are errors. This means that we could have issues with functions we haven't tested.
- If there are errors we don't know about, then we will be releasing code we believe to be working perfectly.
- We can prevent this issue by analyzing our code and fixing it while developing so these issues don't arise during the testing phase.
## Running the ___Wordle Bot___ in Our Repository
</h3>The wordle currently uses the logic used by different creators online.

It's funky, the original creator for the code, written in CommonJS, intended for the wordle to display a generated letter based off another library, then it would keep track of the Player ID, Score, number of attempts for a day, win, & loss. 

However, the fall-back with using that code as the base was that it's not neccessarily compatible with the other features in our Bot, such as a score display. 

I render the code useless, even if it does display anything, due to the simple fact that it lacks reusability and compatibility with other group members.

The goal is to add a seperate file with all the possible, 5 letter words, display a wordle that displays the attempt, and keep track of the data collected in the CSV file in a way that could be reconnected back to to our player data JSON files.

The game logic itself works, but it lacks in a lot of ways, starting with actually working.
</h3>

## Leaderboard function too accessible
There is a slash command allowing all users to edit leaderboard functions. While ok for testing a very early development bot, this is a dangerous method to employ on a bot that is active in servers because it allows all users acess to editing internal documents. This error disgards the usefulness of an official leaderboard.

A possible remedy involves removing this command and instead using a script with unit tests to ensure the leaderboard implementation is working correctly.

## User stories 
As an admin, only members with an admin role can update the leaderboard; non-admins get a permission error, and successful updates are logged.

As a developer, unreachable code and undefined variables are blocked before merge; a pre-commit lint step prevents bad commits and shows clear errors.

As a player, the leaderboard updates only from actual matches, with no public manual edit; results are recorded automatically.
