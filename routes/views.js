/*
	Require the Swig module for templating.
*/
var swig        = 			require('swig'),
	_           = 			require('underscore'),
	dbquery     = 			require('../db/queries'),
	itunes      = 			require('../config/itunes'),
	charts      = 			require('../config/charts'),
	Lastfm      = 			require('lastfmapi'),
	helpers     = 			require('../frontend/scripts/helpers').helpers,
    recognition = 			require('../frontend/scripts/recognition').recognition,
    facebook	= 			require('../config/facebook'),
    cookies		= 			require('cookies'),
    workers		= 			require('../config/workers'),
    standards   = 			require('../config/standards'),
	jsonload 	= 			require('jsonreq'),
	lastfm  	= 			new Lastfm({
		api_key:    			"29c1ce9127061d03c0770b857b3cb741",
		secret:     			"473680e0257daa9a7cb45207ed22f5ef"
	}),
    views   	= 			this,
    lyricfind 	= 			require('../config/lyricfind'),
    freebase 	= 			require('freebase'),
    freebtools  = 			require('../config/freebase');

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
var	parseduration 	= 		helpers.parsetime,
	parsehours 		= 		helpers.parsehours,
	parsetext 		= 		helpers.parsetext,
	parseyear 		= 		helpers.parseyear,
	parseReleaseLeft=		helpers.parseReleaseLeft;
		
/*
	Views
*/
var templates 		= 		{
    registration:           dirup + '/sites/registration.html',
    newuser:                dirup + '/sites/new-user.html',
    wrapper: 				dirup + '/sites/index.html',
    startup: 				dirup + '/sites/infoscreen.html',
    library: 				dirup + '/sites/library.html',
    tracklist: 				dirup + '/sites/tracklist.html',
    settings: 				dirup + '/sites/settings.html',
    main: 					dirup + '/sites/main.html',
    login: 					dirup + '/sites/login.html',
    artist: 				dirup + '/sites/new-artist.html',
    album: 					dirup + '/sites/album.html',
    albumpage: 				dirup + '/sites/album-page.html',
    playlistmenuitem: 		dirup + '/sites/playlistmenuitem.html',
    playlist: 				dirup + '/sites/playlist.html',
    song: 					dirup + '/sites/song.html',
    redditbox: 				dirup + '/sites/reddit-box.html',
    track: 					dirup + '/sites/track.html',
    newtrack: 				dirup + '/sites/new-track.html',
    reddit: 				dirup + '/sites/reddit.html',
    lyrics: 				dirup + '/sites/lyrics.html',
    charts: 				dirup + '/sites/charts.html',
    retrocharts: 			dirup + '/sites/retro-charts.html',
    about: 					dirup + '/sites/about.html',
    artistfreebase: 		dirup + '/sites/artistfreebase.html',
    templates: 				dirup + '/sites/templates.html'
};

/*
    Routes
*/
this.artist 					= function(request, response) {
	var id 						= request.params.id,
	 	data 					= {
	 		type: 'artist',
	 		parsehours: 	parsehours,
	 		parseduration: 	parseduration,
	 		parsetext: 		parsetext,
	 		parseyear: 		parseyear,
	 		templates: 		templates,
	 		parseReleaseLeft: parseReleaseLeft
	 	},
	 	tmpl 					= swig.compileFile(templates.artist),
	 	afterUserFetch 			= function(user) {
	 		data.user 			= user;
	 		dbquery.getArtist(id, afterArtistFetch)
	 	},
	 	afterArtistFetch 		= function(artistarray) {
	 		var artist 			= artistarray.length === 0 ? null : artistarray[0];
	 		if (!artist) {
	 			console.log('no artist found');
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
	 		dbquery.addArtist(data.artist, function() {
	 			console.log('Artist added', data.artist);
	 		});
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
	 		if (data.user) {
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
	 		var top10 = _.map(sortedPopularityList, function(id) { return _.first(_.where(songs, {id: id})) });
	 		var top10 = _.compact(top10);
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
	 			var cds  = _.values(_.groupBy(albumarray, function(song) { return song.cdinalbum }));
	 			var albuminfo 	= {
	 				cds: 		cds,
	 				id: 		albumarray[0].albumid,
	 				tracks: 	albumarray.length,
	 				artist: 	albumarray[0].artist,
	 				release: 	albumarray[0].release,
	 				image: 		albumarray[0].image,
	 				name: 		albumarray[0].album,
	 				hours: 		_.reduce(_.pluck(albumarray, 'duration'), function(memo, num) {return memo + parseFloat(num)}, 0),
	 				released: 	(new Date(albumarray[0].release) - new Date()) < 0
	 			}
	 			var albuminfo 	= helpers.albumRelevance(albuminfo, _);
	 			collections.push(albuminfo);
	 		});
	 		var collections 	= _.sortBy(collections, function(album) { return album.release }).reverse();
	 		var collections 	= _.filter(collections, function(album) { return album.tracks > 3 });
	 		var collections 	= _.map(collections, function(album) { return helpers.parseAlbumTitle(album) });
	 		var collections 	= _.uniq(collections, false, function(album) { return album.name });
	 		data.coverstack		= _.first(_.pluck(collections, 'image'), 9);
	 		data.albums 		= collections;
	 		freebaseSearch();
	 		
	 	},
	 	freebaseSearch 			= function() {
	 		/*
				Freebase killed for now! Skip to render.
	 		*/
	 		//if (!data.artist.freebase) {
	 		//	freebase.search(data.artist.name, {type: '/music/artist', limit: 1}, afterFreebaseSearch);
	 		//}
	 		//else {
	 		//	render();
	 		//}
	 		render();
	 	},
	 	afterFreebaseSearch 	= function(results) {
	 		if (results.length == 0) {
	 			data.artist.freebase = {};
	 			render();
	 		}
	 		else {
				var id = results[0].id;
				freebase.topic(id, {}, afterFreebaseTopic);
	 		}
	 	},
	 	afterFreebaseTopic 		= function(topics) {
	 		var info = topics.property;
	 		var keep = _.pick(info,
	 			'/common/topic/description',
	 			'/common/topic/alias',
	 			'/common/topic/image',
	 			'/common/topic/official_website',
	 			'/common/topic/social_media_presence',
	 			'/people/person/date_of_birth',
	 			'/people/person/employment_history',
	 			'/people/person/ethnicity',
	 			'/people/person/gender',
	 			'/people/person/height_meters',
	 			'/people/person/languages',
	 			'/people/person/nationality',
	 			'/people/person/parents',
	 			'/people/person/place_of_birth',
	 			'/people/deceased_person/cause_of_death',
	 			'/people/deceased_person/date_of_burial',
	 			'/people/deceased_person/date_of_death',
	 			'/people/deceased_person/place_of_burial',
	 			'/people/deceased_person/place_of_death',
	 			'/award/ranked_item/appears_in_ranked_lists',
	 			'/award/award_winner/awards_won',
	 			'/film/actor/film',
	 			'/music/artist/concert_tours',
	 			'/music/artist/genre',
	 			'/music/artist/label',
	 			'/music/artist/origin',
	 			'/music/artist/active_start',
	 			'/music/artist/active_end',
	 			'/music/musical_group/member',
	 			'/music/group_member/instruments_played',
	 			'/influence/influence_node/influenced_by',
	 			'/celebrities/celebrity/substance_abuse_problems'
	 		);
	 		data.artist.freebase = freebtools.remap(keep);
	 		dbquery.saveFreebaseInfo(data.artist);
	 		render();
	 	},
	 	render 					= function() {
	 		response.end(tmpl.render(data));
	 	}
 	facebook.getLibraryFromRequest(request, afterUserFetch);
};		
this.track 						= function(request, response) {
	var tmpl 							= swig.compileFile(templates.newtrack),
		id 								= parseFloat(request.params.id),
		data 							= {parseduration: parseduration},
		onlynumbers    	 				= new RegExp('^[0-9]+$'),
		render 							= function() {
			var output 					= tmpl.render(data);
			response.end(output);
		},
		renderError 					= function(code) {
			views.error({params: {code: code}}, response);
		},
		afterDBQueryPerformed 			= function(tracks) {
			if (tracks.length === 0) {
				itunes.lookup(id, {entity: 'song'}, afteriTunesQueryPerformed);
				data.wasindb = false;
			}
			else {
				afterTrackFound(tracks[0]);
				data.wasindb = true;
			}
		},
		afteriTunesQueryPerformed 		= function(res) {
			var results = res.results
			if (results.length === 0) {
				renderError(497);
			}
			else {
				var song = itunes.remap(results[0]);
				afterTrackFound(song);
			}
		},
		afterTrackFound 				= function(song) {
			if (song.ytid) {
				afterHasYTID(song);
			}
			else {
				findYouTubeID(song);
			}
		},
		afterHasYTID 					= function(song) {
			data.hqcover = helpers.getHQAlbumImage(song, 400);
			data.song = song;
			facebook.checkLoginState(request, afterLoginStateChecked)
		},
		findYouTubeID 					= function(song) {
			jsonload.get('http://gdata.youtube.com/feeds/api/videos?alt=json&max-results=15&q=' + song.artist + ' - ' + song.name, function(err, data) {
				recognition.findBestVideo(data, song, function(video) {
					song.ytid = helpers.parseYTId(video);
					afterHasYTID(song);
				}, _, _.str);
			});
		},
		afterLoginStateChecked 			= function(user) {
			if (user) {
				data.user = user;
				dbquery.getUserCollections(user, afterUserCollectionsFetched);
			}
			else {
				afterUserProcessDone();
			}
		},
		afterUserProcessDone 			= function() {
			render();
			dbquery.addTrack(data.song, function(song) {
				console.log('Track added through track page!');
			});
		},
		afterUserCollectionsFetched		= function(collections) {
			data.library 	= collections.library;
			data.playlists 	= collections.playlists;
			data.inlib 		= _.contains(data.library, id);
			dbquery.getPlaylistsFromUserId(data.user.id, afterPlaylistsFetched)
		},
		afterPlaylistsFetched 			= function(playlists) {
			data.playlists 	= playlists;
			data.playlists 	= _.map(data.playlists, function(playlist) { playlist.containssong = _.contains(playlist.tracks, id); return playlist });
			afterUserProcessDone();
		} 
		if (onlynumbers.test(id)) {
			dbquery.getSingleTrack(id, afterDBQueryPerformed);
		}
		else {
			renderError(501);
		}		
};
this.album 						= function(request, response) {
	var tmpl 			= swig.compileFile(templates.albumpage),
		id 				= parseFloat(request.params.id),
		data 			= { 
			parseduration: parseduration , 
			templates: templates, 
			parsetext: parsetext, 
			parseyear: parseyear, 
			parsehours: parsehours, 
			parseReleaseLeft: parseReleaseLeft,
			type: 'album'
		},
		onlynumbers		= new RegExp('^[0-9]+$'),
		render 			= function() {
			var output 	= tmpl.render(data);
			response.end(output);
		},
		renderError 					= function(code) {
			views.error({params: {code: code}}, response);
		},
		afterLibraryFetched 			= function(user) {
			data.user = user;
			dbquery.getSingleAlbum(id, afterDBQueryPerformed)
		}
		afterDBQueryPerformed 			= function(album) {
			var album = (album.length == 0) ? null : album[0];
			if (album) {
				data.album = album;
				dbquery.getTracksFromAlbum(id, afterAlbumTracksFetched)
			}
			else {
				itunes.lookup(id, {entity: 'song'}, function(itunesresponse) {
					var info = itunesresponse.results
					if (info.length == 0)  {
						renderError(498);
					}
					data.album = info.splice(0,1)[0];
					data.songs = _.map(info, function(song) { return itunes.remap(song)});
					data.album = helpers.makeAlbum(data, _);
	 				dbquery.addAlbum(data.album, function() {
	 					console.log('Album added', data.album.name);
	 				});
	 				dbquery.addTracksBulk(data.songs);
	 				remapAlbums();
				});
			}
		},
		afterAlbumTracksFetched 		= function(songs) {
			data.songs = songs;
			data.songs = _.uniq(data.songs, function(song) { return song.id });
			remapAlbums();
		},
		remapAlbums 					= function() {
			if (data.user) {
				data.songs = _.map(data.songs, function(song) { song.inlib = _.contains(data.user.collections.library, song.id); return song;})
			}
			data.album.released = (new Date(data.album.release) - new Date()) < 0;
			data.album.cds = _.values(_.groupBy(_.sortBy(data.songs, function(song) { return song.numberinalbum }), function(song) { return  song.cdinalbum }));
			data.hqimage   = helpers.getHQAlbumImage(data.album, 400);
			data.background= workers.returnAlbumCovers() 
			render();
		}
		if (onlynumbers.test(id)) {
			facebook.getLibraryFromRequest(request, afterLibraryFetched)
		}
		else {
			renderError(501);
		}
}
this.lyrics	 					= function(request, response) {
	var tmpl = swig.compileFile(templates.lyrics),
		id 	 = request.params.id,
		data = {},
		domain = 'http://api.lyricfind.com/',
		searchkey = '2c559b886036ca94aaf4fd92849298aa',
		displaykey = '67c67c978a54c763b7595553fbe8a730',
		metadata = 'ef15d7987683309b86c4f90b08354c46',
		charts = '1067b013add841ec68c3bd5f2042b59f',
		useragent = request.headers['user-agent'],
		afterDBQueryMade 	= function(song) {
			if (song.length == 0) {
				makeiTunesQuery(id)
			}
			else {
				afterSongIsFetched(song[0]);
			}
			
		},
		makeiTunesQuery 	= function(id, callback) {
			itunes.lookup(id, {entity: 'song'}, function(result) {
				var results = result.results;
				if (results.length  !== 0 ) {
					var song = itunes.remap(results[0]);
					afterSongIsFetched(song)
				}
				else {
					views.error({params: {code: 497}}, response);
				}
			});
		},
		afterSongIsFetched  = function(song) {
			data.song = song;
			data.header = helpers.getHQAlbumImage(song, 600);
			var songnamewithoutparenthesis = (helpers.parseAlbumTitle(song)).name
			lyricfind.search({
				domain: domain,
				api_key: searchkey,
				track: songnamewithoutparenthesis,
				artist: song.artist,
				callback: afterLyricFindQueried
			});
		},
		afterLyricFindQueried = function(json) {
			var tracks = json.tracks;
			if (tracks.length == 0) {
				views.error({params: {code: 496}}, response);
			}
			else {
				var lf = tracks[0];
				if (lf.viewable) {
					lyricfind.display({
						domain: domain,
						api_key: displaykey,
						id: lf.amg,
						useragent: useragent,
						callback: afterLyricsFetched
					})
				}
				else {
					views.error({params: {code: 495}}, response);
				}
			}
		},
		afterLyricsFetched	= function(json) {
			if (json.response) {
				if (json.response.code == 101) {
					afterLyricsValidated(json.track);
				}
				else {
					views.error({params: {code: 493}}, response);
				}
			}
			else {
				views.error({params: {code: 494}}, response);
			}
			render();
		},
		afterLyricsValidated = function(obj) {
			obj.lyrics = obj.lyrics.replace(/\n/g, "<br>");
			data.lyricfind = obj;
			render();
		},
		render 			 	= function() {
			var output = tmpl.render(data);
			response.end(output);
		}
	dbquery.getSingleTrack(id, afterDBQueryMade);
};
this.wrapper       				= function(request, response) {
	var tmpl 	= swig.compileFile(templates.wrapper),
		cookie 	= new cookies(request, response),
		token   = cookie.get('token'),
		data 	= {startup: templates.startup},
		betatesters = ['jonnyburger', 'loewe1000', 'benni.burger.7'];
		afterUserFetch = function(user) {
			data.user = user;
			if (user) {
				if (_.contains(betatesters, user.username)) {
					facebook.getLibraryFromRequest(request, afterLibraryFetched);
				}
				else {
					data.user = null;
					data.block = "You are not a beta tester. Write e-mail to info@tunechilla.com and you might become one! :)";
					render();
				}
			}
			else {
				if (request.query.secretaccess == 'royhennig') {
					data.allowed = true;
				}
				render();
			}
		},
		afterLibraryFetched = function(user) {
			data.collection = user.collections;
			data.library 	= JSON.stringify(user.collections.library);
			if (data.collection.playlists.length == 0) {
				data.playlists = '[]';
				render();
			}
			else {
				dbquery.getPlaylistsFromUserId(data.user.id, afterPlaylistsFetched);
			}
		},
		afterPlaylistsFetched = function(playlists) {
			data.playlists = JSON.stringify(playlists);
			render();
		},
 		render 	= function() {
 			var output  = tmpl.render(data);
 			response.end(output);
 		};
 	data.live = process.env.server == 'production';
 	data.templates = templates;
	dbquery.getUser(token, afterUserFetch);
}
this.charts         			= function(request, response) {
	facebook.getLibraryFromRequest(request, function(user) {
		var tmpl        = swig.compileFile(templates.charts),
			songs 		= [],
			afterChartsFetched = function(table) {
				_.each(table, function(song) {
					if (song != undefined) {
						if (user) {
							song.inlib = (user && _.contains(user.collections.library, song.id));
						}
						songs.push(song);
					}
					
				});
				var	output      = tmpl.render({
						album:              {cds: [songs]},
						parseduration:      parseduration,
						parsetext: 			parsetext,
						showartistalbum:    true,
						coverstack:         _.first(table, 9),
						user: 				user,
						type: 				'charts',
						templates: 			templates
					});
				response.end(output);
			},
			table       = charts.getCharts(afterChartsFetched);
		
	});
};
this.retrocharts 				= function(request, response) {
	var tmpl 				= swig.compileFile(templates.retrocharts),
		data 				= {},
		year 				= request.params.year,
		data 				= {
			parseduration: parseduration,
			parsetext: parsetext,
			showartistalbum: true,
			type: 'retrocharts',
			templates: templates,
			range: workers.getYearRange()
		},
		afterIdsFetched 	= function(chart) {
			if (chart) {
				data.year = chart.year;
				dbquery.getSongsByIdList(chart.charts, afterChartsFetched);
			}
			else {
				render();
			}
		},
		afterChartsFetched 	= function(table) {
			data.table = table;
			checkUser();
		},
		checkUser 			= function() {
			facebook.getLibraryFromRequest(request, afterLibraryFetched);
		},
		afterLibraryFetched = function(user) {
			if (user) {
				data.user = user;
				data.table = _.map(data.table, function(song) { song.inlib = _.contains(user.collections.library, song.id); return song});
			}
			data.album = {cds: [data.table]};
			data.coverstack = _.first(data.table, 9);
			render();
		},
		render 				= function() {
			var output = tmpl.render(data);
			response.end(output);
		}
		dbquery.getRetroCharts(year, afterIdsFetched);
}
this.error          			= function(request, response) {
	var tmpl        = swig.compileFile(dirup + "/sites/error.html"),
		error       = request.params.code,
		messages = {
			404: "We couldn't find that page.", 
			499: "It seems like this artist doesn't exist. ",
			498: "Whoops... this album doesn't seem to exist. ",
            497: "Sorry... this track doesn't seem to exist.",
            501: "The ID can only contain numbers, so there is no music here :(",
            496: "Sorry, there aren't any lyrics for this song.",
            495: "We couldn't fetch the lyrics for this song. There might be license issues.",
            494: "We received no response for your lyrics request.",
            493: "There seems to be a problem with the lyrics server.",
            502: "This playlist doesn't seem to exist.",
            503: "This playlist is private, but you are not logged in.",
            504: "This playlist is private. Please ask the crator of the playlist to make it public."
		},
		message     = messages[error],
		phrase      = message !== undefined ? message : "Super fail: Not only that something didn't work, we also don't know what this error code means.",
        output      = tmpl.render({error: phrase});
	response.end(output);
};
this.about          			= function(request, response) {
	var tmpl 	= swig.compileFile(templates.about),
		output 	= tmpl.render({});
	response.end(output);
};
this.library 					= function(request, response) {
	var tmpl = swig.compileFile(templates.library),
		data = {
			templates: templates,
			parseduration: parseduration,
			parsetext: 	parsetext,
			showartistalbum: true,
			type: 'library'
		},
		afterFacebookLoginStateChecked = function(user) {
			if (user) {
				data.user = user;
				dbquery.getUserCollections(user, afterUserCollectionsFetched)
			}
			else {
				render()
			}
		},
		afterUserCollectionsFetched 	= function(collections) {
			data.collections = collections;
			if (collections.library.length == 0) {
				data.album = {cds: []};
				render();
			}
			else {
				dbquery.getSongsByIdList(collections.library, afterSongListIsReceived);
			}	
		},
		afterSongListIsReceived 		= function(songs) {
			var tracks = _.map(songs.reverse(), function(song) { song.inlib = true; return song; });
			data.coverstack = helpers.coverArrayToHQ(_.first(_.uniq(_.pluck(_.first(tracks, 15), 'image')), 9), 150);
			data.album = {cds: [tracks]};
			render();
		},
		render 							= function() {
			var output = tmpl.render(data);
			response.end(output);
		}
	facebook.checkLoginState(request, afterFacebookLoginStateChecked)
};
this.main 						= function(request, response) {
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
				getCharts();
			}
		},
		afterCollection 	= function(collections) {
			var library 	= collections.library,
				first5 		= _.last(library, 5).reverse();
			data.inlibrary  = library;
			if (first5.length == 0) {
				getCharts();
			}
			else {
				dbquery.getSongsByIdList(first5, afterIdList);
			}
		},
		afterIdList			= function(songs) {
			/*
				Add inlib to all songs
			*/
			var songs 		= _.map(songs, function(song) {song.inlib = true; return song;});
			data.library = _.map(songs, function(song) {
				return {
					song: song,
					hqimg: helpers.getHQAlbumImage(song, 200)
				}
			});
			getCharts();
		},
		getCharts 		 	= function() {
			var top5 		= _.first(charts.getFirstFive(), 5);
			var top5 		= _.map(top5, function(song) { song.inlib = (data.user && _.contains(data.inlibrary, song.id)); return song; });
			var top5 		= _.compact(top5);
			data.charts 	= _.map(top5, function(song) {
				return {
					song: song,
					hqimg: helpers.getHQAlbumImage(song, 200)
				}
			});
			var range 		= workers.getYearRange();
			data.randomyear  = range[Math.floor(Math.random()*range.length)];
			dbquery.getRetroCharts(data.randomyear, evaluateRetroCharts);
		},
		evaluateRetroCharts = function(charts) {
			if (charts) {
				dbquery.getSongsByIdList(_.first(charts.charts, 5), throwtogether);
			}
			else {
				throwtogether({});
			}
			
		},
		throwtogether		= function(topanno) {
			data.topanno 	= _.map(topanno, function(song) {
				return {
					song: song,
					hqimg: helpers.getHQAlbumImage(song, 200)
				}
			});
				redditsongs	= _.first(_.shuffle(workers.returnRedditSongs('/r/music')), 5);
			_.map(redditsongs, function(reddit) { 
				reddit.inlib= (data.user && _.contains(data.inlibrary, reddit.song.id)); 
				return reddit; 
			});
			data.topanno 	= _.map(data.topanno, function(song) {
				song.inlib 	= (data.user && _.contains(data.inlibrary, song.song.id));
				return song; 
			});
			data.charts 	= _.map(data.charts, function(song) {
				song.inlib 	= (data.user && _.contains(data.inlibrary, song.song.id));
				return song; 
			});
			data.library 	= _.map(data.library, function(song) {
				song.inlib 	= (data.user && _.contains(data.inlibrary, song.song.id));
				return song; 
			});
			data.redditsongs= redditsongs;
			render();
		}
		render 				= function() {
			var output 		= tmpl.render(data);
			response.end(output);
		}
	facebook.checkLoginState(request, afterlogin);
};
this.reddit 					= function(request, response) {
	var tmpl = swig.compileFile(templates.reddit),
		subreddits = workers.returnSubreddits(),
		data = {
			templates: templates,
			type: 'reddit',
			parseduration: parseduration,
			parsehours: parsehours,
			parsetext: parsetext,
			music: []
		},
		afterlogin			= function(user) {
			data.user 		= user;
			if (user) {
				data.user.loggedin = true;
				dbquery.getUserCollections(user, afterCollection);
			}
			else {
				buildPage()
			}
		},
		afterCollection		= function(collections) {
			data.library = collections.library;
			buildPage();
		}
		buildPage 			= function() {
			_.each(subreddits, function(subreddit) {
				var songs = _.first(workers.returnRedditSongs(subreddit), 6);
				if (data.user) {
					var songs = _.map(songs, function(song) { song.inlib = _.contains(data.library, song.song.id); return song; });
				}
				data.music.push({songs: songs, name: subreddit});
			});
			var arrays = _.pluck(data.music, 'songs'),
				tracksonly = _.pluck(_.reduceRight(arrays, function(a, b) { return a.concat(b); }, []), 'song');
			data.coverstack = _.first(_.pluck(tracksonly, 'image'), 9);
			render();
		},
		render 				= function() {
			var output = tmpl.render(data);
			response.end(output);
		}
	facebook.checkLoginState(request, afterlogin);	
}
this.playlist 					= function(request, response) {
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
			data.album = {cds: [[]]};
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
		data.playlist.rawduration = _.reduce(tracks, function(a, b) { return a + parseFloat(b.duration) }, 0)
		data.playlist.duration = helpers.parsehours(data.playlist.rawduration);
		data.playlist.trackcount = tracks.length;
		data.coverstack = _.first(_.pluck(tracks, 'image'), 9);
		render();
	},
	render 					= function() {
		var output  		= tmpl.render(data);
		response.end(output);
	}
	dbquery.getUser(token, afterUserFetched)
}
this.settings					= function(request, response) {
	var tmpl = swig.compileFile(templates.settings),
		cookie = new cookies(request, response),
		token = cookie.get('token');
	if (!token) {
		response.end('You need to login to save settings.');
	}
	else {
		dbquery.getUser(token, function(user) {
			if (user) {
				/*
					Add new settings/remove deprecated settings
				*/
				var settings = [];
				_.each(standards.settings, function(setting, key) {
						var stg = user ? _.where(user.settings, {key: setting.key}) : [];
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
			}
		});
	}
}