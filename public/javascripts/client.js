$(function() {
  'use strict';

	var socket;
  var heatmap = null;
  var cities = [];
  var lineHeight = 12;
  var listening = false;
  var $canvas = null;

  var totalTweets = 0;


  var heatmapConfig = function() {
    this.decay = 0;
    this.count = 1;
    this.spread = 0;
    this.size = 30;
    this.clamp = 1.0;
    this.blur = true;
    this.clear = false;
    this.intensity = 1.0;
    this.texture = 'ghost';
    this.height = window.innerHeight;
    this.width = window.innerWidth;
  };





  var config = new heatmapConfig();

  //Let's get this party started
  socket = io.connect()


  var createNewHeatmap = function() {

    var gradientTexture = '';

    switch (config.texture) {
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
    heatmap = createWebGLHeatmap({
      height: config.height,
      width: config.width,
      gradientTexture: gradientTexture
    });
    $('body').append(heatmap.canvas);
  }

  function listen() {
    listening = true;
    socket.on('tweet', function(data) {
        var y = Math.abs(((Math.ceil(data.coords[1] - 25) / 25) * config.height) - config.height);
        var x = (Math.ceil(data.coords[0] + 124) / 58) * config.width;
        var size = config.size;
        heatmap.addPoint(x, y, size, config.intensity);
    });
}

function main() {
  createNewHeatmap();
  var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  var update = function() {
    if (heatmap) {
      if (!listening) {
        listen();
      }
      heatmap.update(); // adds the buffered points
      heatmap.display(); // adds the buffered points
      heatmap.multiply(1 - config.decay / (100 * 100));
      if (config.blur) {
        heatmap.blur();
      }
      if (config.clear) {
        heatmap.clear();
        config.clear = false;
      }
      //heatmap.clamp(0.0, config.clamp); // depending on usecase you might want to clamp it
    } else {
      console.log('no heatmap');
    }
    raf(update);
  }

	update();
}

main();

});
