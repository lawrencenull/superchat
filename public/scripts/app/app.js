var AppController = Backbone.Controller.extend({
    initialize: function () {
        var t = this,
            filesController = t.filesController = new FilesController(),
            usersController = t.usersController = new UsersController(),
            chatController = t.chatController = new ChatController(),
            mediaController = t.mediaController = new MediaController();

        // manage files

        filesController.on('_fileAdded', function (file) {
            file.user = socket.socket.sessionid;
            socket.emit('fileAdded', file);
        });

        this.on('newFile', function (file) {
            filesController.add(file);
            console.log('a file', file);
        });

        // manage users

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

        usersController.on('_userUpdated', function (user) {
            if (user.self) { delete user.self; }
            socket.emit('userUpdated', user);
        });

        usersController.on('_localeUpdate', function (user) {
            if (user.self) {
                chatController.renderAll();
            }
        });

        // manage media

        mediaController.on('_mediaCaptured', function (media) {
            var user = usersController.get(socket.socket.sessionid);
            console.log(media);
            user.image = media;
            if (user.self) { delete user.self; }
            socket.emit('userUpdated', user);
        });

        usersController.on('_requireMediaUpload', function () { 
            mediaController.capture();
        });

        // manage chat messages

        chatController.on('_messageUpdated', function (message) {
            socket.emit('chatMessageUpdated', message);
        });

        chatController.on('_chatMessageAdded', function (message) {
            // messages that come through without a user are assumed to be self
            // fix this later
            if (!message.user) {
                message.user = usersController.get(socket.socket.sessionid);
                delete message.user.self; // bad practice
                socket.emit('chatMessageAdded', message);
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
            console.log('a Message:', message);
            chatController.add(message);
        });
    }
});

appController = new AppController();