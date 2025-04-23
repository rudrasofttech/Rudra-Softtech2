(function ($) {
    var methods = {
        moveto: function (args) {
            return this.each(function () {
                var selObject = $(this);
                opt = selObject.data('carousel').options;
                var centerx = selObject.width() / 2, centery = selObject.height() / 2;
                selObject.children("[rst-item-index = " + args.index + "]").each(function (itemindex) {
                    var l = $(this).position().left + ($(this).width() / 2);
                    var t = $(this).position().top + ($(this).height() / 2);
                    var m = 0;

                    if (data.options.Direction == "h") {
                        selObject.stop(false, true);
                        m = l - centerx;
                        selObject.animate({ scrollLeft: selObject.scrollLeft() + m }, { complete: function () {
                            if (opt.OnMove != null) {
                                if (m > 0) {
                                    opt.OnMove("r");
                                } else {
                                    opt.OnMove("l");
                                }
                            }
                        }
                        });
                    } else if (data.options.Direction == "v") {
                        m = t - centery;
                        selObject.stop(false, true).animate({ scrollTop: selObject.scrollTop() + m }, { complete: function () {
                            if (opt.OnMove != null) {
                                if (m > 0) {
                                    opt.OnMove("d");
                                }
                                else {
                                    opt.OnMove("u");
                                }
                            }
                        }
                        });
                    }
                });
            });
        },
        addclass: function (args) {
            return this.each(function () {
                var selObject = $(this);
                data = selObject.data('carousel');
                selObject.find(data.options.ItemSelector).each(function (index) {
                    if (args.index == index) {
                        $(this).children().addClass(args.classname);
                    } else if (args.index == -1) {
                        $(this).children().addClass(args.classname);
                    }
                });
            });
        },
        removeclass: function (args) {
            return this.each(function () {
                var selObject = $(this);
                data = selObject.data('carousel');
                selObject.find(data.options.ItemSelector).each(function (index) {
                    if (args.index == index) {
                        $(this).children().removeClass(args.classname);
                    } else if (args.index == -1) {
                        $(this).children().removeClass(args.classname);
                    }
                });
            });
        },
        moveplus: function (args) {
            return this.each(function () {
                var selObject = $(this);
                opt = selObject.data('carousel').options;
                var s = opt.Step;
                console.log(s);
                if (opt.Direction == "h") {
                    if (s > 0) {
                        selObject.stop(false, true).animate({ scrollLeft: selObject.scrollLeft() + s }, function () {
                            if (opt.OnMove != null) {
                                opt.OnMove("r");
                            }
                        });
                    }
                }
                else if (opt.Direction == "v") {
                    if (s > 0) {
                        selObject.stop(false, true).animate({ scrollTop: selObject.scrollTop() + s }, function () {
                            if (opt.OnMove != null) {
                                opt.OnMove("d");
                            }
                        });
                    }
                }
            });
        },
        moveminus: function (args) {
            return this.each(function () {
                var selObject = $(this);
                opt = selObject.data('carousel').options;
                var s = opt.Step;
                if (opt.Direction == "h") {
                    if (s > 0) {
                        selObject.stop(false, true).animate({ scrollLeft: selObject.scrollLeft() - s }, function () {
                            if (opt.OnMove != null) {
                                opt.OnMove("l");
                            }
                        });
                    }
                }
                else if (opt.Direction == "v") {
                    if (s > 0) {
                        selObject.stop(false, true).animate({ scrollTop: selObject.scrollTop() - s }, function () {
                            if (opt.OnMove != null) {
                                opt.OnMove("u");
                            }
                        });
                    }
                }
            });
        },
        init: function (options) {
            var defaultVal = {
                Direction: 'h',
                ItemSelector: '.rst-carousel-item',
                Step: 0,
                OnInit: null,
                OnInitComplete: null,
                OnMove: null
            };

            var obj = $.extend(defaultVal, options);
            return this.each(function () {
                if (obj.OnInit != null) { obj.OnInit(); }
                var selObject = $(this);
                var data = selObject.data('carousel');

                var mouseover = false;

                if (!data) { selObject.data('carousel', { options: obj }); }

                if (obj.Direction == "h") {
                    selObject.data('carousel-dir', 'right');
                }
                else if (obj.Direction == "v") {
                    selObject.data('carousel-dir', 'down');
                }

                var moveminus = function (diff) {
                    var s = diff;
                    if (obj.Direction == "h") {
                        if (s > 0) {
                            selObject.stop(false, false).animate({ scrollLeft: selObject.scrollLeft() - s }, function () {
                                if (obj.OnMove != null) {
                                    obj.OnMove("l");
                                }
                            });
                        }
                    }
                    else if (obj.Direction == "v") {
                        if (s > 0) {
                            selObject.stop(false, false).animate({ scrollTop: selObject.scrollTop() - s }, function () {
                                if (obj.OnMove != null) {
                                    obj.OnMove("u");
                                }
                            });
                        }
                    }
                };

                var moveplus = function (diff) {
                    var s = diff;
                    if (obj.Direction == "h") {
                        if (s > 0) {
                            selObject.stop(false, false).animate({ scrollLeft: selObject.scrollLeft() + s }, function () {
                                if (obj.OnMove != null) {
                                    obj.OnMove("r");
                                }
                            });
                        }

                    }
                    else if (obj.Direction == "v") {
                        if (s > 0) {
                            selObject.stop(false, false).animate({ scrollTop: selObject.scrollTop() + s }, function () {
                                if (obj.OnMove != null) {
                                    obj.OnMove("d");
                                }
                            });
                        }
                    }
                };

                selObject.mouseover(function () {
                    mouseover = true;
                });
                selObject.mouseout(function () {
                    mouseover = false;
                });
                try {
                    selObject.swipe({
                        OnSwipe: function (d) {
                            if (d.speed > 300) {
                                if (detail.direction == "r" || detail.direction == "d") {
                                    if (obj.Direction == "h") {
                                        moveminus(selObject.width());
                                    }
                                    else { moveminus(selObject.height()); }
                                }
                                else if (detail.direction == "l" || detail.direction == "u") {
                                    if (obj.Direction == "h") {
                                        moveplus(selObject.width());
                                    } else {
                                        moveplus(selObject.height());
                                    }
                                }
                            }
                        },
                        OnMove: function (d) {
                            selObject.stop(false, true);

                            if (obj.Direction == "h") {
                                if (d.diffx > 0) {
                                    moveminus(d.diffx);
                                } else {
                                    moveplus(d.diffx * -1);
                                }
                            }
                            else if (obj.Direction == "v") {
                                if (d.diffy > 0) {
                                    moveminus(d.diffy);
                                } else {
                                    moveplus(d.diffy * -1);
                                }
                            }
                        }
                    });
                }
                catch (e) { }

                selObject.css("position", "relative");
                selObject.css("overflow", "hidden");
                if (obj.Direction == "h") {
                } else if (obj.Direction == "v") {
                    selObject.css("text-align", "center");
                }
                var top = 0, left = 0;
                selObject.children(obj.ItemSelector).each(function (index) {
                    $(this).attr("rst-item-index", index);

                    if (obj.Direction == "h") {
                        if (selObject.height() < $(this).outerHeight(true)) {
                            selObject.height($(this).outerHeight(true));
                        }
                        $(this).css("display", "block");
                        $(this).css("position", "absolute");
                        $(this).css("top", top);
                        $(this).css("left", left);
                        left = left + $(this).outerWidth(true);

                    } else if (obj.Direction == "v") {
                        $(this).css("display", "block");
                        if (selObject.width() < $(this).outerWidth()) {
                            selObject.width($(this).outerWidth());
                        }
                    }
                });

                if (obj.OnInitComplete != null) {
                    obj.OnInitComplete();
                }

                $(document).keydown(function (e) {
                    if (mouseover) {
                        if (obj.Direction == "h") {
                            if (e.keyCode == 37) {
                                moveminus(obj.Step);
                                e.preventDefault();
                            }
                            else if (e.keyCode == 39) {
                                moveplus(obj.Step);
                                e.preventDefault();
                            }
                        }
                        else if (obj.Direction == "v") {
                            if (e.keyCode == 38) {
                                moveminus(obj.Step);
                                e.preventDefault();
                            }
                            else if (e.keyCode == 40) {
                                moveplus(obj.Step);
                                e.preventDefault();
                            }
                        }

                    }
                });
            });
        }
    };

    $.fn.carousel = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.carousel');
        }

    };
})(jQuery);