(function ($, tbv) {
    "use strict";

    //This is the base prototype for visualisations and should not contain any
    //GUI framework dependent stuff, e.g. jQuery UI or D3.
    //It should be just plain HTML5 and jQuery.
    //It's purpose is to carry out some common initialisation stuff that
    //needen't be repeated in every visualisation.

    var visP = tbv.v.visP = {};

    visP.initP = function () {

        var parent = tbv.gui.main.divVis;

        this.metadata = {};

        $("<div>").attr("id", this.visName).css("display", "none").appendTo($(parent));
        this.cssSel = parent + " > #" + this.visName;

        //Initialise visualisation-specific state object for each taxon
        var _this = this;
        tbv.d.taxa.forEach(function (taxon) {
            taxon.visState[_this.visName] = {};
        })

        //Fire the visualisations own initialisation function.
        this.initialise();
    }

})(jQuery, this.tombiovis);
