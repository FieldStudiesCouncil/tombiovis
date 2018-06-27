(function ($, tbv) {

    "use strict";

    //##Interface##
    tbv.keyInput = {
        //##Interface##
        //Variables that are part of the required interface...
        
        //Other variables 
        bullet: "", //"&#x26AB "
        inputCharGroups: [],
        helpAndInfoDialogWidth: 550,
        helpAndInfoDialogHeight: 400,
        //lastGroup: null,
        verticalTabSpace: 33
    };

    //##Interface##
    tbv.keyInput.init = function ($parent) {

        //Dynamically create the character input widgets
        var _this = this;

        //Create dialog for input control help and information
        $("<div>").attr("id", "tombioKeyInputDialog").css("display", "none").appendTo($parent); //.appendTo("#tombiod3vis");
        $("#tombioKeyInputDialog").dialog({
            modal: false,
            width: this.helpAndInfoDialogWidth,
            height: this.helpAndInfoDialogHeight,
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

        //For group tabs
        $("<div>").attr("id", "tombioKeyInputTabs").css("background-color", "rgba( 255,255, 255, 0.7)").appendTo($parent);
        $("<ul>").attr("id", "tombioKeyInputListElements").appendTo("#tombioKeyInputTabs");

        //Set the property which identifies the top-level div for this input
        tbv.keyInput.$div = $("#tombioKeyInputTabs");

        var chargroup;
        var characters = { "All": [] };
        var states = {};

        tbv.characters.forEach(function (character) {
            if (character.Status == "key") {

                if (!characters[character.Group]) {
                    characters[character.Group] = [];
                    _this.inputCharGroups.push(character.Group);
                    //_this.lastGroup = character.Group;

                }
                characters[character.Group].push(character);
            }
        });

        //Set minimum  height of tombio controls based on a constant ()
        $("#tombioControls").css("min-height", this.verticalTabSpace * (this.inputCharGroups.length + 2));

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
                radios.on("change", _this.setCloneVisibility);

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
                        tbv.characters.forEach(function (character) {
                            character.stateSet = false;
                            character.userInput = null;
                        });

                        //colourChart(0);
                        tbv.refreshVisualisation();
                        _this.setCloneVisibility();
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
                if (tbv.characterHasHelp(character.Character)) {
                    characterlabel.attr("character", character.Character);
                    characterlabel.addClass("characterhelp");
                }

                //Clone label on All tab. This goes in a div (with the control) so
                //that visibility can be set as a unit.
                var cloneDiv = $("<div/>").attr("class", "cloneInput");
                cloneDiv.append(characterDiv.clone());
                $("#tombioKeyInputTab-All").append(cloneDiv);

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
                    this.makeSpinner(spinID, spinMin, spinMax, spinStep);

                    //Clone this to the 'All' tab
                    var div2 = $("<div></div>");
                    var clonespincontrol = $("<input></input>").attr("class", "spinner").attr("id", "clone-" + spinID);
                    var clonespinclear = $("<div value='x'>").attr("class", "widget").attr("class", "spinclear").attr("id", "clone-" + spinID + "-clear");
                    div2.append(clonespincontrol)
                    div2.append(clonespinclear);
                    cloneDiv.append(div2);
                    this.makeSpinner("clone-" + spinID, spinMin, spinMax, spinStep);

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
                    this.makeSelect(selectID);


                    //Clone this to the 'All' tab (inside the clone div)
                    var cloneControl = $("#" + selectID).clone();
                    cloneControl.attr("id", "clone-" + selectID)
                    cloneDiv.append(cloneControl);
                    this.makeSelect("clone-" + selectID);
                }
            }
            //}
        }

        //If characters are not grouped, hide the group tabs
        if (!tbv.oCharacters.grouped) {

            $('#tombioKeyInputListElements').css("display", "none");
            $('#tombioKeyInputTabs').css("padding-left", "0px");
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
                tbv.resizeControlsAndTaxa();  

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
        //As of v1.6.0 tbv.kbconfig.defaultControlGroup deprecated in favour of tbv.opts.selectedGroup
        //As of v1.7.0, tbv.opts.selectedGroup deprecated in favour of tbv.opts.toolconfig.keyinput.selectedGroup
        if (!tbv.opts) tbv.opts = {};
        if (!tbv.opts.toolconfig) tbv.opts.toolconfig = {};
        if (!tbv.opts.toolconfig.keyinput) tbv.opts.toolconfig.keyinput = {};

        if (typeof tbv.opts.toolconfig.keyinput.selectedGroup === "undefined") {
            if (typeof tbv.opts.selectedGroup === "undefined") {
                tbv.opts.toolconfig.keyinput.selectedGroup = tbv.kbconfig.defaultControlGroup ? tbv.kbconfig.defaultControlGroup : null;
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
        //    tbv.opts.selectedGroup = tbv.kbconfig.defaultControlGroup ? tbv.kbconfig.defaultControlGroup : null;
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
            .tooltip({
                track: true,
                items: "span",
                content: function () {
                    return _this.getCharacterToolTip($(this).attr("character"));
                }
            })
            .click(function () {
                _this.showCharacterHelp($(this).attr("character"));
            });
    }

    //##Interface##
    tbv.keyInput.initFromCharacterState = function () {
        //Set the character state input controls
        tbv.characters.forEach(function (c, cIndex) {
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
    tbv.keyInput.initStateFromParams = function (params) {

        this.initFromCharacterState();

        //Set selected group
        $("#tombioKeyInputTabs").tabs("option", "active", params["grp"]);  //##Requires attention - tombioKeyInputTabs

        //Visibility of unused controls (clones)
        $("[name='charvisibility']")
            .removeProp('checked')
            .filter('[value="' + params["cvis"] + '"]')
            .prop('checked', true);

        $("[name='charvisibility']").checkboxradio('refresh');

        this.setCloneVisibility();
    }

    //##Interface##
    tbv.keyInput.setParamsFromState = function (params) {

        //Update params to indicate which, if any group tab was selected
        params.push("grp=" + $("#tombioKeyInputTabs").tabs("option", "active"));

        //Update params to indicate unused controls visibility (clones)
        params.push("cvis=" + $("input[name=charvisibility]:checked").val());

        return params
    }

    //##Interface##
    tbv.keyInput.otherState = {
        keys: []
    }

    //Implementation dependent elements below...

    tbv.keyInput.setCloneVisibility = function () {

        var visibility = $("input[name=charvisibility]:checked").val();

        $(".cloneInput .stateselect, .cloneInput .statespinner").each(function (index) {

            //For a reason I haven't got to the bottom of, this each statement returns
            //the clones (as expected) plus another set with undefined IDs. So we need to ignore these.

            var stateselectID = $(this).attr('id'); //Same as character name (column header in KB)

            if (typeof (stateselectID) != "undefined") {

                if (visibility == "visible") {

                    $(this).parents(".cloneInput").show(500, tbv.resizeControlsAndTaxa);
                } else {

                    var stateval = $(this).val();
                    //console..log("val: " + stateval);
                    if (stateval && stateval != "") {
                        //Single selects return single value, multi-selects comma separated string of values.
                        $(this).parents(".cloneInput").show(500, tbv.resizeControlsAndTaxa);
                    } else {
                        $(this).parents(".cloneInput").hide(500, tbv.resizeControlsAndTaxa);
                    }
                }
            }
        });

        //console..log("Controls height: " + );
    }

    tbv.keyInput.makeSelect = function (id) {

        var _this = this;

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
            _this.setCloneVisibility();

            //Set state set flag
            if (id.substring(0, 6) == "clone-") {
                var character = id.substring(6);
            } else {
                var character = id;
            }
            var stateSet = select.val() != null && select.val() != "";
            tbv.oCharacters[character].stateSet = stateSet;

            //userInput for text controls is an array of values representing the index of the 
            //selected character states.
            //select.val() for single select controls is a string, but for a multi-select control is
            //an array. Coerce string values to arrays. (To fix bug #19 17/06/2018).
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
                    var charText = tbv.values.filter(function (v) {
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

            tbv.refreshVisualisation();
        });

        //Next is a workaround to set a value for each select control and then clear it.
        //This is necessary because on first selection, for some reason, the control width
        //increases by a few pixels - looks ugly. So we make sure this is done for all
        //controls up front.
        select.val($("#" + id + " option:first").val()).pqSelect('refreshData');
        select.val("").pqSelect('refreshData');
    }

    tbv.keyInput.makeSpinner = function (id, min, max, step) {

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
            tbv.oCharacters[character].stateSet = true;
            tbv.oCharacters[character].userInput = val;

            console.log(val)

            //if (!isClone) {
            //Update the taxon representation.
            tbv.refreshVisualisation();
            _this.setCloneVisibility();
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
            tbv.oCharacters[character].stateSet = false;
            tbv.oCharacters[character].userInput = null;

            tbv.refreshVisualisation();
        });
    }

    tbv.keyInput.getCharacterToolTip = function (character) {

        var ret = $('<div/>');
        var tipTextPresent = false;

        //Help text for character
        //If HelpShort exists - use this for tip text, else use Help text. Must allow
        //for KBs where HelpShort column doesn't exist for backward compatibility.
        if (tbv.oCharacters[character].HelpShort && tbv.oCharacters[character].HelpShort != "") {
            var helpText = tbv.oCharacters[character].HelpShort;
            tipTextPresent = true;
        } else {
            var helpText = tbv.oCharacters[character].Help;
        }

        //Retrieve collection of media image rows for this character and sort by priority.
        var charImagesFull = tbv.media.filter(function (m) {
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
            figure.addClass("helpFigure");
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
        var valueHelp = tbv.values.filter(function (v) {
            if (v.Character == character && v.StateHelp) return true;
        });

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

    tbv.keyInput.showCharacterHelp = function (character) {

        //Clear existing HTML
        $("#tombioKeyInputDialog").html("");

        //Header for character
        $('<h3/>', { text: tbv.oCharacters[character].Label }).appendTo('#tombioKeyInputDialog');
        $('<p/>', { html: tbv.oCharacters[character].Help }).appendTo('#tombioKeyInputDialog');

        //Help images for character (not necessarily illustrating particular states)
        var charImages = tbv.media.filter(function (m) {
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
            var fig = $('<figure/>').appendTo('#tombioKeyInputDialog');
            fig.addClass('helpFigure');
            var img = $('<img/>', { src: charState.URI })
            var cap = $('<figcaption/>', { html: charState.Caption });
            fig.append(img).append(cap);
            if (i > 0) {
                img.css("margin-top", 10);
            }
            cap.appendTo('#tombioKeyInputDialog');

            if (charState.ImageWidth) {
                img.css("width", charState.ImageWidth);
            }
        });

        //Help text character states
        var charText = tbv.values.filter(function (v) {
            if (v.Character == character && v.StateHelp) return true;
        });

        charText.forEach(function (charState) {

            if (charState.CharacterStateTranslation && charState.CharacterStateTranslation != "") {
                var charStateText = charState.CharacterStateTranslation;
            } else {
                var charStateText = charState.CharacterState;
            }
            var para = $('<p/>').appendTo('#tombioKeyInputDialog');
            var spanState = $('<span/>', { text: charStateText + ": " }).css("font-weight", "Bold");
            para.append(spanState);
            var spanHelp = $('<span/>', { html: charState.StateHelp }).css("font-weight", "Normal");
            para.append(spanHelp);

            //Help images for character states
            var charImages = tbv.media.filter(function (m) {
                //Only return images for matching character if no state value is set
                if ((m.Type == "image-local" || m.Type == "image-web") && m.Character == character && m.State == charState.CharacterState) return true;
            }).sort(function (a, b) {
                return Number(a.Priority) - Number(b.Priority)
            });

            charImages.forEach(function (charState, i) {
                //var fig = $('<figure/>').appendTo('#tombioKeyInputDialog');
                var img = $('<img/>', { src: charState.URI })
                var cap = $('<figcaption/>', { html: charState.Caption });
                //fig.append(img).append(cap);
                img.appendTo('#tombioKeyInputDialog')
                if (i > 0) {
                    img.css("margin-top", 10);
                }
                cap.appendTo('#tombioKeyInputDialog');
                if (charState.ImageWidth) {
                    img.css("width", charState.ImageWidth);
                }
            });
        });

        //Display the help dialog
        $("#tombioKeyInputDialog").dialog('option', 'title', 'Character help and information');
        $("#tombioKeyInputDialog").dialog("open");
    }

}(jQuery, this.tombiovis));