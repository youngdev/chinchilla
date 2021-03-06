_.templateSettings.variable = "tmpl";
templates = {};
templates.buildLibrary = function(data) {
	var template = _.template(
		$('#template-library').html()
	)
	data.coverstack = 	helpers.coverArrayToHQ(
						_.first(_.pluck(data.tracks, 'image'),4)
					, 225)
	data.showartistalbum = true;
	data.rawduration = _.reduce(data.tracks, function(a, b) { return a + parseFloat(b.duration) }, 0)
	data.duration = helpers.parsehours(data.rawduration);
	data.trackcount = data.tracks.length;
	data.tracks = _.map(data.tracks, function(song) { song.inlib = true; return song; });
	data.tracklist 	= templates.buildTrackList(data);
	return template(data);
}
templates.buildPlaylist = function(data) {
	var template = _.template(
		$('#template-playlist').html()
	)
	data.coverstack = helpers.coverArrayToHQ(
						_.first(_.pluck(data.tracks, 'image'),4)
					, 225)
	data.showartistalbum = true;
	data.tracklist = templates.buildTrackList(data);
	data.playlist.rawduration = _.reduce(data.tracks, function(a, b) { return a + parseFloat(b.duration) }, 0)
	data.playlist.duration = helpers.parsehours(data.playlist.rawduration);
	data.playlist.trackcount = data.tracks.length;
	return template(data);
}
templates.buildTrackList = function(data) {
	data.album = {cds: [[data.tracks]]}
	var template = _.template(
		$('#template-tracklist').html()
	)
	return template(data)
}
templates.buildSongsInList = function(tracks, flags) {
	data = {cd: tracks}
	var template = _.template(
		$('#template-song').html()
	)
	$.each(flags, function(key, val) {
		data[key] = val;
	})
	return template(data);
}
templates.buildSongContextMenu = function(data) {
	var template = _.template(
		$('#template-contextmenu').html()
	)
	return template(data);
}
templates.buildFilter 			= function(obj) {
	var afterTracksFetched = function(tracks) {
		var genres = _.groupBy(tracks, function (track) { return track.genre });
		var template = $('#template-filter').html();
		var dropdownfilter = $('.filter-dropdown');
		dropdownfilter.html(
			_.template(template, {genres: genres})
		);
		_.each($('.filter-genre'), function (filter) {
			$(filter).on('change', function() {
				var activated = _.map($('.filter-genre:checked'), function (genre) { return genre.dataset.genre });
				var songs = $('[data-represents="' + obj.list + '"] .song');
				if (activated.length == 0) {
					$(songs).show();
				}
				else {
					_.each(songs, function (song) {
						if (_.contains(activated, song.dataset.genre)) {
							$(song).show();
						}
						else {
							$(song).hide();
						}
					});
				}
			});
		})
	}
	if (obj.list == '/library') {
		DB.getTracks({ids: chinchilla.library, callback: afterTracksFetched});
	}
	else {
		DB.getTracks({ids: _.where(chinchilla.playlists, {url: obj.list})[0].tracks, callback: afterTracksFetched});
	}
}