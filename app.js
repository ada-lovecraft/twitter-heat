
/**
 * Module dependencies.
 */

var app = require('express.io')()
  , express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , twitter = require('ntwitter')
  , dirty = require('dirty')
  , EventEmitter = require('events').EventEmitter
  , emitter = new EventEmitter()
  , totalTweets = 0
  , totalErrors = 0;




app.http().io();

// all environments
app.set('port', 1127);
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
app.get('/users', user.list);

emitter.on('new city', getCityInfo);

var twit = new twitter({
	consumer_key: 'ftf8DUtrpa3TOSPjZBOIEQ',
	consumer_secret: 'j9w4DhzvQ0dWFxQr5TqXh9NrhJcpX8UZ1bvGW1LY',
	access_token_key: '845732328-14o53Xqi95T7wZ4EUDt9Lc7eNa8qBL7zMuzHskVg',
	access_token_secret: 'OWNOwB7A2MzAmImhmxx5q1AWQPqWp3IsqLTqIZchdk'
});


twit.stream('statuses/filter', {locations: '-124.848974,24.396308,-66.885444,49.384358' }, function(stream) {
	stream.on('data',function(data) {
		totalTweets++;
		try {
			var dataObj = {
				coords: data.coordinates.coordinates
			}
			app.io.broadcast('tweet',dataObj);
		} catch(e) {
			
		}
			
	});
	stream.on('end', function(response) {
		console.log('STREAM CLOSED: ' , response)
	});
	stream.on('destroy', function(response) {
		console.log('STREAM DESTROYED: ', response)
	})
});

function getCityInfo() {

}

var db = dirty('locations.db')


app.listen(app.get('port'));
