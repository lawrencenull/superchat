// Chat

exports.init = function(d) {

	var _ = d._
	  , Backbone = d.Backbone;

    var MessageModel = Backbone.Model.extend({
    	defaults: {

    	},
    	initialize: function () {

    	}
    });

    var MessagesCollection = Backbone.Collection.extend({
    	model: MessageModel
    });

    ChatController = Backbone.View.extend({

    	initialize: function () {
    		var t = this;
    		var messagesCollection = this.messagesCollection = new MessagesCollection();
    		
    		this.on('messageAdded', function (message) {
    			t.messagesCollection.add(message);
    		});

    		messagesCollection.on('add', function (message) {
    			t.trigger('_chatMessageAdded', message.toJSON() );
    		});

    	},
        render: function () {
            return this.messagesCollection.toJSON();
        }
    });

};