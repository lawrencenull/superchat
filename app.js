
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , socket_io = require('socket.io').listen(8080)
  , _ = require('underscore')
  , Backbone = require('backbone')
  , fs = require('fs')
  , appFiles = require('./server/files')
  , appUsers = require('./server/users');
  //, mongodb = require('mongodb');

/**
 * Database setup
*/

//var db = mongodb.createConnection('localhost', 'io-whiteboard');

/**
 * Express setup
 */

var app = express();

app.configure(function(){
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

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

/**
  Backbone setup
  */

// Make Backbone DOM-independent

Backbone.View.prototype._ensureElement = function () {};

// import Files
appFiles.init({ _:_, Backbone:Backbone, fs:fs });

// import Users
appUsers.init({ _:_, Backbone:Backbone });

// App
var AppController = Backbone.Model.extend({
  initialize: function () {
    var t = this;
    var filesController = new FilesController();
    var usersController = new UsersController();

    // file listeners
    filesController.on('_newFile', function (file) {
        t.notify('newFile', file.toJSON() );
    });
    filesController.on('_error', function (params) {
        if (params.user) {
            t.message( params.user, 'error', params.error );
        } else {
            t.notify( 'error', params.error );
        }
    });

    // user listeners
    usersController.on('_userAdded', function (user) {
        this.notify('userAdded', user);
    });
    usersController.on('_userRemoved', function (user) {
        this.notify('userRemoved', user);
    });

    // socket notifications
    this.on('_fileAdded', function (file) {
        filesController.trigger('fileAdded', file);
    });
    this.on('_userSessionStarted', function (socket) {
        usersController.add({id:socket.id}); // when to trigger and when to call directly?
        socket.emit( '_getAllUsers', usersController.render() );
        socket.emit( '_getAllFiles', filesController.render() );
    });
    this.on('_userSessionEnded', function (socket) {
        usersController.trigger('userSessionEnded', socket);
    });

  },
  notify: function (message, data) {
    socket_io.sockets.emit( '_'+message, data );
  },
  message: function (user, message, data) {
    socket_io.sockets.socket(user).emit( '_'+message, data);
  }
});

appController = new AppController();




/**
  Socket.io setup
  */

socket_io.sockets.on('connection', function (socket) {
  appController.trigger('_userSessionStarted', socket);
  socket.on('disconnect', function () {
    appController.trigger('_userSessionEnded', socket);
  });
  socket.on('fileAdded', function (data) {
    appController.trigger('_fileAdded', data);
  });
});