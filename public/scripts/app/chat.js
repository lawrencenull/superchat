var ChatModel = Backbone.Model.extend();

var ChatCollection = Backbone.Collection.extend({
    model: ChatModel
});

var ChatMessagesListView = Backbone.View.extend({
    el: '#chat',
    initialize: function () {
        var $el = this.$el;
        $el.$input = $el.find('input');
        $el.$messagesList = $('#chat-messages-list');
    },
    events: {
        'submit': function (e) {
            e.preventDefault();
            var val = this.$el.$input.val();
            if (val.length > 0) {
                this.$el.$input.val('');
                this.trigger('_chatMessageAdded', val);
            }
        },
        'click .fix': function (e) {
            var transcription = $(e.target).siblings('.transcription').text(),
                fixed = prompt('Please fix: "' + transcription + '"'), // old school
                message = {
                    id: $(e.target).closest('.message').attr('data-id'),
                    message: fixed
                };
            this.trigger('_update', message);
        }
    },
    template: $('#template-chat-message').html(),
    render: function (message) {
        var self = this.getSelf(); // model

        // determine the language to show based on user preference

        if (self.length > 0) {
            // if self exists (after server adds this session to userCollection)
            self = self[0].toJSON();
            message.translation = message.translations[self.locale];
        } else {
            // show original message (if on initial load)
            message.translation = message.message;
        }        

        return Mustache.render(this.template, message);
    },
    add: function (message) {
        var html = this.render(message);
        this.$el.$messagesList.append(html).scrollTop(99999);
    },
    update: function (message) {
        var html = this.render(message);
        this.$el.$messagesList.find('#message-'+message.id).replaceWith(html);
    },
    getSelf: function () {
        // TODO: find a way to asyncronously retrieve this model without referencing appController directly
        return appController.usersController.usersCollection.where({self:true});
    }
});

var ChatController = Backbone.Controller.extend({
    initialize: function () {
        var t = this,
            chatCollection = t.chatCollection = new ChatCollection(),
            chatMessagesListView = t.chatMessagesListView = new ChatMessagesListView();

        chatMessagesListView.on('_chatMessageAdded', function (message) {
            t.trigger('_chatMessageAdded', {message:message});
        });

        chatCollection.on('add', function (message) {
            t.chatMessagesListView.add( message.toJSON() );
        });

        chatCollection.on('change', function (message) {
            t.chatMessagesListView.update( message.toJSON() );
        });

        chatMessagesListView.on('_update', function (user) {
            t.edit(user);
        });
    },
    add: function (message) {
        this.chatCollection.add(message);
    },
    update: function (message) {
        var model = this.chatCollection.where({id:message.id})[0];
        if (model) {
            model.update(message);
        }
    },
    edit: function (message) {
        var t = this,
            messageModel = t.chatCollection.where({id:message.id})[0].toJSON();
        _.each(message, function (value, attribute) {
            messageModel[attribute] = value;
        });
        t.trigger('_messageUpdated', messageModel);
    },
    renderAll: function () {
        var t = this;
        t.chatCollection.each(function (chat) {
            t.chatMessagesListView.update( chat.toJSON() );
        });
    }
});