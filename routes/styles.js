/*
	Require the Swig module for templating.
*/
var swig   = require('swig'),
	_      = require('underscore')
	dbquery = require('../db/queries')

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