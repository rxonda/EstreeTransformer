
var BlastOfTheUniverse = {

    $extends: "Blast",

    $static: {
        _init_: function() {
            ($Blast)
        },
        originType: null
    },

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