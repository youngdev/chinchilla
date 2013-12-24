addtracks = {
	calls: [],
	autocomplete: function(query) {
		search.calls = [];
		var types = {
			track: {
				iTunesName: 'song',
				title: 		'trackName',
				sub: 		'artistName',
				element: 	$('.add-tracks-results'),
				id: 		'trackId'
			}
		}
		$.each(types, function(type, info) 
			{
				var ajax = $.ajax(
					{
						url: 'http://itunes.apple.com/search',
						data: {
							term: query,
							entity: info.iTunesName,
							limit: 3
						},
						dataType: 'jsonp',
						success: function(json) {
							$(info.element).empty();
							$.each(json.results, function(key, result) {
								var div = $('<div>', { class: 'search-result' });
										  $('<div>', { class: 'search-result-title' }).text(result[info.title]).appendTo(div);
										  $('<div>', { class: 'search-result-sub' }).text(result[info.sub]).appendTo(div);
								var a   = $('<span>'  , { 'data-id' : result.trackId }).html(div).on('click', function() {
									var route = $('#view').attr('data-route');
									if (route == '/library') {
										library.add({id: result.trackId});
									} 
									else {
										playlist.add({id: result.trackId}, route);
									}
									$(".add-tracks-input").val("").focus();
									info.element.html('');
									window.lastsearchtimestamp = null;
								});
								a.appendTo(info.element);
								if (key == 0) {
									$(a).addClass('add-tracks-selected');
								}	  
							})
						}
					}
				)
				search.calls.push(ajax);
			}
		)
	}
}