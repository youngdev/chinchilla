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
	if ($(e.srcElement).hasClass('heart') || e.srcElement.dataset.navigate != undefined) {
		return;
	}
	/*
		If the track is already selected, make drag&drop possible
	*/
	if ($(this).hasClass('selected') && e.button == 0) {
		var tounselect = $(".song.selected").not(this)
		var toselect   = $(this)
		$(document).one('mouseup', function () {
			toselect.addClass("selected");
			$(tounselect).removeClass("selected");
		});
		dragsongs(e);
		return;
	}
	/*
		Deselect all the other songs.
	*/
	if (e.button == 0) {
		var tounselect = $(".song.selected").not(this);
		$(this).addClass("selected");
		$(tounselect).removeClass("selected");
		dragsongs(e);
	}
	
};
var dragsongs = function(e) {
	var original = {
			x: e.clientX,
			y: e.clientY
		},
		todrag = _.map($('.selected'), function(dom) {return dom.dataset}),
		droppableplaces = $('.playlistmenuitem, .librarymenuitem');
	if (todrag.length == 1) {
		$('#draglabel').text(todrag[0].name + ' - ' + todrag[0].artist)
	}
	else {
		$('#draglabel').text(todrag.length + ' tracks');
	}
	document.body.style.cursor = 'default'
	$(document).on('mousemove', function (e) {
		var difference = Math.sqrt(Math.pow(Math.abs(e.clientX-original.x), 2) + Math.pow(Math.abs(e.clientY-original.y), 2));
		if (difference > 20) {
			$('#draglabel').css({top: e.clientY - 30, left: e.clientX}).show();
		} 
	});
	droppableplaces.on('mouseenter', function () {
		$(this).addClass('droppableindicator');
	});
	droppableplaces.on('mouseleave', function () {
		$(this).removeClass('droppableindicator');
	});
	droppableplaces.one('mouseup', function () {
		$(this).removeClass('droppableindicator');
		var target = $(this).attr('data-navigate');
			socket.emit('add-tracks-to-collection', {
				token: chinchilla.token,
				tracks: _.pluck(todrag, 'id'),
				destination: (target == '/library' ? 'library' : target),
				type: (target == '/library' ? 'library' : 'playlist')
			});
			
	});
	$(document).one('mouseup', function (e) {
		$(document).off('mousemove');
		$('#draglabel').hide()
		droppableplaces.off('mouseenter mouseup')
	})
}
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
	var width = 224
	player.automaticseekblocked = true;
	var mousemove = function (e) {
		var position = e.pageX
		$('#seek-progress').css('width', (position/width)*100 + "%");
	}
	$(document).on('mousemove', mousemove);
	$(document).one('mouseup', function (e) {
		$(document).off('mousemove');
		var position = e.pageX
		if (position > 224) {
			var position = 224
		}
		player.seek((position/width)*ytplayer.getDuration());
		player.automaticseekblocked = false;
	})
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
	if (!window.lastsearchtimestamp) {
		window.lastsearchtimestamp = Date.now();
	}
	else {
		var timestamp = Date.now()
		window.lastsearchtimestamp = timestamp;
		setTimeout(function() {
			if (timestamp == window.lastsearchtimestamp) {
				search.autocomplete(value);
			}
		}, 500);
	}
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
	$("#search-field").val("").keyup();
	window.lastsearchtimestamp = null;
}
var rightclick			= function(e) {
	e.preventDefault()
	var obj = {
		song: helpers.parseDOM(e.currentTarget),
		e: e,
		left: e.pageX
	}
	contextmenu(obj);
}
var playlistmenu 		= function(e) {
	e.preventDefault();
	var obj = {
		e: e,
		left: e.pageX,
		playlist: e.currentTarget
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
	var placeToAppend = obj.song ? '#view' : '#sidebar'
	var scrollHeight = $(placeToAppend)[0].scrollHeight;
	var offsets = {
		top:  obj.e.pageY,
		left: obj.left,
		bottom: document.height - obj.e.pageY
	}
	var pos = (obj.e.pageY < document.height/2) ? offsets.top : offsets.bottom;
	var toporbottom = (obj.e.pageY < (document.height/2)) ? 'top' : 'bottom'
	var menu = $('<div>', {
		class: 'contextmenu',
	}).css({
		left: 	offsets.left
	})
	.css(toporbottom, pos).
	html('<div class="loading-indicator"><div class="spinner"></div></div>').appendTo(placeToAppend);
	/*
		Remove the menu when you click on anything
	*/
	$(document).one('click', function() {
		menu.remove();
	});
	if (obj.song) {
		$(document).one('click', '.contextmenu-add-to-playlist', function(e) {
			$(this).parents('.context-options').html(loader.spinner());
			e.stopPropagation();
			socket.emit('add-playlist-dialogue', {song: this.dataset.id, token: chinchilla.token});
			socket.once('add-playlist-dialog-response', function(data) {
				$('.context-options').html(data.html);
			});
		});
		var song = obj.song;
		/*
			Fetch context menu
		*/
		socket.emit('get-contextmenu', {song: song, state: chinchilla});
		socket.once('contextmenu', function(data) {
			menu.html(data.html);
		});
	}
	else if (obj.playlist) {
		var playlist = obj.playlist.dataset.navigate;
		socket.emit('get-playlist-contextmenu', {playlist: playlist, state: chinchilla});
		socket.once('playlist-contextmenu', function(data) {
			menu.html(data.html);
		})
	}
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
	$.each(sorted, function(k, song) {  table.append(song) }  );
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
var hidenotification  	= function() {
	$(this).parents('.notification').remove()
}
var warnexit 			= function() {
	if (chinchilla.loggedin && chinchilla.settings.warn_before_leave) {
		return 'You are leaving the page but the music is still playing. Do you really want to leave? (You can turn this notification off in the settings)';
	}	
}
var showalbum 			= function() {
	$(this).hide().next('.hidden-album-container').show();
}
var newplaylist 		= function() {
	$(".new-playlist-input").show().find("input").val('').focus();
	$('html').one('click', function() {
		$(".new-playlist-input").hide().off();
		$('.new-playlist-input-field').off();
	});
	$('.new-playlist-input').on('click', function(e) {
		e.stopPropagation();
	});
	$('.new-playlist-input-field').on('keypress', submitplaylist);
}
var submitplaylist 		= function(e) {
	if (e.keyCode == 13) {
		$('.new-playlist-input-field').off();
		socket.emit('add-playlist', {name: $('.new-playlist-input-field').val(), token: chinchilla.token});
	}
}
var renameplaylist 		= function() {
	var url = this.dataset.id,
		name = this.dataset.name;
	var playlist = $('#sidebar [data-navigate="' + url+ '"]');
	var label = playlist.find('.pl-label').attr('contenteditable', true).focus();
	$(label).on('keypress', function(e) {
		if (e.keyCode == 13) {
			$(label).off().removeAttr('contenteditable');
			$('body').off();
			socket.emit('rename-playlist', {oldname: url, newname: $(label).text(), token: chinchilla.token});
			$(playlist).hide();
		}
	});

	function selectElementContents(el) {
	    var range = document.createRange();
	    range.selectNodeContents(el);
	    var sel = window.getSelection();
	    sel.removeAllRanges();
	    sel.addRange(range);
	}
	selectElementContents($(label)[0]);
	$('body').one('click', function() {
		$(label).off().removeAttr('contenteditable');
		$(label).text(name);
	});
	$(label).on('click', function(e) {
		e.stopPropagation();
	});
}
var deleteplaylist 		= function() {
	var url = this.dataset.id;
	var playlist = $('#sidebar [data-navigate="' + url+ '"]');
	socket.emit('delete-playlist', {url: url, token: chinchilla.token});
}
var suppressrenaming 	= function(e) {
	e.stopPropagation();
}
var addsongtopl 		= function() {
	var data = this.dataset;
	var socketdata = {
		type: 'playlist',
		tracks: [data.songid],
		token: chinchilla.token,
		destination: data.url
	}
	socket.emit('add-tracks-to-collection', socketdata);
}
var remsongfrompl 		= function() {
	var data = this.dataset;
	data.token = chinchilla.token;
	socket.emit('remove-song-from-playlist', data);
}
var pldropdown 			= function() {
	$('.playlist-options-dropdown').toggle();
	if ($('.playlist-options-dropdown').is(':visible')) {
		$('body').one('click contextmenu', function() {
			$(".playlist-options-dropdown").hide();
		});
		$('.playlist-options-dropdown').html(loader.spinner());
		socket.emit('get-playlist-options', {playlist: $('#view').attr('data-route'), token: chinchilla.token });
		socket.once('playlist-options', function(data) {
			$('.playlist-options-dropdown').html(data.html);
		});
	}
}
var mkplpublic 				= function() {
	var playlist 	= $('#view').attr('data-route');
	var label 		= $('.playlist-privacy')
	label.find('span').text('Public');
	label.find('img').attr('src', '/api/svg/public');
	socket.emit('change-playlist-privacy', {playlist: playlist, token: chinchilla.token, 'public': true});
}
var mkplprivate 			= function() {
	var playlist 	= $('#view').attr('data-route');
	var label 		= $('.playlist-privacy');
	label.find('span').text('Private');
	label.find('img').attr('src', '/api/svg/lock');
	socket.emit('change-playlist-privacy', {playlist: playlist, token: chinchilla.token, 'public': false});
}
var mkplnwattop 			= function() {
	var playlist 	= $('#view').attr('data-route');
	var label 		= $('.playlist-privacy');
	socket.emit('change-playlist-order', {playlist: playlist, token: chinchilla.token, 'newestattop': true});
}
var mkplnwatbottom 			= function() {
	var playlist 	= $('#view').attr('data-route');
	var label 		= $('.playlist-privacy');
	socket.emit('change-playlist-order', {playlist: playlist, token: chinchilla.token, 'newestattop': false});
}
var closenotification 		= function() {
	$('#statusbar').hide();
}
$(document)
.on('mousedown',    'tr.song',            				select      		) // Selecting tracks
.on('keyup',		'body',								keys				) // Keys
.on('dblclick',     '.song',            				playSong    		) // Doubleclick to play. Just POC yet.
.on('mousedown',    '#seek-bar',         				dragSeek			) // Block autmatic seeking while dragging
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
.on('contextmenu',	'.song.recognized, .queue-song',	rightclick  		) // Allows users to right-click
.on('contextmenu',	'.playlistmenuitem',				playlistmenu 		) // Gives options for playlists.
.on('change',		'.settings input',					setchange			) // New settings were made
.on('click',		'[data-order]',						ordersongs			) // Click on table header to sort songs.
.on('click',		'.play-all-album',					playalbum 			) // Play all the songs on one album
.on('click', 		'.add-all-album',					addalbumtolib		) // Add all tracks to an album
.on('click',		'.findandplay',						findandplay 		) // Searches for a track in the DOM and plays it
.on('click', 		'.notification .actions span',		hidenotification	) // Close notifications
.on('click',		'.albumhidden-message',				showalbum 			) // Show albums that are only instrumentals or EPs
.on('click',		'.add-new-playlist',				newplaylist 		) // New playlist
.on('click',		'.rename-playlist-button',			renameplaylist 		) // Rename playlist
.on('click', 		'.pl-label[contenteditable]',		suppressrenaming 	) // When you click on a playlist to rename, don't load the playlist
.on('click', 		'.delete-playlist-button',			deleteplaylist 		) // Delete playlist.
.on('click',		'.add-song-to-playlist-button', 	addsongtopl 		) // Add a song to a playlist 
.on('click',		'.remove-song-from-playlist-button',remsongfrompl 		) // Remove song from playlist
.on('click', 		'.playlist-privacy',		 		pldropdown 			) // click to reveal privacy options
.on('click', 		'.make-playlist-public', 			mkplpublic 			) // Contextmenu option to make playlist public
.on('click', 		'.make-playlist-private',			mkplprivate 		) // Contextmenu option to make playlist private
.on('click', 		'.make-playlist-newest-at-top',		mkplnwattop 		) // Puts the newest songs at the top of the playlist.
.on('click', 		'.make-playlist-newest-at-bottom',	mkplnwatbottom 		) // Puts the newest songs at the bottom of the playlist.
.on('click',		'.close-notification', 				closenotification 	) // Dismiss popup messages
$(window)
.on('beforeunload', 									warnexit			) // Warn before exit (Only when user set it in settings!)

/*
	When new tracks are in the DOM, there are some things we should do on the client-side...
*/
$(document).ready(function() {
	$.subscribe('new-tracks-entered-dom', function() {
		var unrecognized = $('.not-recognized');
		recognition.queue.clear();
	    _.each(unrecognized, function(track) {
	    	recognition.queue.push(track);
		});
		$('.song[data-id="' + player.nowPlaying.get().id + '"]').addClass('now-playing')
	});
	$.subscribe('view-gets-loaded', function() {
		$('#view').addClass('view-loading');
	});
	$.subscribe('view-got-loaded', function() {
		$('#view').removeClass('view-loading');
	});
});