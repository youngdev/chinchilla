/*
	Load dependencies. 
	-FS is used for template fetching.
*/
var fs = require('fs'),
	db = require('../db/queries')
/*
	Specifies the parent directory path in a string.
*/
var dirup = __dirname.substr(0, __dirname.length - 7);

this.connection = function (socket) {
		socket.emit('connected', {"message": "You are now connected to the socket.io server."});
		/*
			Send a confirmation for a successful connect to a user.
			This is triggered on every site visit.
		*/
		socket.on('load-template', function (data) {
			/*
				Templates are HTML strings with place holders that are used on the client-side and on the server-side.
				This automates the process of keeping both versions up to date.
			*/
			var templatename = data.name,
				filename     = dirup + '/sites/' + templatename + ".html"
			/*
				Read the template, get it from the file system. For example: templatename is "album". Get /sites/album.html
			*/
			fs.readFile(filename, "utf-8", function (err, data) {
				/*
					Error handling if somebody tries to send a malicious request via console.
				*/
				if (err) {
					socket.emit('error', 	{'message': 'The file path does not exist.'})
				}
				else {
					socket.emit('template', {'template': data});
				}
			})   
		});
		socket.on('new-track', function (data) {
			var track = data;
			/*
				Add a element where we can store the play count.
			*/
			track["listens"] = 0;
			db.addTrack(track, function() {
				console.log("Track added successfully.");
			})
		})
		socket.on('new-album', function (data) {
			var album = data;
			db.addAlbum(album, function() {
				console.log("Album added successfully.")
			})
		})
}