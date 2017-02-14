(function ($, core) {

    "use strict";

    //Global object to reference all the global variables.
    //No need to specify properties of the object until they are assigned.
    //Makes explicit in code which are global variables (within the scope of the closure).
    var global = {
        xbullet: "&#x26AB ",
        bullet : "",
        delay : 250,
        duration : 1000,
        infowidth : 640,
        infoheight : 520, 
        helpAndInfoDialogWidth : 400,
        helpAndInfoDialogHeight: 250,
        visInfoDialogWidth : 650,
        visInfoDialogHeight: 350,
        scriptsLoaded: false,
        htmlLoaded: false
    };

    function checkKnowledgeBase() {
      
        /*
        At this point, the following objects are available for checking
        core.taxa
        core.characters
        core.values
        core.media
        core.metadata
        core.kbconfig
        */
        //Only carry out the validity checks if core.kbconfig.checkValidity set to yes.
        if (!(core.kbconfig.checkValidity && core.kbconfig.checkValidity == "yes")) {
            return true;
        }
        
        var taxa = true;
        var characters = true;
        var values = true;
        var taxavalues = true;
        var media = true;
        var metadata = true;
        var errors, errors2;

        //Derive some variables for use later
        var charactersFromCharactersTab = core.characters.map(function (character) {
            return character.Character;
        });
        var charactersFromTaxaTab = Object.keys(core.taxa[0]).filter(function (character) {
            return character != "";
        });
        var charactersFromValuesTab = []; 
        core.values.forEach(function (row) {
            if (charactersFromValuesTab.indexOf(row.Character) == -1) {
                charactersFromValuesTab.push(row.Character);
            }
        });
        var numericCharactersInTaxaTab = core.characters.filter(function (character) {
            return character.ValueType == "numeric" && charactersFromTaxaTab.indexOf(character.Character) > -1;
        }).map(function (character) {
            return character.Character;
        });

        function metadataValue(key, error) {
            if (!core.kbmetadata[key] || String(core.kbmetadata[key]).trim() == "") {
                metadata = false;
                errors.append($('<li class="tombioValid3">').text(error));
                return false;
            } else {
                return true;
            }
        }

        //Reload button to avoid cache when KB problems are fixed.
        $('#tombioReload')
          .button({
              icons: { primary: 'ui-icon-reset', secondary: null }
          })
          .click(function (event) {
              //Force reload of entire page - ignoring cache.
              window.location.reload(true);
          })

        //Continue button to force continue.
        $('#tombioContinue')
          .button()
          .css("margin-left", "5px")
          .click(function (event) {
              $("#downloadspin").show();
              $('#tombioKBReport').hide();
              //If I don't use a setTimeout function here, the spinner doesn't re-appear
              setTimeout(function () { core.loadComplete("force") }, 100);
          })

        $('#tombioKBReport').append($('<h3>').text('First fix these knowledge-base problems...'));
        $('#tombioKBReport').append($('<p>').html("Some problems were found with the knowledge-base. They should be easy enough to fix. Read on for more details and guidance."));
        $('#tombioKBReport').append($('<p>').html("When you've fixed one or more problems, use the <i>Save worksheets as CSV</i> button on the KB to regenerate the CSVs and then click the <i>Reload</i> button above."));
        $('#tombioKBReport').append($('<p>').html("The problems are colour-coded according to the schema shown below:"));
        errors = $('<ul>');
        errors.append($('<li class="tombioValid3">').html("These are serious problems that could cause the visualisation software to malfunction."));
        errors.append($('<li class="tombioValid2">').html("These problems are not likely to cause the visualisation software to malfunction, but you might not see what you expect."));
        errors.append($('<li class="tombioValid1">').html("These are for information only - it may be what you intended to do, but if not, you may as well sort them out. These will not cause the visualisation software to malfunction."));
        $('#tombioKBReport').append(errors);

        //Metadata
        errors = $('<ul>');
        //Metadata title
        if (!metadataValue('title', "You must specify a title for the KB (Key - title). This is used to generate a citation.")) metadata = false;
        //Metadata year
        if (!metadataValue('year', "You must specify a year for the KB (Key - year). This is used to generate a citation.")) metadata = false;
        //Metadata version 
        if (!metadataValue('authors', "You must specify one or more authors for the KB (Key - authors). This is used to generate a citation. Authors will appear in the citation exactly as you specify them.")) metadata = false;
        //Metadata version 
        if (!metadataValue('version', "You must specify a version for the KB (Key - version). This is used to generate a citation.")) metadata = false;
        if (!metadata) {
            $('#tombioKBReport').append($('<h4>').text('On the config worksheet...'));
            $('#tombioKBReport').append(errors);
        }

        //Taxa
        errors = $('<ul>');
        //Taxon column must be present
        if (!core.taxa[0]["Taxon"]) {
            errors.append($('<li class="tombioValid3">').html("There must be a column called <i>Taxon</i> (case sensitive) which stores the names of the taxa you are working with."));
            taxa = false;
        }
        //Check that character names are alphanumeric without any space
        var regexCharID = /^[a-zA-Z0-9\-_]+$/;
        Object.keys(core.taxa[0]).forEach(function (character, iCol) {
            if (!regexCharID.test(character)) {
                errors.append($('<li class="tombioValid3">').html("<b>'" + character + "'</b> (column " + (iCol + 1) + ") is not a valid identifier for a character. Use only alphanumerics with no spaces."));
                taxa = false;
            }
        });
        //Check that numeric attributes all contain valid values
        var value;
        //Following is based on this regexp for any valid javascript 
        //number (from eloquent Javascript) /^(\+|-|)(\d+(\.\d*)?|\.\d+)([eE](\+|-|)\d+)?$/
        var regexNumericValue = /^(\d+(\.\d*)?|\.\d+)$/;
        var regexNumericRange = /^\[(\d+(\.\d*)?|\.\d+)-(\d+(\.\d*)?|\.\d+)\]$/;

        numericCharactersInTaxaTab.forEach(function (character) {
            core.taxa.forEach(function (taxon) {
                value = taxon[character];
                if (!(value == "" ||
                    value == "n/a" ||
                    value == "?" ||
                    value.substr(0,1) == "#" || //ignores comment out character state values
                    regexNumericValue.test(value) ||
                    regexNumericRange.test(value))) {
                    errors.append($('<li class="tombioValid3">').html("The value <b>'" + value + "'</b> is not a valid for the numeric character <b>'" + character + "'</b> and taxon <b>'" + taxon.Taxon + "'</b>. Values must be a number or a range in the form '[x-y]'. (Other permitted values are '?', 'n/a' and no value.)"));
                        taxa = false;
                }
            });
        });
     
        if (!taxa) {
            $('#tombioKBReport').append($('<h4>').text('On the taxa worksheet...'));
            $('#tombioKBReport').append(errors);
        }

        //Characters
        errors = $('<ul>');
        //Check that all characters (column headers) on the taxa tab have corresponding values in the characters tab.
        charactersFromTaxaTab.forEach(function (character, iCol) {
            if (charactersFromCharactersTab.indexOf(character) == -1) {
                errors.append($('<li class="tombioValid3">').html("There is no row on the <i>characters</i> worksheet for the character <b>'" + character + "'</b> represented by a column (column " + (iCol + 1) + ") on the <i>taxa</i> worksheet. All columns on the <i>taxa</i> tab must be represented by a row in the <i>characters</i> worksheet regardless of whether or not they are used. Names are case sensitive. Note that rows will not be seen unless the <b>Group</b> column has a value."));
                characters = false;
            }
        })
        //Check that all characters in the characters tab have corresponding columns in the taxa tab.
        charactersFromCharactersTab.forEach(function (character) {
            if (charactersFromTaxaTab.indexOf(character) == -1) {
                errors.append($('<li class="tombioValid2">').html("There is no column on the <i>taxa</i> worksheet for the character <b>'" + character + "'</b> which is represented in the <i>characters</i> worksheet."));
                characters = false;
            }
        });
        //Check other character parameters.
        core.characters.filter(function (c) { return (c.Status == "key") }).forEach(function (c) {
            var validValueType = ["numeric", "ordinal", "text"];
            var validControlType = ["single", "multi", "spin"];
            var validControlsForValues = {
                numeric: ["spin"],
                text: ["single", "multi"],
                ordinal: ["single"]
            }
            var ValueTypeOK = true;
            var ControlTypeOK = true;

            //Check that all characters in characters tab that are used in the key have a weight value.
            var regexWeight = /^([1-9]|10)$/;
            if (!regexWeight.test(c.Weight)) {
                errors.append($('<li class="tombioValid3">').html("You must specify a 'Weight' value for <b>'" + c.Character + "'</b> because it has a 'Status' value of 'key'."));
                characters = false;
            }
            //Check that all numeric and ordinal characters have a strictness value between 0 and 10.
            var regexStrictness = /^([0-9]|10)$/;
            if ((c.ValueType == "numeric" || c.ValueType == "ordinal") && !regexStrictness.test(c.Strictness)) {
                errors.append($('<li class="tombioValid3">').html("For numeric or ordinal characters, you must specify a 'Strictness' value of between 0 and 10. There is an invalid 'Strictness' value for <b>'" + c.Character + "'</b>."));
                characters = false;
            }
            //Check that all characters in characters tab that are used in the key a valid value type.
            if (validValueType.indexOf(c.ValueType) == -1) {
                errors.append($('<li class="tombioValid3">').html("<b>'" + c.ValueType + "'</b>  is an invalid 'ValueType' value for <b>'" + c.Character + "'</b>. You must specify a valid 'ValueType' because it has a 'Status' value of 'key'."));
                ValueTypeOK = false;
                characters = false;
            }
            //Check that all characters in characters tab that are used in the key a valid control type.
            if (validControlType.indexOf(c.ControlType) == -1) {
                errors.append($('<li class="tombioValid3">').html("<b>'" + c.ControlType + "'</b> is an invalid 'ControlType' value for <b>'" + c.Character + "'</b>. You must specify a valid 'ControlType' because it has a 'Status' value of 'key'."));
                ControlTypeOK = false;
                characters = false;
            }
            //Check value type and control type combinations
            if (ValueTypeOK && ControlTypeOK && validControlsForValues[c.ValueType].indexOf(c.ControlType) == -1) {
                errors.append($('<li class="tombioValid3">').html("Invalid combination of 'ValueType' <b>('" + c.ValueType + "')</b> and 'ControlType' <b>('" + c.ControlType + "')</b> for <b>'" + c.Character + "'</b>. You must specify a valid combination because it has a 'Status' value of 'key'."));
                characters = false;
            }
            //A spin control must have parameters set of the form n,n,n
            if (c.ControlType == "spin") {
                var regexSpinValue = /^(\d+(\.\d*)?|\.\d+),(\d+(\.\d*)?|\.\d+),(\d+(\.\d*)?|\.\d+)$/;
                if (!regexSpinValue.test(c.Params)) {
                    errors.append($('<li class="tombioValid3">').html("<b>'" + c.Params + "'</b> is an invalid spin control 'Param' value for <b>'" + c.Character + "'</b>. It must have the form 'n,n,n' (where n can be any valid numeric value, including decimal)."));
                    characters = false;
                }
            }
        })
        if (!characters) {
            $('#tombioKBReport').append($('<h4>').text('On the characters worksheet...'));
            $('#tombioKBReport').append(errors);
        }

        //Values tab
        errors = $('<ul>');
        errors2 = $('<ul>');
        //Check that all characters in the values tab have corresponding entry in the characters tab.
        charactersFromValuesTab.forEach(function (character) {
            if (charactersFromCharactersTab.indexOf(character) == -1) {
                errors.append($('<li class="tombioValid2">').html("There is no row on the <i>characters</i> worksheet for the character <b>'" + character + "'</b> represented in the <i>values</i> worksheet."));
                values = false;
            }
        });

        //Check that values for a character on the values tab are also represented on the taxa tab
        //Conversely, where a character is represented at all on the values tab, report on values
        //in taxa tab that are not represented on values tab (for info only).
        var taxaCharacterValues, valueCharacterValues;
        charactersFromValuesTab.forEach(function (character) {

            valueCharacterValues = [];
            core.values.forEach(function (row) {
                if (row.Character == character) {
                    valueCharacterValues.push(row.CharacterState);
                }
            });

            if (charactersFromTaxaTab.indexOf(character) > -1) {
                taxaCharacterValues = [];
                core.taxa.forEach(function (taxon) {

                    var splitvalues = taxon[character].split("|");
                    splitvalues.forEach(function (charValue) {
                        charValue = charValue.trim();
                        if (endsWith(charValue, "(m)") || endsWith(charValue, "(f)")) {
                            var stateValue = charValue.substr(0, charValue.length - 4).trim();
                        } else {
                            var stateValue = charValue;
                        }

                        if (taxaCharacterValues.indexOf(stateValue) == -1) {
                            taxaCharacterValues.push(stateValue);
                        }
                    });
                });

                //Are there values in values tab that are not in taxa tab?
                valueCharacterValues.forEach(function (value) {
                    if (taxaCharacterValues.indexOf(value) == -1) {
                        errors.append($('<li class="tombioValid2">').html("The value <b>'" + value + "'</b> listed on the <i>values</i> worksheet for the character <b>'" + character + "'</b> is not specified for any taxa on the <i>taxa</i> worksheet."));
                        values = false;
                    }
                });

                //For characters represented on the values tab, are there values on the
                //taxa tab which aren't represented on the values tab?
                if (charactersFromValuesTab.indexOf(character) > -1) {
                    taxaCharacterValues.forEach(function (value) {
                        if (value != "" && value != "n/a" && value != "?") {
                            if (valueCharacterValues.indexOf(value) == -1) {
                                errors2.append($('<li class="tombioValid1">').html("The value <b>'" + value + "'</b> listed on the <i>taxa</i> worksheet for the character <b>'" + character + "'</b> is not specified on the <i>values</i> worksheet."));
                                taxavalues = false;
                            }
                        }
                    });
                }
            }
        });

        if (!values) {
            $('#tombioKBReport').append($('<h4>').text('On the values worksheet...'));
            $('#tombioKBReport').append(errors);
        }
        if (!taxavalues) {
            $('#tombioKBReport').append($('<h4>').text('Values on the taxa worksheet...'));
            $('#tombioKBReport').append(errors2);
        }

        //Image media files
        errors = $('<ul>');
        core.media.filter(function (m) { return (m.Type == "image-local") }).forEach(function (m) {
            
            if (m.Character != "" && charactersFromCharactersTab.indexOf(m.Character) == -1) {
                //A character on the media tab does not appear on the characters tab
                errors.append($('<li class="tombioValid2">').html("An image is specified for the character <b>'" + m.Character + "'</b> on the media worksheet, but that character is not on the characters worksheet."));
                media = false;
            } else if (m.Character != "") {
                //If a character is specified on media tab, no help text specified on characters tab
                var character = core.characters.filter(function (c) { return (c.Character == m.Character) })[0];
                if (character.Help == "") {
                    errors.append($('<li class="tombioValid2">').html("An image is specified for the character <b>'" + m.Character + "'</b> on the media worksheet, but no help text is provided for that character on the characters worksheet, so it won't be displayed."));
                    media = false;
                }
            }

            if (m.State != "" && m.Character == "") {
                //Value specified without character on media tab
                errors.append($('<li class="tombioValid2">').html("An image is specified for the state value <b>'" + m.State + "'</b> on the media worksheet, but no character is specified."));
                media = false;
            }
            if (m.State != "" && m.Character != "") {
                //If a character/value pair is not present on values tab or does not have an associated help value
                var values = core.values.filter(function (v) { return (m.Character == v.Character && m.State == v.CharacterState) });

                if (values.length == 0 || values[0].StateHelp == "") {
                    errors.append($('<li class="tombioValid2">').html("An image is specified for the character <b>'" + m.Character + "'</b> and state <b>'" + m.State + "'</b> on the media worksheet, but no corresponding pair is found with help text on the values worksheet, so it won't be displayed."));
                    media = false;
                }
            }
        })
        if (!media) {
            $('#tombioKBReport').append($('<h4>').text('On the media worksheet...'));
            $('#tombioKBReport').append(errors);
        }

        //Final output
        if (taxa && characters && values && media && metadata) {
            return true;
        } else {
            $('#tombioKBReport').show();
            $("#downloadspin").hide();
            return false;
        }
    }

    core.loadComplete = function (force) {

        //Check the validity of the knowledge-base
        if (!force) {
            if (!checkKnowledgeBase()) return;
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
        core.taxa.forEach(function(taxon) {
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

        //Now enrich with any character states specified in the taxa knowledge base
        //that aren't in the values table. These are just added to the array for 
        //each character in the order that they are found.
        core.characters.forEach(function (character) {
            if (character.Status == "key" && (character.ValueType == "text" || character.ValueType == "ordinal")) {
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
                    //A control classified as 'ordinal' must be created as a single select regardless
                    //of whether 'single' or 'multi' specified.
                    if (character.ControlType == "multi" && character.ValueType == "text") {
                        var selectcontrol = $("<select multiple=multiple></select>").attr("class", "characterSelect");
                    } else {
                        var selectcontrol = $("<select></select>").attr("class", "characterSelect");
                    }
                    selectcontrol.attr("id", selectID);
                    tab.append(selectcontrol);

                    if (character.ControlType == "single" || character.ValueType == "ordinal") {
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

        //Add the required visualisation tools
        core.requiredVisTools.forEach(function (tool) {
            var visObj = new tool.Obj("#tombioTaxa", global.contextMenu, core);

            var selOpt = $('<option>')
                .attr("value", visObj.visName)
                .attr("data-class", "vis")
                .addClass("visualisation")
                .text(visObj.metadata.title);

            //If a selectedTool has been specified as a query parameter then select it,
            //otherwise look to see if one is specified in the knowlege base.

            var paramSelectedTool = getURLParameter("selectedTool");
            console.log("paramSelectedTool", paramSelectedTool)

            if (core.kbconfig.selectedTool && visObj.visName == core.kbconfig.selectedTool) {
                selOpt.attr("selected", "selected");
            }
            toolOptions.push(selOpt);
            
            global.visualisations[visObj.visName] = visObj;
        })
        //Add the various info tools
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
              change: function () {visChanged();}
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

        $('#tombioInfotoggle')
          .button({
              icons: { primary: null, secondary: 'ui-icon-info20' }
          })
          .click(function (event) {
              $("#tombioInfoDialog").dialog("open");
          });

        $('#visHelp')
          .button({
              icons: { primary: 'ui-icon-info20', secondary: null }
          })
          .click(function (event) {
              //Get the current visualisation object
              var selectedVisName = $("#tombioVisualisation").val();
              var selectedVis = global.visualisations[selectedVisName];

              //Dimension and empty array to accommodate all the help
              //files referenced by this object.
              var helpFiles = new Array(selectedVis.helpFiles.length);

              selectedVis.helpFiles.forEach(function (helpFile, i) {

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
          });
        $('#tombioRefresh')
          .button({
              icons: { primary: 'ui-icon-reset', secondary: null }
          })
          .click(function (event) {
              //Force reload of entire page - ignoring cache.
              window.location.reload(true);
          })
          .attr("title", "If you are unsure whether or not you are seeing the latest version, use this button to reload (ignores your browser's cache)")
          .tooltip();

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
            $("#tombioVisInfoDialog").dialog('option', 'title', $("#tombioVisualisation option:selected").text());
            $("#tombioVisInfoDialog").html(help);
            $("#tombioVisInfoDialog").dialog("open");
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
        
        var html = $("<div>"), t;
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

        //If the user has selected to general tombio vis info and not yet loaded,
        //then load.
        if (selectedToolName == "visInfo" && $('#visInfo').html().length == 0) {
            $.get(tombiopath + "visInfo.html", function (html) {
                $('#visInfo').html(html.replace(/##tombiopath##/g, tombiopath).replace(/##tombiokbpath##/g, tombiokbpath));
            });
        }

        if (selectedTool && selectedTool.helpFiles && selectedTool.helpFiles.length > 0) {
            //Show/flash the vis help button
            $('#visHelp').fadeIn().effect("highlight", {}, 3000);
        } else {
            //hide the vis help button
            $('#visHelp').fadeOut();
        }

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

        //Store the last used visualisation
        if (Object.keys(global.visualisations).indexOf(selectedToolName) > -1) {
            global.lastVisualisation = global.visualisations[selectedToolName];
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
            }else{
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

        spinner.on("spinchange", function () {
            
            //Set state set flag
            if (id.substring(0, 6) == "clone-") {
                var character = id.substring(6);
            } else {
                var character = id;
            }
            core.oCharacters[character].stateSet = true;
            refreshVisualisation();
            setCloneVisibility();
        });

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

        return translatedState;
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
            var spanHelp =$('<span/>', { html: charState.StateHelp }).css("font-weight", "Normal");
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
        global.contextMenu.menu = $("<ul>").css("white-space","nowrap").appendTo('#tombioMain')
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

                    if (core.oCharacters[stateselectID].ValueType == "ordinal") {
                        //Ordinal scoring
                        var kbStrictness = Number(core.oCharacters[stateselectID].Strictness);

                        var selState = $(this).val();
                        //console..log(stateselectID + " " + selState);

                        if (taxon[stateselectID] == "n/a") {

                            //States selected but not applicable for taxon
                            scorena = 1;
                            charused = 1;
                            //Adjust for strictness
                            //scorena = scorena * (kbStrictness / 10);

                        } else {
                            var posStates = core.oCharacters[stateselectID].CharacterStateValues;
                            var kbTaxonStates = taxon[stateselectID].getStates(sex);

                            var score = tombioScore.ordinal(selState, kbTaxonStates, posStates, kbStrictness);

                            scorefor = score[0];
                            scoreagainst = score[1];
                            charused = 1;
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

                                //Increment character count
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

    function getURLParameter(sParam)
    {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++)
        {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam)
            {
                return sParameterName[1];
            }
        }
    }​

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
    StateValue.prototype.toHtml1 = function () {
        if (this.kbValue == "n/a") {
            return "<i>not applicable</i>";
        } else if (this.kbValue == "" || this.kbValue == "?") {
            return "<i>no value specified</i>"
        } else if (this.valueType == "text" || this.valueType == "ordinal") {

            //Put bold around each token (separated by |)
            var html = this.kbValue.replace(/([^|]+)/g, "<b>$1</b>");
            //Shift bold end tag to before (m) and (f) and replace with (male) and (female)
            html = html.replace(/(\(m\)\s*<\/b>)/g, "</b>(male)");
            html = html.replace(/(\(f\)\s*<\/b>)/g, "</b>(female)");
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
        if (this.kbValue == "n/a") {
            return "<li><i>not applicable</i></li>";
        } else if (this.valueType == "text" || this.valueType == "ordinal") {
            var html = "";
            var splitKbValues = this.kbValue.split("|");

            for (var i = 0; i < splitKbValues.length; i++) {

                var charVal = splitKbValues[i].trim();

                if (/\(m\)$/.test(charVal)) {
                    charVal = "<b>" + charVal.replace(/\(m\)$/, "</b>(male)");
                } else if (/\(f\)$/.test(charVal)) {
                    charVal = "<b>" + charVal.replace(/\(f\)$/, "</b>(female)");
                } else {
                    charVal = "<b>" + charVal.trim() + "</b>";
                }
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