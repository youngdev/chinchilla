views = {
	artist: {
		load: function(artist) {
			$.ajax({
				url: "/api/artist/" + artist,
				dataType: "html",
				success: function(data) {
					/*
						Define view
					*/
					var view = $("#view");
					/*
						Add data to the view
					*/
					view.html(data);
					/*
						Hide the loading icon
					*/
					views.loadingindicator.hide()
					/*
						Complete the album list
						Pass in the album list div!
						<div class="album-list"></div>
					*/
					var albumlist = view.find(".artist-container .album-list")
					album.list.complete(albumlist, artist);

				},
				error: function() {
					errors.draw(404);
				}
			})
		}
	},
	newartist: {
		load: function(artist) {
			$.ajax({
				url: "/api/new-artist/" + artist,
				dataType: "html",
				success: function(data) {
					$("#view").html(data);
					_.each($(".song.not-recognized"), function(song) {
						recognition.queue.push(song);
					});
				}
			})
		}
	},
	playlist: {
		load: function(url) {
			$.ajax({
				url: '/api' + url,
				dataType: 'html',
				success: function(data) {
					$('#view').html(data);
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
					tracklist.complete($("#view .album-tracks"));
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
					tracklist.complete($("#view .album-tracks"));
				},
				error: function() {
					errors.draw(404)
				}
			})
		}
	},
	about: {
		load: function() {
			$.ajax({
				url: "/api/about",
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
				},
				error: function() {
					errors.draw(404);
				}
			});
		}
	},
	loadingindicator: {
		hide: function() {
			var indicator = $(".loading-indicator").remove()
		}
	},
	library: {
		load: function() {
			$.ajax({
				url: "/api/library",
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
				},
				error: function() {
					errors.draw(404);
				}
			});
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
				},
				error: function() {
					errors.draw(4040);
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
				},
				error: function() {
					errors.draw(404);
				}
			})
		}
	}
};
album = {
	list: {
		complete: function(albumlist, artist) {
			/*
				The link to compare (iTunes) is in the DOM node of the album list
			*/
			var resource = $(albumlist).attr("data-resource")
			/*
				Make a request to the iTunes server to compare albums.
			*/
			$.ajax({
				url: resource,
				dataType: "jsonp",
				data: {"callback": "?"},
				success: function(json) {
					/*
						Map to results 
					*/
					var results = json.results;
					/*
						Remove first entry which is not an album, but artist info
						First result should confirm the artist data we have
						Checking that...
					*/
					var artistdata = (results.splice(0,1))[0];
					if (artistdata.wrapperType == "artist") {
						/*
							Define albums
							Create array of albums that are already there
						*/
						var albums                  = results,
							albumsalreadythere      = [],
							albumsalreadytherenames = [];
						$.each($('.artist-container .album-list .album'), function(k,v) {
							albumsalreadythere.push($(v).data('id'));
							var name        = $(v).data('name')+'',
								shortened	= helpers.slugify(name.substr(0, (name.indexOf("(") == -1) ? name.length : name.indexOf("(")));
							albumsalreadytherenames.push(shortened);
						});
						/*
							Filter albums that are already there
							And albums that are not from this artist.
						*/
						var toadd = _.filter(albums, function(album) {
							var name        = album.collectionName.substr(0, (album.collectionName.indexOf("(") == -1) ? album.collectionName.length : album.collectionName.indexOf("(")),
                                included    = _.contains(albumsalreadytherenames, helpers.slugify(name));
							return (_.contains(albumsalreadythere, album.collectionId) === false) && album.artistId == artist && !included;
						});
						/*
							When no albums need to be added, end it!
						*/
						if (toadd.length === 0) {
							$(".album-refresh-message").remove();
							return;
						}
						/*
							Sort albums after release year.
						*/
						var sortedAlbums = _.sortBy(toadd, function(album) {
							return helpers.parseyear(album.releaseDate);
						}).reverse();
						/*
							Loop through toadds, check if the template is available, add to DOM.
							The whole thing is async, so no $.each loop possible
						*/
						var divs = [];
						var buildAlbum = function() {
							var album = sortedAlbums[i];
							templates.buildElement({
								template:   "album",
								parameters: {album: {
									tracks: album.trackCount,
                                    name: album.collectionName, 
                                    /*
										Year is the first 4 numbers form the release date.
                                    */
                                    release: helpers.parseyear(album.releaseDate),
                                    image: album.artworkUrl100,
                                    artist: album.artistName,
                                    artistid: album.artistId,
                                    id: album.collectionId,
                                    explicit: album.collectionExplicitness == "explicit" ? true : false
                                }},
								callback: function(output) {
									console.log(output);
									divs.push(output);
									/*
										Start the next iteration, if the album length isn't already reached.
									*/
									i++;
									if (i < albums) {
										buildAlbum();
									}
									else {
										onAlbumsFinishedLoading(divs);
									} 
								}
							});
						}
						/*
							Loop variables and initial loop
						*/
						var i         = 0,
							albums = sortedAlbums.length;

						buildAlbum()
					}
				}
			});
		}
	},
	tracklist: {
		complete: function(albumlist) {
            var albums      = $(albumlist).find(".album[data-fetch]"),
				albumcount  = albums.length,
				k           = 0;
			/*
				Loop through each album and load tracks.
			*/
			function loadTracks() {
				var album = albums[k],
					resource = $(album).attr("data-resource");
				/*
					Make a request to iTunes.
				*/
				$.ajax({
					dataType: "jsonp",
					data: {callback: "?"},
					url: resource,
					success: function(data) {
						var albuminfo = data.results.splice(0,1),
							results = data.results
						if (results !== undefined && results.length > 1) {
							var	disccount = results[0].discCount;
							/*
								Create object for every disc.
							*/
							var tracks = [];
							for (i=0; i<disccount; i++) {
								tracks[i] = [];
							}
							/*
								Push songs into structure.
							*/
							$.each(results, function(number, track) {
								remap = {
									name: track.trackName,
									duration: track.trackTimeMillis,
									album: track.collectionName,
									albumid: track.collectionId,
									artistid: track.artistId,
									artist: track.artistName,
									image: track.artworkUrl100,
									id: track.trackId,
									explicit: track.trackExplicitness == "explicit" ? true : false,
									genre: track.primaryGenreName,
									numberinalbum: track.trackNumber,
									cdinalbum: track.discNumber,
									tracks: track.trackCount,
									cdcount: track.discCount,
									preview: track.previewUrl,
									release: track.releaseDate
								};
								tracks[track.discNumber-1].push(remap);
							});
							templates.buildElement({
								template: "tracklist",
								parameters: {album: {cds: tracks}},
								callback: function(element) {
									$(album).find(".album-tracks").replaceWith(element);
									recognition.recognizeAlbum(album);
								}
							});
						}
						/*
							Next loop
						*/
						k++;
						if (k < albumcount) {
							loadTracks();
						}
					}
				});
			}
			loadTracks();
		}
	}
};
tracklist = {
	complete: function (list) {
		recognition.recognizeTrackList(list);
	}
};
registration = {
    facebook: {
        load: function() {
            $.ajax({
                url:        '/api/registration',
                dataType:   'html',
                success:    function(data) {
                    var view = $('#view');
                    view.html(data);
                    views.loadingindicator.hide();
                },
                error: function() {
                    errors.draw(404);
                }
            });
        }
    }
};
/*
	Now we have a sorted array of all the albums.
	Add those div's to the DOM!
*/
var onAlbumsFinishedLoading  = function(divs) {
	/*
		Refresh is done. At this point, albums will be added.
	*/
	var albumlist = $(".album-list");
	$.each(divs, function (key, div) {
		albumlist.append(div);
	});
	album.tracklist.complete(albumlist);
};