'use strict'
/**
 * Module dependencies.
 */

var app = require('express.io')()
  , util = require('util')
  , express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , twitter = require('ntwitter')
  , EventEmitter = require('events').EventEmitter
  , emitter = new EventEmitter()
  , minutes = 0
  , dbReady = false
  , fs = require('fs');

var port = process.env.PORT || 5000;

app.http().io();

// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);


var twit = new twitter({
	consumer_key: 'oL9WYc0haBx8S8VmHBCTQ',
	consumer_secret: '2Pfxk3sl9rhtbEtn4TUlUiR9NDlu7x0puuB4rihXbQ',
	access_token_key: '845732328-HqzZS5itaQmsppAoR1VM14yhhIg7WsRepkhlBJTp',
	access_token_secret: 'fPW3Tu0WCPSPK6DKZGqzD4reN1amq8XMydjPj5wbTs'
});

function startStream() {
	twit.stream('statuses/filter', {locations: '-124.848974,24.396308,-66.885444,49.384358' }, function(stream) {
		stream.on('data',function(data) {
			try {
				var dataObj = {
					coords: data.coordinates.coordinates,
				};
				app.io.broadcast('tweet',dataObj);
			} catch(e) {
			}
		});
		stream.on('end', function(response) {
			console.error('STREAM CLOSED: ' , response)
			startStream()
		});
		stream.on('destroy', function(response) {
			console.log('STREAM DESTROYED: ', response)
		})
	});
}

app.listen(port, function() {
  console.log("Listening on " + port);
});

startStream();
