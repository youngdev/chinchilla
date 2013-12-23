var SongsCollection, PlaylistCollection
var storeReady = function() {
	SongsCollection = songsdb;
}
var plStoreReady = function() {
	PlaylistCollection = pldb;
}
var songsdb = new IDBStore({storeName: 'songs'}, storeReady),
	pldb 	= new IDBStore({storeName: 'playlists'}, plStoreReady);
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
DB.addYTIDToTrack = function(obj, ytid) {
	if (SongsCollection) {
		songsdb.query(function (tracks) {
			var matches 		= _.map(tracks, function (track) { return track.id == obj.id ? track : null});			
			var flattened 		= _.compact(matches);
			if (flattened.length > 0) {
				var result = flattened[0];
				result.ytid = ytid;
				DB.addTrack(result);
			}
		});
	}
	else {
		setTimeout(function() { DB.addYTIDToTrack(obj) }, 100);
	}
}