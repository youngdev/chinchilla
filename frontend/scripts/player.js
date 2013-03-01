player = {};
player.playSong = function(song, noautoplay) {
	var songobj = helpers.parseDOM(song);
	if ($(song).hasClass("recognized") || songobj.ytid != undefined) {
		/*
			Send YTID to YouTube player
		*/
		if (noautoplay) {
			ytplayer.cueVideoById(songobj.ytid);
		}
		else {
			ytplayer.loadVideoById(songobj.ytid);
		}
		
		/*
			Add current song to localStorage
		*/
		player.history.add(player.nowPlaying.get());
		/*
			Add old song to history
		*/
 		player.nowPlaying.replace(songobj);
 		/*
			Change the title of the page
 		*/
 		$('title').text(songobj.name + ' - ' + songobj.artist);
 		/*
			If the user has wants to, set the album cover as favicon
 		*/
 		if (chinchilla.settings.favicon_album) {
 			$('#favicon').attr('href', songobj.image);
 		}
	}
	else {
		var dom = (song instanceof HTMLElement) ? $(song) : $(".song[data-id=" + song.id + "]")[0];
		$(dom).addClass("wantstobeplayed")
		recognition.queue.unshift(dom)
	}
}
player.nowPlaying = {
	replace: function(song) {
		var song = helpers.parseDOM(song);
		localStorage['nowPlaying'] = JSON.stringify(song);
		$("#track-title a").text(song.name);
		$("#track-artist a").text(song.artist);
		$("#track-album a").text(song.album);
		$("#track-cover img").attr("src", song.image);
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
			player.playSong(last);
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
	if (state == 1) {
		$("#play").hide();
		$("#pause").show();
	}
	else {
		if (state == 0) {
			player.playNext()
		}
		$("#pause").hide();
		$("#play").show()
	}
}
var videoEnded = function() {
	player.playNext()
}
player.setUpEvents = function() {
	/*
		Make the play button different
	*/
	ytplayer.addEventListener('onStateChange', 'stateChange');
	ytplayer.addEventListener('onEnded',	   'videoEnded' );
	/*
		Update time label
	*/
	var timeUpdate = function() {
			var current   		= ytplayer.getCurrentTime(),
				duration  		= ytplayer.getDuration(),
				parsedcurrent 	= helpers.parsetime(current),
				parsedduration	= helpers.parsetime(duration);
			$("#time-right").text(parsedduration);
			$("#time-left").text(parsedcurrent);
			var percent = (current/duration)*100;
			if (!player.automaticseekblocked && percent) {
				$("#seekbar").val(percent);
			}
			if (percent == NaN) {
				$("#seekbar").val(0);
			}
		setTimeout(timeUpdate, 250)
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
		var remappedSong = {'data-tooltip': '<strong>' + song.name + '</strong><br>' + song.artist}
		$.each(song, function(k,v) {
			remappedSong["data-" + k] = v;
		})
		//TODO: Clean this mess up.
		var div = $("<div>", remappedSong).css({"margin-right": (10-key*10)});
		var transform = ("rotateY(" + (key*6).toString() + "deg) scale(" + (1-(key*0.02)).toString() + "," + (1-(key*0.02)).toString() + ")")
		var img = $("<img>", {src: song.image}).appendTo(div).css({"-webkit-transform": transform});
		div.appendTo("#queue");
	})
}