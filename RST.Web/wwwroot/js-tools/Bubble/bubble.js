(function ($) {
    var methods = {
        close: function (args) {
            return this.each(function () {
                var selObject = $(this);
                var tooltip = $("#" + selObject.attr("data-bubbleid"));
                var opt = tooltip.data('bubble').options;
                tooltip.fadeOut({ complete: function () {
                    if (opt.OnClose != null) {
                        opt.OnClose();
                    }
                }
                });
            });
        },
        open: function (args) {
            return this.each(function () {
                var selObject = $(this);
                var tooltip = $("#" + selObject.attr("data-bubbleid"));
                var opt = tooltip.data('bubble').options;
                var pointer = tooltip.find(".rst-arrow");
                var selobjpos = { top: selObject.offset().top, left: selObject.offset().left, width: selObject.outerWidth(true), height: selObject.outerHeight(true) };
                if (opt.Position == "right") {
                    tooltip.css("top", selobjpos.top - (tooltip.outerHeight(true) / 2) + (selobjpos.height / 2));
                    tooltip.css("left", (selobjpos.left + selobjpos.width + opt.Distance));
                }
                else if (opt.Position == "left") {
                    tooltip.css("top", selobjpos.top - (tooltip.outerHeight(true) / 2) + (selobjpos.height / 2));
                    tooltip.css("left", (selobjpos.left - (tooltip.outerWidth(true) + pointer.outerWidth(true) + opt.Distance)));
                }
                else if (opt.Position == "top") {
                    tooltip.css("top", selobjpos.top - (tooltip.outerHeight(true) + pointer.outerHeight(true) + opt.Distance));
                    tooltip.css("left", selobjpos.left - (tooltip.outerWidth(true) / 2) + (selobjpos.width / 2));
                }
                else if (opt.Position == "bottom") {
                    tooltip.css("top", selobjpos.top + selobjpos.height + opt.Distance);
                    tooltip.css("left", selobjpos.left - (tooltip.outerWidth(true) / 2) + (selobjpos.width / 2));
                }
                tooltip.fadeIn({ complete: function () {
                    if (opt.Effect) {
                        try {
                            if (opt.Position == "right" || opt.Position == "left") {
                                tooltip.effect("shake", { direction: "left", times: 2, distance: opt.Distance }, 500, function () { });
                            } else if (opt.Position == "bottom" || opt.Position == "top") {
                                tooltip.effect("shake", { direction: "up", times: 2, distance: opt.Distance }, 500, function () { });
                            }
                        } catch (err) { }
                    }
                    if (opt.OnShow != null) {
                        opt.OnShow();
                    }
                }
                });
            });
        },
        init: function (options) {
            var defaultVal = {
                Action: 'click',
                Position: 'right',
                Duration: 1000,
                Distance: 5,
                Effect: true,
                OnShow: null,
                OnClose: null,
                CloseOthers: false
            };

            var obj = $.extend(defaultVal, options);

            return this.each(function () {
                var selObject = $(this);

                var tooltip = $("#" + selObject.attr("data-bubbleid"));
                var pointer = $("<div class='rst-arrow'></div>");
                tooltip.append(pointer);
                var data = tooltip.data('bubble');
                if (!data) { tooltip.data('bubble', { options: obj }); } else { return; }
                var shouldHide = false;
                var positiontt = function () {
                    var selobjpos = { top: selObject.offset().top, left: selObject.offset().left, width: selObject.outerWidth(true), height: selObject.outerHeight(true) };
                    if (obj.Position == "right") {
                        tooltip.addClass("right");
                        pointer.addClass("rst-arrow-right");
                        tooltip.css("top", selobjpos.top - (tooltip.outerHeight(true) / 2) + (selobjpos.height / 2));
                        tooltip.css("left", (selobjpos.left + selobjpos.width + obj.Distance));
                    }
                    else if (obj.Position == "left") {
                        tooltip.addClass("left");
                        pointer.addClass("rst-arrow-left");
                        tooltip.css("top", selobjpos.top - (tooltip.outerHeight(true) / 2) + (selobjpos.height / 2));
                        tooltip.css("left", (selobjpos.left - (tooltip.outerWidth(true) + pointer.outerWidth(true) + obj.Distance)));
                    }
                    else if (obj.Position == "top") {
                        tooltip.addClass("top");
                        pointer.addClass("rst-arrow-top");
                        tooltip.css("top", selobjpos.top - (tooltip.outerHeight(true) + pointer.outerHeight(true) + obj.Distance));
                        tooltip.css("left", selobjpos.left - (tooltip.outerWidth(true) / 2) + (selobjpos.width / 2));
                    }
                    else if (obj.Position == "bottom") {
                        tooltip.addClass("bottom");
                        pointer.addClass("rst-arrow-bottom");
                        tooltip.css("top", selobjpos.top + selobjpos.height + obj.Distance);
                        tooltip.css("left", selobjpos.left - (tooltip.outerWidth(true) / 2) + (selobjpos.width / 2));
                    }
                    else if (obj.Position == "over") {
                        tooltip.addClass("over");
                        tooltip.css("top", selobjpos.top);
                        tooltip.css("left", selobjpos.left);
                    }
                };

                positiontt();
                tooltip.children(".rst-bubble-close").click(function () {
                    tooltip.fadeOut({ complete: function () {
                        if (obj.OnClose != null) {
                            obj.OnClose();
                        }
                    }
                    });
                });
                if (obj.Action == "click") {
                    selObject.click(
                        function (event) {
                            event.preventDefault();

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
                                if (obj.CloseOthers) {
                                    $(".rst-bubble").hide();
                                }
                                tooltip.fadeIn({ complete: function () {
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
                        if (obj.CloseOthers) {
                            $(".rst-bubble").hide();
                        }
                        tooltip.fadeIn({ complete: function () {
                            if (obj.Effect) {
                                if (obj.Position == "right" || obj.Position == "left") {
                                    tooltip.effect("shake", { direction: "left", times: 2, distance: obj.Distance }, 500, function () { });
                                } else if (obj.Position == "bottom" || obj.Position == "top") {
                                    tooltip.effect("shake", { direction: "up", times: 2, distance: obj.Distance }, 500, function () { });
                                }
                            }
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