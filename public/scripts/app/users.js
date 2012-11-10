var UserModel = Backbone.Model.extend({
    defaults: {
        'name': 'Anonymous'
    },
        initialize: function () {
    }
});

var UsersCollection = Backbone.Collection.extend({
    model: UserModel
});

var UsersListView = Backbone.View.extend({
    el: '#users-list',
    events: {
        'click .self img': function (e) {
            this.trigger('_requireMediaUpload');
        },
        'click .self .name': function (e) {
            var user = {
                id: $(e.target).closest('.user').attr('data-id'),
                name: prompt("What's your name?")
            };
            this.trigger('_update', user);
        },
        'change .self .locale': function (e) {
            var user = {
                id: $(e.target).closest('.user').attr('data-id'),
                locale: $(e.target).val()
            };
            this.trigger('_update', user);
        }
    },
    template: (function () { return $('#template-user').html() }()),
    render: function (user) {
        var t = this;
        if (this.locale) {
            user[this.locale] = true;
        } else {
            user[this.$el.find('#user-'+user.id).find('.locale').val()] = true;
        }

        user.languages = appController.languages;

        _.chain(user.languages)
            .where({ "abbreviation": user.locale })
            .first()
            .value()
            .selected = true;

        return Mustache.render(this.template, user);
    },
    add: function (user) {
        var html = this.render(user);
        this.$el.append(html);
    },
    remove: function (user) {
        var $el = this.$el.find('#user-'+user.id);
        $el.remove();
    },
    update: function (user) {
        var $el = this.$el.find('#user-'+user.id);
        var html = this.render(user);
        $el.replaceWith( html );
    }
});

var UsersController = Backbone.Controller.extend({
    initialize: function () {
        var t = this;
        var usersCollection = this.usersCollection = new UsersCollection();
        var usersListView = this.usersListView = new UsersListView();

        usersListView.on('_requireMediaUpload', function () {
            t.trigger('_requireMediaUpload');
        });

        usersListView.on('_update', function (user) {
            t.edit(user);
        });

        usersCollection.on('add', function (user) {
            usersListView.add(user.toJSON());
        });

        usersCollection.on('remove', function (user) {
            usersListView.remove(user.toJSON());
        });

        usersCollection.on('change', function (user) {
            usersListView.update(user.toJSON());
        });

        usersCollection.on('change:locale', function (user) {
            if (user.get('self')) {
                t.trigger('_localeUpdate', user.toJSON());
            }
        });

    },
    add: function (user) {
        this.usersCollection.add(user);
    },
    remove: function (user) {
        this.usersCollection.remove(user);
    },
    update: function (user) {
        var userModel = this.usersCollection.where({id:user.id})[0];
        if (userModel) {
            userModel.update(user);
        }
    },
    get: function (id) {
        var model = this.usersCollection.get(id);
        if (model) {
            return model.toJSON();
        } else {
            return { name: '[No Name]' };
        }
    },
    edit: function (user) {
        var t = this;
        var userModel = t.usersCollection.where({id:user.id})[0].toJSON();
        delete user.id;
        _.each(user, function (value, attribute) {
            userModel[attribute] = value;
        });
        t.trigger('_userUpdated', userModel);
    },
    updateLocale: function (locale) {
        var $el = this.usersListView.$el.find('.self .locale option[value="'+locale+'"]');
        if ($el.length > 0) {
            $el.siblings().removeAttr('selected').end().attr('selected', 'selected').trigger('change');   
        } else {
            return {
                message: locale + ' is not a supported language.',
                error: true
            }
        }
    } // need name updateName
});