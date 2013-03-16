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
socket.on('connected', function() {
	sockets.connected = true;
});
socket.on('track-added', function(notification) {
	notifications.create(notification);
});
socket.on('tracks-added', function(songsadded) {
	
})
socket.on('track-removed', function(notification) {
	notifications.create(notification);
});
var pladded = function(div) {
	$('.new-playlist-input').hide();
	$('.playlists-menu').prepend(div);
}
socket.on('playlist-added', pladded);
socket.on('playlist-renamed', pladded)
var pladdfail = function(reason) {
	$('.new-playlist-input').hide();
	var error = $('<div>', {class: 'playlist-addition-failed'}).text(reason)
	error.prependTo('.playlists-menu').delay(3000).slideUp();
}
socket.on('playlist-addition-failed', pladdfail);
socket.on('playlist-renamed-failed', pladdfail);
socket.on('playlist-removed', function(data) {
	$("#sidebar [data-navigate='"+data.url+"']").remove();
});
socket.on('song-removed-from-playlist', function(data) {
	console.log(data);
	var one = $('[data-route="' + data.url + '"]');
	console.log(one);
	one.find('[data-id="' + data.songid + '"]').remove();
});