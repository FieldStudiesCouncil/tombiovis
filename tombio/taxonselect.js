(function (exports, $, core) {

    "use strict";

    //Variables for layout
    var gap = 4;
    var textHeightOffset = 4;
    var taxonHeight = 25;
    var taxonWidth = 200;
    var filterText = "";
    var filterMessage ="Filter names (use # for 'starts with')"
    var svg;
    var textFilter;

    var taxa = []
    core.taxa.forEach(function (t) {
        taxa.push({
            name: t.Taxon,
            abbrv: "",
            length: 0
        })
    })

    exports.control = function (parent) {

        //Main control div
        var mainDiv = $('<div id="taxonSelect" />').appendTo(parent);

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

        //Sort radio buttons
        //<label for="radio-1">New York</label>
        //<input type="radio" name="radio-1" id="radio-1">
        //<label for="radio-2">Paris</label>
        //<input type="radio" name="radio-1" id="radio-2">
        //<label for="radio-3">London</label>
        //<input type="radio" name="radio-1" id="radio-3">

        var sortDiv = $('<div>').appendTo(mainDiv);
        $("<label>").attr("for", "radio-x").text("none").appendTo(sortDiv);
        $("<input>").attr("type", "radio").attr("name", "radioSort").attr("id", "radio-x").attr("checked", "true").appendTo(sortDiv);
        $("<label>").attr("for", "radio-a").text("a-z").appendTo(sortDiv);
        $("<input>").attr("type", "radio").attr("name", "radioSort").attr("id", "radio-a").appendTo(sortDiv);
        $("<label>").attr("for", "radio-z").text("z-a").appendTo(sortDiv);
        $("<input>").attr("type", "radio").attr("name", "radioSort").attr("id", "radio-z").appendTo(sortDiv);
        sortDiv.find("input").checkboxradio();

        //taxon SVG
        svg = d3.select('#taxonSelect').append('svg');
        svg.attr('width', taxonWidth)

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
    function updateTaxa() {
        //taxon elements

        var tranTime = 300;

        var mtU = svg.selectAll("g")
            .data(taxa.filter(function (d) {
                if (filterText == "" || filterText.toLowerCase() == filterMessage.toLowerCase() || filterText == "#") {
                    return true;
                }
                if (filterText.startsWith("#")) {
                    if (d.name.toLowerCase().startsWith(filterText.toLowerCase().substr(1))) {
                        return true;
                    }
                }
                if (d.name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1) {
                    return true;
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
                    .attr("class", "taxonSelectTaxarect");

                d3.select(this).append("text")
                    //Create taxon texts
                    .style("opacity", 0)
                    .attr("x", 5)
                    .classed("taxonSelectScientificnames", true)
                    .classed("abbrvName", function () {
                        if (d.abbrv) {
                            return true;
                        } else {
                            return false;
                        }
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