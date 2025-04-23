(function ($) {
    var methods = {
        update: function () {
            return this.each(function () {
                if ($(this).attr("data-source") != "") {
                    methods.worker($(this).attr("data-source"), 0, $(this));
                }
            });
        },
        init: function () {
            return this.each(function () {
                var selObject = $(this);
                var ds = selObject.attr("data-source");
                var frequency = 0;
                if (selObject.attr("data-updatefrequency") != undefined && selObject.attr("data-updatefrequency") != "") {
                    frequency = parseInt(selObject.attr("data-updatefrequency"), 10);
                }
                if (ds != "") {
                    methods.worker(ds, frequency, selObject);
                }
            });
        },
        worker: function (source, frequency, obj) {
            $.get(source, function (data) {
                for (var prop in data) {
                    if (data.hasOwnProperty(prop)) {
                        if (obj.attr("data-bounditem") == prop) {
                            obj.html(data[prop]);
                            break;
                        }
                        else {
                            obj.find("[data-bounditem = " + prop + "]").html(data[prop]);
                        }
                    }
                }
                if (frequency > 0) {
                    setTimeout(function(){ methods.worker(source, frequency, obj) }, frequency );
                }
            });
        }
    };

    $.fn.dataupdate = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.dataupdate');
        }
    };
})(jQuery);