libdom = {
	markAsNotInLibrary: function(id) {
		$('.song[data-id=' + id + ']').addClass('not-in-library').removeClass('in-library');
	},
	markAsInLibrary: function(id) {
		var song = $('.song[data-id=' + id + ']')
		song.removeClass('not-in-library').addClass('in-library');
	}
}