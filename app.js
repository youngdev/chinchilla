/*
	Require the basic stuff like the express framework
*/

var app     = require('express').createServer(),
    io      = require('socket.io').listen(app),
    views   = require('./routes/views'),
    scripts = require('./routes/scripts'),
    styles  = require('./routes/styles'),
    events  = require('./config/events'),
    charts  = require('./config/charts'),
    fauth   = require('./config/fauthentication'),
    fb      = require('./config/facebook');
/*
    FB auth
*/
fauth.settings({
    client_id:          212482748876564,
    client_secret:      'f2bdb7700ef2d87a8c05b32ac31c013a',
    redirect_uri:       'http://chinchilla.jonnyburger.c9.io/facebook/token',
    app:                app,
    callback:           fb.cb
});
/*
	Listen to the fifty-one-fifty-one port!
*/

var port = process.env.PORT || 5151;
app.listen(port);
console.log("App started on port", port);

/*
	These are the routes, they control what is sent to the user
*/

app.get('/',                            views.mainview          );
app.get('/artist/:id',                  views.mainview          );
app.get('/charts',                      views.mainview          );
app.get('/album/:id',                   views.mainview          );
app.get('/about',                       views.mainview          );
app.get('/track/:id',                   views.mainview          );
app.get('/register',                    views.mainview          );
/*
    Backedn routes
*/
app.get('/api/script/:scriptname',      scripts.get             );
app.get('/api/styles/:filename',        styles.get              );
app.get('/api/artist/:id',              views.drawartist        );
app.get('/api/charts',                  views.charts            );
app.get('/api/album/:album',            views.drawalbum         );
app.get('/api/i/:filename',             styles.images.get       );
app.get('/api/error/:code',             views.error             );
app.get('/api/about',                   views.about             );
app.get('/api/track/:id',               views.drawtrack         );
app.get('/api/registration',            views.registration      );
/*
    Authentication routes
*/
app.get('/facebook/authenticate',       fb.auth                 );
app.get('/facebook/token',              fauth.getAccessToken    );

/*
	Configure Websockets. Through websockets, users can receive live updates and submit to the database.
*/

io.set('log level', 1);
io.set('transports', ['xhr-polling']);
io.sockets.on('connection', events.connection);

/*
    Fetch iTunes feeds every 24 hours
*/

charts.update();
