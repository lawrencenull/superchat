var ChatModel = Backbone.Model.extend();

var ChatCollection = Backbone.Collection.extend({
    model: ChatModel
});

var ChatMessagesListView = Backbone.View.extend({
    el: '#chat',
    initialize: function () {
        this.$el.$input = this.$el.find('input');
        this.$el.$messagesList = $('#chat-messages-list');
        this.$el.$requestPermission = $('#request-chat-notifications-permission');
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
        'click #request-chat-notifications-permission': function (e) {
            e.preventDefault();
            this.trigger('_requestNotificationsPermission');
        }
    },
    template: $('#template-chat-message').html(),
    render: function (message) {
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
    hidePermissionLink: function () {
        this.$el.$requestPermission.addClass('hide');
    },
    showPermissionLink: function () {
        this.$el.$requestPermission.removeClass('hide');
    }

});

var ChatController = Backbone.Controller.extend({
    initialize: function () {
        var t = this;
        var chatCollection = this.chatCollection = new ChatCollection();
        var chatMessagesListView = this.chatMessagesListView = new ChatMessagesListView();
        chatMessagesListView.on('_chatMessageAdded', function (message) {
            t.trigger('_chatMessageAdded', {message:message});
        });
        chatCollection.on('add', function (message) {
            t.chatMessagesListView.add( message.toJSON() );
        });
        chatCollection.on('change', function (message) {
            t.chatMessagesListView.update( message.toJSON() );
        });
        chatMessagesListView.on('_requestNotificationsPermission', function () {
            t.requestNotificationsPermission();
        });
        this.checkNotificationPermissionStatus();
    },
    requestNotificationsPermission: function () {
        var t = this;
        window.webkitNotifications.requestPermission(function () { t.chatMessagesListView.hidePermissionLink(); });
    },
    checkNotificationPermissionStatus: function () {
        var t = this;
        if (window.webkitNotifications) {
            if (window.webkitNotifications.checkPermission() !== 0) {
                t.chatMessagesListView.showPermissionLink();
            }
        }
    },
    add: function (message) {
        this.chatCollection.add(message);
    },
    update: function (message) {
        var model = this.chatCollection.where({id:message.id})[0];
        if (model) {
            model.update(message);
        }
    }
});