
(function ($, core) {

    //Template visualisation that inherits from visP.
    "use strict";

    var visName = "vis1";
    var exports = core[visName] = {};

    exports.Obj = function (parent, contextMenu, core) {

        core.visP.Obj.call(this, visName, parent, contextMenu, core);

        //Initialise the meta data
        this.metadata.title = "Two-column key";
        this.metadata.year = "2016";
        this.metadata.authors = "Burkmar, R";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Shrewsbury, England";
        this.metadata.contact = "richardb@field-studies-council.org";
        this.metadata.version = '1.0';
    }
    exports.Obj.prototype = Object.create(core.visP.Obj.prototype);

    exports.Obj.prototype.initialise = function () {

        var _this = this;

        //Reset this value if control can work with character state input controls
        this.charStateInput = true;

        //Help files
        this.helpFiles = [
            tombiopath + "vis1/vis1Help.html",
            tombiopath + "common/imageGroupHelp.html",
            tombiopath + "common/stateInputHelp.html"
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
                        .css("left", this.margin)
                        .text("Evidence balance positive")
                )
                .append(
                     $("<span>")
                        .attr("id", "excludedTaxa")
                        .css("position", "absolute")
                        .css("left", this.taxwidth + 2 * this.margin)
                        .text("Evidence balance negative")
                )
        );
        d3.select("#" + this.visName).append("svg").attr("id", "vis1Svg");
    }

    exports.Obj.prototype.refresh = function () {

        var _this = this;

        //Constants for laying out graphics for vis
        var margin = this.margin;
        var indWidth = 30;
        var indHeight = 12;
        var indVoffset = 18;
        var indTextVoffset = 10;
        var indTextHoffset = 2;
        var nameOffset = 13;
        var taxspace = 5;
        var taxwidth = this.taxwidth;
        var taxheight = 35;
        var taxexpanded = 105;
        var delay = 250;

        //Ensure SVG can accommodate display
        $("#vis1Svg").css("width", taxspace * 3 + taxwidth * 2);
        $("#candidateTaxa").css("left", taxspace * 1);
        $("#excludedTaxa").css("left", taxspace * 2 + taxwidth);

        //Initialise graphics on the enter selection
        var enterSelection = d3.select("#vis1Svg").selectAll(".taxon")
            .data(this.taxa, function (d, i) { return d.Taxon; }) //Key is needed because other visualisation may sort taxa
            .enter()
            .append("g")
            .attr("class", "taxon")
            .attr("id", function (d, i) {
                return "taxon-" + i;
            })
            .style("cursor", "pointer")
            .on("click", function (d, i) {
                if (d.height == taxheight) {
                    var taxonImages = _this.getTaxonImages(d.Taxon);
                    if (taxonImages.length > 0) {

                        var imgLoad = new Image;
                        imgLoad.onload = function () {

                            d3.select("#vis1Svg").select("#taxon-" + i).select(".taxonimage")
                                .attr("xlink:href", this.src)
                                .style("z-index", 1000)
                                .attr("height", (taxwidth - 2 * margin) * imgLoad.height / imgLoad.width);

                            //Store the height of the rectangle which will come into effect later
                            d.height = (taxwidth - 2 * margin) * imgLoad.height / imgLoad.width + indVoffset + margin;

                            //This is asynchronous, so refresh must be called here            
                            _this.refresh();
                        }; 
                        imgLoad.src = taxonImages[0].URI;
                    }
                } else {
                    d.height = taxheight;
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
                return d.Taxon;
            })
            .on("click", function (d) {
                d3.event.stopPropagation();
                _this.showTaxonCharacterValues(d);
            });

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

        //Image link (camera icon)
        enterSelection.append("svg:image")
            .attr("xlink:href", tombiopath + "resources/camera.png")
            .attr("class", "taxonImageLink")
            .attr("width", "16px")
            .attr("height", "16px")
            .attr("display", "none")
            .on("click", function (d, i) {

                d3.event.stopPropagation();

                var offset = $("#tombioMain").offset();
                var x = d3.event.clientX - offset.left + document.body.scrollLeft;
                var y = d3.event.clientY - offset.top + document.body.scrollTop;;

                _this.showFloatingImages(d.Taxon, x, y);
            });

        //Add height state 
        this.taxa.forEach(function (taxon) {
            if (taxon.height == undefined)
                taxon.height = taxheight;
        })

        //Update graphics on the update selection
        var updateSelection = d3.select("#vis1Svg").selectAll(".taxon");

        //Initialisations
        var taxain = [];
        var taxaout = [];

        //Assign taxon to relevant column list
        this.taxa.forEach(function (taxon) {
            if (taxon.scorefor > taxon.scoreagainst) {
                taxain.push(taxon);
            } else {
                taxaout.push(taxon);
            }
        });

        //Sort the lists of taxa 
        this.sortTaxa(taxain, "lastPosInTaxain");
        this.sortTaxa(taxaout, "lastPosInTaxaout");

        //Record the current position in each list so that when next sorted, this
        //can be taken into account in order to minimise travel through list. If
        //this is not used, then priority will be given to taxa that come first in
        //KB which is arbitrary.
        for (var i = 0; i < taxain.length; i++) {
            taxain[i].lastPosInTaxain = i;
            taxain[i].lastPosInTaxaout = i - 100; //Ensures enters at the top (all else being equal)
        }
        for (var i = 0; i < taxaout.length; i++) {
            taxaout[i].lastPosInTaxaout = i;
            taxaout[i].lastPosInTaxain = 100 - i; //Ensures enters at the bottom (all else being equal)
        }

        //Update the data array items to reflect the position of each taxon
        //in each of the sorted lists so that these values are available
        //in the D3 functions.
        var yCursor = 0;
        for (var i = 0; i < taxain.length; i++) {
            taxain[i].x = taxspace;
            taxain[i].y = yCursor + taxspace;
            yCursor = taxain[i].y + taxain[i].height;
        }

        yCursor = 0;
        for (var i = 0; i < taxaout.length; i++) {
            taxaout[i].x = taxwidth + 2 * taxspace;
            taxaout[i].y = yCursor + taxspace;
            yCursor = taxaout[i].y + taxaout[i].height;
        }

        //Render the graphics elements
        //Rectangles
        updateSelection.select(".taxarect")
            .transition()
            .duration(1000)
            .delay(delay)
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("height", function (d) {
                return d.height;
            });

        //Scientific names
        updateSelection.select(".scientificnames")
            .transition()
            .duration(1000)
            .delay(delay)
            .style("opacity", 1)
            .attr("x", function (d) {
                return d.x + taxspace;
            })
            .attr("y", function (d, i) {
                return d.y + nameOffset;
            });

        //Prepare scales for the indicators
        //Vermillion-Yellow-Blue http://jfly.iam.u-tokyo.ac.jp/color/
        var maxFor = d3.max(this.taxa, function (d) { return d.scorefor; });
        var maxAgainst = d3.max(this.taxa, function (d) { return d.scoreagainst; });
        var maxOverall = d3.max(this.taxa, function (d) { return d.scoreoverall; });
        var minOverall = d3.min(this.taxa, function (d) { return d.scoreoverall; });

        var scaleOverall = d3.scaleLinear()
            .domain([minOverall, 0, maxOverall])
            .range(['#fc8d59', '#ffffbf', '#91bfdb']);
        var scaleFor = d3.scaleLinear()
            .domain([0, maxFor])
            .range(['#ffffbf', '#91bfdb']);
        var scaleAgainst = d3.scaleLinear()
            .domain([0, maxAgainst])
            .range(['#ffffbf', '#fc8d59']);
        var scaleCharacters = d3.scaleLinear()
            .domain([0, 10])
            .range(['#ffffbf', '#91bfdb']);

        var colourScales = [
            { "scale": scaleOverall, "attr": "scoreoverall" },
            { "scale": scaleFor, "attr": "scorefor" },
            { "scale": scaleAgainst, "attr": "scoreagainst" },
        ];

        var textattrs = ["scoreoverall", "scorefor", "scoreagainst"];
        var textlabels = ["overall score", "score for", "score against"];

        //Indicator rectangles
        updateSelection.selectAll(".indicator")
            .transition()
            .duration(1000)
            .delay(delay)
            .attr("fill", function (d, i, j) {
                return colourScales[i].scale(d[colourScales[i].attr]);
            })
            .attr("x", function (d, i, j) {
                var x = d.x + margin + i * (margin + indWidth);
                if (d.height == taxheight) {
                    return x;
                } else {
                    return x + margin;
                }
            })
            .attr("y", function (d, i, j) {
                var y = d.y + indVoffset;
                if (d.height == taxheight) {
                    return y;
                } else {
                    return y + margin;
                }
            })
            .attr("width", indWidth)
            .attr("height", indHeight)
            .attr("title", function (d, i, j) {
                return Math.round(d[textattrs[i]] * 100) / 100 + " (" + textlabels[i] + ")";
            })
        ;

        //Indicator text
        updateSelection.selectAll(".indtext")
            .transition()
            .duration(1000)
            .delay(delay)
            .text(function (d, i, j) {
                return Math.round(d[textattrs[i]] * 100) / 100;
            })
            .attr("x", function (d, i, j) {
                var x = d.x + margin + indTextHoffset + i * (margin + indWidth);
                if (d.height == taxheight) {
                    return x;
                } else {
                    return x + margin;
                }
            })
            .attr("y", function (d, i, j) {
                var y = d.y + indVoffset + indTextVoffset;
                if (d.height == taxheight) {
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
                return d.x + taxwidth - 2 * margin - 16;
            })
            .attr("y", function (d, i, j) {
                return d.y + indVoffset + margin;
            })
            .style("opacity", function (d, i) {
                if (d.height != taxheight) {
                    //Check if there are any images for this taxon
                    var charImages = _this.media.filter(function (m) {
                        //Return images for matching taxon
                        if (m.Taxon == d.Taxon) return true;
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
                if (d.height == taxheight) {
                    return 0;
                } else {
                    return 1;
                }
            })
            .attr("x", function (d) {
                return d.x + margin;
            })
            .attr("y", function (d) {
                return d.y + indVoffset;
            })
            .attr("width", taxwidth - 2 * margin)
            .on("end", function (d, i) {
                //If we don't set height of image to zero, it interfers
                //with click events on other taxa.
                if (d.height == taxheight) {
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
                    var heightout = taxaout[taxaout.length - 1].y + taxaout[taxaout.length - 1].height
                }
                if (taxain.length == 0) {
                    var heightin = 0;
                } else {
                    var heightin = taxain[taxain.length - 1].y + taxain[taxain.length - 1].height
                }
                return Math.max(heightin, heightout);
            });
            //.each("end", function () { resizeControlsAndTaxa() });

        //Add/remove context menu item to contract all items
        if (this.taxa.some(function (taxon) { return (taxon.height != taxheight) })) {
            this.contextMenu.addItem("Contract all taxon items", function () {
                _this.taxa.forEach(function (taxon) { taxon.height = taxheight });
                _this.contextMenu.removeItem("Contract all taxon items");
                _this.refresh();
            }, [this.visName]);
        } else {
            this.contextMenu.removeItem("Contract all taxon items");
        }

        //Add/remove context menu item to expand all items
        if (this.taxa.some(function (taxon) { return (taxon.height == taxheight && _this.getTaxonImages(taxon.Taxon).length > 0) })) {
            this.contextMenu.addItem("Expand all taxon items", function () {
                _this.taxa.forEach(function (taxon, i) {
                    var taxonImages = _this.getTaxonImages(taxon.Taxon);
                    if (taxon.height == taxheight && taxonImages.length > 0) {
                        var imgLoad = new Image;
                        imgLoad.onload = function () {

                            d3.select("#vis1Svg").select("#taxon-" + i).select(".taxonimage")
                                .attr("xlink:href", this.src)
                                .attr("height", (taxwidth - 2 * margin) * imgLoad.height / imgLoad.width);

                            //Store the height of the rectangle which will come into effect later
                            taxon.height = (taxwidth - 2 * margin) * imgLoad.height / imgLoad.width + indVoffset + margin;

                            //This is asynchronous, so refresh must be called here
                            _this.refresh();
                        };
                        imgLoad.src = taxonImages[0].URI;
                    }
                });
                _this.contextMenu.removeItem("Expand all taxon items");
            }, [this.visName]);
        } else {
            this.contextMenu.removeItem("Expand all taxon items");
        }
    }

})(jQuery, this.tombiovis)