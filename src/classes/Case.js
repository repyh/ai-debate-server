class Case {
    constructor(data) {
        this.title = data.title;
        this.type = data.type;
        this.context = data.context;
        this.summary = data.summary;
        this.defendantWitnesses = data.defendantWitnesses;
        this.plaintiffWitnesses = data.plaintiffWitnesses;
        this.plaintiff = data.plaintiff;
        this.defendant = data.defendant;
        this.details = data.details;
        this.hiddenDetails = data.hiddenDetails;
        this.evidence = data.evidence;
        this.facts = data.facts;
        this.truth = data.truth;
        this.plaintiffType = data.plaintiffType;
        this.defendantType = data.defendantType;
    }
}

export default Case;