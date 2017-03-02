
(function ($, core) {

    //Template visualisation that inherits from visP.
    "use strict";

    var visName = "vis5";
    var exports = core[visName] = {};

    var root, 
        focus, 
        svg, 
        pack, 
        circleU,
        circleE, 
        circleM, 
        textM, 
        text, 
        label, 
        view, 
        node, 
        diameter, 
        margin,
        taxonRanks,
        taxaRoot,
        taxaRootFlat,
        taxaRootCurrent,
        abbrvNames = true,
        g, 
        color,
        lastZoomWasPan,
        zoomStarted,
        selectedRank;

    exports.Obj = function (parent, contextMenu, core) {

        core.visP.Obj.call(this, visName, parent, contextMenu, core);

        //Initialise the meta data
        this.metadata.title = "Circle-pack key";
        this.metadata.authors = "Rich Burkmar";
        this.metadata.year = "2016";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Preston Montford, Shropshire";
        this.metadata.contact = null;
        this.metadata.version = "0.1.0";
    }

    exports.Obj.prototype = Object.create(core.visP.Obj.prototype);

    exports.Obj.prototype.initialise = function () {

        var _this = this;

        //Reset this value if control can work with character state input controls
        this.charStateInput = true;

        //Help files
        this.helpFiles = [
            //tombiopath + "vis4/vis4Help.html",
            //tombiopath + "common/imageGroupHelp.html"
        ]

        //Add circle pack stuff
        svg = d3.select("#" + this.visName)
            .append("svg")
            .attr("id", "vis5Svg")
            .attr("width", "500")
            .attr("height", "500")
            .attr("overflow", "visible")
            .call(d3.zoom()
                .on('zoom', mouseZoom)
                .on('end', $.proxy (mouseZoomEnd, _this)) //This jQuery proxy method passes _this as a context to event handler
            );

        svg.on("click", function () { zoomToNode(root); });

        margin = 20;
        diameter = +svg.attr("width");
        g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

        color = d3.scaleLinear()
           .domain([-1, 5])
           .range(["hsl(152,0%,80%)", "hsl(228,0%,40%)"])
           .interpolate(d3.interpolateHcl);

        pack = d3.pack()
            .size([diameter - margin, diameter - margin])
            .padding(2);

        //Parse the knowledge-base to build an object representing the taxa
        //that is suitable for passing to the d3.hierachy function.

        //First build an array of all the Taxonomy characters.
        taxonRanks = [];
        core.characters.forEach(function (c) {
            if (c.Group == "Taxonomy" || c.Character == "Taxon"){
                taxonRanks.push(c.Character);
            }
        })

        var stratTable = [{name: "All taxa", parent: ""}], ir = 0;
        //Create a table suitable for input into the d3.stratify function
        taxonRanks.forEach(function (r, iR) {
            core.taxa.forEach(function (t, iT) {
                var rankValue = t[r].kbValue;
                if (rankValue != "" && !stratTable.find(function (entry) { return entry.name == rankValue })) {

                    var rvParent = "";
                    for (var iParent = iR - 1; iParent > -1; iParent -= 1) {
                        rvParent = t[taxonRanks[iParent]].kbValue;
                        if (rvParent != "") break;
                    }
                    if (rvParent == "") rvParent = "All taxa";

                    stratTable.push({
                        name: rankValue,
                        parent: rvParent,
                        rankColumn: r,
                        rank: core.oCharacters[r].Label,
                        abbrv: [rankValue,
                            getAbbrv(rankValue, 1, (r == "Taxon")),
                            getAbbrv(rankValue, 2, (r == "Taxon")),
                            getAbbrv(rankValue, 3, (r == "Taxon"))],
                        taxon: r == "Taxon" ? t : null
                        //order: iT
                    })
                }
            })
        })

        //Pass to the d3.stratify function to build an object representing
        //the taxonomic hierarchy suitable for passing to d3.hierarchy
        taxaRoot = d3.stratify()
            .id(function (d) { return d.name; })
            .parentId(function (d) { return d.parent; })
            (stratTable);

        //Carry out a d3.stratify to give us a flat version
        taxaRootFlat = d3.stratify()
            .id(function (d) { return d.name; })
            .parentId(function (d) {
                if (d.parent == "") {
                    return "";
                } else {
                    return "All taxa";
                }    
            })
            (stratTable);

        //Weed out all higher level ranks from the flat version
        var filteredChildren = taxaRootFlat.children.filter(function (child) {
            return child.data.rankColumn == "Taxon";
        })
        taxaRootFlat.children = filteredChildren;

        taxaRootCurrent = taxaRoot;
    }

    exports.Obj.prototype.refresh = function () {

        var _this = this;

        var maxOverall = d3.max(core.taxa, function (d) { return d.scoreoverall; });
        var minOverall = d3.min(core.taxa, function (d) { return d.scoreoverall; });

        //console.log(taxonRanks.length, )

        //Initialise context menu items

        //Add context menu item for abbreviation toggle
        _this.contextMenu.addItem("Toggle name abbreviation", function () {
            abbrvNames = !abbrvNames;
            _this.refresh();
        }, [_this.visName]);

        if (taxonRanks.length > 1 && taxaRootCurrent == taxaRoot) {

            _this.contextMenu.addItem("Ignore higher taxa", function () {
                taxaRootCurrent = taxaRootFlat;
                displayTextForRank("Taxon");
                _this.refresh();
            }, [_this.visName]);

            taxonRanks.forEach(function (rank) {
                _this.contextMenu.addItem("Show names for each " + core.oCharacters[rank].Label, function () {
                    displayTextForRank(rank);
                    _this.refresh();
                }, [_this.visName]);
            });

            _this.contextMenu.removeItem("Show higher taxa");

        } else if (taxonRanks.length > 1 && taxaRootCurrent == taxaRootFlat) {
            _this.contextMenu.addItem("Show higher taxa", function () {
                taxaRootCurrent = taxaRoot;
                displayTextForRank("Taxon");
                _this.refresh();
            }, [_this.visName]);

            taxonRanks.forEach(function (rank) {
                _this.contextMenu.removeItem("Show names for each " + core.oCharacters[rank].Label);
            });

            _this.contextMenu.removeItem("Ignore higher taxa");
        }

        //Prepare scales for the indicators
        //Vermillion-Yellow-Blue http://jfly.iam.u-tokyo.ac.jp/color/
        var scaleOverall = d3.scaleLinear()
            .domain([minOverall, 0, maxOverall])
            .range(['#fc8d59', '#ffffbf', '#91bfdb']);

        //If the minimum overall score is greater than zero, correction is zero, otherwise
        //the correction is the absolute value of the minimum overall score.
        var correction = minOverall < 0 ? 0 - minOverall : 0;

        root = d3.hierarchy(taxaRootCurrent)
             .sum(function (d) {
                 //This is the part which helps determine the size of the circles in the circle pack.
                 //If the taxon has the minimum overall score, then the addition of the correction makes zero,
                 //and the addition of 0.1 is to prevent zero width. Raising to a power, exaggerates the differences
                 //between low and high scores.
                 return d.data.taxon ? Math.pow(d.data.taxon.scoreoverall + correction + 0.1, 1.5): 0;
             })
             .sort(function (a, b) {
                 //Careful what goes in here. Nonsensical can cause pack to hang.
                 return b.value - a.value;
             });

        focus = root;

        var nodes = pack(root).descendants();

        circleU = g.selectAll("circle")
            .data(nodes, function (d) { return d.data.id });

        circleE = circleU.enter().append("circle")
            //Assign the correct class dependent on whether root, leaf or mid node.
            .attr("class", function (d) {
                //var cls = d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
                var cls = d.children ? "node node-higher-taxa" : "node";
                cls += " " + d.data.data.rankColumn;
                return cls;
            })
            .attr("id", function (d) { return _this.taxonTag(d.data.id); })
            .on("click", function (d) {
                if (focus !== d) {
                    d3.event.stopPropagation();
                    zoomToNode(d);
                }
            });

        circleM = circleE.merge(circleU);

        circleM.attr("title", function (d) {
            if (d.children) {
                if (d.data.data.rank) {
                    return d.data.id + " (" + d.data.data.rank + ")";
                } else {
                    return d.data.id;
                }
            } else {
                console.log(d)
                return taxonTooltip(d)
            }
        });

        // circleU.exit().remove(); 
        //Can't remove on exit because if re-created on enter, they nodes for higher levels can
        // get drawn over leaf nodes. So just make them invisible instead.
        if (taxaRootCurrent == taxaRoot && taxonRanks.length > 1) {
            $(".node-higher-taxa").css("visibility", "visible")
        } else {
            $(".node-higher-taxa").css("visibility", "hidden")
        }

        var transitionRefresh = d3.transition().duration(750);

        circleM.transition(transitionRefresh)
            .style("fill", function (d) {
                if (d.children) {
                    return color(d.depth);
                } else {
                    return scaleOverall(d.data.data.taxon.scoreoverall);     
                }
            })
        var textU = g.selectAll("text")
            .data(nodes, function (d) { return d.data.id });

        var textE = textU.enter()
            .append("text")
            .text(function (d) { return d.data.id; })
            .style("background-color", "red")
            .attr("taxonName", function (d) { return d.data.id; })
            .attr("class", function (d) {
                return "label " + d.data.data.rankColumn;
            })
            .attr("circleId", function (d) { return _this.taxonTag(d.data.id); })
            .style("display", "none")
            .on("click", function (d) {
                if (!d.data.data.taxon) return
                d3.event.stopPropagation();
                _this.showTaxonCharacterValues(d.data.data.taxon);
                //console.log("click detected on text")
            })
            
        textM = textE.merge(textU)
            .attr("title", function (d) {
                if (d.children) {
                    return d.data.id;
                } else {
                    return taxonTooltip(d);
                }
            })
          
        textU.exit().remove();

        $("circle, text").tooltip({
            track: true,
            position: { my: "left+20 center", at: "right center" },
            open: function (event, ui) {
                setTimeout(function () {
                    $(ui.tooltip).hide({ effect: "fade", duration: 500 });
                }, 3000);
            },
            content: function () {
                return $(this).attr("title");
            }
        });


        if (view) {
            //If view exists, we are already zoomed somewhere
            zoomToView(view, view, transitionRefresh, true);
        } else {
            //First time in, therefore zoom to root
            zoomToView([root.x, root.y, root.r * 2 + margin], [root.x, root.y, root.r * 2 + margin], transitionRefresh, true);
            //First time in, display taxa text
            displayTextForRank("Taxon");
        }

        highlightTopScorers(transitionRefresh);

        function taxonTooltip(d) {

            console.log(d)

            //For leaf nodes (i.e. those representing actual taxa, set the title attribute
            //to some HTML that reflects the name and its overall score - including a colour
            //swatch behind the score. Further on, we use the 'option' attribute of the 
            //jQuery tooltip command to return this as HTML.
            return "<i>" + d.data.id + "</i> <span style='background-color: " +
                    scaleOverall(d.data.data.taxon.scoreoverall) +
                    "; padding: 2px 5px 2px 5px; margin-left: 5px'>" +
                    Math.round(d.data.data.taxon.scoreoverall * 100) / 100 + "</span>"
        }
    }

    function highlightTopScorers(transitionRefresh) {

        var maxOverall = d3.max(core.taxa, function (d) { return d.scoreoverall; });

        circleM.transition(transitionRefresh)
            .filter(function (d) {
                return d.data.data.taxon;
            })
            .style("stroke", function(d) {
                if (maxOverall > 0 && d.data.data.taxon.scoreoverall == maxOverall) return "black";
                if (selectedRank == "Taxon") return "black";
                return null;
            })
            .style("stroke-width", function(d) {
                if (maxOverall > 0 && d.data.data.taxon.scoreoverall == maxOverall) return "2px";
                if (selectedRank == "Taxon") return "1px";
                return "0px";
            })
            .style("stroke-linecap", function(d) {
                if (maxOverall > 0 && d.data.data.taxon.scoreoverall == maxOverall) return "round";
                return null;
            })
            .style("stroke-dasharray", function(d) {
                if (maxOverall > 0 && d.data.data.taxon.scoreoverall == maxOverall) return "1, 5";
                return null;
            })
    }

    function zoomToNode(d) {

        focus = d;
        d3.transition()
            .duration(750)
            .tween("zoom", function () {
                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                return function (tween) { zoomToView(i(tween), [focus.x, focus.y, focus.r * 2 + margin], null, true); };
            });
    }

    function zoomToView(newView, endView, transitionRefresh, drawText) {

        //Remove any tool tip currently shown
        $(".node").tooltip("close");

        var k = diameter / newView[2]; view = newView;

        //Relocate circles and text objects.
        //Because text always needs to be drawn on top of all circles, it has to be
        //drawn afterwards.
        if (transitionRefresh) {
            g.selectAll("circle,text").transition(transitionRefresh)
                .attr("transform", function (d) { return "translate(" + (d.x - newView[0]) * k + "," + (d.y - newView[1]) * k + ")"; })
                .attr("r", function (d) { return d.r * k; });
        } else {
            g.selectAll("circle,text")
                .attr("transform", function (d) { return "translate(" + (d.x - newView[0]) * k + "," + (d.y - newView[1]) * k + ")"; })
                .attr("r", function (d) { return d.r * k; });
        }

        //If the new view and end view match, then this is not called by a tween and
        //we can redraw text if drawText argument is set.
        //This all done to minimise the text visibility computations which are
        //computationally expensive and therefore slow panning and zooming down.
        if (Math.round(newView[0] * 100) / 100 == Math.round(endView[0] * 100) / 100 &&
            Math.round(newView[1] * 100) / 100 == Math.round(endView[1] * 100) / 100 &&
            Math.round(newView[2] * 100) / 100 == Math.round(endView[2] * 100) / 100 &&
            drawText) {

            displayTaxonNames(transitionRefresh);
        }
    }

    function displayTaxonNames(transition) {
        if (transition) {       
            g.selectAll("text").transition(transition)
                .on("end", function (d) {
                    //Performing this at the end of the passed in transition ensures that the text
                    //objects aren't set until the circles have been completely resized - therefore
                    //ensuring correct wrapping.
                    setTextObjectTextValue(d3.select(this), d)
                });
        } else {
            g.selectAll("text").each(function (d) {
                setTextObjectTextValue(d3.select(this), d)
            });
        }

    }

    function mouseZoom() {
        
        //console.log("mouseZoom")
        //Double clicks get here and cause a problem because sourceEvent is null,
        //so trap these.
        if (!d3.event.sourceEvent) return;

        //This global variable set in order to detect whether or not, when mouseZoomEnd
        //is fired, it was the result of a genuine zoom.
        zoomStarted = true;

        var dx = d3.event.sourceEvent.movementX * (view[2]/diameter);
        var dy = d3.event.sourceEvent.movementY * (view[2]/diameter);

        var wdy = d3.event.sourceEvent.wheelDeltaY, delta;
        if (wdy) {
            if (wdy > 0) {
                delta =  100/wdy;
            } else {
                delta = Math.abs(wdy/100);
            }
        } else {
            delta = 1;
        }
        var newView = [view[0] - dx, view[1] - dy, view[2] * delta];
    
        lastZoomWasPan = (delta == 1);

        //Zoom to view without redrawing text
        zoomToView(newView, newView, null, false);
    }

    function mouseZoomEnd() {

        //console.log("this", _this)
        //console.log(d3.event.sourceEvent)
        //var _this = this;

        if (!zoomStarted) {
            //Very odd behaviour. Click events on texts - once tspans added - didn't fire.
            //But I found that when they weren't firing, zoomEnd was firing without  zoom.
            //So I put all this code in here to invoke Taxon properties dialog. However,
            //Once I started calling this function with a jQuery proxy (from zoom behaviour)
            //I found that click events were subsequently fired! Therefore I commented
            //console.log("mouse click in zoom end")
            //var taxon = d3.event.sourceEvent.srcElement.__data__.data.data.taxon;
            //if (!taxon) return
            //_this.showTaxonCharacterValues(taxon);
        } else {
            //console.log("zoom end")
            //For mouse zoom operations, redraw of text is prevented during mouse zoom
            //events and only triggered here on zoom end. This is necessary for performance
            //for knowledge bases with large numbers of taxa. If the zoom was a pan operation,
            //then the text is not redrawn at all.
            if (!lastZoomWasPan) displayTaxonNames(null);
        }
        zoomStarted = false;
    }

    function getAbbrv(text, level, isLeafNode) {

        //This function is used to derived abbreviations for taxon names.
        //if (!isLeafNode) return text;

        var nameParts = text.split(/\s+/).reverse();

        if (nameParts.length > 1) {
            //Multi-part names...
            if (level == 1) {
                //First letter only of first name plus the rest
                var firstPart = nameParts.pop();
                return firstPart.substring(0, 1) + ". " + nameParts.reverse().join(" ");
            } else if (level == 2) {
                //First letter only of first name plus three letters of each of the rest
                var firstPart = nameParts.pop();
                var abbrv = firstPart.substr(0, 1) + ".";
                var namePart;
                while (namePart = nameParts.pop()) {
                    abbrv += " " + namePart.substr(0, 3);
                    if (namePart.length > 3) abbrv += ".";
                }
                return abbrv;
            } else {
                //First letter of each part
                var abbrv = "", namePart;
                while (namePart = nameParts.pop()) {
                    abbrv += namePart.substr(0, 1);
                }
                return abbrv;
            }
        } else {
            //For single part names...
            if (level == 1) {
                //Abbreviate to five characters
                if (text.length > 5) {
                    return text.substr(0, 5) + ".";
                } else {
                    return text;
                }
            } else if (level == 2) {
                //Abbreviate to three characters
                if (text.length > 3) {
                    return text.substr(0, 3) + ".";
                } else {
                    return text;
                }
            } else {
                //Abbreviate to one character
                return text.substr(0, 1) + ".";
            }
        }
    }

    function displayTextForRank(rank) {

        selectedRank = rank;

        d3.selectAll(".label")
            .style("display", "none");
        d3.selectAll("text." + rank)
            .style("display", "inline");

        d3.selectAll("circle")
            .style("stroke-width", "0px");
        d3.selectAll("circle." + rank)
            .style("stroke", "black")
            .style("stroke-width", "1px");
    }

    function setTextObjectTextValue(text, d) {

        if (text.style("display") == "none") return;
        
        var circle = d3.select("#" + text.attr("circleId"));
        var width = circle.node().getBBox().width;
        //Version below gets width of a circle without calling getBBox - but needs zoomFactor
        //global variable (set from k in ...)
        //var width = circle._groups[0][0].__data__.r * zoomFactor * 2;

        if (!abbrvNames) {
            wrapText(text, width, d.data.data.abbrv[0]);
            return;
        }

        //If circle below a minimum threshold, then make text invisible (but only for leaf nodes)
        if (width < 20 && abbrvNames) { //&& d.data.data.taxon
            text.text(null);
            return;
        }

        var thresholds = [80, 55, 30];
        var iThreshold = -1;
        thresholds.forEach(function (threshold, i) {
            if (iThreshold == -1 && width > threshold) {
                iThreshold = i;
            }
        })
        if (iThreshold == -1) iThreshold = thresholds.length;
        wrapText(text, width, d.data.data.abbrv[iThreshold]);

        //An earlier version of this function (see below) was more responsive in terms of better fitting
        //text to circle size, but it relied on successive calls to wrapText and therefore
        //the computationally expensive getComputedTextLength function so we use the threshold method
        //instead.

        ////If the text does not fit within circle, try abbrv1 and call wrapText again
        //if (text.node().getBBox().width > width) {

        //    wrapText(text, width, d.data.data.abbrv1);
        //}
        ////If the text does not fit within circle, try abbrv2 and call wrapText again
        //if (text.node().getBBox().width > width) {

        //    wrapText(text, width, d.data.data.abbrv2);
        //}
        ////If the text does not fit within circle, try abbrv3 and call wrapText again
        //if (text.node().getBBox().width > width) {

        //    wrapText(text, width, d.data.data.abbrv3);
        //}
        //Finally, if text doesn't fit within box, remove.
        //if (text.node().getBBox().width > 1.0 * width) {
        //    text.text(null);
        //}
    }

    function wrapText(text, width, name) {

        //Based on https://bl.ocks.org/mbostock/7555321

        var words = name.split(/\s+/).reverse();
        var word,
        line = [],
        lineNumber = 1,
        lineHeight = 1, // ems
        y = text.attr("y");

        var tspan = text.text(null).append("tspan").attr("class", "tspan").attr("x", 0).attr("y", y);

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                if (line.length > 0) {
                    tspan.text(line.join(" "));
                } else {
                    tspan.remove();
                    lineNumber--;
                }
                line = [word];
                tspan = text.append("tspan").attr("class", "tspan").attr("x", 0).attr("y", y).text(word);
                if (++lineNumber > 1) tspan.attr("dy", lineHeight + "em");
            }
        }
        //Vertically align the text
        text.attr("dy", ((1.5 - lineNumber) / 2) + "em");
    }

})(jQuery, this.tombiovis)