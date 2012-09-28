
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , socket_io = require('socket.io').listen(8080)
  , Backbone = require('backbone')
  , fs = require('fs');
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

// Users

var UserModel = Backbone.Model.extend({
  defaults: {
    'name': 'New User'
  },
  initialize: function () {
    if (this.get('name') === this.defaults.name) {
      this.set('name', 'anon_' + this.id);
    }
  }
});

var UsersCollection = Backbone.Collection.extend({
  model: UserModel
});

var UsersController = Backbone.View.extend({
    initialize: function () {
        var t = this;
        var usersCollection = this.usersCollection = new UsersCollection();
        usersCollection.on('add', function (user) {
            appController.trigger('notify', 'userAdded', user);
        });
        usersCollection.on('remove', function (user) {
            appController.trigger('notify', 'userRemoved', user);
        });
        this.on('userSessionEnded', function (user) {
          var userID = user.id;
          var user = usersCollection.where({id:user.id})[0];
          usersCollection.remove(user);
        });
    },
    add: function (user) {
        this.usersCollection.add(user);
    },
    render: function () {
        return this.usersCollection.toJSON();
    }
});

// Files

var FileModel = Backbone.Model.extend({
    defaults: {
        'name': 'file.txt',
        'author': 'New Author',
        'timestamp': 'New Date',
        'location': {
            'offsetX': 0,
            'offsetY': 0
        }
    }
});

var FilesCollection = Backbone.Collection.extend({
    model: FileModel,
    initialize: function () {
        this.on('add', function (file) {
            appController.trigger('newFileAdded', file);
        });
    }
});

var FilesController = Backbone.View.extend({
    initialize: function () {
        var t = this;
        var filesCollection = this.filesCollection = new FilesCollection();
        filesCollection.on('add', function (file) {            
            t.writeToDisk(file);
            appController.trigger('notify', 'newFile', file.toJSON() );
        });
    },
    add: function (file) {
        var data = file.data;
        this.filesCollection.add(file);
    },
    render: function () {
        return this.filesCollection.toJSON();
    },
    writeToDisk: function (file) {
        var t = this;
        var data = this.convertFileToBinary(file.get('data'));
        fs.writeFile('./public/files/'+file.get('name'), data, function (error) {
            if (error) {
                console.log(error);
            } else {
                console.log('File was saved: ./public/files/'+file.get('name') + ' -- Clearing from Memory');
                file.unset('data');
            }
        });
    },
    convertFileToBinary: function (data) {
        var index = 'base64,';
        var trim = data.indexOf(index) + index.length;
        var base64 = data.substring(trim);
        return binary = new Buffer(base64, 'base64');
    }

});

// App

var AppController = Backbone.Model.extend({
  initialize: function () {
    //var filesCollection = new FilesCollection();
    var filesController = new FilesController();
    var usersController = new UsersController();
    this.on('notify', function (message, data) {
        socket_io.sockets.emit( '_'+message, data );
    });
    this.on('_fileAdded', function (file) {
      filesController.add(file);
    });
    this.on('_userSessionStarted', function (socket) {
        usersController.add({id:socket.id}); // when to trigger and when to call directly?
        socket.emit( '_getAllUsers', usersController.render() );
        socket.emit( '_getAllFiles', filesController.render() );
    });
    this.on('_userSessionEnded', function (socket) {
        usersController.trigger('userSessionEnded', socket);
    });
  }
});

var appController = new AppController();


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