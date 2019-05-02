export default class Blast {
    constructor() {}
    
    blast(current) {
        console.log("Only Blast so far at " + current);
    }

    ofTheUniverse(end) {
        for(let i = 0; i < end; i++) {
            this.blast(i);
        }
        return true;
    }
}