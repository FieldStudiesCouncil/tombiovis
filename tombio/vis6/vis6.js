
(function ($, tbv) {

    //Template visualisation that delegates via prototype to visP.
    "use strict";

    var visName = "vis6";
    var vis6 = tbv.v.visualisations[visName] = Object.create(tbv.v.visP);
    vis6.visName = visName;

    var taxonHeight = 30;
    var taxonPad = 5;
    var taxonSpace = 10;
    var taxonHorizontalMargin = 5;

    var _this;

    vis6.initialise = function () {

        var _this = this;

        //Initialise the meta data
        this.metadata.title = "Mobile key";
        this.metadata.authors = "Rich Burkmar";
        this.metadata.year = "2018";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Preston Montford, Shropshire";
        this.metadata.contact = "r.burkmar@field-studies-council.org";
        this.metadata.version = "1.0";

        //Help files
        this.helpFiles = [
            //tbv.opts.tombiopath + "vis6/vis6Help.html",
            //tbv.opts.tombiopath + "common/imageGroupHelp.html"
        ]

        //Replace the following
        
        //var $vis = $("#" + this.visName);
        //tbv.d.taxa.forEach(function (t, i) {
        //    var $tdiv = $("<div>").addClass("taxon")
        //        .css("padding", taxonPad)
        //        .css("height", taxonHeight)
        //        .css("left", taxonHorizontalMargin)
        //        .css("width", "calc(100% - " + (2 * taxonPad + 2 * taxonHorizontalMargin) + "px)")
        //        .css("top", i * (taxonHeight + taxonSpace + (2 * taxonPad)) + taxonSpace)
        //        .text(t.Taxon)
        //    $vis.append($tdiv)
        //})

        //Shares key input with several other multi-access keys
        var keyinput = tbv.opts.toolconfig[this.visName].keyinput;
        if (!tbv.gui.sharedKeyInput[keyinput]) {
            tbv.gui.sharedKeyInput[keyinput] = Object.create(tbv.gui[keyinput]);
            tbv.gui.sharedKeyInput[keyinput].init($(tbv.gui.main.divInput));
        }
        vis6.inputControl = tbv.gui.sharedKeyInput[keyinput];

        //Mark as initialised
        this.initialised = true;

        //Check interface
        tbv.f.checkInterface(visName, tbv.templates.visTemplate, tbv.v.visualisations[visName]);
    }

    vis6.refresh = function () {

        var _this = this;

        var sortedTaxa = [];
        tbv.d.taxa.forEach(function (taxon) {
            sortedTaxa.push(taxon);
        });
        tbv.f.sortTaxa(sortedTaxa);

        var mtU = d3.select("#" + this.visName).selectAll(".taxon")
            .data(sortedTaxa, function (d) { return d.Taxon; });
        var mtE = mtU.enter();

        //Initialize entering taxa.  
        //Create taxon grouping objects
        var mtM = mtE.append("div")
            .attr("class", "taxon")
            .attr("id", function (d) {
                return "vis6 " + d.Taxon;
            })   
            .style("padding", taxonPad + "px")
            //.style("height", taxonHeight + "px")
            .style("left", taxonHorizontalMargin + "px")
            .style("width", "calc(100% - " + (2 * taxonPad + 2 * taxonHorizontalMargin) + "px)")
            .html(function (d) {

                var html = "";
                html += '<table class="vis6TaxonInfo"><row>';

                html += '<td class="vis6TaxonLeft">';
                html += "<span onclick='tombiovis.gui.main.showFullDetails(\"" + d.Taxon + "\", 1)'>" + d.Taxon + "</span>";
                html += '</td>';

                html += '<td class="vis6TaxonRight">';
                html += '<div class="vis6ScoreInd" data-taxon="' + d.Taxon + '">0</div>';
                html += '</td>';

                html += '</row></table>';

                return html
            })
            .merge(mtU);

        var yCursor = 0;
        for (var i = 0; i < sortedTaxa.length; i++) {
            sortedTaxa[i].visState['vis6'].y = yCursor + taxonSpace;
            yCursor = sortedTaxa[i].visState['vis6'].y + document.getElementById("vis6 " + sortedTaxa[i].Taxon.kbValue).offsetHeight;
        }

        mtM.transition()
            .duration(1000)
            .style("top", function (d, i) {
                return d.visState['vis6'].y + "px";
                //return (i * (taxonHeight + taxonSpace + (2 * taxonPad)) + taxonSpace) + "px"
            })

        //Indicator rectangles
        var maxOverall = d3.max(tbv.d.taxa, function (d) { return d.visState.score.overall; });
        var minOverall = d3.min(tbv.d.taxa, function (d) { return d.visState.score.overall; });

        var scaleOverall = d3.scaleLinear()
            .domain([minOverall, 0, maxOverall])
            .range(tbv.d.scoreColours);

        mtM.selectAll(".vis6ScoreInd")
            .text(function () {
                return round(tbv.d.oTaxa[this.getAttribute("data-taxon")].visState.score.overall, 1);
            })
            .transition()
            .duration(1000)
            .style("background-color", function () {
                return scaleOverall(tbv.d.oTaxa[this.getAttribute("data-taxon")].visState.score.overall, 1);
            })

    }

    vis6.urlParams = function (params) {
        //Function to initialise state of visualisation from parameters

        //params - array of parameters passed in URL

        var _this = this;

        //Replace the following to initialise visualisation
        //from parameters.
        console.log("URL parameters:", params);
    }

    vis6.show = function () {
        //Responsible for showing all gui elements of this tool
        $("#vis6").show();
        $(vis6.inputControl.divSel).show();
        vis6.inputControl.initFromCharacterState();
    }

    vis6.hide = function () {
        //Responsible for hiding all gui elements of this tool
        $("#vis6").hide();
        $(vis6.inputControl.divSel).hide();
    }

    function round(value, precision) {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }

})(jQuery, this.tombiovis)