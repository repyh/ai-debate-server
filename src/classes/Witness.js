import People from './People.js';

class Witness extends People {
    constructor(data) {
        super(data);
        this.testimony = data.testimony;
        this.relation = data.relation;
        this.side = data.side;
    }
}

export default Witness;