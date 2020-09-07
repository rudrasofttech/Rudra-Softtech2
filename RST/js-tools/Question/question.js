(function ($) {
    var methods = {
        init: function (options) {
            var defaultVal = {
                Attempts: 1,
                OnAttempt: null,
                Label: { Exhausted: "Attempts Exhausted", Correct: "&#10004;", Wrong: "&#10007;" },
                Effect: true
            };

            var obj = $.extend(defaultVal, options);
            return this.each(function () {
                var selObj = $(this);
                var answers = selObj.find("li");
                var acount = 0;
                var label = $("<div class='rstlabel' />")
                selObj.append(label);
                var data = selObj.data('question');
                if (!data) {
                    selObj.data('question', { options: obj });
                }
                answers.each(function (index) {
                    var o = $(this);
                    o.addClass("rst-option");
                    o.click(function () {
                        if (acount >= selObj.data('question').options.Attempts) {
                            label.html(obj.Label.Exhausted);
                            label.fadeIn({ complete: function () {
                                setTimeout(function () { label.fadeOut(); }, 500);
                            }
                            });
                            return;
                        }
                        var ans = o.data("anwser");
                        var status = false;
                        if (ans == "correct") {
                            label.html(obj.Label.Correct);
                            label.fadeIn();
                            o.addClass("rst-success");
                            status = true;
                            try {
                                if (obj.Effect) {
                                    selObj.effect("bounce", { times: 2, distance: 10 }, 500, function () { });
                                }
                            } catch (err) { }
                        } else {
                            label.html(obj.Label.Wrong);
                            label.fadeIn();
                            o.addClass("rst-danger");
                            status = false;
                            try {
                                if (obj.Effect) {
                                    selObj.effect("shake", { times: 2, distance: 10 }, 500, function () { });
                                }
                            } catch (err) { }
                        }
                        acount = acount + 1;
                        if (selObj.data('question').options.OnAttempt != null) {
                            selObj.data('question').options.OnAttempt(index, acount, status);
                        }
                    });

                });
            });
        }
    };
    $.fn.question = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.modalbox');
        }
    };
})(jQuery);