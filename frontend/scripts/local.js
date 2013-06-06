var SongsCollection;
var storeReady = function() {
	SongsCollection = songsdb;
}
var songsdb = new IDBStore({storeName: 'songs'}, storeReady);
DB = {};
DB.getTracks = function(obj) {
	if (SongsCollection) {
		songsdb.query(function (tracks) {
			var matches 		= _.map(tracks, function (track) { return _.contains(obj.ids, track.id) ? track : null});
			var flattened  		= _.compact(matches);
			var withinlibdata	= _.map(flattened, function(track) { track.inlib = _.contains(chinchilla.library, track.id); return track });
			obj.callback(withinlibdata);
		});
	}
	else {
		setTimeout(function() { DB.getTracks(obj) }, 100);
	}
	
}
DB.addTrack = function(obj) {
	if (SongsCollection) {
		songsdb.put(obj);
	}
	else {
		setTimeout(function() { DB.addTrack(obj) }, 100);
	}
}
