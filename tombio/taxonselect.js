(function (exports) {

    "use strict";

    exports.control = function () {


        var mainDiv = $('<div/>');
        mainDiv.css("background-color", "yellow");
        var textFiler = $('<input/>').addClass("ui-widget ui-widget-content ui-corner-all");
        textFiler.css("margin", "10");
        mainDiv.append(textFiler)

        return mainDiv;
    }
})(this.taxonselect = {})