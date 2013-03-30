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
});
socket.on('tracks-added', function(songsadded) {
	
});
socket.on('track-removed', function (data) {
	notifications.create(data.notification);
	var view = $('[data-route="/library"]')
	var song = view.find('[data-id="' + data.id + '"]').remove();
});

socket.on('playlist-added', pladded);
socket.on('playlist-renamed', pladded)

socket.on('playlist-addition-failed', pladdfail);
socket.on('playlist-renamed-failed', pladdfail);
socket.on('playlist-removed', function (data) {
	$("#sidebar [data-navigate='" + data.url + "']").remove();
});
socket.on('playlist-song-removed', function (data) {
	var view = $('[data-route="' + data.view + '"]');
	view.find('[data-id="' + data.songid + '"]').remove();
	var trackcountlabel = view.find('.playlist-trackcount');
	var pldurationlabel = view.find('.playlist-duration');
	var trackslabel 	= view.find('.playlist-plural-singular-tracks');
	$(trackcountlabel).text(data.trackcount);
	var newduration = parseFloat($(pldurationlabel).attr('data-duration')) + data.lengthdifference;
	$(pldurationlabel).text(helpers.parsehours(newduration)).attr('data-duration', newduration);
	$(trackslabel).text(data.trackslabel == 1 ? 'track' : 'tracks');
});

socket.on('playlist-song-added', function (data) {
	var view = $('[data-route="' + data.view + '"]')
	var table = view.find('tbody');
	var trackcountlabel = view.find('.playlist-trackcount');
	var pldurationlabel = view.find('.playlist-duration');
	var trackslabel 	= view.find('.playlist-plural-singular-tracks');
	if (data.position == 'top' && (table.find('.song').length != 0)) {
		table.find('.song').eq(0).before(data.song);
	}
	else {
		table.append(data.song);
	}
	$(trackcountlabel).text(data.trackcount);
	var newduration = parseFloat($(pldurationlabel).attr('data-duration')) + data.lengthdifference;
	$(pldurationlabel).text(helpers.parsehours(newduration)).attr('data-duration', newduration);
	$(trackslabel).text(data.trackslabel == 1 ? 'track' : 'tracks');
});