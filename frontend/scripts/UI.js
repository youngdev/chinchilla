var select      = function(e)   {
	/*
		Send to other function if batch selecting.
		Ctrl key selects all elements between already selected ones and the clicked.
	*/
	if (e.shiftKey) {
		shiftSelect(this);
		return;
	}
	/*
		Send to another function if CMD key is pressed.
		CMD key selects/deselects single elements without changing selection
	*/
	if (e.ctrlKey || e.metaKey) {
		cmdSelect(this);
		return;
	}
	/*
		Deselect all the other songs.
	*/
	$(".song.selected").removeClass("selected");
	$(this).addClass("selected");
};
window.playSong = function()    {
		/*
			Get all next songs
			Add them to the queue.
		*/
		var nextSongs = $(this).nextAll(".song");
		player.queue1.clear();
		player.queue2.clear();
		$.each(nextSongs, function(key, song) {
			player.queue2.add(song);
		});
		player.playSong(this);	
};
var shiftSelect         = function(obj) {
	var song         = $(obj),
		closestprev  = song.prevAll(".selected")[0],
		closestnext  = song.nextAll(".selected")[0];
	if (closestprev !== undefined) {
		song.prevUntil(closestprev, ".song").andSelf().addClass("selected");
	}
	if (closestnext !== undefined) {
		song.nextUntil(closestnext, ".song").andSelf().addClass("selected");
	}
};
var cmdSelect           = function(obj) {
	$(obj).toggleClass("selected");
};
var dragSeek			= function(obj) {
	player.automaticseekblocked = true;
};
var dragSeekUp			= function(obj) {
	player.automaticseekblocked = false;
	var seek = $("#seekbar").val()/100;
	player.seek(seek*ytplayer.getDuration());
};
var resume				= function(obj) {
	player.play();
};
var pause               = function(obj) {
	player.pause();
};
var skip                = function() {
	player.playNext();
};
var rewind              = function() {
	player.playLast();
};
var tooltip             = function(e) {
	var original = this;
	var tooltip = $("<div>", {
		class: "tooltip"
	}).css({
		top:    $(original).offset().top + $(original).height() + 3,
		left:   $(original).offset().left
	}).html($(original).attr("data-tooltip")).appendTo("body");
	$(original).mouseout(function() {
		$(tooltip).remove();
	});
};
var playbutton          = function() {
	player.playSong(this);
};
var autocomplete        = function() {
	/*
		Trigger search method
	*/
	var searchfield = $("#search-field"),
		value		= searchfield.val(),
		results     = $("#search-results");
	search.autocomplete(value);
	/*
		Hide/show suggestions
	*/
	if (value === "") {
		results.hide();
	}
	else {
		results.show();
	}
};
var register            = function() {
    window.open('/auth/facebook', 'Facebook Login', 'width=300px, height=300');
}
$(document)
.on('mousedown',    '.song',            select      ) //Selecting tracks
.on('dblclick',     '.song',            playSong    ) //Doubleclick to play. Just POC yet.
.on('mousedown',    '#seekbar',         dragSeek	) //Block autmatic seeking while dragging
.on('mouseup',      '#seekbar',         dragSeekUp  ) //Update and seek
.on('click',        '#play',            resume      ) //Play or resume song.
.on('click',        '#pause',           pause		) //Pause music.
.on('click',        '#skip',            skip		) //Skip track. Play next one.
.on('click',        '#rewind',          rewind		) //Go back to previous track.
.on('mouseover',    '[data-tooltip]',   tooltip     ) //Show small black tooltips.
.on('keyup',        '#search-field',    autocomplete) //Show suggestions when user types into search.
.on('click',        '.play-button',     playbutton  ) //Play buttons are in track views for instance.
.on('click',        '#register',        register    );