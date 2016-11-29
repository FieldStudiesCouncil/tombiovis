
(function ($, core) {

    "use strict";

    var visName = "vis2";
    var exports = core[visName] = {};

    exports.Obj = function (parent, contextMenu, core) {

        core.visP.Obj.call(this, visName, parent, contextMenu, core);

        //Initialise the meta data
        this.metadata.title = "Single-column key";
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

        //Controls works with character state input controls
        this.charStateInput = true;

        //Help files
        this.helpFiles = [
            tombiopath + "vis2/vis2Help.html",
            tombiopath + "common/imageGroupHelp.html",
            tombiopath + "common/stateInputHelp.html"
        ]

        //Other initialisations
        this.showWeightedScores = true;
        
        //Add the SVG
        d3.select("#" + this.visName).append("svg").attr("id", "vis2Svg");

        //Create taxon state object array
        //this.stateTaxa = {};
        //taxa.forEach(function (taxon) {
        //    _this.stateTaxa[taxon.Taxon.value] = {}
        //})
    }

    exports.Obj.prototype.refresh = function () {

        var _this = this;

        //Variables for layout
        var indSpacing = 34;
        var gap = 2;
        var camImgSize = 16;
        var rectHeight = indSpacing - 2 * gap;
        var indRad = indSpacing / 2 - 2 * gap;

        //Set up scale for characters indiators indicator
        //Colours from http://colorbrewer2.org/
        var scaleCharInd = d3.scale.linear()
            .domain([-1, 0, 1])
            .range(['#fc8d59', '#ffffbf', '#91bfdb']);

        //Set up scale for overall score indicator
        //Vermillion-Yellow-Blue http://jfly.iam.u-tokyo.ac.jp/color/
        var maxOverall = d3.max(this.taxa, function (d) { return d.scoreoverall; });
        var minOverall = d3.min(this.taxa, function (d) { return d.scoreoverall; });
        var scaleOverall = d3.scale.linear()
            .domain([minOverall, 0, maxOverall])
            .range(['#fc8d59', '#ffffbf', '#91bfdb']);

        //Get maximum width of taxon text elements
        var taxonWidth = 0;
        var taxonCount = 0;

        //Set up sort array
        var sortedTaxa = [];
        this.taxa.forEach(function (taxon) {
            sortedTaxa.push(taxon);
        });
        this.sortTaxa(sortedTaxa, "lastPosition");

        //A sort bug in Chrome and others means requires a workaround to ensure that 
        //seemingly random changes amongst equal items are not produced. Remember last
        //sort position to do this.
        //http://stackoverflow.com/questions/3195941/sorting-an-array-of-objects-in-chrome
        for (var i = 0; i < sortedTaxa.length; i++) {
            sortedTaxa[i].lastPosition = i;
        }

        //Rebind taxa and data
        var mt = d3.select("#vis2Svg").selectAll(".type2VisTaxon")
            .data(sortedTaxa, function (d, i) { return d.Taxon; });

        //Initialize entering taxa. 
        var mte = mt.enter()
            //Create taxon grouping objects
            .append("g")
                .attr("class", "type2VisTaxon")
                .style("opacity", 0)

        mte.append("rect")
            //Create taxon rectangles
            .attr("class", "taxarect");

        mte.append("rect")
            .attr("class", "type2VisOverallInd")
            .attr("width", (indRad + gap) * 2)
            .attr("height", indRad * 2)
            .attr("x", gap)
            .attr("title", "Overall weighted score");


        $(".type2VisOverallInd").tooltip();


        mte.append("text")
            .attr("class", "type2VisOverallIndText")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .attr("x", gap + indRad)
            .attr("opacity", 0)
            .attr("text", 0)
            .attr("cursor", "default")
            .attr("title", "Overall weighted score");

        $(".type2VisOverallInd").tooltip();
        $(".type2VisOverallIndText").tooltip();

        mte.append("svg:image")
            .attr("xlink:href", tombiopath + "resources/camera.png")
            .attr("class", "taxonImageLink")
            .attr("width", camImgSize)
            .attr("height", camImgSize)
            .attr("x", function (d, i) {
                return gap * 5 + indRad * 2;
            })
            .style("display", function (d, i) {
                //Check if there are any images for this taxon
                var charImages = _this.media.filter(function (m) {
                    //Return images for matching taxon
                    if (m.Taxon == d.Taxon) return true;
                });
                if (charImages.length > 0) {
                    return "";
                } else {
                    return "none";
                }
            })
            .on("click", function (d, i) {

                var offset = $("#tombioMain").offset();
                var x = d3.event.clientX - offset.left + document.body.scrollLeft;
                var y = d3.event.clientY - offset.top + document.body.scrollTop;;

                _this.showFloatingImages(d.Taxon, x, y);
            });

        mte.append("text")
            //Create taxon texts
            .attr("class", "scientificnames")
            .text(function (d) {
                return d.Taxon;
            })
            .style("cursor", "pointer")
            .on("click", function (d) {
                _this.showTaxonCharacterValues(d);
            });

        //Create the used characters array
        var usedCharacters = [];
        this.characters.forEach(function (character) {
            if (character.stateSet) {
                usedCharacters.push(character);
            }
        });
        
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
            });

        //Get maximum width of character text elements
        var characterHeight = 0;
        var charCount = 0;
        mc.each(function () {
            var bbox = this.getBBox();
            if (bbox.height > characterHeight) characterHeight = bbox.height;
            charCount++;
        });

        //Work out the taxon width
        mt.selectAll(".scientificnames").each(function () {
            var bbox = this.getBBox();
            if (bbox.width > taxonWidth) taxonWidth = bbox.width;
            taxonCount++;
        });

        taxonWidth += gap * 7 + 2 * indRad + camImgSize;

        //Transition entering + updating characters
        mc.transition()
            .duration(1000)
            .style("opacity", 1)
            .attr("x", function (d, i) {
                return taxonWidth + gap + (i + 0.5) * indSpacing;
            })
            .attr("y", function () {
                var bbox = this.getBBox();
                return characterHeight - bbox.height;
            });

        //Transition exiting characters
        mc.exit().transition()
            .duration(1000)
            .style("opacity", 0)
            .remove();

        //Transition entering + updating taxa
        mt.transition()
            //Transition taxon grouping objects
            .duration(1000)
            .style("opacity", 1);

        mt.selectAll("text")
            //Transition taxon text objects
            .transition()
            .duration(1000)
            .attr("x", function (d, i, j) {
                var bbox = this.getBBox();
                return taxonWidth - bbox.width;
            })
            .attr("y", function (d, i, j) {
                var bbox = this.getBBox();
                return characterHeight + j * indSpacing + bbox.height + (indSpacing - bbox.height) / 3;
            });

        mt.select(".taxarect")
            //Transition taxon rectangles
            .transition()
            .duration(1000)
            .attr("x", function (d, i) {
                return 0;
            })
            .attr("y", function (d, i) {
                return characterHeight + i * indSpacing + gap;
            })
            .attr("width", function (d, i, j) {
                return taxonWidth + gap + usedCharacters.length * indSpacing;
            })
            .attr("height", function (d, i, j) {
                return indSpacing - 2 * gap;
            })

        mt.select("image")
            //Transition taxon image link icon
            .transition()
            .duration(1000)
            .attr("y", function (d, i) {
                var iGap = (indSpacing - 2 * gap - camImgSize) / 2;
                return characterHeight + i * indSpacing + gap + iGap;
            })

        mt.select(".type2VisOverallInd")
            .transition()
            .duration(1000)
            .attr("y", function (d, i) {
                return characterHeight + 2 * gap + i * indSpacing;
            })
            .attr("fill", function (d, i) {
                return scaleOverall(d.scoreoverall);
            })

        mt.select(".type2VisOverallIndText")
            .transition()
            .duration(1000)
            .attr("y", function (d, i) {
                return characterHeight + (i + 0.5) * indSpacing;
            })
            .attr("text", function (d, i) {
                //Text can't be transitioned - have to grab the object and change it
                var score = d.scoreoverall * 100;
                score = Math.round(score) / 100;
                d3.select(this).text(score);
            })
            .attr("opacity", 1);


        mt.each(function (d, i) {
            //Enter taxon character state indicators
            var iTaxon = i;
            var taxon = d;
            var taxonTag = d.Taxon.value.replace(/[|&;$%@"<>()+:.,' ]/g, '');
            var mi = d3.select(this).selectAll(".type2VisIndicators-" + taxonTag)
                .data(usedCharacters, function (d, i) { return d.Character + "-" + taxonTag; });

            var mig = mi.enter()
                .append("g")
                .attr("class", "type2VisIndicators-" + taxonTag)
                .style("cursor", "pointer")
                .on("click", function (d, i) {
                    _this.showCharacterScoreDetails(taxon, d);
                });

            mig.append("circle")
                .attr("r", indSpacing / 2 - 2 * gap)
                .attr("class", "type2VisInd")
                .attr("fill", "white")
                .style("opacity", 0);

            mig.append("text")
                .style("opacity", 0)
                .attr("class", "type2VisIndtext")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "central");

            //Transition taxon character state indicators
            mi.select(".type2VisInd")
                .transition()
                .duration(1000)
                .attr("cx", function (d, i) {
                    return taxonWidth + gap + (i + 0.5) * indSpacing;
                })
                .attr("cy", function (d, i) {
                    //return taxonHeight + (i + 1) * indSpacing -5;
                    return characterHeight + (iTaxon + 0.5) * indSpacing;
                })
                .attr("fill", function (d, i) {
                    return scaleCharInd(taxon.matchscore[d.Character].scoreoverall);
                })
                .style("opacity", 1); 

            mi.select(".type2VisIndtext").transition()
                .duration(1000)
                .attr("text", function (d) {
                    //Text can't be transitioned - have to grab the object and change it
                    if (_this.showWeightedScores) {
                        var weight = Number(_this.oCharacters[d.Character].Weight) / 10;
                    } else {
                        var weight = 1;
                    }
                    var score = taxon.matchscore[d.Character].scoreoverall * weight * 10;
                    score = Math.round(score) / 10;

                    d3.select(this).text(score);
                    //return true;
                })
                .attr("x", function (d, i) {
                    return taxonWidth + gap + (i + 0.5) * indSpacing;
                })
                .attr("y", function (d, i) {
                    return characterHeight + (iTaxon + 0.5) * indSpacing;
                })
                .style("opacity", 1);

            //Exit taxon character state indicators
            mi.exit()
                .transition()
                .duration(1000)
                .style("opacity", 0)
                .remove();
        })

        //Transition exiting taxa
        mt.exit().transition()
            .duration(1000)
            .style("opacity", 0)
            .remove();

        //Resize the SVG
        d3.select("#vis2Svg")
            .transition()
            .attr("width", function (d, i) {
                return taxonWidth + gap + usedCharacters.length * indSpacing;
            })
            .attr("height", function (d, i) {
                return characterHeight + _this.taxa.length * indSpacing;
            });

        //resizeControlsAndTaxa();

        //Context menu for showing weighted/unweighted values
        if (this.showWeightedScores) {
            this.contextMenu.removeItem("Show weighted scores");
            this.contextMenu.addItem("Show unweighted scores", function () {
                _this.showWeightedScores = false;
                _this.refresh();
            }, [this.visName]);
        } else {
            this.contextMenu.removeItem("Show unweighted scores");
            this.contextMenu.addItem("Show weighted scores", function () {
                _this.showWeightedScores = true;
                _this.refresh();
            }, [this.visName]);
        }
    }
})(jQuery, this.tombiovis)