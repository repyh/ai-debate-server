class DebateTopic {
    constructor(data) {
        this.sdgGoal = data.sdgGoal;
        this.sdgTitle = data.sdgTitle;
        this.topic = data.topic;
        this.context = data.context;
        this.sideA_stance = data.sideA_stance;
        this.sideB_stance = data.sideB_stance;
    }
}

export default DebateTopic;
