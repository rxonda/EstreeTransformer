var Blast = {
    $members: {
        blast: function(current) {
            console.log("Only Blast so far at " + current);
        },
        ofTheUniverse: function(end) {
            for(let i = 0; i < end; i++) {
                this.blast(i);
            }
            return true;
        }
    }
}