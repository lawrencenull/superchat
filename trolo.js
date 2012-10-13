var http = require('http');
var tropo_webapi = require('tropo-webapi');
 
var server = http.createServer(function (request, response) {
     
    var tropo = new TropoWebAPI();

// tropo.say("http://www.pickpuck.com/music.mp3");
var transcription = {"id":"1234", "url":"mailto:michaelcpuckett@.com"}; 
var say = tropo.say("Hello, how are you?.", null, null, null, "victor");
var choices = new Choices(null,null,'#');

tropo.record(null, null, null, choices, null, 7, 60, null, null, "recording", null, say, 10, transcription, "ftp://mcpuck:Agent106!:ftp.pickpuck.com/recordings.js");

// function (attempts, bargein, beep, choices, format, maxSilence, maxTime, method, minConfidence, name, required, say, timeout, transcription, url, password, username)

//tropo.record(null, null, null, choices, null, null, null, null, null, "recording", null, say, null, null, "ftp://ftp.pickpuck.com/pickpuck.com/recording.wav", 'mcpuck', 'Agent106!');

//tropo.record(null, null, null, choices, "audio/mp3", 7, 60, null, null, "recording", null, say, 10, {url:'michaelcpuckett@gmail.com'}, "ftp://mcpuck:Agent106!@ftp.pickpuck.com/pickpuck.com/recording.mp3");
     

response.end(TropoJSON(tropo));

}).listen(3000); 
