function sendChatMessage() {
    var item = { message: $("#chatMessageTxt").val(), action: "push" };
    $.ajax({
        url: '[rooturl]/handlers/visitchatmaster.ashx',
        type: 'post',
        data: item,
        dataType: "json"
    }).done(function (msg) { $("#chatMessageTxt").val(""); $("#chatMessageTxt").focus(); fetchChatMessage(); }).fail(function (jqXHR, textStatus) {
        console.log("Request failed: " + textStatus);
    });
}

function fetchChatMessage() {
    $.ajax({
        url: "[rooturl]/handlers/visitchatmaster.ashx",
        type: 'post',
        data: { action: "fetch", mid: $("#visitChatWindow > #chatMessageList > .chatmessagebubble:last-child").attr("data-messageid") },
        dataType: "json",
        async: false
    }).done(function (msg) {
        
        
        for (var item in msg.ChatMessages) {
            var cm = msg.ChatMessages[item];
            var cmmbox = $("<div class='chatmessagebubble' />");
            cmmbox.attr("data-messageid", cm.ID);
            cmmbox.append($("<label class='sendername'></label>").html(cm.Name));
            cmmbox.append($("<label class='chatmessagedate'></label>").html(cm.SentDate));
            cmmbox.append($("<div class='chatmessage'></div>").html(performActionOnChatMessage(cm.Message)));
            cmmbox.appendTo($("#visitChatWindow > #chatMessageList"));
        }
        if (msg.ChatMessages.length > 0) {
            $("#visitChatWindow").show(); $("#chatMessageTxt").focus(); $("#visitChatWindowOff").hide();
            $("#chatMessageList").animate({ scrollTop: $("#chatMessageList")[0].scrollHeight }, "fast");
            $.titleAlert("(" + msg.ChatMessages.length + ") " + document.title, {
                requireBlur: false,
                stopOnFocus: true,
                duration: 0,
                interval: 1000
            });
        }
        
    }).fail(function (jqXHR, textStatus) {
        console.log("Request failed: " + textStatus);
    });
}

function performActionOnChatMessage(message) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    message = message.replace(exp, "<a href='$1'>$1</a>");
    return message;
}

$(document).ready(function () {
    $("#chatMessageTxt").keypress(function (event) {
        if (event.which == 13) {
            sendChatMessage();
        }
    });
    $("#visitChatWindowOff").click(function () { $("#visitChatWindow").show(); $("#chatMessageTxt").focus(); $("#visitChatWindowOff").hide(); });
    $("#chatCloseButton").click(function () { $("#visitChatWindow").hide(); $("#visitChatWindowOff").show(); });
    fetchChatMessage();
    setInterval(fetchChatMessage, 4000);
});