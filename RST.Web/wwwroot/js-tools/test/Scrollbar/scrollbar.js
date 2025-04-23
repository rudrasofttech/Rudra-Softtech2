(function ($) {
    var methods = {
        scrollit: function (args) {
            return this.each(function () {
                var selObject = $(this);
                if (args.d == "u") {
                    selObject.scrollTop(selObject.scrollTop() - 20);
                }
                else if (args.d == "d") {
                    selObject.scrollTop(selObject.scrollTop() + 20);
                }
                else if (args.d == "l") {
                    selObject.scrollLeft(selObject.scrollLeft() - 20);
                }
                else if (args.d == "r") {
                    selObject.scrollLeft(selObject.scrollLeft() + 20);
                }
            });
        },
        init: function (options) {
            var defaultVal = {
                Scroll: 'both',
                ShowAlways: true,
                OnInit: null,
                OnInitComplete: null,
                OnScroll: null
            };

            var obj = $.extend(defaultVal, options);

            return this.each(function () {
                var selObject = $(this);

                if (obj.OnInit != null) {
                    obj.OnInit();
                }

                var sc = null;
                var vscroll = $("<div class='rst-scrollstrip-vertical'></div>");
                var vshandle = $("<button class='rst-scrollhandle-vertical'></button>");

                var hscroll = $("<div class='rst-scrollstrip-horizontal'></div>");
                var hshandle = $("<button class='rst-scrollhandle-horizontal'></button>");

                var showhscroll = false, showvscroll = false;
                var vshouldHide = false;
                var hshouldHide = false;

                selObject.scrollTop(0);
                selObject.scrollLeft(0);

                if (parseInt(selObject.prop("scrollWidth"), 10) > selObject.outerWidth()) {
                    showhscroll = true;
                }
                if (parseInt(selObject.prop("scrollHeight"), 10) > selObject.outerHeight()) {
                    showvscroll = true;
                }

                if (showvscroll || showhscroll) {
                    selObject.html("<div class='rst-scrollcont'>" + selObject.html() + "</div>");
                    sc = selObject.children(".rst-scrollcont");
                }

                if ((obj.Scroll == "both" || obj.Scroll == "vertical") && showvscroll) {
                    selObject.append(vscroll);
                }
                if ((obj.Scroll == "both" || obj.Scroll == "horizontal") && showhscroll) {
                    selObject.append(hscroll);
                }
                if (obj.ShowAlways) { vscroll.show(); hscroll.show(); } else { vscroll.hide(); hscroll.hide(); }

                var positionbars = function () {
                    if (showvscroll) {
                        vshouldHide = false;
                        vshandle.height(vscroll.outerHeight() / (parseInt(sc.prop("scrollHeight"), 10) / vscroll.outerHeight()));
                        vshandle.appendTo(vscroll);
                        vscroll.show();
                    }

                    if (showhscroll) {
                        hshouldHide = false;
                        hshandle.width(hscroll.outerWidth() / (parseInt(sc.prop("scrollWidth"), 10) / hscroll.outerWidth()));
                        hshandle.appendTo(hscroll);
                        hscroll.show();
                    }
                };

                var hidebars = function () {
                    if (obj.ShowAlways == false) {
                        if (showvscroll) {
                            vshouldHide = true;
                            setTimeout(function () {
                                if (vshouldHide) {
                                    vscroll.hide();
                                }
                            }, 1000);
                        }

                        if (showhscroll) {
                            hshouldHide = true;
                            setTimeout(function () {
                                if (hshouldHide) {
                                    hscroll.hide();
                                }
                            }, 1000);

                        }
                    }
                };

                var scrollit = function (direction) {
                    if (direction == "u") {
                        sc.scrollTop(sc.scrollTop() - (((parseInt(sc.prop("scrollHeight"), 10) / sc.height()) * 10)));
                        vshandle.dragable('dragit', { x: 0, y: -10 });
                        if (obj.OnScroll != null) {
                            obj.OnScroll(direction);
                        }
                    }
                    else if (direction == "d") {
                        sc.scrollTop(sc.scrollTop() + (((parseInt(sc.prop("scrollHeight"), 10) / sc.height()) * 10)));
                        vshandle.dragable('dragit', { x: 0, y: 10 });
                        if (obj.OnScroll != null) {
                            obj.OnScroll(direction);
                        }
                    }
                    else if (direction == "l") {
                        sc.scrollLeft(sc.scrollLeft() - (((parseInt(sc.prop("scrollHeight"), 10) / sc.height()) * 10)));
                        hshandle.dragable('dragit', { x: -10, y: 0 });
                        if (obj.OnScroll != null) {
                            obj.OnScroll(direction);
                        }
                    }
                    else if (direction == "r") {
                        sc.scrollLeft(sc.scrollLeft() + (((parseInt(sc.prop("scrollHeight"), 10) / sc.height()) * 10)));
                        hshandle.dragable('dragit', { x: 10, y: 0 });
                        if (obj.OnScroll != null) {
                            obj.OnScroll(direction);
                        }
                    }
                };

                var kd = function (e) {
                    if (e.keyCode == 37) {
                        e.preventDefault();
                        e.stopPropagation();
                        scrollit("l");
                    }
                    else if (e.keyCode == 39) {
                        e.preventDefault();
                        e.stopPropagation();
                        scrollit("r");
                    }
                    else if (e.keyCode == 38) {
                        e.preventDefault();
                        e.stopPropagation();
                        scrollit("u");
                    }
                    else if (e.keyCode == 40) {
                        e.preventDefault();
                        e.stopPropagation();
                        scrollit("d");
                    }
                };

                if (showvscroll) {
                    vshandle.dragable({ Axis: 'y', Inside: 'parent', OnStart: function () {
                        vshouldHide = false;
                    }, OnDrag: function (xdiff, ydiff, x, y) {
                        vshouldHide = false;
                        hshouldHide = false;

                        sc.scrollTop(sc.scrollTop() + ((parseInt(sc.prop("scrollHeight"), 10) / sc.height()) * ydiff));
                        if (ydiff > 0 && obj.OnScroll != null) {
                            obj.OnScroll("d");
                        } else if (ydiff < 0 && obj.OnScroll != null) {
                            obj.OnScroll("u");
                        }
                    },
                        OnEnd: hidebars
                    });

                    try {
                        selObject.swipe({
                            EnableMouse: false,
                            OnTouch: function (d) { positionbars(); },
                            OnMove: function (d) {
                                vshouldHide = false;
                                hshouldHide = false;
                                sc.scrollTop(sc.scrollTop() + ((parseInt(sc.prop("scrollHeight"), 10) / sc.height()) * d.diffy));
                                vshandle.dragable('dragit', { x: 0, y: d.diffy });
                                if (d.diffy > 0 && obj.OnScroll != null) {
                                    obj.OnScroll("d");
                                } else if (d.diffy < 0 && obj.OnScroll != null) {
                                    obj.OnScroll("u");
                                }
                                d.evt.stopPropagation();
                            }
                        });
                    }
                    catch (e) { }
                }
                if (showhscroll) {
                    hshandle.dragable({ Axis: 'x', Inside: 'parent', OnStart: function () {
                        vshouldHide = false;
                        hshouldHide = false;
                    }, OnDrag: function (xdiff, ydiff, x, y) {
                        hshouldHide = false;
                        sc.scrollLeft(sc.scrollLeft() + ((parseInt(sc.prop("scrollWidth"), 10) / sc.width()) * xdiff));
                        if (xdiff > 0 && obj.OnScroll != null) {
                            obj.OnScroll("r");
                        } else if (xdiff < 0 && obj.OnScroll != null) {
                            obj.OnScroll("l");
                        }
                    },
                        OnEnd: hidebars
                    });
                    try {
                        selObject.swipe({
                            EnableMouse: false,
                            OnTouch: function (d) { positionbars(); },
                            OnMove: function (d) {
                                vshouldHide = false;
                                hshouldHide = false;
                                sc.scrollLeft(sc.scrollLeft() + ((parseInt(sc.prop("scrollWidth"), 10) / sc.width()) * d.diffx));
                                hshandle.dragable('dragit', { x: d.diffx, y: 0 });
                                if (d.diffx > 0 && obj.OnScroll != null) {
                                    obj.OnScroll("r");
                                } else if (d.diffx < 0 && obj.OnScroll != null) {
                                    obj.OnScroll("l");
                                }
                                d.evt.stopPropagation();
                            }
                        });
                    }
                    catch (e) { }
                }

                if (obj.ShowAlways) {
                    positionbars();
                }

                $(window).resize(function () { positionbars(); });

                sc.mouseover(function (e) {
                    positionbars();
                    $(document).keydown(kd);
                    e.stopPropagation();
                });

                sc.mouseout(function (e) {

                    hidebars();
                    $(document).unbind("keydown", kd);
                    e.stopPropagation();
                });

                selObject.bind("mousewheel", function (event) {
                    var e = window.event || event;
                    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
                    e.preventDefault();
                    if (delta == 1) {
                        scrollit("u");
                    } else if (delta == -1) { scrollit("d"); }
                    return false;
                });

                if (obj.OnInitComplete != null) {
                    obj.OnInitComplete();
                }
            });
        }
    };
    $.fn.scrollbar = function (method) {
        if (window.screen.availHeight > 500 && window.screen.availWidth > 500) {
            if (methods[method]) {
                return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method === 'object' || !method) {
                return methods.init.apply(this, arguments);
            } else {
                $.error('Method ' + method + ' does not exist on jQuery.scrollbar');
            }
        }
    };
})(jQuery);