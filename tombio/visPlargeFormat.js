(function ($, tbv) {

    "use strict";

    //This is the prototype of vis1, vis2, vis3, vis4 and vis5.
    //The prototype for this object is visP.
    //These visualisations were all written for large format devices and rely, to some extent on jQuery UI.
    //Any jQuery UI specific stuff should be in here and not in visP which this is linked to.

    var visP = tbv.v.visPlargeFormat = Object.create(tbv.v.visP);

    //##Interface
    visP.showFullDetails = function (taxon) {

        //Taxon details
        var $divTaxonDetails = this.getTaxonCharacterValues(tbv.d.oTaxa[taxon])
 
        //Images
        var $divImages = $("<div>");
        this.addTaxonImagesToContainer({ taxon: taxon, container: $divImages, height: 300 });

        //NBN maps
        if (tbv.d.oCharacters.TVK && tbv.d.oTaxa[taxon].TVK) {
            var $divNbn = $("<div>").css("position", "relative");
            this.addNBNMapToContainer(tbv.d.oTaxa[taxon].TVK, $divNbn);
        }

        //HTML files
        var $htmlDiv = $("<div>");
        var htmlFiles = this.getTaxonHtmlFiles(taxon);

        if (htmlFiles.length == 0) {
            //If there are no html files for this taxon, return a message to that effect.
            $htmlDiv.text("No text information files (HTML) are specified in the knowledge-base for this taxon.")
        } else {
            //Control for selecting HTML.
            var _this = this;
            if (htmlFiles.length > 1) {
                var $htmlSel = $("<select id='tombioFileSelect'></select>").appendTo($htmlDiv);
                htmlFiles.forEach(function (file, iFile) {
                    var $opt = $("<option/>").text(file.Caption).attr("value", iFile);
                    $htmlSel.append($opt);
                });
                $htmlSel.change(function () {
                    _this.addTaxonHtmlToContainer(taxon, $htmlDiv2, $(this).val()); 
                });
            }
            var $htmlDiv2 = $("<div>").appendTo($htmlDiv);
            this.addTaxonHtmlToContainer(taxon, $htmlDiv2, 0);
        }

        //Append to gui
        var $html = $("<div>");
        $html.append($divTaxonDetails);
        $html.append($divImages);
        $html.append($htmlDiv);
        if ($divNbn) $html.append($divNbn);
        displayInfo($html);
    }

    //##Interface
    visP.showCharacterScore = function (taxon, character) {

        var $html = this.getCharacterScoreDetails(taxon, character)
        displayInfo($html);
    }

    function displayInfo($html) {
        var $gui = $(tbv.gui.main.visFlashDisplay);
        $gui.html(null);

        $("<button>").text("Dismiss").appendTo($gui).click(function () {
            $gui.hide();
        })
        $gui.append($html);
        $gui.show();
    }

})(jQuery, this.tombiovis);
