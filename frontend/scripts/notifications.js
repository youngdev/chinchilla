notifications = {
	create: function(html) {
		/*
			Set the given HTML as content
		*/
		$('#statusbar').html(html + ' <span class="close-notification">Dismiss</span>').css('display', 'inline');
		clearTimeout(notifications.timeout);
		notifications.timeout = setTimeout(function() {
			$('#statusbar').fadeOut()
		}, 5000);
	},
	timeout: setTimeout(function() {}, 999999999)
} 