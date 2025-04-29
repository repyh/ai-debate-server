export default {
    event: 'REQUEST_PLAYER_B_OPENING',
    execute(game, payload, conn) {
        this.sendToWS(conn, {
            type: 'input',
            data: {
                event: 'from_judge',
                payload
            }
        });
    },
    sendToWS(conn, payload) {
        if (conn && conn.connected) { // Check if connection is valid
            conn.sendUTF(JSON.stringify(payload)); // Use sendUTF for consistency
       } else {
            console.error("Attempted to send reply to disconnected or invalid connection.");
       }
    }
}