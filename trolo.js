var http = require('http');
var tropo_webapi = require('tropo-webapi');
 
var server = http.createServer(function (request, response) {
     
    var tropo = new TropoWebAPI();

// tropo.say("http://www.pickpuck.com/music.mp3");
var transcription = {"id":"1234", "url":"mailto:michaelcpuckett@.com"}; 
var say = new Say("Hello, how are you?");
var choices = new Choices(null,null,'#');

//var say = tropo.say("Oh my dear friend Bill. How are you?");

//tropo.record(null, null, null, choices, null, 7, 60, null, null, "recording", null, say, 10, transcription, "ftp://mcpuck:Agent106!:ftp.pickpuck.com/recordings.js");

//tropo.record(null, null, null, choices, null, null, null, null, null, "recording", null, say, null, null, "ftp://mcpuck:Agent106!@ftp.pickpuck.com/pickpuck.com/recording.wav");


//(attempts, bargein, beep, choices, format, maxSilence, maxTime, method, minConfidence, name, required, say, timeout, transcription, url, password, username) {
    
tropo.record(null, null, true, choices, null, 7.0, 120.0, null, null, "recording", null, say, 10.0, null, "ftp://ftp.pickpuck.com/pickpuck.com/recording.mp3", "Agent106!", "mcpuck");
     
// tropo.record(3, false, null, choices, "audio/wav", 5, 120, null, null, "recording", null, say, 5, null, "ftp://mcpuck:Agent106!@ftp.pickpuck.com/pickpuck.com/sandbox/iostudio-whiteboard/recording.mp3");



response.end(TropoJSON(tropo));

}).listen(3000); 
