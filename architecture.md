## Project structure
Below is a basic overview of the project structure:

```
├── examples    -> short, feature-specific sample apps
│   ├── app.js  -> finished app.js code
│   ├── button.js
│   ├── command.js
│   ├── modal.js
│   ├── selectMenu.js
├── images      -> holds images used by games
├── .env.sample -> sample .env file
├── app.js      -> main entrypoint for app
├── commands.js -> slash command payloads + helpers
├── game.js     -> logic specific to RPS
├── utils.js    -> utility functions and enums
├── wordle.js   -> logic specifically to wordle
├── package.json
├── README.md
└── .gitignore
```
## Functions of NGrok
...
Ngrok is a tool that creates a secure tunnel from a public URL to our local web server.

What does this mean?
This means that ngrok serves as a middle-man, it allows us to share the code for our Discord Application without the need of complex network configurations.

...

## System Diagram
...
[User] ---> [Discord Server] ---> [Discord API] ---> [Ngrok Tunnel] ---> [Local Host: 3000] ---> [Bot Logic] ---> [Response Back To Discord]
