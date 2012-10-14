// Users

exports.init = function(d) {

  var _ = d._
    , Backbone = d.Backbone;

  var UserModel = Backbone.Model.extend({
    defaults: {
      'name': 'New User',
      'image': {
        'data': '/images/default-user-image.gif'
      },
      'lastMessage': -1
    },
    initialize: function () {
      if (this.get('name') === this.defaults.name) {
        this.set('name', 'anon_' + this.id);
      }
    }
  });

  var UsersCollection = Backbone.Collection.extend({
    model: UserModel
  });

  return UsersController = Backbone.Controller.extend({
      initialize: function () {
          var t = this;
          var usersCollection = this.usersCollection = new UsersCollection();

          usersCollection.on('add', function (user) {
              t.trigger('_userAdded', user.toJSON() );
          });
          usersCollection.on('remove', function (user) {
            t.trigger('_userRemoved', user.toJSON() );
          });
          usersCollection.on('change', function (user) {
            t.trigger('_userUpdated', user.toJSON() );
          });

      },
      render: function () {
          return this.usersCollection.toJSON();
      },
      update: function (user) {
          var userModel = this.usersCollection.where({id:user.id})[0];
          userModel.update(user);
      },
      add: function (user) {
          this.usersCollection.add(user);
      },
      remove: function (user) {
          var userModel = this.usersCollection.where({id:user.id})[0];
          this.usersCollection.remove(userModel);
      }
  });

};