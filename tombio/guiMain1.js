(function ($, tbv) {

    "use strict";

    tbv.gui.main1 = {};

    //Required for standard gui interface
    tbv.gui.main1.toolSet = function (toolName) {
        if ($('#tombioGuiMain1Visualisation').val() != toolName) {
            $('#tombioGuiMain1Visualisation').val(toolName);
        }
    }

    //Required for standard gui interface
    tbv.gui.main1.resizeControlsAndTaxa = function () {
        //Because we want to prevent normal flow where tombioGuiMain1Taxa div would be moved
        //under tombioGuiMain1Controls div, we set a min width of their parent div to accommodate
        //them both.
        if ($("#tombioGuiMain1Controls").is(":visible")) {
            var controlsWidth = $('#tombioGuiMain1Controls').width();
            $('#tombioGuiMain1ControlsAndTaxa').css("min-width", controlsWidth + $('#tombioGuiMain1Taxa').width() + 50);
        } else {
            $('#tombioGuiMain1ControlsAndTaxa').css("min-width", "0px");
        }
    }

    //Required for standard gui interface
    tbv.gui.main1.addTopPageElements = function() {
        //Build top level interface elements
        $("#tombiod3vis").html(""); //This point can be reached a second time if checking is enabled and 'continue' button uses, so clear out the div.

        //Main div
        $("#tombiod3vis").css("position", "relative");

        //Main div
        $("<div>").attr("id", "tombioGuiMain1").addClass("needsclick").css("display", "none").appendTo("#tombiod3vis");

        //Format warning div
        $("<div>").attr("id", "tombioGuiMain1DeviceWarning").appendTo("#tombioGuiMain1");
        $("<div>").attr("id", "tombioGuiMain1DeviceWarningInnerDiv").css("margin", "2em").appendTo($("#tombioGuiMain1DeviceWarning"));
        $("<p>").text("This Identikit tool is designed for large format devices. If you are working with a small screen or with a touch device, it might not appear or work as intended. We are working to produce a range of 'mobile-first' tools in the latter part of 2018.")
            .appendTo($("#tombioGuiMain1DeviceWarningInnerDiv"));
        $("<img>").attr("id", "tombioGuiMain1DeviceWarningButton")
            .attr("src", tbv.opts.tombiopath + "/resources/remove.png")
            .css("position", "absolute")
            .css("right", "10px").css("top", "10px")
            .appendTo($("#tombioGuiMain1DeviceWarningInnerDiv"));
        $("#tombioGuiMain1DeviceWarningButton").on("click", function () {
            $("#tombioGuiMain1DeviceWarning").hide();
        })

        //An area for printing diagnostic text in cases where a console is not available, e.g.on mobile device browsers
        $("<div>").attr("id", "tombioGuiMain1DebugText").css("display", "none").appendTo("#tombioGuiMain1");


        //Tool drop-down
        $("<select>").attr("id", "tombioGuiMain1Visualisation").appendTo("#tombioGuiMain1");

        //Divs for taxa and controls
        $("<div>").addClass("tombioNoSelect").attr("id", "tombioGuiMain1ControlsAndTaxa").appendTo("#tombioGuiMain1");
        $("<div>").attr("id", "tombioGuiMain1Controls").css("display", "none").appendTo("#tombioGuiMain1ControlsAndTaxa");
        $("<span>").attr("id", "tombioGuiMain1Taxa").appendTo("#tombioGuiMain1ControlsAndTaxa");
        tbv.gui.main1.visParent = "#tombioGuiMain1Taxa"

        //Divs for information
        $("<div>").attr("id", "currentVisInfo").css("display", "none").appendTo("#tombioGuiMain1");
        $("<div>").attr("id", "kbInfo").css("display", "none").appendTo("#tombioGuiMain1");
        $("<div>").attr("id", "visInfo").css("display", "none").appendTo("#tombioGuiMain1");
        $("<div>").attr("id", "tombioCitation").css("display", "none").appendTo("#tombioGuiMain1");
        $("<div>").attr("id", "mediaFilesCheck").css("display", "none").appendTo("#tombioGuiMain1");
        $("<div>").attr("id", "tvkCheck").css("display", "none").appendTo("#tombioGuiMain1");

        //outlineTopDivs();
        function outlineTopDivs() {
            $("#tombiod3vis").css("border", "5px solid red") //.attr("title", "tombiod3vis")
            $("#tombioGuiMain1").css("border", "5px solid blue") //.attr("title", "tombioGuiMain1")
            $("#tombioGuiMain1ControlsAndTaxa").css("border", "5px solid green") //.attr("title", "tombioGuiMain1ControlsAndTaxa")
            $("#tombioGuiMain1Controls").css("border", "5px solid yellow") //.attr("title", "tombioGuiMain1Controls")
            $("#tombioGuiMain1Taxa").css("border", "5px solid cyan") //.attr("title", "tombioGuiMain1Taxa")
        }
    }

    //Required for standard gui interface
    tbv.gui.main1.createUIControls = function () {

        //tombioGuiMain1 must be made visible before UI created otherwise size styling is not right
        $("#tombioGuiMain1").css("display", "");

        //Context menu
        createContextMenu();

        //Drop-down menu options for the visualisations
        var toolOptions = []; 

        //Add reload option
        toolOptions.push($('<option value="reload" class="html" data-class="reload">Reload</option>'));

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
            if (tbv.d.oCharacters.TVK) {
                toolOptions.push($('<option value="tvkCheck" class="html" data-class="wrench">Check TVKs</option>'));
            }
        }

        //If a selectedTool has been specified as a query parameter then set as default,
        //otherwise, if a selectedTool has been specified in top level options (in HTML) then set as default,
        //otherwise look to see if one is specified in the knowledge base to use as default.
        var paramSelectedTool = tbv.f.getURLParameter("selectedTool");
        if (paramSelectedTool) {
            tbv.v.selectedTool = paramSelectedTool;
        } else if (tbv.opts.selectedTool) {
            tbv.v.selectedTool = tbv.opts.selectedTool;
        } else if (tbv.d.kbconfig.selectedTool) {
            //Deprecated
            tbv.v.selectedTool = tbv.d.kbconfig.selectedTool;
        } else {
            //Otherwise select first tool
            tbv.v.selectedTool = tbv.v.includedVisualisations[0];
        }

        //Loop through options marked default as selected
        toolOptions.forEach(function (opt) {
            if (opt.attr("value") == tbv.v.selectedTool) {
                opt.attr("selected", "selected");
            }
        });

        //Append options to select control
        $("#tombioGuiMain1Visualisation").append(toolOptions);

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
        $("#tombioGuiMain1Visualisation")
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
                    tbv.v.selectedTool = $("#tombioGuiMain1Visualisation").val();
                    tbv.f.visChanged(tbv.v.selectedTool);
                }
                //width: "100%"
            })
            .iconselectmenu("menuWidget")
            .addClass("ui-menu-icons customicons");

        //If the hideVisDropdown option has been set, then hide the dropdown list.
        if (tbv.opts.hideVisDropdown == true) {
            $("#tombioGuiMain1Visualisation-button").hide()
        }
    }

    //Required for standard gui interface
    tbv.gui.main1.visShow = function (selectedToolName) {

        //Get the selected visualisation
        var selectedTool = tbv.v.visualisations[selectedToolName];

        //If the user has selected to show citation then generate
        if (selectedToolName == "tombioCitation") {
            $('#tombioCitation').html(createCitationPage());
        }

        //If the user has selected to check media files
        if (selectedToolName == "mediaFilesCheck") {
            $('#mediaFilesCheck').html(tbv.f.createMediaCheckPage());
        }

        //If the user has selected to check media files
        if (selectedToolName == "tvkCheck") {
            $('#tvkCheck').html(tbv.f.createTvkCheckPage());
        }

        //If the user has selected to show kb info and not yet loaded,
        //then load.
        if (selectedToolName == "kbInfo" && $('#kbInfo').html().length == 0) {
            //var title = $('<h2>').text(tbv.d.kbmetadata['title']);
            //$('#kbInfo').html(title);
            $.get(tbv.opts.tombiokbpath + "info.html", function (html) {
                $('#kbInfo').append(html.replace(/##tombiopath##/g, tbv.opts.tombiopath).replace(/##tombiokbpath##/g, tbv.opts.tombiokbpath));
            }).always(function () {
                //Citation
                var citation = $('<h3>').attr("id", "tombioKbCitation").text("Citation");
                $('#kbInfo').append(citation);
                $('#kbInfo').append(tbv.f.getCitation(tbv.d.kbmetadata, "Knowledge-base", tbv.d.softwareMetadata.title));
                //Add the revision history
                var header = $('<h3>').attr("id", "tombioKbRevisionHistory").text("Knowledge-base revision history");
                $('#kbInfo').append(header);
                var currentVersion = $('<p>').html('<b>Current version: ' + tbv.d.kbmetadata['version'] + '</b>');
                $('#kbInfo').append(currentVersion);

                var table = $('<table>');
                var tr = $('<tr>')
                    .css('background-color', 'black')
                    .css('color', 'white');
                tr.append($('<td>').text('Date').css('padding', '3px'));
                tr.append($('<td>').text('Version').css('padding', '3px'));
                tr.append($('<td>').text('Notes').css('padding', '3px'));
                table.append(tr);

                tbv.d.kbreleaseHistory.forEach(function (version, iRow) {
                    tr = $('<tr>');
                    if (iRow % 2 == 0) {
                        tr.css('background-color', 'rgb(200,200,200)');
                    } else {
                        tr.css('background-color', 'rgb(230,230,230)');
                    }
                    var d = new Date(version.Date);

                    tr.append($('<td>').css('padding', '3px').text(d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear()));
                    tr.append($('<td>').css('padding', '3px').text(version.Value));
                    tr.append($('<td>').css('padding', '3px').text(version.Notes));
                    table.append(tr);
                });
                $('#kbInfo').append(table);
            });
        }

        //If the user has selected to show general tombio vis info and not yet loaded,
        //then load.
        if (selectedToolName == "visInfo" && $('#visInfo').html().length == 0) {
            $.get(tbv.opts.tombiopath + "visInfo.html", function (html) {
                $('#visInfo').html(html.replace(/##tombiopath##/g, tbv.opts.tombiopath).replace(/##tombiokbpath##/g, tbv.opts.tombiokbpath));
            });
        }

        //If the user has selected to show info for current visualisation then load.
        //(This is done every time because info can changed depending on last selected tool.)
        if (selectedToolName == "currentVisInfo") {

            //Dimension and empty array to accommodate all the help files referenced by this object. 
            //We do this  be sure that html files are in their correct position in array which if 
            //we relied on load order might not be right since they load asynchronously.
            var helpFiles = new Array(tbv.v.visualisations[tbv.v.lastVis].helpFiles.length);
            var pFiles = [];
            tbv.v.visualisations[tbv.v.lastVis].helpFiles.forEach(function (helpFile, i) {

                pFiles.push(new Promise(function (resolve, reject) {
                    $.get(helpFile, function (html) {
                        helpFiles[i] = html;
                        resolve();
                    });
                }));
            });
            Promise.all(pFiles).then(function () {
                var help = "";
                helpFiles.forEach(function (helpFile) {
                    help += helpFile;
                });
                help = help.replace(/##tombiopath##/g, tbv.opts.tombiopath).replace(/##tombiokbpath##/g, tbv.opts.tombiokbpath);
                $('#currentVisInfo').html(help);
            })
        }

        //Change tool if necessary and associated input control
        if (selectedToolName != tbv.v.currentTool) {

            //Hide previous tool and input control
            if (tbv.v.currentTool) {
                //Hide tool
                var $prevToolDiv = $("#" + tbv.v.currentTool)
                $prevToolDiv.hide();
                //Hide input control
                var prevTool = tbv.v.visualisations[tbv.v.currentTool]
                if (prevTool && prevTool.inputControl) {
                    prevTool.inputControl.$div.hide();
                }
            }
            //Show selected tool
            var $currentToolDiv = $("#" + selectedToolName);
            $currentToolDiv.show();
            //Show input control of selected tool (if there is one)
            //and initialise input controls from current character input
            var currentTool = tbv.v.visualisations[selectedToolName]
            if (currentTool && currentTool.inputControl) {
                currentTool.inputControl.$div.show();
                currentTool.inputControl.initFromCharacterState();
            }
        }

        //Show hide the key input controls and relevant context menu items
        if (selectedTool && selectedTool.charStateInput) {
            controlsShowHide(true);
        } else {
            controlsShowHide(false);
        }

        //If no visualisation is selected then hide the entire tombioGuiMain1ControlsAndTaxa element
        //(otherwise it takes up space at top of info pages).
        if (selectedTool) {
            $("#tombioGuiMain1ControlsAndTaxa").show();
        } else {
            $("#tombioGuiMain1ControlsAndTaxa").hide();
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
            $("#tombioGuiMain1Visualisation").iconselectmenu("refresh");
        }

        //Refresh context menu
        tbv.gui.main1.contextMenu.contextChanged(selectedToolName);

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

    function createCitationPage () {

        var html = $("<div>"), t;

        //Generate the citation for the core software
        html.append($("<h3>").text("Citation for FSC Identikit (core software)"))
        t = "This is the reference you can use for the FSC Identikit - in other words the core software.";
        t += " The core version number is updated whenever there is a new major release of the core software.";
        html.append($("<p>").html(t));
        html.append($("<input style='position: relative; top: 0.2em' checked='checked' type='checkbox' name='tbCitationCore' id='tbCitationCore'>"));
        html.append($("<span>").text("Copy citation"));
        html.append($("<b>").html(tbv.f.getCitation(tbv.d.softwareMetadata, "Software")));

        //Generate the citation for the current tool
        html.append($("<h3>").text("Citation for last selected visualisation tool"))
        t = "This is the reference you can use for the last selected visualisation tool.";
        t += " The tool version number is updated whenever there is a new release of the tool.";
        t += " If you cite a tool, there's no need to cite the core software separately since it is implicit.";
        html.append($("<p>").html(t));
        html.append($("<input style='position: relative; top: 0.2em' type='checkbox' name='tbCitationVis' id='tbCitationVis'>"));
        html.append($("<span>").text("Copy citation"));
        html.append($("<b>").html(tbv.f.getCitation(tbv.v.visualisations[tbv.v.lastVis].metadata, "Software", tbv.d.softwareMetadata.title)));

        //Generate the citation for the knowledge-base
        html.append($("<h3>").text("Citation for knowledge-base"))
        t = "This is the reference you can use for the knowledge-base currently driving the software.";
        t += " The knowledge-base version number is updated whenever there is a new release of the knowledge-base.";
        html.append($("<p>").html(t));
        html.append($("<input style='position: relative; top: 0.2em' checked='checked' type='checkbox' name='tbCitationKb' id='tbCitationKb'>"));
        html.append($("<span>").text("Copy citation"));
        html.append($("<b>").html(tbv.f.getCitation(tbv.d.kbmetadata, "Knowledge-base", tbv.d.softwareMetadata.title)));

        var button = $("<button>Copy citations</button>");
        button.button();

        button.click(function () {
            $("#tbSelectedCitations").html("");//Clear

            if (document.getElementById('tbCitationCore').checked) {
                $("#tbSelectedCitations").append(tbv.f.getCitation(tbv.d.softwareMetadata, "Software"));
            }
            if (document.getElementById('tbCitationVis').checked) {
                $("#tbSelectedCitations").append(tbv.f.getCitation(tbv.v.visualisations[tbv.v.lastVis].metadata, "Software", tbv.d.softwareMetadata.title));
            }
            if (document.getElementById('tbCitationKb').checked) {
                $("#tbSelectedCitations").append(tbv.f.getCitation(tbv.d.kbmetadata, "Knowledge-base", tbv.d.softwareMetadata.title));
            }
            tbv.f.selectElementText(document.getElementById("tbSelectedCitations"));
            $('#tbCitationInstructions').show();
        });

        html.append($("<p>").append(button).append("&nbsp;The selected citations will appear together below - just copy and paste"));
        html.append($("<div id='tbSelectedCitations'>"));
        html.append($("<p id='tbCitationInstructions' style='display: none'>").text("You can now copy and paste the selected citation text."));

        return html;
    }

    function controlsShowHide(show) {

        var display;
        if (show != undefined) {
            display = show;
        } else {
            //Toggle
            display = !($("#tombioGuiMain1Controls").is(":visible"));
        }
        if (display) {
            $("#tombioGuiMain1Controls").show(0, tbv.f.resizeControlsAndTaxa);
        } else {
            $("#tombioGuiMain1Controls").hide(0, tbv.f.resizeControlsAndTaxa);
        }
    }

    function createContextMenu() {

        //Create the context menu object and store in the module state object.
        tbv.gui.main1.contextMenu = {};

        //Add a property which is an object which links to each item
        //in the menu. 
        tbv.gui.main1.contextMenu.items = {};

        //Add a property which is an object which stores the
        //contexts (visualisations) valid for each item.
        tbv.gui.main1.contextMenu.contexts = {};

        //Initialise the ul element which will form basis of menu
        tbv.gui.main1.contextMenu.menu = $("<ul>").css("white-space", "nowrap").appendTo('#tombioGuiMain1')
            .addClass("contextMenu")
            .css("position", "absolute")
            .css("display", "none")
            .css("z-index", 999999);
        //.append($('<li>').text("menu test"))

        //Make it into a jQuery menu
        tbv.gui.main1.contextMenu.menu.menu();

        //Handle the invocation of the menu
        $("#tombioGuiMain1").on("contextmenu", function (event) {

            tbv.gui.main1.contextMenu.menu.position({
                //This will not work for the first click for
                //some reason - subsequent clicks okay
                //my: "top left",
                //of: event
            });

            //Alternative method
            var parentOffset = $(this).parent().offset();
            var relX = event.pageX - parentOffset.left;
            var relY = event.pageY - parentOffset.top;
            tbv.gui.main1.contextMenu.menu.css({ left: relX, top: relY });

            tbv.gui.main1.contextMenu.menu.show();

            return false; //Cancel default context menu
        })

        //Handle removal of the menu
        $("#tombioGuiMain1").on("click", function () {
            tbv.gui.main1.contextMenu.menu.hide();
        });

        //Add method to add an item
        tbv.gui.main1.contextMenu.addItem = function (label, f, contexts, bReplace) {

            //Replace item if already exists 
            //(workaround to let different visualisations have same items with different functions)
            if (bReplace && label in tbv.gui.main1.contextMenu.items) {
                tbv.gui.main1.contextMenu.items[label].remove();
                delete tbv.gui.main1.contextMenu.items[label];
                delete tbv.gui.main1.contextMenu.contexts[label];
            }

            //Add item if it does not already exist
            if (!(label in tbv.gui.main1.contextMenu.items)) {

                var item = $("<li>").append($("<div>").text(label).click(f));
                tbv.gui.main1.contextMenu.menu.append(item);
                tbv.gui.main1.contextMenu.menu.menu("refresh");
                tbv.gui.main1.contextMenu.items[label] = item;
                tbv.gui.main1.contextMenu.contexts[label] = contexts;
            }
        }

        //Add method to remove an item
        tbv.gui.main1.contextMenu.removeItem = function (label) {
            if (label in tbv.gui.main1.contextMenu.items) {
                tbv.gui.main1.contextMenu.items[label].remove();
                delete tbv.gui.main1.contextMenu.items[label];
                delete tbv.gui.main1.contextMenu.contexts[label];
            }
        }

        //Add method to signal that the context has changed
        tbv.gui.main1.contextMenu.contextChanged = function (context) {

            //Go through each item in context menu and hide it if 
            //not valid for this context.
            for (var label in tbv.gui.main1.contextMenu.items) {

                if (tbv.gui.main1.contextMenu.contexts[label].indexOf(context) > -1) {
                    tbv.gui.main1.contextMenu.items[label].show();
                    //console.log("show menu item")
                } else {
                    tbv.gui.main1.contextMenu.items[label].hide();
                    //console.log("hide menu item", label)
                }
            }
        }
    }

    function debugText(text, append) {
        //A general utility function for printing diagnostic text in cases where a console is not available,
        //e.g. on mobile device browsers. Requires element #tombioGuiMain1DebugText.
        var d = $("#tombioGuiMain1DebugText");
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

}(jQuery, this.tombiovis));