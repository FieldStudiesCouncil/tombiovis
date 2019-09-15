(function ($, tbv) {

    "use strict"; 

    tbv.gui.main = {};

    tbv.gui.main.setSelectedTool = function (toolName) {
        if ($('#tombioGuiLargeVisualisation').val() != toolName) {
            $('#tombioGuiLargeVisualisation').val(toolName);
        }
    }

    tbv.gui.main.resizeControlsAndTaxa = function () {

        if ($("#tombioGuiLargeControls").is(":visible")) {
            //tombioGuiLargeControls is floated on the left.
            //Reset left-margin of tombioGuiLargeTaxa to ensure it occupies correct width.
            var controlsWidth = $('#tombioGuiLargeControls').width();
            $('#tombioGuiLargeTaxa').css("margin-left", controlsWidth + 10);
            //Reset min-height of tombioGuiLargeControlsAndTaxa to ensure that stuff that comes
            //after (e.g. footer) comes under floated tombioGuiLargeControls.
            var controlsHeight = $('#tombioGuiLargeControls').height();
            
            $('#tombioGuiLargeControlsAndTaxa').css("min-height", controlsHeight + 10);
        } else {
            $('#tombioGuiLargeTaxa').css("margin-left", 0);
            $('#tombioGuiLargeControlsAndTaxa').css("min-height", "0px");
        }
    }

    tbv.gui.main.init = function() {
        //Build top level interface elements
        $("#tombiod3vis").html(""); //This point can be reached a second time if checking is enabled and 'continue' button uses, so clear out the div.

        //Main div
        $("#tombiod3vis").css("position", "relative");

        //Main div
        $("<div>").attr("id", "tombioGuiLarge").css("display", "none").appendTo("#tombiod3vis");

        //Div for dialog display
        $("<div>").attr("id", "tombioGuiLargeDialog")
            .css("padding", "1em")
            .css("display", "none")
            .css("position", "absolute")
            .css("background-color", "white")
            .css("border", "5px solid black")
            .css("width", "100%")
            .css("z-index", "5000")
            .css("z-index", "5000")
            .appendTo("#tombioGuiLarge");
        $("<button>").text("Close").appendTo($("#tombioGuiLargeDialog"))
            .on("click", function () {
                $("#tombioGuiLargeDialog").hide();
            });
        $("<div>").attr("id", "tombioGuiLargeDialogTitle").appendTo($("#tombioGuiLargeDialog"));
        $("<div>").attr("id", "tombioGuiLargeDialogContents").appendTo($("#tombioGuiLargeDialog"));

        //Tool drop-down
        $("<select>").attr("id", "tombioGuiLargeVisualisation").appendTo("#tombioGuiLarge");

        //Divs for taxa and controls
        $("<div>").addClass("tombioNoSelect").attr("id", "tombioGuiLargeControlsAndTaxa").appendTo("#tombioGuiLarge");
        $("<div>").attr("id", "tombioGuiLargeControls").appendTo("#tombioGuiLargeControlsAndTaxa");
        $("<div>").attr("id", "tombioGuiLargeTaxa").appendTo("#tombioGuiLargeControlsAndTaxa");

        //Divs for information
        $("<div>").attr("id", "currentVisInfo").css("display", "none").appendTo("#tombioGuiLarge");
        $("<div>").attr("id", "kbInfo").css("display", "none").appendTo("#tombioGuiLarge");
        $("<div>").attr("id", "visInfo").css("display", "none").appendTo("#tombioGuiLarge");
        $("<div>").attr("id", "tombioCitation").css("display", "none").appendTo("#tombioGuiLarge");
        $("<div>").attr("id", "mediaFilesCheck").css("display", "none").appendTo("#tombioGuiLarge");
        $("<div>").attr("id", "tvkCheck").css("display", "none").appendTo("#tombioGuiLarge");

        //outlineTopDivs();
        function outlineTopDivs() {
            $("#tombiod3vis").css("border", "5px solid red") //.attr("title", "tombiod3vis")
            $("#tombioGuiLarge").css("border", "5px solid blue") //.attr("title", "tombioGuiLarge")
            $("#tombioGuiLargeControlsAndTaxa").css("border", "5px solid green") //.attr("title", "tombioGuiLargeControlsAndTaxa")
            $("#tombioGuiLargeControls").css("border", "5px solid yellow") //.attr("title", "tombioGuiLargeControls")
            $("#tombioGuiLargeTaxa").css("border", "5px solid cyan") //.attr("title", "tombioGuiLargeTaxa")
        }

        //Required for interface
        tbv.gui.main.divVis = "#tombioGuiLargeTaxa";
        tbv.gui.main.divInput = "#tombioGuiLargeControls";

        //Check interface
        tbv.f.checkInterface("guiLarge", tbv.templates.gui.main, tbv.gui.main);
    }

    tbv.gui.main.createUIControls = function () {

        //tombioGuiLarge must be made visible before UI created otherwise size styling is not right
        $("#tombioGuiLarge").css("display", "");

        //Drop-down menu options for the visualisations
        var toolOptions = []; 

        //Add reload option
        toolOptions.push($('<option value="reload" class="html" data-class="reload">Reload</option>'));
        toolOptions.push($('<option value="reloadGuiOnsen" class="html" data-class="reload">Reload with mobile-first interface</option>'));
        toolOptions.push($('<option value="reloadGuiJQuery" class="html" data-class="reload">Reload with large format interface</option>'));

        //Add the required visualisation tools
        tbv.v.includedVisualisations.forEach(function (toolName, iTool) {

            var selOpt = $('<option class="needsclick">')
                .attr("value", toolName)
                .attr("data-class", "vis")
                .addClass("visualisation")
                .text(tbv.js.jsFiles[toolName].toolName);

            toolOptions.push(selOpt);
        })

        //Add the various info tools
        //The option *values* currentVisInfo, kbInfo, visInfo & tombioCitation have software-wide meaning, not just this gui
        toolOptions.push($('<option id="optCurrentVisInfo" value="currentVisInfo" class="html" data-class="info"></option>'));
        toolOptions.push($('<option value="kbInfo" class="html" data-class="info">About the Knowledge-base</option>'));
        toolOptions.push($('<option value="visInfo" class="html" data-class="info">About FSC Identikit</option>'));
        toolOptions.push($('<option value="tombioCitation" class="html" data-class="info">Get citation text</option>'));

        //If the tbv.opts.devel option is set, add item to check media files.
        //The option *values* mediaFilesCheck & tvkCheck have software-wide meaning, not just this gui
        if (tbv.opts.checkKB) {
            toolOptions.push($('<option value="mediaFilesCheck" class="html" data-class="wrench">Check media files</option>'));
            if (tbv.d.oCharacters.tvk) {
                toolOptions.push($('<option value="tvkCheck" class="html" data-class="wrench">Check TVKs</option>'));
            }
        }

        //Loop through options marked default as selected
        toolOptions.forEach(function (opt) {
            if (opt.attr("value") == tbv.v.selectedTool) {
                opt.attr("selected", "selected");
            }
        });

        //Append options to select control
        $("#tombioGuiLargeVisualisation").append(toolOptions);

        $("#tombioGuiLargeVisualisation").change(function () {
            tbv.f.visChanged($("#tombioGuiLargeVisualisation").val());
        })

        //If the hideVisDropdown option has been set, then hide the dropdown list.
        if (tbv.opts.hideVisDropdown == true) {
            $("#tombioGuiLargeVisualisation-button").hide()
        }
    }

    tbv.gui.main.visShow = function (selectedToolName) {

        //Get the selected visualisation
        var selectedTool = tbv.v.visualisations[selectedToolName];

        //If the user has selected to show citation then generate
        if (selectedToolName == "tombioCitation") {
            $('#tombioCitation').html(tbv.f.createCitationPage());
        }

        //If the user has selected to check media files
        if (selectedToolName == "mediaFilesCheck") {
            $('#mediaFilesCheck').html(tbv.f.createMediaCheckPage());
        }

        //If the user has selected to check media files
        if (selectedToolName == "tvkCheck") {
            $('#tvkCheck').html(tbv.f.createTvkCheckPage());
        }

        //If the user has selected to show kb info and not yet loaded
        if (selectedToolName == "kbInfo" && $('#kbInfo').html().length == 0) {
            tbv.f.setKbInfo($('#kbInfo'));
        }

        //If the user has selected to show general tombio vis info and not yet loaded
        if (selectedToolName == "visInfo" && $('#visInfo').html().length == 0) {
            tbv.f.setVisInfo($('#visInfo'));
        }

        //If the user has selected to show info for current visualisation then load.
        //(This is done every time because info can changed depending on last selected tool.)
        if (selectedToolName == "currentVisInfo") {
            $('#currentVisInfo').html('');
            tbv.f.setSelectedToolInfo($('#currentVisInfo'));
        }

        console.log("selectedToolName", selectedToolName)

        //Change tool if necessary and associated input control
        if (selectedToolName != tbv.v.currentTool) {

            //Hide previous tool and input control
            if (tbv.v.currentTool) {
                if (tbv.v.visualisations[tbv.v.currentTool]) {
                    tbv.v.visualisations[tbv.v.currentTool].hide();
                } else {
                    $('#' + tbv.v.currentTool).hide();
                }
            }
            //Show new control
            if (tbv.v.visualisations[selectedToolName]) {
                tbv.v.visualisations[selectedToolName].show();
            } else {
                $('#' + selectedToolName).show();
            }
        }

        //If no visualisation is selected then hide the entire tombioGuiLargeControlsAndTaxa element
        //(otherwise it takes up space at top of info pages).
        if (selectedTool) {
            $("#tombioGuiLargeControlsAndTaxa").show();
        } else {
            $("#tombioGuiLargeControlsAndTaxa").hide();
        }

        //Refresh the selected tool
        tbv.f.refreshVisualisation();

        //Store current tool
        tbv.v.currentTool = selectedToolName;

        //Store the last used visualisation and change the name of the menu
        //item for getting info about it.
        if (Object.keys(tbv.v.visualisations).indexOf(selectedToolName) > -1) {
            tbv.v.lastVis = selectedToolName;
            $("#optCurrentVisInfo").text("Using the " + tbv.v.visualisations[tbv.v.lastVis].metadata.title);
        }

        //If this is the first time through - i.e. page just loaded - and
        //this is a visualisation too, then process any URL initialisation parameters.
        if (!tbv.v.initialised && tbv.v.visualisations[selectedToolName]) {
            //Get all the URL parameters
            var params = {};
            //(The global replace on plus characters is to overcome a problem with links put into facebook which
            //replace some space characters with plus characters).
            var sPageURL = decodeURI(window.location.search.substring(1)).replace(/\+/g, ' ');

            var splitParamAndValue = sPageURL.split('&');
            for (var i = 0; i < splitParamAndValue.length; i++) {
                var sParamAndValue = splitParamAndValue[i].split('=');
                params[sParamAndValue[0]] = sParamAndValue[1];
            }
            //Pass into selected tool
            tbv.v.visualisations[selectedToolName].urlParams(params);

            //Set initialised flag
            tbv.v.initialised = true;
        }
    }

    tbv.gui.main.showFullDetails = function (taxon) {

        //Taxon details
        var $divTaxonDetails = tbv.f.getTaxonCharacterValues(tbv.d.oTaxa[taxon])

        //Images
        var $divImages = $("<div>");
        tbv.f.addTaxonImagesToContainer({ taxon: taxon, container: $divImages, height: 300 });

        //NBN maps
        if (tbv.d.oCharacters.tvk && tbv.d.oTaxa[taxon].tvk) {
            var $divNbn = $("<div>").css("position", "relative");
            tbv.f.addNBNMapToContainer(tbv.d.oTaxa[taxon].tvk, $divNbn);
        }

        //HTML files
        var $htmlDiv = $("<div>");
        var htmlFiles = tbv.f.getTaxonHtmlFiles(taxon);

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
                    tbv.f.addTaxonHtmlToContainer(taxon, $htmlDiv2, $(this).val());
                });
            }
            var $htmlDiv2 = $("<div>").appendTo($htmlDiv);
            tbv.f.addTaxonHtmlToContainer(taxon, $htmlDiv2, 0);
        }

        //Append to gui
        var $html = $("<div>");
        $html.append($divTaxonDetails);
        $html.append($divImages);
        $html.append($htmlDiv);
        if ($divNbn) $html.append($divNbn);
        displayInfo($html);
    }

    tbv.gui.main.createCharacterTooltips = function (selector) {
        //No tooltips
    }

    tbv.gui.main.createTaxonToolTips = function (selector, displayToolTips) {
        //No taxon tooltips
    }

    tbv.gui.main.tooltip = function (selector) {

    }

    tbv.gui.main.dialog = function (title, html) {

        $("#tombioGuiLargeDialogTitle").text(title);
        $("#tombioGuiLargeDialogContents").html(html);
        $("#tombioGuiLargeDialog").show();
    }

    //Build a dummy context menu.
    //The visualisations expect to find these objects.
    tbv.gui.main.contextMenu = {};
    tbv.gui.main.contextMenu.addItem = function () { };
    tbv.gui.main.contextMenu.removeItem = function () { };

    function displayInfo($html) {

        var $gui = $("<div style='background-color: white; position: absolute; z-index: 50000; padding: 20px'>");
        $("body").prepend($gui);

        $gui.html(null);

        $("<button>").text("Dismiss").appendTo($gui).click(function () {
            $gui.hide();
        })
        $gui.append($html);
        $gui.show();
    }

}(jQuery, this.tombiovis));