# Report on the analysis of our bot's weaknesses and limitations. 
### Running ESLint on our repository
- app.js - unreachable code and undefined variable.
- commands.js - no errors.
- rps.js - no errors.
- utils.js - no errors.
- wordle.js - variable assigned but never used.
#### What does this mean?
- JavaScript sometimes still tries to run scripts even if there are errors. This means that we could have issues with functions we haven't tested.
- If there are errors we don't know about, then we will be releasing code we believe to be working perfectly.
- We can prevent this issue by analyzing our code and fixing it while developing so these issues don't arise during the testing phase.
