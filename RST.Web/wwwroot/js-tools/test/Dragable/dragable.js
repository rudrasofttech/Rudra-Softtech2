(function ($) {
    var methods = {
        dragit: function (args) {
            return this.each(function () {
                var dragObject = $(this);
                data = dragObject.data('dragable');

                var offset = null;
                var newxpos;
                var newypos;
                var xmaxlimit = $(document).width() - dragObject.outerWidth(true);
                var ymaxlimit = $(document).height() - dragObject.outerHeight(true);
                var xminlimit = 0;
                var yminlimit = 0;

                dragObject.css("position", "absolute");
                dragObject.css("z-index", 20);
                //offset = { x: parseInt(dragObject[0].style.left), y: parseInt(dragObject[0].style.top) };
                offset = { x: dragObject.position().left, y: dragObject.position().top };
                xmaxlimit = dragObject.parent().outerWidth() - dragObject.outerWidth(true);
                xminlimit = 0;
                ymaxlimit = dragObject.parent().outerHeight() - dragObject.outerHeight(true);
                yminlimit = 0;


                newxpos = (offset.x + args.x);
                newypos = (offset.y + args.y);

                if (newxpos > xmaxlimit) { newxpos = xmaxlimit; }
                if (newxpos < xminlimit) { newxpos = xminlimit; }
                if (newypos > ymaxlimit) { newypos = ymaxlimit; }
                if (newypos < yminlimit) { newypos = yminlimit; }

                dragObject.css({ top: newypos, left: newxpos });
            });
        },
        init: function (options) {
            var defaultVal = {
                Axis: 'both',
                OnStart: null,
                OnDrag: null,
                OnEnd: null
            };

            var obj = $.extend(defaultVal, options);
            return this.each(function () {

                var dragObject = $(this);
                var data = dragObject.data('dragable');
                var mousedown = false;

                var xpos = 0;
                var ypos = 0;
                var xmaxlimit = $(window).width();
                var ymaxlimit = $(window).height();
                var xminlimit = 0;
                var yminlimit = 0;

                if (!data) {
                    dragObject.data('dragable', {
                        options: obj
                    });
                }

                var startit = function () {
                    dragObject.css("position", "absolute");
                    dragObject.css("z-index", 20);
                    xmaxlimit = dragObject.parent().outerWidth() - dragObject.outerWidth(true);
                    xminlimit = 0;
                    ymaxlimit = dragObject.parent().outerHeight() - dragObject.outerHeight(true);
                    yminlimit = 0;
                };

                var moveit = function (x, y) {
                    if (mousedown) {
                        var newxpos;
                        var newypos;
                        //offset = { x: parseInt(dragObject[0].style.left), y: parseInt(dragObject[0].style.top) };
                        offset = { x: dragObject.position().left, y: dragObject.position().top };
                        newypos = offset.y + (y - ypos);
                        newxpos = offset.x + (x - xpos);

                        if (obj.Axis == "x" && (newxpos >= xminlimit && newxpos <= xmaxlimit)) {
                            dragObject.css({ left: newxpos });
                        }
                        else if (obj.Axis == "y" && (newypos >= yminlimit && newypos <= ymaxlimit)) {
                            dragObject.css({ top: newypos });
                        }
                        else if (obj.Axis == "both" && (newxpos >= xminlimit && newxpos <= xmaxlimit) && (newypos >= yminlimit && newypos <= ymaxlimit)) {
                            dragObject.css({ left: newxpos, top: newypos });
                        }
                        if (obj.OnDrag != null) {
                            obj.OnDrag(x - xpos, y - ypos, x, y);
                        }
                        xpos = x;
                        ypos = y;
                    }
                };

                try {
                    dragObject.swipe({ EnableMouse: false, Distance: 500, OnTouch: function (d) {
                        xpos = d.client.x;
                        ypos = d.client.y;
                        mousedown = true;
                        startit();
                        if (obj.OnStart != null) {
                            obj.OnStart();
                        }
                    },
                        OnMove: function (d) {
                            moveit(d.client.x, d.client.y);
                        },
                        OnEnd: function () {
                            mousedown = false;
                            if (obj.OnEnd != null) {
                                obj.OnEnd();
                            }
                        }
                    });
                }
                catch (e) { }

                dragObject.mouseup(function () {
                    mousedown = false;
                    if (obj.OnEnd != null) {
                        obj.OnEnd();
                    }
                });

                $("body").mouseup(function () {
                    if (mousedown) {
                        mousedown = false;
                        if (obj.OnEnd != null) {
                            obj.OnEnd();
                        }
                    }
                });
                dragObject.mousedown(function (e) {
                    if (!e) { e = window.event; }
                    var kc = (e.keyCode || e.which);

                    if (kc == 1) {
                        e.preventDefault();
                        mousedown = true;
                        xpos = e.clientX;
                        ypos = e.clientY;
                        startit();
                        if (obj.OnStart != null) {
                            obj.OnStart();
                        }
                    }
                });

                $("body").mousemove(function (e) {
                    if (!e) { e = window.event; }
                    if (mousedown) { e.preventDefault(); }
                    moveit(e.clientX, e.clientY);
                });
            });
        }
    };
    $.fn.dragable = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.dragable');
        }

    };
})(jQuery);