(function ($, tbv) {

    "use strict";

    //This is the base prototype for visualisations and should not contain any
    //GUI framework dependent stuff, e.g. jQuery UI or D3.
    //It should be just plain HTML5 and jQuery.

    var visP = tbv.v.visP = {};

    visP.initP = function (visName) {

        var parent = tbv.gui.main.divVis;
        var contextMenu = tbv.gui.main.contextMenu;

        this.visName = visName;
        this.contextMenu = contextMenu;
        this.div = $("<div>").attr("id", visName).css("display", "none").appendTo($(parent));
        this.cssSel = parent + " > #" + visName;

        var _this = this;

        //Initialise the metadata structure for visualisations.
        this.metadata = {};

        //Initialise state object for each taxon
        tbv.d.taxa.forEach(function (taxon) {
            taxon.visState[visName] = {};
        })

        //Fire the visualisations own initialisation function.
        this.initialise();
    }

})(jQuery, this.tombiovis);
