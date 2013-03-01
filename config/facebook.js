var clientID       = '212482748876564';
var clientSecret   = 'f2bdb7700ef2d87a8c05b32ac31c013a';
var redirect_uri   = (process.env.HOME == '/Users/jonny') ? 'http://localhost:5000/auth/facebook/token'  : 'http://tunechilla.com/auth/facebook/token';
var $			   = require('jquery');
var cookies		   = require('cookies');
var fbapi		   = require('facebook-api');
var helpers 	   = require('../frontend/scripts/helpers').helpers;
var db			   = require('../db/queries');
var _			   = require('underscore');
var standards	   = require('../config/standards');

this.login 				= function(request, response) {
    response.redirect('https://www.facebook.com/dialog/oauth?client_id=' + clientID + '&redirect_uri=' + redirect_uri);
}
this.token 				= function(request, response) {
	exchange(request.query.code, request, response);
}
this.logout				= function(request, response) {
	var cookie = new cookies(request, response);
	cookie.set('token', '', 0);
	response.redirect('/');
}
var checkLoginState = this.checkLoginState	= function(request, callback) {
	var cookie = new cookies(request),
		token  = cookie.get('token');
		if (token) {
			db.getUser(token, function(user) {
				callback(user)
			})
		}
		else {
			callback(null);
		}
}
this.getLibraryFromRequest = function(request, callback) {
	checkLoginState(request, function(user) {
		if (user) {
			db.getUserCollections(user, function(collections) {
				callback({loggedin: true, collections: collections});
			})
		}
		else {
			callback({loggedin: false});
		}
	})
}
this.addTrack			= function(song, user, callback) {
	db.getUserCollections(user, function(collections) {
		collections.library.push(parseFloat(song.id));
		collections.library = _.uniq(collections.library);
		db.saveUserCollections(collections, function(collection) {
			callback(collection);
		});
	});
	
}
this.addTracks 			= function(songs, user, callback) {
	db.getUserCollections(user, function(collections) {
		_.each(songs, function(song) {
			collections.library.push(parseFloat(song.id));
			collections.library = _.uniq(collections.library);
		});
		console.log(collections)
		db.saveUserCollections(collections, function(collection) {
			callback(collection);
		})
	})
}
this.removeTrack		= function(song, user, callback) {
	db.getUserCollections(user, function(collections) {
		collections.library = _.without(collections.library, parseFloat(song.id));
		db.saveUserCollections(collections, function(collection) {
			callback(collection);
		})
	})
}
var exchange 			= function(code, request, response) {
	$.ajax(
		{
			url: 'https://graph.facebook.com/oauth/access_token',
			data: 
				{
					client_id: 		clientID,
					redirect_uri: 	redirect_uri,
					client_secret: 	clientSecret,
					code: 			code
				},
			success: function(code)
				{
					var token 			= code.substr(code.indexOf("access_token=") + 13),
						access_token	= token.substr(0, token.indexOf("&expires"));
					getUserInfo(access_token, request, response);
				},
			error: function(a,status) {
				response.end("Facebook error");
			}
		}
	)
}
var getUserInfo	 		= function(access_token, request, response) {
	var client = fbapi.user(access_token);
	client.me.info(function(err, json) {
		var token = helpers.createID();
		var user  = {
			id: 			json.id,
			first: 			json.first_name,
			last: 			json.last_name,
			token:  		token,
			username: 		json.username,
			settings: 		standards.settings
		}
		db.addUser(user, function() {
			console.log("User added successful!");
			var cookie = new cookies(request, response);
			cookie.set('token', token, {expires: new Date(2030, 10, 1, 1, 1, 1, 1)});
			response.redirect('/');
		});
	})
}
this.inlib				= function(song, token, callback) {
	db.getUser(token, function(user) {
		if (user) {
			db.getUserCollections(user, function(collections) {
				var library = collections.library,
					stars 	= collections.starred,
					inlib 	= _.contains(library, 	parseFloat(song.id)),
					starred = _.contains(stars, 	parseFloat(song.id));
				callback({
					inlib: inlib,
					starred: starred
				});
			});
		}
	});
}
