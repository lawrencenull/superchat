var http = require('http');
var tropo_webapi = require('tropo-webapi');
 
var server = http.createServer(function (request, response) {
     
    var tropo = new TropoWebAPI();
 
    tropo.say("Welcome to Tropo!");
     
    response.end(TropoJSON(tropo));
 
}).listen(8000); 