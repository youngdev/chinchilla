# Tunechilla

Welcome, here you can find the source code for _chinchilla_, a web app written in node.js for playing, discovering and organizing music. 
All of the tracks are being streamed via YouTube. 

## How to install

First, you have to clone the git repository.

`git clone https://github.com/JonnyBurger/chinchilla.git`

You also need a database. Google for mongoctl to find the easiest way to set up a MongoDB database. Call the databse chinchilla.

Install the npm packages: 

`npm install`

Set the DB password for Tunechilla to read (you have to do this everytime you reboot)

`export password=YOUR_PASSWORD_FOR_THE_DATABASE_WITHOUT_QUOTES`

Start the server! (runs on localhost:5000)

`node app.js`

