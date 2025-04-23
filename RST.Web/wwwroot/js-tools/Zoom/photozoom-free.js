(function ($) {
    var methods = {
        init: function (options) {
            var defaultVal = {
                Action: 'hover',
                Position: 'right',
                Distance: 5,
                ZoomLevel: 1,
                ZoomContainerRatio: { width: 0, height: 0 }
            };

            var obj = $.extend(defaultVal, options);
            return this.each(function () {

                var selObject = $(this);

                var data = selObject.data('photozoom');
                if (!data) {
                    selObject.data('photozoom', { options: obj });
                }
                var zoomimgcontainer = $(".rst-photozoomimgcontainer");
                selObject.css("cursor", "crosshair");
                var close = function () { zoomimgcontainer.remove(); };
                var draw = function (options) {
                    zoomimgcontainer = $(".rst-photozoomimgcontainer");
                    if (zoomimgcontainer.length == 0) {
                        zoomimgcontainer = $("<div class='rst-photozoomimgcontainer' style='overflow: hidden; display: none; position: absolute; z-index:11000;'></div>");
                        zoomimgcontainer.width((selObject.outerWidth() + (selObject.outerWidth() * options.ZoomContainerRatio.width)));
                        zoomimgcontainer.height((selObject.outerHeight() + (selObject.outerHeight() * options.ZoomContainerRatio.height)));
                        $("body").append(zoomimgcontainer);
                    }

                    var largeimg = zoomimgcontainer.children("img");
                    if (largeimg.length == 0) {
                        largeimg = $("<img src='' style='width:auto; height:auto; position: relative; max-width:none; max-height:none;' alt='' />");
                        largeimg.bind("load", function () {
                            largeimg.width(largeimg.width() * options.ZoomLevel);
                        });
                        largeimg.appendTo(zoomimgcontainer);
                    }

                    if (options.Position == "over") {
                    }
                    else {
                        zoomimgcontainer.fadeIn();
                    }

                    largeimg.attr("src", selObject.attr("src"));
                    var offset = selObject.offset();

                    if (options.Position == "right") {
                        zoomimgcontainer.css("top", offset.top - parseInt(zoomimgcontainer.css("border-top-width"), 10));
                        zoomimgcontainer.css("left", offset.left + selObject.outerWidth(true) + options.Distance);
                    }
                };

                var move = function (x, y, source, options) {
                    zoomimgcontainer = $(".rst-photozoomimgcontainer");
                    if (zoomimgcontainer.length == 0) {
                        draw(options);
                        zoomimgcontainer = $(".rst-photozoomimgcontainer");
                    }
                    var largeimg = zoomimgcontainer.children("img");
                    t = ((((largeimg.height() / source.height()) * (y - source.offset().top)) - (zoomimgcontainer.height() / 2)) * (-1));
                    l = ((((largeimg.width() / source.width()) * (x - source.offset().left)) - (zoomimgcontainer.width() / 2)) * (-1));

                    if (t > 0) { t = 0; }
                    if (t < ((largeimg.height() - zoomimgcontainer.height()) * (-1))) { t = (largeimg.height() - zoomimgcontainer.height()) * (-1); }
                    if (l > 0) { l = 0; }
                    if (l < ((largeimg.width() - zoomimgcontainer.width()) * (-1))) { l = (largeimg.width() - zoomimgcontainer.width()) * (-1); }

                    if (zoomimgcontainer.height() < largeimg.height() && zoomimgcontainer.width() < largeimg.width()) {
                        largeimg.stop(false, true).animate({ top: t, left: l });
                    } else if (zoomimgcontainer.height() < largeimg.height() && zoomimgcontainer.width() >= largeimg.width()) {
                        largeimg.stop(false, true).animate({ top: t, left: 0 });
                    }
                    else if (zoomimgcontainer.height() >= largeimg.height() && zoomimgcontainer.width() < largeimg.width()) {
                        largeimg.stop(false, true).animate({ top: 0, left: l });
                    }
                    else {
                        largeimg.stop(false, true).animate({ top: 0, left: 0 });
                    }
                    zoomimgcontainer.fadeIn();
                };

                try {
                    selObject.swipe({
                        Distance: 5,
                        TrackMouse: selObject.data('photozoom').options.Action,
                        OnTouch: function (d) {
                            move(d.page.x, d.page.y, selObject, selObject.data('photozoom').options);
                        },
                        OnMove: function (d) {
                            move(d.page.x, d.page.y, selObject, selObject.data('photozoom').options);
                        },
                        OnEnd: function () {
                            if (selObject.data('photozoom').options.Position != "over") {
                                close();
                            }
                        }
                    });
                }
                catch (err) { console && console.log(err); }
            });
        }
    };
    $.fn.photozoom = function (method) {
        if (window.screen.availHeight > 500 && window.screen.availWidth > 500) {
            if (methods[method]) {
                return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method === 'object' || !method) {
                return methods.init.apply(this, arguments);
            } else {
                $.error('Method ' + method + ' does not exist on jQuery.photozoom');
            }
        }
    };
})(jQuery);
