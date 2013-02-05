var fauth   = require("../config/fauthentication"),
    db      = require("../db/queries"),
    helpers = require("../frontend/scripts/helpers").helpers,
    cookies = require("cookies");
this.cb   = function(accessToken, request, response) {
    console.log("Access token is", accessToken);
    fauth.getUser(function(profile) {
        var token = helpers.createID();
        var user = {
            first:      profile.first_name,
            last:       profile.last_name,
            username:   profile.username,
            email:      profile.email,
            id:         profile.id,
            favorites:  [],
            library:    [],
            playlists:  [],
            preferences:{},
            token:      token
        };
        var cookie = new cookies(request, response);
        cookie.set("token", token);
        db.addUser(user, function() {
            console.log("User added to DB!");
        });
    });
};
this.auth   = function(request, response) {
    fauth.auth(request, response);
};