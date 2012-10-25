var MediaCaptureView = Backbone.View.extend({
    el: '#webcam',
    elements: {
        feed: $('#webcam-feed').get(0)
    },
    events: {
        'click': function (e) {
            e.preventDefault();
            this.trigger('_mediaCaptured', this.takePhoto() );
        }
    },
    takePhoto: function () {

        // webcam -> canvas -> base64 image

        var canvas = this.elements.feed.getContext('2d'),
            videoWidth = this.$el.get(0).videoWidth,
            videoHeight = this.$el.get(0).videoHeight;

        $(this.elements.feed).width( videoWidth );
        $(this.elements.feed).height( videoWidth );
        this.elements.feed.setAttribute( 'width', videoWidth );
        this.elements.feed.setAttribute( 'height', videoWidth );

        canvas.drawImage( this.$el.get(0), 0, 0 );

        return this.elements.feed.toDataURL();
    },
    requestCapturePermission: function (callback) {
        var t = this;
        navigator.webkitGetUserMedia({video:true}, function (stream) {
            t.startStream(stream);
        });
    },
    startStream: function (stream) {
        this.$el.get(0).src = window.webkitURL.createObjectURL(stream);
        this.show();
    },
    show: function () {
        this.$el.addClass('open');
    },
    hide: function () {
        this.$el.removeClass('open');
    }
});

var MediaController = Backbone.Controller.extend({
    initialize: function () {
        var t = this;
        var mediaCaptureView = this.mediaCaptureView = new MediaCaptureView();

        mediaCaptureView.on('_mediaCaptured', function (media) {   
            t.trigger('_mediaCaptured', { data: media });
            mediaCaptureView.hide();
        });

    },
    capture: function () {
        this.mediaCaptureView.requestCapturePermission();
    }
});