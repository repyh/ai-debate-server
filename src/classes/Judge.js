import People from './People.js';

class Judge extends People {
    constructor(data) {
        super(data);
        this.moodLevel = data.moodLevel;
    }
}

export default Judge;