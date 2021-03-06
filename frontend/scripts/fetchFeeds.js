views = {
	artist: {
		load: function(artist) {
			$.ajax({
				url: "/api/artist/" + artist,
				dataType: "html",
				success: function(data) {
					$("#view").html(data);
					views.loadingindicator.hide()
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')

				},
				error: function() {
					errors.draw(404);
				}
			})
		}
	},
	song: {
		load: function(song) {
			$.ajax({
				url: '/api/song/' + song,
				dataType: 'html',
				success: function(data) {
					$('#view').html(data);
					$.publish('new-tracks-entered-dom');
					views.loadingindicator.hide();
					$.publish('view-got-loaded')
				}
			})
		}
	},
	album: {
		load: function(id) {
			$.ajax({
				url: "/api/album/" + id,
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404);
				}
			})
		}
	},
    track: {
        load: function(id) {
            $.ajax({
                url: "/api/track/" + id,
                dataType: "html",
                success: function(data) {
                    var view = $("#view");
                    view.html(data);
                    views.loadingindicator.hide();
                    $.publish('view-got-loaded')
                },
                error: function() {
                    errors.draw(404);
                }
            });
        }
    },
    charts: {
        load: function() {
			$.ajax({
				url: "/api/charts",
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404)
				}
			})
		}
	},
	retrocharts: {
		load: function(year) {
			$.ajax({
				url: "/api/charts/" + year,
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				} 
			})
		}
	},
	info: {
		load: function() {
			$.ajax({
				url: "/api/info",
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404);
				}
			});
		}
	},
	loadingindicator: {
		hide: function() {
			$('#loading-indicator').removeClass('loading-indicator-visible');
		}
	},
	library: {
		load: function() {
			var library = chinchilla.library,
				data = {user: chinchilla.loggedin},
				afterLocalTracksFetched = function(data) {
					var fetched = data;
					var tofetch = _.difference(library, _.pluck(fetched, 'id'));
					if (tofetch.length != 0) {
						socket.emit ('/api/tracks/get', { tracks: tofetch });
						socket.on	('/api/tracks/get/response', function (tracks) {
							var alltracks = _.union(tracks, fetched);
							afterAllTracksFetched(alltracks);
							_.each(tracks, function (track) {
								DB.addTrack(track)
							})
						});
					}
					else {
						afterAllTracksFetched(fetched);
					}
				},
				afterAllTracksFetched 		= function(tracks) {
					data.tracks = (helpers.sortTracks(library, tracks)).reverse();
					var html = templates.buildLibrary(data);
					$('#view').html(html).scrollTop(0);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				}
			DB.getTracks({ids: library, callback: afterLocalTracksFetched});
		}
	},
	playlist: {
		load: function(url) {
			var playlist = _.where(chinchilla.playlists, {url: url})[0],
				data = {user: chinchilla.loggedin, playlist: playlist},
				afterLocalTracksFetched = function(data) {
					var fetched = data;
					var tofetch = _.difference(playlist.tracks, _.pluck(fetched, 'id'));
					if (tofetch.length != 0) {
						socket.emit ('/api/tracks/get', {tracks: tofetch});
						socket.on 	('/api/tracks/get/response', function (tracks) {
							var alltracks = _.union(tracks, fetched);
							var alltracksmapped = _.map(alltracks, function(track) { track.inlib = _.contains(chinchilla.library, track.id); return track });
							afterAllTracksFetched(alltracksmapped);
							_.each(tracks, function (track) {
								DB.addTrack(track)
							})
						});
					}
					else {
						afterAllTracksFetched(fetched);
					}
				},
				afterAllTracksFetched 	= function(tracks) {
					data.tracks = (helpers.sortTracks(playlist.tracks, tracks))
					if (playlist.newestattop) { data.tracks = data.tracks.reverse(); };
					var html = templates.buildPlaylist(data);
					$('#view').html(html).scrollTop(0);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				}
			if (playlist) {
				DB.getTracks({ids: playlist.tracks, callback: afterLocalTracksFetched});
			}
			else {
				socket.emit('/api/playlists/get-tracks', {playlist: url, token: chinchilla.token});
				socket.on('/api/playlists/get-tracks/response', function (response) {
					if (response.error) {
						$.ajax({
							url: '/api/error/502',
							dataType: 'html',
							success: function(data) {
								var view = $('#view');
								view.html(data);
								views.loadingindicator.hide();
								$.publish('view-got-loaded');
							}
						})
					}
					else {
						playlist = response.playlist;
						data.playlist = response.playlist;
						chinchilla.playlists = [playlist];
						DB.getTracks({ids: response.playlist.tracks, callback: afterLocalTracksFetched});
					}
				})
				
			}
		}
	},
	lyrics: {
		load: function(id) {
			$.ajax({
				url: '/api/lyrics/' + id,
				dataType: 'html',
				success: function(data) {
					var view = $('#view');
					view.html(data);
					views.loadingindicator.hide();
					$.publish('view-got-loaded')
				}
			})
		}
	},
	redditpl: {
		load: function(id) {
			$.ajax({
				url: '/api/thread/' + id,
				dataType: 'html',
				success: function(data) {
					var view = $('#view');
					view.html(data);
					views.loadingindicator.hide();
					$.publish('view-got-loaded');
					$.publish('new-tracks-entered-dom');
				} 
			})
		}
	},
	reddit: {
		load: function() {
			$.ajax({
				url: "/api/reddit",
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404);
				}
			})
		}
	},
	settings: {
		get: function() {
			$.ajax({
				url: "/api/settings",
				dataType: "html",
				success: function(data) {
					$("#view").html(data);
					views.loadingindicator.hide();
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404);
				}
			})
		}
	},
	main: {
		get: function() {
			$.ajax({
				url: "/api/main",
				dataType: "html",
				success: function(data) {
					$("#view").html(data);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404);
				}
			});
		}
	},
	remote: {
		get: function() {
			$.ajax({
				url: '/api/remote',
				dataType: 'html',
				success: function(data) {
					$('#view').html(data);
					views.loadingindicator.hide();
					$.publish('view-got-loaded');
				},
				error: function() {
					errors.draw(404);
				}
			});
		}
	}
};