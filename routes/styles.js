/*
	Require the Swig module for templating.
*/
var swig   	= require('swig'),
	_      	= require('underscore'),
	dbquery = require('../db/queries'),
	fs 		= require('fs');

_.str = require('underscore.string')
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');
/*
	This is the current directory without the "/routes" at the end, so basically the parent directory
*/
var dirup = __dirname.substr(0, __dirname.length - 7);

this.get = function (request, response) {
	response.setHeader("Content-Type", "text/css");
	response.sendfile(dirup + "/frontend/css/" + request.params.filename + ".css");
}
this.images = {
	get: function(request, response) {
		response.setHeader("Content-Type", "image/png");
		response.sendfile(dirup + "/frontend/images/" + request.params.filename + ".png");
	}
}
this.svg = {
	get: function(request, response) {
		response.setHeader("Content-Type", "image/svg+xml");
		var filename = request.params.filename;
		response.sendfile(dirup + "/frontend/svg/" + filename + ".svg");
	},
	getColor: function(request, response) {
		response.setHeader("Content-Type", "image/svg+xml");
		var filename = request.params.filename;
		if (filename == 'heart') {filename = 'heart-white'}
		fs.readFile(dirup + "/frontend/svg/" + filename + ".svg", 'utf8', function(err, data) {
			if (!err) {
				if (filename == 'heart-white') {
					response.end(data);
				}
				else {
					var data = data.replace(/fill="#000000"/, '');
					var data = data.replace(/fill="none"/g,	'');
					var data = data.replace(/fill="red"/g, '');
					var data = data.replace(/flood-color='red'/, "flood-color='black'");
					var data = data.replace(/<polygon/g, 	'<polygon fill="white"');
					var data = data.replace(/<path/g,		'<path fill="white"');
					var data = data.replace(/<ellipse/g,	'<ellipse fill="white"');
					var data = data.replace(/<circle/g, 		'<circle fill="white"');
					response.end(data);
				}
				
			}
		})
	}
}