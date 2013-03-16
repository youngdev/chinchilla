var db 					= require("../db/queries"),
	_					= require("underscore"),
	itunes 				= require("../config/itunes"),
	json 				= require("jsonreq"),
	helpers 			= require("../frontend/scripts/helpers").helpers
var covers 				= [];
var redditsongs 		= [];
var getAlbumCovers 		= function() {
	db.getAlbumCovers(100, function(items) {
		covers 			= _.shuffle(items);
		setTimeout(getAlbumCovers, 86400000);
	});
}
var getRedditTracks 	= function() {
	json.get('http://www.reddit.com/r/music/top/.json?t=week', function(err, json) {
		redditsongs = [];
		var songs = json.data.children;
		var songs = _.filter(songs, function(song) { return song.data.domain == 'youtube.com'});
		var songs = _.filter(songs, function(song) { return song.data.title.indexOf(" - ") != -1});
		var i = 0; var max  = songs.length-1;
		function lookupitunes(song) {
			itunes.search(song.data.title, {entity: 'song', limit: 1}, function(json) {
				if (json.results.length != 0) {
					var dbsong = itunes.remap(json.results[0]);
					dbsong.ytid = song.data.media.oembed.url.substr(-11);
					redditsongs.push({
						song: dbsong,
						upvotes: song.data.score,
						hqimg: helpers.getHQAlbumImage(dbsong, 200)
					});
					db.addTrack(dbsong, function() {
						console.log("Track added through /r/music. ")
					})
					i++;
					if (i != max) {
						lookupitunes(songs[i]);
					}
					
				}
				else {
					i++;
					if (i != max) {
						lookupitunes(songs[i]);
					}
					
				}
			});
		}
		lookupitunes(songs[i]);
		setTimeout(getRedditTracks, 3600000);
	});
}
this.returnAlbumCovers	= function() {
	return covers;
}
this.returnRedditSongs 	= function() {
	return redditsongs;
}
getAlbumCovers();
getRedditTracks();