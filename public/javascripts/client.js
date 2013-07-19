$(function() {
		socket = io.connect()
	//socket = {};

	var height = $(document).height();
	var width = $(document).width();
	var cities = [
		{
			name: 'Dallas',
			location: {
				lat: 32.780140,
				lon: -96.800451
			}
		}, 
		{
			name: 'San Diego',
			location: {
				lat: 32.715329,
				lon: -117.157255
			}
		},
		{
			name: 'Los Angeles',
			location: {
				lat: 34.052234,
				lon: -118.243685
			}
		},
		{
			name: 'San Francisco',
			location: {
				lat: 37.774929,
				lon: -122.419416
			}
		},
		{
			name: 'New York',
			location: {
				lat: 40.714353,
				lon: -74.005973
			}
		},
		{
			name: 'Boston',
			location: {
				lat: 42.358431,
				lon: -71.059773
			}
		},
		{
			name: 'Chicago',
			location: {
				lat: 41.878114,
				lon: -87.629798
			}
		},
		{
			name: 'Miami',
			location: {
				lat: 25.788969,
				lon: -80.226439
			}
		},
		{
			name: 'Tampa',
			location: {
				lat: 27.950575,
				lon: -82.457178
			}
		},
		{
			name: 'Houston',
			location: {
				lat: 29.760193,
				lon: -95.369390
			}
		},
		{
			name: 'Austin',
			location: {
				lat: 30.267153,
				lon: -97.743061
			}
		},
		{
			name: 'Seattle',
			location: {
				lat: 47.606209,
				lon: -122.332071
			}
		},
		{
			name: 'Seattle',
			location: {
				lat: 47.606209,
				lon: -122.332071
			}
		},
		{
			name: 'Portland',
			location: {
				lat: 45.523452,
				lon: -122.676207
			}
		},
		{
			name: 'D.C.',
			location: {
				lat: 38.907231,
				lon: -77.036464
			}
		},
		{
			name: 'Bakersfield',
			location: {
				lat: 35.373292,
				lon: -119.018712
			}
		},



	];



	try{
		var canvas = document.getElementsByTagName('canvas')[0];
	    var heatmap = createWebGLHeatmap({height:height, width: width});
	    document.body.appendChild(heatmap.canvas);
	}
	catch(error){
	    console.log(error);
	}

	
	var c = document.getElementById("labels");
	var ctx = c.getContext("2d");
	ctx.canvas.width = $(window).width();
	ctx.canvas.height = $(window).height();
	ctx.font="10px Roboto";
	ctx.fillStyle = '#222222';

	_.each(cities, function(city) {
		var textSize = ctx.measureText(city.name);
		var x = ((Math.ceil(city.location.lon + 124.848974)/58) * width) - (width * .025) ;
		var y = Math.abs(((Math.ceil(city.location.lat - 24.396308) / 25) * height)-height) + (width * .025);
		ctx.fillText(city.name,x,y);
		
	})


	socket.on('tweet', function(data) {
		
		var y = Math.abs(((Math.ceil(data.coords[1] - 25) / 25) * height)-height);
		var x = (Math.ceil(data.coords[0] + 124)/58) * width ;
	    heatmap.addPoint(x,y,30,.25);
	})

	$('#disconnect').click(function() {
		socket.disconnect();
	})


	 var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
	                                         window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

	var update = function(){
	    //heatmap.addPoint(100, 100, 100, 10/255);
	    heatmap.adjustSize(); // can be commented out for statically sized heatmaps, resize clears the map
	    heatmap.update(); // adds the buffered points
	    heatmap.display(); // adds the buffered points
	    heatmap.multiply(0.9999);
	    heatmap.blur();
	    heatmap.clamp(0.0, .9); // depending on usecase you might want to clamp it
	    raf(update);
	}
	raf(update);
});
