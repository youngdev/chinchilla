var clientID       = '212482748876564';
var clientSecret   = 'f2bdb7700ef2d87a8c05b32ac31c013a';
var redirect_uri   = (process.env.HOME == '/Users/jonny') ? 'http://localhost:5000/auth/facebook/token'  : 'http://tunechilla.com/auth/facebook/token';
var cookies		   = require('cookies');
var fbapi		   = require('facebook-api');
var helpers 	   = require('../frontend/scripts/helpers').helpers;
var db			   = require('../db/queries');
var _			   = require('underscore');
var _s 			   = require('underscore.string');
var standards	   = require('../config/standards');
var sanitizer 	   = require('sanitizer');
var ajax	 	   = require('request');
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
this.addPlaylist 		= function(name, user, callback) {
	db.getUserCollections(user, function(collections) {
		if (name == '') {
			callback({fail: 'You must enter a name.'});
			return;
		}
		else {
			var plname 		 = sanitizer.escape(name),
				url 		 = '/u/' +user.username + '/p/' + _.slugify(name),
				exists 		 = _.contains(_.pluck(collections.playlists, 'url'), url);
			if (!exists) {
				var playlist = {
					name: plname,
					url:  url
				}
				collections.playlists.unshift(playlist);
				var dbpl = {
					'owner': user.id,
					'tracks': [],
					'public': false,
					'url': playlist.url,
					'name': playlist.name
				}
				db.createPlaylist(dbpl, function() {
					db.saveUserCollections(collections, function(collection) {
						console.log('Didnt exist before. Added.', collection.playlists);
						callback({fail: false}, playlist);
					});
				});
				
			}
			else {
				callback({fail: 'A playlist with the same name already exists.'});
			}
		}
		
	});
}
this.renamePlaylist 	= function(oldname, newname, user, callback) {
	db.getUserCollections(user, function(collections) {
		if (newname == '') {
			callback({fail: 'You must enter a name.'});
			return;
		}
		else {
			var plname 	= sanitizer.escape(newname),
				url 	= '/u/' +user.username + '/p/' + _.slugify(newname),
				exists 	= _.contains(_.pluck(collections.playlists, 'url'), url);
			if (!exists) {
				collections.playlists = _.map(collections.playlists, function(playlist) { if (playlist.url == oldname) { playlist.name = newname; playlist.url = url;} return playlist});
				db.updatePlaylist(oldname, newname, url, function(item) {
					db.saveUserCollections(collections, function(collection) {
						callback({fail: false}, {url: url, name: newname});
					})
				});
			}	
			else {
				callback({fail: 'A playlist with the same name already exists.'})
			}
		}
	})
}
this.deletePlaylist 	= function(url, user, callback) {
	db.getUserCollections(user, function(collections) {
		var before = collections.playlists.length;
		collections.playlists = _.filter(collections.playlists, function(playlist) { return  playlist.url != url});
		var after  = collections.playlists.length;
		if (before > after) {
			db.saveUserCollections(collections, function() {
				db.removePlaylist(url, function(state) {
					callback(state);
				});
			});
		}
		
	});
}
this.addTracks 			= function(songs, user, callback) {
	db.getUserCollections(user, function(collections) {
		_.each(songs, function(song) {
			collections.library.push(parseFloat(song.id));
			collections.library = _.uniq(collections.library);
		});
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
	//$.ajax(
	//	{
	//		url: 'https://graph.facebook.com/oauth/access_token',
	//		data: 
	//			{
	//				client_id: 		clientID,
	//				redirect_uri: 	redirect_uri,
	//				client_secret: 	clientSecret,
	//				code: 			code
	//			},
	//		success: function(code)
	//			{
	//				var token 			= code.substr(code.indexOf("access_token=") + 13),
	//					access_token	= token.substr(0, token.indexOf("&expires"));
	//				getUserInfo(access_token, request, response);
	//			},
	//		error: function(a,status) {
	//			response.end("Facebook error");
	//		}
	//	}
	//);
	ajax(
		'https://graph.facebook.com/oauth/access_token?client_id=' + clientID + '&redirect_uri=' + redirect_uri + '&client_secret=' + clientSecret + '&code=' + code,
		function(error, r, code) {
			if (error) {
				response.end("Facebook error")
			}
			else {
				console.log("worked!");
				var token 			= code.substr(code.indexOf("access_token=") + 13),
					access_token	= token.substr(0, token.indexOf("&expires"));
				getUserInfo(access_token, request, response);
			}
		}
	);
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
this.ownspl 			= function(playlist, token, callback) {
	db.getUser(token, function(user) {
		if (user) {
			db.getUserCollections(user, function(collections) {
				var playlists 	= collections.playlists
					ownspls 	= _.pluck(playlists, 'url'),
					ownspl 		= _.contains(ownspls, playlist);
					callback(ownspl)
			});
		}
	});
}
this.getUserPlaylists 	= function(token, callback) {
	db.getUser(token, function(user) {
		if (user) {
			db.getPlaylistsFromUserId(user.id, function(playlists) {
				callback(playlists);
			});
		}
	});
}