sockets = {
	/*
		This is set false, but when an connection is established, the server sends a message and it turn to true.
	*/
	connected: false
}
/*
	Connect to the Websockets server.
*/
var socket = io.connect(window.location.origin);
/*
	The server sends an initial confirmation when you are connected to socket.io. Set. sockets.connected to true.
*/
var pladdfail = function(reason) {
	$('.new-playlist-input').hide();
	var error = $('<div>', {class: 'playlist-addition-failed'}).text(reason)
	error.prependTo('.playlists-menu').delay(3000).slideUp();
}
var pladded = function(div) {
	$('.new-playlist-input').hide();
	$('.playlists-menu').prepend(div);
}
socket.on('connected', function() {
	sockets.connected = true;
});
socket.on('track-added', function (data) {
	notifications.create(data.notification);
	var table = $('[data-route="/library"]  .extendedtable tbody');
	if (data.position == 'top') {
		table.find('.song').eq(0).before(data.song);
	}
	else {
		table.append(data.song);
	}
	$('.song[data-id="' + $(data.song).attr('data-id') + '"]').addClass('in-library animated').removeClass('not-in-library')
});
socket.on('tracks-added', function (data) {
	var table = $('[data-route="/library"]  .extendedtable tbody');
	$.each(data.divs, function(key, song) {
		if (data.position == 'top') {
			table.find('.song').eq(0).before(song);
		}
		else {
			table.append(song);
		}
		$('.song[data-id="' + $(song).attr('data-id') + '"]').addClass('in-library animated').removeClass('not-in-library')
	});
	_.each(data.tracks, function (track) {
		chinchilla.library.push(track);
	});
	notifications.create(data.notification)
});
socket.on('tracks-removed', function (data) {
	var table = $('[data-route="/library"]  .extendedtable tbody');
	$.each(data.tracks, function (key, song) {
		var song = table.find('[data-id="' + song + '"]').remove();
	});
	notifications.create(data.notification);
	console.log(data.tracks);
	_.each(data.tracks, function (track) {
		chinchilla.library = _.without(chinchilla.library, track);
	});
});
socket.on('track-removed', function (data) {
	notifications.create(data.notification);
	var view = $('[data-route="/library"]')
	var song = view.find('[data-id="' + data.id + '"]').remove();
	chinchilla.library = _.without(chinchilla.library, data.id);
});

socket.on('playlist-added', pladded);
socket.on('playlist-renamed', pladded)

socket.on('playlist-addition-failed', pladdfail);
socket.on('playlist-renamed-failed', pladdfail);
socket.on('playlist-removed', function (data) {
	$("#sidebar [data-navigate='" + data.url + "']").remove();
});
socket.on('notification', function (data) {
	notifications.create(data.html)
});
socket.on('tracks-added-to-collection', function (data) {
	notifications.create(data.html)
});
function listChanged(data) {
	var view = $('[data-route="' + data.view + '"]')
	var table = view.find('tbody');
	var trackcountlabel = view.find('.playlist-trackcount');
	var pldurationlabel = view.find('.playlist-duration');
	var trackslabel 	= view.find('.playlist-plural-singular-tracks');
	$(trackcountlabel).text(data.trackcount);
	var newduration = parseFloat($(pldurationlabel).attr('data-duration')) + data.lengthdifference;
	$(pldurationlabel).text(helpers.parsehours(newduration)).attr('data-duration', newduration);
	$(trackslabel).text(data.trackslabel == 1 ? 'track' : 'tracks');
	return table;
}
socket.on('playlist-song-removed', function (data) {
	var table = listChanged(data);
	var trackcountlabel2 = $("[data-url='" + data.view + "']").addClass("add-song-to-playlist-button not-in-playlist").removeClass("remove-song-from-playlist-button in-playlist contains-song").find('.song-page-playlist-trackcount').text(data.trackcount);
	var view = $('[data-route="' + data.view + '"]');
	view.find('[data-id="' + data.songid + '"]').remove();
});
socket.on('playlist-song-added', function (data) {
	var table = listChanged(data);
	var trackcountlabel2 = $("[data-url='" + data.view + "']").removeClass("add-song-to-playlist-button not-in-playlist").addClass("remove-song-from-playlist-button in-playlist contains-song").find('.song-page-playlist-trackcount').text(data.trackcount);
	if (data.position == 'top' && (table.find('.song').length != 0)) {
		table.find('.song').eq(0).before(data.song);
	}
	else {
		table.append(data.song);
	}
});
socket.on('multiple-playlist-songs-added', function (data) {
	console.log(data);
	var table = listChanged(data);
 	$.each(data.divs, function (key, div) {
		if (data.position == 'top' && (table.find('.song').length != 0)) {
			table.find('.song').eq(0).before(div);
		}
		else {
			table.append(div);
		}
	});
	_.each(data.tracks, function (trackid) {
		$('[data-route="/song/' + trackid + '"]')
		.find("[data-url='" + data.view + "']")
			.removeClass("add-song-to-playlist-button not-in-playlist")
			.addClass("remove-song-from-playlist-button in-playlist contains-song")
			.find('.song-page-playlist-trackcount')
				.text(data.trackcount);
	});
	notifications.create(data.notification)
});

socket.on('multiple-playlist-songs-removed', function (data) {
	var table = listChanged(data);
	$.each(data.tracks, function (key, song) {
		table.find('[data-id="' + song + '"]').remove();
	});
	notifications.create(data.notification);
});
