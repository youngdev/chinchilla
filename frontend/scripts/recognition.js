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
			  cb	  = obj.cb;
		var song = helpers.parseDOM(track),
            firsttrackinarray = (track.length != undefined && track.length != 0) ? track[0] : track,
            dom   = (firsttrackinarray instanceof HTMLElement) ? $(firsttrackinarray) : $(".song[data-id=" + firsttrackinarray.id + "]")[0];
        if ($(dom).hasClass('recognized')) {
            cb();
            return;
        }
		recognition.findVideo(song, function(video) {
            if (video) {
                /*
                    Mark it as recognized
                */
                var div = $('.song[data-id="' + song.id + '"]').attr("data-ytid", video.id.$t.substr(-11));
                div.addClass("recognized").removeClass("not-recognized pending")
                recognition.uploadTrack(song, video);
                /*
                    Add YouTube ID to the dom
                */
                if ($(div).hasClass("wantstobeplayed")) {
                      $(div).removeClass("wantstobeplayed");
                      player.playSong($(div)[0]);
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
                        tracks      = album.data("tracks");
                    if (recognizedcount == tracks) {
                        recognition.uploadAlbum(album[0])
                    }
                }
            }
            else {
                $(dom).addClass('no-video-found')
            }
            cb();
		});
	},
	started: false,
	start: function() {
		recognition.started = true;
		var loop = function() {
			recognition.recognizeTrack({track: recognition.queue.getArray()[0], cb: function() {
                    if (recognition.started) {
                        recognition.queue.shift()
                        if (recognition.queue.getArray().length == 0) {
                            recognition.stop()
                        }
                        else {
                            loop();
                        }
                    }
					
				}
			});
		}
		loop();
	},
	stop: function() {
		recognition.started = false;
	},
	findVideo: function (song, callback, jquery, underscore, underscorestring, options) {
        if (jquery != undefined) {
            $ = jquery 
        }
        if (underscore != undefined) {
            _ = underscore;
        }
        if (underscorestring != undefined) {
            _s = underscorestring;
        }
        song.name = (song.title == undefined) ? song.name : song.title;
        var data = {
            alt: "json",
           "max-results": 15,
            q: song.artist + " " + song.name,
            v: 2
        }
        if (options != undefined && _.contains(options, 'restricted')) {
            data.restricted = 'DE';
        }
        $.ajax({
            url: "http://gdata.youtube.com/feeds/api/videos",
            data: data,
            success: function (json) {
              recognition.findBestVideo(json, song, function(video) {
                callback(video);
              }, _, _s, options);
            }
          }
        );
    },
    findBestVideo: function (json, song, callback, _, _s) {
        var videos = json.feed.entry,
            mostviewed  = 
                _.max(videos, function(video) { 
                    var views =  video.yt$statistics != undefined ? parseFloat(video.yt$statistics.viewCount) : 0;
                    return views
                })
            mostviews = mostviewed.yt$statistics ? mostviewed.yt$statistics.viewCount : 0;
        if (typeof localStorage != 'undefined') {
            var banned_videos = JSON.parse(localStorage.banned_videos);
            var videos = _.reject(videos, function(video) { return _.contains(banned_videos, video['media$group']['yt$videoid']['$t']) });
        }
        _.map(videos, function(video) {

            /*
                Every video can score between 0 and 1000 points
            */
            video.points = 0;
            var videotitle      = _s.slugify(video.title.$t),
                format1         = _s.slugify(song.artist + ' ' + song.name),
                format2         = _s.slugify(song.name + ' ' + song.artist);
            
            /*
                300 Points: Levenshtein distance
            */
            var vtfragments     = helpers.titleMatcher(video.title.$t, _),
                vtitle          = vtfragments.join(' '),
                tfragments      = helpers.titleMatcher(song.artist + ' ' + song.name, _),
                matches = [], unmatches = [];
            _.each(tfragments, function (fragment) {
                var index = vtitle.indexOf(fragment);
                if (index == -1) {
                    unmatches.push(fragment)
                }
                else {
                    matches.push(fragment);
                    vtitle = vtitle.replace(fragment, '');
                }
            });
            var levpoints = 300*(matches.length/tfragments.length) - vtitle.replace(/\s/g, '').length*2
            video.points += levpoints;

            /*
                Infinite minus Points: Duration
                -1 less or more is okay
                -For every another second, take away 5 points
            */
            var videoduration   = video.media$group.yt$duration.seconds,
                songduration    = song.duration/1000,
                difference      = Math.abs(videoduration - songduration)
                tolerance       = 1,
                minuspoints     = difference === 0 ? 0 : (difference-1),
                durpoints       = minuspoints;
            video.points -= durpoints;

            /*
                50 Points: View count
                -Best video gets 50 Points
                -All the other videos get 50 points divided by the ratio of views they have. 
            */
            var viewCount       = video.yt$statistics ? parseFloat(video.yt$statistics.viewCount) : 0,
                ratio           = viewCount / mostviews;
                viepoints       = Math.ceil(ratio*50);
            video.points += viepoints;

            /*
                150 Points: Rating
                -100% positive rating gets 150 points
                -100% negative rating gets 000 points
            */
            var rating          = video.gd$rating ? video.gd$rating.average*20 : 0
                ratpoints       = Math.ceil(rating * 1.5);
            video.points += ratpoints;

            /*
                200: Bad words
                -200 points if no bad words included
                -minus 75 points for every bad word

            */
            video.points += 200;
            var badwords = ["cover", "parod", "chipmunk", "snippet", "preview", "live", "review", "vocaloid", "dance", "remix"];
            _.each(badwords, function (word) {
                if (_s.include(videotitle.toLowerCase(), word) && !_s.include(format1, word)) {
                    video.points -= 75
                }
            });

            /*
                -300: Date
            */



            /*
                Album name included
                -If track is a skit / intro / outro, take away 50 points if there is no album name
            */
            video.points += 50
            if (_s.include(videotitle.toLowerCase()), song.album && (_s.include(format1, 'skit') || _s.include(format1, 'intro') || _s.include(format1, 'outro')) ) {
                video.points -= 50;
            }
        }); 
        var bestvideo = _.first(_.sortBy(videos, function(video) { return video.points }).reverse());
        if (bestvideo) {
            console.log('The best video has ', bestvideo.points, ' points!', song.name);
        }
        callback(bestvideo);
    },
    uploadTrack: function(track, video) {
    	var videoid = video.id.$t.substr(-11);
    	var json = track;
    	json.ytid = videoid;
        json.id = parseFloat(json.id);
        socket.emit('new-ytid', json);
        DB.addYTIDToTrack(track ,videoid)
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
   };
   this.unshift = function(obj) {
    this.stack.unshift(obj);
    this.callHandler();
   };
   this.clear   = function() {
    this.stack = [];
    recognition.stop()
   }
}
/*
    For backend
*/
this.recognition = recognition;