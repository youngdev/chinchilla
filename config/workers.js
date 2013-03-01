var db 					= require("../db/queries"),
	_					= require("underscore")
var covers 				= [];
var getAlbumCovers 		= function() {
	db.getAlbumCovers(100, function(items) {
		covers 			= _.shuffle(items);
		setTimeout(getAlbumCovers, 86400000);
	})
}
this.returnAlbumCovers	= function() {
	return covers;
}
getAlbumCovers();