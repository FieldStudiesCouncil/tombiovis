(function ($, tbv) {

    "use strict";

    //This is the prototype of vis1, vis2, vis3, vis4 and vis5.
    //The prototype for this object is visP.
    //These visualisations were all written for large format devices and rely, to some extent on jQuery UI.
    //Any jQuery UI specific stuff should be in here and not in visP which this is linked to.

    var visP = tbv.v.visPjQueryUILargeFormat = Object.create(tbv.v.visP);

    visP.createFullDetailsDialog = function (taxon, selected, x, y) {

        var _this = this;
        var tabOffset;

        //Default parameters
        x = (typeof x !== 'undefined') ?  x : 0;
        y = (typeof y !== 'undefined') ?  y : 0;
        selected = (typeof selected !== 'undefined') ? selected : 1;
        
        var tabs = $("<div>").addClass("tombioFullDetailsTabs");
        tabs.css("border", "none");
        var ul = $("<ul>").appendTo(tabs);
        ul.append("<li><a href='#tabs-1'>Knowledge-base</a></li>");
        ul.append("<li><a href='#tabs-2'>Images</a></li>");
        if (tbv.d.oCharacters.TVK) {
            ul.append("<li><a href='#tabs-4'>NBN map</a></li>");
        }
        ul.append("<li><a href='#tabs-3'>Details</a></li>");
        var tab1 = $("<div>").attr("id", "tabs-1").appendTo(tabs);
        var tab2 = $("<div>").attr("id", "tabs-2").appendTo(tabs);
        if (tbv.d.oCharacters.TVK) {
            //If the TVK character is in the kb, add a tab for NBN maps
            var tab4 = $("<div>").attr("id", "tabs-4").appendTo(tabs);
        }
        var tab3 = $("<div>").attr("id", "tabs-3").appendTo(tabs);
        
        //Dialog
        var dlg = $("<div>").append(tabs);
        dlg.attr("title", taxon);
        dlg.dialog({
            closeText: "",
            height: 550,
            width: 600,
            modal: true,
            resizeStop: function (event, ui) {
                tabs.tabs("refresh"); //Resizes the tabs
                resizeGalleria();
            }
        });

        //Tabs
        tabs.tabs({
            heightStyle: "fill", //Required to initialise tabOffset
            active: selected,
            create: function () {
                //Initialise the taboffset variable which is
                //used to resize galleria control.
                tabOffset = dlg.height() - tab1.height();
                
            },
            activate: function (event, ui) {
                tabs.tabs("refresh"); //Resizes the tabs
                if (ui.newTab.index() == 1) {
                    resizeGalleria();
                }
            }
        });
        tab3.css("overflow", "hidden"); //Must come after tabs created.


        //Taxon details
        var divTaxonDetails = this.getTaxonCharacterValues(tbv.d.oTaxa[taxon])
        tab1.append(divTaxonDetails);

        //Images
        var img = this.addTaxonImagesToContainer({ taxon: taxon, container: tab2, height: tab2.height() });

        //NBN maps
        if (tbv.d.oCharacters.TVK && tbv.d.oTaxa[taxon].TVK) {
            var $div = $("<div>").css("position", "relative").appendTo(tab4);
            _this.addNBNMapToContainer(tbv.d.oTaxa[taxon].TVK, $div);
        }

        //HTML files
        //tab3 is passed to function that creates drop down lists so that this
        //can be added to container before selectmenu is called, otherwise
        //drop-down menu appears under dialog.
        getHTMLFileSelectionDiv(taxon, tab3)

        function resizeGalleria() {
            var g = dlg.find(".tombio-galleria-pane").first();
            if (g.data('galleria')) {
                g.data('galleria').setOptions("height", dlg.height() - tabOffset);
                g.data('galleria').resize();   
            }
        }

        function getHTMLFileSelectionDiv(taxon, container) {

            //It's important that the container to which the dropdown list is added, is passed
            //to this function and added here *before* selectmenu is called, otherwise the selectmenu
            //can appear under dialogs.
            var htmlDiv = $('<div>').appendTo(container);

            var htmlFiles = _this.getTaxonHtmlFiles(taxon);

            if (htmlFiles.length == 0) {
                //If there are no html files for this taxon, return a message to that effect.
                var noFiles = $("<div>").css("margin", "10px").appendTo(htmlDiv);
                noFiles.text("No text information files (HTML) are specified in the knowledge-base for this taxon.")
            } else {
                //Control for selecting HTML file - prior to v1.7.0 was done in this
                //iFrame which was different from method used in vis4. Changed for v1.7.0
                //to bring into line with vis4. This means only simple text is appropriate.
                var htmlDiv2 = $("<div>");
                if (htmlFiles.length > 1) {
                    var divSelect = $('<div style="margin-bottom: 20px">').appendTo(htmlDiv);
                    var htmlSel = $("<select id='tombioFileSelect'></select>").appendTo(divSelect);
                    htmlFiles.forEach(function (file, iFile) {
                        var opt = $("<option/>").text(file.Caption).attr("value", iFile);
                        htmlSel.append(opt);
                    });
                    htmlSel.selectmenu({
                        change: function (event, data) {
                            _this.addTaxonHtmlToContainer(taxon, htmlDiv2, data.item.value);
                        }
                    });
                }
                htmlDiv2.appendTo(htmlDiv);
                _this.addTaxonHtmlToContainer(taxon, htmlDiv2, 0);
            }
        }
    }

    visP.createCharacterScoreDialog = function (taxon, character) {

        var html = this.getCharacterScoreDetails(taxon, character)
        var $dlg = $("<div>");
        $dlg.dialog({
            height: 300,
            width: 600,
            modal: true,
            title: 'Character score details'
        });
        $dlg.html(html);
        $dlg.dialog("open");
    }

})(jQuery, this.tombiovis);
