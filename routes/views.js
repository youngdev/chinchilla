/*
	Require the Swig module for templating.
*/
var swig        = require('swig'),
	_           = require('underscore'),
    $           = require('jquery'),
	dbquery     = require('../db/queries'),
	itunes      = require('../config/itunes'),
	charts      = require('../config/charts'),
	Lastfm      = require('lastfmapi'),
	helpers     = require('../frontend/scripts/helpers').helpers,
    recognition = require('../frontend/scripts/recognition').recognition,
	lastfm  = new Lastfm({
		api_key:    "29c1ce9127061d03c0770b857b3cb741",
		secret:     "473680e0257daa9a7cb45207ed22f5ef"
	}),
    views   = this;
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');
/*
	This is the current directory without the "/routes" at the end, so basically the parent directory
*/
var dirup = __dirname.substr(0, __dirname.length - 7);
var	parseduration = function(number) {
	var fullseconds = Math.round(number / 1000), 
		minutes = Math.floor(fullseconds/60),
		seconds = fullseconds-(minutes*60);
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	return minutes+":"+seconds;
};
/*
	This function returns the artistpage to the user
*/
this.lastloop = null;
var artisttemplate      = dirup + '/sites/artist.html',
	albumtemplate       = dirup + '/sites/album.html',
	tracklisttemplate   = dirup + '/sites/tracklist.html',
    tracktemplate       = dirup + '/sites/track.html';
this.drawartist = function(request, response) {
	/*
		Define custom parameters
	*/
	var artistid = _.str.titleize(request.params.id);

	/*
		Query database for artist informations
	*/
	dbquery.getArtist(artistid, function(artistarray) {
		/*
			Get the HTML template and call "compile"
		*/
		var tmpl = swig.compileFile(artisttemplate);
		/*
			If nothing found, return null
		*/
		var artistinfo = artistarray.length === 0 ? null : artistarray[0];
		/*
			If null, add to the database
		*/
		if (artistinfo === null && views.lastloop != artistid) {
			itunes.lookup(artistid, {entity: "musicArtist"}, function(res) {
				if (res.results.length !== 0) {
					var firstResult = res.results[0];
					var a = {
						name: firstResult.artistName,
						id: firstResult.artistId,
						genre: firstResult.primaryGenreName
					};
					dbquery.addArtist(a, function() {
						views.lastloop = artistid;
						/*
							Loop: Be careful!
						*/
						views.drawartist(request, response);
					});
				}
				else {
					views.error({params: {code: 499}}, response);
				}
			});
		}
		else if (artistinfo !== null) {
			var artist = artistinfo.name;

			if (artistinfo.lastfm === undefined) {
				lastfm.artist.getInfo(
					{
						artist: artist
					}, 
					function(err, data) {
						if (!err) {
							var lfmdata = {
								image:      _.last(data.image)["#text"],
								mbid:       data.mbid
							};
							artistinfo.lastfm = lfmdata;
							dbquery.updateArtist(artistinfo);
						}
					}
				)
			};
			/*
				Db query for albums
			*/
			dbquery.getAlbums(artistid, function(albumarray) {
				/*
					If no albums were found, return null
				*/
				var albumsinfo = albumarray.length === 0 ? null : albumarray;
				/*
					Handle duplicates: Filter them out and show them as extra options.
				*/
				if (albumsinfo) {
					albumsinfo = _.uniq(albumsinfo, false, function(album) {
						var prename = (album.name != 1) ? album.name : '', // Some albums are not strings, they are numbers! wtf...
                            name = prename.substr(0, (prename.indexOf("(") == -1) ? prename.length : prename.indexOf("("));
						return _.str.slugify(name);
					});
				}
				/*
					Get songs for each album from MongoDB
				*/
				var albums = [];
				if (albumsinfo) {
					function getAlbumTracks() {
						var cds = [];
						var album = albumsinfo[j];
						dbquery.getTracksFromAlbum(album.id, function(items) {
							/*
								Get number of CD's
								Make array with n empty arrays. n = cdcount
								Add tracks to correct CD
								Sort album tracks
							*/
							if (items[0] === undefined) {
								console.log("Error: No items in album! Left album out. Album id:", album.id);
								//response.end("Server error.");
								return;
							}
							var cdcount = items[0].cdcount;
							for (i=0;i<cdcount;i++) {
								cds.push([]);
							}
							_.each(items, function(track) {
								cds[track.cdinalbum-1].push(track);
							});
							var discs = [];
							/*	Sort the tracks by their number*/
							_.each(cds, function(cd) {
								var disc = _.sortBy(cd, function(track) {return track.numberinalbum});
								discs.push(disc);
							});
							album.cds = discs;
							albums.push(album);
						});
						j++;
						if (j == albumcount) {
							return;
						}
						else {
							getAlbumTracks();
						}
					}
					var j           = 0,
						albumcount  = albumsinfo.length;
					getAlbumTracks();
				}
				/*
					Parse () in album titles
				*/
				var newAlbumsArray = [];
				_.each(albumsinfo, function(album) {
					var prename             = album.name != 1 ? album.name : '',
						name                = prename.substr(0, (prename.indexOf("(") == -1) ? prename.length : prename.indexOf("(")),
						parenthesisregex    = /\(([^()]+)\)/g,
						inparenthesis       = prename.match(parenthesisregex),
						withoutbrackets     = inparenthesis ? inparenthesis[0].substr(1, inparenthesis[0].length-2) : null;
					album.name              = name;
					album.subtitle          = withoutbrackets;
					newAlbumsArray.push(album);
				});
				albumsinfo = newAlbumsArray;
				/*
					Query for top tracks
				*/
				dbquery.getTracks(artist, function(tracksarray) {
					var tracks = tracksarray;
					if (tracks) {
						tracks = _.uniq(tracks, false, function(song) {
							return _.str.slugify(song.name.toLowerCase());
						});
					}
					/*
						pass in parameters, custom for every artist
					*/
					var output = tmpl.render({
						artist:             artistinfo,
						albums:             albums,
						tracks:             tracks,
						albumtemplate:      albumtemplate,
						tracklist:          tracklisttemplate,
						parseduration:      parseduration,
						fromserver:         true,
						coverstack:         _.first(albums, 10)
					});
					/*
						Send to user
					*/
					response.end(output);
				});
			});
		}
		else {
			console.log("Error! No artist info.");
			response.end("Server error.");
		}
		
	});
};
this.drawalbum  = function(request, response) {
	/*
		Load template
	*/
	var tmpl = swig.compileFile(dirup + "/sites/album-page.html");
	/*
		Define custom parameters
	*/
	var albumid = request.params.album;
	var cds = [];
	dbquery.getSingleAlbum(albumid, function(albumarray) {
		/*
			If not found, album is null
		*/
		var albuminfo = albumarray.length === 0 ? null : albumarray[0];
		/*
			Pass parameters to template
		*/
		if (albuminfo) {
			dbquery.getTracksFromAlbum(albuminfo.id, function(items) {
				console.log(items);
				/*
					Get number of CD's
					Make array with n empty arrays. n = cdcount
					Add tracks to correct CD
					Sort album tracks
				*/
				if (items[0] === undefined) {
					response.end("Server error.");
					return;
				}
				var cdcount = items[0].cdcount;
				for (i=0;i<cdcount;i++) {
					cds.push([]);
				}
				_.each(items, function(track) {
					cds[track.cdinalbum-1].push(track);
				});
				var discs = [];
				/*	Sort the tracks by their number*/
				_.each(cds, function(cd) {
					var disc = _.sortBy(cd, function(track) {return track.numberinalbum});
					discs.push(disc);
				});
				albuminfo.cds = discs;
				var output = tmpl.render({
					album: albuminfo,
					tracklist: tracklisttemplate,
					parseduration: parseduration,
					albumhtml: albumtemplate
				});
				/*
					Send template to user
				*/
				response.end(output);
			});
		}
		else {
			/*
				Album not saved!
				Add album to the database!
			*/
			itunes.lookup(albumid, {entity: 'song'}, function(answer) {
				var result      = answer.results,
					info        = (result.splice(0,1))[0],
					albumtracks = [];
				_.each(result, function(track) {
					var song = itunes.remap(track);
					dbquery.addTrack(song, function() {
						console.log("Track added successfully! (Scraped server side)");
					});
					albumtracks.push(track.trackId);
				});
				var album = {
					artist: info.artistName,
					image: info.artworkUrl100,
					artistid: info.artistId,
					id: info.collectionId,
					tracklist: albumtracks,
					tracks: albumtracks.length,
					release: helpers.parseyear(info.releaseDate),
					name: info.collectionName,
					explicit: info.collectionExplicitness == "explicit" ? true : false
				};
				dbquery.addAlbum(album, function() {
					console.log("Album added successfully! (Scraped server side)");
				});
				/*
					Repeat the whole thing now the album is added to the DB.
				*/
				console.log("Album added. Now repeating!");
				views.drawalbum(request, response);
			});
			//views.error({params: {code: 498}}, response);
		}
	});
};
this.drawtrack  = function(request, response) {
    var tmpl            = swig.compileFile(tracktemplate),
        onlynumbers     = new RegExp('^[0-9]+$'),
        trackid         = request.params.id,
        song            = null;
    if (!onlynumbers.test(trackid)) {
        views.error({params: {code: 501}}, response);
        return;
    }
    dbquery.getSingleTrack(trackid, function (tracks) {
        if (tracks.length === 0) {
            itunes.lookup(trackid, {entity: 'song'}, function(res) {
                if (res.results.length !== 0) {
                    song = itunes.remap(res.results.splice(0,1)[0]);
                    /*
                        Fetch YouTube video
                    */
                    recognition.findVideo(song, function(video) {
                        song.ytid = helpers.parseYTId(video);
                        response.end(tmpl.render(song));
                        dbquery.addTrack(song, function() {
                            console.log("Track successfully added (Through /track/:id site)");
                        });
                    /*
                        Below you see jQuery and underscore are passed in. This is because the file
                        is used on the client-side too and there is no require
                    */
                    }, $, _, _.str);
                }
                else {
                    console.log("No track here");
                    views.error({params: {code: 497}}, response);
                }
            });
        }
        else {
            response.end(tmpl.render(tracks[0]));
        }
    });
};
this.mainview   = function(request, response) {
	response.sendfile(dirup + "/frontend/index.html");
};
this.charts     = function(request, response) {
	var tmpl        = swig.compileFile(dirup + "/sites/charts.html"),
		tracklist   = dirup + "/sites/tracklist.html",
		table       = charts.table,
		output      = tmpl.render({
			album:              {cds: [table]},
			tracklist:          tracklist,
			parseduration:      parseduration,
			showartistalbum:    true,
			coverstack:         _.first(table, 10)
		});
		response.end(output);
};
this.error      = function(request, response) {
	var tmpl        = swig.compileFile(dirup + "/sites/error.html"),
		error       = request.params.code,
		messages = {
			404: "We couldn't find that. If this problem persists, please contact the support!", 
			499: "It seems like this artist doesn't exist. ",
			498: "Whoops... this album doesn't seem to exist. ",
            497: "Sorry... this track doesn't seem to exist.",
            501: "The Track ID can only contain numbers, so there is no music here :("
		},
		message     = messages[error],
		phrase      = message !== undefined ? message : "Super fail: Not only that something didn't work, we also don't know what this error code means.",
        output      = tmpl.render({error: phrase});
	response.end(output);
};
this.about      = function(request, response) {
	response.sendfile(dirup + "/sites/about.html");
};