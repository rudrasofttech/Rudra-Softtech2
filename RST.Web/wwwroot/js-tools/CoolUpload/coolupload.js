(function ($) {

    $.Loadingdotdotdot = function (el, options) {

        var base = this;

        base.$el = $(el);

        base.$el.data("Loadingdotdotdot", base);

        base.dotItUp = function ($element, maxDots) {
            if ($element.text().length == maxDots) {
                $element.text("");
            } else {
                $element.append(".");
            }
        };

        base.stopInterval = function () {
            clearInterval(base.theInterval);
        };

        base.init = function () {

            if (typeof (speed) === "undefined" || speed === null) speed = 300;
            if (typeof (maxDots) === "undefined" || maxDots === null) maxDots = 3;

            base.speed = speed;
            base.maxDots = maxDots;

            base.options = $.extend({}, $.Loadingdotdotdot.defaultOptions, options);
            base.$el.append($("<span class='loader'></span>"));

            base.$dots = base.$el.find(".loader");
            base.theInterval = setInterval(base.dotItUp, base.options.speed, base.$dots, base.options.maxDots);

        };

        base.init();

    };

    $.Loadingdotdotdot.defaultOptions = {
        speed: 300,
        maxDots: 3
    };

    $.fn.Loadingdotdotdot = function (options) {

        if (typeof (options) == "string") {
            var safeGuard = $(this).data('Loadingdotdotdot');
            if (safeGuard) {
                safeGuard.stopInterval();
            }
        } else {
            return this.each(function () {
                (new $.Loadingdotdotdot(this, options));
            });
        }

    };

})(jQuery);

(function addXhrProgressEvent($) {
    var originalXhr = $.ajaxSettings.xhr;
    $.ajaxSetup({
        progress: function () { },
        xhr: function () {
            var req = originalXhr(), that = this;
            if (req) {
                if (typeof req.addEventListener == "function") {
                    req.addEventListener("progress", function (evt) {
                        that.progress(evt);
                    }, false);
                }
            }
            return req;
        }
    });
})(jQuery);
var guid = (function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
    }
    return function () {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
               s4() + '-' + s4() + s4() + s4();
    };
})();
(function ($) {

    var methods = {
        clean: function () {
            return this.each(function () {
                var selObj = $(this);
                selObj.find("input[type=file]").val("");
                $("#" + selObj.data("previewid")).html("");
            });
        },
        fullupload: function () {
            return this.each(function () {
                var selObj = $(this);
                selObj.data("uploadstatus", "idle");
                var uploadhandler = selObj.data("uploadhandler");
                var generatename = selObj.data("generatename");
                var fileuploadcomplete = selObj.data("onfileuploadcomplete");
                var fileuploadsuccess = selObj.data("onfileuploadsuccess");
                var fileuploadremove = selObj.data("onfileuploadremove");
                var multiple = selObj.data("multiple");
                var fileremoveallowed = selObj.data("fileremoveallowed");
                $("#" + selObj.data("previewid")).data("uploadstatus", "working");
                if (multiple) {
                    selObj.find("input[type=file]").attr("multiple", "multiple");
                }
                var filearr = [];

                selObj.find("input[type=file]").bind("change", function () {
                    selObj.data("uploadstatus", "working");
                    for (i = 0; i < this.files.length; i++) {
                        filearr.push(this.files[i]);
                    }
                    selObj.find("input[type=file]").val("");
                    uploadWorker();
                });

                selObj.find("input[type=file]").bind("click", function (event) {
                    if (!selObj.data("multiple")) {
                        if ($("#" + selObj.data("previewid") + " > .file").length > 0) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }
                });


                var uploadWorker = function () {

                    while ((file = filearr.pop()) != null) {
                        var fileuploadremovetemp = "";
                        var fileuploadsuccesstemp = "";
                        //perform validation with type of file
                        if (selObj.data("validtype").indexOf(file.type) == -1 && selObj.data("validtype") != "") { continue; }
                        if (file.size > (parseInt(selObj.data("filesizelimit"), 0) * 1048576)) { continue; }
                        var d = guid();
                        var listitem = $("<div class='file' id='" + d + "' uploadstatus='working'></div>");
                        listitem.data("uploadstatus", "working");
                        if (fileremoveallowed) {
                            if (fileuploadremove == undefined || fileuploadremove == "") {
                                fileuploadremovetemp = "";
                            }
                            else {
                                fileuploadremovetemp = fileuploadremove + "('" + d + "')";
                            }
                            var fileremove = $("<button class='remove' data-previewid='" + selObj.data("previewid") + "' onclick=\"" + fileuploadremovetemp + "\">&times;</button>");
                            fileremove.click(function () {
                                $(this).parent().remove();

                                if ($("#" + selObj.data("previewid") + " > .file").length == 0) {
                                    selObj.data("uploadstatus", "idle");
                                }
                                else {
                                    selObj.data("uploadstatus", "complete");
                                    $("#" + selObj.data("previewid") + " > .file").each(function () {
                                        if ($(this).data("uploadstatus") == "working") {
                                            selObj.data("uploadstatus", "working");
                                        }
                                    });
                                }
                            });
                            listitem.append(fileremove);
                        }
                        if (fileuploadsuccess == undefined || fileuploadsuccess == "") {
                            fileuploadsuccesstemp = "";
                        } else {
                            fileuploadsuccesstemp = fileuploadsuccess + "(this.value, \"" + d + "\");";
                        }
                        var filepathhdn = $("<input type='hidden' name='file' value='' style='opacity:0;' onchange='" + fileuploadsuccesstemp + "'/>");
                        listitem.append(filepathhdn);

                        $("#" + selObj.data("previewid")).append(listitem);
                        listitem.Loadingdotdotdot({
                            "speed": 400,
                            "maxDots": 3
                        });
                        var data = new FormData();
                        data.append("action", "fullupload");
                        data.append("generatename", generatename);
                        data.append("index", d);
                        data.append("uploadpath", selObj.data("uploadpath"));
                        data.append(0, file);

                        $.ajax({
                            url: uploadhandler,
                            data: data,
                            type: "POST",
                            cache: false,
                            dataType: 'json',
                            processData: false, // Don't process the files
                            contentType: false,
                            success: function (result) {
                                if (result.status) {
                                    $("#" + selObj.data("previewid") + " #" + result.index + " > .loader").remove();
                                    if (result.filetype == ".jpg" || result.filetype == ".jpeg" || result.filetype == ".gif" || result.filetype == ".png" || result.filetype == ".bmp") {
                                        $("#" + selObj.data("previewid") + " #" + result.index).css("background-image", "url(" + result.filepath + ")");
                                    }
                                    else {
                                        $("#" + selObj.data("previewid") + " #" + result.index).addClass("filesuccess");
                                        $("#" + selObj.data("previewid") + " #" + result.index).append($("<a target='_blank' href='" + result.filepath + "'>" + result.filetype + "</a>"));
                                    }
                                    $("#" + selObj.data("previewid") + " #" + result.index).find("input[type=hidden]").val(result.filepath).change();
                                    $("#" + selObj.data("previewid") + " #" + result.index).data("uploadstatus", "success");
                                    $("#" + selObj.data("previewid") + " #" + result.index).removeAttr("uploadstatus");
                                }
                                else {
                                    $("#" + selObj.data("previewid") + " #" + result.index + " > .loader").remove();
                                    $("#" + selObj.data("previewid") + " #" + result.index).addClass("fileerror");
                                    $("#" + selObj.data("previewid") + " #" + result.index).attr("title", result.message);
                                    $("#" + selObj.data("previewid") + " #" + result.index).data("uploadstatus", "error");
                                    $("#" + selObj.data("previewid") + " #" + result.index).attr("uploadstatus", "error");
                                    $("#" + selObj.data("previewid") + " #" + result.index).data("errormessage", result.message);
                                }
                                if ($("#" + selObj.data("previewid") + " > .file[uploadstatus='working']").length == 0) {
                                    selObj.data("uploadstatus", "complete");
                                    if (fileuploadcomplete != undefined) {
                                        if (fileuploadcomplete != "") {
                                            eval(fileuploadcomplete + "()");
                                        }
                                    }
                                }
                            },
                            progress: function (evt) {
                                if (evt.lengthComputable) {
                                    console.log("Loaded " + parseInt((evt.loaded / evt.total * 100), 10) + "%");
                                }
                                else {
                                    console.log("Length not computable.");
                                }
                            },
                            error: function (err) { console.log(err); }
                        });
                        //while (start < size) {
                        //    //push the fragments to an array
                        //    fileobj.blobs.push(file.slice(start, end));
                        //    start = end;
                        //    end = start + bytes_per_chunk;
                        //}
                    }
                };
            });

        }
    };

    $.fn.coolupload = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.coolupload');
        }
    };
})(jQuery);