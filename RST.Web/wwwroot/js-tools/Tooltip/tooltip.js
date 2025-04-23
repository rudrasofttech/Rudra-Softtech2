(function ($) {

    var methods = {
        init: function (options) {

            var defaultVal = {
                Action: 'hover',
                Position: 'top',
                Distance: 5,
                Effect: false,
                OnShow: null,
                OnClose: null
            };

            var obj = $.extend(defaultVal, options);

            return this.each(function () {

                var selObject = $(this);
                var tooltip = $("<div class='rsttooltip'>" + $(selObject).attr("data-tooltip") + "</div>");


                var draw = function () {
                    selObject.parent().append(tooltip);
                    tooltip.css("display", "block");
                    var t = 0;
                    var l = 0;
                    if (obj.Position == "right") {
                        t = selObject.position().top - (tooltip.outerHeight() / 2) + (selObject.outerHeight() / 2);
                        l = (selObject.position().left + selObject.outerWidth() + obj.Distance)
                    }
                    else if (obj.Position == "left") {
                        t = selObject.position().top - (tooltip.outerHeight() / 2) + (selObject.outerHeight() / 2);
                        l = (selObject.position().left - (tooltip.outerWidth() + obj.Distance));
                    }
                    else if (obj.Position == "top") {
                        t = selObject.position().top - tooltip.outerHeight() - obj.Distance;
                        l = selObject.position().left - (tooltip.outerWidth() / 2) + (selObject.outerWidth() / 2);
                    }
                    else if (obj.Position == "bottom") {
                        t = selObject.position().top + selObject.outerHeight() + obj.Distance;
                        l = selObject.position().left - (tooltip.outerWidth() / 2) + (selObject.outerWidth() / 2);
                    }
                    if (l < 0) { l = 5; }
                    else if (l > ($(window).width() - tooltip.outerWidth())) { l = ($(window).width() - tooltip.outerWidth()) + 5; }
                    tooltip.css({ top: t, left: l });

                    if (obj.Effect) {
                        try {
                            if (obj.Position == "right" || obj.Position == "left") {
                                tooltip.effect("shake", { direction: "left", times: 2, distance: obj.Distance }, 500, function () { });
                            } else if (obj.Position == "bottom" || obj.Position == "top") {
                                tooltip.effect("shake", { direction: "up", times: 2, distance: obj.Distance }, 500, function () { });
                            }
                        } catch (err) { }
                    }

                    if (obj.OnShow != null) {
                        obj.OnShow();
                    }
                };

                var remove = function () {
                    if (tooltip.is(":visible")) {
                        tooltip.css("display", "none");
                        tooltip.remove();
                        if (obj.OnClose != null) {
                            obj.OnClose();
                        }
                    }
                };
                if (obj.Action == 'hover') {
                    if (window.screen.availWidth > 800) {
                        selObject.mouseover(function () {
                            draw();
                        });
                        selObject.mouseout(function () {
                            remove();
                        });
                    }
                }
                else if (obj.Action == 'scrollcenter') {
                    $(window).scroll(function () {
                        if ((selObject.position().top - $(window).scrollTop()) > (($(window).height() / 2) - 50) && (selObject.position().top - $(window).scrollTop()) <= (($(window).height() / 2) + 50)) {
                            if (!tooltip.is(":visible")) draw();
                        }
                        else { remove(); }
                    });
                }
                else if (obj.Action == 'scrolltop') {
                    $(window).scroll(function () {
                        if ((selObject.position().top - $(window).scrollTop()) > 0 && (selObject.position().top - $(window).scrollTop()) <= 100) {
                            if (!tooltip.is(":visible")) draw();
                        }
                        else { remove(); }
                    });
                }
                else if (obj.Action == 'scrollbottom') {
                    $(window).scroll(function () {
                        if ((selObject.position().top - $(window).scrollTop()) > ($(window).height() - 100) && (selObject.position().top - $(window).scrollTop()) <= $(window).height()) {
                            if (!tooltip.is(":visible")) draw();
                        }
                        else { remove(); }
                    });
                }

                tooltip.click(function (e) { remove(); e.preventDefault(); });
            });
        }
    };

    $.fn.tooltip = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.tooltip');
        }
    };
})(jQuery);