var http = require('http');
var tropo_webapi = require('tropo-webapi');
 
var server = http.createServer(function (request, response) {
     
    var tropo = new TropoWebAPI();
 
    tropo.say("My name is Michael Puckett!");
     
    response.end(TropoJSON(tropo));
 
}).listen(8000); 