var db 					= require("../db/queries"),
	_					= require("underscore"),
	_s 					= require("underscore.string")
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
var fullyears 			= _.range(1959, 2013);
var years 				= fullyears;
var redditsongs 		= {};
var retrocharts 		= {};
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
					});
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
		setTimeout(function() { getRedditTracks(subreddit) }, 3600000);
	});
}
var getRetroCharts		= function(year, callback) {
	json.get('http://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=Billboard_Year-End_Hot_100_singles_of_' + year + '&rvprop=content&format=json', function(err, json) {
		var page 	= json.query.pages[_.keys(json.query.pages)[0]],
			title 	= page.title,
			revs 	= page.revisions[0]['*'],
			tracks 	= revs.split('|-'),
			charts 	= _.last(_.first(tracks, 102), 100),
			charts  = _.map(charts, function(line) { return line.replace('\n! scope="row" | ', '') }),
			charts  = _.map(charts, function(line) { 
				var split = line.split('"'); 
				return {title: split[1], artist: split[2]} 
			}),
			charts 	= _.map(charts, function(song) {
				if (song.title && song.artist) {
					return {
						title: _s.clean(_.last(song.title.replace(/[[\]]/g,'').split('|'))),
						artist: _s.clean(_.last(song.artist.replace(/[[\]]/g,'').replace('||', '').split('\n')[0].split('|')))
					}
				}
				else {
					return null;
				}
				
			}),
			charts 	= _.compact(charts);
			retrocharts[year] = [];
		function lookUpOne(song) {
			itunes.search(song.title + ' ' + song.artist, {entity: 'song', limit: 1}, function(json) {
				if (json.results.length != 0) {
					var itsong = itunes.remap(json.results[0]);
					retrocharts[year].push(itsong);
					db.addTrack(itsong, function() {
						console.log('Track added through retro charts')
					});
				}
				i++;
				console.log(i)
				if (i == max) {
					callback()
				}
				else {
					lookUpOne(charts[i]);
				}
			});
		}
		var i = 0, max = charts.length
		lookUpOne(charts[i]);

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
this.getYearRange 		= function() {
	return fullyears;
}
getAlbumCovers();
_.each(subreddits, function(subreddit) {
	getRedditTracks(subreddit);
});
var y = 0, max = years.length, retroChartsCallback = function() {
	var table = {
		year: years[y],
		charts: _.pluck(retrocharts[years[y]], 'id')
	}
	db.cacheCharts(table, function() {
		if (y !== max) {
			getRetroCharts(years[y], retroChartsCallback);
		}
		console.log('Table saved.', years[y]);
	});
	y++;
}
db.checkCharts(function(chartscount) {
		var tofetch = _.difference(years ,_.pluck(chartscount, 'year'));
		years = tofetch;
		max   = years.length;
		if (years.length != 0) {
			getRetroCharts(years[y], retroChartsCallback)
		}	
});