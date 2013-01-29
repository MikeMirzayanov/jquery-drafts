(function ($) {
    var textareasToListen = [];
    var buttonsToListen = [];
    var alertedOnFail = false;
    var consecutiveFailCount = 0;
    
    var updateButtonsPosition = function() {
        $.each(textareasToListen, function(index, textarea) {
            var button = buttonsToListen[index];
            button.css("top", textarea.position().top + 8);
            button.css("left", textarea.position().left + textarea.get(0).clientWidth - button.outerWidth() - 6);
        });
    };
    
    setInterval(updateButtonsPosition, 200);

    $.fn.drafts = function (options) {
        var settings = $.extend({
            'textDrafts':'Drafts',
            'textUseIt':'Use it',
            'url':'/data/drafts.php',
            'pollDelay': 5000,
            'showDelay': 2500,
            'saveErrorMessage': "Can't save draft. Possibly connection is lost or session is expired. Reload page?"
        }, options);
        
        var textareas = this;
        setTimeout(function() {
            textareas.each(function () {
                var textarea = $(this);
                if (textarea.parent()[0].tagName.toLowerCase() === "arclones") {
                    return;
                }
                
                if ($(".drafts-prototype").length === 0) {
                    $("<div class=\"drafts-prototype drafts-show-drafts\"><span class=\"drafts-button\">"
                        + settings["textDrafts"]
                        + "</span></div>").appendTo($("body"));
                }

                if ($(".drafts-popup").length === 0) {
                    $("<div class=\"drafts-popup\"><div class=\"drafts-close\">&times;</div><h1>"
                        + settings["textDrafts"]
                        + "</h1><div class=\"drafts-entries\"></div></div>").appendTo($("body"));
                }

                if (textarea.prop("tagName").toLowerCase() != "textarea") {
                    $.error("jquery.drafts.js can be used only for textareas, but " + textarea.prop("tagName").toLowerCase() + " found.");
                }

                if (!textarea.attr("data-drafts-id")) {
                    $.error("jquery.drafts.js requires textarea to have attribute data-drafts-id.");
                }

                var id = textarea.attr("data-drafts-id");

                var button = $(".drafts-prototype").clone()
                    .removeClass("drafts-prototype")
                    .css("opacity", "0.2");

                button.mouseover(function () {
                    button.css("opacity", "1.0");
                });

                button.mouseleave(function () {
                    button.css("opacity", "0.2");
                });

                button.click(function () {
                    var popup = $(".drafts-popup");
                    var entries = popup.find(".drafts-entries");
                    $.post(settings["url"], {action: 'get', id: id}, function(items) {
                        entries.empty();
                        $.each(items, function(index, item) {
                            $("<pre class='drafts-entry-body'></pre>").text(item).appendTo(entries);
                            $("<div class='drafts-entry-actions'><span class='drafts-button'>" + settings["textUseIt"] + "</span></div>").appendTo(entries);
                        });
                        entries.find(".drafts-button").click(function () {
                            textarea.val($(this).parent().prev().text());
                            $(".drafts-popup").fadeOut();
                        });
                        popup.show();
                        popup.css("top", pageYOffset);
                    }, "json");
                });

                $(textarea.parent()).append(button);

                button.css("position", "absolute");
                
                textareasToListen.push(textarea);
                buttonsToListen.push(button);
                updateButtonsPosition();

                $(".drafts-popup .drafts-close").click(function () {
                    $(".drafts-popup").fadeOut();
                });
                
                window.setInterval(function() {
                    var text = textarea.val();
                    $.post(settings["url"], {action: 'put', id: id, text: text}, function(response) {
                        if (response === "OK") {
                            consecutiveFailCount = 0;
                        } else {
                            ++consecutiveFailCount;
                            if (consecutiveFailCount >= 5 * textareasToListen.length && !alertedOnFail) {
                                alertedOnFail = true;
                                if (confirm(settings["saveErrorMessage"])) {
                                    location.reload();
                                }
                            }
                        }
                    }, "json").fail(function () {
                        ++consecutiveFailCount;
                        if (consecutiveFailCount >= 5 * textareasToListen.length && !alertedOnFail) {
                            alertedOnFail = true;
                            if (confirm(settings["saveErrorMessage"])) {
                                location.reload();
                            }
                        }
                    });
                }, settings["pollDelay"]);
            });
        }, settings["showDelay"]);

        return this;
    };
})(jQuery);
