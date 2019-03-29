
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
        this.metadata.year = "2018";
        this.metadata.authors = "Burkmar, R";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Shrewsbury, England";
        this.metadata.contact = "r.burkmar@field-studies-council.org";
        this.metadata.version = '1.8.0';

        //Help files
        this.helpFiles = [
            tbv.opts.tombiopath + "vis6/vis6Help.html"
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
            .data(sortedTaxa, function (d) { return d.taxon; });
        var mtE = mtU.enter();
        var mtX = mtU.exit();

        //Initialize entering taxa.  
        //Create taxon grouping objects
        var mtM = mtE.append("div")
            .attr("class", "taxon")
            .style("overflow", "hidden")
            .attr("id", function (d) {
                return "vis6 " + d.taxon;
            })
            .style("padding", taxonPad + "px")
            .style("left", taxonHorizontalMargin + "px")
            .style('opacity', '0')
            .style("width", "calc(100% - " + (2 * taxonPad + 2 * taxonHorizontalMargin) + "px)")
            .html(function (d) {

                var html = "";
                html += '<table class="vis6TaxonInfo">';
                html += '<tr>';
                html += '<td class="vis6TaxonLeft">';
                html += "<div class='vis6ellipsis' onclick='tombiovis.gui.main.showFullDetails(\"" + d.taxon + "\", 0)'>" + d.taxon + "</div>";
                html += '</td>';
                html += '<td class="vis6TaxonRight">';
                html += '<span class="vis6CharInd" data-taxon="' + d.taxon + '">0</span>&nbsp;<span class="vis6ScoreInd" data-taxon="' + d.taxon + '"></span>';
                html += '<ons-icon style="margin-left: 5px" icon="md-help" onclick="tombiovis.v.visualisations.vis6.fn.showScoreDetails(\'' + d.taxon + '\')\"></ons-icon>'
                html += '</td>';
                html += '</tr>';
                html += '</table>';
                //html += '<div class="vis6ScoreRow" data-taxon="' + d.taxon + '" style="display: none; opacity: 0"></div>';
                return html
            })
            .merge(mtU);

        //mtM.selectAll('.vis6ScoreRow')
        //    .style("display", function () {
        //        var t = tbv.d.oTaxa[$(this).attr("data-taxon")];
        //        //Update scores
        //        var html = '';
        //        html += "Matching characters: <b>" + t.visState.score.charFor + " from " + t.visState.score.charUsed + "</b><br/>"
        //        html += "Overall matching score: <b>" + round(t.visState.score.overall, 1) + "</b><br/>"

        //        $(this).html(html)
        //        if (t.visState.vis6.showScore) {
        //            return
        //        } else {
        //            return "none"
        //        }
        //    })
          
        var yCursor = 0;
        for (var i = 0; i < sortedTaxa.length; i++) {

            var element = document.getElementById("vis6 " + sortedTaxa[i].taxon.kbValue)

            //If content of taxa div overflows, then make indicators invisible
            var indicators = $(element).find(".vis6TaxonRight");
            indicators.show();
            if (element.scrollWidth > $(element).innerWidth()) {
                indicators.hide();
            }

            sortedTaxa[i].visState['vis6'].y = yCursor + taxonSpace;
            sortedTaxa[i].visState['vis6'].height = element.offsetHeight;
            yCursor = sortedTaxa[i].visState['vis6'].y + sortedTaxa[i].visState['vis6'].height;    
        } 

        //mtM.selectAll('.vis6ScoreRow')
        //    .transition()
        //    .duration(1000)
        //    .style("opacity", function () {
        //        var t = tbv.d.oTaxa[$(this).attr("data-taxon")];
        //        if (t.visState.vis6.showScore) {
        //            return 1
        //        } else {
        //            return 0
        //        }
        //    })

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
                return formatScore(round(tbv.d.oTaxa[this.getAttribute("data-taxon")].visState.score.overall, 1));
                //return round(tbv.d.oTaxa[this.getAttribute("data-taxon")].visState.score.overall, 1);
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

        //For GUI other than onsenui we should to manually resize the vis6 containing div because the onsen page element
        //is not contained within it. If we don't do this, the hosting page might not properly contain vis6.
        //Wherever possible we want to avoid using gui-specific code within visualisations like this,
        //but it's unavoidable here.
        if (tbv.opts.gui != "guiOnsenUi") {
            d3.select("#vis6")
                .transition()
                .duration(1000)
                .style("height", (yCursor + 2 * taxonSpace) + "px");
        }

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
        //console.log("URL parameters:", params);
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
        //tbv.d.oTaxa[taxon].visState.vis6.showScore = !tbv.d.oTaxa[taxon].visState.vis6.showScore;
        //vis6.refresh();

        var t = tbv.d.oTaxa[taxon];
        var html = '';
        html += '<div style="font-style: italic; font-size: 1.2em">' + taxon + '</div>'
        html += '<div style="margin: 1em 0">'
        html += "Matching characters: <b>" + t.visState.score.charFor + " from " + t.visState.score.charUsed + "</b><br/>"
        html += "Overall matching score: <b>" + round(t.visState.score.overall, 1) + "</b><br/>"
        html += '</div>'
        html += '<ons-list>';
        tbv.d.characters.forEach(function (c) {
            
            if (c.userInput) {

                var max = d3.max(tbv.d.taxa, function (d) { return d[c.Character].score.overall; });
                var min = d3.min(tbv.d.taxa, function (d) { return d[c.Character].score.overall; });
                var scale = d3.scaleLinear()
                    .domain([min, 0, max])
                    .range(tbv.d.scoreColours);

                html += '<ons-list-item expandable tappable>'
                html += '<div class="middle">' + c.Label + '</div>'
                html += '<div class="left" ><span class="vis6CharWeightedScore" style="background-color: ' + scale(getScore(t, c, true)) + '">' + formatScore(getScore(t, c, true)) + '</span></div>'
                html += '<div class="expandable-content">'

                html += '<table>';
                html += '<tr>';
                html += '<td style="white-space: nowrap">Input states:</td>';
                html += '<td>' + getInput(c) + '</td>';
                html += '</tr>';
                html += '<tr>';
                html += '<td style="white-space: nowrap">Taxon states:</td>';
                html += '<td>' + t[c.Character].toHtml2(true) + '</td>';
                html += '</tr>';
                html += '<tr>';
                html += '<td>Match:</td>';
                html += '<td><b>' + (getScore(t, c, true) > 0 ? "yes" : "no") + '</b></td>';
                html += '</tr>';
                html += '<tr>';
                html += '<td>Weighted:</td>';
                html += '<td><b>' + formatScore(getScore(t, c, true)) + '</b></td>';
                html += '</tr>';
                html += '<td>Unweighted:</td>';
                html += '<td><b>' + formatScore(getScore(t, c, false)) + '</b></td>';
                html += '</tr>';
                html += '</table>';

                html += '</div>'
                html += '</ons-list-item>'
            }
        })
        html += '</ons-list>'

        tbv.gui.main.dialog("Taxon score breakdown", html);  
    }

    function round(value, precision) {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }

    function getInput(c) {
        if (c.ValueType == "text" || c.ValueType == "ordinal" || c.ValueType == "ordinalcircular") {
            var val = "";
            c.userInput.forEach(function (i) {
                if (val) val += " <i>or</i> ";
                val += '<span style="font-weight: bold">' + c.CharacterStateValues[i] + '</span>';
            });
        } else if (c.ValueType == "numeric") {
            var val = '<span style="font-weight: bold">' + c.userInput + '</span>';
        }

        return val;
    }

    function getScore(t, c, weighted) {
        var score = t[c.Character].score.overall;
        if (weighted) {
            score = score * c.Weight / 10;
        }
        return round(score, 1);
    }

    function formatScore(score) {

        score = (Math.round(score * 10) / 10).toFixed(1);

        if (score < 0) {
            var padding = "";

        } else if (score > 0) {
            var padding = "+";
        } else {
            var padding = " ";
        }
        return padding + score;
    }

})(jQuery, this.tombiovis)