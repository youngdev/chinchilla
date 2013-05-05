helpers = {
	parseyear: function(timestamp) {
		return timestamp.substr(0,4);
	},
	localStorageSafety: function(key) {
		if (localStorage[key] == null || localStorage[key] == undefined || localStorage[key] == 'undefined') {
			localStorage[key] = "[]";
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
		This does not work well enough! jQuery's .data() sucks!
		return (obj instanceof HTMLElement) ? $(obj).data() : obj;
		*/

		return (obj instanceof HTMLElement) ? obj.dataset : obj;
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
    createID: function() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
        for( var i=0; i < 64; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
    
        return text;
    },
    getHQAlbumImage: function(album, size) {
    	var lq = album.image,
    		replace = (size) ? size : '400',
    		hq = lq.replace('100x100-75.jpg', (replace+'x'+replace+'-75.jpg'));
    	return hq;
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
		if 			(seconds < 90) 	{ label = 'One minute' }
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
	}
};
this.helpers = helpers;