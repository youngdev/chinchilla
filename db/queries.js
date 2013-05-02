var mongo       = require("mongoskin"),
	auth        = require("../auth/auth"),
	_			= require("underscore"),
	connection  = mongo.db(auth.auth, {safe: true}),
    options     = {safe: true, upsert: true},
    standards   = require("../config/standards");
/*
	Get matching artists.
	Example structure of an artist:
	{
		"name": "Favorite", --> name of the artist
        "id": 5078430       --> iTunes ID of the artist.
    }
*/
this.getArtist 				= function(artistid, callback) 	{
	connection.collection("artists").find({"id": parseFloat(artistid)}).toArray(function(err, items) {
        if (!err) {
            callback(items);
        }
	});
};
/*
	Get matching albums from an artist.
	Example structure of an album:
	{
		"artist": "Casper, Favorite, Kollegah & Shiml",     --> Name of the artists. Maybe need to splice them?    
        "released": 2009,                                   --> Release year
        "tracks": 18,                                       --> number of tracks
        "image": "http://a1964.......",                     --> cover image. 100x100 format
        "artistid": 62791592,                               --> iTunes ID of artist
        "id": 311797472,                                    --> iTunes ID of album
        "explicit": true,                                   --> does it include the word fuck? (true | false)
        "name": "Chronik II",                               --> album name
        "tracklist": [                                      --> ID's of track names
            311797587,
            311797659,
            311797668,
               .......
        ]
    }
*/
this.getAlbums 				= function(artistid, callback) 	{
	connection.collection("albums").find({"artistid": parseFloat(artistid)}, {sort:[['release', -1]]}).toArray(function(err, items) {
        if (!err) {
            callback(items);
        }
	});
};
/*
	Get track by a artist. Track structure:
	{
		"artistid": 5078430,
		"albumid": 433611130,
		"id": 433611169,
		"artist": "Favorite",
		"album": "Christoph Alex",
		"name": "F.A.V. 2011",
		"preview": "http://a1916.phobos.apple.com/us/r1000/064/Music/1d/d8/87/mzi.hriidmxd.aac.p.m4a",
		"image": "http://a608.phobos.apple.com/us/r1000/069/Music/22/4f/6a/mzi.dnbcjybx.100x100-75.jpg",
		"release": "2011-05-06T07:00:00Z",
		"explicit": true,
		"cdcount": 2,
		"cdinalbum": 1,
		"tracks": 16,
		"numberinalbum": 2,
		"duration": 197920,
		"genre": "Hip Hop/Rap",
		"listens": 0,
		"ytid": "fsdfs-fssSfs" //Optional!
	}
*/
this.getTracks      		= function(artist, callback) 	{
	connection.collection("tracks").find({"artist": artist}).toArray(function(err, items) {
        if (!err) {
            callback(items);
        }
	});
};
this.getSongsByArtistId 	= function(artistid, callback) {
	connection.collection("tracks").find({"artistid": artistid}).toArray(function(err, items) {
		if (!err) {
			callback(items);
		}
	});
}
this.getSingleTrack 		= function (id, callback) 		{
    connection.collection("tracks").find({"id": parseFloat(id)}).toArray(function(err, item) {
        if (!err) {
            callback(item);
        }
    });
};
this.findOneTrack 			= function(id, callback) 		{
	connection.collection("tracks").findOne({id: parseFloat(id)}, function(err, item) {
		if (!err) {
			callback(item);
		}
	});
}
this.getSingleAlbum 		= function(albumid, callback) 	{
	/*
		Convert albumid from a number into a string
	*/
	var albumnumber = parseFloat(albumid);
	connection.collection("albums").find({id: albumnumber}).toArray(function(err, items) {
        if (!err) {
           callback(items); 
        }
	});
};
this.getTracksFromAlbum 	= function(albumid, callback) 	{
	/*
		Convert albumid from anumber into a string
	*/
	var albumnumber = parseFloat(albumid);
	connection.collection("tracks").find({"albumid": albumnumber}).toArray(function(err, items) {
        if (!err) {
            callback(items);
        }
	});
};
this.addTrack				= function(track, callback) 	{
	connection.collection("tracks").update({id: track.id}, track, options, function(err) {
		if (err) {
			console.log(err);
		}
		else {
			callback();
		}
	});
};
this.addYTID 				= function(track, callback) 	{
	connection.collection("tracks").update({id: track.id}, { $set: {ytid: track.ytid} }, {safe: true, upsert: false},  function(err) {
		if (!err) {
			callback();
		}
	});
}
this.addTracksBulk 			= function(tracks, callback)	{
	connection.collection("tracks").insert(tracks, options, function(err) {
		if (!err && callback) {
			callback();
		}
	});
}
this.addAlbum				= function(album, callback) 	{
	connection.collection("albums").update({id: album.id}, album, options, function(err) {
		if (err) {
			console.log(err);
		}
		else {
			callback();
		}
	});
};
this.addArtist				= function(artist, callback) 	{
	connection.collection("artists").insert(artist, options, function(err) {
		if (!err && callback) {
			callback();
		}
	});
};
this.getSongsByQuery  		= function(query, callback) 	{
	connection.collection("tracks").find({$or: query}).toArray(function(err, items) {
		if (!err) {
            callback(items);
		}
	});
};
this.getSongsByIdList		= function(ids, callback) 		{
	var queries = [];
	_.each(ids, function(id) {
		queries.push({id: id});
	});
	connection.collection("tracks").find({$or: queries}).toArray(function(err, items) {
		if (!err) {
			/*
				Sort by time added

			*/
			var songs = [];
			_.each(ids, function(id) {
				var song = _.find(items, function(item) { return item.id == id });
				if (song) {
					songs.push(song);
				}
			});
			callback(songs);
		}
	})
}
this.updateArtist   		= function(info) {
	connection.collection("artists").update({id: info.id}, info, options);
};
this.addUser         		= function(user, callback) 		{
    connection.collection("users")	.find({id: user.id}).toArray(function(err, items) {
    	if (!err) {
    		var result 		= (items.length != 0) ? items[0] : user;
    		result.token 	= user.token;
    		connection.collection("users").update({id: user.id}, result, options, function(err) {
    			if (!err) {
    				callback()
    			}
    		}); 
    	}
    });
};
this.getUser		 		= function(token, callback) 	{
	connection.collection("users")	.find	({token: token}).toArray(function(err, items) {
		if (!err) {
			var user = (items.length != 0) ? items[0] : null
			callback(user);
		}
	})
}
this.getUserCollections 	= function(user, callback) 		{
	connection.collection("libraries").find({id: user.id}).toArray(function(err, item) {
		if (!err) {
			if (item.length === 0) {
				var collections = {
					library: 	[],
					starred: 	[],
					playlists: 	[],
					id: 		user.id,
					settings: 	standards.settings, 
				}
			}
			else {
				var collections = item[0]
			}
			callback(collections)
		}
	})
}
this.saveUserCollections	= function(coll, callback) 		{
	connection.collection("libraries").update({id: coll.id}, coll, options, function(err) {
		if (!err) {
			callback(coll);
		}
	});
}
this.updateSettings			= function(data, callback)		{
	connection.collection("users"). update({token: data.token}, {
		$set: {
			settings: data.settings
		}
	}, options, function(err) {
		if (!err) {
			callback();
		}
	});
}
this.getAlbumCovers			= function(limit, callback) 	{
	connection.collection("albums").find({}, {limit: 100}).toArray(function(err, items) {
		if (!err) {
			callback(items)
		}
	})
}
this.createPlaylist 		= function(playlist, callback) 	{
	connection.collection("playlists").insert(playlist, options, function(err) {
		if (!err && callback) {
			callback();
		}
	})
}
this.getPlaylist 			= function(playlist, callback) 	{
	connection.collection("playlists").findOne({'url': playlist}, function(err, item) {
		if (!err && callback) {
			callback(item);
		} 
	})
}
this.updatePlaylist 		= function(oldname, name, url, callback) {
	connection.collection("playlists").update({'url': oldname}, {$set: {url: url, name: name}}, function(err, item) {
		if (!err && callback) {
			callback(item);
		}
	})
}
this.removePlaylist 		= function(url, callback) {
	connection.collection("playlists").remove({url: url}, options, function(err, item) {
		if (!err && callback) {
			callback({fail: false});
		}
	});
}
this.getPlaylistsFromUserId = function(id, callback) {
	connection.collection("playlists").find({owner: id}).toArray(function(err, items) {
		callback(items);
	});
}
this.getPlaylistByUrl 		= function(url, callback) {
	connection.collection("playlists").findOne({url: url}, function(err, item) {
		callback(item);
	});
}
this.savePlaylist 			= function(playlist, callback) {
	connection.collection("playlists").update({url: playlist.url}, {$set: {tracks: playlist.tracks, 'public': playlist['public'], newestattop: playlist.newestattop}}, function(err) {
		if (callback && !err) {
			callback();
		}
	});
}
this.saveFreebaseInfo 		= function(artist, callback) {
	connection.collection("artists").update({id: artist.id}, {$set: {freebase: artist.freebase}}, function() {})
}
this.cacheCharts 			= function(chart, callback) {
	connection.collection("charts").update({year: chart.year}, chart, options, function(err) {
		if (!err) {
			callback();
		}
	});
}
this.checkCharts			= function(callback) {
	connection.collection("charts").find({}, {limit: 100}).toArray(function(err, items) {
		if (!err) {
			callback(items)
		}
	});
}
this.getRetroCharts 		= function(year, callback) {
	var year = (1900 < parseFloat(year) < 2020) ? parseFloat(year) : 1959;
	connection.collection("charts").findOne({year: year}, function(err, chart) {
		if (!err) {
			callback(chart);
		}
	});
}