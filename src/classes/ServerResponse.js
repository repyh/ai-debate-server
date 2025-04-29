class ServerResponse {
    constructor(data) {
        this.status = data.status;
        this.gameId = data.gameId;
        this.gameData = data.gameData;
        this.eventQueue = data.eventQueue;
    }
}