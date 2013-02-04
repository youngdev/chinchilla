search = {
	calls: [],
	autocomplete: function(query) {
		$.each(search.calls, function(key, call) 
			{
				call.abort();
			}
		)
		search.calls = [];
		var types = {
			artist: {
				iTunesName: 'musicArtist',
				title: 		'artistName',
				sub: 		'primaryGenreName',
				element: 	$('#results-artists'),
				link: 		'/artist/$1',
				id: 		'artistId'
			},
			album: {
				iTunesName: 'album',
				title: 		'collectionName',
				sub: 		'artistName',
				element: 	$('#results-albums'),
				link: 		'/album/$1',
				id: 		'collectionId'
			},
			track: {
				iTunesName: 'song',
				title: 		'trackName',
				sub: 		'artistName',
				element: 	$('#results-tracks'),
				link: 		'/track/$1',
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
								var a   = $('<a>'  , { 'data-navigate' : info.link.replace('$1', result[info.id])}).html(div)
								a.appendTo(info.element)		  
							})
						}
					}
				)
				search.calls.push(ajax);

			}
		)
	}
}