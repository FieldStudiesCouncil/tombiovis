(function ($, tbv) {
    "use strict";

    tbv.gui.main = {};

    //Create the context menu object
    tbv.gui.main.contextMenu = {
        items: {}, //Links to each item in the menu
        visContexts: {}, //The visualisations contexts valid for each item
        guiContexts: {} //The GUI contexts valid for each item
    };

    tbv.gui.main.contextMenu.addItem = function (label, f, bReplace, visContexts, guiContexts) {
        //Method to add a context menu item

        //Replace item if already exists 
        //(workaround to let different visualisations have same items with different functions)
        if (bReplace && label in tbv.gui.main.contextMenu.items) {
            tbv.gui.main.contextMenu.items[label].remove();
            delete tbv.gui.main.contextMenu.items[label];
            delete tbv.gui.main.contextMenu.visContexts[label];
            delete tbv.gui.main.contextMenu.guiContexts[label];
        }

        //Add item if it does not already exist
        if (!(label in tbv.gui.main.contextMenu.items)) {

            var item = $("<li>").append($("<div>").text(label).click(f));
            tbv.gui.main.contextMenu.menu.append(item);
            tbv.gui.main.contextMenu.menu.menu("refresh");
            tbv.gui.main.contextMenu.items[label] = item;
            tbv.gui.main.contextMenu.visContexts[label] = visContexts;
            tbv.gui.main.contextMenu.guiContexts[label] = guiContexts;
        }

        contextChanged();
    }

    tbv.gui.main.contextMenu.removeItem = function (label) {
        //Method to remove a context menu item
        if (label in tbv.gui.main.contextMenu.items) {
            tbv.gui.main.contextMenu.items[label].remove();
            delete tbv.gui.main.contextMenu.items[label];
            delete tbv.gui.main.contextMenu.visContexts[label];
            delete tbv.gui.main.contextMenu.guiContexts[label];
        }
    } 

    tbv.gui.main.updateProgress = function (value) {
        //Increments offline download progress (value is in percent of resources)
        //value is in percent of resources
        if (value == 100) {
            $('#tombioGuiLargeDownloadProgressHeader').text("Resource download complete")
        }
        $("#tombioGuiLargeDownloadProgress").progressbar("value", value);
    }

    tbv.gui.main.offlineOptions = function () {
        //Instructs the GUI to present offline management options to user

        var html = ""
        html += '<button id="tombioGuiLargeOfflineButton">Download for offline use</button>';
        html += '<p id="tombioGuiLargeDownloadProgressHeader" style="display: none">Downloading resources...</p>';
        html += '<div id="tombioGuiLargeDownloadProgress" style="display: none;"></div>';
        html += '<p></p>';

        //tbv.gui.main.dialog("Offline options", html);

        $('#offlineOptions').html(html);
        $('#tombioGuiLargeOfflineButton').button()
            .click(function () {
                $('#tombioGuiLargeDownloadProgressHeader').show();
                $('#tombioGuiLargeDownloadProgress').show();
                tbv.f.cacheAll();
            })
        $("#tombioGuiLargeDownloadProgress").progressbar({
            min: 0,
            max: 100,
            value: 0
        });
        tbv.gui.main.visShow("offlineOptions");
    }

    tbv.gui.main.offerRefresh = function () {

        //Instructs the GUI to offer refresh to user
        $("#tombioGuiDialog").remove();

        //Create dialog for input control help and information
        $("<div>").attr("id", "tombioGuiDialog").css("display", "none").appendTo($("#tombioGuiLargeJqueryUi"));

        $("#tombioGuiDialog").dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
                "Refresh": function () {
                    window.location.reload();
                },
                "Not now": function () {
                    $(this).dialog("close");
                }
            }
        })
        $("#tombioGuiDialog").dialog('option', 'title', "Refresh required");
        $("#tombioGuiDialog").html('<p>To complete preparation for using offline, a refresh is required.</p>');
        $("#tombioGuiDialog").dialog("open");
    }

    tbv.gui.main.setSelectedTool = function (toolName) {
        if ($('#tombioGuiLargeJqueryUiVisualisation').val() != toolName) {
            $('#tombioGuiLargeJqueryUiVisualisation').val(toolName);
        }
    }

    tbv.gui.main.resizeControlsAndTaxa = function () {

        if ($("#tombioGuiLargeJqueryUiControls").is(":visible")) {
            //tombioGuiLargeJqueryUiControls is floated on the left.
            //Reset left-margin of tombioGuiLargeJqueryUiTaxa to ensure it occupies correct width.
            var controlsWidth = $('#tombioGuiLargeJqueryUiControls').width();
            $('#tombioGuiLargeJqueryUiTaxa').css("margin-left", controlsWidth + 10);
            //Reset min-height of tombioGuiLargeJqueryUiControlsAndTaxa to ensure that stuff that comes
            //after (e.g. footer) comes under floated tombioGuiLargeJqueryUiControls.
            var controlsHeight = $('#tombioGuiLargeJqueryUiControls').height();
            $('#tombioGuiLargeJqueryUiControlsAndTaxa').css("min-height", controlsHeight + 10);
        } else {

            $('#tombioGuiLargeJqueryUiTaxa').css("margin-left", 0);
            $('#tombioGuiLargeJqueryUiControlsAndTaxa').css("min-height", "0px");
        }
    }

    tbv.gui.main.init = function() {
        //Build top level interface elements
        $("#tombiod3vis").html(""); //This point can be reached a second time if checking is enabled and 'continue' button uses, so clear out the div.

        //Main div
        $("#tombiod3vis").css("position", "relative");

        //Main div
        $("<div>").attr("id", "tombioGuiLargeJqueryUi").addClass("needsclick").css("display", "none").appendTo("#tombiod3vis");

        //Format warning div
        $("<div style='width: " + window.screen.width + "px'>").attr("id", "tombioGuiLargeJqueryUiDeviceWarning").appendTo("#tombioGuiLargeJqueryUi");
        $("<div>").attr("id", "tombioGuiLargeJqueryUiDeviceWarningInnerDiv").css("margin", "2em").appendTo($("#tombioGuiLargeJqueryUiDeviceWarning"));
        $("<p>").text("This Identikit tool is designed for large format devices. If you are working with a small screen or with a touch device, it might not appear or work as intended. We are working to produce a range of 'mobile-first' tools in the latter part of 2018.")
            .appendTo($("#tombioGuiLargeJqueryUiDeviceWarningInnerDiv"));
        $("<img>").attr("id", "tombioGuiLargeJqueryUiDeviceWarningButton")
            .attr("src", tbv.opts.tombiopath + "/resources/remove.png")
            .css("position", "absolute")
            .css("right", "10px").css("top", "10px")
            .appendTo($("#tombioGuiLargeJqueryUiDeviceWarningInnerDiv"));
        $("#tombioGuiLargeJqueryUiDeviceWarningButton").on("click", function () {
            $("#tombioGuiLargeJqueryUiDeviceWarning").hide();
        })

        //An area for tools to add info
        $("<div>").attr("id", "tombioGuiLargeJqueryUiFlashDisplay").css("display", "none").appendTo("#tombioGuiLargeJqueryUi");

        //Tool drop-down and PDF info button
        var table = $("<table>").appendTo("#tombioGuiLargeJqueryUi");
        var tr = $("<tr>").appendTo(table);
        var td1 = $("<td>").appendTo(tr);
        var td2 = $("<td>").appendTo(tr);
        $("<select>").attr("id", "tombioGuiLargeJqueryUiVisualisation").appendTo(td1);

        //Add Info PDF button if info.pdf file is found
        $.ajax({
            //https://forums.asp.net/t/1640966.aspx?Check+file+exist+on+server+using+Javascript
            type: "HEAD",
            url: tbv.opts.tombiokbpath + "info.pdf",
            success: function (data) {
                var img = $("<img>").attr("src", tbv.opts.tombiopath + "resources/pdf.png");
                img.css("height", "25px");
                img.css("position", "relative");
                img.css("top", "-3px");
                var a = $("<a>").attr("href", tbv.opts.tombiokbpath + "info.pdf");
                a.append(img);
                td2.append(a);
            }
        });


        //Divs for taxa and controls
        $("<div>").addClass("tombioNoSelect").attr("id", "tombioGuiLargeJqueryUiControlsAndTaxa").appendTo("#tombioGuiLargeJqueryUi");
        $("<div>").attr("id", "tombioGuiLargeJqueryUiControls").appendTo("#tombioGuiLargeJqueryUiControlsAndTaxa");
        $("<div>").attr("id", "tombioGuiLargeJqueryUiTaxa").appendTo("#tombioGuiLargeJqueryUiControlsAndTaxa");

        //Divs for information
        $("<div>").attr("id", "currentVisInfo").css("display", "none").appendTo("#tombioGuiLargeJqueryUi");
        $("<div>").attr("id", "kbInfo").css("display", "none").appendTo("#tombioGuiLargeJqueryUi");
        $("<div>").attr("id", "visInfo").css("display", "none").appendTo("#tombioGuiLargeJqueryUi");
        $("<div>").attr("id", "tombioCitation").css("display", "none").appendTo("#tombioGuiLargeJqueryUi");
        $("<div>").attr("id", "mediaFilesCheck").css("display", "none").appendTo("#tombioGuiLargeJqueryUi");
        $("<div>").attr("id", "tvkCheck").css("display", "none").appendTo("#tombioGuiLargeJqueryUi");
        $("<div>").attr("id", "offlineOptions").css("display", "none").appendTo("#tombioGuiLargeJqueryUi");

        //outlineTopDivs();
        function outlineTopDivs() {
            $("#tombiod3vis").css("border", "5px solid red") //.attr("title", "tombiod3vis")
            $("#tombioGuiLargeJqueryUi").css("border", "5px solid blue") //.attr("title", "tombioGuiLargeJqueryUi")
            $("#tombioGuiLargeJqueryUiControlsAndTaxa").css("border", "5px solid green") //.attr("title", "tombioGuiLargeJqueryUiControlsAndTaxa")
            $("#tombioGuiLargeJqueryUiControls").css("border", "5px solid yellow") //.attr("title", "tombioGuiLargeJqueryUiControls")
            $("#tombioGuiLargeJqueryUiTaxa").css("border", "5px solid cyan") //.attr("title", "tombioGuiLargeJqueryUiTaxa")
        }

        //Required interface
        tbv.gui.main.divVis = "#tombioGuiLargeJqueryUiTaxa";
        tbv.gui.main.divInput = "#tombioGuiLargeJqueryUiControls";

        //Check interface
        tbv.f.checkInterface("guiLargeJqueryUi", tbv.templates.gui.main, tbv.gui.main);
    }

    tbv.gui.main.createUIControls = function () {

        //tombioGuiLargeJqueryUi must be made visible before UI created otherwise size styling is not right
        $("#tombioGuiLargeJqueryUi").css("display", "");

        //Context menu
        createContextMenu();

        //Drop-down menu options for the visualisations
        var toolOptions = []; 

        //Add reload KB option for developers
        if (tbv.opts.devel) {
            toolOptions.push($('<option value="reloadkb" class="html" data-class="wrench">Reload KB</option>'));
        }

        //If the tbv.opts.devel option is set, add item to check media files.
        //The option *values* mediaFilesCheck & tvkCheck have software-wide meaning, not just this gui
        if (tbv.opts.checkKB) {
            toolOptions.push($('<option value="mediaFilesCheck" class="html" data-class="wrench">Check media files</option>'));
            if (tbv.d.oCharacters.tvk) {
                toolOptions.push($('<option value="tvkCheck" class="html" data-class="wrench">Check TVKs</option>'));
            }
        }

        //toolOptions.push($('<option value="reloadGuiOnsen" class="html" data-class="reload">Reload with mobile-first interface</option>'));
        //toolOptions.push($('<option value="reloadGuiJQuery" class="html" data-class="reload">Reload with large format interface</option>'));

        //Add the required visualisation tools
        tbv.v.includedVisualisations.forEach(function (toolName, iTool) {

            // User can override default toolname in options
            if (tbv.opts.toolconfig[toolName] && tbv.opts.toolconfig[toolName].name) {
                var displayName = tbv.opts.toolconfig[toolName].name
            } else {
                var displayName = tbv.js.jsFiles[toolName].toolName
            }

            var selOpt = $('<option class="needsclick">')
                .attr("value", toolName)
                .attr("data-class", "vis")
                .addClass("visualisation")
                //.text(tbv.js.jsFiles[toolName].toolName);
                .text(displayName);

            toolOptions.push(selOpt);
        })

        //Add the various info tools
        //The option *values* currentVisInfo, kbInfo, visInfo & tombioCitation have software-wide meaning, not just this gui

        if (!tbv.opts.dd || tbv.opts.dd.indexOf("help") > -1) {
            toolOptions.push($('<option id="optCurrentVisInfo" value="currentVisInfo" class="html" data-class="info"></option>'));
        }
        if (!tbv.opts.dd || tbv.opts.dd.indexOf("kb") > -1) {
            toolOptions.push($('<option value="kbInfo" class="html" data-class="info">About the Knowledge-base</option>'));
        }
        if (!tbv.opts.dd || tbv.opts.dd.indexOf("identikit") > -1) {
            toolOptions.push($('<option value="visInfo" class="html" data-class="info">About FSC Identikit</option>'));
        }
        if (!tbv.opts.dd || tbv.opts.dd.indexOf("citation") > -1) {
            toolOptions.push($('<option value="tombioCitation" class="html" data-class="info">Get citation text</option>'));
        }

        //Loop through options marked default as selected
        toolOptions.forEach(function (opt) {
            if (opt.attr("value") == tbv.v.selectedTool) {
                opt.attr("selected", "selected");
            }
        });

        //Add option for offline options
        if (tbv.opts.pwa) {
            toolOptions.push($('<option value="offline" class="html" data-class="download">Offline options</option>'));
        }

        //Add reload app option
        if (!tbv.opts.dd || tbv.opts.dd.indexOf("reload") > -1) {
            toolOptions.push($('<option value="reload" class="html" data-class="reload">Reload app</option>'));
        }

        //Append options to select control
        $("#tombioGuiLargeJqueryUiVisualisation").append(toolOptions);

        //This call to the jQuery widget method is taken straight from the jQuery online
        //examples for adding widgets to selectmenu items.
        $.widget("custom.iconselectmenu", $.ui.selectmenu, {
            _renderItem: function (ul, item) {
                var li = $("<li>"),
                    wrapper = $("<div>", { text: item.label });

                if (item.disabled) {
                    li.addClass("ui-state-disabled");
                }

                $("<span>", {
                    style: item.element.attr("data-style"),
                    "class": "ui-icon " + item.element.attr("data-class")
                })
                    .appendTo(wrapper);

                return li.append(wrapper).appendTo(ul);
            }
        });
        //Add custom icons to visualisation select menu
        $("#tombioGuiLargeJqueryUiVisualisation")
            .iconselectmenu({
                //open: function () {
                //    //This is a workaround to prevent problems with the 'fastclick.js' library
                //    //loaded with Drupal 8. This was preventing menu item selection on Drupal 8 sites on iPad (including Chrome emulator).
                //    //Couldn't find a way to disable or not load the javascript, so used this option of fastclick which
                //    //is to add a class - needsclick - on elements that you don't want fastclick to work on.
                //    //To make matters worse, just adding the "needsclick" class with addClass in jQuery, doesn't work -
                //    //the addition is lost. So you have to use something like the following in this open option, to
                //    //make it work (https://stackoverflow.com/questions/42534593/add-class-to-jquery-ui-selectmenu-li-from-original-option)
                //    //This is very much a workaround.
                //    $('div.ui-selectmenu-menu li.ui-menu-item').each(function(){
                //        $(this).find("div").addClass("needsclick")
                //    })
                //},
                change: function () {       
                    tbv.f.visChanged($("#tombioGuiLargeJqueryUiVisualisation").val());
                }
                //width: "100%"
            })
            .iconselectmenu("menuWidget")
            .addClass("ui-menu-icons customicons");

        //If the hideVisDropdown option has been set, then hide the dropdown list.
        if (tbv.opts.hideVisDropdown == true) {
            $("#tombioGuiLargeJqueryUiVisualisation-button").hide()
        }
    }

    tbv.gui.main.visShow = function (selectedToolName) {

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

        console.log("selectedToolName", selectedToolName);

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

        //If no visualisation is selected then hide the entire tombioGuiLargeJqueryUiControlsAndTaxa element
        //(otherwise it takes up space at top of info pages).
        //Get the selected visualisation
        var selectedTool = tbv.v.visualisations[selectedToolName];
        if (selectedTool) {
            $("#tombioGuiLargeJqueryUiControlsAndTaxa").show();
        } else {
            $("#tombioGuiLargeJqueryUiControlsAndTaxa").hide();
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
            $("#tombioGuiLargeJqueryUiVisualisation").iconselectmenu("refresh");
        }

        //Refresh context menu
        contextChanged();

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

    tbv.gui.main.dialog = function (title, html) {

        $("#tombioGuiDialog").remove();

        //Create dialog for input control help and information
        $("<div>").attr("id", "tombioGuiDialog").css("display", "none").appendTo($("#tombioGuiLargeJqueryUi"));
        $("#tombioGuiDialog").dialog({
            modal: false,
            width: 550,
            height: 450,
            resizable: true,
            draggable: true,
            autoOpen: false,
            show: {
                effect: "highlight",
                duration: 500
            },
            hide: {
                effect: "fade",
                duration: 250
            }
        })
        
        $("#tombioGuiDialog").dialog('option', 'title', title);
        $("#tombioGuiDialog").html(html);
        $("#tombioGuiDialog").dialog("open");
    }

    tbv.gui.main.createCharacterTooltips = function(selector) {
        $(selector).tooltip({
            track: true,
            items: "span",
            content: function () {
                return getCharacterToolTip($(this).attr("character"));
            }
        })
    }

    tbv.gui.main.createTaxonToolTips = function (selector, displayToolTips) {
        $(selector).tooltip({
            track: true,
            items: "text",
            content: function () {
                if (displayToolTips) {
                    return tbv.f.getTaxonTipImage(this.textContent, this)
                }
            },
            open: function (event, ui) {
                //This overcomes problem of orphaned tooltips which cannot
                //be dismissed. They can now be dismissed by clicking on them.
                //Not sure what causes in first place, but could be reproduced
                //by hovering over name to get tip and thenmove away from name 
                //onto taxon rectangle and click before image disappears.
                var $element = $(event.target);
                ui.tooltip.click(function () {
                    $element.tooltip('close');
                });
            },
        })
    }

    tbv.gui.main.tooltip = function (selector) {
        $(selector).tooltip();
    }

    tbv.gui.main.showFullDetails = function (taxon, selected, x, y) {

        var _this = this;
        var tabOffset;

        //Default parameters
        x = (typeof x !== 'undefined') ? x : 0;
        y = (typeof y !== 'undefined') ? y : 0;
        selected = (typeof selected !== 'undefined') ? selected : 1;

        var tabs = $("<div>").addClass("tombioFullDetailsTabs");
        tabs.css("border", "none");
        var ul = $("<ul>").appendTo(tabs);
        ul.append("<li><a href='#tabs-1'>Knowledge-base</a></li>");
        ul.append("<li><a href='#tabs-2'>Images</a></li>");
        if (tbv.d.oCharacters.tvk) {
            ul.append("<li><a href='#tabs-4'>NBN map</a></li>");
        }
        ul.append("<li><a href='#tabs-3'>Details</a></li>");
        var tab1 = $("<div>").attr("id", "tabs-1").appendTo(tabs);
        var tab2 = $("<div>").attr("id", "tabs-2").appendTo(tabs);
        if (tbv.d.oCharacters.tvk) {
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
        var divTaxonDetails = tbv.f.getTaxonCharacterValues(tbv.d.oTaxa[taxon])
        tab1.append(divTaxonDetails);

        //Images
        var img = tbv.f.addTaxonImagesToContainer({ taxon: taxon, container: tab2, height: tab2.height() });

        //NBN maps
        if (tbv.d.oCharacters.tvk && tbv.d.oTaxa[taxon].tvk) {
            var $div = $("<div>").css("position", "relative").appendTo(tab4);
            tbv.f.addNBNMapToContainer(tbv.d.oTaxa[taxon].tvk, $div);
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

            var htmlFiles = tbv.f.getTaxonHtmlFiles(taxon);

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
                            tbv.f.addTaxonHtmlToContainer(taxon, htmlDiv2, data.item.value);
                        }
                    });
                }
                htmlDiv2.appendTo(htmlDiv);
                tbv.f.addTaxonHtmlToContainer(taxon, htmlDiv2, 0);
            }
        }
    }

    function createContextMenu() {

        //Initialise the ul element which will form basis of menu
        tbv.gui.main.contextMenu.menu = $("<ul>").css("white-space", "nowrap").appendTo('#tombioGuiLargeJqueryUi')
            .addClass("contextMenu")
            .css("position", "absolute")
            .css("display", "none")
            .css("z-index", 999999);

        //Make it into a jQuery menu
        tbv.gui.main.contextMenu.menu.menu();

        //Handle the invocation of the menu
        $("#tombioGuiLargeJqueryUi").on("contextmenu", function (event) {

            tbv.gui.main.contextMenu.menu.position({
                //This will not work for the first click for
                //some reason - subsequent clicks okay
                //my: "top left",
                //of: event
            });

            //Alternative method
            var parentOffset = $(this).parent().offset();
            var relX = event.pageX - parentOffset.left;
            var relY = event.pageY - parentOffset.top;
            tbv.gui.main.contextMenu.menu.css({ left: relX, top: relY });

            tbv.gui.main.contextMenu.menu.show();

            return false; //Cancel default context menu
        })

        //Handle removal of the menu
        $("#tombioGuiLargeJqueryUi").on("click", function () {
            tbv.gui.main.contextMenu.menu.hide();
        });
    }

    function contextChanged() {

        //Go through each item in context menu and hide it if 
        //not valid for this context.
        for (var label in tbv.gui.main.contextMenu.items) {

            var show = true;
            //For visualisation contexts, then the menu item will be show if the current visualisation
            //appears in that items visContexts array.
            if (tbv.gui.main.contextMenu.visContexts[label].indexOf(tbv.v.currentTool) == -1) {
                show = false;
            }
            //For GUI contexts then if the guiContexts is empty array or undefined, then the menu item
            //will be shown, otherwise it will only be shown if the current gui appears in the guiContexts array.
            if (tbv.gui.main.contextMenu.guiContexts[label]) {
                if (tbv.gui.main.contextMenu.guiContexts[label].indexOf(tbv.opts.gui) == -1) {
                    show = false;
                }
            }

            if (show) {
                tbv.gui.main.contextMenu.items[label].show();
            } else {
                tbv.gui.main.contextMenu.items[label].hide();
            }
        }
    }

    function debugText(text, append) {
        //A general utility function for printing diagnostic text in cases where a console is not available,
        //e.g. on mobile device browsers. Requires element #tombioGuiLargeJqueryUiFlashDisplay.
        var d = $("#tombioGuiLargeJqueryUiFlashDisplay");
        if (text === null) {
            //Hide error display element
            d.html("");
            d.hide();
        } else {
            d.show();
            //Random number helps us distinguish when function is called repeatedly
            //with the same text
            var rand = Math.floor(Math.random() * 1000);
            text = rand + " " + text;
            if (append) {
                d.html(d.html() + "<br/>" + text);
            } else {
                d.html(text);
            }
        }
    }

    function getCharacterToolTip(character) {

        //###################################
        //06/08/2018 needs rewriting to use functions from tombiovis as er keyinputOnsenUI
        //###################################

        var ret = $('<div/>');
        var tipTextPresent = false;

        //Help text for character
        //If HelpShort exists - use this for tip text, else use Help text. Must allow
        //for KBs where HelpShort column doesn't exist for backward compatibility.
        if (tbv.d.oCharacters[character].HelpShort && tbv.d.oCharacters[character].HelpShort != "") {
            var helpText = tbv.d.oCharacters[character].HelpShort;
            tipTextPresent = true;
        } else {
            var helpText = tbv.d.oCharacters[character].Help;
        }

        //Retrieve collection of media image rows for this character and sort by priority.
        var charImagesFull = tbv.d.media.filter(function (m) {
            if ((m.Type == "image-local" || m.Type == "image-web") && m.Character == character) {
                return true;
            }
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        })

        //Loop through images for this character and set image for tooltip as highest
        //priority image for which *no state value* is set (i.e. defined for character itself)
        //and also count the number of *other* images that would be displayed in full help window
        //(which includes state value images) - to help determine 'click for' text to append to tip.
        var tipImage;
        var otherFullImageCount = 0;
        var fullImageCount = 0;
        charImagesFull.forEach(function (m) {
            var isForFull = false;
            var isForTip = false;
            if (!m.UseFor) {
                isForTip = m.State ? false : true;
                isForFull = true;
            } else {
                m.UseFor.split(",").forEach(function (useForVal) {
                    if (useForVal.toLowerCase().trim() == "tip") {
                        isForTip = m.State ? false : true;
                    }
                    if (useForVal.toLowerCase().trim() == "full") {
                        isForFull = true;
                    }
                })
            }
            if (isForTip && !tipImage) {
                tipImage = m;
            } else if (isForFull) {
                otherFullImageCount++;
            }
            if (isForFull) {
                fullImageCount++;
            }
        })

        var figure;
        var floating = false;
        if (tipImage) {
            //For tooltips, only one image - the top priority image - is displayed.
            figure = $('<figure/>');
            figure.addClass("keyInputHelpFigure");
            var img = $('<img/>', { src: tipImage.URI }).appendTo(figure).css("margin-top", 2);
            if (tipImage.ImageWidth) {
                img.css("width", tipImage.ImageWidth);
            }
            var cap = $('<figcaption/>', { html: tipImage.Caption }).appendTo(figure);

            //If the TipStyle column exists (be prepared for it not to for older KBs)
            //then adjust the style of the figure appropriately
            if (tipImage.TipStyle && tipImage.TipStyle != "") {
                //TipStyle should be something like this: right-25 or left-40
                var tipStyleElements = tipImage.TipStyle.split("-");
                var float = tipStyleElements[0];
                var percent = tipStyleElements[1];
                figure.css("width", percent + "%");
                figure.css("float", float);
                figure.css("margin-bottom", 5);
                if (float == "right") {
                    figure.css("margin-left", 5);
                } else {
                    figure.css("margin-right", 5);
                }
                floating = true;
            }
        }

        //Add the elements in the correct order. If there is a floating image, it must come
        //first so that it floats at the top. If not floating, it must come second.
        var elements = [];
        if (floating) {
            elements.push(figure);
        }
        if (helpText.length > 0) {
            elements.push($('<span/>').html(helpText))
        }
        if (!floating && figure) {
            elements.push(figure);
        }
        elements.forEach(function (el) {
            ret.append(el)
        })

        //Is there any state value help text? Required to determine 'click for' text.
        var valueHelp = tbv.f.stateValueHelpPresent(tbv.d.oCharacters[character]);

        //Add 'click for' text for full help dialog. If tip text is present then there will be fuller help text.
        //then this message should make it clear that *further* help is available. Otherwise a general message
        //about a resizable dialog.

        var clickForText = ""
        if (tipTextPresent || otherFullImageCount > 0 || valueHelp.length > 0) {
            var clickForText = "(Click for <b>more detailed help</b>.)"
        } else if (tipImage && fullImageCount > 0) {
            var clickForText = "(Click for resizeable help window.)"
        }
        if (clickForText) {
            $('<div/>').css("margin-top", 5).css("font-weight", "normal").html(clickForText).appendTo(ret);
        }

        return ret
    }

}(jQuery, this.tombiovis));