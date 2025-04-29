export default {
    execute(game, payload, conn) {
        this.sendToWS(conn, {
            type: 'reply',
            data: {
                event: 'as_defendant',
                payload
            }
        });
        game.emit("game:" + payload.eventToEmit, payload);
    },
    sendToWS(conn, payload) {
        conn.send(JSON.stringify(payload));
    }
}