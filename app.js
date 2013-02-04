/*
	Require the basic stuff like the express framework
*/
var app     = require('express').createServer(),
    io      = require('socket.io').listen(app),
    views   = require('./routes/views.js'),
    scripts = require('./routes/scripts.js'),
    styles  = require('./routes/styles.js'),
    events  = require('./config/events.js'),
    charts  = require('./config/charts.js');

/* 
	Listen to the fifty-one-fifty-one port!
*/
var port = process.env.PORT || 5151;
app.listen(port);
console.log("App started on port", port);

/* 
	These are the routes, they control what is sent to the user
*/
app.get("/",                            views.mainview);
app.get("/artist/:id",                  views.mainview);
app.get("/charts",                      views.mainview);
app.get("/album/:id",                   views.mainview);
app.get("/about",                       views.mainview);
app.get("/api/script/:scriptname",      scripts.get);
app.get("/api/styles/:filename",        styles.get);
app.get("/api/artist/:id",              views.drawartist);
app.get("/api/charts",                  views.charts);
app.get("/api/album/:album",            views.drawalbum);
app.get("/api/i/:filename",             styles.images.get);
app.get("/api/error/:code",             views.error);
app.get("/api/about",                   views.about);
/*
	Configure Websockets. Through websockets, users can receive live updates and submit to the database.
*/
io.set('log level', 1);
io.set('transports', ['xhr-polling']);
io.sockets.on('connection', events['connection']);
/*
    Fetch iTunes feeds every 24 hours
*/
charts.update();