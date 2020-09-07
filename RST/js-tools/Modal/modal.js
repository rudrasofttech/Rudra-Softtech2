(function ($) {
    var methods = {
        prompt: function (args) {
            var defaultVal = {
                Message: '',
                OkText: '<u>O</u>K',
                Action: function (val) { },
                OnInit: null,
                OnShow: null,
                OnClose: null
            };
            var obj = $.extend(defaultVal, args);
            if (obj.OnInit != null) { obj.OnInit(); }
            var malert = $("<div id='rst-alert' />");
            malert.appendTo($("body"));
            var mcontent = $("<div id='rst-alert-content'></div>");
            mcontent.appendTo(malert);
            var mmsg = $("<div id='rst-alert-msg'></div>");
            mmsg.appendTo(mcontent);
            var ipt = $("<input id='rst-alert-input' style='display: block;' />");

            var mctrl = $("<div id='rst-alert-ctrl'></div>");
            mctrl.appendTo(mcontent);
            var okbtn = $("<button id='rst-alert-okbtn' accesskey='O' autofocus='autofocus'>" + obj.OkText + "</button>");
            okbtn.appendTo(mctrl);
            mmsg.html(obj.Message);
            ipt.appendTo(mmsg);
            malert.fadeIn({ complete: function () {
                if (obj.OnShow != null) { obj.OnShow(); }
            }
            });
            mcontent.css({ top: (malert.height() / 2) - (mcontent.height() / 2), left: (malert.width() / 2) - (mcontent.width() / 2) })
            okbtn.focus();
            okbtn.click(function () {
                obj.Action(ipt.val());
                malert.remove();
                if (obj.OnClose != null) { obj.OnClose(); }
            });
        },
        confirm: function (args) {
            var defaultVal = {
                Message: '',
                YesText: '<u>Y</u>es',
                NoText: '<u>N</u>o',
                CancelText: '<u>C</u>ancel',
                Action: function (val) { },
                OnInit: null,
                OnShow: null,
                OnClose: null
            };
            var obj = $.extend(defaultVal, args);
            if (obj.OnInit != null) { obj.OnInit(); }
            var malert = $("<div id='rst-alert' />");
            malert.appendTo($("body"));
            var mcontent = $("<div id='rst-alert-content'></div>");
            mcontent.appendTo(malert);
            var mmsg = $("<div id='rst-alert-msg'></div>");
            mmsg.appendTo(mcontent);
            var mctrl = $("<div id='rst-alert-ctrl'></div>");
            mctrl.appendTo(mcontent);
            var yesbtn = $("<button id='rst-alert-yesbtn' accesskey='Y' autofocus='autofocus'>" + obj.YesText + "</button>");
            yesbtn.appendTo(mctrl);
            var nobtn = $("<button id='rst-alert-nobtn' accesskey='N'>" + obj.NoText + "</button>");
            nobtn.appendTo(mctrl);
            var cancelbtn = $("<button id='rst-alert-cancelbtn' accesskey='C'>" + obj.CancelText + "</button>");
            cancelbtn.appendTo(mctrl);
            mmsg.html(obj.Message);
            malert.fadeIn({ complete: function () {
                if (obj.OnShow != null) { obj.OnShow(); }
            }
            });
            mcontent.css({ top: (malert.height() / 2) - (mcontent.height() / 2), left: (malert.width() / 2) - (mcontent.width() / 2) })
            yesbtn.focus();
            yesbtn.click(function () {
                obj.Action(true);
                malert.remove();
                if (obj.OnClose != null) { obj.OnClose(); }
            });
            nobtn.click(function () {
                obj.Action(false);
                malert.remove();
                if (obj.OnClose != null) { obj.OnClose(); }
            });

            cancelbtn.click(function () {
                malert.remove();
                if (obj.OnClose != null) { obj.OnClose(); }
            });
        },
        alert: function (args) {
            var defaultVal = {
                Message: '',
                OkText: '<u>O</u>K',
                OnInit: null,
                OnShow: null,
                OnClose: null
            };
            var obj = $.extend(defaultVal, args);
            if (obj.OnInit != null) { obj.OnInit(); }
            var malert = $("<div id='rst-alert' />");
            malert.appendTo($("body"));
            var mcontent = $("<div id='rst-alert-content'></div>");
            mcontent.appendTo(malert);
            var mmsg = $("<div id='rst-alert-msg'></div>");
            mmsg.appendTo(mcontent);
            var mctrl = $("<div id='rst-alert-ctrl'></div>");
            mctrl.appendTo(mcontent);
            var okbtn = $("<button id='rst-alert-okbtn' accesskey='O' autofocus='autofocus'>" + obj.OkText + "</button>");
            okbtn.appendTo(mctrl);
            mmsg.html(obj.Message);
            malert.fadeIn({ complete: function () {
                if (obj.OnShow != null) { obj.OnShow(); }
            }
            });
            mcontent.css({ top: (malert.height() / 2) - (mcontent.height() / 2), left: (malert.width() / 2) - (mcontent.width() / 2) })
            okbtn.focus();
            okbtn.click(function () {
                malert.remove();
                if (obj.OnClose != null) { obj.OnClose(); }
            });
        },
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
                Next: '&rsaquo;',
                Prev: '&lsaquo;',
                Width: 600,
                Height: 350,
                CloseOnEsc: true,
                ShowClose: true,
                CloseHandle: null,
                OnInit: null,
                OnShow: null,
                OnClose: null
            };

            var obj = $.extend(defaultVal, options);

            if (obj.OnInit != null) {
                obj.OnInit();
            }

            var loadimg = $("div#rst-modal > div#rst-modal-loadimg");

            var mcontainer = $("#rst-modal");
            var mcontent = $("#rst-modal-shadow > #rst-modal-content");
            var mshadow = $("#rst-modal > div#rst-modal-shadow");
            var closebtn = $("#rst-modal > button#rst-modal-close");
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
                if ((/Windows Phone/).test(navigator.userAgent)) {
                    $(window).scrollTop(0);
                }
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

                    image.attr("src", source.attr("href"));
                    mcontent.css("width", "90%");
                    image.appendTo(mcontent);
                    mcontent.addClass("rst-modal-imagecontent");
                    image.bind("error", function () {
                        loadimg.hide();
                        mcontent.html("Requested image does not exist");
                        mcontent.css("display", "inline-block");
                        mcontent.css("background-color", "#fff");
                        mcontent.css("padding", "10px");
                        mcontent.width(opts.Width);
                        positionmodal();
                        mtitle.html("").hide();
                        mcontent.animate({ opacity: 1 }, { complete: function () {
                            positionmodal();
                            if (opts.OnShow != null) {
                                opts.OnShow(mcontainer.data("currentindex"));
                            }
                        }
                        });
                    });
                    image.bind("load", function () {
                        loadimg.hide();
                        if (source.attr("title") != undefined && source.attr("title") != "") {
                            mtitle.html(source.attr("title")).show();
                        }
                        //fix for IE, since max-height does not work well with IE
                        if ($(this).height() >= ($(window).height() * 90 / 100)) {
                            $(this).height(($(window).height() * 90 / 100) - (mcontent.outerHeight(true) - mcontent.height()) );
                        }
                        mcontent.width($(this).outerWidth());
                        positionmodal();
                        mcontent.animate({ opacity: 1 }, { complete: function () {
                            if (opts.OnShow != null) {
                                opts.OnShow(mcontainer.data("currentindex"));
                            }
                        }
                        });
                    });

                }
                else if (type == "iframe") {
                    props = {
                        width: targetw,
                        height: targeth,
                        opacity: 1
                    };
                    loadimg.hide();
                    mcontent.addClass("rst-modal-iframecontent");
                    mcontent.html("<iframe src='" + source.attr("href") + "' frameborder='0' vspace='0' hspace='0' webkitallowfullscreen='' mozallowfullscreen='' allowfullscreen='' scrolling='auto' />");
                    if (source.attr("title") != undefined && source.attr("title") != "") {
                        mtitle.html(source.attr("title")).show();
                    }
                    mcontent.css(props);
                    positionmodal();
                    mcontent.animate({ opacity: 1 }, { queue: false, complete: function () {
                        if (opts.OnShow != null) {
                            opts.OnShow(0);
                        }
                    }
                    });
                }
                else if (type == "inline") {
                    loadimg.hide();
                    mcontent.addClass("rst-modal-inlinecontent");
                    mcontainer.appendTo($(source.attr("href")).parent());
                    var content = $(source.attr("href")).show().appendTo(mcontent);
                    props = {
                        width: targetw,
                        height: targeth
                    };

                    if (source.attr("title") != undefined && source.attr("title") != "") {
                        mtitle.html(source.attr("title")).show();
                    }
                    mcontent.css(props);
                    positionmodal();
                    mcontent.animate({ opacity: 1 }, { queue: false, complete: function () {
                        if (opts.OnShow != null) {
                            opts.OnShow(0);
                        }
                    }
                    });

                }
                else if (type == "ajax") {
                    props = {
                        width: targetw,
                        height: targeth
                    };
                    loadimg.show();

                    mcontent.addClass("rst-modal-ajaxcontent");
                    var loadrqs = $.get(source.attr("href"), function (data) {
                        loadimg.hide();
                        mcontent.html(data);
                        if (source.attr("title") != undefined && source.attr("title") != "") {
                            mtitle.html(source.attr("title")).show();
                        }
                        mcontent.css(props);
                        positionmodal();
                        
                        mcontent.animate({ opacity: 1 }, { queue: false, complete: function () {
                            if (opts.OnShow != null) {
                                opts.OnShow(0);
                            }
                        }
                        });

                    }).fail(function () {
                        loadimg.hide();
                        mcontent.html("The request cannot be processed at this time.");
                        if (source.attr("title") != undefined && source.attr("title") != "") {
                            mtitle.html(source.attr("title")).show();
                        }
                        mcontent.css(props);
                        positionmodal();
                        mcontent.animate({ opacity: 1 }, { queue: false, complete: function () {
                            if (opts.OnShow != null) {
                                opts.OnShow(0);
                            }
                        }
                        });
                    });
                }
            };

            var closepopup = function (event) {
                if (event != null) { event.preventDefault(); event.stopPropagation(); }
                mtitle.html("").hide();

                mcontainer.hide().fadeOut({ complete: function () {
                    if (mcontainer.data("modalbox").options.Type == 'inline') {
                        $("#rst-modal > #rst-modal-shadow > #rst-modal-content").children().hide();
                        $("#rst-modal > #rst-modal-shadow > #rst-modal-content").children().appendTo(mcontainer.parent());
                        mcontainer.appendTo($("body"));
                    }
                    else {
                        $("#rst-modal > #rst-modal-shadow").children().remove();
                    }
                }
                });

                if (mcontainer.data("modalbox").options.OnClose != null) { mcontainer.data("modalbox").options.OnClose(); }
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
                    if (mcontainer.data("modalbox").options.CloseHandle != null) {
                        try {
                            mcontainer.data("modalbox").options.CloseHandle.unbind('click', closepopup);
                            mcontainer.data("modalbox").options.CloseHandle.click(closepopup);
                        }
                        catch (err) { console && console.log(err); }
                    }
                    mcontainer.data("gallerylength", 0);
                    var grpname = selObj.attr("rel");
                    if (grpname != "") {
                        mcontainer.data("gallerylength", $("[rel = '" + grpname + "']").length);
                        mcontainer.data("galleryname", grpname);
                        $("[rel = '" + grpname + "']").each(function (i) { var cur = $(this); cur.attr("rst-modal-index", i); });
                    }
                    closebtn.show();
                    if (mcontainer.data("modalbox").options.ShowClose == false) {
                        closebtn.hide();
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

