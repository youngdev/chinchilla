var swig 	= require('swig'),
	dirup 	= __dirname.substr(0, __dirname.length - 6),
	cookies = require('cookies'),
	db 		= require('../db/queries'),
	admin 	= this;

this.home = function (request, response) {
	var tmpl = swig.compileFile(dirup + '/admin/templates/main.html');
	var output = tmpl.render();
	var afterVerification = function(user) {
		if (user.username == 'jonnyburger') {
		}
		else {
			response.end('You cannot access the admin section.')
		}
	}
	admin.auth(request, response, afterVerification);
}

this.auth = function(request, response, callback) {
	var cookie = new cookies(request, response);
	db.getUser(cookie.get('token'), function(user) {
		callback(user);
	});
}