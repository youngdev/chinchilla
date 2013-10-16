player = {};
player.playSong = function(song, noautoplay, nohistory) {
	var songobj = helpers.parseDOM(song);
	if ($(song).hasClass("recognized") || songobj.ytid != undefined) {
		/*
			If user has YTID replacements, f.e. when living in Germany these are generated
		*/
		songobj = videoIdReplacements(songobj);
		/*
			Send YTID to YouTube player
		*/
		if (noautoplay) {
			ytplayer.cueVideoById(songobj.ytid);
		}
		else {
			if (ytplayer.loadVideoById) {
				ytplayer.loadVideoById(songobj.ytid);
			}
			else {
				setTimeout(function() {
					player.playSong(song, noautoplay, nohistory);
				}, 250);
				
			}
			$('#seek-bar').addClass('buffering');
		}
		/*
			Add current song to localStorage
		*/
		if (!nohistory) {
			player.history.add(player.nowPlaying.get());
		}
		/*
			Add old song to history
		*/
 		player.nowPlaying.replace(songobj, noautoplay);
 		/*
			Change the title of the page
 		*/
 		$('title').text(songobj.name + ' - ' + songobj.artist);
 		/*
			If the user wants to, set the album cover as favicon
 		*/
 		if (chinchilla.settings.favicon_album) {
 			$('#favicon').attr('href', songobj.image);
 		}
	}
	else {
		var dom = (song instanceof HTMLElement) ? $(song) : $(".song[data-id=" + song.id + "]")[0];
		$(dom).addClass("wantstobeplayed");
		recognition.stop();
		recognition.queue.unshift(songobj)
		recognition.start();
	}
}
updateHints = function() {
	var queue1    = player.queue1.get(),
			queue2    = player.queue2.get(),
			queue     = queue1.concat(queue2),
			next      = queue.shift(),
			hist      = player.history.get(),
			prev      = hist.pop(),
			nextlabel = (next != undefined) ? "<strong>" + next.name + "</strong><br>" + next.artist : "There is no track in your queue!",
			prevlabel = (prev != undefined) ? "<strong>" + prev.name + "</strong><br>" + prev.artist : "There is no track in your history!";
		$(".next-update").html(nextlabel);
		$(".prev-update").html(prevlabel);
		$("#skip").attr("data-tooltip", "<div class='next-update'>" + nextlabel + "</div>");
		$("#rewind").attr("data-tooltip", "<div class='prev-update'>" + prevlabel + "</div>");
}
player.nowPlaying = {
	replace: function(song, noautoplay) {
		var oldsong = player.nowPlaying.get();
		var song = helpers.parseDOM(song);
		localStorage['nowPlaying'] = JSON.stringify(song);
		console.log(song)
		$("#track-title a").text(song.name).attr('data-navigate', '/song/' + song.id);
		$("#track-artist a").text(song.artist).attr('data-navigate', '/artist/' + song.artistid);
		$("#track-album a").text(song.album).attr('data-navigate', '/album/' + song.albumid);
		var npimage1 = $("#nowplaying-image"), npimage2 = $("#nowplaying-image2"), cover = helpers.getHQAlbumImage(song, 225);
		if (!$('#sidebar-player').is(':visible')) {
			player.show();
		}
		if ((oldsong && oldsong.image != song.image) || (npimage1.attr('src') == '' && npimage1.attr('src') == '')) {
			if (npimage1.hasClass('np-placeholder-used')) {
				npimage1.removeClass('np-placeholder-used').attr('src', '');
				npimage2.attr('src', cover).addClass('np-placeholder-used').one('load', function() {
					$(npimage2).css({opacity: 1}, 400);
					$(npimage1).css({opacity: 0}, 400);
				});
			}
			else {
				npimage2.removeClass('np-placeholder-used').attr('src', '')
				npimage1.attr('src', cover).addClass('np-placeholder-used').one('load', function() {
					$(npimage1).css({opacity: 1}, 400);
					$(npimage2).css({opacity: 0}, 400);
				});
			}
		}
		$('.song').removeClass('now-playing hearable')
		$(".song[data-id='" + song.id + "']").addClass('now-playing');
		updateHints();
		remote.updateTrack();
	},
	get: function(song) {
		helpers.localStorageSafety('nowPlaying');
		return (localStorage['nowPlaying'] == '[]') ? null :  JSON.parse(localStorage['nowPlaying']);
	}
}
var Queue = function(name) {
	this.add = function(song, first) {
		var song = helpers.parseDOM(song)
		var lskey = name;
		helpers.localStorageSafety(lskey);
		helpers.addToLocalStorage(lskey, song, first);
		player.drawQueue();
		updateHints();
		return helpers.getLocalStorage(lskey);
	}
	this.get = function() {
		return helpers.getLocalStorage(name);
	}
	this.clear = function() {
		return helpers.clearLocalStorage(name);
	}
	this.getAndRemoveFirst = function() {
		var list = helpers.getLocalStorage(name);
		var element = list.splice(0,1);
		localStorage[name] = JSON.stringify(list);
		player.drawQueue();
		return element[0];
	}
if (name == "history") {
	this.playLast = function() {
		var list = helpers.getLocalStorage(name);
		if (list.length != 0) {
			player.queue1.add(player.nowPlaying.get(), true)
			var last = list.pop()
			localStorage[name] = JSON.stringify(list);
			player.playSong(last, false, true);
			player.drawQueue();
		}		
	}
}
}
player.queue1  = new Queue('queue1');
player.queue2  = new Queue('queue2');
player.history = new Queue('history');
player.automaticseekblocked = false;
var stateChange = function(state) {
	/*
		var states = {0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued}
	*/
	if (state == 1) {
		$("#play").hide();
		$("#pause").show();
		$('#seek-bar').removeClass('buffering');
		$('.now-playing').addClass('hearable');
	}
	else {
		if (state == 0) {
			player.playNext()
		}
		if (state == 2) {
			$('.now-playing').removeClass('hearable')
		}
		$("#pause").hide();
		$("#play").show();
	}
}
var videoEnded = function() {
	player.playNext();
}
var videoIdReplacements = function(song) {
	helpers.localStorageSafetyObject('videoIdReplacements');
	var replacements 	= helpers.getLocalStorage('videoIdReplacements');
	var replacementid 	= replacements[song.ytid];
	if (replacementid 	!= undefined) {
		song.ytid = replacementid;
	}
	return song;

}
var replaceVideo = function(videoid, replacement) {
	helpers.localStorageSafety('videoIdReplacements');
	var replacements 					= JSON.parse(localStorage['videoIdReplacements']);
	replacements[videoid] 				= replacement;
	localStorage['videoIdReplacements'] = JSON.stringify(replacements);
}
var errorOccured = function(error_code) {
	if (error_code == 0) {
		notifications.create('The video could not be loaded due to some country restrictions. Looking for an alternative...');
	}
	else {
		notifications.create('A unknown error happened while trying to play the video. Looking for an altenative...')
	}
	/*
		Find an alternative video
	*/
	var song = player.nowPlaying.get()
	recognition.findVideo(song, function(video) {
		if (video != undefined) {
			var oldid = song.ytid,
				newid = video['media$group']['yt$videoid']['$t'];
			song.ytid = newid;
			replaceVideo(oldid, newid);
			player.playSong(song, false, true);
			notifications.create('Alternative found. In the future, this video will be played.');
		}
		else {
			notifications.create('No video available in your country was found. We cannot play this song, sorry.');
		}
	}, undefined, undefined, undefined, ['restricted']);
}
player.show = function() {
	$('#sidebar-player').slideDown(800).animate({'opacity': 1});
}
player.setUpEvents = function() {
	/*
		Make the play button different
	*/
	ytplayer.addEventListener('onStateChange',	'stateChange');
	ytplayer.addEventListener('onEnded',		'videoEnded' );
	ytplayer.addEventListener('onError', 		'errorOccured');
	/*
		Update time label
	*/
	var timeUpdate = function() {
			var current   		= ytplayer.getCurrentTime(),
				duration  		= ytplayer.getDuration(),
				parsedcurrent 	= helpers.parsetime(current),
				parsedduration	= helpers.parsetime(duration);
			document.getElementById('time-right').innerHTML = parsedduration;
			document.getElementById('time-left').innerHTML = parsedcurrent;
			var percent = (current/duration)*100;
			var val;
			if (!player.automaticseekblocked && percent) {
				var val = percent
			}
			if (percent == NaN) {
				var val = 0
			}
			document.getElementById('seek-progress').style.width = val + '%'
		setTimeout(timeUpdate, 500)
	}
	timeUpdate()
}
player.pause		= function() {
	ytplayer.pauseVideo();
}
player.play 		= function() {
	ytplayer.playVideo();
}
player.seek 		= function(to) {
	ytplayer.seekTo(to);
}
player.playNext 	= function() {
	/*
		Determine from which queue to get the song.
	*/
	var queue = (player.queue1.get().length == 0) ? "queue2" : "queue1";
	var firstsong = player[queue].getAndRemoveFirst();
	player.playSong(firstsong);
}
player.playLast		= function() {
	player.history.playLast();
}
player.drawQueue	= function() {
	/*
		Merge both queues
	*/
	var queue1 = player.queue1.get(),
		queue2 = player.queue2.get();
		queue  = queue1.concat(queue2);
		/*
			Shorten queue display to 10 tracks
		*/
		queue = queue.slice(0,10);
		/*
			Clear queue div
		*/
		$("#queue").empty();
	$.each(queue, function(key, song) {
		/*
			Remap song keys.
			The result will be the exact same object, but every key has a data- prefix
			so we can pass that in the jQuery DOM object.
		*/
		var remappedSong = {'data-tooltip': '<strong>' + song.name + '</strong><br>' + song.artist, 'class': 'queue-song'}
		$.each(song, function(k,v) {
			remappedSong["data-" + k] = v;
		});
		//TODO: Clean this mess up.
		var div = $("<div>", remappedSong);
		var img = $("<img>", {src: song.image}).appendTo(div);
		div.appendTo("#queue");
	})
}
player.togglePlayState 	= function() {
	var state = ytplayer.getPlayerState();
	if (state == 1) {
		player.pause();
	}
	else {
		player.play();
	}
}