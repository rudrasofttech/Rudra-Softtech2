(function ($) {
    var methods = {
        close: function (args) {
            var tooltip = $("#" + args.bubbleid);
            var opt = tooltip.data('bubble').options;
            tooltip.fadeOut({ complete: function () {
                if (opt.OnClose != null) {
                    opt.OnClose();
                }
            }
            });
        },
        open: function (args) {
            var tooltip = $("#" + args.bubbleid);
            var opt = tooltip.data('bubble').options;
            tooltip.fadeIn({ complete: function () {
                if (opt.OnShow != null) {
                    opt.OnShow();
                }
            }
            });
        },
        init: function (options) {
            var defaultVal = {
                Action: 'click',
                Position: 'right',
                Duration: 1000,
                Distance: 5,
                OnShow: null,
                OnClose: null
            };

            var obj = $.extend(defaultVal, options);

            return this.each(function () {
                var selObject = $(this);

                var tooltip = $("#" + selObject.attr("data-bubbleid"));
                var pointer = $("<div class='rst-arrow'></div>");
                tooltip.append(pointer);
                var data = tooltip.data('bubble');
                if (!data) { tooltip.data('bubble', { options: obj }); }
                var shouldHide = false;
                var positiontt = function () {
                    var selobjpos = { top: selObject.offset().top, left: selObject.offset().left, width: selObject.outerWidth(true), height: selObject.outerHeight(true) };
                    if (obj.Position == "right") {
                        tooltip.css("top", selobjpos.top - (tooltip.outerHeight(true) / 2) + (selobjpos.height / 2));
                        tooltip.css("left", (selobjpos.left + selobjpos.width + obj.Distance));
                        tooltip.addClass("right");
                        pointer.addClass("rst-arrow-right");
                    }
                    else if (obj.Position == "left") {
                        tooltip.css("top", selobjpos.top - (tooltip.outerHeight(true) / 2) + (selobjpos.height / 2));
                        tooltip.css("left", (selobjpos.left - (tooltip.outerWidth(true) + obj.Distance)));
                        tooltip.addClass("left");
                        pointer.addClass("rst-arrow-left");
                    }
                    else if (obj.Position == "top") {
                        tooltip.css("top", selobjpos.top - tooltip.outerHeight(true) - obj.Distance);
                        tooltip.css("left", selobjpos.left - (tooltip.outerWidth(true) / 2) + (selobjpos.width / 2));
                        tooltip.addClass("top");
                        pointer.addClass("rst-arrow-top");
                    }
                    else if (obj.Position == "bottom") {
                        tooltip.css("top", selobjpos.top + selobjpos.height + obj.Distance);
                        tooltip.css("left", selobjpos.left - (tooltip.outerWidth(true) / 2) + (selobjpos.width / 2));
                        tooltip.addClass("bottom");
                        pointer.addClass("rst-arrow-bottom");
                    }
                };
                if (obj.Action == "click") {
                    selObject.click(
                        function (event) {
                            event.preventDefault()
                            if (tooltip.is(":visible")) {
                                shouldHide = true;
                                if (shouldHide) {
                                    tooltip.fadeOut({ complete: function () {
                                        if (obj.OnClose != null) {
                                            obj.OnClose();
                                        }
                                    }
                                    });
                                }
                                return true;
                            } else {
                                tooltip.fadeIn({ complete: function () {
                                    if (obj.OnShow != null) {
                                        obj.OnShow();
                                    }
                                }
                                });
                            }
                            positiontt();
                            return true;
                        });
                }
                else if (obj.Action == "hover") {
                    tooltip.mouseover(function () { shouldHide = false; });
                    tooltip.mouseout(function () {
                        shouldHide = true;
                        setTimeout(function () {
                            if (shouldHide == true) {
                                tooltip.fadeOut({ complete: function () {
                                    if (obj.OnClose != null) {
                                        obj.OnClose();
                                    }
                                }
                                });
                            }
                        }, obj.Duration);
                    });
                    selObject.mouseover(function () {
                        shouldHide = false;
                        tooltip.fadeIn({ complete: function () {
                            if (obj.OnShow != null) {
                                obj.OnShow();
                            }
                        }
                        });
                        positiontt();

                    });
                    selObject.mouseout(function () {
                        shouldHide = true;
                        setTimeout(function () {
                            if (shouldHide) {
                                tooltip.fadeOut();
                            }
                        }, obj.Duration);
                    });
                }
            });
        }
    };

    $.fn.bubble = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.bubble');
        }
    };
})(jQuery);