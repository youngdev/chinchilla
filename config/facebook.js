var fauth   = require("fauthentication"),
    db      = require("../db/queries");
this.auth   = function(accessToken) {
    console.log("Access token is", accessToken);
    fauth.getUser(function(profile) {
        var user = {
            first:      profile.first_name,
            last:       profile.last_name,
            username:   profile.username,
            email:      profile.email,
            id:         profile.id
        };
        db.addUser(user, function() {
            console.log("User added to DB!");
        })
    });
}