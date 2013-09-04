
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
  , totalErrors = 0
  , tpm = 0
  , minutes = 0
  , dbReady = false
  , fs = require('fs');

var db = dirty('db/tweetcount.db')
var cities = dirty('db/cities.db');
var densities = dirty('db/densities.db');
var normalized = dirty('db/normalized.db');

fs.watchFile('db/cities.db', function () {
    fs.stat('db/cities.db', function (err, stats) {
    	console.log('cities size: ' , stats.size)
        if (stats.size > 2000000000)
        	fs.unlink('db/cities.db', function(err) {
        		if(err) throw err
        		cities = dirty('db/cities.db')
        	})

    });
});

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
app.get('/density', getPopulationDensity);
app.get('/users', user.list);


var twit = new twitter({
	consumer_key: 'oL9WYc0haBx8S8VmHBCTQ',
	consumer_secret: '2Pfxk3sl9rhtbEtn4TUlUiR9NDlu7x0puuB4rihXbQ',
	access_token_key: '845732328-HqzZS5itaQmsppAoR1VM14yhhIg7WsRepkhlBJTp',
	access_token_secret: 'fPW3Tu0WCPSPK6DKZGqzD4reN1amq8XMydjPj5wbTs'
});


twit.stream('statuses/filter', {locations: '-124.848974,24.396308,-66.885444,49.384358' }, function(stream) {
	setInterval(calculateTPM,60000);
	stream.on('data',function(data) {
		totalTweets++;
		try {
			var dataObj = {
				coords: data.coordinates.coordinates,
				intensity: getLocationIntensity(data.coordinates.coordinates),
				location: getLocationName(data)
			};
			normalized.set(dataObj.location.name,dataObj.intensity);
			app.io.broadcast('tweet',dataObj);
		} catch(e) {
		}
		db.set('total',totalTweets);
	});
	stream.on('end', function(response) {
		console.eroor('STREAM CLOSED: ' , response)
	});
	stream.on('destroy', function(response) {
		console.log('STREAM DESTROYED: ', response)
	})
});

function getLocationName(data) {

		if (data.place.place_type == "city") {
			var lat = Math.floor(data.coordinates.coordinates[0]/5);
			var lon = Math.floor(data.coordinates.coordinates[1]/5);
			var location = cities.get(lat + ',' + lon) || {};
			var previousOwner = {
				name: null,
				count: 0
			};
			var newOwner = {
				name: null,
				count: 0
			};

			if (!location.hasOwnProperty('cities')) {
				location.cities = {};
			}

			try { 
				Object.keys(location.cities).forEach(function(key) {
					var city = location.cities[key];
					if(city.count > previousOwner.count) 
						previousOwner = city;
				})
				if (!location.cities.hasOwnProperty(data.place.full_name)) {
					location.cities[data.place.full_name] =  { name: data.place.name, count: 1, location: [data.coordinates.coordinates[0],data.coordinates.coordinates[1]]};
				} else {
					location.cities[data.place.full_name].count++;
				}

				Object.keys(location.cities).forEach(function(key) {
					var city = location.cities[key];
					if(city.count > newOwner.count) {
						newOwner = city;
					}
				})
				

				cities.set(lat + ',' + lon, location);
				
				return newOwner;



			} catch(e) {
				console.log('ERROR GETTING LOCATION NAME: ' ,e , location,r)
				return null
			}
		} 
		
		return null;
};


function getLocationIntensity(coordinates) {
		var lat = coordinates[0].toFixed(0);
		var lon = coordinates[1].toFixed(0);
		var location = db.get(lat + ',' + lon) || {};

		if (!location.hasOwnProperty('total')) {
			location.total = 0;
		}


		location.total++;
		
		var max = db.get('max') || 0;
		var min = 9007199254740992;

		var normMin = 0,
			normMax = 1,
			norm,
			intensity;
		
		db.forEach(function(key,val) {
			if (val.total < min)
				min = val.total;
		});

		if (location.total > max) {
			max = location.total;
			db.set('max',max);
		}

		db.set(lat+ ',' + lon, location);
		norm = normMin + ((parseInt(location.total) - min) * (normMax - normMin))/(max-min);
		intensity = normMax - norm;
		return intensity;
}

function calculateTPM() {
	minutes++;
	tpm = totalTweets / minutes;
	console.log('tpm:',tpm,' @ ',minutes,'minutes');
}

function getPopulationDensity() {
	
	var getNextDensity = function() {
		
	}

	setInterval(getNextDensity,1000);
}

app.listen(app.get('port'));
