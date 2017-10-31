
(function ($, core) {

    //Template visualisation that inherits from visP.
    "use strict";

    var visName = "vis4";
    var exports = core[visName] = {};
    var win, divImage, divKb, divInfo, visFullDetails;
    var selectedTaxon;
    var _this;

    exports.Obj = function (parent, contextMenu, core) {

        core.visP.Obj.call(this, visName, parent, contextMenu, core);

        //Initialise the meta data
        this.metadata.title = "Full taxon details";
        this.metadata.authors = "Burkmar, R.";
        this.metadata.year = "2016";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Shrewsbury, England";
        this.metadata.contact = "richardb@field-studies-council.org";
        this.metadata.version = '1.0';
    }

    exports.Obj.prototype = Object.create(core.visP.Obj.prototype);

    exports.Obj.prototype.initialise = function () {

        _this = this;
        var taxonName;

        //Reset this value if control can work with character state input controls
        this.charStateInput = false;

        //Help files
        this.helpFiles = [
            core.tombiopath + "vis4/vis4Help.html",
            core.tombiopath + "common/textGroupHelp.html",
            core.tombiopath + "common/imageGroupHelp.html"
        ]

        //Controls div
        var $flexContainer = $("<div>").appendTo($(this.cssSel));
        $flexContainer.css("display", "flex");
        $(this.cssSel).append($flexContainer);

        this.controlsDiv = $("<div/>").css("width", 210);
        $flexContainer.append(this.controlsDiv);

        var visDiv = $("<div/>").css("flex-grow", 1);
        $flexContainer.append(visDiv);

        var taxSel = Object.create(core.taxonSelect);
        taxSel.control(this.controlsDiv, false, taxonSelectCallback);
      
        createCheckBox('tbVis4Images', 'Show images', visDiv);
        createCheckBox('tbVis4Kb', 'Show knowledge-base', visDiv);
        createCheckBox('tbVis4Text', 'Show text', visDiv);

        function createCheckBox(id, label, parent) {
            var cb = $('<div style="display: inline-block; vertical-align:top; margin-left: 20px">').appendTo(parent);
            cb.append($("<input style='position: relative; top: 0.2em' checked='checked' type='checkbox' name='" + id + "' id='" + id + "'>"));
            cb.append($("<span>").text(label));
            cb.change(function () {
                showTaxon(selectedTaxon);
            })
        }

        visFullDetails = $('<div>').css("margin", "10px");
        visDiv.append(visFullDetails);
    }

    function taxonSelectCallback(retValue) {
        selectedTaxon = retValue.selected
        showTaxon(selectedTaxon)
    }

    function showTaxon(taxonName) {

        //Clear table
        visFullDetails.html(null);

        //Return if no taxon selected
        if (!taxonName) return;

        //Header
        $("<div id='vis4TaxonHeader'>").text(taxonName).appendTo(visFullDetails);

        //Set included flags from checkboxes
        var includeImages = document.getElementById('tbVis4Images').checked;
        var includeKb = document.getElementById('tbVis4Kb').checked;
        var includeText = document.getElementById('tbVis4Text').checked;

        //Adjust included flags depending on availability of images and HTML files
        var htmlFiles = _this.getTaxonHtmlFiles(taxonName);
        includeText = includeText && htmlFiles.length > 0;
        includeImages = includeImages && _this.getTaxonImages(taxonName).length > 0;


        //Image display
        if (includeImages) {

            var imageDiv = $('<div style="position: relative">').appendTo(visFullDetails);
            if (includeText) {
                imageDiv.css("display", "inline-block").css("width", "50%").css("float", "right").css("padding", "0 0 10px 10px");
            }
            imageDiv.html(_this.getTaxonImagesDiv(taxonName, imageDiv, null, true, true));
            //Note getTaxonImagesDiv doesn't actually append generated HTML to passed container,
            //but returns HTML value (does some stuff with container)
        }

        //HTML files
        if (includeText) {

            //Control for selecting HTML file
            if (htmlFiles.length > 1) {
                var disSelect = $('<div style="margin-bottom: 20px; display: inline">').appendTo(visFullDetails);

                var htmlSel = $("<select id='vis4html'></select>").appendTo(disSelect);
                htmlFiles.forEach(function (file, iFile) {
                    var opt = $("<option/>").text(file.Caption).attr("value", iFile);
                    htmlSel.append(opt);
                });
                htmlSel.selectmenu({
                    change: function (event, data) {
                        _this.showTaxonHtmlInfo(taxonName, htmlDiv, data.item.value);
                    }
                })
                .selectmenu("menuWidget");
                //htmlSel.selectmenu({ width: "100%" }); //Do this separately or you get zero width
            }

            //First image
            var htmlDiv = $('<div>').appendTo(visFullDetails);
            _this.showTaxonHtmlInfo(taxonName, htmlDiv, 0);
        }

       

        //Set KB values
        if (includeKb) {
            visFullDetails.append($("<h2>").text("Knowledge-base values"));
            visFullDetails.append(_this.showTaxonCharacterValues(core.oTaxa[taxonName], true));
        }

        //Trigger the image change function whenever browser
        //window is resized.
        if (imageDiv){
            $(window).resize(function () {
                var img = imageDiv.find(".baseimage");
                img.trigger("change");
            });
        }   
    }  

    exports.Obj.prototype.refresh = function () {

        //Height has to be set in the refresh method otherwise has no effect
        $('#vis4taxon').selectmenu("menuWidget").css("height", 200);

        //console.log("vis4 refresh")

        //Consider including
        //this.fireRefresh();
    }

})(jQuery, this.tombiovis)