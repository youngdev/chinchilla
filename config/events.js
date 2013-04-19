/*
	Load dependencies. 
	-FS is used for template fetching.
	-DB loads the database
	-FB manages users
	-Swig is a template engine
*/
var fs 		= require('fs'),
	db 		= require('../db/queries'),
	fb 		= require('../config/facebook'),
	itunes 	= require('../config/itunes'),
	swig 	= require('swig'),
	_ 		= require('underscore');
	helpers = require('../frontend/scripts/helpers').helpers;
/*
	Specifies the parent directory path in a string.
*/
var dirup = __dirname.substr(0, __dirname.length - 7);
var notificationtemplates = {
	track_added: 	swig.compileFile(dirup + '/sites/notifications/track-added.html'),
	track_removed: 	swig.compileFile(dirup + '/sites/notifications/track-removed.html')
}
var menutemplates 		  = {
	playlist: 		swig.compileFile(dirup + '/sites/playlistmenuitem.html'),
	playlistdialog: swig.compileFile(dirup + '/sites/add-playlist-dialog.html')
}
var musictemplates 		  = {
	track: 			swig.compileFile(dirup + '/sites/song.html')
}
this.connection = function (socket) {
		socket.emit('connected', {"message": "You are now connected to the socket.io server."});
		/*
			Send a confirmation for a successful connect to a user.
			This is triggered on every site visit.
		*/
		socket.on('load-template', 				function (data) {
			/*
				Templates are HTML strings with place holders that are used on the client-side and on the server-side.
				This automates the process of keeping both versions up to date.
			*/
			var templatename = data.name,
				filename     = dirup + '/sites/' + templatename + ".html";
			/*
				Read the template, get it from the file system. For example: templatename is "album". Get /sites/album.html
			*/
			fs.readFile(filename, "utf-8", function (err, data) {
				/*
					Error handling if somebody tries to send a malicious request via console.
				*/
				if (err) {
					socket.emit('error',    {'message': 'The file path does not exist.'});
				}
				else {
					socket.emit('template', {'template': data});
				}
			});   
		});
		socket.on('new-track', 					function (data) {
			var track = data;
			track.id = parseFloat(track.id);
			db.addTrack(track, function() {
				socket.emit('track-uploaded', track.id);
			});
		});
		socket.on('new-ytid', 					function (data) {
			var track = data;
			track.id = parseFloat(track.id);
			db.addYTID(track, function() {
				socket.emit('track-uploaded', track.id);
			});
		});
		socket.on('new-album', 					function (data) {
			var album = data;
			db.addAlbum(album, function() {
				console.log("Album added successfully.");
			});
		});
		socket.on('add-track',					function (data) {
			var tmpl = musictemplates.track;
			db.getUser(data.token, function(user) {
				if (data.destination == 'library' && user) {
					fb.addTrack(data.song, user, function(collection) {
						db.getSingleTrack(data.song.id, function(song) {
							data.song 				= song[0];
							data.song.inlib 		= true;
							data.type 				= 'library';
							data.showartistalbum 	= true;
							data.cd 				= [data.song];
							data.user 				= user;
							data.parsetext 			= helpers.parsetext;
							data.parseduration 		= helpers.parsetime;
							var notification = notificationtemplates.track_added.render({data: data});
							var div = tmpl.render(data);
							socket.emit('track-added', {notification: notification, song: div, position: 'top'});
						});
					});
				}
			});
		});
		socket.on('add-tracks', 				function (data) {
			db.getUser(data.token, function(user) {
				if (data.destination == 'library' && user) {
					fb.addTracks(data.songs, user, function(collection) {
						socket.emit('tracks-added', data.songs);
					})
				}
			})
		});
		socket.on('remove-track', 				function (data) {
			db.getUser(data.token, function(user) {
				if (data.destination == 'library' && user) {
					fb.removeTrack(data.song, user, function(collection) {
						db.getSingleTrack(data.song.id, function(song) {
							data.song = song[0];
							var notification = notificationtemplates.track_removed.render({data: data});
							socket.emit('track-removed', {notification: notification, id: data.song.id});
						});
					})
				}
			})
		});
		socket.on('get-contextmenu',			function (data) {
			var tmpl 	= swig.compileFile(dirup + '/sites/contextmenu.html');
			var state 	= data.state;
			var render	= function() {
				data.song.image = helpers.getHQAlbumImage(data.song, 225);
				var output 	= tmpl.render(data);
				socket.emit('contextmenu', {html: output});
			}
			if (state.loggedin) {
				fb.inlib(data.song, data.state.token, function(incollection) {
					data.incollection = incollection;
					render();
				});
			}
			else {
				render();
			}
		});
		socket.on('get-playlist-contextmenu',	function (data) {
			var tmpl 	= swig.compileFile(dirup + '/sites/playlist-contextmenu.html');
			var state 	= data.state;
			var render	= function() {
				var output = tmpl.render(data);
				socket.emit('playlist-contextmenu', {html: output});
			}
			fb.ownspl(data.playlist, data.state.token, function(ownspl) {
				data.owns = ownspl;
				db.getPlaylist(data.playlist, function(playlist) {
					data.playlist = playlist;
					render();
				});
			});
		});
		socket.on('add-playlist-dialogue', 		function (data) {
			fb.getUserPlaylists(data.token, function(playlists) {
				var playlists = _.map(playlists, function(playlist) { 
					playlist.inpl = (_.contains(playlist.tracks, parseFloat(data.song))); 
					return playlist; 
				});
				var output = menutemplates.playlistdialog.render({playlists: playlists, songid: data.song});
				socket.emit('add-playlist-dialog-response', {html: output});
			});
		});
		socket.on('get-playlist-options',		function (data) {
			var tmpl 	= swig.compileFile(dirup + '/sites/playlist-options.html');
			var render 	= function() {
				var output = tmpl.render(data);
				socket.emit('playlist-options', {html: output});
			}
			var checkPlaylistOwner = function() {
				if (data.token) {
					fb.ownspl(data.playlist, data.token, afterPlaylistOwnerChecked);
				}
				else {
					getPlaylist();
				}
			}
			var afterPlaylistOwnerChecked = function(ownspl) {
				data.owns = ownspl;
				getPlaylist();
			}
			var getPlaylist = function() {
				db.getPlaylist(data.playlist, function(playlist) {
					data.playlist = playlist;
					render();
				});
			}
			checkPlaylistOwner();
		});
		socket.on('change-playlist-privacy', 	function (data) {
			if (data.token) {
				fb.ownspl(data.playlist, data.token, function (ownspl) {
					if (ownspl) {
						db.getPlaylist(data.playlist, function(playlist) {
							playlist['public'] = data['public'] == true ? true : false;
							db.savePlaylist(playlist);
						});
					}
				});
			}
		});
		socket.on('change-playlist-order', 		function (data) {
			if (data.token) {
				fb.ownspl(data.playlist, data.token, function (ownspl) {
					if (ownspl) {
						db.getPlaylist(data.playlist, function(playlist) {
							playlist.newestattop = data.newestattop;
							db.savePlaylist(playlist);
						});
					}
				});
			}
		});
		socket.on('rename-playlist',			function (data) {
			var afterUserFetched = function(user) {
				if (user) {
					fb.renamePlaylist(data.oldname, data.newname, user, afterPlaylistRenameEvaluated)
				}
			}
			var afterPlaylistRenameEvaluated = function(state, playlist) {
				if (!state.fail) {
					var div = menutemplates.playlist.render({playlist: playlist});
					socket.emit('playlist-renamed', div)
				}
				else {
					socket.emit('playlist-renamed-failed', state.fail);
				}
			}
			db.getUser(data.token, afterUserFetched);
		});
		socket.on('delete-playlist', 			function (data) {
			var afterUserFetched = function(user) {
				if (user) {
					fb.deletePlaylist(data.url, user, afterPlaylistDeletionEvaluated);
				}
			}
			var afterPlaylistDeletionEvaluated = function(state) {
				if (!state.fail) {
					socket.emit('playlist-removed', {url: data.url});
				}
			}
			db.getUser(data.token, afterUserFetched);
		});
		socket.on('add-playlist', 				function (data) {
			var afterUserFetched = function(user) {
				if (user) {
					fb.addPlaylist(data.name, user, afterPlaylistCreationEvaluated)
				}
				else {
					socket.emit('playlist-addition-failed', 'You need to be logged in to create playlists.');
				}
			}
			var afterPlaylistCreationEvaluated = function(state, playlist) {
				if (!state.fail) {
					var div = menutemplates.playlist.render({playlist: playlist});
					socket.emit('playlist-added', div);
				}
				else {
					socket.emit('playlist-addition-failed', state.fail);
				}
				
			}			
			db.getUser(data.token, afterUserFetched);
		});
		socket.on('add-song-to-playlist', 		function (data) {
			var tmpl = musictemplates.track;
			db.getUser(data.token, function(user) {
				db.getUserCollections(user, function(collections) {
					var userplaylists = _.pluck(collections.playlists, 'url');
					db.getPlaylistByUrl(data.url, function(playlist) {
						if (playlist && _.include(userplaylists, data.url) && !_.include(playlist.tracks, parseFloat(data.songid))) {
							playlist.tracks.push(parseFloat(data.songid));
							db.savePlaylist(playlist);
							db.getSingleTrack(data.songid, function(song) {
								data.song 				= song[0];
								data.song.inlib 		= _.include(collections.library, data.songid);
								data.type 				= 'playlist';
								data.showartistalbum	= true;
								data.cd 				= [data.song];
								data.user 				= user;
								data.parsetext 			= helpers.parsetext;
								data.parseduration		= helpers.parsetime;
								var output = tmpl.render(data);
								socket.emit('playlist-song-added', {song: output, position: playlist.newestattop ? 'top' : 'bottom', view: data.url, trackcount: playlist.tracks.length, lengthdifference: data.song.duration});
							});
						}
					});
				});
			});
		});
		socket.on('remove-song-from-playlist', 	function (data) {
			db.getUser(data.token, function(user) {
				db.getPlaylistByUrl(data.url, function(playlist) {
					if (playlist) {
						playlist.tracks = _.reject(playlist.tracks, function(song) {return song == parseFloat(data.songid)});
						db.savePlaylist(playlist);
						db.getSingleTrack(data.songid, function(song) {
							socket.emit('playlist-song-removed', {songid: data.songid, view: data.url, trackcount: playlist.tracks.length, lengthdifference: (0 - song[0].duration)});
						});
					}
				});
			});
		});
		socket.on('update-settings', 			function (data) {
			db.updateSettings(data, function() {
				socket.emit('settings-saved');
			});
		});
		socket.on('request-track-info',			function (data) {
			var query = _.clean(data.name) + ' ' + _.clean(data.artist)
			itunes.search(query, {entity: 'song', limit: 3}, function (json) {
				// ERROR_HANDLING
				var track = _.first(json.results);
				if (track) {
					var song  = itunes.remap(track); 
					socket.emit('receive-track-info', {song: song});
				}
				else {
					socket.emit('receive-track-info', {error: 404})
				}
			});
		});
};