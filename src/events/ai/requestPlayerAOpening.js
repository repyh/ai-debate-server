export default {
    event: 'REQUEST_PLAYER_A_OPENING',
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