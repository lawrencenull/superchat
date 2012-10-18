// Users

exports.init = function(d) {

  var _ = d._
    , Backbone = d.Backbone,
    fs = d.fs;

  var UserModel = Backbone.Model.extend({
    defaults: {
      'name': 'New User',
      'locale': 'en',
      'image': {
        'data': '/images/default-user-image.gif'
      },
      'lastMessage': -1
    },
    initialize: function () {
      if (this.get('name') === this.defaults.name) {
        this.set('name', 'anon_' + this.id);
      }
      this.on('add') = uploadImage;
      this.on('update:image') = uploadImage;
    },
    uploadImage: function (model) {
      var file = this.convertFileToBinary(model.get('image').data),
          path = './public/files/users/'+model.get('id');
      fs.writeFile(path, data, function (error) {
        if (error) {
            t.trigger('writeToDisk', { success: false, error: error, file: file } );
        } else {
            t.trigger('writeToDisk', { success: true, file: file });
            t.set('image', {path: path});
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