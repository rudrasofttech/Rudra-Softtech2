(function ($) {
    var methods = {
        close: function (args) {
            return this.each(function () {
                var mcontainer = $("#rst-modal");
                mcontainer.hide().fadeOut({ complete: function () {
                    if (mcontainer.data("modalbox").options.Type == 'inline') {
                        $("#rst-modal > #rst-modal-shadow > #rst-modal-content").children().hide();
                        $("#rst-modal > #rst-modal-shadow > #rst-modal-content").children().appendTo(mcontainer.parent());
                        mcontainer.appendTo($("body"));
                    }
                    $("#rst-modal > #rst-modal-shadow").children().hide();
                }
                });

                if (mcontainer.data("modalbox").options.OnClose != null) { mcontainer.data("modalbox").options.OnClose(); }
                jQuery.removeData(mcontainer);
            });
        },
        init: function (options) {
            var defaultVal = {
                Type: 'image',
                Close: '&times;',
                Next: '›',
                Prev: '‹',
                Width: 600,
                Height: 350,
                ShowClose: true,
                CloseOnEsc: true
            };

            var obj = $.extend(defaultVal, options);

            var loadimg = $("div#rst-modal > div#rst-modal-loadimg");
            var closebtn = $("#rst-modal > button#rst-modal-close");
            var mcontainer = $("#rst-modal");
            var mcontent = $("#rst-modal-shadow > #rst-modal-content");
            var mshadow = $("#rst-modal > div#rst-modal-shadow");
            var nextbtn = $("#rst-modal > button#rst-modal-nav-next");
            var prevbtn = $("#rst-modal > button#rst-modal-nav-prev");
            var mtitle = $("#rst-modal > div#rst-modal-title");
            var scrollTopPos = 0;

            var movenext = function (event) {
                if (event != null) {
                    event.stopPropagation();
                }

                if (mcontainer.data("currentindex") < (mcontainer.data("gallerylength") - 1)) {
                    mcontainer.data("currentindex", mcontainer.data("currentindex") + 1);
                    if (mcontainer.data("currentindex") == (mcontainer.data("gallerylength") - 1)) { nextbtn.hide(); prevbtn.show(); }
                    else if (mcontainer.data("currentindex") == 0) { nextbtn.show(); prevbtn.hide(); }
                    else { nextbtn.show(); prevbtn.show(); }

                    mcontent.stop(true, true).animate({ opacity: 0 }, { complete: function () {
                        drawpopup(mcontainer.data("modalbox").options.Type, $("[rel = '" + mcontainer.data("galleryname") + "' ][ rst-modal-index = '" + mcontainer.data("currentindex") + "']"));
                    }
                    });
                }
            };

            var moveprev = function (event) {
                if (event != null) {
                    event.stopPropagation();
                }
                if (mcontainer.data("currentindex") > 0) {
                    mcontainer.data("currentindex", mcontainer.data("currentindex") - 1);
                    if (mcontainer.data("currentindex") == (mcontainer.data("gallerylength") - 1)) { nextbtn.hide(); prevbtn.show(); }
                    else if (mcontainer.data("currentindex") == 0) { nextbtn.show(); prevbtn.hide(); }
                    else { nextbtn.show(); prevbtn.show(); }

                    mcontent.stop(true, true).animate({ opacity: 0 }, { complete: function () {
                        drawpopup(mcontainer.data("modalbox").options.Type, $("[rel = '" + mcontainer.data("galleryname") + "' ][ rst-modal-index = '" + mcontainer.data("currentindex") + "']"));
                    }
                    });
                }
            };

            var positionmodal = function () {
                if ((/Windows Phone/).test(navigator.userAgent)) { $(window).scrollTop(0); }
                mcontent = $("#rst-modal-content");
                mcontent.css("margin-top", (mcontent.outerHeight() / 2) * (-1));
                mcontent.css("margin-left", (mcontent.outerWidth() / 2) * (-1));
            };

            var drawpopup = function (type, source) {
                var w = $(window).width();
                var h = $(window).height();
                var targetw = mcontainer.data("modalbox").options.Width;
                var targeth = mcontainer.data("modalbox").options.Height;
                var opts = mcontainer.data("modalbox").options;
                var props = {};
                mtitle.html("").hide();
                mshadow.children().remove();
                mcontent = $("<div id='rst-modal-content'></div>");
                mcontent.appendTo(mshadow);

                if (type == "image") {
                    loadimg.show();
                    var image = $("<img />");
                    mcontent.addClass("rst-modal-imagecontent");
                    image.attr("src", source.attr("href"));
                    image.appendTo(mcontent);
                    
                    image.bind("load", function () {
                        loadimg.hide();
                        if (source.attr("title") != undefined && source.attr("title") != "") {
                            mtitle.html(source.attr("title")).show();
                        }
                        mcontent.width($(this).outerWidth());
                        positionmodal();
                        mcontent.animate({ opacity: 1 }, { });
                    });
                }
            };

            var closepopup = function (event) {
                if (event != null) { event.preventDefault(); event.stopPropagation(); }
                mtitle.html("").hide();
                mshadow.children().remove();
                mcontainer.hide().fadeOut({ complete: function () {
                    if (mcontainer.data("modalbox").options.Type == 'inline') {
                        $("#rst-modal > #rst-modal-shadow > #rst-modal-content").children().hide();
                        $("#rst-modal > #rst-modal-shadow > #rst-modal-content").children().appendTo(mcontainer.parent());
                        mcontainer.appendTo($("body"));
                    }
                }
                });

                jQuery.removeData(mcontainer);
            };

            if (mcontainer.length == 0) {
                nextbtn = $("<button id='rst-modal-nav-next' type='button'>" + obj.Next + "</button>");
                prevbtn = $("<button id='rst-modal-nav-prev' type='button'>" + obj.Prev + "</button>");
                mtitle = $("<div id='rst-modal-title' />")
                loadimg = $("<div id='rst-modal-loadimg'></div>");
                closebtn = $("<button id='rst-modal-close' type='button'>" + obj.Close + "</button>");
                mcontainer = $("<div id='rst-modal'></div>");
                mcontent = $("<div id='rst-modal-content'></div>");
                mshadow = $("<div id='rst-modal-shadow'></div>");

                prevbtn.appendTo(mcontainer);
                mtitle.appendTo(mcontainer);
                nextbtn.appendTo(mcontainer);
                closebtn.appendTo(mcontainer);

                loadimg.appendTo(mcontainer);
                mshadow.appendTo(mcontainer);
                mcontainer.appendTo($("body"));
                nextbtn.click(movenext);
                prevbtn.click(moveprev);

                closebtn.click(function (ev) { closepopup(ev); if ((/Windows Phone/).test(navigator.userAgent)) { $(window).scrollTop(scrollTopPos); } });
                $(document).keyup(function (e) {
                    if (e.keyCode == 27 && mcontainer.data("modalbox").options.CloseOnEsc) {
                        closepopup(null);
                        $(window).scrollTop(scrollTopPos);
                    }
                    if (e.keyCode == 37) {
                        if (prevbtn.is(":visible")) {
                            moveprev(null);
                        }
                    }
                    if (e.keyCode == 39) {
                        if (nextbtn.is(":visible")) {
                            movenext(null);
                        }
                    }
                });
                $(window).resize(function () { if (mcontainer.is(":visible")) { positionmodal(); } });
                $(window).scroll(function () {
                    scrollTopPos = $(window).scrollTop();
                    if (mcontainer.is(":visible")) { positionmodal(); }
                });
            }

            return this.each(function () {
                var selObj = $(this);
                var data = selObj.data('modalbox');
                if (!data) {
                    selObj.data('modalbox', { options: obj });
                }

                var openpopup = function (event) {
                    if (event != null) {
                        event.preventDefault();
                    }
                    mcontainer.data("modalbox", { options: selObj.data('modalbox').options });

                    mcontainer.data("gallerylength", 0);
                    var grpname = selObj.attr("rel");
                    if (grpname != "") {
                        mcontainer.data("gallerylength", $("[rel = '" + grpname + "']").length);
                        mcontainer.data("galleryname", grpname);
                        $("[rel = '" + grpname + "']").each(function (i) { var cur = $(this); cur.attr("rst-modal-index", i); });
                    }

                    if (mcontainer.data("gallerylength") > 0) {
                        nextbtn.show();
                        prevbtn.show();
                    } else {
                        nextbtn.hide();
                        prevbtn.hide();
                    }

                    if (selObj.attr("rst-modal-index") != "") {
                        mcontainer.data("currentindex", parseInt(selObj.attr("rst-modal-index"), 10));
                    }
                    else { mcontainer.data("currentindex", 0); }

                    if (mcontainer.data("gallerylength") > 0) {
                        if (mcontainer.data("currentindex") == (mcontainer.data("gallerylength") - 1)) { nextbtn.hide(); prevbtn.show(); }
                        else if (mcontainer.data("currentindex") == 0) { nextbtn.show(); prevbtn.hide(); }
                        else { nextbtn.show(); prevbtn.show(); }
                    }
                    if (!mcontainer.data("modalbox").options.ShowClose) { closebtn.hide(); }
                    else { closebtn.show(); }

                    mcontainer.fadeIn();
                    drawpopup(mcontainer.data("modalbox").options.Type, selObj);
                };
                selObj.click(openpopup);
            });
        }
    };
    $.fn.modalbox = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.modalbox');
        }
    };
})(jQuery);

