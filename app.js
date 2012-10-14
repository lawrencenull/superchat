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


app.post('/tropo', function (req,res,next) {
    var tropo = new TropoWebAPI();

    var phoneNumber = req.body.session.from.id;

    // on call start, add phone user to users collection
    appController.trigger('_userSessionStarted', {
        id: phoneNumber,
        image: {
            data: '/images/default-phone-image.gif'
        }
    });

    // on call end, remove phone user from user collection
    tropo.on('hangup', function() {
        console.log('HANGUP');
        //console.log(data);

        /*appController.trigger('_userSessionEnded', {
            id: phoneNumber
        });*/
    });

    tropo.on('hangup', null, '/hangup', true);

    // record user text
    var transcription = {"id":phoneNumber, "url":"http://54.243.182.246:3000/call"};
    var say = new Say("Hello, how are you?");
    var choices = new Choices(null,null,'#')
    tropo.record(null, null, true, choices, null, 7.0, 120.0, null, null, "recording", null, say, 10.0, transcription, "ftp://ftp.pickpuck.com/pickpuck.com/recording.mp3", "Agent106!", "mcpuck");


    req.on('end', function () {
        console.log('CALL ENDED');
    });

    res.end(TropoJSON(tropo));
});

app.post('/hangup', function (req, res) {
    console.log('this baby hung up!');
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
appChat.init({
    _: _,
    Backbone: Backbone
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
            usersController.add({
                id: user.id
            });
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

        chatController.on('_chatMessageAdded', function (message) {
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

app.post('/call', function (req, res, next) { 
    console.log(req.body.result);
    console.log('user', req.body.result.identifier);
    var user = appController.usersController.usersCollection.where({id:req.body.result.identifier});
    if (user.length > 0) {
        user = user[0].toJSON();
    } else {
        user = { id: req.body.result.identifier };
    }
    appController.trigger('_chatMessageAdded', {user: user, message:req.body.result.transcription}); 
    res.write('', 200); 
});


/**
  Socket.io setup
  */


socket_io.sockets.on('connection', function (socket) {
    appController.trigger('_userSessionStarted', socket);

    socket.on('disconnect', function () {
        appController.trigger('_userSessionEnded', socket);
    });
    socket.on('fileAdded', function (data) {
        console.log(data);
        appController.trigger('_fileAdded', data);
    });
    socket.on('chatMessageAdded', function (data) {
        appController.trigger('_chatMessageAdded', data);
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
