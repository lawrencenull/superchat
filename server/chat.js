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
    		
    		this.on('messageAdded', function (message) {

                message.translations = t.translateMessage(message);
                t.messagesCollection.add(message);

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
                var messageModel = t.messagesCollection.get(data.id);
                data.translations = t.translateMessage(messageModel);
                messageModel.update(data);
            }
        },
        translateMessage: function (message) {
            message.translations = {
                'en': '',
                'es': ''
            };

            message.translations[message.user.locale] = message.message;

            var newLocale;

            if (message.user.locale === 'en') {
                newLocale = 'es';
            } else if (message.user.locale === 'es') {
                newLocale = 'en';
            }

            translate({key: 'AIzaSyATZ3oimk5pfHC1Oe94UAZABoLRb7bQoDU', q: message.message, source: message.user.locale, target: newLocale}, function(result) {
                message.translations[newLocale] = result[message.message];
                return message.translations;
            });
        }
    });

};