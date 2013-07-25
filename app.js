/*
	Require the basic stuff like the express framework
*/
var express     	= require('express')
    app         	= express(),
    http 			= require('http'),
    server	        = http.createServer(app),
    io          	= require('socket.io').listen(server),
    views       	= require('./routes/views'),
    scripts     	= require('./routes/scripts'),
    styles      	= require('./routes/styles'),
    admin       	= require('./admin/admin'),
    events      	= require('./config/events'),
    charts      	= require('./config/charts'),
    fb          	= require('./config/facebook'),
    webhook 		= require('./config/webhook');
    
/*
	Listen to port 5000, or, in production, 80;
*/
server.listen(process.env.PORT || 5000);

/*
	These are the routes, they control what is sent to the user
*/
app.get('/',                            views.wrapper           );
app.get('/home',                        views.wrapper           );
app.get('/artist/:id',                  views.wrapper           );
app.get('/song/:id',                    views.wrapper           );
app.get('/charts',                      views.wrapper           );
app.get('/retro-charts/:id',            views.wrapper           );
app.get('/u/:username/p/:playlist',     views.wrapper           );
app.get('/album/:id',                   views.wrapper           );
app.get('/info',                        views.wrapper           );
app.get('/track/:id',                   views.wrapper           );
app.get('/lyrics/:id',                  views.wrapper           );
app.get('/register',                    views.wrapper           );
app.get('/library',                     views.wrapper           );
app.get('/settings',                    views.wrapper           );
app.get('/reddit',                      views.wrapper           ); 

/*
    Backend routes
*/
app.get('/api/script/:scriptname',      scripts.get             );
app.get('/api/styles/:filename',        styles.get              );
app.get('/api/artist/:id',              views.artist            );
app.get('/api/song/:id',                views.track             );
app.get('/api/lyrics/:id',              views.lyrics            );
app.get('/api/charts',                  views.charts            );
app.get('/api/charts/:year',            views.retrocharts       );
app.get('/api/album/:id',               views.album             );
app.get('/api/i/:filename',             styles.images.get       );
app.get('/api/svg/:filename',           styles.svg.get          );
app.get('/api/svg/:filename/:color',    styles.svg.getColor     );
app.get('/api/main',                    views.main              );
app.get('/api/error/:code',             views.error             );
app.get('/api/info',                    views.info              );
app.get('/api/u/:username/p/:playlist', views.playlist          );
app.get('/api/library',                 views.library           );
app.get('/api/settings',                views.settings          );
app.get('/api/reddit',                  views.reddit            );

/*
    Auth routes
*/
app.get('/auth/facebook',               fb.login                );
app.get('/auth/facebook/token',         fb.token                );
app.get('/logout',                      fb.logout               );

/*
    Set up admin routes
*/
app.get('/admin/',                       admin.home              );
app.get('/webhook/push',				 webhook.push			 );

/*
	Configure Websockets. Through websockets, users can receive live updates and submit to the database.
*/
io.set('log level', 1);
io.sockets.on('connection', events.connection);

/*
    Fetch iTunes feeds every hour
*/
charts.refresh();