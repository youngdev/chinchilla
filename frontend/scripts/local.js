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
DB.getPlaylist = function(obj) {
	if (PlaylistCollection) {
		pldb.query(function (playlists) {
			var matches			= _.map(playlists, function (playlist) { return _.contains(obj.urls, playlist.url) ? playlist : null });
			var flattened 		= _.compact(matches);
			obj.callback(flattened[0]);
		});
	}
	else {
		setTimeout(function() { DB.getPlaylist(obj) }, 100);
	}
}
DB.addPlaylist = function(obj) {
	if (PlaylistCollection) {
		pldb.put(obj);
	}
	else {
		setTimeout(function() { DB.addPlaylist(obj) }, 100);
	}
}