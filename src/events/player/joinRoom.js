import { broadcastToGameRoom } from '../../utils/websocketUtils.js';

export default {
    event: 'JOIN_ROOM',
    /**
     * Handles the JOIN_ROOM event.
     * @param {string} connectionId - The ID of the connection initiating the request.
     * @param {object} connection - The WebSocket connection object.
     * @param {Map} connections - Map of all active connections.
     * @param {object} payload - { gameId: string }
     * @param {Map} activeGames - Map of all active games.
     */
    async handle(connectionId, connection, connections, payload, activeGames) { // Made async
        const { gameId } = payload;

        if (!gameId) {
            connection.sendUTF(JSON.stringify({ type: 'JOIN_FAILED', message: 'Missing gameId in payload.' }));
            return;
        }

        const gameInstance = activeGames.get(gameId);

        if (!gameInstance) {
            connection.sendUTF(JSON.stringify({ type: 'JOIN_FAILED', message: 'Game not found.' }));
            return;
        }

        // Check if Player B slot is already taken
        if (gameInstance.playerB) {
            connection.sendUTF(JSON.stringify({ type: 'GAME_FULL', message: 'Debate room is already full.' }));
            return;
        }

        // Check if player is trying to join their own game as player B
        if (gameInstance.playerA === connectionId) {
             connection.sendUTF(JSON.stringify({ type: 'JOIN_FAILED', message: 'Cannot join your own debate as Debater B.' }));
             return;
        }

        try {
            // Add Debater B to the game instance
            gameInstance.setPlayerB(connectionId, connection); // Role set inside

            // Send success message ONLY to the player who just joined
            connection.sendUTF(JSON.stringify({
                type: 'JOIN_SUCCESS',
                payload: {
                    gameId: gameId,
                    role: 'DEBATER_B', // Send correct role
                    message: `Successfully joined the debate on SDG ${gameInstance.topic.sdgGoal} as DEBATER B.` // Added topic info
                }
            }));

            // Broadcast to Debater A that Debater B joined
            await broadcastToGameRoom(
                gameInstance,
                {
                    type: 'PLAYER_JOINED', // Event type remains generic
                    payload: {
                        connectionId: connectionId,
                        message: `Debater ${connectionId} (DEBATER B) joined the room!` // Updated message
                    }
                },
                connectionId // Exclude the joining player
            );

            console.log(`Debater ${connectionId} joined game ${gameId} as Debater B.`);

        } catch (error) {
             console.error(`Error joining room ${gameId} for ${connectionId}:`, error);
             connection.sendUTF(JSON.stringify({ type: 'JOIN_FAILED', message: 'Failed to join debate room.' }));
             // Consider removing player B if setPlayerB failed partially?
             if(gameInstance.playerB === connectionId) {
                 gameInstance.playerB = null;
                 gameInstance.players.delete(connectionId);
             }
        }
    }
}