var request = require('request')

exports.search = function(query, options, callback) {

  // http://www.apple.com/itunes/affiliates/resources/documentation/itunes-store-web-service-search-api.html#searching
  // options example:
  // options = {
  //    media: "movie" // options are: podcast, music, musicVideo, audiobook, shortFilm, tvShow, software, ebook, all
  //  , entity: "movie"
  //  , attribute: "movie"
  //  , limit: 50
  //  , explicit: "No" // explicit material
  // }

  var optionsString = "";

  for (item in options) {
    optionsString += "&" + item + "=" + encodeURIComponent(options[item]);
  }

  request("http://itunes.apple.com/search?country=us" + optionsString + "&term=" + encodeURIComponent(query), function(err, response, body) {
    callback( JSON.parse(body) )
  })

}
exports.lookup = function(id, options, callback) {
  var optionsString = "";

  for (item in options) {
    optionsString += "&" + item + "=" + encodeURIComponent(options[item]);
  }

  request("http://itunes.apple.com/lookup?country=us" + optionsString + "&id=" + encodeURIComponent(parseFloat(id)), function(err, response, body) {
    callback( JSON.parse(body) )
  })
}
exports.remap = function (track) {
   return {
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
}