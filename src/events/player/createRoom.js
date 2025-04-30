import { v4 as uuidv4 } from 'uuid';
import Game from '../../classes/Game.js';
import DebateTopic from '../../classes/DebateTopic.js';
import Moderator from '../../classes/Moderator.js';
import chalk from 'chalk'; // Import chalk

// Helper function to generate a unique 6-digit ID
function generateUniqueGameId(activeGames) {
    let gameId;
    do {
        gameId = Math.floor(100000 + Math.random() * 900000).toString();
    } while (activeGames.has(gameId));
    return gameId;
}

export default {
    event: 'CREATE_ROOM',
    /**
     * Handles the CREATE_ROOM event.
     * @param {string} connectionId - The ID of the connection initiating the request.
     * @param {object} connection - The WebSocket connection object.
     * @param {Map} connections - Map of all active connections.
     * @param {object} payload - The data received with the event.
     * @param {Map} activeGames - Map of all active games.
     */
    async handle(connectionId, connection, connections, payload, activeGames) {
        // Use console.debug for detailed request logging
        console.debug(`Handling CREATE_ROOM request from ${chalk.yellow(connectionId)} with payload:`, payload);

        try { // Add try...catch for async operations

            // Generate moderator and debate topic
            const moderatorProfile = await Game.generateModeratorProfile();
            // Optionally allow specifying an SDG, otherwise random
            const debateTopic = await Game.generateDebateTopic(null, null); // Using updated method

            // Replace uuidv4 with the new 6-digit ID generator
            const createdGameId = generateUniqueGameId(activeGames);
            const gameInstance = new Game({
                gameId: createdGameId,
                gameOwner: connectionId,
                playerA: connectionId, // Owner is Player A (Debater A)
                ownerConnection: connection, // Pass the connection object
                topic: debateTopic, // Use correct property name
                moderator: moderatorProfile // Use correct property name
            });

            activeGames.set(createdGameId, gameInstance);

            // Send confirmation back to the creator
            connection.sendUTF(JSON.stringify({
                type: 'ROOM_CREATED',
                payload: {
                    gameId: createdGameId,
                    // Updated message
                    message: 'Debate room created successfully! Waiting for Debater B.'
                }
            }));
            // Use console.success for successful room creation
            console.success(`Debate room ${chalk.green(createdGameId)} created by ${chalk.yellow(connectionId)} (Debater A). Topic: SDG ${debateTopic.sdgGoal} - ${debateTopic.topic}`); // Added topic info

        } catch (error) {
            // Use console.error
            console.error(`Error creating debate room for ${chalk.yellow(connectionId)}:`, error);
            connection.sendUTF(JSON.stringify({ type: 'error', message: 'Failed to create debate room.' }));
        }
    }
}