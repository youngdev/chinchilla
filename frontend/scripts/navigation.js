routes = {
	'/charts':              	function(match) {
		views.charts.load();
	},
	'/album/:id':           	function(match) {
		views.album.load(match[1]);
	},
	'/about':               	function(match) {
		views.about.load();
	},
    '/track/:id':           	function(match) {
        views.track.load(match[1]);
    },
    '/register':        		function(match) {
        registration.facebook.load();
    },
    '/library': 				function(match) {
    	views.library.load(match[1]);
    },	
    'settings': 				function(match) {
    	views.settings.get();
    },
	'/home':                	function(match) {
		views.main.get();
	},
	'/artist/:id': 				function(match) {
		views.artist.load(match[1]);
	},
	'/lyrics/:id': 				function(match) {
		views.lyrics.load(match[1]);
	},
	'/u/:name/p/:name': 		function(match) {
		views.playlist.load(match[0]);
		console.log(match)
	},
	'/reddit': 					function(match) {
		views.reddit.load();
	},
	'/': 						function(match) {
		views.main.get();
	},
	'/song/:id': 				function(match) {
		views.song.load(match[1]);
	},
	'/retro-charts/:id':		function(match) {
		views.retrocharts.load(match[1]);
	}
};
$(document)
.on('ready', function() {
	var pathname            = window.location.pathname;
	navigation.to(pathname);
})
.on('mousedown', '[data-navigate]', function(e) {
	var pathname            = $(this).attr('data-navigate');
	e.preventDefault();
	navigation.to(pathname);
});
var showSpinner = function() {
	var spinner = loader.spinner();
	$("#view").html(spinner);
};
loader = {
	spinner: function() {
		return '<div class="loading-indicator"><div class="spinner"></div></div>';
	}
}
navigation = {
	to: function(path, prevent) {
		$.each(routes, function (route, callback) {
			var routeMatcher	= new RegExp(route.replace(/:[name]+/g, '([\\a-z0-9-]+)').replace(/:[id]+/g, '([\\d]+)')),
				match           = path.match(routeMatcher);
			if ((match && match != '/') || (match == '/' && path == '/')) {
				callback(match);
				showSpinner();
				var method = prevent ? 'replaceState' : 'pushState';
				history[method](null, null, path);
				$('#view').attr('data-route', path);
			}
		});
		/*
			Highlight current view in menu
		*/
		var selector = '[data-navigate="' + path + '"]';
		$('.menuselected').removeClass('menuselected');
		$(selector).addClass('menuselected');
	}
};
window.onpopstate = function() {
	var pathname			= window.location.pathname;
	navigation.to(pathname, true);
}