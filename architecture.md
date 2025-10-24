## Project structure
Below is a basic overview of the project structure:

```
├── examples    -> short, feature-specific sample apps
├── images      -> holds images used by games
├── .env.sample -> sample .env file
├── app.js      -> main entrypoint for app
├── commands.js -> slash command payloads + helpers
├── rps.js     -> logic specific to RPS
├── utils.js    -> utility functions and enums
├── wordle.js   -> logic specifically to wordle
├── package.json
├── README.md
└── .gitignore
```

### Functions of NGrok

Ngrok is a tool that creates a secure tunnel from a public URL to our local web server.

#### What does this mean?

This means that ngrok serves as a middle-man — it allows us to share the code for our Discord Application without the need for complex network configurations.

#### Additional Capabilities and Purpose

- **Expose Localhost to the Internet**  
  Ngrok makes your local development server accessible from anywhere in the world via a public URL. This is especially useful for testing webhooks, APIs, or bots that require external callbacks.

- **Bypass NAT and Firewalls**  
  It eliminates the need to configure port forwarding or deal with firewall rules. Ngrok handles all the networking complexity behind the scenes.

- **HTTPS Support**  
  Ngrok automatically provides HTTPS for your tunnel, ensuring secure communication even if your local server only supports HTTP.

- **Session Inspection and Replay**  
  Ngrok includes a web interface that lets you inspect incoming requests and replay them. This is invaluable for debugging and testing webhook payloads or bot interactions.

- **Temporary Sharing**  
  You can share your local project with collaborators or clients without deploying it to a live server. Just send them the ngrok URL.

- **Custom Subdomains and Reserved Domains**  
  With a paid plan, you can use custom subdomains or reserve a domain name, making your tunnel URLs more predictable and professional.

- **Authentication and Access Control**  
  Ngrok allows you to restrict access to your tunnel using basic authentication, adding a layer of security when sharing sensitive development environments.

#### Why It Matters for Discord Bots

When developing Discord bots locally, Discord needs a publicly accessible endpoint to send interaction events (like slash commands or button clicks). Ngrok bridges this gap by exposing your local bot server to Discord’s API, enabling real-time development and testing without deploying to a cloud server.

> In short, ngrok empowers developers to iterate faster, test smarter, and share easier — all while keeping things secure and simple.




## System Diagram
...
[User] ---> [Discord Server] ---> [Discord API] ---> [Ngrok Tunnel] ---> [Local Host: 3000] ---> [Bot Logic] ---> [Response Back To Discord]
