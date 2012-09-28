
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

Backbone.View.prototype._ensureElement = function () {};

var UserModel = Backbone.Model.extend({
  defaults: {
    'name': 'New User'
  },
  initialize: function () {
    if (this.get('name') === this.defaults.name) {
      this.set('name', 'anon_' + this.id);
    }
    this.on('add', function (user) {
      appController.trigger('newUserAdded', user);
    });
  }
});

var UsersCollection = Backbone.Collection.extend({
  model: UserModel
});

// identical model on client

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
        this.filesCollection = new FilesCollection();
        this.filesCollection.on('add', function (file) {
            var data = file.get('data');
            var name = file.get('name');
            file.unset('data');
            t.writeToDisk({name:name, data:data});
        });
    },
    add: function (file) {
        var data = file.data;
        this.filesCollection.add(file);
    },
    getAllFiles: function () {
        return this.filesCollection.toJSON();
    },
    writeToDisk: function (file) {
        var data = this.convertFileToBinary(file.data);
        fs.writeFile('./public/files/'+file.name, data, function (error) {
            if (error) {
                console.log(error);
            } else {
                console.log('File was saved: ./public/files/'+file.name);
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
/*
fs.writeFile("./files/test.txt", "Hey there!", function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
});*/

var AppController = Backbone.Model.extend({
  initialize: function () {
    //var filesCollection = new FilesCollection();
    var filesController = new FilesController();
    var usersCollection = new UsersCollection();
    this.on('newUser', function (user) {
      usersCollection.add({id: user.id });
      // user.emit( '_getAllFiles', filesCollection.toJSON() );
      user.emit( '_getAllFiles', filesController.getAllFiles() );
      user.emit( '_getAllUsers', usersCollection.toJSON() );
    });
    this.on('newFileFromClient', function (file) {
      filesController.add(file);
    });
    this.on('newFileAdded', function (file) {
      socket_io.sockets.emit( '_newFile', file.toJSON() );
    });
    this.on('newUserAdded', function (user) {
      var socketid = user.id;
      socket_io.sockets.socket(socketid).emit( '_modifyCurrentUser', user);
      socket_io.sockets.except(socketid).emit( '_newUser', user);
    });
  }
});

var appController = new AppController();


/**
  Socket.io setup
  */

socket_io.sockets.on('connection', function (socket) {
  appController.trigger('newUser', socket);
  socket.on('newFile', function (data) {
    appController.trigger('newFileFromClient', data);
  });
});