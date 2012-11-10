// Chat

exports.init = function(d) {

	var _ = d._
	  , Backbone = d.Backbone
      , translate = d.translate;

    var MessageModel = Backbone.Model.extend({
    	defaults: {
            translations: {
                'en': '(Translating...)',
                'es': '(Translating...)'
            }
    	},
    	initialize: function () {
            this.set('id', this.cid);
    	}
    });

    var MessagesCollection = Backbone.Collection.extend({
    	model: MessageModel
    });

    ChatController = Backbone.Controller.extend({

    	initialize: function () {
    		var t = this;
    		var messagesCollection = this.messagesCollection = new MessagesCollection();
    		
    		t.on('messageAdded', function (message) {

                t.add(message);

    		});

    		messagesCollection.on('add', function (message) {
                console.log(message.toJSON());
    			t.trigger('_chatMessageAdded', message.toJSON() );
    		});

            messagesCollection.on('change', function (message) {
                t.trigger('_chatMessageUpdated', message.toJSON() );
            });

    	},
        render: function () {
            return this.messagesCollection.toJSON();
        },
        add: function (message) {
            var t = this;
            if (message.message) {
                message.translations = {};
                message.translations[message.user.locale] = message.message;

                var newLocale;

                if (message.user.locale === 'en') {
                    newLocale = 'es';
                } else if (message.user.locale === 'es') {
                    newLocale = 'en';
                }

                translate({key: 'AIzaSyATZ3oimk5pfHC1Oe94UAZABoLRb7bQoDU', q: message.message, source: message.user.locale, target: newLocale}, function(result) {
                    message.translations[newLocale] = result[message.message];
                    t.messagesCollection.add(message);
                });
            } else {
                t.messagesCollection.add(message);
            }
        },
        update: function (data, params) {
            var t = this;
            if (params && params.type === 'user') {
                var messageModels = this.messagesCollection.each(function (model) {
                    if (model.toJSON().user.id === data.id) {
                        model.set('user', data);
                    }
                });
            } else if (data.id) {
                console.log('UPDATE CHAT CONTROLLER', data);

                data.translations = {};
                data.translations[data.user.locale] = data.message;

                var newLocale;

                if (data.user.locale === 'en') {
                    newLocale = 'es';
                } else if (data.user.locale === 'es') {
                    newLocale = 'en';
                }

                translate({key: 'AIzaSyATZ3oimk5pfHC1Oe94UAZABoLRb7bQoDU', q: data.message, source: data.user.locale, target: newLocale}, function(result) {
                    var messageModel = t.messagesCollection.get(data.id);
                    data.translations[newLocale] = result[data.message];
                    messageModel.update(data);
                });
            }
        }
    });

};