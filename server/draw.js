// Users

exports.init = function(d) {

  var _ = d._
    , Backbone = d.Backbone;

  var LineModel = Backbone.Model.extend();

  var LineCollection = Backbone.Collection.extend({
    model: LineModel
  });

  return DrawController = Backbone.Controller.extend({
      initialize: function () {
          var t = this;
          var lineCollection = this.lineCollection = new LineCollection();

          lineCollection.on('add', function (user) {
              t.trigger('_lineAdded', line.toJSON() );
          });
      },
      render: function () {
          return this.lineCollection.toJSON();
      },
      add: function (line) {
          this.lineCollection.add(line);
      }
  });

};