
(function ($, tbv) {

    "use strict";

    var visName = "vis2";
    var vis2 = tbv.v.visualisations[visName] = Object.create(tbv.v.visP);
    vis2.visName = visName;

    var _this;

    vis2.initialise = function () {

        _this = this;

        //Initialise the meta data
        this.metadata.title = "Single-column key";
        this.metadata.year = "2018";
        this.metadata.authors = "Burkmar, R";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Shrewsbury, England";
        this.metadata.contact = "r.burkmar@field-studies-council.org";
        this.metadata.version = '1.8.0';

        //Help files
        this.helpFiles = [
            tbv.opts.tombiopath + "vis2/vis2Help.html",
            tbv.opts.tombiopath + "common/taxonDetailsHelp.html",
            tbv.opts.tombiopath + "common/full-details.html",
            tbv.opts.tombiopath + "common/stateInputHelp.html"
        ]

        //Other initialisations
        this.showWeightedScores = true;
        this.displayToolTips = true;

        //Add the SVG
        d3.select("#" + this.visName).append("svg").attr("id", "vis2Svg");

        //Shares key input with several other multi-access keys
        var keyinput = tbv.opts.toolconfig[this.visName].keyinput;
        if (!tbv.gui.sharedKeyInput[keyinput]) {
            tbv.gui.sharedKeyInput[keyinput] = Object.create(tbv.gui[keyinput]);
            tbv.gui.sharedKeyInput[keyinput].init($(tbv.gui.main.divInput));
        }
        vis2.inputControl = tbv.gui.sharedKeyInput[keyinput];

        //Mark as initialised
        this.initialised = true;

        //Check interface
        tbv.f.checkInterface(visName, tbv.templates.visTemplate, tbv.v.visualisations[visName]);
    }

    vis2.refresh = function () {

        _this = this;

        //Variables for layout
        var indSpacing = 34;
        var gap = 2;
        var camImgSize = 16;
        var rectHeight = indSpacing - 2 * gap;
        var indRad = indSpacing / 2 - 2 * gap;

        //Set up scale for characters indiators indicator
        var scaleCharInd = d3.scaleLinear()
            .domain([-1, 0, 1])
            .range(tbv.d.scoreColours);

        //Set up scale for overall score indicator
        var maxOverall = d3.max(tbv.d.taxa, function (d) { return d.visState.score.overall; });
        var minOverall = d3.min(tbv.d.taxa, function (d) { return d.visState.score.overall; });
        var scaleOverall = d3.scaleLinear()
            .domain([minOverall, 0, maxOverall])
            .range(tbv.d.scoreColours);

        //Set up sort array
        var sortedTaxa = [];
        tbv.d.taxa.forEach(function (taxon) {
            sortedTaxa.push(taxon);
        });
        //tbv.f.sortTaxa(sortedTaxa, "vis2", "lastPosition");
        tbv.f.sortTaxa(sortedTaxa);

        ////A sort bug in Chrome and others means requires a workaround to ensure that 
        ////seemingly random changes amongst equal items are not produced. Remember last
        ////sort position to do this.
        ////Removed for version 1.7.0 in favour of using original position in kb instead.
        ////http://stackoverflow.com/questions/3195941/sorting-an-array-of-objects-in-chrome
        //for (var i = 0; i < sortedTaxa.length; i++) {
        //    sortedTaxa[i].visState['vis2'].lastPosition = i;
        //}

        //To work out the maximum width of the bounding box for Taxon labels,
        //add temporary (invisible) text objects to SVG - one for each taxon
        //and loop through them to get maximum size.
        var taxonWidth = 0;
        sortedTaxa.forEach(function (t) {
            d3.select("#vis2Svg").append("text")
                .attr("class", "scientificnames tmpTaxonText")
                .style("opacity", 0)
                .text(t.taxon);
        });

        d3.selectAll(".tmpTaxonText").each(function (i) {
            var bbox = this.getBBox();
            if (bbox.width > taxonWidth) taxonWidth = bbox.width;
        });
        taxonWidth += gap * 7 + 2 * indRad + camImgSize;

        //d3.selectAll(".tmpTaxonText").remove();

        //To work out the maximum height of the bounding box for Character labels,
        //add temporary (invisible) text objects to SVG - one for each included character
        //and loop through them to get maximum size.
        var characterHeight = 0;
        var usedCharacters = [];
        tbv.d.characters.forEach(function (character) {
            if (character.stateSet) {
                usedCharacters.push(character);
            }
        });
        usedCharacters.forEach(function (c) {
            d3.select("#vis2Svg").append("text")
                .attr("class", "type2VisCharacter tmpCharacterText")
                .style("opacity", 0)
                .text(c.Label);
        });
        d3.selectAll(".tmpCharacterText").each(function () {
            //We used to use the CSS SVG writing-mode: vertical-rl to rotate the text but this
            //didn't work with IE or Safari, so changed it to use transformation rotations instead.
            var bbox = this.getBBox();
            if (bbox.width > characterHeight) characterHeight = bbox.width;
        });
        d3.selectAll(".tmpCharacterText").remove();

        //Rebind taxa and data
        var mtU = d3.select("#vis2Svg").selectAll(".type2VisTaxon")
            .data(sortedTaxa, function (d, i) { return d.taxon; });
        var mtE = mtU.enter();
        var mtX = mtU.exit();

        //Initialize entering taxa.  
        //Create taxon grouping objects
        var mtM = mtE.append("g")
            .attr("class", "type2VisTaxon")
            .style("opacity", 0)
            .each(function (d, i) {

                d3.select(this).append("rect")
                    .attr("class", "taxarect");

                d3.select(this).append("text")
                    //Create taxon texts
                    .attr("class", "scientificnames")
                    .text(function () {
                        return d.taxon;
                    })
                    .style("cursor", "pointer")
                    .on("click", function () {
                        tbv.gui.main.showFullDetails(d.taxon, 0);
                    });

                d3.select(this).append("rect")
                    .attr("class", "type2VisOverallInd")
                    .attr("width", (indRad + gap) * 2)
                    .attr("height", indRad * 2)
                    .attr("x", gap)
                    .attr("title", "Overall weighted score");

                d3.select(this).append("text")
                    .attr("class", "type2VisOverallIndText")
                    .attr("text-anchor", "middle")
                    .attr("alignment-baseline", "central")
                    .attr("x", gap + indRad)
                    .attr("opacity", 0)
                    .attr("text", 0)
                    .attr("cursor", "default")
                    .attr("title", "Overall weighted score");

                d3.select(this).append("svg:image")
                    .attr("xlink:href", tbv.opts.tombiopath + "resources/camera.png")
                    .attr("class", "taxonImageLink")
                    .attr("width", camImgSize)
                    .attr("height", camImgSize)
                    .attr("x", function () {
                        return gap * 5 + indRad * 2;
                    })
                    .style("display", function () {
                        //Check if there are any images for this taxon
                        var charImages = tbv.d.media.filter(function (m) {
                            //Return images for matching taxon
                            if (m.Taxon == d.taxon.kbValue) return true;
                        });
                        if (charImages.length > 0) {
                            return null;
                        } else {
                            return "none";
                        }
                    })
                    .on("click", function () {
                        tbv.gui.main.showFullDetails(d.taxon, 1);
                    })
            })
            .merge(mtU);

        mtM.transition()
            .duration(1000)
            .style("opacity", 1)
            .each(function (d, i) {
                d3.select(this).select(".taxarect")
                    .transition()
                    .duration(1000)
                    .attr("x", function () {
                        return 0;
                    })
                    .attr("y", function () {
                        return characterHeight + i * indSpacing + gap;
                    })
                    .attr("width", function () {
                        return taxonWidth + gap + usedCharacters.length * indSpacing;
                    })
                    .attr("height", function () {
                        return indSpacing - 2 * gap;
                    });
                d3.select(this).select(".scientificnames")
                    .transition()
                    .duration(1000)
                    .attr("x", function () {
                        var bbox = this.getBBox();
                        return taxonWidth - bbox.width;
                    })
                    .attr("y", function () {
                        var bbox = this.getBBox();
                        return characterHeight + i * indSpacing + bbox.height + (indSpacing - bbox.height) / 3;
                    });
                d3.select(this).select(".type2VisOverallInd")
                    .transition()
                    .duration(1000)
                    .attr("y", function () {
                        return characterHeight + 2 * gap + i * indSpacing;
                    })
                    .attr("fill", function () {
                        return scaleOverall(d.visState.score.overall);
                    })
                d3.select(this).select(".type2VisOverallIndText")
                    .transition()
                    .duration(1000)
                    .attr("y", function () {
                        return characterHeight + (i + 0.5) * indSpacing;
                    })
                    .attr("text", function () {
                        //Text can't be transitioned - have to grab the object and change it
                        var score = d.visState.score.overall * 100;
                        score = Math.round(score) / 100;
                        d3.select(this).text(score);
                    })
                    .attr("opacity", 1);
                d3.select(this).select(".taxonImageLink")
                        //Transition taxon image link icon
                        .transition()
                        .duration(1000)
                        .attr("y", function () {
                            var iGap = (indSpacing - 2 * gap - camImgSize) / 2;
                            return characterHeight + i * indSpacing + gap + iGap;
                        })
            })

        //Transition exiting taxa
        mtX.transition()
            .duration(1000)
            .style("opacity", 0)
            .remove();

        tbv.gui.main.createTaxonToolTips(".scientificnames", this.displayToolTips);
        tbv.gui.main.tooltip(".type2VisOverallInd");
        tbv.gui.main.tooltip(".type2VisOverallIndText");

        //Character state indicators
        mtM.each(function (d, i) {

            var iTaxon = i;
            var taxon = d;
            var taxonTag = tbv.f.taxonTag(d.taxon.kbValue);                     

            var mi = d3.select(this).selectAll(".type2VisIndicators-" + taxonTag)
                .data(usedCharacters, function (d, i) { return d.Character + "-" + taxonTag; });
            mi.enter()
                .append("g")
                .attr("class", "type2VisIndicators-" + taxonTag)
                .style("cursor", "pointer") 
                .on("click", function (d, i) {
                    tbv.gui.main.dialog('Character score details', tbv.f.getCharacterScoreDetails(taxon, d));
                })
                .each(function () {

                    d3.select(this).append("circle")
                        .attr("r", indSpacing / 2 - 2 * gap)
                        .attr("class", "type2VisInd")
                        .attr("fill", "white")
                        .style("opacity", 0);
                    d3.select(this).append("text")
                        .style("opacity", 0)
                        .attr("class", "type2VisIndtext")
                        .attr("text-anchor", "middle")
                        .attr("alignment-baseline", "central");
                })
            .merge(mi)
                .each(function (d, i) {
                    d3.select(this).select(".type2VisInd")
                        .transition()
                        .duration(1000)
                        .attr("cx", function () {
                            return taxonWidth + gap + (i + 0.5) * indSpacing;
                        })
                        .attr("cy", function () {
                            //return taxonHeight + (i + 1) * indSpacing -5;
                            return characterHeight + (iTaxon + 0.5) * indSpacing;
                        })
                        .attr("fill", function () {
                            return scaleCharInd(taxon[d.Character].score.overall);
                        })
                        .style("opacity", 1);

                    d3.select(this).select(".type2VisIndtext")
                        .transition()
                        .duration(1000)
                        .attr("text", function () {
                            //Text can't be transitioned - have to grab the object and change it
                            if (_this.showWeightedScores) {
                                var weight = Number(tbv.d.oCharacters[d.Character].Weight) / 10;
                            } else {
                                var weight = 1;
                            }
                            //Scores use to be shown rounded to the nearest 0.1, but this could 
                            //result in near matches showing a perfect score, 0.96 displaying as 1.0. This
                            //could be misleading so this has been changed (15/06/2017) to round *down*
                            //to the nearest 0.1. Still not a perfect solution, but not as potentially misleading.
                            var score = taxon[d.Character].score.overall * weight * 10;
                            //score = Math.round(score) / 10;
                            score = Math.floor(score) / 10;

                            d3.select(this).text(score);
                            //return true;
                        })
                        .attr("x", function () {
                            return taxonWidth + gap + (i + 0.5) * indSpacing;
                        })
                        .attr("y", function () {
                            return characterHeight + (iTaxon + 0.5) * indSpacing;
                        })
                        .style("opacity", 1);
                })

            //Exit taxon character state indicators
            mi.exit()
                .transition()
                .duration(1000)
                .style("opacity", 0)
                .remove();
        })
        
        //Select characters and bind to data.
        var mc = d3.select("#vis2Svg").selectAll(".type2VisCharacter")
            .data(usedCharacters, function (d, i) { return d.Character; });
        
        //Initialize entering characters.
        mc.enter()
            .append("text")
            .attr("class", "type2VisCharacter")
            .style("opacity", 0)
            .text(function (d) {
                return d.Label;
            })
          .merge(mc).transition()
            .duration(1000)
            .style("opacity", 1)
            .attr("x", function (d, i) {
                return taxonWidth + gap + (i + 0.5) * indSpacing;
            })
            .attr("y", function () {
                var bbox = this.getBBox();
                return characterHeight - bbox.width;
            })
            .attr("transform", function (d, i) {
                var bbox = this.getBBox();
                var x = taxonWidth + gap + (i + 0.5) * indSpacing;
                var y = characterHeight - bbox.width;
                return "rotate(90 " + x + "," + y + ")";
            })

        //Transition exiting characters
        mc.exit().transition()
            .duration(1000)
            .attr("x", 0)
            .attr("y", 0)
            .style("opacity", 0)
            .remove();

        //Resize the SVG
        d3.select("#vis2Svg")
            .transition()
            .duration(1000)
            .attr("width", function (d, i) {
                return taxonWidth + gap + usedCharacters.length * indSpacing;
            })
            .attr("height", function (d, i) {
                return characterHeight + tbv.d.taxa.length * indSpacing;
            });

        //resizeControlsAndTaxa();

        //Context menu item to get URL
        tbv.gui.main.contextMenu.addItem("Get URL for single-column key", function () {
            getViewURL();
        }, false, [this.visName]);

        //Context menu for showing weighted/unweighted values
        if (this.showWeightedScores) {
            tbv.gui.main.contextMenu.removeItem("Show weighted scores");
            tbv.gui.main.contextMenu.addItem("Show unweighted scores", function () {
                _this.showWeightedScores = false;
                _this.refresh();
            }, false, [this.visName]);
        } else {
            tbv.gui.main.contextMenu.removeItem("Show unweighted scores");
            tbv.gui.main.contextMenu.addItem("Show weighted scores", function () {
                _this.showWeightedScores = true;
                _this.refresh();
            }, false, [this.visName]);
        }

        //Add/remove context menu item to show taxon tooltip images
        if (this.displayToolTips) {
            tbv.gui.main.contextMenu.addItem("Remove taxon image tooltips", function () {
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
    }

    vis2.urlParams = function (params) {

        //Weighted scores
        if (params["weighted"]) {
            _this.showWeightedScores =params["weighted"] === "true";
        }

        //Taxon image tooltips
        if (params["imgtips"]) {
            _this.displayToolTips = params["imgtips"] === "true";
        }

        //Set the state controls
        tbv.f.initControlsFromParams(params);
    }

    vis2.show = function () {
        //Responsible for showing all gui elements of this tool
        $("#vis2").show();
        $(vis2.inputControl.divSel).show();
        vis2.inputControl.initFromCharacterState();
    }

    vis2.hide = function () {
        //Responsible for hiding all gui elements of this tool
        $("#vis2").hide();
        $(vis2.inputControl.divSel).hide();
    }

    function getViewURL() {

        var params = [];

        //Tool
        params.push("selectedTool=" + visName)

        //Get user input control params
        Array.prototype.push.apply(params, tbv.f.setParamsFromControls());

        //Weighted scores?
        params.push("weighted=" + _this.showWeightedScores);
        
        //Image tooltips
        params.push("imgtips=" + _this.displayToolTips);

        //Generate the full URL

        tbv.f.createViewURL(params);
    }

})(jQuery, this.tombiovis)