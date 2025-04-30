import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating game IDs
import http from 'http'; // Import Node.js http module
import { server as WebSocketServer } from 'websocket'; // Import websocket library
import chalk from 'chalk'; // Import chalk

import Game from './classes/Game.js'; // Import the Game class
import { playerEventHandler } from './functions/eventHandler.js'; // Import only the necessary handler function

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Enhanced Logging with Chalk ---
const log = console.log; // Keep original console.log if needed elsewhere
console.info = (...args) => log(chalk.blue('[INFO]'), ...args);
console.warn = (...args) => log(chalk.yellow('[WARN]'), ...args);
console.error = (...args) => log(chalk.red.bold('[ERROR]'), ...args);
console.alert = (...args) => log(chalk.cyan.bold('[ALERT]'), ...args); // Keep alert, maybe make it cyan
console.debug = (...args) => log(chalk.gray('[DEBUG]'), ...args); // Add debug level
console.success = (...args) => log(chalk.green('[SUCCESS]'), ...args); // Add success level
// --- End Enhanced Logging ---

const server = http.createServer(app);

server.listen(port, () => {
    console.info(`AI Debate server (HTTP & WebSocket) listening on port ${port}`); // Use console.info
});

const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    console.debug("WebSocket connection origin:", origin); // Use console.debug
    return true;
}

const connections = new Map();
const activeGames = new Map();

// --- Inactivity Check ---
const INACTIVITY_CHECK_INTERVAL = 30000; // Check every 30 seconds

function checkInactiveGames() {
    console.debug('Running inactivity check...');
    const gamesToRemove = [];
    for (const [gameId, gameInstance] of activeGames.entries()) {
        const playerAConnection = connections.get(gameInstance.playerA);
        const playerBConnection = gameInstance.playerB ? connections.get(gameInstance.playerB) : null;

        // A game is inactive if player A is disconnected AND (player B doesn't exist or player B is disconnected)
        if (!playerAConnection && (!gameInstance.playerB || !playerBConnection)) {
            gamesToRemove.push(gameId);
        }
    }

    if (gamesToRemove.length > 0) {
        console.warn(`Removing ${gamesToRemove.length} inactive game(s): ${gamesToRemove.join(', ')}`);
        gamesToRemove.forEach(gameId => {
            activeGames.delete(gameId);
        });
    }
}

setInterval(checkInactiveGames, INACTIVITY_CHECK_INTERVAL);
// --- End Inactivity Check ---

wsServer.on('request', (request) => {
    // if (!originIsAllowed(request.origin)) {
    //     request.reject();
    //     console.log(`Connection from origin ${request.origin} rejected.`);
    //     return;
    // }
    const connection = request.accept(null, request.origin);
    const connectionId = uuidv4();
    connections.set(connectionId, connection);
    // Use console.success for successful connection
    console.success(`WebSocket Connection accepted: ${chalk.yellow(connectionId)} from ${request.remoteAddress}`);

    // --- Send Welcome Message ---
    connection.sendUTF(JSON.stringify({
        type: 'WELCOME_MESSAGE',
        payload: {
            title: "Message Board",
            message: "Welcome to the AI Debate Arena! Create a room or join an existing one to start."
        }
    }));
    // --- End Welcome Message ---

    connection.on('message', (message) => {
        if (message.type === 'utf8') {
            // Use console.debug for detailed message logs
            console.debug(`Received Message from ${chalk.yellow(connectionId)}: ${message.utf8Data}`);
            try {
                const parsedMessage = JSON.parse(message.utf8Data);
                // Route message to the player event handler
                playerEventHandler(connectionId, connection, connections, parsedMessage, activeGames);

            } catch (e) {
                // Use console.error for parsing errors
                console.error(`Error parsing message from ${chalk.yellow(connectionId)}:`, e.message);
                connection.sendUTF(JSON.stringify({ type: 'error', message: 'Invalid JSON received' }));
            }
        } else {
             // Use console.warn for non-utf8 messages
            console.warn(`Received non-UTF8 message type '${message.type}' from ${chalk.yellow(connectionId)}`);
        }
    });

    // --- Handle WebSocket Close ---
    connection.on('close', (reasonCode, description) => {
        connections.delete(connectionId); // Remove connection from map
        // Use console.info or console.warn for disconnects
        console.info(`WebSocket Peer ${connection.remoteAddress} (ID: ${chalk.yellow(connectionId)}) disconnected. Reason: ${reasonCode} - ${description}`);
    });

    // --- Handle WebSocket Error ---
    connection.on('error', (error) => {
        // Use console.error for connection errors
        console.error(`WebSocket Connection Error for ${chalk.yellow(connectionId)}: ${error}`);
        // The 'close' event will often follow an error.
    });
});

console.info("WebSocket server setup complete."); // Use console.info