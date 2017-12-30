
(function ($, tbv) {

    //Template visualisation that delegates via prototype to visP.
    "use strict";

    var visName = "visT";
    var visT = tbv[visName] = Object.create(tbv.visP);
    var _this;

    visT.initialise = function () {

        var _this = this;

        //Initialise the meta data
        this.metadata.title = "Template visualisation";
        this.metadata.authors = null;
        this.metadata.year = null;
        this.metadata.publisher = null;
        this.metadata.location = null;
        this.metadata.contact = null;
        this.metadata.version = null;

        //Reset this value if control can work with character state input controls
        this.charStateInput = true;

        //Help files
        this.helpFiles = [
            //tbv.opts.tombiopath + "vis4/vis4Help.html",
            //tbv.opts.tombiopath + "common/imageGroupHelp.html"
        ]

        //Replace the following
        this.div.append("<h2>" + this.visName + " can work with character state input controls</h2>")
    }

    visT.refresh = function () {

        var _this = this;

        //Replace the following
        this.div.append("<p>Refresh fired " + Date() + "</p>")
    }

    visT.urlParams = function (params) {

        var _this = this;

        //Replace the following to initialise visualisation
        //from parameters.
        console.log("URL parameters:", params);
    }

})(jQuery, this.tombiovis)