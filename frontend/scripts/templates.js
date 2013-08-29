_.templateSettings.variable = "tmpl";
templates = {};
templates.buildLibrary = function(data) {
	var template = _.template(
		$('#template-library').html()
	)
	data.coverstack = 	_.first(
							_.pluck(data.tracks, 'image'), 
						9);
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
	data.coverstack = _.first(
							_.pluck(data.tracks, 'image'),
						9);
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
	console.log(data);
	var template = _.template(
		$('#template-contextmenu').html()
	)
	return template(data);
}
templates.buildFilter 			= function() {
	var template = [
		"<div>",
			//"<input type='checkbox'>Hip Hop/Rap",
			"<p style='color: black'>Coming soon!</p>",
		"</div>"
	].join('\n')
	return template
}