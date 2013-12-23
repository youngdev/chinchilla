var swig 	= require('swig'),
	dirup 	= __dirname.substr(0, __dirname.length - 6),
	cookies = require('cookies'),
	db 		= require('../db/queries'),
	reddit 	= require('../config/reddit'),
	_ 		= require('underscore'),
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
		db.getUserList(afterUserList);
	}
	var afterUserList = function(users) {
		data.userCount = users.length;
		data.users = _.pluck(users, 'username');
		db.getWatchIds(afterWatchIds);
	}
	var afterWatchIds = function(item) {
		data.watchIds = item.values;
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
			if (user.username == 'jonnyburger') {
				callback(user)
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
this.redditadd 		= function(request, response) {
	var afterVerification = function() {
		var id = request.query.id
		if (id) {
			db.addWatchId(id, function() {
				response.redirect('/admin/')
			});
			reddit.observeThread(id);
		}
	}
	admin.auth(request, response, afterVerification, admin.notAuthenticated);
}
this.redditremove	= function(request, response) {
	var afterVerification = function() {
		var id = request.params.id;
		if (id) {
			db.removeWatchId(id, function() {
				response.redirect('/admin/')
			});
		}
	}
	admin.auth(request, response, afterVerification, admin.notAuthenticated);
}