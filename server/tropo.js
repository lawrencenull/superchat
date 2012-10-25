exports.init = function (req, res) {

    var tropo = new TropoWebAPI(),
        phoneNumber = req.body.session.from.id,
        say = new Say('Press one for English. Or two for Spanish.'),
        choices = new Choices('1,2');

    tropo.ask(choices, null, null, null, "locale", null, null, say, 60, null);

    // route
    tropo.on('continue', null, '/listen?id='+phoneNumber, true);
    tropo.on('hangup', null, '/hangup?id='+phoneNumber, true);
     
    res.send(TropoJSON(tropo));

};


exports.listen = function (req, res) {
    // user setup & long poll for messages

    var tropo = new TropoWebAPI(),
        phoneNumber = req.query.id,
        localeDigit,
        recognizer = 'en-us',
        say = new Say(''),
        choices = new Choices(null, null, '#'),
        locale = 'en';

    // user setup
    if (req.body.result && req.body.result.actions) {
        localeDigit = req.body.result.actions.value;
    }
    if (localeDigit) {
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

    // wait for user input for 5 seconds before polling for new messages
    tropo.ask(choices, null, null, null, 'poll', null, null, say, 5, null);

    // route
    tropo.on('continue', null, '/record?id='+phoneNumber, true);
    tropo.on('incomplete', null, '/messages?id='+phoneNumber, true);
    tropo.on('hangup', null, '/hangup?id='+phoneNumber, true);

    res.send(TropoJSON(tropo));
 
};


exports.record = function (req, res) {
    // record a new message

    var tropo = new TropoWebAPI(),
        phoneNumber = req.query.id,
        userModel = appController.usersController.usersCollection.get(phoneNumber),
        user = userModel.toJSON(),
        fileID = phoneNumber+"-"+new Date().getUTCMilliseconds(),
        say = new Say('Press pound after recording your message.'),
        transcription = {"id":phoneNumber, "url":"http://54.243.182.246:3000/transcribe?fileID="+fileID+"&locale="+user.locale},
        choices = new Choices(null,null,'#');
    
    tropo.record(null, null, true, choices, 'audio/mp3', 5, 30, null, null, "recording", user.recognizer, say, 5, transcription, "http://54.243.182.246:3000/upload?fileID="+fileID+"&id="+phoneNumber, null, null);

    // route
    tropo.on('continue', null, '/messages?id='+phoneNumber, true);
    tropo.on('hangup', null, '/hangup?id='+phoneNumber, true);

    res.send(TropoJSON(tropo));
};


exports.upload = function (req, res) {
    // message is uploaded and sent to chat

    var phoneNumber = req.query.id,
        fileName = req.query.fileID,
        userModel = appController.usersController.usersCollection.get(phoneNumber),
        user = userModel.toJSON();

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

};


exports.messages = function (req, res) {
    // read new messages from chat

    var tropo = new TropoWebAPI(),
        tropo_voices = {
            'es': ['Carmen', 'Leonor', 'Jorge', 'Juan'],
            'en': ['Allison', 'Susan', 'Vanessa', 'Veronica', 'Dave', 'Steven', 'Victor']
        },
        phoneNumber = req.query.id,
        userModel = appController.usersController.usersCollection.get(phoneNumber),
        user = userModel.toJSON(),
        messagesCollection = appController.chatController.messagesCollection,
        messagesSinceLastMessage = messagesCollection.filter(function (message, index) {
            return (index > user.lastMessage) && (message.get('user').id !== phoneNumber);
        });

    _.each(messagesSinceLastMessage, function (messageModel) {
        var message = messageModel.toJSON(),
            says = message.translations[user.locale];

        if (message.file) {
            says = 'http://54.243.182.246:3000' + message.file;
        }

        tropo.say(says, null, null, null, tropo_voices[user.locale][3]);
    });

    // set user's most recently read message
    userModel.set('lastMessage', messagesCollection.length-1);

    // route
    tropo.on('continue', null, '/listen?id='+phoneNumber, null);
    tropo.on('hangup', null, '/hangup?id='+phoneNumber, true);

    res.send(TropoJSON(tropo));

};


exports.hangup = function (req, res) {
    // remove user on hangup

    var tropo = new TropoWebAPI(),
        phoneNumber = req.query.id;

    appController.usersController.remove({id:phoneNumber});

    res.send(TropoJSON(tropo));
};


exports.transcribe = function (req, res) {
    // update chat message with automatic transcription

    var tropo = new TropoWebAPI(),
        phoneNumber = req.body.result.identifier,
        locale = req.query.locale,
        fileID = req.query.fileID,
        messageModel = appController.chatController.messagesCollection.where({ file: fileID });

    if (messageModel.length > 0) {
        var message = messageModel[0].toJSON();
        message.message = req.body.result.transcription;
        message.transcribed = true;
        appController.chatController.update(message); 
    } else {
        console.log('TRANSCRIPTION FAILURE');
    }

    // route
    tropo.on('continue', null, '/listen?id='+phoneNumber, true);
    
    res.send(TropoJSON(tropo));
};