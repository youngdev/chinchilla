var Reddit = require('rereddit'),
	json = require('../config/json'),
	_ = require('underscore'),
	db = require('../db/queries'),
	yturl = require('get-youtube-id'),
	async = require('async'),
	itunes = require('../config/itunes'),
	data = {
		newest: null,
		acc: null
	}
exports.lastRequest = new Date;
exports.startBot = function() {
	Reddit.login('playlistbot', process.env.password).end(function(err, user) {
		exports.lastRequest = new Date;
		data.acc = user;
		if (!err) {
			Reddit.me().as(user).end(function(err, details) {
				db.getWatchIds(function(item) {
					var ids = item.values;
					_.each(ids, function(id) {
						exports.observeThread(id);
					});
				});
			});
		}
	});
}
exports.getFeeds = function(newest) {
	json.get('http://www.reddit.com/r/AskReddit/search.json?q=title:song&sort=new&restrict_sr=on_&limit=3', function(err, response) {
		exports.lastRequest = new Date;
		if (!err) {
			var items = response.data.children;
			items.every(function(thread) {
				if (newest && newest == thread.data.name) {
					setTimeout(function() {
						exports.getFeeds(items[0].data.name)
					}, 60 * 5 * 1000);
					return false;
				} else {
					exports.observeThread(thread.data.name);
					return true
				}
			});
			if (!newest) {
				setTimeout(function() {
					exports.getFeeds(items[0].data.name)
				}, 5000);
			}
		}
	});
}
exports.observeThread = function(thread_id) {
	db.getRedditThread(thread_id, function(thread) {
		if (!thread) {
			var thread = {
				commentids: [],
				trackids: [],
				thread_id: thread_id
			};
			db.saveRedditThread(thread);
		}
		exports.getComments(thread, thread_id)
	});
}
exports.getComments = function(thread, thread_id) {
	if ((new Date - exports.lastRequest) < 5000) {
		setTimeout(function() {
			exports.getComments(thread, thread_id);
		}, 5000);
		return;
	}
	json.get('http://www.reddit.com/comments/' + thread_id + '.json?limit=1000' + '&sort=new' + '&timestamp=' + (new Date).getTime(), function(err, response) {
		exports.lastRequest = new Date;
		var post = response.splice(0, 1);
		var hours = (new Date - (post[0].data.children[0].data.created_utc * 1000)) / 3600000;
		var comments = _.map(response[0].data.children, function(comment) {
			return _.pick(comment.data, 'body', 'name');

		});
		var commentids = _.map(comments, function(comment) {
			return comment.name;
		});
		var old = thread.commentids;
		var newcomments = _.difference(commentids, old);
		console.log(newcomments, response);
		_.each(newcomments, function(comment) {
			thread.commentids.push(comment)
		});
		exports.addTracksToThread(newcomments, comments, thread);
		if (hours < 1) {
			var timeout = 1;
		} else if (hours < 3) {
			var timeout = 1;
		} else if (hours < 6) {
			var timeout = 2;
		} else if (hours < 12) {
			var timeout = 5;
		} else if (hours < 24) {
			var timeout = 10
		} else {
			var timeout = null;
		}
		if (timeout) {
			console.log('timeout set for minutes:', timeout)
			setTimeout(function() {
				exports.observeThread(thread_id)
			}, timeout * 1000 * 60);
		}
	});
}
exports.addTracksToThread = function(newcomments, comments, thread) {
	var i = 0;
	var loop = function() {
		var comment = _.where(comments, {
			'name': newcomments[i]
		})[0];
		if (!comment) {
			callback();
			return;
		}
		exports.addTrackToThread(thread, comment, callback)
	}
	var callback = function(newtread) {
		if (newtread) {
			tread = newtread;
		}
		i++;
		if (i == newcomments.length) {
			thread.commentids = _.compact(_.uniq(thread.commentids));
			thread.trackids = _.compact(_.uniq(thread.trackids));
			db.saveRedditThread(thread);
			return;
		} else {
			loop();
		}
	}
	if (newcomments.length != 0) {
		loop();
	}
}
exports.addTrackToThread = function(thread, comment, callback) {
	var song = exports.fetchSong(comment.body, function(songs) {
		_.each(songs, function(song) {
			thread.trackids.push(song.id);
			if (data.acc) {
				exports.replyToComment(thread, comment, callback, song);
			}
		});
		callback(thread);
	});
}
exports.replyToComment = function(thread, comment, callback, song) {
	var lastRequest = new Date - exports.lastRequest;
	if (lastRequest > 6000 && data.acc) {
		exports.lastRequest = new Date;
		console.log('request made', thread);
		Reddit.reply(comment.name, exports.writeReply(song, thread.trackids.length, thread.thread_id)).as(data.acc).end(function (err, res) {
			if (!err) {
				if (res.json.ratelimit) {
					console.log(res)
					setTimeout(function() {
						exports.replyToComment(thread, comment, callback, song)
					}, res.json.ratelimit*1000);
				}
			}
		});
	}
	else {
		setTimeout(function() {
			exports.replyToComment(thread, comment, callback, song)
		}, 10000);
	}

}
exports.fetchSong = function(comment, callback) {
	//var yt = yturl(comment);
	var matches = _.map(comment.match(/\*(.*?)\*/g), function(match) {
		return match.substr(1).substr(0, match.length - 2)
	});
	exports.fetchSongsByString(matches, function(songs) {
		_.each(songs, function(song) {
			db.addTrack(song);
		});
		callback(songs);
	});
}
exports.fetchSongsByString = function(matches, callback) {
	var i = 0;
	async.map(matches, exports.iTunesSearch, function(err, results) {
		var songs =
			_.chain(results)
			.map(function(result) {
				if (result == undefined || result.resultCount == 0) {
					return null;
				} else {
					return itunes.remap(result.results[0]);
				}
			}).compact().value();
		callback(songs);
	});
}
exports.iTunesSearch = function(string, callback) {
	var string = string.replace(/[-]/g, ' ');
	itunes.search(string, {
		entity: 'song',
		limit: 1
	}, function(json) {
		callback(null, json);
	});
}
exports.writeReply = function(song, pllength, thread_id) {
	var template = [
		'I\'ve added the following song to the [playlist](http://tunechilla.com/thread/<%= thread_id %>) (now has <%= pllength %> tracks):  ',
		'>   Song: [<%= song.name %>](http://tunechilla.com/song/<%= song.id %>) ^<%= song.release.substr(0,4) %>, [Lyrics](http://tunechilla.com/lyrics/<%= song.id %>)  ',
		'>   Artist: [<%= song.artist %>](http://tunechilla.com/artist/<%= song.artistid %>)  ',
		'>   Album: [<%= song.album %>](http://tunechilla.com/album/<%= song.albumid %>) ^[Cover](<%= helpers.getHQAlbumImage(song, 200) %>)  '
	].join('\n');
	return _.template(template, {song: song, pllength: pllength, thread_id: thread_id});
}