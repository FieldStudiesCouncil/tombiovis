
(function ($, core) {

    //Template visualisation that inherits from visP.
    "use strict";

    var visName = "vis4";
    var exports = core[visName] = {};
    var win, divImage, divKb, divInfo, visTable;
    var selectText = "Select taxon"

    exports.Obj = function (parent, contextMenu, core) {

        core.visP.Obj.call(this, visName, parent, contextMenu, core);

        //Initialise the meta data
        this.metadata.title = "Full taxon details";
        this.metadata.authors = "Burkmar, R.";
        this.metadata.year = "2016";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Shrewsbury, England";
        this.metadata.contact = "richardb@field-studies-council.org";
        this.metadata.version = "0.1";
    }

    exports.Obj.prototype = Object.create(core.visP.Obj.prototype);

    exports.Obj.prototype.initialise = function () {

        var _this = this;
        var taxonName;

        //Reset this value if control can work with character state input controls
        this.charStateInput = false;

        //Help files
        this.helpFiles = [
            tombiopath + "vis4/vis4Help.html",
            tombiopath + "common/textGroupHelp.html",
            tombiopath + "common/imageGroupHelp.html"
        ]

        //Controls div
        this.controlsDiv = $("<div/>");
        $(this.cssSel).append(this.controlsDiv);

        //Control for selecting taxa
        var taxaSel = $("<select id='vis4taxon'></select>").appendTo(this.controlsDiv);
        var opt = $("<option/>").text(selectText);
        taxaSel.append(opt);

        var taxa = core.taxa.map(function(taxon) {return taxon.Taxon.value}).sort();
        taxa.forEach(function (taxon) {
            var opt = $("<option/>").text(taxon);
            taxaSel.append(opt);
        });

        taxaSel.selectmenu({
            change: function (event, data) {
                showTaxon(_this, data.item.value);
            }
        }).selectmenu("menuWidget");
        taxaSel.selectmenu({ width: 250}); //Do this separately or you get zero width
           // .css("height", 200);
      
        createCheckBox('tbVis4Images', 'Show images', this.controlsDiv);
        createCheckBox('tbVis4Kb', 'Show knowledge-base', this.controlsDiv);
        createCheckBox('tbVis4Text', 'Show text', this.controlsDiv);

        function createCheckBox(id, label, parent) {
            var cb = $('<div style="display: inline-block; vertical-align:top; margin-left: 20px">').appendTo(parent);
            cb.append($("<input style='position: relative; top: 0.2em' checked='checked' type='checkbox' name='" + id + "' id='" + id + "'>"));
            cb.append($("<span>").text(label));
            cb.change(function () {
                showTaxon(_this, $("#vis4taxon option:selected").text());
            })
        }

        visTable = $('<table id="vis4Content" style="margin: 0">').append($('<tr>'));
        $(this.cssSel).append(visTable);
    }

    function showTaxon(_this, taxonName) {

        var includeImages = document.getElementById('tbVis4Images').checked;
        var includeKb = document.getElementById('tbVis4Kb').checked;
        var includeText = document.getElementById('tbVis4Text').checked;
        var included = [includeImages, includeKb, includeText].filter(function (cb) { return cb });
        var tdColumns = [];
        var columns = [];

        //Clear table
        visTable.html(null);

        //Return if no taxon selected
        if (taxonName == selectText) return;

        //Add table columns at correct width if checkbox selected
        included.forEach(function () {
            var td = $('<td width="' + (100 / included.length) + '%" style="vertical-align:top; border-width: 0px; padding: 3px">').appendTo(visTable);
            tdColumns.push(td);
        })

        //Set the image if checkbox selected AND there are images to display
        if (includeImages && _this.getTaxonImages(taxonName).length > 0) {
            var imageDiv = $('<div style="position: relative">');
            columns.push(imageDiv);
            imageDiv.append(_this.getTaxonImagesDiv(taxonName, imageDiv, null, true));
            //Note getTaxonImagesDiv doesn't actually append generated HTML to passed container,
            //but returns HTML value (does some stuff with container)

            //Popout button
            var pop = $('<button>Popout</button>').button()
                .css("margin-top", "10px")
                .on("click", function () {
                    _this.showFloatingImages(taxonName, 200, 200);
                });
            imageDiv.append(pop);
        }

        //Set KB values
        if (includeKb) {
            columns.push(_this.showTaxonCharacterValues(core.oTaxa[taxonName], true));
        }

        //Set other information
        var htmlFiles = _this.getTaxonHtmlFiles(taxonName);
        if (includeText && htmlFiles.length > 0) {

            var htmlDiv = $('<div>');
            columns.push(htmlDiv);

            //Control for selecting HTML file
            if (htmlFiles.length > 1) {
                var disSelect = $('<div style=="margin-bottom: 20px">').appendTo(htmlDiv);
                var htmlSel = $("<select id='vis4html'></select>").appendTo(disSelect);
                htmlFiles.forEach(function (file, iFile) {
                    var opt = $("<option/>").text(file.Caption).attr("value", iFile);
                    htmlSel.append(opt);
                });
                htmlSel.selectmenu({
                    change: function (event, data) {
                        _this.showTaxonHtmlInfo(taxonName, $('#vis4HtmlDisplayDiv'), data.item.value);
                    }
                })
                .selectmenu("menuWidget");
                htmlSel.selectmenu({ width: "100%" }); //Do this separately or you get zero width
            }
            var htmlDisplayDiv = $('<div id="vis4HtmlDisplayDiv">').appendTo(htmlDiv);
            
            _this.showTaxonHtmlInfo(taxonName, htmlDisplayDiv, 0);
        }

        tdColumns.forEach(function(tdCol, iCol) {
            if (columns[iCol]) {
                tdCol.html(columns[iCol]);
            } else {
                tdCol.html(null);
            }
        });

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

        var _this = this;  

        //Height has to be set in the refresh method otherwise has no effect
        $('#vis4taxon').selectmenu("menuWidget").css("height", 200);

        //console.log("vis4 refresh")

        //Consider including
        //this.fireRefresh();
    }

})(jQuery, this.tombiovis)