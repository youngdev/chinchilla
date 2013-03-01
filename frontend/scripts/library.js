library = {
	add: function(song) {
		socket.emit('add-track', 		{destination: 'library', song: song, token: chinchilla.token});
		markAsInLibrary(song.id);
		$('.library-button').text("Remove from library").removeClass('library-button').addClass('library-remove-button');
	},
	batchAdd: function(songs) {
		socket.emit('add-tracks', 		{destination: 'library', songs: songs, token: chinchilla.token});
		_.each(songs, function(song) {
			markAsInLibrary(song.id);
		});
	},
	remove: function(song) {
		socket.emit('remove-track', 	{destination: 'library', song: song, token: chinchilla.token});
		markAsNotInLibrary(song.id);
		$('.library-remove-button').text("Add to library").removeClass('library-remove-button').addClass('library-button');
		/*
			Remove from view
		*/
		var view = $('#view[data-route="/library"] .song[data-id="' + song.id + '"]').remove();
	}
}
var markAsInLibrary = function(id) {
	$('.song[data-id=' + id + ']').removeClass('not-in-library').addClass('in-library');

}
var markAsNotInLibrary = function(id) {
	$('.song[data-id=' + id + ']').addClass('not-in-library').removeClass('in-library');
}