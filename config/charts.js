/*
	load the module that allows you to request JSON.
*/
var json    = require("jsonreq"),
	_       = require("underscore"),
	db      = require("../db/queries"),
    charts  = this;
/*
	Load every 24h
*/
this.update = function() {
	var limit = 100;
	json.get("https://itunes.apple.com/us/rss/topsongs/limit=" + limit + "/explicit=true/json", function(err, result) {
		if (!err) {
			var songs = result.feed.entry;
			var songids = [], pureids = [];
			_.each(songs, function(entry) {
				/*
					Merge all songids together
				*/
				var id = parseFloat(entry.id.attributes['im:id']);
				songids.push({preview: entry.link[1].attributes.href});
				pureids.push(id);
			});
			db.getSongsByIds(songids, function(items) {
				/*
					TODO: The order doesn't seem right.
				*/
				console.log(items.length);
				if (items.length < limit) {
					var dbtracks = [];
					_.each(items, function(item) {
						dbtracks.push(item.id);
					});
					var tofetch = (_.reject(pureids, function(item) { return _.contains(dbtracks, item) })).join(",");
					/*
						Fetch missing track
					*/
					json.get("https://itunes.apple.com/lookup?id=" + tofetch + "&entity=song", function(err, result) {
						if (!err) {
							var toadd = result.results.length;
							_.each(result.results, function(song) {
								var track = {
									artistid: song.artistId,
									albumid: song.collectionId,
									id: song.trackId,
									album: song.collectionName,
									artist: song.artistName,
									preview: song.previewUrl,
									image: song.artworkUrl100,
									name: song.trackName,
									release: song.releaseDate.substr(0,4), 
									explicit: song.collectionExplicitness == "explicit" ? true : false,
									genre: song.primaryGenreName,
									listens: 0,
									duration: song.trackTimeMillis,
									cdinalbum: song.discNumber,
									cdcount: song.discCount,
									tracks: song.trackCount,
									numberinalbum: song.trackNumber
								};
								items.push(track);
								db.addTrack(track, function() {
									toadd--;
									if (toadd === 0) {
										charts.update();
									}
								});
							});
						}
					});
				}
				else {
					/*
						Order the tracks right
					*/
					var ordered = [];
					_.each(pureids, function(track, key) {
						ordered[key] = _.find(items, function(song) { return track == song.id });
					});
					charts.table = ordered;
					setTimeout(charts.update, 120000);
				}
			});
		}
	});
};
this.table = [];