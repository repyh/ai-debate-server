/**
 * Broadcasts a message to all players in a specific game room, optionally excluding one connection.
 * Assumes the game object has a `players` Map where keys are connection IDs and values
 * are objects containing a `connection` property (the WebSocket connection object).
 *
 * @param {Game} game - The game instance containing player connections.
 * @param {object} message - The message object to broadcast (will be stringified).
 * @param {string} [excludeConnectionId=null] - The connection ID to exclude from the broadcast.
 */
export async function broadcastToGameRoom(game, message, excludeConnectionId = null) {
    // Check for game and players map
    if (!game || !game.players || !(game.players instanceof Map)) {
        console.error('Invalid game object or players map passed to broadcastToGameRoom for game ID:', game?.gameId);
        return;
    }

    const messageString = JSON.stringify(message);
    console.log(`Broadcasting to game ${game.gameId} (excluding ${excludeConnectionId || 'none'}): ${messageString}`);

    // Iterate over the entries in the players Map
    for (const [connectionId, playerData] of game.players.entries()) {
        // Check if we should exclude this connection
        if (connectionId === excludeConnectionId) {
            continue; // Skip to the next player
        }

        // Check if playerData and connection exist and connection is active
        if (playerData && playerData.connection && playerData.connection.connected) {
            try {
                playerData.connection.sendUTF(messageString);
            } catch (error) {
                console.error(`Failed to send message to player connection ${connectionId} in game ${game.gameId}:`, error);
                // Consider removing player/connection from game if send fails repeatedly
                // game.players.delete(connectionId); // Example cleanup
            }
        } else {
            console.warn(`Skipping broadcast to inactive or invalid connection ${connectionId} in game ${game.gameId}`);
            // Optionally remove inactive connections from the game's player list
            // game.players.delete(connectionId);
        }
    }
}

// Add other WebSocket utility functions here if needed
