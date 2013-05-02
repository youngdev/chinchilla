library = {
	add: function(song) {
		var socketdata = {
			destination: 'library',
			tracks: [song.id],
			token: chinchilla.token,
			type: 'library'
		}
		socket.emit('add-tracks-to-collection', socketdata);
		libdom.markAsInLibrary(song.id);
		notifications.create('Adding...');
		$('.library-button').text("Remove from library").removeClass('library-button').addClass('library-remove-button');
	},
	batchAdd: function(songs) {
		var socketdata = {
			destination: 'library',
			tracks: _.pluck(songs, 'id'),
			token: chinchilla.token,
			type: 'library'
		}
		socket.emit('add-tracks-to-collection', socketdata);
		notifications.create('Adding...');
		_.each(songs, function(song) {
			libdom.markAsInLibrary(song.id);
		});
	},
	remove: function(song) {
		socket.emit('remove-track', 	{destination: 'library', song: song, token: chinchilla.token});
		libdom.markAsNotInLibrary(song.id);
		notifications.create('Removing...')
		$('.library-remove-button').text("Add to library").removeClass('library-remove-button').addClass('library-button');
		/*
			Remove from view
		*/
		var view = $('#view[data-route="/library"] .song[data-id="' + song.id + '"]').remove();
	}
}