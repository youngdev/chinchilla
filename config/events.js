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
	track_removed: 	swig.compileFile(dirup + '/sites/notifications/track-removed.html'),
	tracks_added: 	swig.compileFile(dirup + '/sites/notifications/tracks-added.html'),
	tracks_removed: swig.compileFile(dirup + '/sites/notifications/tracks-removed.html')
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
		socket.on('load-template', 					function (data) {
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
		socket.on('new-track', 						function (data) {
			var track = data;
			track.id = parseFloat(track.id);
			db.addTrack(track, function() {
				socket.emit('track-uploaded', track.id);
			});
		});
		socket.on('new-ytid', 						function (data) {
			var track = data;
			track.id = parseFloat(track.id);
			db.addYTID(track, function() {
				console.log('track uploaded')
				socket.emit('track-uploaded', track.id);
			});
		});
		socket.on('new-album', 						function (data) {
			var album = data;
			db.addAlbum(album, function() {
				console.log("Album added successfully.");
			});
		});
		socket.on('add-track',						function (data) {
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
		socket.on('add-tracks', 					function (data) {
			db.getUser(data.token, function(user) {
				if (data.destination == 'library' && user) {
					fb.addTracks(data.songs, user, function(collection) {
						socket.emit('tracks-added', data.songs);
					})
				}
			})
		});
		socket.on('remove-track', 					function (data) {
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
		socket.on('get-contextmenu',				function (data) {
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
		socket.on('get-playlist-contextmenu',		function (data) {
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
		socket.on('add-playlist-dialogue', 			function (data) {
			fb.getUserPlaylists(data.token, function(playlists) {
				var playlists = _.map(playlists, function(playlist) { 
					playlist.inpl = (_.contains(playlist.tracks, parseFloat(data.song))); 
					return playlist; 
				});
				var output = menutemplates.playlistdialog.render({playlists: playlists, songid: data.song});
				socket.emit('add-playlist-dialog-response', {html: output});
			});
		});
		socket.on('get-playlist-options',			function (data) {
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
		socket.on('change-playlist-privacy', 		function (data) {
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
		socket.on('change-playlist-order', 			function (data) {
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
		socket.on('rename-playlist',				function (data) {
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
		socket.on('delete-playlist', 				function (data) {
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
		socket.on('add-playlist', 					function (data) {
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
		socket.on('add-song-to-playlist', 			function (data) {
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
		socket.on('remove-song-from-playlist', 		function (data) {
			db.getUser(data.token, function(user) {
				db.getPlaylistByUrl(data.url, function(playlist) {
					if (playlist) {
						playlist.tracks = _.reject(playlist.tracks, function(song) {return song == parseFloat(data.songid)});
						db.savePlaylist(playlist);
						db.getSingleTrack(data.songid, function(song) {
							socket.emit('playlist-song-removed', {songid: parseFloat(data.songid), view: data.url, trackcount: playlist.tracks.length, lengthdifference: (0 - song[0].duration)});
						});
					}
				});
			});
		});
		socket.on('update-settings', 				function (data) {
			db.updateSettings(data, function() {
				socket.emit('settings-saved');
			});
		});
		socket.on('request-track-info',				function (data) {
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
		socket.on('add-tracks-to-collection', 		function (data) {
			/*
			* {
			* 	destination: 	'library' or '/u/jonnyburger/p/test-playlist',
			* 	tracks: 		[42789472394, 3142349823749],
			* 	token: 			'fdsjkhfsdkjfhsdkjf',
			* 	type: 			'library' or 'playlist'		
			* }
			*/
			var tmpl 				= notificationtemplates.tracks_added,
				afterUserFetched 	= function(user) {
					data.user = user;
					if (data.user) {
						fetchUserCollections()
					}
					else {
						socket.emit('notification', { html: 'To add tracks you must be logged in. <span data-navigate="/login">Login</span>' })
					}
				},
				fetchUserCollections = function() {
					db.getUserCollections(data.user, getSongs);
				},
				getSongs 		= function(collections) {
					data.collections = collections;
					if (data.tracks != undefined && _.isArray(data.tracks)) {
						if (data.tracks.length == 0) {
							socket.emit('notification', { html: 'You have selected no tracks to add.' });
							return;
						}
						else if (!(data.type == 'library' || data.type == 'playlist')) {
							socket.emit('notification', { html: 'You must add the track to either the library or to a playlist.' });
							return;
						}
						else {
							data.tracks = _.map(data.tracks, function(track) {
								var number = parseFloat(track);
								if (_.isNumber(number)) {
									return parseFloat(number);
								}
								else {
									return null;
								}
							});
						}
						data.tracks = _.compact(data.tracks);
						db.getSongsByIdList(data.tracks, afterSongsByIdListFetched);
					}
				},
				afterSongsByIdListFetched 	= function(songs) {
					data.songs = songs;
					checkForMissingTracksInDb(afterEnoughTrackInfoAvailable);
				},
				checkForMissingTracksInDb = function(callback) {
					if (data.songs.length != data.tracks.length) {
						var notindb = _.clone(data.tracks)
						_.each(data.songs, function(song) {
							notindb = _.without(notindb, song.id);
						});
						itunes.getFromItunes(notindb, function (songs) {
							data.songs = _.union(data.songs, songs);
							callback();
							db.addTracksBulk(songs);
						})
					}
					else {
						callback();
					}
				},
				afterEnoughTrackInfoAvailable = function() {
					data.songs = _.map(data.songs, function(song) {
						if (data.type == 'library') {
							song.inlib = true;
						}
						else {
							song.inlib = _.contains(data.collections.library, song.id)
						}
						return song;
					});
					data.divs = _.map(data.songs, function(song) {
						var info = {}
						info.type 				= data.type;
						info.showartistalbum 	= true;
						info.cd 				= [song];
						info.user 				= data.user;
						info.parsetext 			= helpers.parsetext;
						info.parseduration 		= helpers.parsetime;
						var div = musictemplates.track.render(info);
						return div;
					});
					var output = tmpl.render(data);
					if (data.type == 'library') {
						_.each(data.songs, function (song) {
							data.collections.library.push(parseFloat(song.id));
						});
						data.collections.library = _.uniq(data.collections.library);
						db.saveUserCollections(data.collections, function(collection) {
							socket.emit('tracks-added', { divs: data.divs, position: 'top', notification: output, tracks: _.pluck(data.songs, 'id') });
						});
					}
					else {
						db.getPlaylistByUrl(data.destination, function (playlist) {
							if (playlist) {
								data.playlist = playlist;
								var userplaylists = _.pluck(data.collections.playlists, 'url');

								_.each(data.songs, function(song) {
									if ( _.include(userplaylists, data.destination) && !_.include(data.playlist.tracks, parseFloat(song.id))) {
										playlist.tracks.push(parseFloat(song.id));
									}
								});
								db.savePlaylist(data.playlist, function() {
									var diff = _.reduce(data.songs, function (a,b) { return a + b.duration }, 0);
									socket.emit('multiple-playlist-songs-added', { 
										divs: data.divs, 
										position: data.playlist.newestattop ? 'top' : 'bottom', 
										view: data.destination, trackcount: playlist.tracks.length, 
										lengthdifference: diff, 
										notification: output,
										tracks: _.pluck(data.songs, 'id')
									});
								});
							}
							else {
								socket.emit('notification', { html: 'This playlist does not exist. ' })
							}
						});
					}
				}
			db.getUser(data.token, afterUserFetched);
		});
		socket.on('remove-tracks-from-collection', 	function (data) {
			var tmpl 				= notificationtemplates.tracks_removed,
				afterUserFetched 	= function(user) {
				data.user = user;
				if (data.user) {
					fetchUserCollections()
				}
				else {
					socket.emit('notification', { html: 'To add tracks you must be logged in. <span data-navigate="/login">Login</span>' })
				}
				},
				fetchUserCollections = function() {
					db.getUserCollections(data.user, getSongs);
				},
				getSongs 			 = function(collections) {
				data.collections = collections;
					if (data.tracks != undefined && _.isArray(data.tracks)) {
						if (data.tracks.length == 0) {
							socket.emit('notification', { html: 'You have selected no tracks to remove.' });
							return;
						}
						else if (!(data.type == 'library' || data.type == 'playlist')) {
							socket.emit('notification', { html: 'You must remove the track from either the library or from a playlist.' });
							return;
						}
						else {
							data.tracks = _.map(data.tracks, function(track) {
								var number = parseFloat(track);
								if (_.isNumber(number)) {
									return parseFloat(number);
								}
								else {
									return null;
								}
							});
						}
						data.tracks = _.compact(data.tracks);
						afterEnoughTrackInfoAvailable();
					}
				},
				afterEnoughTrackInfoAvailable = function() {
					var output = tmpl.render(data);
					if (data.type == 'library') {
						_.each(data.tracks, function (id) {
							data.collections.library = _.without(data.collections.library, id)
						});
						data.collections.library = _.uniq(data.collections.library);
						db.saveUserCollections(data.collections, function(collection) {
							socket.emit('tracks-removed', { tracks: data.tracks, notification: output });
						});
					}
					else {
						db.getPlaylistByUrl(data.destination, function (playlist) {
							if (playlist) {
								data.playlist = playlist;
								var userplaylists = _.pluck(data.collections.playlists, 'url');
								_.each(data.tracks, function (song) {
									if (_.include(userplaylists, data.destination)) {
										playlist.tracks = _.without(playlist.tracks, song);
									}
								});
								db.savePlaylist(data.playlist, function() {
									/**
										FIX THIS!!!
									**/
									var diff = 0;
									socket.emit('multiple-playlist-songs-removed', {view: data.destination, trackcount: playlist.tracks.length, lengthdifference: diff, notification: output, tracks: data.tracks});
								});
							}
						})
					}
				}
				db.getUser(data.token, afterUserFetched);
		});
		socket.on('/api/tracks/get', 				function (data) {
			if (data && data.tracks && _.isArray(data.tracks)) {
				db.getSongsByIdList(data.tracks, function (tracks) {
					socket.emit('/api/tracks/get/response', tracks);
				});
			}
		});
};