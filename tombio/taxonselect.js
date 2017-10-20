(function (exports, $, core) {

    "use strict";

    //Variables for layout
    var gap = 4;
    var textHeightOffset = 4;
    var rectHeight = 25;
    var taxonWidth = 200;
    var filterText = "";

    var svg;

    var taxa = []
    core.taxa.forEach(function (t) {
        taxa.push({
            name: t.Taxon,
            length: 0
        })
    })

    exports.control = function (parent) {

        //Main control div
        var mainDiv = $('<div id="taxonSelect" />').appendTo(parent);

        //Filter textbox
        var textFilter = $('<input type="text"/>').addClass("ui-widget ui-widget-content ui-corner-all");
        textFilter.css("xmargin", "10").css("width", taxonWidth).css("height", rectHeight);
        mainDiv.append(textFilter);
        $('<br>').appendTo(mainDiv);

        textFilter.on('keyup', function() {
            filterText = this.value.toLowerCase();
            updateTaxa();
        });

        //taxon SVG
        svg = d3.select('#taxonSelect').append('svg');
        svg.attr('width', taxonWidth)

        //Initialise taxa
        updateTaxa();

        //Return the main control div
        return mainDiv;
    }
    function updateTaxa() {
        //taxon elements
        var mtU = svg.selectAll("g")
            .data(taxa.filter(function (d) {
                if (filterText == "") {
                    return true;
                }
                if (d.name.toLowerCase().indexOf(filterText) !== -1) {
                    return true;
                }
                return false;
            }), function (d) { return d.name; })
        var mtE = mtU.enter();
        var mtX = mtU.exit();

        var mtM = mtE.append("g")
            //.attr("class", "type2VisTaxon")
            .each(function (d, i) {

                d3.select(this).append("rect")
                    .attr("class", "taxonSelectTaxarect");

                d3.select(this).append("text")
                    //Create taxon texts
                    .attr("class", "taxonSelectScientificnames")
                    .text(function () {
                        return d.name;
                    })
            })
            .merge(mtU);

        mtM.transition()
            .duration(1000)
            //.style("opacity", 1)
            .each(function (d, i) {
                d3.select(this).select(".taxonSelectTaxarect")
                    .transition()
                    .duration(100)
                    .attr("x", function () {
                        return 0;
                    })
                    .attr("y", function () {
                        return i * (rectHeight + gap) + gap;
                    })
                    .attr("width", function () {
                        return taxonWidth;
                    })
                    .attr("height", function () {
                        return rectHeight;
                    });
                d3.select(this).select(".taxonSelectScientificnames")
                    .transition()
                    .duration(100)
                    .attr("x", function () {
                        return 5;
                    })
                    .attr("y", function () {
                        return (i * (rectHeight + gap)) + rectHeight / 2 + textHeightOffset + gap;
                    });
            });

        mtX.remove()

        //Resize SVG
        var svgHeight = mtM._groups[0].length * (rectHeight + gap)
        svg.attr('height', svgHeight)
    }
})(this.taxonselect = {}, jQuery, this.tombiovis)