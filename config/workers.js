var db 					= require("../db/queries"),
	_					= require("underscore"),
	itunes 				= require("../config/itunes"),
	json 				= require("jsonreq"),
	helpers 			= require("../frontend/scripts/helpers").helpers
var covers 				= [];
var subreddits 			= [
	'/r/music',
	'/r/country',
	'/r/DubStep',
	'/r/punk',
	'/r/metal',
	'/r/trance',
	'/r/ElectronicMusic',
	'/r/classicalmusic',
	'/r/AlternativeRock',
	'/r/Blues',
	'/r/house',
	'/r/gamemusic',
	'/r/jazz',
].sort();
var redditsongs 		= {};
var getAlbumCovers 		= function() {
	db.getAlbumCovers(100, function(items) {
		covers 			= _.shuffle(items);
		setTimeout(getAlbumCovers, 86400000);
	});
}
var getRedditTracks 	= function(subreddit) {
	json.get('http://www.reddit.com' + subreddit + '/search.json?q=site%3Ayoutube.com&restrict_sr=on&sort=top&t=week', function(err, json) {
		redditsongs[subreddit] = [];
		var songs = json.data.children;
		var songs = _.filter(songs, function (song) { return song.data.domain == 'youtube.com'});
		//var songs = _.filter(songs, function (song) { return song.data.title.indexOf(" - ") != -1});
		var songs = _.filter(songs, function (song) { return song.data.media });
		var i = 0; var max  = songs.length-1;
		function lookupitunes(song) {
			var title = song.data.title;
			var title = (title.indexOf('(') != -1) ? title.substr(0, title.indexOf('(')) : title;
			var title = (title.indexOf('[') != -1) ? title.substr(0, title.indexOf('[')) : title;
			itunes.search(title, {entity: 'song', limit: 1}, function(json) {
				if (json.results.length != 0) {
					var dbsong = itunes.remap(json.results[0]);
					dbsong.ytid = song.data.media.oembed.url.substr(-11);
					redditsongs[subreddit].push({
						song: dbsong,
						upvotes: song.data.score,
						hqimg: helpers.getHQAlbumImage(dbsong, 200)
					});
					db.addTrack(dbsong, function() {
						console.log("Track added through " + subreddit + ". ")
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
		setTimeout(function() { getRedditTrack(subreddit) }, 3600000);
	});
}
this.returnAlbumCovers	= function() {
	return covers;
}
this.returnRedditSongs 	= function(subreddit) {
	return redditsongs[subreddit];
}
this.returnSubreddits 	= function() {
	return subreddits;
}
getAlbumCovers();
_.each(subreddits, function(subreddit) {
	getRedditTracks(subreddit);
});