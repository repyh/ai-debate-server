import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk'; // Import chalk

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
                    // Use console.debug for loading handlers
                    console.debug(`Loading ${handlerType} event handler: ${chalk.green(eventModule.event)}`);
                    handlerMap.set(eventModule.event, eventModule);
                } else {
                    // Use console.warn
                    console.warn(`Could not load ${handlerType} event handler from ${chalk.yellow(file)}: Invalid format.`);
                }
            } catch (error) {
                // Use console.error
                console.error(`Error loading ${handlerType} event handler from ${chalk.yellow(file)}:`, error);
            }
        }
    } catch (error) {
        // Use console.error
        console.error(`Error reading ${handlerType} events directory ${chalk.yellow(eventsDir)}:`, error);
    }
}

// --- Player Event Handler ---

export function playerEventHandler(connectionId, connection, connections, message, activeGames) {
    // Ensure message has event and payload structure
    if (!message || typeof message.event !== 'string' || typeof message.payload === 'undefined') {
        // Use console.error
        console.error(`Invalid message format received from ${chalk.yellow(connectionId)}:`, message);
        connection.sendUTF(JSON.stringify({ type: 'error', message: 'Invalid message format. Expected { event: "...", payload: {...} }' }));
        return;
    }

    const handler = playerHandlers.get(message.event);

    if (handler && typeof handler.handle === 'function') {
        try {
            // Use console.info for handling events
            console.info(`Handling player event '${chalk.green(message.event)}' for connection ${chalk.yellow(connectionId)}`);
            // Pass context: connectionId, specific connection, all connections, payload, activeGames map
            handler.handle(connectionId, connection, connections, message.payload, activeGames);
        } catch (error) {
            // Use console.error
            console.error(`Error handling player event '${chalk.red(message.event)}' for ${chalk.yellow(connectionId)}:`, error);
            connection.sendUTF(JSON.stringify({ type: 'error', message: `Error processing event ${message.event}` }));
        }
    } else {
        // Use console.warn
        console.warn(`No handler found for player event: ${chalk.yellow(message.event)}`);
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
    await loadHandlers('events/ai', aiHandlers, 'ai'); // Keep loading AI handlers if they exist

    // Use console.info
    console.info("Event handlers loaded.");
})();