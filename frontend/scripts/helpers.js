helpers = {
	parseyear: function(timestamp) {
		return timestamp.substr(0,4);
	},
	localStorageSafety: function(key) {
		if (localStorage[key] == null || localStorage[key] == undefined || localStorage[key] == 'undefined') {
			localStorage[key] = "[]";
		}
	},
	localStorageSafetyObject: function(key) {
		if (localStorage[key] == null || localStorage[key] == undefined || localStorage[key] == 'undefined') {
			localStorage[key] = "{}";
		}
	},
	getLocalStorage: function(key) {
		this.localStorageSafety(key);
		return JSON.parse(localStorage[key]);
	},
	addToLocalStorage: function(key, obj, first) {
		this.localStorageSafety(key);
		var ls = this.getLocalStorage(key);
		if (!first) {ls.push(obj)} else {ls.unshift(obj)}
		if (key == 'history') {
			ls = _.last(ls, 50);
		}
		localStorage[key] = JSON.stringify(ls);
		return this.getLocalStorage(key);
	},
	clearLocalStorage: function(key) {
		localStorage[key] = "[]";
		return this.getLocalStorage(key);
	},
	parseDOM: function(obj) {
		/*
		Don't use jQuery .data() here, it breaks everything
		*/
		var song =  (obj instanceof HTMLElement) ? obj.dataset : obj;
		if (song) {
			song.id = parseFloat(song.id);
		}

		return song;
	},
	parsetime: function(number) {
		var divide = (number > 5000) ? 1000 : 1
		var fullseconds = Math.round(number / divide), 
			minutes = Math.floor(fullseconds/60),
			seconds = fullseconds-(minutes*60)
		if (seconds < 10) {
			seconds = "0" + seconds;
		}
		return minutes+":"+seconds;
	},
	slugify: function(str) {
		if (str == null) return '';

    	var from  = "ąàáäâãåæćęèéëêìíïîłńòóöôõøśùúüûñçżź",
    	    to    = "aaaaaaaaceeeeeiiiilnoooooosuuuunczz",
    	    regex = new RegExp(helpers.defaultToWhiteSpace(from), 'g');

    	str = String(str).toLowerCase().replace(regex, function(c){
    	  var index = from.indexOf(c);
    	  return to.charAt(index) || '-';
    	});

    	return _s.dasherize(str.replace(/[^\w\s-]/g, ''));
	},
	defaultToWhiteSpace: function(characters) {
		if (characters == null)
    	  return '\\s';
    	else if (characters.source)
    	  return characters.source;
    	else
    	  return '[' + helpers.escapeRegExp(characters) + ']';
	},
	escapeRegExp: function(str) {
		 if (str == null) return '';
      		return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
	},
    parseYTId: function(video) {
    	return (video == undefined) ? null : video.id.$t.substr(-11);
    },
    createID: function(l) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
        for( var i=0; i < l; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
    
        return text;
    },
    getHQAlbumImage: function(album, size) {
    	var lq = album.image;
    	//Just in case something invalid gets passed, so the server doesn't crash then.
    	if (!lq) 	{ return 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==' }
    	if (!size) 	{ return lq };
    	return lq.replace('100x100-75.jpg', (size+'x'+size+'-75.jpg'));
    },
    coverArrayToHQ: function(songs, size) {
    	var newarray = [];
    	for (i = 0; i < songs.length ;i++) {
			newarray.push(helpers.getHQAlbumImage({image: songs[i]}, size));
    	}
    		
    	return newarray;
    },
    parsetext: function(text) {
		/*
			Make all texts a string
		*/
		var text = text + '';
		/*
			Extract parenthesis text and wrap it in a span tag with the class 'lighttext'
		*/
		var parenthesis = (text.indexOf('(') != -1) ? '<span class="lighttext">' + ((text.substr(text.indexOf('('))).substr(1)).replace(')', '') + '</span>' : '';
		/*
			Get the text outside the parentesis
		*/
		var light 	  = (text.indexOf('(') != -1) ? text.substr(0, text.indexOf('(')) : text
		/*
			Return the text
		*/
		return light + parenthesis;
	},
	parsehours: function(number) {
		var seconds = number / 1000,
			label;
		if 			(seconds < 10) { label = 'a few seconds'} 
		else if 	(seconds < 50) { label = Math.round(seconds/10)*10 + ' seconds'}
		else if 	(seconds < 90) 	{ label = 'one minute' }
		else if 	(seconds < 3600) { label = Math.round(seconds/60) + ' minutes' }
		else if 	(3600 <= seconds) { label = Math.round(seconds/360)/10 + ' hours'}
		else 		{label = 'Unknown length'}
		
		return label;
	},
	albumRelevance: function(album, underscore) {
		var _ = underscore;
		var hidden = [
			{
				word: 'remix',
				reason: 'This album only contains Remixes of one song:'
			},
			{
				word: 'instrumental',
				reason: 'This is is the Instrumental version of'
			},
			{
				word: '- ep',
				reason: 'This album may contain duplicate tracks:'
			},
			{
				word: 'acoustic',
				reason: 'This album is an acoustic version:'
			},
			{
				word: 'itunes',
				reason: 'This album is an iTunes version:'
			},
			{
				word: 'live',
				reason: 'This is a live album:'
			},
			{
				word: 'karaoke',
				reason: 'This is a karaoke/instrumental version: '
			}
		];
		_.each(hidden, function(hide) {
			if (((album.name+'').toLowerCase()).indexOf(hide.word) != -1) {
				album.hidden = hide.reason;
			}
		});
		if (album.tracks > 30) {
			album.hidden = 'This album is very long (' + album.tracks + ' tracks):'
		}
		return album;
	},
	parseAlbumTitle: function(album) {
		var prename             = album.name+'',
			name                = prename.substr(0, (prename.indexOf("(") == -1) ? prename.length : prename.indexOf("(") -1),
			parenthesisregex    = /\(([^()]+)\)/g,
			inparenthesis       = prename.match(parenthesisregex),
			withoutbrackets     = inparenthesis ? inparenthesis[0].substr(1, inparenthesis[0].length-2) : null;
		album.name              = name;
		album.subtitle          = withoutbrackets;
		return album;
	},
	sortTracks: function(order, tracks) {
		var songs = [];
		_.each(order, function(id) {
			var song = _.find(tracks, function(item) { return item.id == id });
			if (song) {
				songs.push(song);
			}
		});
		return songs;
	},
	makeAlbum: function(data, _) {
		return {
			id: 		data.album.collectionId,
			tracks: 	data.songs.length,
			artist: 	data.album.artistName,
			artistid: 	data.album.artistId,
			release: 	data.album.releaseDate,
			image: 		data.album.artworkUrl100,
			name: 		data.album.collectionName,
			hours: 		_.reduce(_.pluck(data.songs, 'duration'), function(memo, num) {return memo + parseFloat(num)}, 0)
		}
	},
	parseReleaseLeft: function(time) {
		var release = new Date(time);
		if (release == 'Invalid Date') {
			return '';
		}
		else {
			var timeleft = release - new Date(),
				secleft  = timeleft/1000;
			if (secleft < 3600) {
				return 'Album will be released within 1 hour';
			}
			else {
				var hoursleft = secleft/3600;
				if (hoursleft < 24) {
					return 'Album will be available in ' + Math.floor(hoursleft) + ' hours';
				}
				else {
					var daysleft = Math.floor(hoursleft/24);
					if (daysleft == 1) {
						return 'Album will be available tomorrow';
					}
					else {
						return 'Album will be available in ' + ' days'; 
					}
				}
			}
		}
	},
	titleMatcher: function(title, _) {
		return _.chain(
			title
				.toLowerCase()
				.split(/[.&()\[\]\-\s]/g)
		).compact().without('ft', 'feat', 'lyric', 'lyrics', 'official', 'hd', 'music', 'audio', 'hq', 'video')._wrapped;
	}
};
this.helpers = helpers;