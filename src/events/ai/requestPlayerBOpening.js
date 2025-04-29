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
        conn.send(JSON.stringify(payload));
    }
}