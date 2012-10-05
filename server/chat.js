// Chat

exports.init = function(d) {

	var _ = d._
	  , Backbone = d.Backbone;

    var MessageModel = Backbone.Model.extend({
    	defaults: {

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
    			t.messagesCollection.add(message);
    		});

    		messagesCollection.on('add', function (message) {
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
            if (params && params.type === 'user') {
                var messageModels = this.messagesCollection.each(function (model) {
                    if (model.toJSON().user.id === data.id) {
                        model.set('user', data);
                    }
                });
            }
        }
    });

};