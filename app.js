
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

app.http().io();

// all environments
app.set('port', process.env.PORT || 3000);
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

var twit = new twitter({
	consumer_key: 'oL9WYc0haBx8S8VmHBCTQ',
	consumer_secret: '2Pfxk3sl9rhtbEtn4TUlUiR9NDlu7x0puuB4rihXbQ',
	access_token_key: '845732328-HqzZS5itaQmsppAoR1VM14yhhIg7WsRepkhlBJTp',
	access_token_secret: 'fPW3Tu0WCPSPK6DKZGqzD4reN1amq8XMydjPj5wbTs'
});


twit.stream('statuses/filter', {locations: '-124.848974,24.396308,-66.885444,49.384358' }, function(stream) {
	stream.on('data',function(data) {
		try {
			app.io.broadcast('tweet',data.coordinates.coordinates);
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


app.listen(3000);
