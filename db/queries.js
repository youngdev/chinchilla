var mongo       = require("mongoskin"),
	auth        = require("../auth/auth"),
	connection  = mongo.db(auth.auth, {safe: true}),
    options     = {save: true, upsert: true};
/*
	Get matching artists.
	Example structure of an artist:
	{
		"name": "Favorite", --> name of the artist
        "id": 5078430       --> iTunes ID of the artist.
    }
*/
this.getArtist = function(artistid, callback) {
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
this.getAlbums = function(artistid, callback) {
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
this.getTracks      = function(artist, callback) {
	connection.collection("tracks").find({"artist": artist}).toArray(function(err, items) {
        if (!err) {
            callback(items);
        }
	});
};
this.getSingleTrack = function (id, callback) {
    connection.collection("tracks").find({"id": id}).toArray(function(err, item) {
        if (!err) {
            callback(item);
        }
    });
};
this.getSingleAlbum = function(albumid, callback) {
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
this.getTracksFromAlbum = function(albumid, callback) {
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
this.addTrack		= function(track, callback) {
	//TODO: This could overwrite previous listens.
	track.listens = 0;
	connection.collection("tracks").update({id: track.id}, track, options, function(err) {
		if (err) {
			console.log(err);
		}
		else {
			callback();
		}
	});
};
this.addAlbum		= function(album, callback) {
	connection.collection("albums").update({id: album.id}, album, options, function(err) {
		if (err) {
			console.log(err);
		}
		else {
			callback();
		}
	});
};
this.addArtist		= function(artist, callback) {
	connection.collection("artists").update({id: artist.id}, artist, options, function(err) {
		if (!err) {
			callback();
		}
	});
};
this.getSongsByIds  = function(ids, callback) {
	//This seems to fail on a few tracks! Alternative: getSongsByNames
	connection.collection("tracks").find({$or: ids}).toArray(function(err, items) {
		if (!err) {
            callback(items);
		}
	});
};
this.updateArtist    = function(info) {
	connection.collection("artists").update({id: info.id}, info, options);
};