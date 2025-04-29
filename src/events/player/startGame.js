import { broadcastToGameRoom } from '../../utils/websocketUtils.js'; // Corrected import name

export default {
    event: 'START_GAME',
    /**
     * Handles the START_GAME event.
     * @param {string} connectionId - The ID of the connection initiating the request.
     * @param {object} connection - The WebSocket connection object.
     * @param {Map} connections - Map of all active connections.
     * @param {object} payload - The data received with the event. { gameId: string }
     * @param {Map} activeGames - Map of all active games.
     */
    async handle(connectionId, connection, connections, payload, activeGames) { // Made async
        const gameInstance = activeGames.get(payload.gameId);

        // Check if game exists, if player A is the one starting, and if game is in INIT state
        if (!gameInstance) {
            console.warn(`START_GAME rejected for ${connectionId} in game ${payload.gameId}. Reason: Game not found.`);
            connection.sendUTF(JSON.stringify({ type: 'error', message: 'Game not found.' }));
            return;
        }

        // Check if the requester is the game owner (Debater A)
        if (connectionId !== gameInstance.gameOwner) {
            connection.sendUTF(JSON.stringify({ type: 'error', message: 'Only the room owner (Debater A) can start the debate.' }));
            return;
        }

        // Check if Player B has joined
        if (!gameInstance.playerB) {
            connection.sendUTF(JSON.stringify({ type: 'error', message: 'Cannot start the debate, Debater B has not joined yet.' }));
            return;
        }

        // Check if game is already started or initialized
        if (gameInstance.state === 'STARTED' || gameInstance.state === 'FINISHED') {
             connection.sendUTF(JSON.stringify({ type: 'error', message: 'Debate is already in progress or finished.' }));
             return;
        }
         if (gameInstance.state !== 'INIT' && gameInstance.state !== 'INITIALIZED') { // Allow start if INIT or INITIALIZED
             connection.sendUTF(JSON.stringify({ type: 'error', message: `Cannot start debate from state: ${gameInstance.state}` }));
             return;
         }

        try {
            // Initialize AI chat if not already done
            if (gameInstance.state === 'INIT') {
                 console.log(`Initializing AI chat for debate ${payload.gameId}...`);
                 await gameInstance.initGame(); // Ensure chat is ready
            }

            // Get the initial message from the AI Moderator
            console.log(`Requesting initial moderator message for debate ${payload.gameId}...`);
            // Call renamed method
            const initialMessagePayload = await gameInstance.doInitialModeratorMessage(); // Using updated method

            // Broadcast the initial moderator message to everyone in the room
            await broadcastToGameRoom(gameInstance, {
                type: 'GAME_UPDATE', // Use the same update type
                payload: initialMessagePayload // Send the AI's response directly
            });

            console.log(`Debate ${payload.gameId} started by ${connectionId}.`);

        } catch (error) {
            console.error(`Error starting debate ${payload.gameId}:`, error);
            // Send error back to the owner
            connection.sendUTF(JSON.stringify({ type: 'error', message: `Failed to start debate: ${error.message}` }));
            // Optionally broadcast a generic error? Maybe not needed.
        }
    }
    // Removed reject method as error handling is inline
}