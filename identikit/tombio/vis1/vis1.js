
(function ($, tbv) {

    "use strict";
    var _this;
    var visName = "vis1";
    var vis1 = tbv.v.visualisations[visName] = Object.create(tbv.v.visP);
    vis1.visName = visName;

    vis1.initialise = function () {

        _this = this;

        //Initialise the metadata
        this.metadata.title = "Two-column key";
        this.metadata.year = "2018";
        this.metadata.authors = "Burkmar, R";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Shrewsbury, England";
        this.metadata.contact = "r.burkmar@field-studies-council.org";
        this.metadata.version = '1.8.0';

        //Other initialisations
        this.displayToolTips = true;
        this.taxheight = 35;
        this.indVoffset = 18;

        //Help files
        this.helpFiles = [
            tbv.opts.tombiopath + "vis1/vis1Help.html",
            tbv.opts.tombiopath + "common/taxonDetailsHelp.html",
            tbv.opts.tombiopath + "common/full-details.html",
            tbv.opts.tombiopath + "common/stateInputHelp.html"
        ]

        //Set some variables (mostly used in refresh method)
        this.taxwidth = 220;
        this.margin = 4;

        //Add the SVG and titles div
        $("#" + this.visName).append(
            $("<div>")
                .attr("id", "headerTaxa")
                .append(
                     $("<span>")
                        .attr("id", "candidateTaxa")
                        .css("position", "absolute")
                        .css("width", this.taxwidth)
                        .css("left", this.margin)
                        .css("font-size", "small")
                        .text("Evidence balance positive")
                )
                .append(
                     $("<span>")
                        .attr("id", "excludedTaxa")
                        .css("position", "absolute")
                        .css("width", this.taxwidth)
                        .css("left", this.taxwidth + 2 * this.margin)
                        .css("font-size", "small")
                        .text("Evidence balance negative")
                )
        );
        d3.select("#" + this.visName).append("svg").attr("id", "vis1Svg");    

        //Shares key input with several other multi-access keys
        var keyinput = tbv.opts.toolconfig[this.visName].keyinput;
        if (!tbv.gui.sharedKeyInput[keyinput]) {
            tbv.gui.sharedKeyInput[keyinput] = Object.create(tbv.gui[keyinput]);
            tbv.gui.sharedKeyInput[keyinput].init($(tbv.gui.main.divInput));
        }

        //Interface
        vis1.inputControl = tbv.gui.sharedKeyInput[keyinput];

        //Mark as initialised
        this.initialised = true;

        //Check interface
        tbv.f.checkInterface(visName, tbv.templates.visTemplate, tbv.v.visualisations[visName]);
    }

    vis1.refresh = function () {

        //Constants for laying out graphics for vis
        var margin = this.margin;
        var indWidth = 30;
        var indHeight = 12;
        var indVoffset = this.indVoffset;
        var indTextVoffset = 10;
        var indTextHoffset = 2;
        var nameOffset = 13;
        var taxspace = 5;
        var taxwidth = this.taxwidth;
        var taxheight = this.taxheight;
        var taxexpanded = 105;
        var delay = 250;

        //Ensure SVG can accommodate display
        $("#vis1Svg").css("width", taxspace * 3 + taxwidth * 2);
        $("#candidateTaxa").css("left", taxspace * 1);
        $("#excludedTaxa").css("left", taxspace * 2 + taxwidth);

        //Initialise graphics on the enter selection
        var enterSelection = d3.select("#vis1Svg").selectAll(".taxon")
            .data(tbv.d.taxa, function (d, i) { return d.taxon; }) //Key is needed because other visualisation may sort taxa
            .enter()
            .append("g")
            .attr("class", "taxon")
            .attr("id", function (d, i) {
                return "taxon-" + i;
            })
            .style("cursor", "pointer")
            .on("click", function (d, i) {
                if (d.visState['vis1'].height == taxheight) {

                    expandTaxon(d, i);
                } else {
                    d.visState['vis1'].height = taxheight;
                    _this.refresh();
                }
            });

        enterSelection.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("class", "taxarect")
            .attr("height", taxheight)
            .attr("width", taxwidth);

        //Label with scientific names
        enterSelection.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("class", "scientificnames")
            .style("opacity", 0)
            .style("cursor", "pointer")
            .text(function (d) {
                return d.taxon;
            })
            .on("click", function (d) {
                d3.event.stopPropagation();
                tbv.gui.main.showFullDetails(d.taxon, 0);
            });

        tbv.gui.main.createTaxonToolTips(".scientificnames", this.displayToolTips);

        //Taxon image
        enterSelection.append("svg:image")
            .attr("class", "taxonimage")
            .attr("opacity", 0)
            .attr("width", taxwidth - 2 * margin);

        //Matching indicators
        for (var i = 1; i <= 1; i++) {
            enterSelection.append("rect")
                .attr("class", "indicator")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 0)
                .attr("height", 0);
        }

        //Indicator text
        for (var i = 1; i <= 1; i++) {
            enterSelection.append("text")
                .attr("class", "indtext")
                .attr("x", 0)
                .attr("y", 0);
        }

        //Add height state 
        tbv.d.taxa.forEach(function (taxon) {
            if (taxon.visState['vis1'].height == undefined)
                taxon.visState['vis1'].height = taxheight;
        })

        //Update graphics on the update selection
        var updateSelection = d3.select("#vis1Svg").selectAll(".taxon");

        //Initialisations
        var taxain = [];
        var taxaout = [];

        //Assign taxon to relevant column list
        tbv.d.taxa.forEach(function (taxon) {
            if (taxon.visState.score.for > taxon.visState.score.against) {
                taxain.push(taxon);
            } else {
                taxaout.push(taxon);
            }
        });

        //Sort the lists of taxa 
        //tbv.f.sortTaxa(taxain, "vis1", "lastPosInTaxain");
        //tbv.f.sortTaxa(taxaout, "vis1", "lastPosInTaxaout");
        tbv.f.sortTaxa(taxain, "vis1");
        tbv.f.sortTaxa(taxaout, "vis1");

        //Record the current position in each list so that when next sorted, this
        //can be taken into account in order to minimise travel through list. If
        //this is not used, then priority will be given to taxa that come first in
        //KB which is arbitrary.
        //Removed for version 1.7.0 because it resulted in unpredictable sorting
        //e.g. when initialising from URL.
        //for (var i = 0; i < taxain.length; i++) {
        //    taxain[i].visState['vis1'].lastPosInTaxain = i;
        //    taxain[i].visState['vis1'].lastPosInTaxaout = i - 100; //Ensures enters at the top (all else being equal)
        //}
        //for (var i = 0; i < taxaout.length; i++) {
        //    taxaout[i].visState['vis1'].lastPosInTaxaout = i;
        //    taxaout[i].visState['vis1'].lastPosInTaxain = 100 - i; //Ensures enters at the bottom (all else being equal)
        //}

        //Update the data array items to reflect the position of each taxon
        //in each of the sorted lists so that these values are available
        //in the D3 functions.
        var yCursor = 0;
        for (var i = 0; i < taxain.length; i++) {
            taxain[i].visState['vis1'].x = taxspace;
            taxain[i].visState['vis1'].y = yCursor + taxspace;
            yCursor = taxain[i].visState['vis1'].y + taxain[i].visState['vis1'].height;
        }

        yCursor = 0;
        for (var i = 0; i < taxaout.length; i++) {
            taxaout[i].visState['vis1'].x = taxwidth + 2 * taxspace;
            taxaout[i].visState['vis1'].y = yCursor + taxspace;
            yCursor = taxaout[i].visState['vis1'].y + taxaout[i].visState['vis1'].height;
        }

        //Render the graphics elements
        //Rectangles
        updateSelection.select(".taxarect")
            .transition()
            .duration(1000)
            .delay(delay)
            .attr("x", function (d) {
                return d.visState['vis1'].x;
            })
            .attr("y", function (d) {
                return d.visState['vis1'].y;
            })
            .attr("height", function (d) {
                return d.visState['vis1'].height;
            });

        //Scientific names
        updateSelection.select(".scientificnames")
            .transition()
            .duration(1000)
            .delay(delay)
            .style("opacity", 1)
            .attr("x", function (d) {
                return d.visState['vis1'].x + taxspace;
            })
            .attr("y", function (d, i) {
                return d.visState['vis1'].y + nameOffset;
            });

        //Prepare scales for the indicators
        var maxFor = d3.max(tbv.d.taxa, function (d) { return d.visState.score.for; });
        var maxAgainst = d3.max(tbv.d.taxa, function (d) { return d.visState.score.against; });
        var maxOverall = d3.max(tbv.d.taxa, function (d) { return d.visState.score.overall; });
        var minOverall = d3.min(tbv.d.taxa, function (d) { return d.visState.score.overall; });

        var scaleOverall = d3.scaleLinear()
            .domain([minOverall, 0, maxOverall])
            .range(tbv.d.scoreColours);
        var scaleFor = d3.scaleLinear()
            .domain([0, maxFor])
            .range(tbv.d.scoreColours.slice(1));
        var scaleAgainst = d3.scaleLinear()
            .domain([0, maxAgainst])
            .range(tbv.d.scoreColours.slice(0,1).reverse());
        var scaleCharacters = d3.scaleLinear()
            .domain([0, 10])
            .range(tbv.d.scoreColours.slice(1));

        var colourScales = [
            { "scale": scaleOverall, "attr": "overall" },
            { "scale": scaleFor, "attr": "for" },
            { "scale": scaleAgainst, "attr": "against" },
        ];

        var textattrs = ["overall", "for", "against"];
        var textlabels = ["overall score", "score for", "score against"];

        //Indicator rectangles
        updateSelection.selectAll(".indicator")
            .transition()
            .duration(1000)
            .delay(delay)
            .attr("fill", function (d, i, j) {
                return colourScales[i].scale(d.visState.score[colourScales[i].attr]);
            })
            .attr("x", function (d, i, j) {
                var x = d.visState['vis1'].x + margin + i * (margin + indWidth);
                if (d.visState['vis1'].height == taxheight) {
                    return x;
                } else {
                    return x + margin;
                }
            })
            .attr("y", function (d, i, j) {
                var y = d.visState['vis1'].y + indVoffset;
                if (d.visState['vis1'].height == taxheight) {
                    return y;
                } else {
                    return y + margin;
                }
            })
            .attr("width", indWidth)
            .attr("height", indHeight)
            .attr("title", function (d, i, j) {
                return Math.round(d.visState.score[textattrs[i]] * 100) / 100 + " (" + textlabels[i] + ")";
            })
        ;

        //Indicator text
        updateSelection.selectAll(".indtext")
            .transition()
            .duration(1000)
            .delay(delay)
            .text(function (d, i, j) {
                return Math.round(d.visState.score[textattrs[i]] * 100) / 100;
            })
            .attr("x", function (d, i, j) {
                var x = d.visState['vis1'].x + margin + indTextHoffset + i * (margin + indWidth);
                if (d.visState['vis1'].height == taxheight) {
                    return x;
                } else {
                    return x + margin;
                }
            })
            .attr("y", function (d, i, j) {
                var y = d.visState['vis1'].y + indVoffset + indTextVoffset;
                if (d.visState['vis1'].height == taxheight) {
                    return y;
                } else {
                    return y + margin;
                }
            })


        //Image link (camera icon)
        updateSelection.selectAll(".taxonImageLink")
            .transition()
            .duration(1000)
            .delay(delay)
            .attr("x", function (d) {
                return d.visState['vis1'].x + taxwidth - 2 * margin - 16;
            })
            .attr("y", function (d, i, j) {
                return d.visState['vis1'].y + indVoffset + margin;
            })
            .style("opacity", function (d, i) {
                //if (d.height != taxheight) {
                if (d.visState['vis1'].height != taxheight) {
                    //Check if there are any images for this taxon
                    var charImages = tbv.d.media.filter(function (m) {
                        //Return images for matching taxon
                        if (m.taxon == d.taxon) return true;
                    });
                    if (charImages.length > 0) {
                        return 1;
                    } else {
                        return 0;
                    }
                } else {
                    return 0;
                }
            })
            .on("end", function (d, i) {
                if (d3.select(this).style("opacity") == 0) {
                    d3.select(this).attr("display", "none");
                } else {
                    d3.select(this).attr("display", "");
                }
            });

        //Taxon images
        updateSelection.select(".taxonimage")
            .transition()
            .duration(1000)
            .delay(delay)
            .attr("opacity", function (d, i) {
                if (d.visState['vis1'].height == taxheight) {
                    return 0;
                } else {
                    return 1;
                }
            })
            .attr("x", function (d) {
                return d.visState['vis1'].x + margin;
            })
            .attr("y", function (d) {
                return d.visState['vis1'].y + indVoffset;
            })
            .attr("width", taxwidth - 2 * margin)
            .on("end", function (d, i) {
                //If we don't set height of image to zero, it interfers
                //with click events on other taxa.
                if (d.visState['vis1'].height == taxheight) {
                    d3.select(this).attr("height", 0);
                }
            });

        //Resize height of multiacces svg so page can be scrolled to end of taxa objects.
        d3.select("#vis1Svg")
            .transition()
            .duration(1000)
            .delay(delay)
            .attr("height", function () {
                if (taxaout.length == 0) {
                    var heightout = 0;
                } else {
                    var heightout = taxaout[taxaout.length - 1].visState['vis1'].y + taxaout[taxaout.length - 1].visState['vis1'].height
                }
                if (taxain.length == 0) {
                    var heightin = 0;
                } else {
                    var heightin = taxain[taxain.length - 1].visState['vis1'].y + taxain[taxain.length - 1].visState['vis1'].height
                }
                return Math.max(heightin, heightout);
            });

        //Add/remove context menu item to show taxon tooltip images
        tbv.gui.main.contextMenu.addItem("Get URL for two-column key", function () {
            getViewURL();
        }, false, [this.visName]);
        if (this.displayToolTips) {
            tbv.gui.main.contextMenu.addItem("Remove taxon image tooltips", function () {
                $(".ui-tootip").remove(); //This is a workaround to get rid of orphaned tooltips which sometimes occur
                _this.displayToolTips = false;
                tbv.gui.main.contextMenu.removeItem("Remove taxon image tooltips");
                _this.refresh();
            }, true, [this.visName], ["guiLargeJqueryUi"]);
            tbv.gui.main.contextMenu.removeItem("Display taxon image tooltips");
        } else {
            tbv.gui.main.contextMenu.addItem("Display taxon image tooltips", function () {
                _this.displayToolTips = true;
                tbv.gui.main.contextMenu.removeItem("Display taxon image tooltips");
                _this.refresh();
            }, true, [this.visName], ["guiLargeJqueryUi"]);
            tbv.gui.main.contextMenu.removeItem("Remove taxon image tooltips");
        }

        //Add/remove context menu item to contract all items
        if (tbv.d.taxa.some(function (taxon) { return (taxon.visState['vis1'].height != taxheight) })) {
            tbv.gui.main.contextMenu.addItem("Contract all taxon items", function () {
                tbv.d.taxa.forEach(function (taxon) { taxon.visState['vis1'].height = taxheight });
                tbv.gui.main.contextMenu.removeItem("Contract all taxon items");
                _this.refresh();
            }, false, [this.visName]);
        } else {
            tbv.gui.main.contextMenu.removeItem("Contract all taxon items");
        }

        //Add/remove context menu item to expand all items
        if (tbv.d.taxa.some(function (taxon) { return (taxon.visState['vis1'].height == taxheight && tbv.f.getTaxonImages(taxon.taxon).length > 0) })) {
            tbv.gui.main.contextMenu.addItem("Expand all taxon items", function () {
                tbv.d.taxa.forEach(function (taxon, i) {
                    var taxonImages = tbv.f.getTaxonImages(taxon.taxon);
                    if (taxon.visState['vis1'].height == taxheight && taxonImages.length > 0) {
                        var imgLoad = new Image;
                        imgLoad.onload = function () {

                            d3.select("#vis1Svg").select("#taxon-" + i).select(".taxonimage")
                                .attr("xlink:href", this.src)
                                .attr("height", (taxwidth - 2 * margin) * imgLoad.height / imgLoad.width);

                            //Store the height of the rectangle which will come into effect later
                            taxon.visState['vis1'].height = (taxwidth - 2 * margin) * imgLoad.height / imgLoad.width + indVoffset + margin;

                            //This is asynchronous, so refresh must be called here
                            _this.refresh();
                        };
                        imgLoad.src = taxonImages[0].URI;
                    }
                });
                tbv.gui.main.contextMenu.removeItem("Expand all taxon items");
            }, false, [this.visName]);
        } else {
            tbv.gui.main.contextMenu.removeItem("Expand all taxon items");
        }
    }

    vis1.urlParams = function (params) {

        //Taxon image tooltips
        if (params["imgtips"]) {
            _this.displayToolTips = params["imgtips"] === "true";
        }

        //Expanded taxa
        if (params["expand"]) {
            params["expand"].split(",").forEach(function (range) {
                var iStart = range.split("-")[0];
                var iEnd = range.split("-")[1];
                if (iEnd) {
                    for (var i = Number(iStart) ; i <= Number(iEnd) ; i++) {
                        expandTaxon(tbv.d.taxa[i], i);
                    }
                } else {
                    expandTaxon(tbv.d.taxa[iStart], iStart);
                }
            })
        }

        //Set the state controls
        tbv.f.initControlsFromParams(params);
    }

    vis1.show = function () {
        //Responsible for showing all gui elements of this tool
        $("#vis1").show();
        $(vis1.inputControl.divSel).show();
        vis1.inputControl.initFromCharacterState();
    }

    vis1.hide = function () {
        //Responsible for hiding all gui elements of this tool
        $("#vis1").hide();
        $(vis1.inputControl.divSel).hide();
    }

    function getViewURL() {

        var params = [];

        //Tool
        params.push("selectedTool=" + visName)

        //Get user input control params
        Array.prototype.push.apply(params, tbv.f.setParamsFromControls());

        //Image tooltips
        params.push("imgtips=" + _this.displayToolTips);

        //Expanded taxa
        //There could be thousands of taxa, so we record the state of the expanded images by recording
        //runs of taxa indices.
        var rangeStart = null;
        var rangeCounter;
        var ranges = [];
        tbv.d.taxa.forEach(function (taxon, i) {
            
            if (taxon.visState['vis1'].height > _this.taxheight) {
                
                //console.log("Expanded!", i, taxon.taxon.kbValue)
                //console.log("rangeStart", rangeStart, "rangeCounter", rangeCounter)

                if (rangeStart === null) {
                    //Start new range;
                    rangeStart = i;
                    rangeCounter = i;
                } else {
                    if (i === rangeCounter + 1) {
                        //Continue the current range
                        rangeCounter = i;
                    } else {
                        //Close the current range and start a new one
                        if (rangeCounter === rangeStart) {
                            ranges.push(rangeStart);
                        } else {
                            ranges.push(rangeStart + "-" + rangeCounter);
                        }
                        rangeStart = i;
                        rangeCounter = i;
                    }
                }
            }
        })
        //At this point, there could still be an open range
        if (rangeStart != null) {
            if (rangeCounter === rangeStart) {
                ranges.push(rangeStart);
            } else {
                ranges.push(rangeStart + "-" + rangeCounter);
            }
        }
        params.push("expand=" + ranges.join(","));

        //Generate the full URL
        tbv.f.createViewURL(params);
    }

    function expandTaxon(d, i) {

        var taxonImages = tbv.f.getTaxonImages(d.taxon);
        if (taxonImages.length > 0) {

            var imgLoad = new Image;
            imgLoad.onload = function () {

                d3.select("#vis1Svg").select("#taxon-" + i).select(".taxonimage")
                    .attr("xlink:href", this.src)
                    .style("z-index", 1000)
                    .attr("height", (_this.taxwidth - 2 * _this.margin) * imgLoad.height / imgLoad.width);

                //Store the height of the rectangle which will come into effect later
                d.visState['vis1'].height = (_this.taxwidth - 2 * _this.margin) * imgLoad.height / imgLoad.width + _this.indVoffset + _this.margin;

                //This is asynchronous, so refresh must be called here            
                _this.refresh();
            };
            imgLoad.src = taxonImages[0].URI;
        }
    }

})(jQuery, this.tombiovis)