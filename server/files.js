// Files

exports.init = function(d) {

  var _ = d._
    , Backbone = d.Backbone
    , fs = d.fs;

    var FileModel = Backbone.Model.extend({
        defaults: {
            'name': 'no-file.txt',
            'user': 0,
            'isOnDisk': false,
            'timestamp': 'New Date',
            'location': {
                'offsetX': 0,
                'offsetY': 0
            }
        },
        initialize: function () {
            this.set('id',this.cid);
          this.on('change:isOnDisk', function (isOnDisk) {
              if (isOnDisk) {
                this.unset('data');
                console.log( 'File data removed from memory: ' + this.get('name') );
              }
          });
        }
    });

    var FilesCollection = Backbone.Collection.extend({
        model: FileModel
    });

    return FilesController = Backbone.Controller.extend({
        initialize: function () {
            var t = this;
            var filesCollection = this.filesCollection = new FilesCollection();
            this.on('fileAdded', function (file) {
                filesCollection.add(file); // store in memory
            });
            filesCollection.on('add', function (file) {
                t.writeToDisk(file);
            });
            this.on('writeToDisk', function (data) {
                if (data.success) {
                    console.log('File was written to disk: ' + data.file.get('name'));
                    data.file.set('isOnDisk', true);
                    this.trigger( '_newFile', data.file );
                } else {
                    console.log('Error writing file to disk: ' + data.file.get('name'));
                    this.trigger( '_error', { user: data.file.get('user'), error: t.messages.uploadError(data.file) });
                }
            });
        },
        messages: {
          uploadError: function (file) {
            return 'Oh no! Our computer choked on your file: ' + file.get('name') + '. You can try again or let us know about the issue.';
          }
        },
        add: function (file) {
            var data = file.data;
            this.filesCollection.add(file);
        },
        render: function () {
            var render = [];
            var filesOnDisk = this.filesCollection.where({isOnDisk:true});
            _.each(filesOnDisk, function (file) {
                render.push(file.toJSON());
            });
            return render;
        },
        writeToDisk: function (file) {
            var t = this;
            var data = this.convertFileToBinary(file.get('data'));
            fs.writeFile('./public/files/'+file.get('name'), data, function (error) {
                if (error) {
                    t.trigger('writeToDisk', { success: false, error: error, file: file } );
                } else {
                    t.trigger('writeToDisk', { success: true, file: file })
                }
            });
        },
        convertFileToBinary: function (data) {
            var index = 'base64,';
            var trim = data.indexOf(index) + index.length;
            var base64 = data.substring(trim);
            return binary = new Buffer(base64, 'base64');
        }
    });

};