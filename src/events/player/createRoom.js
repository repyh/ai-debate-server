import { v4 as uuidv4 } from 'uuid';
import Game from '../../classes/Game.js';
// Import new classes
import DebateTopic from '../../classes/DebateTopic.js';
import Moderator from '../../classes/Moderator.js';

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
        console.log(`Handling CREATE_ROOM request from ${connectionId} with payload:`, payload);

        try { // Add try...catch for async operations

            // Generate moderator and debate topic
            const moderatorProfile = await Game.generateModeratorProfile();
            // Optionally allow specifying an SDG, otherwise random
            const debateTopic = await Game.generateDebateTopic(null, null); // Using updated method

            const createdGameId = uuidv4();
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
            console.log(`Debate room ${createdGameId} created by ${connectionId} (Debater A). Topic: SDG ${debateTopic.sdgGoal} - ${debateTopic.topic}`); // Added topic info

        } catch (error) {
            console.error(`Error creating debate room for ${connectionId}:`, error);
            connection.sendUTF(JSON.stringify({ type: 'error', message: 'Failed to create debate room.' }));
        }
    }
}