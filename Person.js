import Blast from "./Blast.ts";

export default class Person extends Blast {
    static _init_() {
        if(origin == null) {
            console.log("Blast!");
        }
    }

    constructor(name, address) {
        super();
        this.start = 0;
        this.name = name;
        this.address = address;
        this.getNameAndAddress.bind();
    }

    getNameAndAddress() {
        return this.name + ", " + this.address;
    }
}