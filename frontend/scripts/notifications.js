notifications = {
	create: function(html) {
		/*
			Create the div
		*/
		var not = $('<div>', {
			class: 'notification'
		})
		/*
			Set the given HTML as content
		*/
		.html(html)
		/*
			Add to the notifications list
		*/
		.prependTo('#notifications')
		setTimeout(function() {
			$(not).animate({opacity: 0.001}, function() {
				$(this).slideUp();
			})
		}, 3000);
	}
} 