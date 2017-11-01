
(function ($, core) {

    //Template visualisation that inherits from visP.
    "use strict";

    var visName = "vis4";
    var exports = core[visName] = {};
    var win, divImage, divKb, divInfo, visFullDetails;
    var selectedTaxon;
    var taxSel; //control
    var imgIndex = 0;
    var txtIndex = 0;
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
            //core.tombiopath + "common/textGroupHelp.html",
            //core.tombiopath + "common/imageGroupHelp.html"
        ]

        //Context menu
        this.contextMenu.addItem("Get URL for this view", function () {
            getViewURL();
            _this.refresh();
        }, [this.visName]);

        //Controls div
        var $flexContainer = $("<div>").appendTo($(this.cssSel));
        $flexContainer.css("display", "flex");
        $(this.cssSel).append($flexContainer);

        this.controlsDiv = $("<div/>").css("width", 210);
        $flexContainer.append(this.controlsDiv);

        var visDiv = $("<div/>").css("flex-grow", 1).css("font-size", "small");
        $flexContainer.append(visDiv);

        taxSel = Object.create(core.taxonSelect);
        taxSel.control(this.controlsDiv, false, taxonSelectCallback);
      
        createCheckBox('tbVis4Images', 'Images', visDiv);
        createCheckBox('tbVis4Kb', 'Knowledge-base', visDiv);
        createCheckBox('tbVis4Text', 'Show text', visDiv);

        function createCheckBox(id, label, parent) {
            var cb = $('<div style="display: inline-block; vertical-align:top; margin-left: 20px">').appendTo(parent);
            cb.append($("<input style='position: relative; top: 0.2em' checked='checked' type='checkbox' name='" + id + "' id='" + id + "'>"));
            cb.append($("<span>").text(label));
            cb.change(function () {
                //If an image is already displayed, then get the current image index
                //and set the module-wide imgIndex variable so that image control
                //initialises to correct index.
                var img = $("#" + visName).find(".tombioImage");
                if (img.length > 0) {
                    imgIndex = img.attr("indexselected")
                }
                //If a text file is already displayed, then get the current text file index
                //and set the module-wide txtIndex variable so that text control
                //initialises to correct index.
                var txt = $("#" + visName).find(".htmlFile");
                if (txt.length > 0) {
                    txtIndex = txt.attr("indexselected")
                }
                showTaxon(selectedTaxon, true);
                imgIndex = 0;
                txtIndex = 0;
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
            imageDiv.html(_this.getTaxonImagesDiv(taxonName, imageDiv, imgIndex, true, true));
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
                        htmlDiv.attr("indexselected", data.item.value)
                    }
                })
                .selectmenu("menuWidget");
                //htmlSel.selectmenu({ width: "100%" }); //Do this separately or you get zero width
            }

            //First text file
            var htmlDiv = $('<div class="htmlFile">').appendTo(visFullDetails);
            htmlDiv.attr("indexselected", txtIndex)
            _this.showTaxonHtmlInfo(taxonName, htmlDiv, txtIndex);
            if (htmlFiles.length > 1) {
                htmlSel.val(txtIndex).selectmenu('refresh');
            }
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

    exports.Obj.prototype.urlParams = function (params) {

        var _this = this;

        //Replace the following to initialise visualisation
        //from parameters.
        console.log("Vis 4 URL parameters:", params);

        //Set the checkboxes
        if (params.opts) {
            var splitOpts = params.opts.split("-");
            $('#tbVis4Text').prop("checked", splitOpts.indexOf("text") > -1);
            $('#tbVis4Images').prop("checked", splitOpts.indexOf("image") > -1);
            $('#tbVis4Kb').prop("checked", splitOpts.indexOf("kb") > -1);
        }

        //Set the visibility of hidden controls
        if (params.hc) {
            taxSel.toggleHiddenControls();
        }

        //Set the sort
        if (params.sort) {
            taxSel.setSort(params.sort);
        }

        //Set the image index
        if (params.imgi) {
            //Set module-wide variable
            imgIndex = params.imgi;
        }

        //Set the text index
        if (params.txti) {
            //Set module-wide variable 
            txtIndex = params.txti;
        }

        //Set the taxon (must come after the image, text and checkbox options set)
        if (params.taxon) {
            taxSel.taxonClick(params.taxon.replace(/%20/g, " "));
        }

        //Set the filter (after taxon selected)
        if (params.filter) {
            if (params.filter.startsWith("-")) {
                var filter = "#" + params.filter.substr(1);
            } else {
                var filter = params.filter;
            }
            console.log("setting filter", filter)
            taxSel.setFilter(filter);
        }

        imgIndex = 0; //Reset module-wide variables
        txtIndex = 0;
    }

    function getViewURL() {
        console.log("Get the URL")

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

        //Filter
        var filter = taxSel.getFilter();
        if (filter) {
            if (filter.startsWith("#")) {
                var filter = "-" + filter.substr(1);
            }
            params.push("filter=" + filter);
        }

        //Sort
        if (taxSel.taxonSort) {
            var sortType;
            if (taxSel.taxonSort == "radio-a") {
                var sortType = "a-z";
            } else if (taxSel.taxonSort == "radio-z") {
                var sortType = "z-a";
            }
            if (sortType) {
                params.push("sort=" + sortType);
            }
        }

        //Hiden controls
        if (taxSel.hiddenControlsShown) {
            params.push("hc=show");
        }

        //Image index
        var img = $("#" + visName).find(".tombioImage");
        if (img.length > 0) {
            params.push("imgi=" + img.attr("indexselected"));
        }

        //Text file index
        var txt = $("#" + visName).find(".htmlFile");
        if (txt.length > 0) {
            params.push("txti=" + txt.attr("indexselected"));
        }

        //Generate the full URL
        var url = encodeURI(window.location.href.split('?')[0] + "?" + params.join("&"));
        _this.copyTextToClipboard(url);
        console.log(url);
    }

})(jQuery, this.tombiovis)