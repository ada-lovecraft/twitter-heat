socket = io.connect()
//socket = {};

var height = $(document).height();
var width = $(document).width();
try{
	var canvas = document.getElementsByTagName('canvas')[0];
    var heatmap = createWebGLHeatmap({height:height, width: width});
    document.body.appendChild(heatmap.canvas);

}
catch(error){
    console.log(error);
}

var topX = 0;
// Listen for the new visitor event.
socket.on('tweet', function(data) {
	var y = Math.abs(((Math.ceil(data[1] - 25) / 25) * height)-height);
	var x = (Math.ceil(data[0] + 124)/58) * width ;
	//total width: 58
	//total height: 25
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
    //heatmap.clamp(0.0, 1.0); // depending on usecase you might want to clamp it
    raf(update);
}
raf(update);
