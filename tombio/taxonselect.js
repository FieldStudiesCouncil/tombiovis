(function (exports, $, core) {

    "use strict";

    //Variables for layout
    var mainDiv; //jQuery object
    var gap = 4;
    var textHeightOffset = 4;
    var taxonHeight = 25;
    var taxonWidth = 200;
    var filterText = "";
    var filterMessage ="Filter names (use # for 'starts with')"
    var svg; //D3 object
    var textFilter;
    var taxonSort;
    var isMultiSelect;
    var hostCallback;
    var selectedTaxa = [];
    var selectedTaxon;

    //Create the taxon array (from core.taxa) that this control
    //will work with.
    var taxa = []
    core.taxa.forEach(function (t, i) {
        taxa.push({
            name: t.Taxon,
            abbrv: "",
            order: i
        })
    })

    exports.control = function (parent, multi, callback) {

        //Assign module-level variables
        isMultiSelect = multi;
        hostCallback = callback;

        //Main control div
        mainDiv = $('<div id="taxonSelect" />').appendTo(parent);

        //Filter textbox
        textFilter = $('<input type="text"/>').addClass("ui-widget ui-widget-content ui-corner-all");
        textFilter.css("color", "silver").css("padding-left", 5).css("width", taxonWidth - 5).css("height", taxonHeight);
        textFilter.val(filterMessage);
        mainDiv.append(textFilter);
        $('<br>').appendTo(mainDiv);

        textFilter.on('keyup', function() {
            filterText = this.value;
            updateTaxa();
        });

        //Hide filter message when textbox gets focus (and change text colour to black)
        textFilter.on('focus', function () {
            if (this.value == filterMessage) {
                textFilter.val("");
                textFilter.css("color", "black");
            }

        });

        //Show filter message when textbox loses focus and no filter specified (and change text colour to silver)
        textFilter.on('blur', function () {
            if (this.value == "") {
                textFilter.val(filterMessage);
                textFilter.css("color", "silver");
            }
        });

        //Hidden controls
        var hiddenControlsDiv = $('<div>').css("margin-top", 5).css("display", "none").appendTo(mainDiv);
        var controlsArrow = $('<img>')
            .attr("src", tombiopath + "resources/chevron-down.png")
            .attr("class", "taxonSelectHiddenControlsArrow")
            .appendTo(mainDiv);

        //Hiding and showing hidden controls
        controlsArrow.on("click", function () {
            if (hiddenControlsDiv.css("display") == "none") {
                hiddenControlsDiv.slideDown(400);
                controlsArrow.attr("src", tombiopath + "resources/chevron-up.png")
            } else {
                hiddenControlsDiv.slideUp(400);
                controlsArrow.attr("src", tombiopath + "resources/chevron-down.png")
            }
        })

        //Sort radio buttons
        var sortDiv = $('<div>').appendTo(hiddenControlsDiv);
        $("<label>").attr("for", "radio-x").text("none").appendTo(sortDiv);
        $("<input>").attr("type", "radio").attr("name", "radioSort").attr("id", "radio-x").attr("checked", "true").appendTo(sortDiv);
        $("<label>").attr("for", "radio-a").text("a-z").appendTo(sortDiv);
        $("<input>").attr("type", "radio").attr("name", "radioSort").attr("id", "radio-a").appendTo(sortDiv);
        $("<label>").attr("for", "radio-z").text("z-a").appendTo(sortDiv);
        $("<input>").attr("type", "radio").attr("name", "radioSort").attr("id", "radio-z").appendTo(sortDiv);
        sortDiv.find("input").checkboxradio();

        $('[name=radioSort]').on('change', function (e) {
            taxonSort = $("[name='radioSort']").filter(":checked").attr("id");
            sortTaxa();
            updateTaxa();
        });

        //taxon SVG
        svg = d3.select('#taxonSelect').append('svg');
        svg.attr('width', taxonWidth);

        //The following code tests the text for the name of each taxon to ensure
        //that it will fit within the taxon rectangle and, if it doesn't, then
        //it creates an abbreviation for it. 
        var svgTmp = d3.select("body").append("svg");
        taxa.forEach(function (t) {

            var charRemove = 0;
            var tmpName = t.name;
            var nameWidth;
            do {
                if (charRemove > 0) {
                    tmpName = t.name.substr(0, t.name.length - charRemove) + "..."
                }
                var txt = svgTmp.append("text")
                    .attr("class", "taxonSelectScientificnames")
                    .style("opacity", 0)
                    .text(tmpName);
                var nameWidth = txt.node().getBBox().width;
                charRemove++;
            }
            while (nameWidth > taxonWidth - 10);

            if (tmpName != t.name) {
                t.abbrv = tmpName;
            }
        });
        svgTmp.remove();

        //Initialise taxa
        updateTaxa();

        //Return the main control div
        return mainDiv;
    }

    function taxonClick(taxon) {

        var deselectedTaxon;

        //Get the rectangle and text objects corresponding to the clicked taxon
        var rect = svg.select("rect[taxonName=\"" + taxon + "\"]");
        var text = svg.select("text[taxonName=\"" + taxon + "\"]");

        //Set a flag indicating whether or not the taxon is currently selected
        var currentlySelected = rect.classed("taxonSelectTaxarectSelected")
        
        //Change the display style of the taxon
        rect.classed("taxonSelectTaxarectDeselected", currentlySelected)
            .classed("taxonSelectTaxarectSelected", !currentlySelected);
        text.classed("taxonSelectScientificnamesDeselected", currentlySelected)
            .classed("taxonSelectScientificnamesSelected", !currentlySelected);

        //if the control is working in single select mode and another is currently selected,
        //then deselect it.
        if (!isMultiSelect && selectedTaxon && selectedTaxon != taxon) {
            //Change the style (
            var rectPrevious = svg.select("rect[taxonName=\"" + selectedTaxon + "\"]");
            var textPrevious = svg.select("text[taxonName=\"" + selectedTaxon + "\"]");

            //Change style to deselected
            rectPrevious.classed("taxonSelectTaxarectDeselected", true)
                .classed("taxonSelectTaxarectSelected", false);
            textPrevious.classed("taxonSelectScientificnamesDeselected", true)
                .classed("taxonSelectScientificnamesSelected", false);

            //Record the fact that this has been deselected (to pass to client)
            deselectedTaxon = selectedTaxon;
        }

        //Record the fact that the currently clicked taxon has been either
        //selected or deselected.
        if (currentlySelected) {
            selectedTaxon = null;
            deselectedTaxon = taxon;
        } else {
            selectedTaxon = taxon;
        }

        //Update the selectedTaxa array
        if (deselectedTaxon) {
            var i = selectedTaxa.length;
            while (i--) {
                if (selectedTaxa[i] == deselectedTaxon) {
                    selectedTaxa.splice(i, 1);
                }
            }
        }
        if (selectedTaxon) {
            selectedTaxa.push(selectedTaxon)
        }

        //Set return object
        var ret = {
            selected: selectedTaxon,
            deselected: deselectedTaxon,
            taxa: selectedTaxa
        }

        //Call callback function
        if (hostCallback) {
            hostCallback(ret)
        }

        //console.log("desel", ret.deselected)
        //console.log("sel", ret.selected)
        //console.log("array", ret.taxa)

        //console.log(ret.selected)
        //console.log(ret.taxa[0])
        //console.log(ret)
        //console.log(ret.selected)
        //console.log(ret.taxa[0])
    }

    function sortTaxa() {
        taxa.sort(function (a, b) {

            if (taxonSort == "radio-a") {
                var nameA = a.name.toUpperCase(); // ignore upper and lowercase
                var nameB = b.name.toUpperCase(); // ignore upper and lowercase
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;

            } else if (taxonSort == "radio-z") {
                var nameA = a.name.toUpperCase(); // ignore upper and lowercase
                var nameB = b.name.toUpperCase(); // ignore upper and lowercase
                if (nameA < nameB) {
                    return 1;
                }
                if (nameA > nameB) {
                    return -1;
                }
                return 0;
            } else {
                return a.order - b.order;
            }
        })
    }

    function updateTaxa() {

        var tranTime = 300;

        //D3 selection
        var mtU = svg.selectAll("g")
            .data(taxa.filter(function (d) {
                //Matches if no filter specified, or just '#' or text is filter message
                if (filterText == "" || filterText.toLowerCase() == filterMessage.toLowerCase() || filterText == "#") {
                    return true;
                }
                //Matches if filter starts with '#' and rest of filter text matches start of taxon name
                if (filterText.startsWith("#")) {
                    if (d.name.toLowerCase().startsWith(filterText.toLowerCase().substr(1))) {
                        return true;
                    }
                }
                //Matches if filter doesn't start with '#' and filter occurs somewhere in taxon name
                if (d.name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1) {
                    return true;
                }
                //Matches if name is in the selected taxon set
                for (var i = 0; i < selectedTaxa.length; i++) {
                    if (selectedTaxa[i] == d.name) {
                        return true;
                    }
                }
                return false;
            }), function (d) { return d.name; })
        var mtE = mtU.enter();
        var mtX = mtU.exit();

        var mtM = mtE.append("g")
            .each(function (d, i) {

                d3.select(this).append("rect")
                    .style("opacity", 0)
                    .attr("x", 0)
                    .attr("width", taxonWidth)
                    .attr("height", taxonHeight)
                    .classed("taxonSelectTaxarect", true)
                    .classed("taxonSelectTaxarectDeselected", true)
                    .attr("taxonName", function (d) {
                        return d.name
                    })
                    .on("click", function (d) {
                        taxonClick(d.name);
                    })

                d3.select(this).append("text")
                    //Create taxon texts
                    .style("opacity", 0)
                    .attr("x", 5)
                    .classed("taxonSelectScientificnames", true)
                    .classed("taxonSelectScientificnamesDeselected", true)
                    .classed("abbrvName", function () {
                        if (d.abbrv) {
                            return true;
                        } else {
                            return false;
                        }
                    })
                    .attr("taxonName", function (d) {
                        return d.name
                    })
                    .text(function () {
                        if (d.abbrv) {
                            return d.abbrv;
                        } else {
                            return d.name;
                        }
                    })
                    .attr("title", function (d) {
                        if (d.abbrv) {
                            return d.name;
                        } else {
                            return "";
                        }
                    })
                    .on("click", function (d) {
                        taxonClick(d.name);
                    })
            })
            .merge(mtU);

        mtM.select(".taxonSelectTaxarect")
            .transition()
            .duration(tranTime)
            .delay(function () {
                return mtX.empty() ? 0 : tranTime;
            })
            .attr("y", function (d,i) {
                return i * (taxonHeight + gap) + gap;
            })
            .transition()
            .style("opacity", 1)
                   
        mtM.select(".taxonSelectScientificnames")
            .transition()
            .duration(tranTime)
            .delay(function () {
                return mtX.empty() ? 0 : tranTime;
            })
            .attr("y", function (d,i) {
                return (i * (taxonHeight + gap)) + taxonHeight / 2 + textHeightOffset + gap;
            })
            .transition()
            .style("opacity", 1)

        mtX.transition()
            .duration(tranTime)
            .style("opacity", 0)
            .remove();

        //Tooltips
        $(".abbrvName").tooltip({
            classes: {
                "ui-tooltip": "ui-corner-all ui-widget-shadow"
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

        //Resize SVG
        var svgHeight = mtM._groups[0].length * (taxonHeight + gap)
        svg.transition()
            .delay(function () {
                return mtX.empty() ? 0 : tranTime;
            })
            .attr('height', svgHeight)
    }

})(this.taxonselect = {}, jQuery, this.tombiovis)