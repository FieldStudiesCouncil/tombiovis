(function ($, core) {

    "use strict";

    //Global object to reference all the global variables.
    //No need to specify properties of the object until they are assigned.
    //Makes explicit in code which are global variables (within the scope of the closure).
    var global = {
        xbullet: "&#x26AB ",
        bullet: "",
        delay: 250,
        duration: 1000,
        infowidth: 640,
        infoheight: 520,
        helpAndInfoDialogWidth: 400,
        helpAndInfoDialogHeight: 250,
        visInfoDialogWidth: 650,
        visInfoDialogHeight: 350,
        scriptsLoaded: false,
        htmlLoaded: false,
        inputCharGroups: []
    };

    core.loadComplete = function (force) {

        //Replace content in header and footer tags with tombiod3 id's - this is
        //most relevant for test harness.
        $("#tombiod3-header").text(core.kbmetadata.title);
        $("#tombiod3-footer").html(getCitation(core.kbmetadata, "Knowledge-base", core.metadata.title));

        //Check the validity of the knowledge-base
        if (!force) {
            if (!core.checkKnowledgeBase()) return;
        }

        //Map taxa to properties of an object for easy reference by name (Taxon property)
        //At the same time, replace each cell value with a StateValue object.
        core.oTaxa = {};
        core.taxa.forEach(function (taxon) {
            core.oTaxa[taxon.Taxon] = taxon;

            for (var property in taxon) {
                if (taxon.hasOwnProperty(property)) {
                    taxon[property] = new StateValue(taxon[property]);
                }
            }
        });

        //Add some extra properties
        core.characters.forEach(function (character) {
            //CharacterStates is an array of state objects including help text etc
            character.CharacterStates = [];
            //CharacterStateValues is an array state values only
            character.CharacterStateValues = [];
            //stateSet attribute
            character.stateSet = false;
            //minVal is the minimum value for numeric values
            character.minVal = null;
            //maxVal is the maximum value for numeric values
            character.maxVal = null;
            //Set minVal & maxVal for numeric characters
            if (character.ValueType == "numeric") {
                core.taxa.forEach(function (taxon) {
                    var minTax = taxon[character.Character].getRange().min;
                    var maxTax = taxon[character.Character].getRange().max;

                    if (!character.minVal || minTax < character.minVal) {
                        character.minVal = minTax;
                    }
                    if (!character.maxVal || maxTax > character.maxVal) {
                        character.maxVal = maxTax;
                    }
                })
            }
        });
        //Map characters to properties of an object for easy reference by name (Character property)
        core.oCharacters = {};
        core.characters.forEach(function (character) {
            core.oCharacters[character.Character] = character;
        });

        core.media.forEach(function (m) {
            if (m.Type == "image-local") {
                m.URI = tombiokbpath + m.URI;
            }
        });

        //Enrich the core.taxa collection so that the StateValue objects
        //know what type of character they are.
        enrichStateValueObjects();

        //Enrich the core.characters collection with the data from
        //core.values. This must follow enrichStateValueObjects.
        addValuesToCharacters();

        //Note whether or not characters are grouped
        global.charactersGrouped = false;
        core.characters.forEach(function (character) {
            if (character.Status == "key" && character.Group.toLowerCase() != "none") {
                global.charactersGrouped = true;
            }
        });

        //Create the state input controls
        createStateInputControls();

        //JQuery UI styling
        $("#tombioMain").css("display", ""); //Must be made visible before UI created otherwise size styling off
        createUIControls();

        //Get rid of the load spinner
        $("#downloadspin").remove();

        //Set up structures to keep track
        //of matching for each taxon
        setUpMatchingTracking();

        //Initialise size of controls' tab container
        resizeControlsAndTaxa();

        //Initialise chart
        visChanged();
    }

    function enrichStateValueObjects() {
        core.taxa.forEach(function (taxon) {
            core.characters.forEach(function (character) {
                //Set ValueType

                //console.log(character.Character)

                taxon[character.Character].valueType = character.ValueType;
                taxon[character.Character].status = character.Status;
                taxon[character.Character].character = character.Character;

                //Enrich with translated values if they exist. This must account
                //for (m) and (f) suffixes on state values as expressed in the taxa
                //sheet of the KB.
                var splitvalues = taxon[character.Character].value.split("|");
                var translatedValues;
                splitvalues.forEach(function (charValue, iValue) {

                    charValue = charValue.trim();
                    var noSexVal, sex;
                    if (endsWith(charValue, "(m)") || endsWith(charValue, "(f)")) {
                        noSexVal = charValue.substr(0, charValue.length - 4).trim();
                        sex = charValue.substr(charValue.length - 4, 4)

                        //console.log("noSexVal", noSexVal);
                        //console.log("sex", sex);

                    } else {
                        noSexVal = charValue;
                        sex = "";
                    }

                    var translatedValue = translateStateValue(character.Character, noSexVal);
                    if (sex != "") {
                        translatedValue = translatedValue + " " + sex;
                    }
                    if (translatedValues) {
                        translatedValues = translatedValues + " | " + translatedValue;
                    } else {
                        translatedValues = translatedValue;
                    }

                    //If value starts with a hash, it is a comment and to be ignored
                    if (translatedValues.length > 0 && translatedValues.substr(0, 1) == "#") {
                        translatedValues = "";
                    }
                });

                taxon[character.Character].kbValue = translatedValues;
            });
        });
    }

    function addValuesToCharacters() {

        core.values.forEach(function (val) {

            //console.log(val.Character);

            var character = core.oCharacters[val.Character];

            if (character) {
                //If the character state is translated, use the translated value, otherwise
                //use the state value itself.
                if (val.CharacterStateTranslation && val.CharacterStateTranslation != "") {
                    var charState = val.CharacterStateTranslation;
                } else {
                    var charState = val.CharacterState;
                }
                character.CharacterStates.push(
                        {
                            CharacterState: charState,
                            StateHelp: val.StateHelp,
                        }
                    )
                character.CharacterStateValues.push(charState);
            }
        });

        //Now enrich with any text character states specified in the taxa knowledge base
        //that aren't in the values table. These are just added to the array for 
        //each character in the order that they are found. This isn't done for ordinal
        //characters - they *must* be specified on values tab.
        core.characters.forEach(function (character) {
            //if (character.Status == "key" && (character.ValueType == "text" || character.ValueType == "ordinal")) {
            if (character.Status == "key" && (character.ValueType == "text")) {
                core.taxa.forEach(function (taxon) {
                    var allstates = taxon[character.Character].getStates("");
                    allstates.forEach(function (state) {
                        if (state != "") {
                            if (character.CharacterStateValues.indexOf(state) == -1) {
                                character.CharacterStates.push(
                                        {
                                            CharacterState: state,
                                            StateHelp: "",
                                        }
                                    );
                                character.CharacterStateValues.push(state);
                            }
                        }
                    });
                });
            }
        });
    }

    function setUpMatchingTracking() {

        core.taxa.forEach(function (taxon) {

            taxon.matchscore = {};

            core.characters.forEach(function (character) {
                if (character.Status == "key") {
                    taxon.matchscore[character.Character] = {
                        "label": character.Label,
                        "scorena": 0,
                        "scorefor": 0,
                        "scoreagainst": 0,
                        "scoreoverall": 0
                    };
                }
            })
        });
    }

    function createStateInputControls() {
        //Dynamically create the character input widgets

        var chargroup;
        var characters = { "All": [] };
        var states = {};

        core.characters.forEach(function (character) {
            if (character.Status == "key") {

                if (!characters[character.Group]) {
                    characters[character.Group] = [];
                    global.inputCharGroups.push(character.Group);
                }
                characters[character.Group].push(character);
            }
        });

        for (var chargroup in characters) {

            var chargrouplink = "tombioControlTab-" + chargroup.replace(/\s+/g, '-');
            //New link
            var li = $("<li/>")
            var el = $("<a/>").text(chargroup).attr("href", "#" + chargrouplink);
            li.append(el);
            $("#tombioControlsListElements").append(li);

            //New tab
            var tab = $("<div/>").attr("id", chargrouplink);
            $("#tombioControlTabs").append(tab);

            //If this is the 'All' tab, add radio buttons for visibility
            if (chargrouplink == "tombioControlTab-All") {

                tab.append($("<div>").text("Un-used characters:"));
                var radios = $("<fieldset>").css("display", "inline-block").css("padding", "0px").css("border", "none");
                radios.append($("<label>").attr("for", "charvisible").text("show"));
                radios.append($("<input>").attr("type", "radio").attr("name", "charvisibility").attr("id", "charvisible").attr("value", "visible").attr("checked", "checked"));
                radios.append($("<label>").attr("for", "incharvisible").text("hide"));
                radios.append($("<input>").attr("type", "radio").attr("name", "charvisibility").attr("id", "incharvisible").attr("value", "invisible"));
                tab.append(radios);
                $("[name='charvisibility']").checkboxradio({ icon: false });
                radios.on("change", setCloneVisibility);

                //Reset button
                var reset = $("<button>")
                    .attr("id", "tombioReset")
                    .text("Reset all");
                reset.button({ icons: { primary: null, secondary: 'ui-icon-reset' } })
                    .click(function (event) {

                        $(".statespinner").spinner("value", "");

                        //Can't do below below refreshData fails on uninitiased values
                        //so have to use an each loop instead.
                        //$(".stateselect").val("").pqSelect('refreshData');
                        $(".stateselect").each(function () {
                            if ($(this).val()) {
                                $(this).val("").pqSelect('refreshData');
                            }
                        });

                        //Reset stateSet flags
                        core.characters.forEach(function (character) {
                            character.stateSet = false
                        });

                        //colourChart(0);
                        refreshVisualisation();
                        setCloneVisibility();
                    });
                tab.append(reset);
            }

            //New control for each character
            for (var i = 0; i < characters[chargroup].length; i++) {

                var character = characters[chargroup][i];

                //Create the label for the character control
                var characterlabel = $("<div/>").attr("class", "characterlabel").text(character.Label);
                tab.append(characterlabel);

                //Prepare help attrs
                if (character.Help != "") {
                    characterlabel.attr("character", character.Character);
                    characterlabel.addClass("characterhelp");
                }

                //Clone label on All tab. This goes in a div (with the control) so
                //that visibility can be set as a unit.
                var cloneDiv = $("<div/>").attr("class", "cloneInput");
                cloneDiv.append(characterlabel.clone());
                $("#tombioControlTab-All").append(cloneDiv);

                if (character.ValueType == "numeric") {
                    //Numeric control so create a spinner

                    //var spinID = "spin-" + character;
                    var spinID = character.Character;
                    var spinParams = character.Params.split(",");
                    var spinMin = Number(spinParams[0]);
                    var spinMax = Number(spinParams[1]);
                    var spinStep = Number(spinParams[2]);

                    var div = $("<div></div>");
                    var spincontrol = $("<input></input>").attr("class", "spinner").attr("id", spinID);
                    var spinclear = $("<div value='x'>").attr("class", "widget").attr("class", "spinclear").attr("id", spinID + "-clear");
                    div.append(spincontrol)
                    div.append(spinclear);
                    tab.append(div);
                    makeSpinner(spinID, spinMin, spinMax, spinStep);

                    //Clone this to the 'All' tab
                    var div2 = $("<div></div>");
                    var clonespincontrol = $("<input></input>").attr("class", "spinner").attr("id", "clone-" + spinID);
                    var clonespinclear = $("<div value='x'>").attr("class", "widget").attr("class", "spinclear").attr("id", "clone-" + spinID + "-clear");
                    div2.append(clonespincontrol)
                    div2.append(clonespinclear);
                    cloneDiv.append(div2);
                    makeSpinner("clone-" + spinID, spinMin, spinMax, spinStep);

                } else {

                    //var selectID = "select-" + character;
                    var selectID = character.Character;

                    //New character control
                    if (character.ControlType == "multi") {
                        var selectcontrol = $("<select multiple=multiple></select>").attr("class", "characterSelect");
                    } else {
                        var selectcontrol = $("<select></select>").attr("class", "characterSelect");
                    }
                    selectcontrol.attr("id", selectID);
                    tab.append(selectcontrol);

                    //if (character.ControlType == "single" || character.ValueType == "ordinal" || character.ValueType == "ordinalCircular") {
                    if (character.ControlType == "single") {
                        var option = $("<option/>").text("");
                        selectcontrol.append(option);
                    }

                    //Create an option for every possible state.
                    var characterstates = character.CharacterStateValues;

                    //Create an HTML option element corresponding to each state
                    characterstates.forEach(function (state) {

                        var option = $("<option/>").text(global.bullet + state); //"\u058D"
                        selectcontrol.append(option);
                    });
                    makeSelect(selectID);


                    //Clone this to the 'All' tab (inside the clone div)
                    var cloneControl = $("#" + selectID).clone();
                    cloneControl.attr("id", "clone-" + selectID)
                    cloneDiv.append(cloneControl);
                    makeSelect("clone-" + selectID);
                }
            }
            //}
        }

        //If characters are not grouped, hide the group tabs
        if (!global.charactersGrouped) {

            $('#tombioControlsListElements').css("display", "none");
            $('#tombioControlTabs').css("padding-left", "0px");
        }

        //Help handling
        $(".characterhelp")
            .hover(
                function () {
                    // do this on hover
                    $(this).animate({
                        'color': '#D55E00'
                    }, 'fast');
                },
                function () {
                    // do this on hover out
                    $(this).animate({
                        'color': 'black'
                    }, 'fast');
                }
            )
            .click(function () {
                showCharacterHelp($(this).attr("character"));
            });
    }

    function createUIControls() {

        //Context menu
        createContextMenu();

        //Generate and store the visualisation controls (all enclosed in divs).
        global.visualisations = {} //Stores the actual visualisation HTML
        var toolOptions = []; //Drop-down menu options for the visualisations

        //Add clear option
        toolOptions.push('<option value="reload" class="html" data-class="reload">Reload</option>');

        //Add the required visualisation tools
        core.requiredVisTools.forEach(function (tool, iTool) {
            var visObj = new tool.Obj("#tombioTaxa", global.contextMenu, core);

            var selOpt = $('<option class="needsclick">')
                .attr("value", visObj.visName)
                .attr("data-class", "vis")
                .addClass("visualisation")
                .text(visObj.metadata.title);

            //If a selectedTool has been specified as a query parameter then select it,
            //otherwise look to see if one is specified in the knowlege base.
            var paramSelectedTool = getURLParameter("selectedTool");
            if (paramSelectedTool && visObj.visName == paramSelectedTool) {
                selOpt.attr("selected", "selected");
            } else if (!paramSelectedTool && core.kbconfig.selectedTool && visObj.visName == core.kbconfig.selectedTool) {
                selOpt.attr("selected", "selected");
            } else if (!core.kbconfig.selectedTool && iTool == 0) {
                selOpt.attr("selected", "selected");
            }
            toolOptions.push(selOpt);

            global.visualisations[visObj.visName] = visObj;
        })
        //Add the various info tools
        toolOptions.push('<option id="optCurrentVisInfo" value="currentVisInfo" class="html" data-class="info"></option>');
        toolOptions.push('<option value="kbInfo" class="html" data-class="info">About the Knowledge-base</option>');
        toolOptions.push('<option value="visInfo" class="html" data-class="info">About Tom.bio ID Visualisations</option>');
        toolOptions.push('<option value="tombioCitation" class="html" data-class="info">Get citation text</option>');

        $("#tombioVisualisation").append(toolOptions);

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
        $("#tombioVisualisation")
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
                  visChanged();
              }
              //width: "100%"
          })
          .iconselectmenu("menuWidget")
            .addClass("ui-menu-icons customicons");

        var tabs = $("#tombioControlTabs").tabs({
            activate: function (event, ui) {
                //Need this as a workaround. When reset button is used and refreshData
                //method used to clear selections, for some reason the width of the controls
                //is changed on invisible tabs. So when tab is selected, need this refresh
                //method to set the width of the controls correctly.
                $(".stateselect").each(function () {
                    //$(this).pqSelect('refresh');
                });
                resizeControlsAndTaxa();
            }
        });

        //Select default tab
        if (core.kbconfig.defaultControlGroup && core.kbconfig.defaultControlGroup != "") {
            var tabIndex = global.inputCharGroups.indexOf(core.kbconfig.defaultControlGroup);
            if (tabIndex > -1) {
                tabs.tabs("option", "active", tabIndex + 1)
            }
        }

        $('#tombioInfotoggle')
          .button({
              icons: { primary: null, secondary: 'ui-icon-info20' }
          })
          .click(function (event) {
              $("#tombioInfoDialog").dialog("open");
          });

        $("#tombioHelpAndInfoDialog").dialog({
            modal: false,
            width: global.helpAndInfoDialogWidth,
            height: global.helpAndInfoDialogHeight,
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

        $("#tombioVisInfoDialog").dialog({
            modal: false,
            width: global.visInfoDialogWidth,
            height: global.visInfoDialogHeight,
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


        $('#tombioOptions')
            .button({ icons: { primary: null, secondary: 'ui-icon-options' }, disabled: false })
            .click(function (event) {
            });

        //Context menu
        global.visWithInput = [];

        for (name in global.visualisations) {
            if (global.visualisations[name].charStateInput)
                global.visWithInput.push(name);
        };

        global.contextMenu.addItem("Toggle key input visibility", function () {
            controlsShowHide();
        }, global.visWithInput);
    }

    function helpFileLoaded(helpFileArray) {

        var allHelpFilesLoaded = true;
        var help = "";

        helpFileArray.forEach(function (helpFile) {
            if (helpFile) {
                help += helpFile;
            } else {
                allHelpFilesLoaded = false;
            }
        });
        if (allHelpFilesLoaded) {
            help = help.replace(/##tombiopath##/g, tombiopath).replace(/##tombiokbpath##/g, tombiokbpath);
            $('#currentVisInfo').html(help);
        }
    }

    function createCitationPage() {

        var html = $("<div>"), t;

        //Generate the citation for the core software
        html.append($("<h3>").text("Citation for general framework (core software)"))
        t = "This is the reference you can use for the main Tom.bio Framework - in other words the core software.";
        t += " The core version number is updated whenever there is a new major release of the core software.";
        html.append($("<p>").html(t));
        html.append($("<input style='position: relative; top: 0.2em' checked='checked' type='checkbox' name='tbCitationCore' id='tbCitationCore'>"));
        html.append($("<span>").text("Copy citation"));
        html.append($("<b>").html(getCitation(core.metadata, "Software")));

        //Generate the citation for the current tool
        html.append($("<h3>").text("Citation for last selected visualisation tool"))
        t = "This is the reference you can use for the last selected visualisation tool.";
        t += " The tool version number is updated whenever there is a new release of the tool.";
        t += " If you cite a tool, there's no need to cite the core software separately since it is implicit.";
        html.append($("<p>").html(t));
        html.append($("<input style='position: relative; top: 0.2em' type='checkbox' name='tbCitationVis' id='tbCitationVis'>"));
        html.append($("<span>").text("Copy citation"));
        html.append($("<b>").html(getCitation(global.lastVisualisation.metadata, "Software", core.metadata.title)));

        //Generate the citation for the knowledge-base
        html.append($("<h3>").text("Citation for knowledge-base"))
        t = "This is the reference you can use for the knowledge-base currently driving the software.";
        t += " The knowledge-base version number is updated whenever there is a new release of the knowledge-base.";
        html.append($("<p>").html(t));
        html.append($("<input style='position: relative; top: 0.2em' checked='checked' type='checkbox' name='tbCitationKb' id='tbCitationKb'>"));
        html.append($("<span>").text("Copy citation"));
        html.append($("<b>").html(getCitation(core.kbmetadata, "Knowledge-base", core.metadata.title)));


        var button = $("<button>Copy citations</button>").button();
        button.on("click", function () {
            $("#tbSelectedCitations").html("");//Clear

            if (document.getElementById('tbCitationCore').checked) {
                $("#tbSelectedCitations").append(getCitation(core.metadata, "Software"));
            }
            if (document.getElementById('tbCitationVis').checked) {
                $("#tbSelectedCitations").append(getCitation(global.lastVisualisation.metadata, "Software", core.metadata.title));
            }
            if (document.getElementById('tbCitationKb').checked) {
                $("#tbSelectedCitations").append(getCitation(core.kbmetadata, "Knowledge-base", core.metadata.title));
            }
            selectElementText(document.getElementById("tbSelectedCitations"));
            $('#tbCitationInstructions').show();

        });

        html.append($("<p>").append(button).append("&nbsp;The selected citations will appear together below - just copy and paste"));
        html.append($("<div id='tbSelectedCitations'>"));
        html.append($("<p id='tbCitationInstructions' style='display: none'>").text("You can now copy and paste the selected citation text."));

        return html;
    }

    function selectElementText(el, win) {
        win = win || window;
        var doc = win.document, sel, range;
        if (win.getSelection && doc.createRange) {
            sel = win.getSelection();
            range = doc.createRange();
            range.selectNodeContents(el);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (doc.body.createTextRange) {
            range = doc.body.createTextRange();
            range.moveToElementText(el);
            range.select();
        }
    }

    function copyToClipboard(text) {
        window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
    }

    function getCitation(metadata, sType, coreTitle) {

        var html = $("<div class='tombioCitation'>"), t;
        var d = new Date();

        t = metadata.authors + " ";
        t += "(" + metadata.year + ") ";
        t += "<i>" + metadata.title + "</i>";
        t += " (Version " + metadata.version + ") [" + sType + "]";
        if (coreTitle) {
            t += " (for " + coreTitle + ")";
        }
        t += ". ";
        if (metadata.publisher) {
            t += metadata.publisher + ". ";
        }
        if (metadata.location) {
            t += metadata.location + ". ";
        }
        t += "Accessed " + d.toDateString() + ". ";
        t += $(location).attr('href');

        html.append($("<p>").html(t));
        return html;
    }

    function visChanged() {
        var selectedToolName = $("#tombioVisualisation").val();

        //If reload selected, then
        if (selectedToolName == "reload") {
            //Force reload of entire page - ignoring cache.
            window.location.reload(true);
        }

        //Get the selected visualisation
        var selectedTool = global.visualisations[selectedToolName];

        //If the user has selected to show citation then generate.
        if (selectedToolName == "tombioCitation") {
            $('#tombioCitation').html(createCitationPage());
        }

        //If the user has selected to show kb info and not yet loaded,
        //then load.
        if (selectedToolName == "kbInfo" && $('#kbInfo').html().length == 0) {
            var title = $('<h2>').text(core.kbmetadata['title']);
            $('#kbInfo').html(title);
            $.get(tombiokbpath + "info.html", function (html) {
                $('#kbInfo').append(html.replace(/##tombiopath##/g, tombiopath).replace(/##tombiokbpath##/g, tombiokbpath));
            }).always(function () {
                //Citation
                var citation = $('<h3>').attr("id", "tombioKbCitation").text("Citation");
                $('#kbInfo').append(citation);
                $('#kbInfo').append(getCitation(core.kbmetadata, "Knowledge-base", core.metadata.title));
                //Add the revision history
                var header = $('<h3>').attr("id", "tombioKbRevisionHistory").text("Knowledge-base revision history");
                $('#kbInfo').append(header);
                var currentVersion = $('<p>').html('<b>Current version: ' + core.kbmetadata['version'] + '</b>');
                $('#kbInfo').append(currentVersion);

                var table = $('<table>');
                var tr = $('<tr>')
                    .css('background-color', 'black')
                    .css('color', 'white');
                tr.append($('<td>').text('Date').css('padding', '3px'));
                tr.append($('<td>').text('Version').css('padding', '3px'));
                tr.append($('<td>').text('Notes').css('padding', '3px'));
                table.append(tr);

                core.kbreleaseHistory.forEach(function (version, iRow) {
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
            $.get(tombiopath + "visInfo.html", function (html) {
                $('#visInfo').html(html.replace(/##tombiopath##/g, tombiopath).replace(/##tombiokbpath##/g, tombiokbpath));
            });
        }

        //If the user has selected to show info for current visualisation and not yet loaded,
        //then load.
        if (selectedToolName == "currentVisInfo") {

            //Dimension and empty array to accommodate all the help
            //files referenced by this object.
            var helpFiles = new Array(global.lastVisualisation.helpFiles.length);

            global.lastVisualisation.helpFiles.forEach(function (helpFile, i) {

                //Load each of the help files and call the helpFileLoaded function
                //upon loading of each one. This function will only do it's thing
                //once all the files are loaded. This is important because the 
                //JQuery get methods works asynchronously, so we cannot predict the
                //when the loading is done.
                $.get(helpFile, function (html) {
                    helpFiles[i] = html;
                    helpFileLoaded(helpFiles);
                });
            });
        }

        //if (selectedTool && selectedTool.helpFiles && selectedTool.helpFiles.length > 0) {
        //    //Show/flash the vis help button
        //    $('#visHelp').fadeIn().effect("highlight", {}, 3000);
        //} else {
        //    //hide the vis help button
        //    $('#visHelp').fadeOut();
        //}

        //Change tool if necessary 
        if (selectedToolName != global.currentTool) {

            if (global.currentTool)
                $("#" + global.currentTool).hide();

            $("#" + selectedToolName).show();
        }

        //Show hide the key input controls and relevant context menu items
        if (selectedTool && selectedTool.charStateInput) {
            controlsShowHide(true);
        } else {
            controlsShowHide(false);
        }

        //Refresh the selected tool
        refreshVisualisation();

        //Store current tool
        global.currentTool = selectedToolName;

        //Store the last used visualisation and change the name of the menu
        //item for getting info about it.
        if (Object.keys(global.visualisations).indexOf(selectedToolName) > -1) {

            global.lastVisualisation = global.visualisations[selectedToolName];
            $("#optCurrentVisInfo").text("Using the " + global.lastVisualisation.metadata.title);
            $("#tombioVisualisation").iconselectmenu("refresh");
        }

        //Refresh context menu
        global.contextMenu.contextChanged(selectedToolName);

    }

    function controlsShowHide(show) {

        var display;
        if (show != undefined) {
            display = show;
        } else {
            //Toggle
            display = !($("#tombioControls").is(":visible"));
        }
        if (display) {
            $("#tombioControls").show(500, resizeControlsAndTaxa);
        } else {
            global.controlsWidth = $("#tombioControls").width();
            $("#tombioControls").hide(500, resizeControlsAndTaxa);
        }
    }

    function refreshVisualisation() {

        //Score the taxa
        scoreTaxa();

        //Refresh the relevant visualisation
        var selectedTool = $("#tombioVisualisation").val();
        if (selectedTool in global.visualisations) {
            global.visualisations[selectedTool].refresh();
        }
        resizeControlsAndTaxa();
    }

    function setCloneVisibility() {

        var visibility = $("input[name=charvisibility]:checked").val();

        $(".cloneInput .stateselect, .cloneInput .statespinner").each(function (index) {

            //For a reason I haven't got to the bottom of, this each statement returns
            //the clones (as expected) plus another set with undefined IDs. So we need to ignore these.

            var stateselectID = $(this).attr('id'); //Same as character name (column header in KB)

            if (typeof (stateselectID) != "undefined") {

                if (visibility == "visible") {

                    $(this).parents(".cloneInput").show(500, resizeControlsAndTaxa);
                } else {

                    var stateval = $(this).val();
                    //console..log("val: " + stateval);
                    if (stateval && stateval != "") {
                        //Single selects return single value, multi-selects comma separated string of values.
                        $(this).parents(".cloneInput").show(500, resizeControlsAndTaxa);
                    } else {
                        $(this).parents(".cloneInput").hide(500, resizeControlsAndTaxa);
                    }
                }
            }
        });

        //console..log("Controls height: " + );
    }

    function resizeControlsAndTaxa() {

        //console.log("resize")
        //Because we want to prevent normal flow where tombioTaxa div would be moved
        //under tombioControls div, we set a min width of their parent div to accommodate
        //them both.
        if ($("#tombioControls").is(":visible")) {
            var controlsWidth = $('#tombioControls').width();
            $('#tombioControlsAndTaxa').css("min-width", controlsWidth + $('#tombioTaxa').width() + 50);
        } else {
            //var controlsWidth = 0;
            $('#tombioControlsAndTaxa').css("min-width", "0px");
        }
        //$('#tombioControlsAndTaxa').css("min-width", controlsWidth + $('#tombioTaxa').width() + 50);

        //console.log(controlsWidth, $('#tombioTaxa').width())
    };

    function makeSelect(id) {

        //initialize the pqSelect widgets
        var select = $("#" + id).pqSelect({
            multiplePlaceholder: 'select option(s)',
            singlePlaceholder: 'select option',
            checkbox: true, //adds checkbox to options    
            search: false,
            maxDisplay: 20,
            width: 240,
            selectallText: ''
        });

        select.addClass("stateselect");
        select.on("change", function () {

            //select and it's clone must match
            if (id.substring(0, 6) == "clone-") {
                var counterpartID = id.substring(6);
            } else {
                var counterpartID = "clone-" + id;
            };
            $("#" + counterpartID).val(select.val());
            $("#" + counterpartID).pqSelect('refreshData');

            $("#" + id).pqSelect('refresh'); //This causes the drop-down list to be removed on each select
            setCloneVisibility();

            //Set state set flag
            if (id.substring(0, 6) == "clone-") {
                var character = id.substring(6);
            } else {
                var character = id;
            }
            core.oCharacters[character].stateSet = (select.val() != null && select.val() != "");

            //console..log("change>>" + select.val() + "<<");
            //console..log("stateSet>>" + (select.val() != null && select.val() != "") + "<<");

            refreshVisualisation();
        });

        //Next is a workaround to set a value for each select control and then clear it.
        //This is necessary because on first selection, for some reason, the control width
        //increases by a few pixels - looks ugly. So we make sure this is done for all
        //controls up front.
        select.val($("#" + id + " option:first").val()).pqSelect('refreshData');
        select.val("").pqSelect('refreshData');
    }

    function makeSpinner(id, min, max, step) {

        var spinner = $("#" + id).spinner({
            min: min,
            max: max,
            step: step
        });
        spinner.addClass("statespinner");

        //spinner.on("spinchange", function () {

        //    //Set state set flag
        //    if (id.substring(0, 6) == "clone-") {
        //        var character = id.substring(6);
        //    } else {
        //        var character = id;
        //    }
        //    core.oCharacters[character].stateSet = true;
        //    refreshVisualisation();
        //    setCloneVisibility();
        //});

        spinner.on("spinstop", function (event, ui) {

            //select and it's clone must match
            if (id.substring(0, 6) == "clone-") {
                var isClone = true;
                var counterpartID = id.substring(6);
            } else {
                var isClone = false;
                var counterpartID = "clone-" + id;
            };
            $("#" + counterpartID).spinner("value", spinner.spinner("value"));

            //Set state set flag
            if (id.substring(0, 6) == "clone-") {
                var character = id.substring(6);
            } else {
                var character = id;
            }
            core.oCharacters[character].stateSet = true;

            //if (!isClone) {
            //Update the taxon representation.
            refreshVisualisation();
            setCloneVisibility();
            //}
        });

        //spinner.on("spin", function (event, ui) {
        //    if (ui.value == spinner.spinner('option', 'min')) {
        //        //When spinner goes to min value, blank it.
        //        spinner.spinner("value", "");
        //        return false;
        //    }
        //});

        var button = $("#" + id + "-clear").button({
            icon: "ui-icon-close",
            showLabel: false
        });
        button.on("click", function () {
            spinner.spinner("value", "");

            //select and it's clone must match
            if (id.substring(0, 6) == "clone-") {
                var isClone = true;
                var counterpartID = id.substring(6);
            } else {
                var isClone = false;
                var counterpartID = "clone-" + id;
            };
            $("#" + counterpartID).spinner("value", spinner.spinner("value"));

            //Reset state set flag
            if (id.substring(0, 6) == "clone-") {
                var character = id.substring(6);
            } else {
                var character = id;
            }
            core.oCharacters[character].stateSet = false;

            refreshVisualisation();
        });
    }

    function getSelectStates(selectedValues) {

        var cleanedValues = [];

        String(selectedValues).split(",").forEach(function (selValue) {
            //Remove the first character and any leading/trailing spaces
            var cleanValue = String(selValue).trim();
            if (cleanValue != "") {
                cleanedValues.push(cleanValue);
            }
        });
        return cleanedValues;
    }

    function getStatesFromOptions(optionTags) {

        var states = [];

        for (var i = 0; i < optionTags.length; i++) {

            states.push($(optionTags[i]).text());
        }
        return states;
    }

    function translateStateValue(character, state) {

        function translateValue(character, state) {
            var stateValues = core.values.filter(function (valueObj) {
                if (valueObj.Character == character && valueObj.CharacterState.trim() == state) {
                    return true;
                } else {
                    return false;
                }
            });
            if (stateValues[0] && stateValues[0].CharacterStateTranslation && stateValues[0].CharacterStateTranslation != "") {
                var translatedState = stateValues[0].CharacterStateTranslation;
            } else {
                var translatedState = state;
            }
            //Replace any multiple spaces with single spaces. I think that this needs to be done for where double spaces
            //have been inserted into text state values or translated values because the pqselect control does the same.
            //Fixes https://github.com/burkmarr/tombiovis/issues/8
            translatedState = translatedState.replace(/ +(?= )/g, '');

            return translatedState;
        }
        //For ordinal characters, the state could be an ordinal range, e.g. [vali-valj]
        var regexOrdinalRange = /^\[[^-]+-[^-]+\]$/;
        if (regexOrdinalRange.test(state)) {
            var states = [];
            var r1 = state.substr(1, state.length - 2);
            var r2 = r1.split('-');
            return "[" + translateValue(character, r2[0]) + "-" + translateValue(character, r2[1]) + "]";
        } else {
            return translateValue(character, state);
        }
    }

    function endsWith(str, suffix) {
        //Don't want to use the built-in string method because only supported by
        //very recent browsers.
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    function showCharacterHelp(character) {

        //Clear existing HTML
        $("#tombioHelpAndInfoDialog").html("");

        //Header for character
        $('<h3/>', { text: core.oCharacters[character].Label }).appendTo('#tombioHelpAndInfoDialog');

        //Help text for character
        $('<p/>', { html: core.oCharacters[character].Help }).appendTo('#tombioHelpAndInfoDialog');

        //Help images for character (not necessarily illustrating particular states)
        var charImages = core.media.filter(function (m) {
            //Only return images for matching character if no state value is set
            if (m.Type == "image-local" && m.Character == character && !m.State) return true;
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });

        charImages.forEach(function (charState) {
            var fig = $('<figure/>').appendTo('#tombioHelpAndInfoDialog');
            var img = $('<img/>', { src: charState.URI })
            var cap = $('<figcaption/>', { html: charState.Caption });
            fig.append(img).append(cap);
            if (charState.ImageWidth) {
                img.css("width", charState.ImageWidth);
            }
        });

        //Help text character states
        var charText = core.values.filter(function (v) {
            if (v.Character == character && v.StateHelp) return true;
        });

        charText.forEach(function (charState) {

            if (charState.CharacterStateTranslation && charState.CharacterStateTranslation != "") {
                var charStateText = charState.CharacterStateTranslation;
            } else {
                var charStateText = charState.CharacterState;
            }
            var para = $('<p/>').appendTo('#tombioHelpAndInfoDialog');
            var spanState = $('<span/>', { text: charStateText + ": " }).css("font-weight", "Bold");
            para.append(spanState);
            var spanHelp = $('<span/>', { html: charState.StateHelp }).css("font-weight", "Normal");
            para.append(spanHelp);

            //Help images for character states
            var charImages = core.media.filter(function (m) {
                //Only return images for matching character if no state value is set
                if (m.Type == "image-local" && m.Character == character && m.State == charState.CharacterState) return true;
            }).sort(function (a, b) {
                return Number(a.Priority) - Number(b.Priority)
            });

            charImages.forEach(function (charState) {
                var fig = $('<figure/>').appendTo('#tombioHelpAndInfoDialog');
                var img = $('<img/>', { src: charState.URI })
                var cap = $('<figcaption/>', { html: charState.Caption });
                fig.append(img).append(cap);
                if (charState.ImageWidth) {
                    img.css("width", charState.ImageWidth);
                }
            });
        });

        //Display the help dialog
        $("#tombioHelpAndInfoDialog").dialog('option', 'title', 'Character help and information');
        $("#tombioHelpAndInfoDialog").dialog("open");
    }

    function createContextMenu() {

        //Create the context menu object and store globally.
        global.contextMenu = {};

        //Add a property which is an object which links to each item
        //in the menu. 
        global.contextMenu.items = {};
        //Add a property which is an object which stores the
        //contexts (visualisations) valid for each item.
        global.contextMenu.contexts = {};

        //Initialise the ul element which will form basis of menu
        global.contextMenu.menu = $("<ul>").css("white-space", "nowrap").appendTo('#tombioMain')
            .addClass("contextMenu")
            .css("position", "absolute")
            .css("display", "none")
            .css("z-index", 999999);
        //.append($('<li>').text("menu test"))

        //Make it into a jQuery menu
        global.contextMenu.menu.menu();

        //Handle the invocation of the menu
        $("#tombioMain").on("contextmenu", function (event) {

            global.contextMenu.menu.position({
                //This will not work for the first click for
                //some reason - subsequent clicks okay
                //my: "top left",
                //of: event
            });

            //Alternative method
            var parentOffset = $(this).parent().offset();
            var relX = event.pageX - parentOffset.left;
            var relY = event.pageY - parentOffset.top;
            global.contextMenu.menu.css({ left: relX, top: relY });

            global.contextMenu.menu.show();

            return false; //Cancel default context menu
        })

        //Handle removal of the menu
        $("#tombioMain").on("click", function () {
            global.contextMenu.menu.hide();
        });

        //Add method to add an item
        global.contextMenu.addItem = function (label, f, contexts) {

            //Add item if it does not already exist
            if (!(label in global.contextMenu.items)) {

                var item = $("<li>").append($("<div>").text(label).click(f));
                global.contextMenu.menu.append(item);
                global.contextMenu.menu.menu("refresh");
                global.contextMenu.items[label] = item;
                global.contextMenu.contexts[label] = contexts;
            }
        }

        //Add method to remove an item
        global.contextMenu.removeItem = function (label) {
            if (label in global.contextMenu.items) {
                global.contextMenu.items[label].remove();
                delete global.contextMenu.items[label];
                delete global.contextMenu.contexts[label];
            }
        }

        //Add method to signal that the context has changed
        global.contextMenu.contextChanged = function (context) {

            //Go through each item in context menu and hide it if 
            //not valid for this context.
            for (var label in global.contextMenu.items) {

                if (global.contextMenu.contexts[label].indexOf(context) > -1) {
                    global.contextMenu.items[label].show();
                    //console.log("show menu item")
                } else {
                    global.contextMenu.items[label].hide();
                    //console.log("hide menu item", label)
                }
            }
        }
    }

    function scoreTaxa() {

        //Set variable to indicate whether or not sex has been indicated.
        var sex = $("#Sex").val();

        //Update data array to reflect whether or not each taxa meets
        //the criteria specified by user.
        core.taxa.forEach(function (taxon) {
            //taxon is an object representing the row from the KB
            //corresponding to a taxon.

            taxon.scorefor = 0;
            taxon.scoreagainst = 0;
            taxon.scoreoverall = 0;
            taxon.charcount = 0;

            //Loop through all state spinner controls and update matchscores
            $(".statespinner").each(function () {

                var statespinnerID = $(this).attr('id'); //Same as character name (column header in KB)
                //console..log("statespinnerID: " + statespinnerID);
                if (statespinnerID.substring(0, 6) != "clone-") { //Ignore cloned state controls

                    var scorefor, scoreagainst, charused, scorena;
                    if ($(this).val() == "") {
                        //No value specified
                        charused = 0;
                        scorena = 0;
                        scorefor = 0;
                        scoreagainst = 0;
                    } else if (taxon[statespinnerID] == "") {
                        //No knowledge base value for a numeric character is taken to represent
                        //missing data and is therefore neutral.
                        charused = 0;
                        scorena = 0;
                        scorefor = 0;
                        scoreagainst = 0;
                    } else if (taxon[statespinnerID] == "n/a") {
                        //Scorena for a specified numeric value that is not applicable is 1
                        charused = 1;
                        scorena = 1;
                        scorefor = 0;
                        scoreagainst = 0;
                    } else {
                        var stateval = Number($(this).val());
                        var rng = taxon[statespinnerID].getRange();
                        var kbStrictness = Number(core.oCharacters[statespinnerID].Strictness);
                        var wholeRange = core.oCharacters[statespinnerID].maxVal - core.oCharacters[statespinnerID].minVal;
                        var score = tombioScore.numberVsRange(stateval, rng, wholeRange, kbStrictness);
                        scorefor = score[0];
                        scoreagainst = score[1];
                        charused = 1;
                        scorena = 0;
                    }

                    //Record scores for character for taxon (unweighted)
                    taxon.matchscore[statespinnerID].scorena = scorena;
                    taxon.matchscore[statespinnerID].scorefor = scorefor;
                    taxon.matchscore[statespinnerID].scoreagainst = scoreagainst;
                    taxon.matchscore[statespinnerID].scoreoverall = scorefor - scoreagainst - scorena;

                    //Update overall score for taxon (adjusted for character weight)
                    var weight = Number(core.oCharacters[statespinnerID].Weight) / 10;

                    taxon.scorefor += scorefor * weight;
                    taxon.scoreagainst += scoreagainst * weight;
                    taxon.scoreagainst += scorena * weight;
                    taxon.scoreoverall += (scorefor - scoreagainst - scorena) * weight;

                    taxon.charcount += charused;
                }
            });

            //Loop through all state select controls and update matchscores
            $(".stateselect").each(function () {

                var scorefor = 0;
                var scoreagainst = 0;
                var scorena = 0;
                var charused = 0;

                var stateselectID = $(this).attr('id'); //Same as character name (column header in KB)

                //For a reason I haven't got to the bottom of, this each statement returns
                //the select controls, plus their clones (as expected) plus another set (equal in
                //size to each of the first two) with undefined IDs. So we need to ignore these.
                if (typeof (stateselectID) != "undefined"
                    && stateselectID.substring(0, 6) != "clone-"
                    && $(this).val() != null
                    && $(this).val() != "") {

                    if (core.oCharacters[stateselectID].ValueType == "ordinal" || core.oCharacters[stateselectID].ValueType == "ordinalCircular") {
                        //Ordinal scoring
                        var kbStrictness = Number(core.oCharacters[stateselectID].Strictness);

                        var selState = $(this).val();
                        //console..log(stateselectID + " " + selState);
                        var selectedStates = [];

                        if (taxon[stateselectID] == "n/a") {

                            //States selected but not applicable for taxon
                            scorena = 1;
                            charused = 1;
                            //Adjust for strictness
                            //scorena = scorena * (kbStrictness / 10);
                        } else {                         
                            if (core.oCharacters[stateselectID].ControlType == "single") {

                                //Selected value for a single select control is a simple string value
                                if ($(this).val() != "") {
                                    selectedStates.push($(this).val());
                                }
                            } else {
                                //Selected values for multi select control is an array of string values
                                if ($(this).val() == null) {
                                    selectedStates = [];
                                } else {
                                    selectedStates = $(this).val();
                                }
                            }

                            if (selectedStates.length > 0) {

                                var posStates = core.oCharacters[stateselectID].CharacterStateValues;
                                //The KB states for this character and taxon.
                                //States that are specific to male or female are represented by suffixes of (m) and (f).
                                //var kbTaxonStates = taxon[stateselectID].getStates(sex);
                                var kbTaxonStates = taxon[stateselectID].getOrdinalRanges(sex);

                                //var score = tombioScore.ordinal(selState, kbTaxonStates, posStates, kbStrictness);
                                console.log(taxon.Taxon.toString())
                                var isCircular = core.oCharacters[stateselectID].ValueType == "ordinalCircular";
                                var score = tombioScore.ordinal2(selectedStates, kbTaxonStates, posStates, kbStrictness, isCircular);
                                scorefor = score[0];
                                scoreagainst = score[1];
                                charused = 1;
                            }
                        }
                    } else {
                        //It's a non-ordinal character.
                        //Get the states selected in the control.
                        var selectedStates = [];

                        if (taxon[stateselectID] == "n/a") {
                            //States selected but not applicable for taxon
                            scorena = 1;
                            charused = 1;
                        } else {
                            if (core.oCharacters[stateselectID].ControlType == "single") {

                                //Selected value for a single select control is a simple string value
                                if ($(this).val() != "") {
                                    selectedStates.push($(this).val());
                                }
                            } else {
                                //Selected values for multi select control is an array of string values
                                if ($(this).val() == null) {
                                    selectedStates = [];
                                } else {
                                    selectedStates = $(this).val();
                                }
                            }

                            if (selectedStates.length > 0) {
                                //The KB states for this character and taxon.
                                //States that are specific to male or female are represented by suffixes of (m) and (f).
                                var kbTaxonStates = taxon[stateselectID].getStates(sex);

                                var score = tombioScore.character(selectedStates, kbTaxonStates);
                                scorefor = score[0];
                                scoreagainst = score[1];
                                charused = 1;
                            }
                        }
                    }

                    //Record scores for character for taxon (unweighted)
                    taxon.matchscore[stateselectID].scorena = scorena;
                    taxon.matchscore[stateselectID].scorefor = scorefor;
                    taxon.matchscore[stateselectID].scoreagainst = scoreagainst;
                    taxon.matchscore[stateselectID].scoreoverall = scorefor - scoreagainst - scorena;

                    //Update overall score for taxon (adjusted for character weight)
                    var weight = Number(core.oCharacters[stateselectID].Weight) / 10;

                    taxon.scoreagainst += scorena * weight;
                    taxon.scorefor += scorefor * weight;
                    taxon.scoreagainst += scoreagainst * weight;
                    taxon.scoreoverall += (scorefor - scoreagainst - scorena) * weight;

                    taxon.charcount += charused;
                }
            });
        });
    }

    function debug() {
        if (global.debug) {
            console.log.apply(console, arguments);
        }
    }

    function getURLParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
        return null;
    }

    //Define StateValue object
    var StateValue = function (value) {
        this.kbValue = value.trim();
        this.valueType = null;
        this.status = null;
        this.character = null;
    }
    Object.defineProperty(StateValue.prototype, "value", {
        get: function () {
            if (this.kbValue.trim() == "?") {
                return "";
            } else {
                return this.kbValue.trim();
            }
        }
    });
    StateValue.prototype.toString = function () {
        if (this.kbValue == "?") {
            return "";
        } else {
            return this.kbValue;
        }
    }
    StateValue.prototype.getStates = function (sex) {

        if (!sex) sex = "";

        var states = [];
        var splitvalues = this.kbValue.split("|");

        for (var i = 0; i < splitvalues.length; i++) {
            //Only those relevant to the sex, if specified, are returned.
            //Suffixes representing sex are trimmed off.
            var state = splitvalues[i];
            state = state.trim();

            if (state != "n/a" && state != "?" && state != "") {
                if (sex == "male" && !endsWith(state, "(f)")) {
                    states.push(state.replace("(m)", "").trim());
                } else if (sex == "female" && !endsWith(state, "(m)")) {
                    states.push(state.replace("(f)", "").trim());
                } else if (sex == "") {
                    states.push(state.replace("(m)", "").replace("(f)", "").trim());
                } else {
                    //No match
                }
            }
        }

        return states;
    }
    StateValue.prototype.getRange = function () {
        var retVal = {}

        if (String(this.kbValue) == "") {
            retVal.hasValue = false;
        } else {
            retVal.hasValue = true;
        }
        if (String(this.kbValue).indexOf('[') == 0) {
            //This is a range
            var r1 = this.kbValue.substr(1, this.kbValue.length - 2);
            var r2 = r1.split('-');
            retVal.min = Number(r2[0]);
            retVal.max = Number(r2[1]);
            retVal.mid = retVal.min + ((retVal.max - retVal.min) / 2);
        } else {
            retVal.min = Number(this.kbValue);
            retVal.max = Number(this.kbValue);
            retVal.mid = Number(this.kbValue);
        }
        return retVal;
    }
    StateValue.prototype.getOrdinalRanges = function (sex) {
        var _this = this;
        var retVal = [];
        if (this.valueType == "ordinal" || this.valueType == "ordinalCircular") {
            this.getStates(sex).forEach(function (state) {
                var ordinalRange = [];
                if (state.indexOf('[') == 0) {
                    //This is an ordinal range
                    var r1 = state.substr(1, state.length - 2);
                    var r2 = r1.split('-');
                    var lowerState = r2[0];
                    var upperState = r2[1];
                    var inRange = false;
                    core.oCharacters[_this.character].CharacterStateValues.forEach(function (ordinalState) {
                        //console.log("ordinalState", ordinalState)
                        if (ordinalState == lowerState) inRange = true;
                        if (inRange) ordinalRange.push(ordinalState);
                        if (ordinalState == upperState) inRange = false;
                    });
                    //If this is a circular ordinal the end point of and ordinal range can come before the
                    //start point, so we could reach this point with inRange still set to true, in which
                    //case we need to go through the range again.
                    if (inRange) {
                        core.oCharacters[_this.character].CharacterStateValues.forEach(function (ordinalState) {
                            if (inRange) ordinalRange.push(ordinalState);
                            if (ordinalState == upperState) inRange = false;
                        });
                    }
                } else {
                    ordinalRange.push(state);
                }
                retVal.push(ordinalRange)
            });
        }
        return retVal;
    }
    StateValue.prototype.toHtml1 = function () {
        //Used, for example, by tombiovis.js to display KB values 
        //for a taxon to a user.
        if (this.kbValue == "n/a") {
            return "<i>not applicable</i>";
        } else if (this.kbValue == "" || this.kbValue == "?") {
            return "<i>no value specified</i>"
        } else if (this.valueType == "text" || this.valueType == "ordinal" || this.valueType == "ordinalCircular") {
            //Put bold around each token (separated by |)
            html = this.kbValue.replace(/([^|]+)/g, "<b>$1</b>");
            //Shift bold end tag to before (m) and (f) and replace with (male) and (female)
            html = html.replace(/(\(m\)\s*<\/b>)/g, "</b> (male)");
            html = html.replace(/(\(f\)\s*<\/b>)/g, "</b> (female)");
            //Remove start [ and end ] tokens denoting ordinal range 
            html = html.replace(/<b>\s*\[/g, "<b>");
            html = html.replace(/\]\s*<\/b>/g, "</b>");
            //Replace | with 'or'
            html = html.replace(/\s*\|\s*/g, " or ");
            //Remove emboldening if display-only character
            if (this.status == "display") {
                html = html.replace(/<b>/g, '').replace(/<\/b>/g, '');
            }
            return html;
        } else if (this.valueType == "numeric") {
            var rng = this.getRange();
            if (rng.hasValue == false) {
                var html = "<b>no value in knowledge-base</b>";
            } else if (rng.min == rng.max) {
                var html = "<b>" + rng.min + "</b>";
            } else {
                var html = "<b>" + rng.min + "-" + rng.max + "</b> (range)";
            }
            //Remove emboldening if display-only character
            if (this.status == "display") {
                html = html.replace(/<b>/g, '').replace(/<\/b>/g, '');
            }
            return html;
        } else {
            return this.kbValue;
        }
    }
    StateValue.prototype.toHtml2 = function () {
        //Used, for example, to show character score details for single-column key.
        if (this.kbValue == "n/a") {
            return "<li><i>not applicable</i></li>";
        } else if (this.valueType == "text" || this.valueType == "ordinal" || this.valueType == "ordinalCircular") {
            var html = "";
            var splitKbValues = this.kbValue.split("|");

            for (var i = 0; i < splitKbValues.length; i++) {

                var charVal = splitKbValues[i].trim();

                if (/\(m\)$/.test(charVal)) {
                    charVal = "<b>" + charVal.replace(/\(m\)$/, "</b> (male)");
                } else if (/\(f\)$/.test(charVal)) {
                    charVal = "<b>" + charVal.replace(/\(f\)$/, "</b> (female)");
                } else {
                    charVal = "<b>" + charVal.trim() + "</b>";
                }

                //Remove start [ and end ] tokens denoting ordinal range 
                charVal = charVal.replace(/<b>\s*\[/g, "<b>");
                charVal = charVal.replace(/\]\s*<\/b>/g, "</b>");

                if (i < splitKbValues.length - 1)
                    charVal += " or";

                html += "<li>";
                html += charVal;
                html += "</li>";
            }
            return html;
        } else if (this.valueType == "numeric") {
            var rng = this.getRange();
            if (rng.hasValue == false) {
                return "<li><i>no value in knowledge-base</i></li>";
            } else if (rng.min == rng.max) {
                return "<li><b>" + rng.min + "</b></li>";
            } else {
                return "<li><b>" + rng.min + " - " + rng.max + "</b> (range)</li>";
            }
        } else {
            return this.kbValue;
        }
    }

}(jQuery, this.tombiovis));