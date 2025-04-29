export default {
    event: 'REQUEST_CLOSING_STATEMENT_B',
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