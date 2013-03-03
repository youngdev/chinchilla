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
	swig 	= require('swig');
/*
	Specifies the parent directory path in a string.
*/
var dirup = __dirname.substr(0, __dirname.length - 7);
var notificationtemplates = {
	track_added: 	swig.compileFile(dirup + '/sites/notifications/track-added.html'),
	track_removed: 	swig.compileFile(dirup + '/sites/notifications/track-removed.html')
}
this.connection = function (socket) {
		socket.emit('connected', {"message": "You are now connected to the socket.io server."});
		/*
			Send a confirmation for a successful connect to a user.
			This is triggered on every site visit.
		*/
		socket.on('load-template', 		function (data) {
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
		socket.on('new-track', 			function (data) {
			var track = data;
			/*
				Add a element where we can store the play count.
			*/
			track.listens = 0;
			db.addTrack(track, function() {
				console.log("Track added successfully.");
			});
		});
		socket.on('new-album', 			function (data) {
			var album = data;
			db.addAlbum(album, function() {
				console.log("Album added successfully.");
			});
		});
		socket.on('add-track',			function (data) {
			db.getUser(data.token, function(user) {
				if (data.destination == 'library' && user) {
					fb.addTrack(data.song, user, function(collection) {
						db.getSingleTrack(data.song.id, function(song) {
							data.song = song[0];
							var notification = notificationtemplates.track_added.render({data: data});
							socket.emit('track-added', notification);
						});
					});
				}
			});
		});
		socket.on('add-tracks', 		function (data) {
			db.getUser(data.token, function(user) {
				if (data.destination == 'library' && user) {
					fb.addTracks(data.songs, user, function(collection) {
						socket.emit('tracks-added', data.songs);
					})
				}
			})
		});
		socket.on('remove-track', 		function (data) {
			db.getUser(data.token, function(user) {
				if (data.destination == 'library' && user) {
					fb.removeTrack(data.song, user, function(collection) {
						db.getSingleTrack(data.song.id, function(song) {
							data.song = song[0];
							var notification = notificationtemplates.track_removed.render({data: data});
							socket.emit('track-removed', notification);
						});
					})
				}
			})
		});
		socket.on('get-contextmenu',	function (data) {
			var tmpl 	= swig.compileFile(dirup + '/sites/contextmenu.html');
			var state 	= data.state;
			var render = function() {
				var output 	= tmpl.render(data);
				socket.emit('contextmenu', {html: output});
			}
			if (state.loggedin) {
				fb.inlib(data.song, data.state.token, function(incollection) {
					data.incollection = incollection;
					render()
				});
			}
			else {
				render()
			}
		});
		socket.on('update-settings', 	function (data) {
			db.updateSettings(data, function() {
				socket.emit('settings-saved');
			});
		});
};