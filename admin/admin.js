var swig 	= require('swig'),
	dirup 	= __dirname.substr(0, __dirname.length - 6),
	cookies = require('cookies'),
	db 		= require('../db/queries'),
	admin 	= this;

this.home = function (request, response) {
	var tmpl = swig.compileFile(dirup + '/admin/templates/main.html');
	var output = tmpl.render();
	var data = {};
	var afterVerification = function() {
		db.getSongCount(afterSongCount);
	}
	var afterSongCount = function(count) {
		data.songCount = count;
		db.getUserCount(afterUserCount);
	}
	var afterUserCount = function(count) {
		data.userCount = count;
		render();
	}
	var render = function() {
		response.end(tmpl.render(data));
	}
	admin.auth(request, response, afterVerification, admin.notAuthenticated);
}

this.auth = function(request, response, callback, failCallback) {
	var cookie = new cookies(request, response),
		token = cookie.get('token');
	if (token) {
		db.getUser(token, function (user) {
			callback(user);
			if (user.username == 'jonnyburger') {
				callback()
			}
			else {
				failCallback(response);
			}
		});
	}
	else {
		failCallback(response);
	}
}

this.notAuthenticated = function(response) {
	response.redirect('/')
}