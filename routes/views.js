/*
	Require the Swig module for templating.
*/
var swig        = require('swig'),
	_           = require('underscore'),
	dbquery     = require('../db/queries'),
	itunes      = require('../config/itunes'),
	charts      = require('../config/charts'),
	Lastfm      = require('lastfmapi'),
	helpers     = require('../frontend/scripts/helpers').helpers,
    recognition = require('../frontend/scripts/recognition').recognition,
    facebook	= require('../config/facebook'),
    cookies		= require('cookies'),
    workers		= require('../config/workers'),
    standards   = require('../config/standards'),
	jsonload 	= require('jsonreq'),
	lastfm  = new Lastfm({
		api_key:    "29c1ce9127061d03c0770b857b3cb741",
		secret:     "473680e0257daa9a7cb45207ed22f5ef"
	}),
    views   = this;

/*
    Underscore config
*/
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

/*
	This is the current directory without the "/routes" at the end, so basically the parent directory
*/
var dirup = __dirname.substr(0, __dirname.length - 7);

/*
    Function for displaying duration correctly
*/
var	parseduration 	= helpers.parsetime,
	parsehours 		= helpers.parsehours,
	parsetext 		= helpers.parsetext,
	parseyear 		= helpers.parseyear;

/*
    View paths
*/
var artisttemplate      =   dirup + '/sites/artist.html',
    albumtemplate       =   dirup + '/sites/album.html',
    tracktemplate       =   dirup + '/sites/track.html';

/*
	Proposed new syntax!
*/
var templates = {
    registration:           dirup + '/sites/registration.html',
    newuser:                dirup + '/sites/new-user.html',
    wrapper: 				dirup + '/frontend/index.html',
    library: 				dirup + '/sites/library.html',
    tracklist: 				dirup + '/sites/tracklist.html',
    settings: 				dirup + '/sites/settings.html',
    main: 					dirup + '/sites/main.html',
    login: 					dirup + '/sites/login.html',
    artist: 				dirup + '/sites/new-artist.html',
    album: 					dirup + '/sites/album.html',
    playlistmenuitem: 		dirup + '/sites/playlistmenuitem.html',
    playlist: 				dirup + '/sites/playlist.html',
    song: 					dirup + '/sites/song.html'
};

/*
    Routes
*/
this.lastloop = null;
this.artist 					= function(request, response) {
	var id 						= request.params.id,
	 	data 					= {
	 		type: 'artist',
	 		parsehours: 	parsehours,
	 		parseduration: 	parseduration,
	 		parsetext: 		parsetext,
	 		parseyear: 		parseyear,
	 		templates: 		templates
	 	},
	 	tmpl 					= swig.compileFile(templates.artist),
	 	afterUserFetch 			= function(user) {
	 		console.log("User fetched");
	 		data.user 			= user;
	 		dbquery.getArtist(id, afterArtistFetch)
	 	},
	 	afterArtistFetch 		= function(artistarray) {
	 		var artist 			= artistarray.length === 0 ? null : artistarray[0];
	 		if (!artist) {
	 			iTunesQuery(id, evaluateiTunesQuery);
	 		}
	 		else {
	 			data.artist 	= artist;
	 			afterArtistIsAvailable();
	 		}
	 	},
	 	iTunesQuery 			= function(id) {
	 		itunes.lookup(id, {entity: 'musicArtist'}, evaluateiTunesQuery)
	 	},
	 	evaluateiTunesQuery		= function(res) {
	 		var results = res.results;
	 		if (results.length == 0) {
				views.error({params: {code: 499}}, response);
	 		}
	 		else {
	 			var result 		= res.results[0];
	 			data.artist 	= {
	 					name: 	result.artistName,
	 					id: 	result.artistId,
	 					genre: 	result.primaryGenreName
	 				};
	 			getAllArtistTracks(id);
	 		}
	 	},
	 	getAllArtistTracks 		= function(id) {
	 		itunes.lookup(id, {entity: "song", limit: 1000}, afterAllArtistTracks)
	 	},
	 	afterAllArtistTracks 	= function(res) {
	 		var songs 			= res.results,
	 			artist 			= songs.splice(0,1),
	 			tracks 			= _.map(songs, function(song) { return itunes.remap(song) }),
	 			ids 			= _.pluck(tracks, 'id');
	 		data.artist.ids  	= ids;
	 		afterSongListIsReceived(tracks);
	 		dbquery.addArtist(data.artist);
	 		dbquery.addTracksBulk(tracks);
	 	},
	 	afterArtistIsAvailable 	= function() {
	 		dbquery.getSongsByArtistId(data.artist.id, afterSongListIsReceived);
	 	},
	 	afterSongListIsReceived	= function(songs) {
	 		/*
				Create an object where we can save all albums to.
				Example: {45435345: *album*, 432423432: *album*}
	 		*/
	 		var albums 			= {};
	 		if (data.user.loggedin) {
	 			var songs 			= _.map(songs, function(song) { song.inlib = _.contains(data.user.collections.library, song.id); return song; });
	 		}
	 		
	 		/*
				Assign each song to an album
	 		*/
	 		_.each(songs, function(song) {
	 			/*
					Remove undefined songs
	 			*/
	 			if (song != undefined) {
	 				/*
						If this is the first track in an album,
	 				*/
	 				if (!albums[song.albumid]) {
	 					albums[song.albumid] = [];
	 				}
	 				albums[song.albumid].push(song);
	 			}
	 			
	 		});
	 		var sortedPopularityList = _.first(data.artist.ids, 10);
	 		console.log(sortedPopularityList);
	 		var top10 = _.map(sortedPopularityList, function(id) {
	 			return _.first(_.where(songs, {id: id}));
	 		});
	 		console.log(top10);
	 		data.top10 			= [{cds: [top10]}];
	 		var collections 	= [];
	 		_.each(albums, function(songs, name) {
	 			var albumarray 	= [];
	 			_.each(songs, function(song, k) {
	 				albumarray.push(song);
	 			});
	 			var albumarray = _.uniq(albumarray, false, function(song) { return song.id });
	 			/*
					Sort by track number
	 			*/
	 			var albumarray 	= _.sortBy(albumarray, function(song) { return song.numberinalbum });
	 			/*
					Group by CD
	 			*/
	 			var albumarray  = _.values(_.groupBy(albumarray, function(song) { return song.cdinalbum }));
	 			var albuminfo 	= {
	 				cds: 		albumarray,
	 				id: 		songs[0].albumid,
	 				tracks: 	songs.length,
	 				artist: 	songs[0].artist,
	 				release: 	songs[0].release,
	 				image: 		songs[0].image,
	 				name: 		songs[0].album,
	 				hours: 		_.reduce(_.pluck(songs, 'duration'), function(memo, num) {return memo + num}, 0)
	 			}
	 			var albuminfo 	= helpers.albumRelevance(albuminfo, _);
	 			collections.push(albuminfo);
	 		});
	 		var collections 	= _.sortBy(collections, function(album) { return album.release }).reverse();
	 		var collections 	= _.filter(collections, function(album) { return album.tracks > 3 });
	 		var collections 	= _.map(collections, function(album) { return helpers.parseAlbumTitle(album) });
	 		var collections 	= _.uniq(collections, false, function(album) { return album.name });
	 		data.coverstack		= _.first(_.pluck(collections, 'image'), 10);
	 		data.albums 		= collections;
	 		render();
	 	},
	 	render 					= function() {
	 		response.end(tmpl.render(data));
	 	}
 	facebook.getLibraryFromRequest(request, afterUserFetch);

};
this.drawartist     = function(request, response) {
	/*
		Define custom parameters
	*/
	var artistid = request.params.id;
	facebook.getLibraryFromRequest(request, function(userdata) {
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
					);
				}
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
							var prename = album.name+'', // Some albums are not strings, they are numbers! wtf...
		                        name = prename.substr(0, (prename.indexOf("(") == -1) ? prename.length : prename.indexOf("("));
							return _.str.slugify(name);
						});
					}
					/*
						Get songs for each album from MongoDB
					*/
					var albums = [];
					if (albumsinfo) {
						var getAlbumTracks = function() {
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
								var cdcount = items[0].cdcount,
									totallength = 0;
								for (i=0;i<cdcount;i++) {
									cds.push([]);
								}
								/*
									Add a class to tracks that are in the library
								*/
								_.each(items, function(track) {
									if (userdata.loggedin) {
										track.inlib = (userdata &&_.contains(userdata.collections.library, track.id));
									}
									cds[track.cdinalbum-1].push(track);
									totallength += track.duration;
								});
								var discs = [];
								/*	Sort the tracks by their number*/
								_.each(cds, function(cd) {
									var disc = _.sortBy(cd, function(track) {return track.numberinalbum});
									discs.push(disc);
								});
								album.cds = discs;
								album.hours = totallength;
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
						var prename             = album.name+'',
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
								return _.str.slugify((song.name + '').toLowerCase());
							});
						}
						var songlistright = [];
						/*
							Add a class to the song if it is in the users library
						*/
						_.each(tracks, function(track) {
							var song = track;
							if (userdata.loggedin) {
								song.inlib = (userdata && _.contains(userdata.collections.library, track.id));
							}
							songlistright.push(song);
						});

						/*
							pass in parameters, custom for every artist
						*/
						var output = tmpl.render({
							artist:             artistinfo,
							albums:             albums,
							//Not really the album... but for the tracklist template
							album:              {cds: [songlistright]},
							albumtemplate:      albumtemplate,
							tracklist:          templates.tracklist,
							parseduration:      parseduration,
							templates: 			templates,
							parsehours: 		parsehours,
							parsetext: 			parsetext,
							fromserver:         true,
							coverstack:         _.first(albums, 10),
							user: 				userdata,
							type: 				'artist'
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
		})
};		
this.drawalbum      = function(request, response) {
	/*
		Load template
	*/
	var tmpl = swig.compileFile(dirup + "/sites/album-page.html");
	/*
		Define custom parameters
	*/
	var albumid = request.params.album;
	var cds = [];
	facebook.getLibraryFromRequest(request, function(userdata) {
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
					var items = _.uniq(items, false, function(song) {return song.id});
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
					var cdcount = items[0].cdcount,
						totallength = 0;
					for (i=0;i<cdcount;i++) {
						cds.push([]);
					}
					_.each(items, function(track) {
						if (userdata.loggedin) {
							track.inlib = (userdata &&_.contains(userdata.collections.library, track.id));
						}
						cds[track.cdinalbum-1].push(track);
						totallength += track.duration;
					});
					var discs = [];
					/*	Sort the tracks by their number*/
					_.each(cds, function(cd) {
						var disc = _.sortBy(cd, function(track) {return track.numberinalbum});
						discs.push(disc);
					});
					albuminfo.cds = discs;
					albuminfo.release += '';
					albuminfo.hours = totallength;
					var output = tmpl.render({
						album: 			albuminfo,
						tracklist: 		templates.tracklist,
						parseduration: 	parseduration,
						albumhtml: 		albumtemplate,
						hqimage: 		helpers.getHQAlbumImage(albuminfo),
						background: 	_.shuffle(_.first(workers.returnAlbumCovers(), 30)),
						parsehours: 	parsehours,
						parsetext: 		parsetext,
						parseyear: 		parseyear,
						user: 			userdata,
						templates: 		templates,
						type: 			'album'
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
	});
};
this.drawtrack      = function(request, response) {
    var tmpl            = swig.compileFile(tracktemplate),
        onlynumbers     = new RegExp('^[0-9]+$'),
        trackid         = request.params.id,
        /*
			Passing in the parseduration function with the song for simplicity
        */
        song            = null;
    if (!onlynumbers.test(trackid)) {
        views.error({params: {code: 501}}, response);
        return;
    }
    dbquery.getSingleTrack(trackid, function (tracks) {
        if (tracks.length === 0) {
            itunes.lookup(trackid, {entity: 'song'}, function(res) {
                if (res.results.length !== 0) {
                    song 				= itunes.remap(res.results.splice(0,1)[0]);
                    /*
                        Fetch YouTube video
                    */
                    jsonload.get('http://gdata.youtube.com/feeds/api/videos?alt=json&max-results=15&q=' + song.artist + ' - ' + song.name, function(err, data) {
                    	recognition.findBestVideo(data, song, function(video) {
                    		song.ytid = helpers.parseYTId(video);
                        	response.end(tmpl.render({song: song, parseduration: parseduration, image: helpers.getHQAlbumImage(song)}));
                        	dbquery.addTrack(song, function() {
                        	    console.log("Track successfully added (Through /track/:id site)");
                        	});
                    	}, _, _.str);
                    });
                }
                else {
                    console.log("No track here");
                    views.error({params: {code: 497}}, response);
                }
            });
        }
        else {
        	var track = tracks[0];
        	facebook.checkLoginState(request, function(user) {
        		if (user) {
        			dbquery.getUserCollections(user, function(collection) {
        				var library = collection.library,
        					inlib 	= (_.contains(library, track.id));
        				response.end(tmpl.render({song: track, parseduration: parseduration, inlib: inlib, image: helpers.getHQAlbumImage(track)}));
        			});
        		}
        		else {
        			response.end(tmpl.render({song: track, parseduration: parseduration, image: helpers.getHQAlbumImage(track)}));
        		}
        	});
        }
    });
};
this.wrapper       	= function(request, response) {
	var tmpl 	= swig.compileFile(templates.wrapper),
		cookie 	= new cookies(request, response),
		token   = cookie.get('token'),
		data 	= {},
		afterUserFetch = function(user) {
			data.user = user;
			if (user) {
				facebook.getLibraryFromRequest(request, afterLibraryFetched);
			}
			else {
				render();
			}
		},
		afterLibraryFetched = function(user) {
			data.collection = user.collections;
			render();
		},
 		render 	= function() {
 			var output  = tmpl.render(data);
 			response.end(output);
 		};
 	data.templates = templates;
	dbquery.getUser(token, afterUserFetch);
}
this.charts         = function(request, response) {
	facebook.getLibraryFromRequest(request, function(userdata) {
		var tmpl        = swig.compileFile(dirup + "/sites/charts.html"),
			table       = charts.table,
			songs 		= [];
		_.each(table, function(song) {
			if (song != undefined) {
				if (userdata.loggedin) {
					song.inlib = (userdata && _.contains(userdata.collections.library, song.id));
				}
				songs.push(song);
			}
			
		});
		var	output      = tmpl.render({
				album:              {cds: [songs]},
				parseduration:      parseduration,
				parsetext: 			parsetext,
				showartistalbum:    true,
				coverstack:         _.first(table, 10),
				user: 				userdata,
				type: 				'charts',
				templates: 			templates
			});
		response.end(output);
	});
};
this.error          = function(request, response) {
	var tmpl        = swig.compileFile(dirup + "/sites/error.html"),
		error       = request.params.code,
		messages = {
			404: "We couldn't find that page.", 
			499: "It seems like this artist doesn't exist. ",
			498: "Whoops... this album doesn't seem to exist. ",
            497: "Sorry... this track doesn't seem to exist.",
            501: "The Track ID can only contain numbers, so there is no music here :(",
            502: "This playlist doesn't seem to exist.",
            503: "This playlist is private, but you are not logged in.",
            504: "This playlist is private. Please ask the crator of the playlist to make it public."
		},
		message     = messages[error],
		phrase      = message !== undefined ? message : "Super fail: Not only that something didn't work, we also don't know what this error code means.",
        output      = tmpl.render({error: phrase});
	response.end(output);};
this.about          = function(request, response) {
	response.sendfile(dirup + "/sites/about.html");
};
this.library		= function(request, response) {
	var tmpl = swig.compileFile(templates.library);
	facebook.checkLoginState(request, function(user) {
		if (user) {
			dbquery.getUserCollections(user, function(collection) {
				if (collection.library.length == 0) {
					response.end("No tracks in the library.");
				}
				dbquery.getSongsByIdList(collection.library, function(songs) {
					var tracks = [];
					_.each(songs, function(song) {
						song.inlib = true;
						tracks.unshift(song);
					});
					var output  = tmpl.render({
						user: user,
						album: 				{cds: [tracks]},
						templates: 			templates,
						parseduration: 		parseduration,
						parsetext: 			parsetext,
						showartistalbum: 	true,
						coverstack: 		helpers.coverArrayToHQ(_.first(_.uniq(_.pluck(_.first(tracks, 15), 'image')), 10), 150),
						user: 				{loggedin: true},
						type: 				'library'
					});
					response.end(output);
				});
			});
		}
		else {
			var output = tmpl.render({user: user, templates: templates});
			response.end(output);
		}
	});
};
this.main 					= function(request, response) {
	var tmpl = swig.compileFile(templates.main),
		data = {
			templates: templates, 
			background: _.shuffle(_.first(workers.returnAlbumCovers(), 40)),
			type: 'home',
			parseduration: parseduration,
			parsetext: parsetext,
			parsehours: parsehours
		},
		afterlogin 			= function(user) {
			data.user 		= user;
			if (user) {
				data.user.loggedin = true;
				dbquery.getUserCollections(user, afterCollection)
			}
			else {
				buildcharts();
			}
		},
		afterCollection 	= function(collection) {
			var library 	= collection.library,
				first7 		= _.last(library, 7).reverse();
			data.inlibrary  = library;
			dbquery.getSongsByIdList(first7, afterIdList);
		},
		afterIdList			= function(songs) {
			/*
				Add inlib to all songs
			*/
			var songs 		= _.map(songs, function(song) {song.inlib = true; return song;});
			data.library 	= [{cds: [songs]}];
			buildcharts();
		},
		buildcharts			= function() {
			var top 		= _.first(charts.table, 7),
				top7 		= [],
				redditsongs	= _.first(_.shuffle(workers.returnRedditSongs()), 4);
			_.map(redditsongs, function(reddit) { 
				reddit.inlib= (data.user && _.contains(data.inlibrary, reddit.song.id)); 
				return reddit; 
			});
			var top 		= _.compact(top);
			_.each(top, function(song) {
				song.inlib 	= (data.user && _.contains(data.inlibrary, song.id));
				top7.push(song);
			});
			data.redditsongs= redditsongs;
			data.charts 	= [{cds: [top7]}];
			render();
		}
		render 				= function() {
			var output 		= tmpl.render(data);
			response.end(output);
		}
	facebook.checkLoginState(request, afterlogin);
};
this.playlist 				= function(request, response) {
	var tmpl 				= swig.compileFile(templates.playlist),
	cookie = new cookies(request, response),
	token = cookie.get('token'),
	data 					= {
		templates: 				templates,
		parseduration: 			parseduration,
		parsetext: 				parsetext,
		showartistalbum: 		true
	},
	afterUserFetched 		= function(user) {
		if (user) {
			data.user = user;
			dbquery.getUserCollections(user, afterLibraryFetched)
		}
		else {
			afterLibraryFetched();
		}
	},
	afterLibraryFetched 	= function(collections) {
		if (data.user) {
			data.library = collections.library;
		}
		var playlist 		= '/u/' + request.params.username + '/p/' + request.params.playlist;
		dbquery.getPlaylist(playlist, afterPlaylistFetched);
	},
	afterPlaylistFetched 	= function(playlist) {
		/*
			No playlist exists
		*/
		if (!playlist) {
			views.error({params: {code: 502}}, response);
			return;
		}
		data.playlist = playlist;	
		/*
			Playlist is private, but not logged in
		*/
		if (!data.user && !playlist['public']) {
			views.error({params: {code: 503}}, response);
			return;
		}
		/*
			Playlist is private, but doesn't belong the user
		*/
		if ((data.user && data.user.id != playlist.owner) && !playlist['public']) {
			views.error({params: {code: 504}}, response);
			return;
		}
		var tracks = playlist.tracks;
		if (tracks.length == 0) {
			data.album = {cds: []};
			render();
		}
		else {
			dbquery.getSongsByIdList(tracks, afterTracksFetched);
		}
	},
	afterTracksFetched 		= function(tracks) {
		if (data.user) {
			_.map(tracks, function(track) { track.inlib = _.contains(data.library, track.id); return track; })
		}
		if (data.playlist.newestattop) {
			tracks.reverse();
		}
		data.album = {cds: [tracks]};
		data.playlist.rawduration = _.reduce(tracks, function(a, b) { return a + b.duration }, 0)
		data.playlist.duration = helpers.parsehours(data.playlist.rawduration);
		data.playlist.trackcount = tracks.length;
		data.coverstack = _.first(_.pluck(tracks, 'image'), 10);
		render();
	},
	render 					= function() {
		var output  		= tmpl.render(data);
		response.end(output);
	}
	dbquery.getUser(token, afterUserFetched)
}
this.settings				= function(request, response) {
	var tmpl = swig.compileFile(templates.settings),
		cookie = new cookies(request, response),
		token = cookie.get('token');
	if (!token) {
		response.end('You need to login to save settings.');
	}
	else {
		dbquery.getUser(token, function(user) {
			/*
				Add new settings/remove deprecated settings
			*/
			var settings = [];
			_.each(standards.settings, function(setting, key) {
				var stg = _.where(user.settings, {key: setting.key});
				if (stg.length !== 0) {
					settings.push(stg[0])
				}
				else {
					settings.push(setting)
				}
			});
			user.settings = settings;
			/*
				Render settings
			*/
			var output = tmpl.render({
				user: user
			});
			response.end(output);
		});
	}
}