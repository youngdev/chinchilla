/*
	Require the basic stuff like the express framework
*/
var app         = require('express').createServer(),
    io          = require('socket.io').listen(app),
    views       = require('./routes/views'),
    scripts     = require('./routes/scripts'),
    styles      = require('./routes/styles'),
    events      = require('./config/events'),
    charts      = require('./config/charts'),
    fb          = require('./config/facebook');
    
/*
	Listen to the fifty-one-fifty-one port!
*/
var port = (process.env.HOSTNAME == 'server.tunechilla.com') ? 80 : 5000;
app.listen(port);
console.log("App started on port", port);

/*
	These are the routes, they control what is sent to the user
*/
app.get('/',                            views.wrapper          );
app.get('/home',                        views.wrapper          );
app.get('/artist/:id',                  views.wrapper          );
app.get('/new-artist/:id',              views.wrapper          );
app.get('/charts',                      views.wrapper          );
app.get('/u/:username/p/:playlist',     views.wrapper          );
app.get('/album/:id',                   views.wrapper          );
app.get('/about',                       views.wrapper          );
app.get('/track/:id',                   views.wrapper          );
app.get('/register',                    views.wrapper          );
app.get('/library',                     views.wrapper          );
app.get('/settings',                    views.wrapper          ); 

/*
    Backend routes
*/
app.get('/api/script/:scriptname',      scripts.get             );
app.get('/api/styles/:filename',        styles.get              );
app.get('/api/artist/:id',              views.drawartist        );
app.get('/api/new-artist/:id',          views.artist            );
app.get('/api/charts',                  views.charts            );
app.get('/api/album/:album',            views.drawalbum         );
app.get('/api/i/:filename',             styles.images.get       );
app.get('/api/svg/:filename',           styles.svg.get          );
app.get('/api/svg/:filename/:color',    styles.svg.getColor     );
app.get('/api/main',                    views.main              );
app.get('/api/error/:code',             views.error             );
app.get('/api/about',                   views.about             );
app.get('/api/track/:id',               views.drawtrack         );
app.get('/api/u/:username/p/:playlist', views.playlist          );
app.get('/api/library',                 views.library           );
app.get('/api/settings',                views.settings          );

/*
    Auth routes
*/
app.get('/auth/facebook',               fb.login                );
app.get('/auth/facebook/token',         fb.token                );
app.get('/logout',                      fb.logout               );

/*
	Configure Websockets. Through websockets, users can receive live updates and submit to the database.
*/
io.set('log level', 1);
io.sockets.on('connection', events.connection);

/*
    Fetch iTunes feeds every 24 hours
*/
charts.update();