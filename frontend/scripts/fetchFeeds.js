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
					$.publish('new-tracks-entered-dom');

				},
				error: function() {
					errors.draw(404);
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
					$.publish('new-tracks-entered-dom');
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
					$.publish('new-tracks-entered-dom');
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
					$.publish('new-tracks-entered-dom');
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
					$.publish('new-tracks-entered-dom');
				},
				error: function() {
					errors.draw(404);
				}
			});
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
					$.publish('new-tracks-entered-dom');
				},
				error: function() {
					errors.draw(404);
				}
			})
		}
	}
};