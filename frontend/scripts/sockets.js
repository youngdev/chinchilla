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
})