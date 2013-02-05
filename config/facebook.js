this.clientID       = 212482748876564;
this.clientSecret   = 'f2bdb7700ef2d87a8c05b32ac31c013a';
this.redirect_uri   = 'http://chinchilla.jonnyburger.c9.io/auth/facebook/token';

this.login = function(request, response) {
    response.redirect('https://www.facebook.com/dialog/oauth?client_id=' + facebook.clientID + '&redirect_uri=' + facebook.redirect_uri);
};