var select      = function(e)   {
	/*
		Send to other function if batch selecting.
		Ctrl key selects all elements between already selected ones and the clicked.
	*/
	if (e.shiftKey) {
		shiftSelect(this);
		return;
	}
	/*
		Send to another function if CMD key is pressed.
		CMD key selects/deselects single elements without changing selection
	*/
	if (e.ctrlKey || e.metaKey) {
		cmdSelect(this);
		return;
	}
	/*
		If user just wants to fav songs, don't select
	*/
	if ($(e.srcElement).hasClass('heart')) {
		return
	}
	/*
		Deselect all the other songs.
	*/
	$(".song.selected").removeClass("selected");
	$(this).addClass("selected");
};
window.playSong = function(e)    {
		/*
			If user just dblclicked on the heart, don't play the song.
		*/
		if ($(e.srcElement).hasClass('heart')) {
			return
		}
		/*
			Get all next songs
			Add them to the queue.
		*/
		var nextSongs = $(this).nextAll(".song");
		player.queue1.clear();
		player.queue2.clear();
		$.each(nextSongs, function(key, song) {
			player.queue2.add(song);
		});
		player.playSong(this);	
};
var shiftSelect         = function(obj) {
	var song         = $(obj),
		closestprev  = song.prevAll(".selected")[0],
		closestnext  = song.nextAll(".selected")[0];
	if (closestprev !== undefined) {
		song.prevUntil(closestprev, ".song").andSelf().addClass("selected");
	}
	if (closestnext !== undefined) {
		song.nextUntil(closestnext, ".song").andSelf().addClass("selected");
	}
};
var cmdSelect           = function(obj) {
	$(obj).toggleClass("selected");
};
var dragSeek			= function(obj) {
	player.automaticseekblocked = true;
};
var dragSeekUp			= function(obj) {
	player.automaticseekblocked = false;
	var seek = $("#seekbar").val()/100;
	player.seek(seek*ytplayer.getDuration());
};
var resume				= function(obj) {
	player.play();
};
var pause               = function(obj) {
	player.pause();
};
var skip                = function() {
	player.playNext();
};
var rewind              = function() {
	player.playLast();
};
var tooltip             = function(e) {
	var original = this;
	var tooltip = $("<div>", {
		class: "tooltip"
	}).css({
		top:    $(original).offset().top + $(original).height() + 3,
		left:   $(original).offset().left
	}).html($(original).attr("data-tooltip")).appendTo("body");
	$(original).mouseout(function() {
		$(tooltip).remove();
	});
};
var autocomplete        = function() {
	/*
		Trigger search method
	*/
	var searchfield = $("#search-field"),
		value		= searchfield.val(),
		results     = $("#search-results"),
		clearinput 	= $("#clear-input");
	search.autocomplete(value);
	/*
		Hide/show suggestions
	*/
	if (value === "") {
		results.hide();
		clearinput.hide();

	}
	else {
		results.show();
		clearinput.show();
	}
};
var logout 				= function() {
	var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
    	var cookie = cookies[i];
    	var eqPos = cookie.indexOf("=");
    	var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    	document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    window.location.reload();
};
var addtolib			= function() {
	if (!$(this).hasClass('song') && !$(this).hasClass('library-button')) {
		var toadd = ($(this).parents('.song'))[0];
	}
	else {
		var toadd = this;
	}
	var song = helpers.parseDOM(toadd);
	library.add(song);
}
var remfromlib			= function() {
	if (!$(this).hasClass('song') && !$(this).hasClass('library-remove-button')) {
		var torem = ($(this).parents('.song'))[0];
	}
	else {
		var torem = this;
	}
	var song = helpers.parseDOM(torem);
	library.remove(song);
}
var clearinput 			= function() {
	$("#search-field").val("").keyup()
}
var rightclick			= function(e) {
	e.preventDefault()
	var obj = {
		top:  e.pageY,
		left: e.pageX,
		song: helpers.parseDOM(e.currentTarget)
	}
	contextmenu(obj);
}
var contextmenu 		= function(obj) {
	/*
		First, remove all the other contextmenus
	*/
	$('.contextmenu').remove();
	/*
		Build a placeholder for the contextmenu
	*/
	var menu = $('<div>', {
		class: 'contextmenu',
	}).css({
		top: 	obj.top,
		left: 	obj.left
	}).html('<div class="loading-indicator"><div class="spinner"></div></div>').appendTo('body');
	/*
		Remove the menu when you click on anything
	*/
	$('*').one('click', function() {
		menu.remove()
	});
	var song = obj.song;
	/*
		Fetch context menu
	*/
	socket.emit('get-contextmenu', {song: song, state: chinchilla});
	socket.once('contextmenu', function(data) {
		menu.html(data.html);
	})
}
var setchange			= function() {
	var dom = $('.settings .setting');
	var settings = []
	$.each(dom, function(a, setting) {
		var setting = {
			key: setting.dataset.setting,
			label: $(setting).find('p').text(),
			value: $(setting).find('input').is(':checked')
		}
		settings.push(setting);
		chinchilla.settings[setting.key] = setting.value;
	});
	socket.emit('update-settings', {settings: settings, token: chinchilla.token});
	socket.once('settings-saved', function() {
		console.log("Settings saved");
	})
}
var ordersongs			= function() {
	var mode,
		header = $(this);
	//Descending
	if 		( header.hasClass('ascending')) 	{ header.addClass('descending'); header.removeClass('ascending');  mode = 'desc'}
	//Normal
	else if ( header.hasClass('descending')) 	{ header.removeClass('descending'); mode = 'default'}
	//Ascending
	else 										{ header.addClass('ascending'); mode = 'asc'} 
	$(header).siblings('th').removeClass('ascending descending')
	var	sortby = (mode == 'default') ? 'index' : header.attr('data-value'),
		table  = header.parents('table').eq(0),
		songs  = $(table).find('.song'),
		sorted = _.sortBy(songs, function(song) { var a = song.dataset[sortby]; return (!isNaN(a) ? parseFloat(a) : a) }),
		revers = (mode == 'desc') ? sorted.reverse() : sorted;
		html   = '';
	/*
		Remove the old songs
	*/
	songs.remove();
	/*
		Add new songs
	*/
	$.each(sorted, function(k, song) {  table.append(song) });
}
var playalbum 			= function() {
	var album 		= $(this).parents('.album');
	var songs 		= album.find('.song.recognized');
	var firstsong 	= (songs.splice(0,1))[0];
	player.queue2.clear();
	$.each(songs, function(k, song) {
		player.queue2.add(song);
	});
	player.playSong(firstsong);
}
var findandplay 		= function() {
	var id = $(this).attr("data-id");
	var song = ($('.song[data-id='+id+']').eq(0))[0];
	player.playSong(song);
}
var addalbumtolib 		= function() {
	var album 		= $(this).parents('.album');
	var songs 		= album.find('.song.recognized');
	var array 		= [];
	$.each(songs, function(key, value) {
		array.push(helpers.parseDOM(value));
	}); 
	library.batchAdd(array);
}
var keys 				= function(e) {
	var key = e.keyCode;
	/*
		Don't trigger this function when focus is in input
	*/
	if ($(e.srcElement).is('input')) {
		return;
	}
	e.preventDefault();
	/*
		Down key
	*/
	if (key == 40 || key == 38) {
		var thissong = $('.song.selected')
		var upordown = (key == 40) ? 'next' : 'prev';
		var next = thissong[upordown]('.song').addClass('selected');
		if (!e.shiftKey && next.length != 0) {
			thissong.removeClass('selected');
		}
	}
	/*
		Enter key
	*/
	if (key == 13) {
		var songs 		= $('.song.selected.recognized');
		var last 		= songs[songs.length-1];
		var firstsong 	= songs.splice(0,1);
		player.playSong(firstsong[0]);
		player.queue2.clear();
		player.queue1.clear();
		_.each(songs, function(song) {
			player.queue1.add(song);
		});
		var queue2 = $(last).nextAll('.song.recognized');
		$.each(queue2, function(key, song) {
			player.queue2.add(helpers.parseDOM(song));
		});
	}

}
var hidenotification  = function() {
	$(this).parents('.notification').remove()
}
$(document)
.on('mousedown',    '.song',            				select      		) // Selecting tracks
.on('keyup',		'body',								keys				) // Keys
.on('dblclick',     '.song',            				playSong    		) // Doubleclick to play. Just POC yet.
.on('mousedown',    '#seekbar',         				dragSeek			) // Block autmatic seeking while dragging
.on('mouseup',      '#seekbar',         				dragSeekUp  		) // Update and seek
.on('click',        '#play',            				resume      		) // Play or resume song.
.on('click',        '#pause',           				pause				) // Pause music.
.on('click',        '#skip',            				skip				) // Skip track. Play next one.
.on('click',        '#rewind',          				rewind				) // Go back to previous track.
.on('mouseover',    '[data-tooltip]',   				tooltip     		) // Show small black tooltips.
.on('keyup',        '#search-field',    				autocomplete		) // Show suggestions when user types into search.
.on('click',		'#clear-input',						clearinput  		) // Delete everything in the search field.
.on('click',        '.play-button',     				playSong			) // Play buttons are in track views for instance.
.on('click',		'.library-button',					addtolib			) // Sends a request to the server to save the song.
.on('click',		'.library-remove-button', 			remfromlib			) // Sends a request to the server to remove the song.
.on('click',		'.not-in-library .heart',			addtolib 			) // Inline add to library
.on('click',		'.in-library .heart',				remfromlib 			) // Inline remove from library
.on('click',		'#logout',							logout				) // Logout
.on('contextmenu',	'.song.recognized',					rightclick  		) // Allows users to right-click
.on('change',		'.settings input',					setchange			) // New settings were made
.on('click',		'[data-order]',						ordersongs			) // Click on table header to sort songs.
.on('click',		'.play-all-album',					playalbum 			) // Play all the songs on one album
.on('click', 		'.add-all-album',					addalbumtolib		) // Add all tracks to an album
.on('click',		'.findandplay',						findandplay 		) // Searches for a track in the DOM and plays it
.on('click', 		'.notification .actions span',		hidenotification	) // Close notifications