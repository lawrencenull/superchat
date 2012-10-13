var http = require('http');
var tropo_webapi = require('tropo-webapi');
 
var server = http.createServer(function (request, response) {
     
    var tropo = new TropoWebAPI();
 tropo.say("http://www.phono.com/audio/troporocks.mp3 Here's some hold music! http://www.phono.com/audio/holdmusic.mp3");
     
//    tropo.say("My name is Michael Puckett!");
     
    response.end(TropoJSON(tropo));
 
}).listen(3000); 
