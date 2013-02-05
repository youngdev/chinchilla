var views = require("../routes/views");
var	fb_app={
	scope: 'user_about_me',
	state: parseInt(Math.random()*1000),
	display: 'popup',
	callback: function(accessToken){
		console.log('in call back',accessToken);
	}
}
,	https = require('https')
,	_und= require('underscore')

var T=this
if (!this.fbAppSettings){
	this.fbAppSettings=fb_app
}

this.settings=function(options){
	this.fbAppSettings=_und.extend(this.fbAppSettings,options)
}


this.auth=function(req,res,next){
	var f=T.fbAppSettings
	f.state=req.query.next||'/'
	var url='https://www.facebook.com/dialog/oauth?client_id='+f.client_id+'&scope='+f.scope+'&state='+f.state+'&display=popup&redirect_uri='+f.redirect_uri
	res.redirect(url)
}

this.getUser=function(callback){
	var options={
		headers: { 'content-type': 'application/json' },
		host: 'graph.facebook.com',
		path: '/me?access_token='+T.accessToken
	}
	var m=''
	https.get(options,function(resp){
		resp.on('data', function(chunk){
			m+=chunk;
		});
		resp.on('error', function(e){
			console.log('Error: '+e.message);
		});
		resp.on('end',function(){
			m=JSON.parse(m);
			callback(m);
		});
	});

};

this.getAccessToken=function(req, res) {
	var next=req.query.state
	,	f=T.fbAppSettings;
	var options={
		headers: { 'content-type': 'application/json' },
		host: 'graph.facebook.com',
		path: '/oauth/access_token?'+'client_id='+f.client_id+'&client_secret='+f.client_secret+'&redirect_uri='+f.redirect_uri+'&code='+req.param('code')
	};
	var m='';
	https.get(options, function(resp){
		resp.on('data', function(chunk){
			m+=chunk;
		});
		resp.on('error', function(e){
			console.log('Error: '+e.message);
		});
		resp.on('end',function(){
			console.log('on end',m);

			/* get access token */
			var a=m.split('&');
			var accessToken=a[0].split('=')[1];
			/* invoke callback with access token */
			T.accessToken=accessToken;
			f.callback(accessToken, req, res);
			res.send('<script type="text/javascript"> \
				window.opener.location.href="'+next+'"; \
				window.close(); \
				</script>'
				);
		});
	});
};
