$(function() {



	var heatmap = null;
	var cities = [];
	var lineHeight = 12;
	var listening = false;
	var $canvas = null;
	var canAdd = true;
	var totalTweets = 0;

	
	var heatmapConfig = function() {
		this.decay = 100;
		this.count = 500;
		this.spread = 20;
		this.size = 1;
		this.clamp = 1.0;
		this.blur = false;
		this.clear = false;
		this.intensity = 1.0
		this.cityColor = '#222222'
		this.showLabels = true;
		this.texture = 'classic';
		this.normalize = false;
		this.normalizeMax = 100;
		this.height = $(window).height();
		this.width = $(window).width();
	};




	var heatmapPresets = {
	  "preset": "Classic",
	  "remembered": {
	    "Classic": {
	      "0": {
	        "cityColor": "#222222",
	        "showLabels": true,
	        "texture": "classic",
	        "decay": 5,
	        "count": 1,
	        "spread": 0,
	        "size": 30,
	        "intensity": 1,
	        "clamp": 0.9,
	        "blur": true,
	        "clear": false
	      }
	    },
	    "Lightning": {
	      "0": {
	        "cityColor": "#444fa2",
	        "showLabels": false,
	        "texture": "ghost",
	        "decay": 50,
	        "count": 1,
	        "spread": 0,
	        "size": 5,
	        "intensity": 1,
	        "clamp": 0.75,
	        "blur": false,
	        "clear": false
	      }
	    },
	    "Bokeh": {
	      "0": {
	        "cityColor": "#222222",
	        "showLabels": true,
	        "texture": "ghost",
	        "decay": 198.51800792693433,
	        "count": 67.10649663966913,
	        "spread": 0,
	        "size": 64.68378424952611,
	        "intensity": 1,
	        "clamp": 0.9,
	        "blur": false,
	        "clear": false
	      }
	    }
	  },
	  "closed": true,
	  "folders": {
	    "Label Options": {
	      "preset": "Classic",
	      "closed": true,
	      "folders": {}
	    },
	    "Tweet Options": {
	      "preset": "Classic",
	      "closed": true,
	      "folders": {}
	    }
	  }
	}

	var config = new heatmapConfig();

	var gui = new dat.GUI({ 
		load: heatmapPresets,
		preset: 'Classic'
	});

	gui.remember(config);

	var labels = gui.addFolder('Label Options');
	
	
	
	var cityColor = labels.addColor(config,'cityColor')
	var showLabels = labels.add(config,'showLabels');
	
	var tweets = gui.addFolder('Tweet Options');
	var texture = tweets.add(config,'texture',['classic','ghost'])
	tweets.add(config,'decay',0,1000);
	tweets.add(config,'count',1,1000);
	tweets.add(config,'spread',0,100);
	tweets.add(config,'size',0,255);
	tweets.add(config,'intensity',0,1);
	tweets.add(config,'clamp').min(0).max(1).step(.05);
	tweets.add(config,'blur');
	tweets.add(config,'clear').listen();

	var dataFolder = gui.addFolder('Data');
	dataFolder.add(config,'normalizeMax',1,100);
	dataFolder.add(config,'normalize');


	showLabels.onChange(function(value) {
		if (value == true) {
			$canvas.show();
		} else {
			$canvas.hide();
		}
	});

	texture.onChange(function(value) {
		$(heatmap.canvas).remove();
		createNewHeatmap();
	});

	cityColor.onChange(function(value) {
		updateCityNames();
	});



	//Let's get this party started
	socket = io.connect()
	
	$canvas = $('#labels');
	var ctx = $canvas[0].getContext("2d");
	ctx.canvas.width = $(window).width();
	ctx.canvas.height = $(window).height();
	ctx.font="200 8px Roboto";

	

	
	var createNewHeatmap = function() {

		var gradientTexture = '';

		switch(config.texture) {
			case 'classic':
				gradientTexture = null;
				break;
			case 'ghost':
				gradientTexture = 'images/finger-paint.png'
				break;
			case 'default':
				gradientTexture = null;
				break;
		}
		heatmap = createWebGLHeatmap({height:config.height, width: config.width, gradientTexture: gradientTexture});
		$('body').append(heatmap.canvas);
	}

	var updateCityNames = function() {
		ctx.fillStyle = config.cityColor;
		ctx.clearRect(0, 0, $canvas.width(), $canvas.height());
		
		_.each(_.keys(cities), function(key) {
			var city = cities[key];
			var y = Math.abs(((Math.ceil(city.location[1] - 25) / 25) * config.height)-config.height);
			var x = (Math.ceil(city.location[0] + 124)/58) * config.width ;
			var lines = city.owner.match(/\w+/g);
			var textWidth = 0;
			if (lines == null) {
				textWidth = ctx.measureText(city.owner).width;
				ctx.fillText(city.owner.toUpperCase(),x-(textWidth/2),y);
			} else {
				_.each(lines, function(line,i) {
					textWidth = ctx.measureText(line.replace(/\s/,'')).width;
					ctx.fillText(line.replace(/\s/,'').toUpperCase(),x - (textWidth/2),	y + (i*lineHeight));
				});
			}
		});
	}


	function listen() {
		listening = true;
		socket.on('tweet', function(data) {
			if (canAdd) {
				totalTweets++;
				var y = Math.abs(((Math.ceil(data.coords[1] - 25) / 25) * config.height)-config.height);
				var x = (Math.ceil(data.coords[0] + 124)/58) * config.width ;

				var size = config.size;
				if (config.normalize)
					size = data.intensity * config.normalizeMax;
			    heatmap.addPoint(x,y, size, config.intensity);
			    var i = 0;

		        while(i < config.count ){
		            var xoff = Math.random()*2-1;
		            var yoff = Math.random()*2-1;
		            var l = xoff*xoff + yoff*yoff;
		            if(l > 1){
		                continue;
		            }
		            var ls = Math.sqrt(l);
		            xoff/=ls; yoff/=ls;
		            xoff*=1-l; yoff*=1-l;
		            i += 1;

		            heatmap.addPoint(x+xoff*config.spread, y+yoff* config.spread, config.size, config.intensity);
		        }
			    if (data.location !== null) {
			    	var lat = Math.floor(data.coords[0]/5);
				    var lon = Math.floor(data.coords[1]/5);
				    var prevOwner = '';
				    var city = {};
				    if(_.indexOf(_.keys(cities),lat + ',' + lon) != -1) {
				    	city = cities[lat + ',' + lon]
				    	prevOwner = _.clone(city.owner);
				    	city.owner = data.location.name
				    	if (prevOwner !== city.owner) {
				    		city.location = data.coords;
				    		cities[lat + ',' + lon] = city;
				    		updateCityNames();
				    	}
				    } else { 
				    	city.owner = data.location.name;
				    	city.location = data.coords;
				    	cities[lat + ',' + lon] = city;
				    	updateCityNames();
				    }
			    }
		    }
		})

		$('#disconnect').click(function() {
			socket.disconnect();
		})
	}

	function main() {
		createNewHeatmap();	
		var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

		var update = function() {
			if (heatmap) {
				canAdd = true;
				if (!listening) {
					listen();
				}
			    //heatmap.addPoint(100, 100, 100, 10/255);
			     // can be commented out for statically sized heatmaps, resize clears the map
			    heatmap.update(); // adds the buffered points
			    heatmap.display(); // adds the buffered points
			    heatmap.multiply(1-config.decay/(100*100));
			    if(config.blur) {
			    	heatmap.blur();
			    }
			    if (config.clear) {
			    	heatmap.clear();
			    	config.clear = false;
			    }
			    heatmap.clamp(0.0, config.clamp); // depending on usecase you might want to clamp it
		 	} else {
		 		console.log('no heatmap');
		 	}
		 	raf(update);


		}
		raf(update);
	}
	
	main();

});
