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
        return video.id.$t.substr(-11)
    }
}
this.helpers = helpers;