function recordAction(action, name, id, other, sync) {
    var item = { d: escape(actionData(action, name, id, other)) };
    $.ajax({
        type: 'post',
        url: '[rooturl]/handlers/recordaction.ashx',
        data: item,
        success: function (data) {
            var d = eval('(' + data + ')');
            //console.log(d);
            if (d.Success) {
                if (d.Action != null) {
                    if (d.Action.Name == "AskSubscription") {
                        if (askSubscription != undefined) {
                            askSubscription();
                        }
                    } else if (d.Action.Name == "AuthenticateVisitor") {
                        if (authenticateVisitor != undefined) {
                            authenticateVisitor(null);
                        }
                    }
                    else if (d.Action.Name == "StartChat") {
                        if (startChat != undefined) {
                            startChat();
                        }
                    }
                }
            }
            else {
                console && console.log(d.Message);
            }
        },
        error: function (d) {
            console && console.log(d);
        },
        dataType: 'text',
        async: sync
    });
}
function actionData(action, name, id, other) {
    var xml = $("<r></r>");
    xml.append($("<v></v>").html(window.location.href));
    xml.append($("<a></a>").html(action));
    xml.append($("<n></n>").html(name));
    xml.append($("<i></i>").html(id));
    xml.append($("<o></o>").html(other));
    return "<r>" + xml.html() + "</r>";
}
var heartBeatInterval = null;
$(document).ready(function () {
    try {
        heartBeatInterval = setInterval(function () {
            recordAction("heartbeat", "", "", "");
        }, 4000);

        $(".recordHover").hover(function (e) {
            recordAction("hover", $(this).attr("name"), $(this).attr("id"), $(this).attr("title"), true);
        });

        $(".recordClick").click(function (e) {
            recordAction("click", $(this).attr("name"), $(this).attr("id"), $(this).attr("title"), true);
        });

        $(".recordChange").change(function (e) {
            recordAction("change", $(this).attr("name"), $(this).attr("id"), $(this).attr("title"), true);
        });

        $(".recordFocus").focus(function (e) {
            recordAction("focus", $(this).attr("name"), $(this).attr("id"), "", true);
        });

        $(window).scroll(function (e) {
            var sdis = $(window).scrollTop() + $(window).height();
            var halfway = $(document).height();

            if (sdis > ($(document).height() - 50)) {
                recordAction("scroll", "Window", "", "Scroll to bottom of page", false);
            }
            else if (sdis > (halfway - 50) && sdis < (halfway + 100)) {
                recordAction("scroll", "", "", "Scroll to half", false);
            }
            else if (sdis < 200) { recordAction("scroll", "Window", "", "top of page", false); }
        });

        $(window).blur(function (e) {
            recordAction("blurred", "", "", "Visitor is not looking at the page", false);
        });

        $(window).focus(function (e) {
            recordAction("focused", "", "", "Visitor focused on page", true);
        });

        $("body").bind({
            copy: function () {
                recordAction("copy", "", "", "", true);
            },
            paste: function () {
                recordAction("paste", "", "", "", true);
            },
            cut: function () {
                recordAction("cut", "", "", "", true);
            }
        });

    } catch (err) { console && console.log(err); }
});