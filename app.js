/**
 * Module dependencies.
 */


var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    events = require('events'),
    socket_io = require('socket.io').listen(8080), //, { log:false }),
    _ = require('underscore'),
    Backbone = require('backbone'),
    fs = require('fs'),
    tropo_webapi = require('tropo-webapi'),
    translate = require('node-google-translate'),
    appFiles = require('./server/files'),
    appUsers = require('./server/users'),
    appChat = require('./server/chat'),
    appTropo = require('./server/tropo');


/**
 * Express setup
 */


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
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

http.createServer(app)
    .listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});


/**
  Extend Backbone
  */


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


/**
  Application Start
  */


// initialize app modules

appFiles.init({ _: _, Backbone: Backbone, fs: fs });
appUsers.init({ _: _, Backbone: Backbone, fs: fs });
 appChat.init({ _: _, Backbone: Backbone, translate: translate });

// App logic

var AppController = Backbone.Model.extend({
    initialize: function () {
        var t = this,
            filesController = this.filesController =new FilesController(),
            usersController = this.usersController = new UsersController(),
            chatController = this.chatController = new ChatController();

        // manage files

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
        this.on('_fileAdded', function (file) {
            filesController.trigger('fileAdded', file);
        });

        // manage users

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

        // manage chat messages

        this.on('_chatMessageAdded', function (message) {
            chatController.trigger('messageAdded', message);
        });
        this.on('_chatMessageUpdated', function (message) {
            chatController.update(message);
        });
        chatController.on('_chatMessageAdded', function (message) {
            t.notify('chatMessageAdded', message);
        });
        chatController.on('_chatMessageUpdated', function (message) {
            t.notify('chatMessageUpdated', message);
        });

        // reload the client on server restart
        this.notify('reload');

    },
    notify: function (message, data) {
        // broadcast message to all users
        socket_io.sockets.emit('_' + message, data);
    },
    message: function (user, message, data) {
        // send message to a specific user
        socket_io.sockets.socket(user).emit('_' + message, data);
    }
});

appController = new AppController();


/**
  Socket.io setup
  */


socket_io.sockets.on('connection', function (socket) {
    appController.trigger('_userSessionStarted', {id:socket.id});

    socket.on('disconnect', function () {
        appController.trigger('_userSessionEnded', {id:socket.id});
    });
    socket.on('fileAdded', function (data) {
        appController.trigger('_fileAdded', data);
    });
    socket.on('chatMessageAdded', function (data) {
        console.log(data);
        appController.trigger('_chatMessageAdded', data);
    });
    socket.on('chatMessageUpdated', function (data) {
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


/**
  Routing
  */


// phone call routes
app.post('/tropo', appTropo.init);
app.post('/listen', appTropo.listen);
app.post('/record', appTropo.record);
app.post('/upload', appTropo.upload);
app.post('/messages', appTropo.messages);
app.post('/transcribe', appTropo.transcribe);
app.post('/hangup', appTropo.hangup);

// web routes
app.get('/', routes.index);