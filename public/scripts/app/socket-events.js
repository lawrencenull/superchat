var socket = io.connect('http://'+document.domain+':8080');

socket.on('_newFile', function (file) {
    appController.trigger('newFile', file);
});

socket.on( '_getAllFiles', function (files) {
    _.each(files, function (file) {
        appController.trigger('newFile', file);
    });
});

socket.on( '_getAllMessages', function (messages) {
    _.each(messages, function (message) {
        appController.trigger('newMessage', message);
    });
});

socket.on( '_getAllUsers', function (users) {
    _.each(users, function (user) {
        appController.trigger('newUser', user);
    });
});

socket.on( '_getAllLanguages', function (languages) {
    appController.languages = languages;
});

socket.on( '_currentUserModified', function (user) {
    user.self = 'true';
    appController.trigger('newUser', user);
});

socket.on( '_userAdded', function (user) {
    appController.trigger('newUser', user);
});

socket.on('_userUpdated', function (data) {
    appController.trigger('userUpdated', data);
});

socket.on( '_userRemoved', function (user) {
    appController.trigger('userRemoved', user);
});

socket.on('_chatMessageAdded', function (message) {
    appController.trigger('newMessage', message);
});

socket.on('_chatMessageUpdated', function (data) {
    appController.trigger('chatMessageUpdated', data);
});

socket.on('_reload', function () {
    window.location = window.location;
});

socket.on( '_error', function (error) {
    alert(error);
});