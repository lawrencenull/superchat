
    // extending backbone

    // controller based on backbone view
    // for communication between models and views
    Backbone.Controller = Backbone.View;

    Backbone.Collection.prototype.update = function (model, params) {
        this.where({id:model.id})[0].edit(model, params);
    };

    Backbone.Model.prototype.update = function(model, params){  
        var t = this;
        // update or add all new values
        _.each(model, function (value, attribute) {
            t.set(attribute, value);
        });
        if (!params || (params && !params.soft) ) {
            // if new value is missing, delete old value
            _.each(t.attributes, function (value, attribute) {
                if (!model[attribute]) {
                    t.unset(attribute);
                }
            }); 
        }
        t.trigger('update', model);      
    };