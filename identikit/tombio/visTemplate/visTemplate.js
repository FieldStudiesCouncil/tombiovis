
(function ($, tbv) {

    //Template visualisation that delegates via prototype to visP.
    "use strict";

    var visName = "visTemplate";
    
    //For actual visualisation, comment out first line blow and replace 
    //the line below that.
    var visT = tbv.templates[visName] = Object.create(tombiovis.v.visP);
    //var visT = tbv.v.visualisations[visName] = Object.create(tombiovis.v.visP);

    visT.visName = visName;

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

        //Help files
        this.helpFiles = [
            //tbv.opts.tombiopath + "vis4/vis4Help.html",
            //tbv.opts.tombiopath + "common/imageGroupHelp.html"
        ]

        //Replace the following
        d3.select("#" + this.visName).html("Template vis");

        //Mark as initialised
        this.initialised = true;

        //Check interface
        //tbv.f.checkInterface(visName, tbv.templates.visTemplate, tbv.v.visualisations[visName]);
    }

    visT.refresh = function () {

        var _this = this;

        //Replace the following
        d3.select("#" + this.visName).html("Vis - refreshed");
    }

    visT.urlParams = function (params) {
        //Function to initialise state of visualisation from parameters

        //params - array of parameters passed in URL

        var _this = this;

        //Replace the following to initialise visualisation
        //from parameters.
        console.log("URL parameters:", params);
    }

    visT.show = function () {
        //Responsible for showing all gui elements of this tool
    }

    visT.hide = function () {
        //Responsible for hiding all gui elements of this tool
    }

})(jQuery, this.tombiovis)