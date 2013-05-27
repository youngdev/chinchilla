_.templateSettings.variable = "tmpl";
templates = {};
templates.buildLibrary = function(data) {
	var template = _.template(
		$('#template-library').html()
	)
	data.coverstack = 	_.first(
							_.pluck(data.tracks, 'image'), 
						10);
	data.showartistalbum = true;
	data.tracklist 	= templates.buildTrackList(data)
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