import { broadcastToGameRoom } from '../../utils/websocketUtils.js'; // Corrected import name

export default {
    event: 'SEND_MESSAGE',
    /**
     * Handles player messages during the game.
     * @param {string} connectionId - The ID of the connection sending the message.
     * @param {object} connection - The WebSocket connection object.
     * @param {Map} connections - Map of all active connections.
     * @param {object} payload - { gameId: string, message: string }
     * @param {Map} activeGames - Map of all active games.
     */
    async handle(connectionId, connection, connections, payload, activeGames) { // Made async
        const { gameId, message } = payload;

        if (!gameId || typeof message !== 'string') {
            connection.sendUTF(JSON.stringify({ type: 'error', message: 'Invalid payload. Required: { gameId, message }' }));
            return;
        }

        const gameInstance = activeGames.get(gameId);

        if (!gameInstance) {
            connection.sendUTF(JSON.stringify({ type: 'error', message: 'Game not found.' }));
            return;
        }

        // *** ADDED CHECK FOR FINISHED GAME ***
        if (gameInstance.state === "FINISHED") {
             connection.sendUTF(JSON.stringify({ type: 'error', message: 'Game has already finished.' }));
             return;
        }
        // *** END ADDED CHECK ***

        if (gameInstance.state !== "STARTED") {
             connection.sendUTF(JSON.stringify({ type: 'error', message: 'Game has not started or has finished.' }));
             return;
        }

        try {
            // 1. Get AI response (this also validates turn and updates it internally)
            const aiResponse = await gameInstance.handlePlayerMessage(connectionId, message);

            // 2. Broadcast the original message and the AI's response
            await broadcastToGameRoom(gameInstance, {
                type: 'GAME_UPDATE',
                payload: {
                    sender: {
                        connectionId: connectionId,
                        role: gameInstance.getPlayerRole(connectionId) // Get sender's role
                    },
                    message: message, // The original player message
                    response: aiResponse // The AI's response object
                }
            });

             // TODO: Future - Check aiResponse.nextAction here and potentially trigger
             // an AI event handler if needed using getAiEventHandler(aiResponse.nextAction).execute(...)

        } catch (error) {
            console.error(`Error handling SEND_MESSAGE for game ${gameId} from ${connectionId}:`, error);
            // Send specific error back to the sender
            connection.sendUTF(JSON.stringify({
                type: 'error',
                event: 'SEND_MESSAGE',
                message: error.message || 'Failed to process message.'
            }));
            // Optionally broadcast a generic error to the room if appropriate
            // await broadcastToGameRoom(gameInstance, { type: 'error', message: 'An error occurred processing the last message.' }, connectionId);
        }
    }
}