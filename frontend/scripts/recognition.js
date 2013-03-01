var recognitionAdditionHandler = function() {
	if (recognition.started == false) {
		recognition.start()
	}
}
recognition = {
	recognizeAlbum: function(album) {
		var tracks = $(album).find(".album-tracks table tbody tr.song.not-recognized");
		$.each(tracks, function(k,v) {
			recognition.queue.push(v);
		})
	},
  recognizeTrackList: function(list) {
    var tracks = $(list).find("tr.song.not-recognized");
    $.each(tracks, function(k,v) {
      recognition.queue.push(v)
    })
  },
	queue: new EventedArray(recognitionAdditionHandler),
	recognizeTrack: function(obj) {
		var track = obj.track,
			  cb	  = obj.cb
		var song = helpers.parseDOM(track)
		recognition.findVideo(song, function(video) {
			cb();
			/*
				Upload track to database!
			*/
      var firsttrackinarray = (track.length != undefined && track.length != 0) ? track[0] : track;
			recognition.uploadTrack(track, video)
			var dom   = (firsttrackinarray instanceof HTMLElement) ? $(firsttrackinarray) : $(".song[data-id=" + firsttrackinarray.id + "]")[0];
			//Mark it as recognized
			console.log(dom);
			$(dom).addClass("recognized")
			//Unmark it as not recognized
			.removeClass("not-recognized pending")
			//Add YouTube ID to the dom
			.attr("data-ytid", video.id.$t.substr(-11));
      if ($(track).hasClass("wantstobeplayed")) {
            $(track).removeClass("wantstobeplayed");
            player.playSong($(track)[0]);
      }
			/*
				If song is in an album
			*/
				var album = $(track).parents(".album");
			/*
				Checks if song is in a n album
			*/
			if (album.length != 0) {
				/*
					Number of tracks that are recognized
					Album
					Number of tracks total
				*/
				var recognizedcount = ($(track).parents(".album").find(".recognized")).length + 1,
					tracks		= album.data("tracks");
				if (recognizedcount == tracks) {
					recognition.uploadAlbum(album[0])
				}
			}
		});
	},
	started: false,
	start: function() {
		recognition.started = true;
		var loop = function() {
			recognition.recognizeTrack({track: recognition.queue.getArray()[0], cb: function() {
					recognition.queue.shift()
					if (recognition.queue.getArray().length == 0) {
						recognition.stop()
					}
					else {
						loop();
					}
				}
			});
		}
		loop();
	},
	stop: function() {
		recognition.started = false;
	},
	findVideo: function (song, callback, jquery, underscore, underscorestring) {
        if (jquery != undefined) {
            $ = jquery 
        }
        if (underscore != undefined) {
            _ = underscore;
        }
        if (underscorestring != undefined) {
            _s = underscorestring;
        }
        var songname = (song.title == undefined) ? song.name : song.title;
        $.ajax({
            url: "http://gdata.youtube.com/feeds/api/videos",
            data: {
                alt: "json",
                "max-results": 15,
                q: song.artist + " - " + songname
            },
            success: function (json) {
                var filterVideos = function(videotitle) {
                    var filters = ["cover", "parod", "chipmunk", "snippet", "preview", "live", "review"];
                    var filterout = false;
                    $.each(filters, function(key, filter) {
                        if (_s.include(videotitle.toLowerCase(), filter)) {
                        //Filter covers, parodies and Chipmunk versions out
                        filterout = true
                        }
                    })
                    return filterout;
                }
                //Find the video most related to our video by duration.
                var videos = json.feed.entry;
                videos = (_.filter(videos, function(video) {
                    return (filterVideos(video.title.$t) === false)
                }));
                //Filter videos that are too short
                videos = (_.filter(videos, function(video) {
                	return video.media$group.yt$duration.seconds > (song.duration/1000);
                }));
                    var closestVideo = _.sortBy(videos, function (video) {
                        return _s.levenshtein(_s.slugify(video.title.$t), _s.slugify(song.artist + " - "+ songname));
                    })[0];          
                callback(closestVideo);
            }
        });
    },
    uploadTrack: function(track, video) {
    	var videoid = video.id.$t.substr(-11);
    	var json = $(track).data()
    	json.ytid = videoid
    	socket.emit('new-track', json);
    },
    uploadAlbum: function(album) {
    	var json = $(album).data();
    	var tracks = $(album).find(".song"), trackids = []
    	/*
			Don't upload whole tracks, only ID's
    	*/
    	$.each(tracks, function(k,track) {
    		trackids.push($(track).data("id"));
    	})
    	json.tracklist = trackids;
    	socket.emit('new-album', json);

    }
}
function EventedArray(handler) {
   this.stack = [];
   this.mutationHandler = handler || function() {};
   this.setHandler = function(f) {
      this.mutationHandler = f;
   };
   this.callHandler = function() { 
      if(typeof this.mutationHandler === 'function') {
         this.mutationHandler();
      }
   };
   this.push = function(obj) {
      this.stack.push(obj);
      this.callHandler();
   };
   this.shift = function() {
   	  this.stack.shift();
   }
   this.pop = function() {
      return this.stack.pop();
   };
   this.getArray = function() {
      return this.stack;
   }
   this.unshift = function() {
    this.stack.unshift();
    this.callHandler();
   }
}
/*
    For backend
*/
this.recognition = recognition;