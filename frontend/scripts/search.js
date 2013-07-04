search = {
	calls: [],
	autocomplete: function(query) {
		$('#search-results-wrapper').empty();
		search.calls = [];
		var types = {
			artist: {
				iTunesName: 'musicArtist',
				title: 		'artistName',
				sub: 		'primaryGenreName',
				element: 	$('#results-artists'),
				link: 		'/artist/$1',
				id: 		'artistId',
				image: 		'/api/svg/artist'
			},
			album: {
				iTunesName: 'album',
				title: 		'collectionName',
				sub: 		'artistName',
				element: 	$('#results-albums'),
				link: 		'/album/$1',
				id: 		'collectionId',
				image: 		'/api/svg/album'
			},
			track: {
				iTunesName: 'song',
				title: 		'trackName',
				sub: 		'artistName',
				element: 	$('#results-tracks'),
				link: 		'/song/$1',
				id: 		'trackId',
				image: 		'/api/svg/playlist'
			}
		}
		var results = {
			count: 0,
			objects: []
		};
		var allResultsFetched = function(results) {
			var results = _.sortBy(results.objects, function (result, key) {
				var one = _s.levenshtein(result.title, query),
					two = _s.levenshtein(result.sub, query) + 0.5 + (key + 1) % 3; // 0.5 Because title is always more important than sub
				return Math.min(one, two);
			});
			var results = _.map(results, function (result) {
				var regex 		= new RegExp(query, 'gi');
				//result.title 	= result.title.replace(regex, '<b>' + query + '</b>');
				//result.sub 		= result.sub.replace(regex, '<b>' + query + '</b>');
				return result;
			})
			_.each(results, function (result, key) {
				var html 		= $('<li data-navigate="' + result.link + '"><a><img src="' + result.image + '"><span>' + result.title + '</span><span class="search-result-sub">' + result.sub + '</span></a></li>');
				if (key == 0) {
					var html 	= $(html).addClass('search-selected')
				}
				endLoadingIndicator();
				$('#search-results-wrapper').append(html);
			});
		}
		var startLoadingIndicator 	= function() {
			$('#search-spinner').show()
		}
		var endLoadingIndicator 	= function() {
			$('#search-spinner').hide();
		}
		startLoadingIndicator();
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
							_.each(json.results, function(result) {
								results.objects.push({
									title: 		result[info.title],
									sub: 		result[info.sub],
									type: 		type,
									link: 		info.link.replace('$1', result[info.id]),
									image: 		info.image
								});
							});
							results.count++;
							if (results.count == 3) {
								allResultsFetched(results)
							}
						}
					}
				)
				search.calls.push(ajax);

			}
		)
	}
}