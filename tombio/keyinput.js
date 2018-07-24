(function ($, tbv) {

    "use strict";

    //##Interface##
    tbv.gui.keyInput = {
        //##Interface##
        //Variables that are part of the required interface...
        width: 360, //Default modified depending on whether or not tabs are present
        //Other variables 
        bullet: "", //"&#x26AB "
        inputCharGroups: [],
        //lastGroup: null,
        verticalTabSpace: 33
    };

    //##Interface##
    tbv.gui.keyInput.init = function ($parent) {

        //Dynamically create the character input widgets
        var _this = this;

        //For group tabs
        $("<div>").attr("id", "tombioKeyInputTabs").css("background-color", "rgba( 255,255, 255, 0.7)").appendTo($parent);
        $("<ul>").attr("id", "tombioKeyInputListElements").appendTo("#tombioKeyInputTabs");

        //##Interface##
        //Set the property which identifies the top-level div for this input
        tbv.gui.keyInput.$div = $("#tombioKeyInputTabs");

        var chargroup;
        var characters = { "All": [] };
        var states = {};

        tbv.d.characters.forEach(function (character) {
            if (character.Status == "key") {

                if (!characters[character.Group]) {
                    characters[character.Group] = [];
                    _this.inputCharGroups.push(character.Group);
                    //_this.lastGroup = character.Group;

                }
                characters[character.Group].push(character);
            }
        });

        //Set minimum  height of tombio controls otherwise overlaps input control tabs
        $(tbv.gui.main.divInput).css("min-height", this.verticalTabSpace * (this.inputCharGroups.length + 2));

        for (var chargroup in characters) {

            var chargrouplink = "tombioKeyInputTab-" + chargroup.replace(/\s+/g, '-');
            //New link
            var li = $("<li/>")
            var el = $("<a/>").text(chargroup).attr("href", "#" + chargrouplink);
            li.append(el);
            $("#tombioKeyInputListElements").append(li);

            //New tab
            var tab = $("<div/>").attr("id", chargrouplink);
            $("#tombioKeyInputTabs").append(tab);

            //If this is the 'All' tab, add radio buttons for visibility
            if (chargrouplink == "tombioKeyInputTab-All") {

                tab.append($("<div>").text("Un-used characters:").css("font-weight", "bold"));
                var radios = $("<fieldset>").attr("id", "visCheckboxes").css("display", "inline-block").css("padding", "0px").css("border", "none");
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

                        //Can't do below refreshData fails on uninitialised values
                        //so have to use an each loop instead.
                        //$(".stateselect").val("").pqSelect('refreshData');
                        $(".stateselect").each(function () {
                            if ($(this).val()) {
                                $(this).val("").pqSelect('refreshData');
                            }
                        });

                        //Reset stateSet flags
                        tbv.d.characters.forEach(function (character) {
                            character.stateSet = false;
                            character.userInput = null;
                        });

                        //colourChart(0);
                        tbv.f.refreshVisualisation();
                        setCloneVisibility();
                    });
                tab.append(reset);
            }

            //New control for each character
            for (var i = 0; i < characters[chargroup].length; i++) {

                var character = characters[chargroup][i];

                //Create the label for the character control
                var characterlabel = $("<span/>").attr("class", "characterlabel").text(character.Label);
                var characterDiv = $("<div/>").append(characterlabel);
                tab.append(characterDiv);

                //Prepare help attrs
                if (tbv.f.characterHasHelp(character.Character)) {
                    characterlabel.attr("character", character.Character);
                    characterlabel.addClass("characterhelp");
                }

                //Clone label on All tab. This goes in a div (with the control) so
                //that visibility can be set as a unit.
                var cloneDiv = $("<div/>").attr("class", "cloneInput");
                cloneDiv.append(characterDiv.clone());
                $("#tombioKeyInputTab-All").css("display", "inline-block").append(cloneDiv);

                if (character.ValueType == "numeric") {
                    //Numeric control so create a spinner

                    //var spinID = "spin-" + character;
                    var spinID = character.Character;
                    var spinParams = character.Params.split(",");
                    var spinMin = Number(spinParams[0]);
                    var spinMax = Number(spinParams[1]);
                    var spinStep = Number(spinParams[2]);

                    var div = $("<div>");
                    var spincontrol = $("<input></input>").attr("class", "spinner").attr("id", spinID);
                    var spinclear = $("<div value='x'>").attr("class", "widget").attr("class", "spinclear").attr("id", spinID + "-clear");
                    div.append(spincontrol)
                    div.append(spinclear);
                    tab.append(div);
                    makeSpinner(spinID, spinMin, spinMax, spinStep);

                    //Clone this to the 'All' tab
                    var div2 = $("<div>");
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

                        var option = $("<option/>").text(_this.bullet + state); //"\u058D"
                        //option.attr("title", "value help")

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
        if (!tbv.d.oCharacters.grouped) {

            $('#tombioKeyInputListElements').css("display", "none");
            $('#tombioKeyInputTabs').css("padding-left", "0px");
            //Reset recorded width
            tbv.gui.keyInput.width = 255;
        }

        var tabs = $("#tombioKeyInputTabs").tabs({
            activate: function (event, ui) {
                //Need this as a workaround. When reset button is used and refreshData
                //method used to clear selections, for some reason the width of the controls
                //is changed on invisible tabs. So when tab is selected, need this refresh
                //method to set the width of the controls correctly.
                $(".stateselect").each(function () {
                    //$(this).pqSelect('refresh');
                });
                tbv.f.resizeControlsAndTaxa();  

                ////Below doesn't work because doesn't get called on first activated control
                //if ($("#tombioControls").css("min-height") == "0px") {
                //    var tombioControlsTop = $("#tombioControls").offset().top;
                //    var $lastTabButton = $("[aria-controls=tombioKeyInputTab-" + _this.lastGroup + "]");
                //    var lastTabButtonTop = $lastTabButton.offset().top;
                //    var lastTabButtonHeight = $lastTabButton.height();
                //    $("#tombioControls").css("min-height", lastTabButtonTop + lastTabButtonHeight - tombioControlsTop);
                //}
            }
        });

        //Select default tab
        //As of v1.6.0 tbv.d.kbconfig.defaultControlGroup deprecated in favour of tbv.opts.selectedGroup
        //As of v1.7.0, tbv.opts.selectedGroup deprecated in favour of tbv.opts.toolconfig.keyinput.selectedGroup
        if (!tbv.opts.toolconfig.keyinput) tbv.opts.toolconfig.keyinput = {};

        if (typeof tbv.opts.toolconfig.keyinput.selectedGroup === "undefined") {
            if (typeof tbv.opts.selectedGroup === "undefined") {
                tbv.opts.toolconfig.keyinput.selectedGroup = tbv.d.kbconfig.defaultControlGroup ? tbv.d.kbconfig.defaultControlGroup : null;
            } else {
                tbv.opts.toolconfig.keyinput.selectedGroup = tbv.opts.selectedGroup ? tbv.opts.selectedGroup : null;
            }
        }
        if (tbv.opts.toolconfig.keyinput.selectedGroup) {
            var tabIndex = _this.inputCharGroups.indexOf(tbv.opts.toolconfig.keyinput.selectedGroup);
            if (tabIndex > -1) {
                tabs.tabs("option", "active", tabIndex + 1)
            }
        }


        //if (typeof tbv.opts.selectedGroup === "undefined") {
        //    tbv.opts.selectedGroup = tbv.d.kbconfig.defaultControlGroup ? tbv.d.kbconfig.defaultControlGroup : null;
        //}
        //if (tbv.opts.selectedGroup) {
        //    var tabIndex = _this.inputCharGroups.indexOf(tbv.opts.selectedGroup);
        //    if (tabIndex > -1) {
        //        tabs.tabs("option", "active", tabIndex + 1)
        //    }
        //}


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

        tbv.gui.main.createCharacterTooltips(".characterhelp");
    }

    //##Interface##
    tbv.gui.keyInput.initFromCharacterState = function () {
        //Set the character state input controls
        tbv.d.characters.forEach(function (c, cIndex) {
            if (c.ControlType === "spin") {
                var control = $("#" + c.Character + ".statespinner");
                var clone = $("#clone-" + c.Character + ".statespinner");

                var val = c.stateSet ? c.userInput : "";
                control.spinner("value", c.userInput);
                clone.spinner("value", val);
            } else {
                var control = $("#" + c.Character + ".stateselect");
                var clone = $("#clone-" + c.Character + ".stateselect");
                if (c.stateSet) {
                    var stateValues = c.userInput.map(function (valueIndex) {
                        return c.CharacterStateValues[valueIndex];
                    })
                } else {
                    var stateValues = [];
                }
                control.val(stateValues).pqSelect('refreshData');
                clone.val(stateValues).pqSelect('refreshData');
            }
        })
    }

    //##Interface##
    tbv.gui.keyInput.initStateFromParams = function (params) {

        this.initFromCharacterState();

        //Set selected group
        $("#tombioKeyInputTabs").tabs("option", "active", params["grp"]);  //##Requires attention - tombioKeyInputTabs

        //Visibility of unused controls (clones)
        $("[name='charvisibility']")
            .removeProp('checked')
            .filter('[value="' + params["cvis"] + '"]')
            .prop('checked', true);

        $("[name='charvisibility']").checkboxradio('refresh');

        setCloneVisibility();
    }

    //##Interface##
    tbv.gui.keyInput.setParamsFromState = function (params) {

        //Update params to indicate which, if any group tab was selected
        params.push("grp=" + $("#tombioKeyInputTabs").tabs("option", "active"));

        //Update params to indicate unused controls visibility (clones)
        params.push("cvis=" + $("input[name=charvisibility]:checked").val());

        return params
    }

    //##Interface##
    tbv.gui.keyInput.otherState = {
        keys: []
    }

    //Implementation dependent elements below...

    function setCloneVisibility () {

        var visibility = $("input[name=charvisibility]:checked").val();

        $(".cloneInput .stateselect, .cloneInput .statespinner").each(function (index) {

            //For a reason I haven't got to the bottom of, this each statement returns
            //the clones (as expected) plus another set with undefined IDs. So we need to ignore these.

            var stateselectID = $(this).attr('id'); //Same as character name (column header in KB)

            if (typeof (stateselectID) != "undefined") {

                if (visibility == "visible") {

                    $(this).parents(".cloneInput").show(500, tbv.f.resizeControlsAndTaxa);
                } else {

                    var stateval = $(this).val();
                    //console..log("val: " + stateval);
                    if (stateval && stateval != "") {
                        //Single selects return single value, multi-selects comma separated string of values.
                        $(this).parents(".cloneInput").show(500, tbv.f.resizeControlsAndTaxa);
                    } else {
                        $(this).parents(".cloneInput").hide(500, tbv.f.resizeControlsAndTaxa);
                    }
                }
            }
        });

        //console..log("Controls height: " + );
    }

    function makeSelect (id) {

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
            var stateSet = select.val() != null && select.val() != "";
            tbv.d.oCharacters[character].stateSet = stateSet;

            //userInput for text controls is an array of values representing the index of the 
            //selected character states.
            //select.val() for single select controls is a string, but for a multi-select control is
            //an array. Coerce string values to arrays.
            if (stateSet) {
                if (typeof select.val() == 'string') {
                    var selectVal = [select.val()];
                } else {
                    var selectVal = select.val();
                }
                var values = [];
                tbv.d.oCharacters[character].CharacterStateValues.forEach(function (stateValue, index) {
                    if (selectVal.indexOf(stateValue) > -1) {
                        values.push(index);
                    }
                })

                tbv.d.oCharacters[character].userInput = values;
            } else {
                tbv.d.oCharacters[character].userInput = null;
            }

            //Set the tooltip for the character states selected. This has to be done every time
            //the pqselect control creates its object.
            [id, counterpartID].forEach(function (selID) {
                //console.log(selID)
                var selItems = $("#" + selID).next().children().find(".pq-select-item-text");
                selItems.attr("title", function () {
                    var _this = this;
                    var charText = tbv.d.values.filter(function (v) {
                        if (v.Character == character && v.CharacterState == $(_this).text()) return true;
                    });
                    if (charText.length == 1) {
                        return charText[0].StateHelpShort ? charText[0].StateHelpShort : charText[0].StateHelp;
                    } else {
                        return "";
                    }
                })
                selItems.tooltip({
                    track: true
                })
            })

            tbv.f.refreshVisualisation();
        });

        //Next is a workaround to set a value for each select control and then clear it.
        //This is necessary because on first selection, for some reason, the control width
        //increases by a few pixels - looks ugly. So we make sure this is done for all
        //controls up front.
        select.val($("#" + id + " option:first").val()).pqSelect('refreshData');
        select.val("").pqSelect('refreshData');
    }

    function makeSpinner (id, min, max, step) {

        var _this = this;

        var spinner = $("#" + id).spinner({
            min: min,
            max: max,
            step: step
        });
        spinner.addClass("statespinner");

        spinner.on("spinstop", function (event, ui) {

            var val = spinner.spinner("value");
            //var val = $("#" + id).spinner("value");

            //select and it's clone must match
            if (id.substring(0, 6) == "clone-") {
                var isClone = true;
                var counterpartID = id.substring(6);
            } else {
                var isClone = false;
                var counterpartID = "clone-" + id;
            };
            $("#" + counterpartID).spinner("value", val);

            //Set state set flag
            if (id.substring(0, 6) == "clone-") {
                var character = id.substring(6);
            } else {
                var character = id;
            }
            tbv.d.oCharacters[character].stateSet = true;
            tbv.d.oCharacters[character].userInput = val;

            //if (!isClone) {
            //Update the taxon representation.
            tbv.f.refreshVisualisation();
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
            tbv.d.oCharacters[character].stateSet = false;
            tbv.d.oCharacters[character].userInput = null;

            tbv.f.refreshVisualisation();
        });
    }

    function showCharacterHelp (character) {

        //Clear existing HTML
        var $divHelp = $("<div>");

        //Header for character
        $('<h3/>', { text: tbv.d.oCharacters[character].Label }).appendTo($divHelp);
        $('<p/>', { html: tbv.d.oCharacters[character].Help }).appendTo($divHelp);

        //Help images for character (not necessarily illustrating particular states)
        var charImages = tbv.d.media.filter(function (m) {
            //Only return images for matching character if no state value is set
            if ((m.Type == "image-local" || m.Type == "image-web") && m.Character == character && !m.State) {
                //Check UseFor field - it id doesn't exist (backward compatibility for older KBs) 
                //or exists and empty then allow image.
                //Otherwise ensure that "full" is amongst comma separated list.
                if (!m.UseFor) {
                    return true;
                } else {
                    var use = false;
                    m.UseFor.split(",").forEach(function (useForVal) {
                        if (useForVal.toLowerCase().trim() == "full") {
                            use = true;
                        }
                    })
                    return use;
                }
            }
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });

        charImages.forEach(function (charState, i) {
            var fig = $('<figure/>').appendTo($divHelp);
            fig.addClass('helpFigure');
            var img = $('<img/>', { src: charState.URI })
            var cap = $('<figcaption/>', { html: charState.Caption });
            fig.append(img).append(cap);
            if (i > 0) {
                img.css("margin-top", 10);
            }
            cap.appendTo($divHelp);

            if (charState.ImageWidth) {
                img.css("width", charState.ImageWidth);
            }
        });

        //Help text character states
        var charText = tbv.d.values.filter(function (v) {
            if (v.Character == character && v.StateHelp) return true;
        });

        charText.forEach(function (charState) {

            if (charState.CharacterStateTranslation && charState.CharacterStateTranslation != "") {
                var charStateText = charState.CharacterStateTranslation;
            } else {
                var charStateText = charState.CharacterState;
            }
            var para = $('<p/>').appendTo($divHelp);
            var spanState = $('<span/>', { text: charStateText + ": " }).css("font-weight", "Bold");
            para.append(spanState);
            var spanHelp = $('<span/>', { html: charState.StateHelp }).css("font-weight", "Normal");
            para.append(spanHelp);

            //Help images for character states
            var charImages = tbv.d.media.filter(function (m) {
                //Only return images for matching character if no state value is set
                if ((m.Type == "image-local" || m.Type == "image-web") && m.Character == character && m.State == charState.CharacterState) return true;
            }).sort(function (a, b) {
                return Number(a.Priority) - Number(b.Priority)
            });

            charImages.forEach(function (charState, i) {
                //var fig = $('<figure/>').appendTo($divHelp);
                var img = $('<img/>', { src: charState.URI })
                var cap = $('<figcaption/>', { html: charState.Caption });
                //fig.append(img).append(cap);
                img.appendTo($divHelp)
                if (i > 0) {
                    img.css("margin-top", 10);
                }
                cap.appendTo($divHelp);
                if (charState.ImageWidth) {
                    img.css("width", charState.ImageWidth);
                }
            });
        });

        //Display the help dialog
        tbv.gui.main.dialog('Character help & info', $divHelp.html())
    }

}(jQuery, this.tombiovis));