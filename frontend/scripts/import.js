var addToCollections, addToImportQueue, cancelEverything, determineProvider, determineTarget, droparea, fileDropped, importqueue, queuechanged, queuestarted, recognize, recognizeFile, recognizeSpotify, recognizeTracks, startQueue, stopQueue, textDropped, weirdThingDropped;

droparea = $('#view');

importqueue = [];

queuestarted = false;

cancelEverything = function(e) {
	e.stopPropagation();
	return e.preventDefault();
};

fileDropped = function(files) {
	return _.each(files, function(file) {
		var track;
		track = {
			type: {
				provider: 'file',
				id: file
			},
			target: determineTarget()
		};
		return addToImportQueue(track);
	});
};

textDropped = function(text) {
	var links;
	links = text.split(/\n/);
	return _.each(links, function(link) {
		var track;
		track = {
			type: determineProvider(link),
			target: determineTarget()
		};
		if (track.type) {
			return addToImportQueue(track);
		}
	});
};

weirdThingDropped = function() {
	return console.log('something was dropped');
};

determineTarget = function() {
	return document.getElementById('view').dataset.route;
};

determineProvider = function(link) {
	if (link.length === 52 && link.substr(0, 30) === 'http://open.spotify.com/track/') {
		return {
			provider: 'spotify',
			id: link.substr(30)
		};
	} else if (link.substr(0, 28) === 'http://www.youtube.com/watch') {
		return {
			provider: 'youtube',
			id: link.substr(31, 11)
		};
	} else {
		return false;
	}
};

addToImportQueue = function(track) {
	importqueue.push(track);
	$('.import-trackcount').text(importqueue.length + (importqueue.length == 1 ? ' track' : ' tracks'));
	$('#importqueue').append(
		_.template(
			$("#import-track-template").html(), 
			{track: track}
		)
	)
	if (importqueue.length != 0) {
		$('.import-no-tracks').remove();
	}
	//return queuechanged();
};

queuechanged = function() {
	if (queuestarted) {
		if (importqueue.length === 0) {
			return stopQueue();
		}
	} else {
		if (importqueue.length !== 0) {
			return startQueue();
		}
	}
};

startQueue = function() {
	queuestarted = true;
	console.log('Queue started');
	$('body').addClass('queuestarted')
	return recognizeTracks();
};

stopQueue = function() {
	queuestarted = false;
	$('body').removeClass('queuestarted')
	return console.log('Queue ended');
};

recognizeTracks = function() {
	var firsttrack;
	if (importqueue.length == 0) { stopQueue(); return; }
	firsttrack = importqueue.shift();
	return recognize(firsttrack, function(song) {
		addToCollections(firsttrack, song);
		queuechanged();
		if (importqueue.length !== 0) {
			return recognizeTracks();
		}
	});
};

recognize = function(track, callback) {
	if (track.type.provider === 'spotify') {
		return recognizeSpotify(track, function(song) {
			return callback(song);
		});
	} else if (track.type.provider === 'file') {
		return recognizeFile(track, function(song) {
			return callback(song);
		});
	}
};

recognizeSpotify = function(track, callback) {
	var dom = $('.import-track[data-importid="' + track.type.provider + '-' + track.type.id + '"]');
	var domstatus = $(dom).find('.import-status');
	var domname = $(dom).find('.import-trackname');
	domstatus.text('Looking up track...')
	return $.getJSON('http://ws.spotify.com/lookup/1/.json?uri=spotify:track:' + track.type.id, function(json) {
		track = {
			name: json.track.name,
			artist: json.track.artists[0].name
		};
		domname.text(track.name + ' - ' + track.artist);
		domstatus.text('Requesting track info...')
		socket.emit('request-track-info', track);
		return socket.once('receive-track-info', function(data) {
			var song;
			if (data.error) {
				domstatus.text('Not found on Tunechilla.')
				return callback(null);
			} else {
				song = data.song;
				domstatus.text('Finding YouTube video...')
				return recognition.findVideo(song, function(video) {
					if (!video) {
						domstatus.text('No video found.');
						return callback(null);
					}
					song.ytid = helpers.parseYTId(video);
					socket.emit('new-track', song);
					domstatus.text('Adding...')
					return socket.once('track-uploaded', function(id) {
						if (id === song.id) {
							domstatus.text('Imported.')
							return callback(song);
						}
					});
				});
			}
		});
	});
};

recognizeFile = function(track, callback) {
	var reader;
	reader = new FileReader();
	reader.onload = function(e) {
		var dv;
		dv = new jDataView(this.result);
		if (dv.getString(3, dv.byteLength - 128) === 'TAG') {
			track = {
				name: dv.getString(30, dv.tell()),
				artist: dv.getString(30, dv.tell())
			};
			console.log(track);
			socket.emit('request-track-info', track);
			return socket.once('receive-track-info', function(data) {
				var song;
				if (data.error) {
					console.log('no track found');
					return callback(null);
				} else {
					song = data.song;
					return recognition.findVideo(song, function(video) {
						song.ytid = helpers.parseYTId(video);
						socket.emit('new-track', song);
						return socket.once('track-uploaded', function(id) {
							if (id === song.id) {
								return callback(song);
							}
						});
					});
				}
			});
		} else {
			console.log('NO ID3');
			return callback(null);
		}
	};
	return reader.readAsArrayBuffer(track.type.id);
};

addToCollections = function(info, song) {
	var target;
	target = chinchilla.playlist_target ? chinchilla.playlist_target : '/library';
	if (song) {
		if (_s.contains(target, '/u/') && _s.contains(target, '/p/')) {
			return socket.emit('add-tracks-to-collection', {
				token: chinchilla.token,
				tracks: [song.id],
				destination: target,
				type: 'playlist'
			});
		} else {
			return socket.emit('add-tracks-to-collection', {
				token: chinchilla.token,
				tracks: [song.id],
				destination: 'library',
				type: 'library'
			});
		}
	}
};

$(document).ready(function() {
	document.addEventListener('dragenter', function(e) {
		return cancelEverything(e);
	});
	document.getElementById('dropfiles').addEventListener('dragleave', function() {
		document.getElementById('dropfiles').className = '';
		return document.getElementById('dropfilescontent').className = '';
	});
	document.addEventListener('dragover', function(e) {
		document.getElementById('dropfiles').className = 'drag-hover';
		document.getElementById('dropfilescontent').className = 'drag-hover';
		return cancelEverything(e);
	});
	return document.addEventListener('drop', function(e) {
		var files, text;
		document.getElementById('dropfiles').className = '';
		document.getElementById('dropfilescontent').className = '';
		cancelEverything(e);
		files = e.dataTransfer.files;
		text = e.dataTransfer.getData('Text');
		var pathname = window.location.pathname;
		if (window.location.pathname != '/import') {
			if ((_s.contains(pathname, '/u/') && _s.contains(pathname, '/p/')) || pathname == '/library') {
				chinchilla.playlist_target = pathname;
			}
			navigation.to('/import')
		}
		if (files.length !== 0) {
			return fileDropped(files);
		} else if (text !== '') {
			return textDropped(text);
		} else {
			return weirdThingDropped();
		}
	});
});
