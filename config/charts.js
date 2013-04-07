/*
	load the module that allows you to request JSON.
*/
var json    = require("jsonreq"),
	_       = require("underscore"),
	itunes  = require("../config/itunes"),
	db      = require("../db/queries"),
    charts  = this;
this.refresh = function() {
		var notAllTracksInDB = function(items) {
			tracksInDB = _.pluck(items, 'id');
			var tofetch = _.reject(charts.iTunesIDs, function (item) { return _.contains(tracksInDB, item) }).join(",");
			json.get("https://itunes.apple.com/lookup?id=" + tofetch + "&entity=song", function(err, result) {
				if (!err) {
					_.each(result.results, function(track) {
						var song = itunes.remap(track);
						items.push(song);
					});
					AllTracksInDB(items)
				}
			});
		},
		AllTracksInDB = function(items) {
			charts.cache = items;
			afterAllTracksInDB();
		},
		afterAllTracksInDB = function() {
			console.log('All tracks in cache!', charts.cache.length);
			setTimeout(this.refresh, 3600000)
		},
		afterDBQuery = function(items) {
			if (items.length < charts.limit) {
				notAllTracksInDB(items);
			}
			else {
				AllTracksInDB(items);
			}
		}
	json.get("https://itunes.apple.com/us/rss/topsongs/limit=" + charts.limit + "/explicit=true/json", function(err,result) {
		if (!err) {
			var songs 			= result.feed.entry;
			charts.iTunesIDs 	= _.map(songs, function(entry) {return parseFloat(entry.id.attributes['im:id'])}); 
			db.getSongsByIdList(charts.iTunesIDs, afterDBQuery);
		}
	});
}
this.getCharts = function(callback) {
	var topsongs = charts.cache,
		query 	 = _.pluck(topsongs, 'id'),
		haveytid = _.reject(topsongs, function(item) {return item.ytid == undefined}),
		notAllTracksInDB = function(items) {
			tracksInDB = _.pluck(items, 'id');
			var tofetch = _.reject(charts.iTunesIDs, function (item) { return _.contains(tracksInDB, item) }).join(",");
			json.get("https://itunes.apple.com/lookup?id=" + tofetch + "&entity=song", function(err, result) {
				if (!err) {
					_.each(result.results, function(track) {
						var song = itunes.remap(track);
						items.push(song);
					});
					AllTracksInDB(items);
				}
			});
		},
		AllTracksInDB = function(items) {
			charts.cache = items;
			afterAllTracksInDB(items);
		},
		afterAllTracksInDB = function(items) {
			callback(items);
		},
		afterDBQuery = function(items) {
			if (items.length < charts.limit) {
				notAllTracksInDB(items)
			}
			else {
				AllTracksInDB(items)
			}
		}
	if (haveytid.length < charts.limit) {
		db.getSongsByIdList(charts.iTunesIDs, afterDBQuery);
	}
	else {
		callback(haveytid)
	}

}
this.iTunesIDs 	= [];
this.cache 		= [];
this.table = [];
this.limit = 100;