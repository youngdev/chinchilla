routes = {
	'/artist/:id':          function(match) {
		views.artist.load(match[1]);
	},
	'/charts':              function(match) {
		views.charts.load();
	},
	'/album/:id':           function(match) {
		views.album.load(match[1]);
	},
	'/about':               function(match) {
		views.about.load();
	},
    '/track/:id':           function(match) {
        views.track.load(match[1]);
    },
    '/register':        	function(match) {
        registration.facebook.load();
    },
    '/library': 			function(match) {
    	views.library.get(match[1]);
    },
    'settings': 			function(match) {
    	views.settings.get();
    },
	'/':                    function(match) {

	}
};
$(document)
.on('ready', function() {
	var pathname            = window.location.pathname;
	navigation.to(pathname);
})
.on('click', '[data-navigate]', function(e) {
	var pathname            = $(this).attr('data-navigate');
	e.preventDefault();
	navigation.to(pathname);
});
var showSpinner = function() {
	var spinner = '<div class="loading-indicator"><div class="spinner"></div></div>';
	$("#view").html(spinner);
};
navigation = {
	to: function(path, prevent) {
		$.each(routes, function (route, callback) {
			var routeMatcher	= new RegExp(route.replace(/:[name]+/g, '([\\a-z-]+)').replace(/:[id]+/g, '([\\d]+)')),
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