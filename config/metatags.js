var metatags 	= this,
	db 			= require('../db/queries'),
	_ 			= require('underscore');

this.get = function (request, callback) {
	switch (request.route.path) {
		case '/song/:id':
			metatags.song(request.params, callback);
			break;
		default: 
			callback('');
	}
}

this.song = function(params, callback) {
	db.getSingleTrack(parseFloat(params.id), function (song) {
		if (song.length == 0) {
			callback('')
		}
		else {
			var output = _.template(
				[
					"<meta property='og:image' content='<%- image %>'>",
					"<meta property='og:title' content='<%- name %> - <%- artist %>'>",
					"<meta property='og:url' content='http://tunechilla.com/song/<%- id %>'>",
					"<meta property='og:type' content='music.song'>",
					"<meta property='og:site_name' content='Tunechilla'>",
					"<meta property='og:description' content='Listen for free on Tunechilla'>",
				].join('\n'),
				song[0]
			);
			callback(output);
		}
	});
}