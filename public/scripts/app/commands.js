var CommandsController = Backbone.Controller.extend({
    initialize: function () {
    },
    lang: function (parameters) {
        this.trigger('_execute', 'users', 'updateLocale', parameters);
    },
    '?': function () {
        this.trigger('_execute', 'chat', 'renderHelp');
    },
    'help': function () {
        this.trigger('_execute', 'chat', 'renderHelp');
    },
    'name': function (parameters) {
        this.trigger('_execute', 'users', 'updateName', parameters);
    }
});