
(function ($, tbv) {

    "use strict";

    var visName = "vis5";
    var vis5 = tbv.v.visualisations[visName] = Object.create(tbv.v.visP);
    vis5.visName = visName;

    var _this;

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
        g, 
        colorGreyScale,
        lastZoomWasPan,
        lastZoomK = 1,
        lastZoomX = 0,
        lastZoomY = 0,
        zoomStarted,
        mobile = /Mobi/.test(navigator.userAgent);

    vis5.initialise = function () {

        _this = this;

        //Initialise the meta data
        this.metadata.title = "Circle-pack key";
        this.metadata.year = "2018";
        this.metadata.authors = "Burkmar, R";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Shrewsbury, England";
        this.metadata.contact = "r.burkmar@field-studies-council.org";
        this.metadata.version = '1.8.0';

        //Initialisations
        this.abbrvnames = true;

        //Initialise taxon image tooltips
        this.displayToolTips = false;

        //Help files
        this.helpFiles = [
            tbv.opts.tombiopath + "vis5/vis5Help.html",
            tbv.opts.tombiopath + "common/taxonDetailsHelp.html",
            tbv.opts.tombiopath + "common/full-details.html",
            tbv.opts.tombiopath + "common/stateInputHelp.html"
        ]

        //Add circle pack stuff
        svg = d3.select("#" + this.visName)
            .append("svg")
            .attr("id", "vis5Svg")
            .attr("width", "500")
            .attr("height", "500")
            .attr("overflow", "visible")
            //.style("background-color", "cyan")
            .call(d3.zoom()
                .on('zoom', mouseZoom)
                .on('end', $.proxy(mouseZoomEnd, _this)) //This jQuery proxy method passes _this as a context to event handler  
            );

        svg.on("click", function () {
            //console.log("click");
            zoomToNode(root);
        });

        margin = 20;
        diameter = +svg.attr("width");
        g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

        colorGreyScale = d3.scaleLinear()
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
        tbv.d.characters.forEach(function (c) {
            if (c.Group.toLowerCase() == "taxonomy" || c.Character == "taxon"){
                taxonRanks.push(c.Character);
            }
        })

        function findEntry(stratTable, rankValue) {
            //This function is to replace stratTable.find(function (entry) { return entry.name == rankValue })
            //since the array find method is not available in some relatively recent versions of Safari and IE
            //15/06/2017
            for (var i = 0; i < stratTable.length; i++) {
                if (stratTable[i].name == rankValue) {
                    return true;
                }
            }
            return false;
        }

        var stratTable = [{name: "All taxa", parent: ""}], ir = 0;
        //Create a table suitable for input into the d3.stratify function
        taxonRanks.forEach(function (r, iR) {
            tbv.d.taxa.forEach(function (t, iT) {
                var rankValue = t[r].kbValue;
                //if (rankValue != "" && !stratTable.find(function (entry) { return entry.name == rankValue })) {
                if (rankValue != "" && !findEntry(stratTable, rankValue)) {
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
                        rank: tbv.d.oCharacters[r].Label,
                        abbrv: [rankValue,
                            getAbbrv(rankValue, 1, (r == "taxon")),
                            getAbbrv(rankValue, 2, (r == "taxon")),
                            getAbbrv(rankValue, 3, (r == "taxon"))],
                        taxon: r == "taxon" ? t : null
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
            return child.data.rankColumn == "taxon";
        })
        taxaRootFlat.children = filteredChildren;

        taxaRootCurrent = taxaRoot;

        //Shares key input with several other multi-access keys
        var keyinput = tbv.opts.toolconfig[this.visName].keyinput;
        if (!tbv.gui.sharedKeyInput[keyinput]) {
            tbv.gui.sharedKeyInput[keyinput] = Object.create(tbv.gui[keyinput]);
            tbv.gui.sharedKeyInput[keyinput].init($(tbv.gui.main.divInput));
        }
        vis5.inputControl = tbv.gui.sharedKeyInput[keyinput];

        //Mark as initialised
        this.initialised = true;

        //Check interface
        tbv.f.checkInterface(visName, tbv.templates.visTemplate, tbv.v.visualisations[visName]);
    }

    vis5.refresh = function () {

        _this = this;

        var maxOverall = d3.max(tbv.d.taxa, function (d) { return d.visState.score.overall; });
        var minOverall = d3.min(tbv.d.taxa, function (d) { return d.visState.score.overall; });

        //console.log(taxonRanks.length, )

        //Initialise context menu items

        //Context menu item to get URL
        tbv.gui.main.contextMenu.addItem("Get URL for circle-pack key", function () {
            getViewURL();
        }, false, [_this.visName]);

        //Add context menu item for abbreviation toggle
        tbv.gui.main.contextMenu.addItem("Toggle name abbreviation", function () {
            _this.abbrvnames = !_this.abbrvnames;
            _this.refresh();
        }, false, [_this.visName]);

        if (taxonRanks.length > 1 && taxaRootCurrent == taxaRoot) {

            tbv.gui.main.contextMenu.addItem("Ignore higher taxa", function () {
                taxaRootCurrent = taxaRootFlat;
                displayTextForRank("taxon");
                _this.refresh();
            }, false, [_this.visName]);

            taxonRanks.forEach(function (rank) {
                tbv.gui.main.contextMenu.addItem("Show names for each " + tbv.d.oCharacters[rank].Label, function () {
                    displayTextForRank(rank);
                    _this.refresh();
                }, false, [_this.visName]);
            });

            tbv.gui.main.contextMenu.removeItem("Show higher taxa");

        } else if (taxonRanks.length > 1 && taxaRootCurrent == taxaRootFlat) {
            tbv.gui.main.contextMenu.addItem("Show higher taxa", function () {
                taxaRootCurrent = taxaRoot;
                displayTextForRank("taxon");
                _this.refresh();
            }, false, [_this.visName]);

            taxonRanks.forEach(function (rank) {
                tbv.gui.main.contextMenu.removeItem("Show names for each " + tbv.d.oCharacters[rank].Label);
            });

            tbv.gui.main.contextMenu.removeItem("Ignore higher taxa");
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

        //Prepare scales for the indicators
        var scaleOverall = d3.scaleLinear()
            .domain([minOverall, 0, maxOverall])
            .range(tbv.d.scoreColours);

        //If the minimum overall score is greater than zero, correction is zero, otherwise
        //the correction is the absolute value of the minimum overall score.
        var correction = minOverall < 0 ? 0 - minOverall : 0;

        root = d3.hierarchy(taxaRootCurrent)
             .sum(function (d) {
                 //This is the part which helps determine the size of the circles in the circle pack.
                 //If the taxon has the minimum overall score, then the addition of the correction makes zero,
                 //and the addition of 0.1 is to prevent zero width. Raising to a power, exaggerates the differences
                 //between low and high scores.
                 return d.data.taxon ? Math.pow(d.data.taxon.visState.score.overall + correction + 0.1, 1.5): 0;
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
                var cls = d.children ? "node-taxa node-higher-taxa" : "node-taxa";
                //var cls = d.children ? "node node-higher-taxa" : "node";
                cls += " " + d.data.data.rankColumn;
                return cls;
            })
            .attr("id", function (d) { return tbv.f.taxonTag(d.data.id); })
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
                //console.log(d)
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
                    return colorGreyScale(d.depth);
                } else {
                    if (d.data.data.taxon) {
                        return scaleOverall(d.data.data.taxon.visState.score.overall);    
                    } else {
                        //Can get here if bad taxonomic hierarchy is specified.
                        return 0;
                    }         
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
            .attr("circleId", function (d) { return tbv.f.taxonTag(d.data.id); })
            .style("display", "none")
            .on("click", function (d) {
                if (!d.data.data.taxon) return
                d3.event.stopPropagation();
                tbv.gui.main.showFullDetails(d.data.data.taxon.taxon, 0);
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

        //Tooltips varies depending on what gui this visualisation is working with.
        //Wherever possible we want to avoid using gui-specific code within visualisations like this,
        //but this code is simply not relevant to other visualisations or guis, so should stay here.
        if (tbv.opts.gui == "guiLargeJqueryUi") {
            $("circle, text").tooltip({
                classes: {
                    "ui-tooltip": "taxon-tooltip ui-corner-all ui-widget-shadow"
                },
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
        }
       
        if (view) {
            //If view exists, we are already zoomed somewhere
            zoomToView(view, view, transitionRefresh, true);
        } else {
            //First time in, therefore zoom to root
            zoomToView([root.x, root.y, root.r * 2 + margin], [root.x, root.y, root.r * 2 + margin], transitionRefresh, true);
            //First time in, display taxa text
            displayTextForRank("taxon");
        }

        highlightTopScorers(transitionRefresh);

        function taxonTooltip(d) {

            //For leaf nodes (i.e. those representing actual taxa, set the title attribute
            //to some HTML that reflects the name and its overall score - including a colour
            //swatch behind the score. Further on, we use the 'option' attribute of the 
            //jQuery tooltip command to return this as HTML.
            var html
            if (d.data.data.taxon) {
                html = "<i>" + d.data.id + "</i> <span style='background-color: " +
                    scaleOverall(d.data.data.taxon.visState.score.overall) +
                    "; padding: 2px 5px 2px 5px; margin-left: 5px'>" +
                    Math.round(d.data.data.taxon.visState.score.overall * 100) / 100 + "</span>"
            } else {
                //Can get here if bad taxonomic hierarchy is specified.
                html = "<i>" + d.data.id + "</i>";
            }
            if (_this.displayToolTips) {
                var img = tbv.f.getTaxonTipImage(d.data.id);
                if (img) {
                    img.css("margin-top", 5);
                    html = html + img[0].outerHTML;
                }
            }
            
            return html
        }
    }

    vis5.urlParams = function (params) {

        //Abbreviated names
        if (params["abbrvnames"]) {
            _this.abbrvnames = params["abbrvnames"] === "true";
        }

        //selected rank
        if (params["rank"]) {
            _this.selectedRank = params["rank"];
            displayTextForRank(_this.selectedRank);
        }

        //Higher taxa
        if (params["highertaxa"]) {
            taxaRootCurrent = taxaRootFlat;
        }

        //Taxon image tooltips
        if (params["imgtips"]) {
            _this.displayToolTips = params["imgtips"] === "true";
        }

        //Set the state controls
        tbv.f.initControlsFromParams(params);
    }

    vis5.show = function () {
        //Responsible for showing all gui elements of this tool
        $("#vis5").show();
        $(vis5.inputControl.divSel).show();
        vis5.inputControl.initFromCharacterState();
    }

    vis5.hide = function () {
        //Responsible for hiding all gui elements of this tool
        $("#vis5").hide();

        $(vis5.inputControl.divSel).hide();
    }

    function getViewURL() {

        var params = [];

        //Tool
        params.push("selectedTool=" + visName)

        //Get user input control params
        Array.prototype.push.apply(params, tbv.f.setParamsFromControls());

        //Abbreviated names?
        params.push("abbrvnames=" + _this.abbrvnames);

        //Selected rank
        params.push("rank=" + _this.selectedRank);

        //Higher taxa
        if (taxaRootCurrent == taxaRootFlat) {
            //Only need to record the non-default case
            params.push("highertaxa=false")
        }

        //Image tooltips
        params.push("imgtips=" + _this.displayToolTips);

        //Generate the full URL
        tbv.f.createViewURL(params);
    }

    function highlightTopScorers(transitionRefresh) {

        var maxOverall = d3.max(tbv.d.taxa, function (d) { return d.visState.score.overall; });

        circleM.transition(transitionRefresh)
            .filter(function (d) {
                return d.data.data.taxon;
            })
            .style("stroke", function(d) {
                if (maxOverall > 0 && d.data.data.taxon.visState.score.overall == maxOverall) return "black";
                if (_this.selectedRank == "taxon") return "black";
                return null;
            })
            .style("stroke-width", function(d) {
                if (maxOverall > 0 && d.data.data.taxon.visState.score.overall == maxOverall) return "2px";
                if (_this.selectedRank == "taxon") return "1px";
                return "0px";
            })
            .style("stroke-linecap", function(d) {
                if (maxOverall > 0 && d.data.data.taxon.visState.score.overall == maxOverall) return "round";
                return null;
            })
            .style("stroke-dasharray", function(d) {
                if (maxOverall > 0 && d.data.data.taxon.visState.score.overall == maxOverall) return "1, 5";
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
        if (tbv.opts.toolconfig[visName].prototype == "visPjQueryUILargeFormat") {
            $(".node-taxa").tooltip("close");
        }

        var k = diameter / newView[2]; view = newView;

        //Relocate circles and text objects.
        //Because text always needs to be drawn on top of all circles, it has to be
        //drawn afterwards.
        if (transitionRefresh) {
            g.selectAll("circle,text").transition(transitionRefresh)
                .attr("transform", function (d) { return "translate(" + (d.x - newView[0]) * k + "," + (d.y - newView[1]) * k + ")"; })
                .attr("r", function (d) { return d.r * k });
        } else {
            g.selectAll("circle,text")
                .attr("transform", function (d) { return "translate(" + (d.x - newView[0]) * k + "," + (d.y - newView[1]) * k + ")"; })
                .attr("r", function (d) { return d.r * k });
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
        
        //Double clicks get here and cause a problem because sourceEvent is null,
        //so trap these.
        //if (!d3.event.sourceEvent) return;

        //This global variable set in order to detect whether or not, when mouseZoomEnd
        //is fired, it was the result of a genuine zoom.
        zoomStarted = true;

        //Had to stop using sourceEvent because I realised it's not consistent across browswers
        //(didn't work with Firefox), so using the d3.event.sourceEvent instead.
        //var dx = d3.event.sourceEvent.movementX * (view[2]/diameter);
        //var dy = d3.event.sourceEvent.movementY * (view[2]/diameter);
        //var wdy = d3.event.sourceEvent.wheelDeltaY, delta;

        //console.log("k", d3.event.transform.k)
        //console.log("x", Math.floor(d3.event.transform.x))
        //console.log("y", Math.floor(d3.event.transform.y))

        var wdy, delta;
        if (d3.event.transform.k > lastZoomK) {
            wdy = 120;
        } else if (d3.event.transform.k < lastZoomK) {
            wdy = -120;
        }

        if (wdy) {
            if (wdy > 0) {
                delta =  100/wdy;
            } else {
                delta = Math.abs(wdy/100);
            }
            var dx = 0;
            var dy = 0;
        } else {
            delta = 1;
            var dx = (d3.event.transform.x - lastZoomX) * (view[2] / diameter);
            var dy = (d3.event.transform.y - lastZoomY) * (view[2] / diameter);
        }

        var newView = [view[0] - dx, view[1] - dy, view[2] * delta];
    
        lastZoomWasPan = (delta == 1);
        lastZoomK = d3.event.transform.k;
        lastZoomX = d3.event.transform.x;
        lastZoomY = d3.event.transform.y;

        //Zoom to view without redrawing text
        if (!mobile) {
            //Haven't yet figured out how to incorporate pinch zoom and pan
            //console.log(newView, newView, null, false);
            zoomToView(newView, newView, null, false);   
        }
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

        _this.selectedRank = rank;

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

        if (!_this.abbrvnames) {
            wrapText(text, width, d.data.data.abbrv[0]);
            return;
        }

        //If circle below a minimum threshold, then make text invisible (but only for leaf nodes)
        if (width < 20 && _this.abbrvnames) { //&& d.data.data.taxon
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