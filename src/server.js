import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating game IDs
import http from 'http'; // Import Node.js http module
import { server as WebSocketServer } from 'websocket'; // Import websocket library

import Game from './classes/Game.js'; // Import the Game class
import { playerEventHandler } from './functions/eventHandler.js'; // Import only the necessary handler function

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

console.alert = function (...args) {
    console.log("[ALERT]", ...args);
}

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`AI Debate server (HTTP & WebSocket) listening on port ${port}`);
});

const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    console.log("WebSocket connection origin:", origin);
    return true;
}

const connections = new Map();
const activeGames = new Map();

wsServer.on('request', (request) => {
    // if (!originIsAllowed(request.origin)) {
    //     request.reject();
    //     console.log(`Connection from origin ${request.origin} rejected.`);
    //     return;
    // }
    const connection = request.accept(null, request.origin);
    const connectionId = uuidv4();
    connections.set(connectionId, connection);
    console.alert(`WebSocket Connection accepted: ${connectionId} from ${request.remoteAddress}`);

    connection.on('message', (message) => {
        if (message.type === 'utf8') {
            console.log(`Received Message from ${connectionId}: ${message.utf8Data}`);
            try {
                const parsedMessage = JSON.parse(message.utf8Data);
                // Route message to the player event handler
                playerEventHandler(connectionId, connection, connections, parsedMessage, activeGames);

            } catch (e) {
                console.error(`Error parsing message from ${connectionId}:`, e);
                connection.sendUTF(JSON.stringify({ type: 'error', message: 'Invalid JSON received' }));
            }
        }
    });

    // --- Handle WebSocket Close ---
    connection.on('close', (reasonCode, description) => {
        connections.delete(connectionId); // Remove connection from map
        console.log(`WebSocket Peer ${connection.remoteAddress} (ID: ${connectionId}) disconnected. Reason: ${reasonCode} - ${description}`);
    });

    // --- Handle WebSocket Error ---
    connection.on('error', (error) => {
        console.error(`WebSocket Connection Error for ${connectionId}: ${error}`);
        // The 'close' event will often follow an error.
    });
});

console.log("WebSocket server setup complete.");