// Users

exports.init = function(d) {

  var _ = d._
    , Backbone = d.Backbone;

  var UserModel = Backbone.Model.extend({
    defaults: {
      'name': 'New User'
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

  return UsersController = Backbone.View.extend({
      initialize: function () {
          var t = this;
          var usersCollection = this.usersCollection = new UsersCollection();
          usersCollection.on('add', function (user) {
              t.trigger('_userAdded', user);
          });
          usersCollection.on('remove', function (user) {
            t.trigger('_userRemoved', user);
          });
          this.on('userAdded', function (user) {
              usersCollection.add(user);
          });
          this.on('userRemoved', function (user) {
            var userID = user.id;
            var user = usersCollection.where({id:user.id})[0];
            usersCollection.remove(user);
          });
      },
      render: function () {
          return this.usersCollection.toJSON();
      }
  });

};