notifications = {
	create: function(html) {
		/*
			Set the given HTML as content
		*/
		$('#statusbar').html(html + ' <span class="close-notification">Dismiss</span>').css('display', 'inline');
	}
} 