
(function ($, tbv) {

    "use strict";

    var visName = "vis6";
    var vis6 = tbv.v.visualisations[visName] = Object.create(tbv.v.visP);
    vis6.visName = visName;
    vis6.fn = {};

    var taxonHeight = 30;
    var taxonPad = 5;
    var taxonSpace = 10;
    var taxonHorizontalMargin = 5;
    var visType = "all";

    var firstTime = true;

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

        //Shares key input with several other multi-access keys
        var keyinput = tbv.opts.toolconfig[this.visName].keyinput;
        if (!tbv.gui.sharedKeyInput[keyinput]) {
            tbv.gui.sharedKeyInput[keyinput] = Object.create(tbv.gui[keyinput]);
            tbv.gui.sharedKeyInput[keyinput].init($(tbv.gui.main.divInput));
        }
        vis6.inputControl = tbv.gui.sharedKeyInput[keyinput];

        //Create 
        var html = '';

        var calcW = "calc(100% - " + (2 * taxonHorizontalMargin) + "px)";

        html += '<ons-page id="tombioVis6page"><ons-toolbar modifier="noshadow"><div class="center"><ons-segment id="tombioVis6segment" style="width: ' + calcW + '; margin: 0 5px 0 5px">'
        html += '<button onclick="tombiovis.v.visualisations.vis6.fn.setVisType(\'all\')"><div class="vis6ellipsis">All</div></button>'
        html += '<button onclick="tombiovis.v.visualisations.vis6.fn.setVisType(\'matched\')"><div class="vis6ellipsis">Matched</div></button>'
        html += '<button onclick="tombiovis.v.visualisations.vis6.fn.setVisType(\'discounted\')"><div class="vis6ellipsis">Discounted</div></button>'
        html += '</ons-segment></div></ons-toolbar>'
        html += '<div id="tombioVis6Main" style="position:relative"></ons-page><div>'

        $("#" + this.visName).html(html);

        document.addEventListener('show', function (event) {
            var page = event.target;
            if (page.id == 'tombioVis6page') {
                //This will refresh the visualisation every time the onsen page
                //is shown, e.g. when uncovered when a dialog closes. This is 
                //necessary if user has reorientated phone while dialog is open
                //as it messes with the visualisation.
                vis6.refresh();
            };
        });

        //Mark as initialised
        this.initialised = true;

        //Check interface
        tbv.f.checkInterface(visName, tbv.templates.visTemplate, tbv.v.visualisations[visName]);
    }

    vis6.refresh = function () {

        var _this = this;

        //Some responsive gui stuff
        //console.log("vis6 width", $("#tombioOnsVisDisplay").width());

        //Actual visualisation
        var sortedTaxa = [];
        tbv.d.taxa.forEach(function (taxon) {

            if (visType == "all" ||
                (visType == "matched" && taxon.visState.score.charFor == taxon.visState.score.charUsed) ||
                (visType == "discounted" && taxon.visState.score.charFor != taxon.visState.score.charUsed)) {
                    sortedTaxa.push(taxon);
            }
        });

        if (visType == "all") {
            tbv.f.sortTaxa(sortedTaxa, "all");
        } else {
            tbv.f.sortTaxa(sortedTaxa, "matched");
        }

        var mtU = d3.select("#tombioVis6Main").selectAll(".taxon")
            .data(sortedTaxa, function (d) { return d.Taxon; });
        var mtE = mtU.enter();
        var mtX = mtU.exit();

        //Initialize entering taxa.  
        //Create taxon grouping objects
        var mtM = mtE.append("div")
            .attr("class", "taxon")
            .style("overflow", "hidden")
            .attr("id", function (d) {
                return "vis6 " + d.Taxon;
            })
            .style("padding", taxonPad + "px")
            .style("left", taxonHorizontalMargin + "px")
            .style('opacity', '0')
            .style("width", "calc(100% - " + (2 * taxonPad + 2 * taxonHorizontalMargin) + "px)")
            .html(function (d) {

                var html = "";
                html += '<table class="vis6TaxonInfo"><row>';
                html += '<row>';
                html += '<td class="vis6TaxonLeft">';
                html += "<div class='vis6ellipsis' onclick='tombiovis.gui.main.showFullDetails(\"" + d.Taxon + "\", 1)'>" + d.Taxon + "</div>";
                html += '</td>';
                html += '<td class="vis6TaxonRight"  onclick="tombiovis.v.visualisations.vis6.fn.showScoreDetails(\'' + d.Taxon + '\')\">';
                html += '<span class="vis6CharInd" data-taxon="' + d.Taxon + '">0</span>&nbsp;<span class="vis6ScoreInd" data-taxon="' + d.Taxon + '">0</span>';
                html += '</td>';
                html += '</row>';
                html += '</table>';
                html += '<div class="vis6ScoreRow" data-taxon="' + d.Taxon + '" style="display: none; opacity: 0"></div>';
                return html
            })
            .merge(mtU);

        mtM.selectAll('.vis6ScoreRow')
            .style("display", function () {
                var t = tbv.d.oTaxa[$(this).attr("data-taxon")];
                //Update scores
                var html = '';
                html += "Number of matching characters: " + t.visState.score.charFor + " (from " + t.visState.score.charUsed + ")" + "<br/>"
                html += "Overall matching score: " + round(t.visState.score.overall, 1) + "<br/>"

                $(this).html(html)
                if (t.visState.vis6.showScore) {
                    return
                } else {
                    return "none"
                }
            })
          
        var yCursor = 0;
        for (var i = 0; i < sortedTaxa.length; i++) {
            sortedTaxa[i].visState['vis6'].y = yCursor + taxonSpace;
            sortedTaxa[i].visState['vis6'].height = document.getElementById("vis6 " + sortedTaxa[i].Taxon.kbValue).offsetHeight;
            yCursor = sortedTaxa[i].visState['vis6'].y + sortedTaxa[i].visState['vis6'].height;    
        }

        mtM.selectAll('.vis6ScoreRow')
            .transition()
            .duration(1000)
            .style("opacity", function () {
                var t = tbv.d.oTaxa[$(this).attr("data-taxon")];
                if (t.visState.vis6.showScore) {
                    return 1
                } else {
                    return 0
                }
            })

        mtM.transition()
            .duration(1000)
            .style('opacity', '1')
            .style("top", function (d, i) {
                return d.visState['vis6'].y + "px";
            })

        mtX.transition()
            .duration(1000)
            .style('opacity', function () {
                return 0;
            })
            .transition()
            .remove()

        //Indicator rectangles
        var maxOverall = d3.max(tbv.d.taxa, function (d) { return d.visState.score.overall; });
        var minOverall = d3.min(tbv.d.taxa, function (d) { return d.visState.score.overall; });

        var scaleOverall = d3.scaleLinear()
            .domain([minOverall, 0, maxOverall])
            .range(tbv.d.scoreColours);

       
        var charUsed = tbv.d.characters.map(function (c) { return c.stateSet ? 1 : 0 }).reduce(function (t, n) { return t + n });
        var scaleChars = d3.scaleLinear()
            .domain([0, charUsed/2, charUsed])
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

        mtM.selectAll(".vis6CharInd")
            .text(function () {
                return round(tbv.d.oTaxa[this.getAttribute("data-taxon")].visState.score.charFor, 1);
            })
            .transition()
            .duration(1000)
            .style("background-color", function () {
                return scaleChars(tbv.d.oTaxa[this.getAttribute("data-taxon")].visState.score.charFor);
            })

        //Hack to overcome a problem on initial display where heights of divs aren't consistent
        if (firstTime) {
            firstTime = false;
            setTimeout(vis6.refresh, 1000);
        }

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

    vis6.fn.setVisType = function (type) {
        visType = type;
        vis6.refresh();
    }

    vis6.fn.showScoreDetails = function (taxon) {
        tbv.d.oTaxa[taxon].visState.vis6.showScore = !tbv.d.oTaxa[taxon].visState.vis6.showScore;
        vis6.refresh();
    }

    function round(value, precision) {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }

})(jQuery, this.tombiovis)