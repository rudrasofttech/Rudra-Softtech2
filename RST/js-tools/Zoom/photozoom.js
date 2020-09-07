(function ($) {
    var methods = {
        init: function (options) {
            var defaultVal = {
                Target: '',
                Title: ''
            };
            var obj = $.extend(defaultVal, options);

            if (obj.Target != "" && $(obj.Target).length > 0) {
                this.each(function () {
                    var tarimg = $(this);

                    tarimg.click(function (e) {
                        $(obj.Target).css("display", "none");
                        $(obj.Target).children("img").attr("src", $(this).attr("src"));
                        $(obj.Target).children("img").removeAttr("data-largesrc");
                        if ($(this).attr("data-largesrc") != undefined) {
                            $(obj.Target).children("img").attr("data-largesrc", $(this).attr("data-largesrc"));
                        }
                        if (tarimg.attr("title") != undefined) {
                            if (tarimg.attr("title") != "") {
                                if ($(obj.Target).children(obj.Title).length > 0) {
                                    $(obj.Target).children(obj.Title).html(tarimg.attr("title"));
                                }
                            }
                        }
                        $(obj.Target).fadeIn();
                    });
                });
            }
        }
    };

    $.fn.photohighlight = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.photo highlight');
        }

    };
})(jQuery);

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
                        try {
                            zoomimgcontainer.swipe({
                                Distance: 5,
                                TrackMouse: 'hover',
                                OnMove: function (d) {
                                    move(d.page.x, d.page.y, zoomimgcontainer, options);
                                },
                                OnEnd: function () { close(); }
                            });
                            zoomimgcontainer.mouseup(close);
                            zoomimgcontainer.mouseout(close);
                        }
                        catch (err) { console && console.log(err); }
                    }
                    else {
                        zoomimgcontainer.fadeIn();
                    }

                    if (selObject.attr("data-largesrc") != undefined) {
                        largeimg.attr("src", selObject.attr("data-largesrc"));
                    }
                    else {
                        largeimg.attr("src", selObject.attr("src"));
                    }
                    var offset = selObject.offset();
                    if (options.Position == "top") {
                        zoomimgcontainer.css("top", offset.top - zoomimgcontainer.outerHeight() - options.Distance);
                        zoomimgcontainer.css("left", offset.left - parseInt(zoomimgcontainer.css("border-left-width"), 10));
                    }
                    else if (options.Position == "right") {
                        zoomimgcontainer.css("top", offset.top - parseInt(zoomimgcontainer.css("border-top-width"), 10));
                        zoomimgcontainer.css("left", offset.left + selObject.outerWidth(true) + options.Distance);
                    }
                    else if (options.Position == "left") {
                        zoomimgcontainer.css("top", offset.top - parseInt(zoomimgcontainer.css("border-top-width"), 10));
                        zoomimgcontainer.css("left", offset.left - zoomimgcontainer.outerWidth() - options.Distance);
                    }
                    else if (options.Position == "bottom") {
                        zoomimgcontainer.css("top", offset.top + selObject.outerHeight(true) + options.Distance + parseInt(zoomimgcontainer.css("border-top-width"), 10));
                        zoomimgcontainer.css("left", offset.left - parseInt(zoomimgcontainer.css("border-left-width"), 10));
                    }
                    else if (options.Position == "over") {
                        zoomimgcontainer.css("z-index", "10");
                        zoomimgcontainer.css("border", "none");
                        zoomimgcontainer.css("padding", "0px");
                        zoomimgcontainer.width(selObject.outerWidth());
                        zoomimgcontainer.height(selObject.outerHeight());
                        zoomimgcontainer.css("top", offset.top - parseInt(zoomimgcontainer.css("border-top-width"), 10));
                        zoomimgcontainer.css("left", offset.left - parseInt(zoomimgcontainer.css("border-left-width"), 10));
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
