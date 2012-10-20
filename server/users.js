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
        'path': 'default-user-image.gif'
      },
      'lastMessage': -1
    },
    initialize: function () {
      var t = this;
      if (t.get('name') === t.defaults.name) {
        t.set('name', 'anon_' + this.id);
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
          usersCollection.on('change:image', function (user) {
            t.uploadImage(user);
          });
      },
          convertFileToBinary: function (data) {
        var index = 'base64,';
        var trim = data.indexOf(index) + index.length;
        var base64 = data.substring(trim);
        return binary = new Buffer(base64, 'base64');
    },
    uploadImage: function (model) {
      console.log('>>>>>>>>>>>>>>>>>>>UPLOAD', model );
      var t = this;
      var data = model.get('image').data;
      if (data) {
        console.log('PASSED');
        console.log(data);
        data = t.convertFileToBinary(data);
        var file = t.convertFileToBinary(model.get('image').data),
        filename = model.get('id')+'.jpg',
          path = './public/files/users/images/'+filename;


        fs.writeFile(path, data, function (error) {
          if (error) {
              t.trigger('writeToDisk', { success: false, error: error, file: file } );
          } else {
              t.trigger('writeToDisk', { success: true, file: file });
              model.set('image', {path:filename});
          }
        });
      }
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