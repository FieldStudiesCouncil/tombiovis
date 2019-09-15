
(function ($, tbv) {

    "use strict";

    var visName = "vis4";
    var vis4 = tbv.v.visualisations[visName] = Object.create(tbv.v.visP);
    vis4.visName = visName;

    var _this;
    var taxSel; 
    var win, divImage, divKb, divInfo, visFullDetails;
    var selectedTaxon;

    vis4.initialise = function () {

        _this = this;

        //Initialise the meta data
        this.metadata.title = "Full taxon details";
        this.metadata.year = "2018";
        this.metadata.authors = "Burkmar, R";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Shrewsbury, England";
        this.metadata.contact = "r.burkmar@field-studies-council.org";
        this.metadata.version = '1.8.0';

        //Other initialisations
        var taxonName;

        //Help files
        this.helpFiles = [
            tbv.opts.tombiopath + "vis4/vis4Help.html",
            tbv.opts.tombiopath + "common/full-details.html",
            tbv.opts.tombiopath + "common/taxon-select-help.html"
        ]

        //Context menu
        tbv.gui.main.contextMenu.addItem("Get URL for full details view", function () {
            getViewURL();
        }, false, [this.visName]);

        //Controls div
        var visDiv = $("<div/>").css("display", "block").css("overflow", "hidden"); 
        $(this.cssSel).append(visDiv);

        //Taxon select control
        taxSel = Object.create(tbv.gui.taxonSelect);
        taxSel.init(tbv.gui.main.divInput, false, taxonSelectCallback);

        createCheckBox('tbVis4Images', 'Images', visDiv);
        createCheckBox('tbVis4NbnMap', 'NBN Map', visDiv);
        createCheckBox('tbVis4Kb', 'Knowledge-base', visDiv);
        createCheckBox('tbVis4Text', 'Show text', visDiv);

        function createCheckBox(id, label, parent) {

            //Only create NBN map checkbox if TVK field is present in kb
            if (id == "tbVis4NbnMap" && !tbv.d.oCharacters.tvk) {
                return;
            }

            var cb = $('<div style="display: inline-block; vertical-align:top; margin-left: 20px">').appendTo(parent);
            cb.append($("<input style='position: relative; top: 0.2em' checked='checked' type='checkbox' name='" + id + "' id='" + id + "'>"));
            cb.append($("<span>").text(label));
            cb.change(function () {
                showTaxon(selectedTaxon, true);
            })
            
        }

        visFullDetails = $('<div>').css("margin", "10px");
        visDiv.append(visFullDetails);
       
        //Interface
        this.taxonSelect = taxSel;

        //Mark as initialised
        this.initialised = true;

        //Check interface
        tbv.f.checkInterface(visName, tbv.templates.visTemplate, tbv.v.visualisations[visName]);
    }

    vis4.refresh = function () {

        //Height has to be set in the refresh method otherwise has no effect
        $('#vis4taxon').selectmenu("menuWidget").css("height", 200);
    }

    vis4.urlParams = function (params) {

        //Set the checkboxes
        if (params.opts) {
            var splitOpts = params.opts.split("-");
            $('#tbVis4Text').prop("checked", splitOpts.indexOf("text") > -1);
            $('#tbVis4Images').prop("checked", splitOpts.indexOf("image") > -1);
            $('#tbVis4Kb').prop("checked", splitOpts.indexOf("kb") > -1);
        }

        var taxon = params.taxon ? params.taxon.replace(/%20/g, " ") : "";

        //Set the image index
        if (params.imgi) {
            tbv.d.oTaxa[taxon].visState[visName].indexselectedImg = params.imgi;
        }

        //Set the text index
        if (params.txti) {
            tbv.d.oTaxa[taxon].visState[visName].indexselectedText = params.txti;
        }

        //Set the taxon (must come after the image, text and checkbox options set)
        if (taxon) {
            taxSel.taxonClick(taxon);
        }

        //Set the taxon input controls
        taxSel.initStateFromParams(params);
    }

    vis4.show = function () {
        //Responsible for showing all gui elements of this tool
        console.log("Show vis4")
        $("#vis4").show();
        taxSel.$div.show();
    }

    vis4.hide = function () {
        //Responsible for hiding all gui elements of this tool
        $("#vis4").hide();
        taxSel.$div.hide();
    }

    function getViewURL() {
       
        var params = [];

        //Tool
        params.push("selectedTool=" + visName)

        //The taxon
        params.push("taxon=" + selectedTaxon)

        //Checkbox options
        var includeImages = document.getElementById('tbVis4Images').checked;
        var includeKb = document.getElementById('tbVis4Kb').checked;
        var includeText = document.getElementById('tbVis4Text').checked;

        if (!(includeImages && includeKb && includeText)) {
            var opts = [];
            if (includeImages) opts.push("image");
            if (includeText) opts.push("text");
            if (includeKb) opts.push("kb");
            params.push("opts=" + opts.join("-"));
        }

        //Get the taxon select URL params
        params = taxSel.setParamsFromState(params);

        //Image index
        if (tbv.d.oTaxa[selectedTaxon].visState[visName].indexselectedImg) {
            params.push("imgi=" + tbv.d.oTaxa[selectedTaxon].visState[visName].indexselectedImg);
        }

        //Text file index
        if (tbv.d.oTaxa[selectedTaxon].visState[visName].indexselectedText) {
            params.push("txti=" + tbv.d.oTaxa[selectedTaxon].visState[visName].indexselectedText);
        }

        //Generate the full URL
        tbv.f.createViewURL(params);
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
        //If the sub-header character has been defined under tbv.opts.toolconfig.vis4.subTitleChar
        //(from the calling page), then add this in parentheses after the taxon name. Oterhwise
        //just use the taxon name.
        var subCharVal, taxonHeader;
        if (tbv.opts.toolconfig.vis4 && tbv.opts.toolconfig.vis4.subTitleChar) {
            var subChar = tbv.opts.toolconfig.vis4.subTitleChar;
            subCharVal = tbv.d.oTaxa[taxonName][subChar].kbValue;
        }
        if (subCharVal) {
            taxonHeader = taxonName + " (" + subCharVal + ")";
        } else {
            taxonHeader = taxonName + " ";
        }
        //Hack to ensure that visualisation takes up full available width.
        taxonHeader = taxonHeader + "<span id='vis4TaxonHeaderPadding'>x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x</span>"

        $("<div id='vis4TaxonHeader'>").html(taxonHeader).appendTo(visFullDetails);

        //Set included flags from checkboxes
        var includeImages = document.getElementById('tbVis4Images').checked;
        var includeNbnMap = document.getElementById('tbVis4NbnMap') && document.getElementById('tbVis4NbnMap').checked;
        var includeKb = document.getElementById('tbVis4Kb').checked;
        var includeText = document.getElementById('tbVis4Text').checked;

        //Adjust included flags depending on availability of images, tvk and HTML files
        var htmlFiles = tbv.f.getTaxonHtmlFiles(taxonName);
        includeText = includeText && htmlFiles.length > 0;
        includeImages = includeImages && tbv.f.getTaxonImages(taxonName).length > 0;
        includeNbnMap = includeNbnMap && tbv.d.oTaxa[taxonName].tvk;

        //Image display
        if (includeImages) {

            var imageDiv = $('<div style="position: relative">').appendTo(visFullDetails);
            if (includeText) {
                //Use a class because we will change style based on media width
                imageDiv.attr("class", "vis4ImageWithText");
            } else {
                imageDiv.attr("class", "vis4ImageNoText");
            }
            var imgIndex = tbv.d.oTaxa[taxonName].visState[visName].indexselectedImg ? tbv.d.oTaxa[taxonName].visState[visName].indexselectedImg : 0;
            tbv.f.addTaxonImagesToContainer({
                taxon: taxonName,
                container: imageDiv,
                indexSelected: imgIndex,
                height: includeText ? 400 : 600,
                fImageSelect: function (index) {
                    tbv.d.oTaxa[taxonName].visState[visName].indexselectedImg = index;
                }
            });

        }

        //NBN map display
        if (includeNbnMap) {
            var $mapDiv = $('<div style="position: relative">').appendTo(visFullDetails);
            if (includeText) {
                //Use a class because we will change style based on media width
                $mapDiv.attr("class", "vis4ImageWithText");
            } else {
                $mapDiv.attr("class", "vis4ImageNoText");
            }
            tbv.f.addNBNMapToContainer(tbv.d.oTaxa[taxonName].tvk, $mapDiv);
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
                        tbv.f.addTaxonHtmlToContainer(taxonName, htmlDiv, data.item.value);
                        //htmlDiv.attr("indexselected", data.item.value);
                        tbv.d.oTaxa[taxonName].visState[visName].indexselectedText = data.item.value;
                    }
                })
                .selectmenu("menuWidget");
                //htmlSel.selectmenu({ width: "100%" }); //Do this separately or you get zero width
            }

            //First text file
            var htmlDiv = $('<div class="htmlFile">').appendTo(visFullDetails);
            var txtIndex = tbv.d.oTaxa[taxonName].visState[visName].indexselectedText ? tbv.d.oTaxa[taxonName].visState[visName].indexselectedText : 0;
            tbv.f.addTaxonHtmlToContainer(taxonName, htmlDiv, txtIndex);
            if (htmlFiles.length > 1) {
                htmlSel.val(txtIndex).selectmenu('refresh');
            }
        }

        //Set KB values
        if (includeKb) {
            visFullDetails.append($("<h2>").css("clear", "both").text("Knowledge-base values"));
            visFullDetails.append(tbv.f.getTaxonCharacterValues(tbv.d.oTaxa[taxonName]));
        }

        //Trigger the image change function whenever browser
        //window is resized.
        if (imageDiv) {
            $(window).resize(function () {
                var img = imageDiv.find(".baseimage");
                img.trigger("change");
            });
        }
    }

})(jQuery, this.tombiovis)