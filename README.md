# Chinchilla

Welcome, here you can find the source code for _chinchilla_, a web app written in node.js for playing, discovering and organizing music. 
All of the tracks are being streamed via YouTube. 

## The Idea

There are many possibilities to listen to music. I want to combine them to make your music listening awesome. 
Take the comfort of organzing music from iTunes and the huge music library from YouTube and put it together! 

## How to install

First you need a MongoDB database to make this work. I chose mongolab. Then, create a directory /auth and put a file named auth.js in it. Then, put your authentication string in it like this: 
	```javascript
	this.auth = "username:password@server:port/dbname?auto_reconnect";
	``` 
Then, install all node modules!  
	```
	npm install 
	```
You're ready to go! Use foreman to start the server:
	```
	foreman start 
	``