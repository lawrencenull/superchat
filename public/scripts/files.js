var FileModel = Backbone.Model.extend({
    defaults: {
        'name': 'no-file.txt',
        'data': 'data:',
        'timestamp': 'New Date',
        'location': {
            'offsetX': 0,
            'offsetY': 0
        }
    }
});

var FilesCollection = Backbone.Collection.extend({
    model: FileModel,
    initialize: function () {
    }
});

var FilesListView = Backbone.View.extend({
    el: '#files-list',
    //template: (function () { return Handlebars.compile( $('#template-file').html() ) }()),
    template: $('#template-file').html(),
    initialize: function () {
        this.on('add', this.add);
    },
    render: function (file) {
        return Mustache.render(this.template, file);
    },
    add: function (file) {
        var html = this.render(file);
        this.$el.append(html);
    }
});

var FileDropView = Backbone.View.extend({
    el: 'body',
    events: {
        'dragover': function () {
            this.$el.addClass('dragover');
        },
        'dragleave': function () {
            this.$el.removeClass('dragover');
        },
        'drop': function (e) {
            e.preventDefault();
            this.$el.removeClass('dragover');
            this.trigger('_fileAdded', e.originalEvent.dataTransfer.files[0]);
        }
    }
});

var FilesController = Backbone.Controller.extend({
    initialize: function () {
        var t = this;
        var filesCollection = this.filesCollection = new FilesCollection();
        var filesListView = this.filesListView = new FilesListView();
        var fileDropView = this.fileDropView = new FileDropView();

        this.on('add', function (file) {
            filesCollection.add(file);
        });


        filesCollection.on('add', function (file) {
            filesListView.trigger('add', file.toJSON() );
        });


        fileDropView.on('_fileAdded', function (file) {
            var reader = new FileReader();
            reader.onload = function () {
                t.trigger('_fileAdded', { name: file.name, timestamp: new Date().getTime(), data: this.result });
            };
            reader.readAsDataURL(file);
        });
    },
    add: function (file) {
        this.filesCollection.add(file);
    }
});