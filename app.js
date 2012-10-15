/**
 * Module dependencies.
 */


var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    socket_io = require('socket.io').listen(8080),
    _ = require('underscore'),
    Backbone = require('backbone'),
    fs = require('fs'),
    tropo_webapi = require('tropo-webapi'),
    translate = require('node-google-translate'),
    appFiles = require('./server/files'),
    appUsers = require('./server/users'),
    appChat = require('./server/chat'),
    appDraw = require('./server/draw');
//, mongodb = require('mongodb');


/**
 * Database setup
 */


//var db = mongodb.createConnection('localhost', 'io-whiteboard');


/**
 * Express setup
 */

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};


var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'html');
    app.engine('html', require('ejs').__express);
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(allowCrossDomain);
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

app.post('/tropo', function(req, res){
     
    var tropo = new TropoWebAPI();

    var phoneNumber = req.body.session.from.id;

    var say = new Say('Press one for English. Or two for Spanish.');
    var choices = new Choices('1,2');

    tropo.ask(choices, null, null, null, "locale", null, null, say, 60, null);
     
    tropo.on("continue", null, "/listen?id="+phoneNumber, true);
    
    // do we need to avoid triggering hangup because it could add a user that hasn't been added yet?
    tropo.on('hangup', null, '/hangup?id='+phoneNumber, true);
     
    res.send(TropoJSON(tropo));
     
});

app.post('/listen', function(req, res){

    var tropo = new TropoWebAPI();
    var phoneNumber = req.query.id;
    var localeDigit;
    var recognizer = 'en-us';

    if (req.body.result && req.body.result.actions) {
        localeDigit = req.body.result.actions.value;
    }

    if (localeDigit && (localeDigit === '1' || localeDigit === '2')) {
        console.log('CREATE');
        var locale = 'en';
        if (localeDigit === '2') {
            locale = 'es';
            recognizer = 'es-es';
        }

        appController.trigger('_userSessionStarted', {
            id: phoneNumber,
            locale: locale,
            recognizer: recognizer,
            image: {
                'data': '/images/default-phone-image.gif'
            }
        });

        tropo.say('Locale set to' + locale + '. Press pound to record a message at any time.' );
    }

    var say = new Say('');
    var choices = new Choices(null, null, '#');

    tropo.ask(choices, null, null, null, 'poll', null, null, say, 5, null);

    tropo.on('continue', null, '/record?id='+phoneNumber, true);

    tropo.on('incomplete', null, '/messages?id='+phoneNumber, true);

    tropo.on('hangup', null, '/hangup?id='+phoneNumber, true);


    res.send(TropoJSON(tropo));
 
});



app.post('/record', function (req,res) {
    var tropo = new TropoWebAPI();

    var phoneNumber = req.query.id;
    var userModel = appController.usersController.usersCollection.get(phoneNumber);
    var user = userModel.toJSON();
    var fileID = phoneNumber+"-"+new Date().getUTCMilliseconds();

    var say = new Say('Press pound after recording your message.');

    console.log('TROPO RECOGNIZER', user.recognizer);

    var transcription = {"id":phoneNumber, "url":"http://54.243.182.246:3000/call?fileID="+fileID+"&locale="+user.locale};
    var choices = new Choices(null,null,'#');
    //tropo.record(null, null, true, choices, null, 7.0, 120.0, null, null, "recording", null, say, 10.0, transcription, "ftp://ftp.pickpuck.com/pickpuck.com/recording.mp3", "Agent106!", "mcpuck");
    tropo.record(null, null, true, choices, 'audio/mp3', 5, 30, null, null, "recording", user.recognizer, say, 5, transcription, "http://54.243.182.246:3000/upload?fileID="+fileID+"&id="+phoneNumber, null, null);

    tropo.on('continue', null, '/messages?id='+phoneNumber, true);

    tropo.on('hangup', null, '/hangup?id='+phoneNumber, true);

    res.send(TropoJSON(tropo));
});

app.post('/upload', function (req,res) {

    var phoneNumber = req.query.id;
    var fileName = req.query.fileID;
    var userModel = appController.usersController.usersCollection.get(phoneNumber);
    var user = userModel.toJSON();

    fs.readFile(req.files.filename.path, function (err, data) {

      var newPath = __dirname + "/public/recordings/" + fileName;
      fs.writeFile(newPath, data, function (err) {

        appController.trigger('_chatMessageAdded', {
            user: user,
            message: '',
            translations: {},
            transcribed: false,
            file: fileName
        });

        res.redirect("back");
      });
    });

});

app.post('/messages', function (req,res) {
    var tropo = new TropoWebAPI();
    var tropo_voices = {
        'es': ['Carmen', 'Leonor', 'Jorge', 'Juan'],
        'en': ['Allison', 'Susan', 'Vanessa', 'Veronica', 'Dave', 'Steven', 'Victor']
    };

    var phoneNumber = req.query.id;


        tropo.on('continue', null, '/listen?id='+phoneNumber, null);
        tropo.on('hangup', null, '/hangup?id='+phoneNumber, true);

    var userModel = appController.usersController.usersCollection.get(phoneNumber);
    var user = userModel.toJSON();

    var skipEverything = false;

    var messagesCollection = appController.chatController.messagesCollection;
    var messagesSinceLastMessage = messagesCollection.filter(function (message, index) {
        return (index > user.lastMessage)
            && ( message.get('user').id !== phoneNumber );
    });

    _.each(messagesSinceLastMessage, function (messageModel) {
        //value, as, name, required, voice

        var message = messageModel.toJSON();

        console.log('THIS IS HTE MESSAGE', message);

        var says = message.translations[user.locale];

        if (message.file) {
            says = 'http://54.243.182.246:3000' + message.file;
        }

        tropo.say(says, null, null, null, tropo_voices[user.locale][3]);
    });

    userModel.set('lastMessage', messagesCollection.length-1);

    res.send(TropoJSON(tropo));
});

app.post('/hangup', function (req,res) {
    var tropo = new TropoWebAPI();

    var phoneNumber = req.query.id;

    console.log('HANGUP', phoneNumber);

    appController.usersController.remove({id:phoneNumber});

    res.send(TropoJSON(tropo));
});


app.get('/', routes.index);  
app.get('/users', user.list);

http.createServer(app)
    .listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});


/**
  Backbone setup
  */

// Add update method to all models

Backbone.Controller = Backbone.View;

Backbone.Model.prototype.update = function(model){  
    var t = this;
    // update or add all new values
    _.each(model, function (value, attribute) {
        t.set(attribute, value);
    });
    // if new value is missing, delete old value
    _.each(this.attributes, function (value, attribute) {
        if (!model[attribute]) {
            t.unset(attribute);
        }
    });          
};

// Make Backbone DOM-independent

Backbone.View.prototype._ensureElement = function () {};

// import Files
appFiles.init({
    _: _,
    Backbone: Backbone,
    fs: fs
});

// import Users
appUsers.init({
    _: _,
    Backbone: Backbone
});

// import Chat
console.log(translate);
appChat.init({
    _: _,
    Backbone: Backbone,
    translate: translate
});

appDraw.init({
    _: _,
    Backbone: Backbone
});

// App
var AppController = Backbone.Model.extend({
    initialize: function () {
        var t = this;
        var filesController = this.filesController =new FilesController();
        var usersController = this.usersController = new UsersController();
        var chatController = this.chatController = new ChatController();
        var drawController = this.drawController = new DrawController();

        // file listeners
        filesController.on('_newFile', function (file) {
            t.notify( 'newFile', file );
        });
        filesController.on('_error', function (params) {
            if (params.user) {
                t.message(params.user, 'error', params.error);
            } else {
                t.notify('error', params.error);
            }
        });

        // user listeners
        usersController.on('_userAdded', function (user) {
            t.notify('userAdded', user);
        });
        usersController.on('_userRemoved', function (user) {
            t.notify('userRemoved', user);
        });
        usersController.on('_userUpdated', function (user) {
            t.notify('userUpdated', user);
            chatController.update(user, { type: 'user' });
        });

        // socket notifications
        this.on('_fileAdded', function (file) {
            filesController.trigger('fileAdded', file);
        });
        this.on('_userSessionStarted', function (user) {
            t.message(user.id, 'getAllUsers', usersController.render());
            t.message(user.id, 'getAllFiles', filesController.render());
            t.message(user.id, 'getAllMessages', chatController.render());
            usersController.add(user);
        });
        this.on('_userSessionEnded', function (user) {
            usersController.remove(user);
        });

        this.on('_userUpdated', function (user) {
            usersController.update(user);
        });

        // chat listeners
        this.on('_chatMessageAdded', function (message) {
            chatController.trigger('messageAdded', message);
        });

        this.on('_chatMessageUpdated', function (message) {
            chatController.update(message);
        });

        chatController.on('_chatMessageAdded', function (message) {
                        console.log('chat message added', message);
            t.notify('chatMessageAdded', message);
        });

        chatController.on('_chatMessageUpdated', function (message) {
            t.notify('chatMessageUpdated', message);
        });

        drawController.on('_lineAdded', function (line) {
            t.notify('newLineCoordinate', line);
        });

        this.notify('reload');

    },
    notify: function (message, data) {
        socket_io.sockets.emit('_' + message, data);
    },
    message: function (user, message, data) {
        socket_io.sockets.socket(user).emit('_' + message, data);
    }
});

appController = new AppController();

/**
  Tropo setup
  */

app.post('/call', function (req, res) { 
    var tropo = new TropoWebAPI();

    console.log('TRANSCRIPTION', req.body.result);

    var phoneNumber = req.body.result.identifier;
    var locale = req.query.locale;
    var fileID = req.query.fileID;

    /*var user = appController.usersController.usersCollection.get(phoneNumber);

    if (user) {
        user = user.toJSON();
    } else {
        user = {
            id: phoneNumber,
            locale: locale
        };
    }

    var messagesCollection = appController.chatController.messagesCollection;
    var userMessagesCollection = messagesCollection.filter(function (message, index) {
        return message.get('user').id === phoneNumber;
    });*/

    var messageModel = appController.chatController.messagesCollection.where({ file: fileID });

    if (messageModel.length > 0) {
        
        var message = messageModel[0].toJSON();
        message.message = req.body.result.transcription;
        message.transcribed = true;

        appController.chatController.update(message); 

    } else {
        console.log('TRANSCRIPTION FAILURE');
    }

    
    tropo.on("continue", null, "/listen?id="+phoneNumber, true);
     
    res.send(TropoJSON(tropo));
});


/**
  Socket.io setup
  */


socket_io.sockets.on('connection', function (socket) {
    appController.trigger('_userSessionStarted', {id:socket.id});

    socket.on('disconnect', function () {
        appController.trigger('_userSessionEnded', {id:socket.id});
    });
    socket.on('fileAdded', function (data) {
        console.log(data);
        appController.trigger('_fileAdded', data);
    });
    socket.on('chatMessageAdded', function (data) {
        console.log(data);
        appController.trigger('_chatMessageAdded', data);
    });
    socket.on('chatMessageUpdated', function (data) {
        console.log('message updated from client!!!!!!!!!!!!');
        appController.trigger('_chatMessageUpdated', data);
    });
    socket.on('reloadRequest', function (data) {
        appController.notify('reload');
    });
    socket.on('userUpdated', function (data) {
        appController.trigger('_userUpdated', data);
    });
    socket.on('newLineCoordinate', function (data) {
        appController.trigger('_newLineCoordinate', data);
    });
});
