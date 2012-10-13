var http = require('http');
var tropo_webapi = require('tropo-webapi');
 
var server = http.createServer(function (request, response) {
     
    var tropo = new TropoWebAPI();

 tropo.say("http://www.pickpuck.com/music.mp3");
    response.end(TropoJSON(tropo));
 
}).listen(3000); 
