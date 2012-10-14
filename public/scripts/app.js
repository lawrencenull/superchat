var AppController = Backbone.Controller.extend({
    initialize: function () {
        var t = this;
        var filesController = this.filesController = new FilesController();
        var usersController = this.usersController = new UsersController();
        var chatController = this.chatController = new ChatController();
        var mediaController = this.mediaController = new MediaController();

        filesController.on('_fileAdded', function (file) {
            file.user = socket.socket.sessionid;
            console.log(file);
            socket.emit('fileAdded', file);
        });

        this.on('newFile', function (file) {
            filesController.add(file);
        });
        this.on('newUser', function (user) {
            if (user.id === socket.socket.sessionid) {
                user.self = true;
            }
            usersController.add(user);
        });
        this.on('userRemoved', function (user) {
            usersController.remove(user);
        });
        this.on('userUpdated', function (user) {
            if (user.id === socket.socket.sessionid) {
                user.self = true;
            }
            usersController.update(user);
        });

        mediaController.on('_mediaCaptured', function (media) {
            var user = usersController.get(socket.socket.sessionid);
            user.image = media;
            if (user.self) { delete user.self; }
            socket.emit('userUpdated', user);
        });

        usersController.on('_requireMediaUpload', function () { 
            mediaController.capture();
        });

        usersController.on('_userUpdated', function (user) {
            if (user.self) { delete user.self; }
            socket.emit('userUpdated', user);
        });

        chatController.on('_chatMessageAdded', function (message) {
            if (!message.user) {// || (message.user && message.user.id !== socket.socket.sessionid) ) {
                message.user = usersController.get(socket.socket.sessionid);
                delete message.user.self;
                socket.emit('chatMessageAdded', message);
            } else {
                t.growl(message.user, message.message);
            }
        });

        this.on('chatMessageUpdated', function (message) {
            if (message.user && message.user.id === socket.socket.sessionid) {
                message.user.self = true;
            }
            chatController.update(message);
        });

        this.on('newMessage', function (message) {
            // from server
            if (message.user && message.user.id === socket.socket.sessionid) {
                message.user.self = true;
            }
            chatController.add(message);
        });


    },
    growl: function (user, message) {
     if (window.webkitNotifications.checkPermission() === 0) { // 0 is PERMISSION_ALLOWED
        console.log('notifications were permitted');
        var note = window.webkitNotifications.createNotification('', user, message);
        note.ondisplay = function() { var hide = setTimeout(function () { console.log(note); note.close(); }, 2500) };
        note.show();
      } else {
        window.webkitNotifications.requestPermission();
      }
    }
});

appController = new AppController();

var socket = io.connect('http://'+document.domain+':8080');

socket.on('_newFile', function (file) {
    appController.trigger('newFile', file);
});

socket.on( '_getAllFiles', function (files) {
    _.each(files, function (file) {
        appController.trigger('newFile', file);
    });
});

socket.on( '_currentUserModified', function (user) {
    user.self = 'true';
    appController.trigger('newUser', user);
});

socket.on( '_userAdded', function (user) {
    appController.trigger('newUser', user);
});

socket.on( '_getAllUsers', function (users) {
    _.each(users, function (user) {
        appController.trigger('newUser', user);
    });
});

socket.on( '_getAllMessages', function (messages) {

    _.each(messages, function (message) {
        appController.trigger('newMessage', message);
    });
});

socket.on( '_userRemoved', function (user) {
    appController.trigger('userRemoved', user);
});

socket.on( '_error', function (error) {
    alert(error);
});

socket.on('_chatMessageAdded', function (message) {
    appController.trigger('newMessage', message);
});

socket.on('_reload', function () {
    window.location = window.location;
});

socket.on('_userUpdated', function (data) {
    appController.trigger('userUpdated', data);
});

socket.on('_chatMessageUpdated', function (data) {
    appController.trigger('chatMessageUpdated', data);
});

socket.on( '_modelUpdate', function (data) {
    console.log('NEW LINE COORDINATE');
    lineController.add(data);
});