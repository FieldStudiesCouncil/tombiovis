
(function ($, core) {

    //Template visualisation that inherits from visP.
    "use strict";

    var visName = "visT";
    var exports = core[visName] = {};

    exports.Obj = function (parent, contextMenu, core) {

        core.visP.Obj.call(this, visName, parent, contextMenu, core);

        //Initialise the meta data
        this.metadata.title = "Template visualisation";
        this.metadata.authors = null;
        this.metadata.year = null;
        this.metadata.publisher = null;
        this.metadata.location = null;
        this.metadata.contact = null;
        this.metadata.version = null;
    }
    exports.Obj.prototype = Object.create(core.visP.Obj.prototype);

    exports.Obj.prototype.initialise = function () {

        var _this = this;

        //Reset this value if control can work with character state input controls
        this.charStateInput = true;

        //Help files
        this.helpFiles = [
            //tombiopath + "vis4/vis4Help.html",
            //tombiopath + "common/imageGroupHelp.html",
        ]

        //Replace the following
        this.div.append("<h2>" + this.visName + " can work with character state input controls</h2>")
    }

    exports.Obj.prototype.refresh = function () {

        var _this = this;

        //Replace the following
        this.div.append("<p>Refresh fired " + Date() + "</p>")

        //Consider including
        this.fireRefresh();
    }

})(jQuery, this.tombiovis)