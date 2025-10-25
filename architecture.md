## Project structure
Below is a basic overview of the project structure:

```
├── examples    -> short, feature-specific sample apps
├── images      -> holds images used by games
├── .env        -> .env file for bot routing
├── app.js      -> main entrypoint for app
├── commands.js -> slash command payloads + helpers
├── rps.js      -> logic specific to RPS
├── utils.js    -> utility functions and enums
├── wordle.js   -> logic specific to wordle
├── package.json
├── README.md
└── .gitignore
```

## Functions of NGrok

Ngrok is a tool that creates a secure tunnel from a public URL to our local web server.

### What does this mean?

This means that ngrok serves as a middle-man — it allows us to share the code for our Discord Application without the need for complex network configurations.

### Additional Capabilities and Purpose

- **Expose Localhost to the Internet**  
  Ngrok makes your local development server accessible from anywhere in the world via a public URL. This is especially useful for testing webhooks, APIs, or bots that require external callbacks.

- **Bypass NAT and Firewalls**  
  It eliminates the need to configure port forwarding or deal with firewall rules. Ngrok handles all the networking complexity behind the scenes.

- **HTTPS Support**  
  Ngrok automatically provides HTTPS for your tunnel, ensuring secure communication even if your local server only supports HTTP.

- **Temporary Sharing**  
  You can share your local project with collaborators or clients without deploying it to a live server. Just send them the ngrok URL.

- **Authentication and Access Control**  
  Ngrok allows you to restrict access to your tunnel using basic authentication, adding a layer of security when sharing sensitive development environments.

### Why It Matters for Discord Bots

>When developing Discord bots locally, Discord needs a publicly accessible endpoint to send interaction events (like slash commands or button clicks). Ngrok bridges this gap by exposing your local bot server to >Discord’s API, enabling real-time development and testing without deploying to a cloud server.


## System Diagram
...
[User] ---> [Discord Server] ---> [Discord API] ---> [Ngrok Tunnel] ---> [Local Host: 3000] ---> [Bot Logic] ---> [Response Back To Discord]

---

## Bot Code Architecture

The bot follows a modular architecture that separates core logic, user interactions, and command routing into distinct files.  
This design improves maintainability, scalability, and readability of the codebase.

### 1. Modular Design and Responsibilities

- **app.js**  
  Acts as the central controller for initializing the bot, handling Discord client events, and managing the communication bridge with the Discord API.  
  It sets up listeners for slash commands and routes requests to appropriate handlers.

- **commands.js**  
  Defines and registers all slash commands used by the bot (e.g., `/challenge`, `/wordle`, etc.).  
  It maps each command to a corresponding logic module, ensuring a clean separation between command definition and game logic.

- **rps.js** and **wordle.js**  
  Implement the specific game logic for Rock-Paper-Scissors and Wordle, respectively.  
  Each contains internal state-handling and rule-checking functions, which return formatted responses for the Discord client.

- **utils.js**  
  Contains helper functions and enumerations shared across modules.  
  This avoids repetition and centralizes common logic such as message formatting, random selection, or validation.

### 2. Internal Communication Flow

1. The user triggers a slash command (e.g., `/challenge`) inside Discord.  
2. Discord forwards the interaction to your bot via **Ngrok**, which exposes the local server.  
3. **app.js** receives the interaction event and identifies the proper command handler.  
4. The logic function in **rps.js** or another module executes the necessary computation.  
5. The result is formatted by a utility function from **utils.js**, then sent back to the user through **Discord API**.

### 3. Key Design Benefits

- **Maintainability:**  
  Updates to one game or feature do not affect others.
- **Extensibility:**  
  New features (e.g., trivia or currency system) can be added as separate modules following the same structure.
- **Testability:**  
  Each module’s logic can be unit-tested independently without needing to start the Discord client.

---

### Author Contributions

- Ngrok documentation and system flow: Team members A & B  
- Project structure outline: Team member C  
- **Bot code architecture and module interaction analysis:** *[Your Name]*

---


