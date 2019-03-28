
var BlastOfTheUniverse = {

    $extends: "Blast",

    $members: {
        start: 0,
        reset: function() {
            this.start = 0;
        },
        blast: function(current) {
            console.log("Blast of the universe started at " + this.start + " ends " + current);
        }
    }
}
