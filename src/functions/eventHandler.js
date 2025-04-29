import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const playerHandlers = new Map();
const aiHandlers = new Map(); // Placeholder for AI event handlers

// --- Load Event Handlers ---

async function loadHandlers(directory, handlerMap, handlerType) {
    const eventsDir = path.join(__dirname, '..', directory);
    try {
        const eventFiles = fs.readdirSync(eventsDir).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const filePath = path.join(eventsDir, file);
            // Use dynamic import with file URL path for cross-platform compatibility
            const modulePath = `../${directory}/${file}`;
            try {
                const eventModule = (await import(modulePath)).default;
                if (eventModule && eventModule.event && (eventModule.handle || eventModule.execute)) {
                    console.log(`Loading ${handlerType} event handler: ${eventModule.event}`);
                    handlerMap.set(eventModule.event, eventModule);
                } else {
                    console.warn(`Could not load ${handlerType} event handler from ${file}: Invalid format.`);
                }
            } catch (error) {
                console.error(`Error loading ${handlerType} event handler from ${file}:`, error);
            }
        }
    } catch (error) {
        console.error(`Error reading ${handlerType} events directory ${eventsDir}:`, error);
    }
}

// --- Player Event Handler ---

export function playerEventHandler(connectionId, connection, connections, message, activeGames) {
    // Ensure message has event and payload structure
    if (!message || typeof message.event !== 'string' || typeof message.payload === 'undefined') {
        console.error(`Invalid message format received from ${connectionId}:`, message);
        connection.sendUTF(JSON.stringify({ type: 'error', message: 'Invalid message format. Expected { event: "...", payload: {...} }' }));
        return;
    }

    const handler = playerHandlers.get(message.event);

    if (handler && typeof handler.handle === 'function') {
        try {
            console.log(`Handling player event '${message.event}' for connection ${connectionId}`);
            // Pass context: connectionId, specific connection, all connections, payload, activeGames map
            handler.handle(connectionId, connection, connections, message.payload, activeGames);
        } catch (error) {
            console.error(`Error handling player event '${message.event}' for ${connectionId}:`, error);
            connection.sendUTF(JSON.stringify({ type: 'error', message: `Error processing event ${message.event}` }));
        }
    } else {
        console.warn(`No handler found for player event: ${message.event}`);
        connection.sendUTF(JSON.stringify({ type: 'error', message: `Unknown event type: ${message.event}` }));
    }
}

// --- AI Event Handling ---
// Keep this section for potential future use with nextAction
export function getAiEventHandler(eventName) {
    return aiHandlers.get(eventName);
}

// --- Initialize: Load all handlers ---
(async () => {
    await loadHandlers('events/player', playerHandlers, 'player');
    await loadHandlers('events/ai', aiHandlers, 'ai');

    console.log("Event handlers loaded.");
})();