(function ($, tbv) {

    //Define StateValue object 
    "use strict";
    
    tbv.stateValue = {
        //This property set when object created based on this one - stores the original value from the knowledge base
        //Must be set on initialisation because it is immediately replaced by the object.
        v: null 
    }

    tbv.stateValue.init = function (taxon, characterName) {

        var character = tbv.oCharacters[characterName];

        //The StateValue objects need to know what type of character they are
        this.valueType = character.ValueType;
        this.status = character.Status;
        this.character = character.Character;

        //Set the kbValue property from the raw value in the spreadsheet (this.v)
        //Values must be translated if they exist in values sheet of KB. We must also account
        //for (m) and (f) suffixes on state values as expressed in the taxa  sheet of the KB.
        var _this = this;
        var splitvalues = this.v.trim().split("|");

        var translatedValues;
        splitvalues.forEach(function (charValue, iValue) {

            charValue = charValue.trim();
            var noSexVal, sex;
            if (charValue.endsWith("(m)") || charValue.endsWith("(f)")) {
                noSexVal = charValue.substr(0, charValue.length - 4).trim();
                sex = charValue.substr(charValue.length - 4, 4)
            } else {
                noSexVal = charValue;
                sex = "";
            }

            var translatedValue = _this.translateStateValue(_this.character, noSexVal);
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
            //If it is a single question mark, it is a marker for the kb author - to be ignored here
            if (translatedValues.length == "?") {
                translatedValues = "";
            }
        });
        this.kbValue = translatedValues;

        //Set up general score tracking object for characters
        //included in key
        if (character.Status == "key") {
            this.score = {
                //"label": character.Label,
                "na": 0,
                "for": 0,
                "against": 0,
                "overall": 0
            };
        }
    }

    tbv.stateValue.translateStateValue = function (character, state) {

        function translateValue(character, state) {
            var stateValues = tbv.values.filter(function (valueObj) {
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

    tbv.stateValue.getStates = function (sex) {

        if (!sex) sex = "";

        var states = [];
        var splitvalues = this.kbValue.split("|");

        for (var i = 0; i < splitvalues.length; i++) {
            //Only those relevant to the sex, if specified, are returned.
            //Suffixes representing sex are trimmed off.
            var state = splitvalues[i];
            state = state.trim();

            if (state != "n/a" && state != "?" && state != "") {
                if (sex == "male" && !state.endsWith("(f)")) {
                    states.push(state.replace("(m)", "").trim());
                } else if (sex == "female" && !state.endsWith("(m)")) {
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

    tbv.stateValue.getRange = function () {
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

    tbv.stateValue.getOrdinalRanges = function (sex) {
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
                    tbv.oCharacters[_this.character].CharacterStateValues.forEach(function (ordinalState) {
                        //console.log("ordinalState", ordinalState)
                        if (ordinalState == lowerState) inRange = true;
                        if (inRange) ordinalRange.push(ordinalState);
                        if (ordinalState == upperState) inRange = false;
                    });
                    //If this is a circular ordinal the end point of and ordinal range can come before the
                    //start point, so we could reach this point with inRange still set to true, in which
                    //case we need to go through the range again.
                    if (inRange) {
                        tbv.oCharacters[_this.character].CharacterStateValues.forEach(function (ordinalState) {
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

    tbv.stateValue.toHtml1 = function () {
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

    tbv.stateValue.toHtml2 = function () {
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

    tbv.stateValue.toString = function () {
        return this.kbValue;
    }

}(jQuery, this.tombiovis));

(function ($, tbv) {

    "use strict";

    //modState object to reference all the module-level state variables.
    //Makes explicit in code which are module-level variables (within the scope of the closure).
    var modState = {
        delay: 250,
        duration: 1000,
        infowidth: 750,
        infoheight: 700,
        visInfoDialogWidth: 650,
        visInfoDialogHeight: 350,
        scriptsLoaded: false,
        htmlLoaded: false,
        initialising: true
    };

    tbv.loadComplete = function (force) {
        //Called from load.js after all initial loading complete

        //Build top-level page elements (v1.6.0 and before this was done by including an HTML import page from load.js)
        addTopPageElements();

        //Replace content in header and footer tags with tombiod3 id's - this is
        //most relevant for test harness.
        $("#tombiod3-header").text(tbv.kbmetadata.title);
        $("#tombiod3-footer").html(tbv.getCitation(tbv.kbmetadata, "Knowledge-base", tbv.metadata.title));

        //Check the validity of the knowledge-base
        if (!force) {
            if (!tbv.checkKnowledgeBase()) return;
        }

        //Map characters to properties of an object for easy reference by name (Character property)
        tbv.oCharacters = {};
        tbv.characters.forEach(function (character) {
            tbv.oCharacters[character.Character] = character;
        });

        //Map taxa to properties of an object for easy reference by name (Taxon property)
        tbv.oTaxa = {};
        var iTaxon = 0;
        tbv.taxa.forEach(function (taxon) {
            tbv.oTaxa[taxon.Taxon] = taxon;
            //Replace each cell value with a StateValue object.
            for (var property in taxon) {
                if (taxon.hasOwnProperty(property)) {
                    //property is actually the name of a character
                    taxon[property] = Object.create(tbv.stateValue, { v: { writable: true, value: taxon[property] } });
                    taxon[property].init(taxon, property);
                }
            }
            //Store the original order of the taxa from the kb
            taxon.kbPosition = ++iTaxon;

            //Initialise visState object
            taxon.visState = {
                //General score object - shared by most multi-access keys
                score: { for: null, against: null, overall: null }
            }
        });

        //Add some extra properties to character objects
        tbv.characters.forEach(function (character) {
            //CharacterStates is an array of state objects including help text etc
            character.CharacterStates = [];
            //CharacterStateValues is an array state values only
            character.CharacterStateValues = [];
            //stateSet attribute
            character.stateSet = false;
            //userInput attribute
            character.userInput = null;
            //minVal is the minimum value for numeric values
            character.minVal = null;
            //maxVal is the maximum value for numeric values
            character.maxVal = null;
            //Set minVal & maxVal for numeric characters
            if (character.ValueType == "numeric") {
                tbv.taxa.forEach(function (taxon) {
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
            //If no Latitude attribute specified (i.e. Latitude field missing from spreadsheet)
            //then use the Strictness value to calculate a value latitude. This is for backwards
            //compatibility for KBs created before v1.7.0 and not modified to use Latitude.

            //Numeric characters are scored thus:
            //If the specified number is within the range specified for the taxon, the character scores 1.
            //Otherwise the score depends on how far outside the range it is. The maximum distance
            //outside the range at which a specified value can score is here called 'latitude'.
            //If outside the latitude, the specified value scores 0.
            //The latitude is equal to the whole range of the character across all taxa, 
            //reduced by an amount proportional to the strictness value. For maximum strictness value (10)
            //latitude is zero. For minimum strictness value (0) latitude is equal to the whole range.
            //The score of a specified number is equal to its distance outside the range, divided by its
            //latitude.
            if (character.ValueType == "numeric" || character.ValueType == "ordinal" || character.ValueType == "ordinalCircular") {
                if (typeof (character.Latitude) != "undefined") {
                    character.Latitude = Number(character.Latitude); //If latitude unspecified, default will be 0.
                    //if (character.ValueType == "ordinal" || character.ValueType == "ordinalCircular") {
                    //    //The specified latitude for ordinal is the the number of ranks that should score,
                    //    //but the software will treat it as the rank that first doesn't score, so add one.
                    //    character.Latitude += 1; (No - do this in socring.)
                    //}
                } else {
                    //Calculate Latitude from Strictness - default strictness is set to maximum (10) if not specified for a character
                    var strictness = character.Strictness == "" ? 10 : Number(character.Strictness);
                    if (character.ValueType == "numeric") {
                        character.Latitude = (1 - strictness / 10) * (character.maxVal - character.minVal);
                    } else { //ordinal
                        var stateNumber = tbv.values.filter(function (v) {
                            return v.Character == character.Character;
                        }).length;
                        character.Latitude = (1 - strictness / 10) * stateNumber;
                        if (character.ValueType == "ordinalCircular") {
                            character.Latitude = character.Latitude / 2;
                        }
                    }
                }
            }
        });

        //Set variable to indicate whether or not characters are grouped
        tbv.charactersGrouped = false;
        tbv.characters.forEach(function (character) {
            if (character.Status == "key" && character.Group.toLowerCase() != "none") {
                tbv.charactersGrouped = true;
            }
        });

        //Update relative URIs of local resources to reflect the full path of knowledge-base
        tbv.media.forEach(function (m) {
            if (m.Type == "image-local" || m.Type == "html-local") {
                m.URI = tbv.opts.tombiokbpath + m.URI;
            }
        });

        //Enrich the tbv.characters collection with the data from tbv.values.
        addValuesToCharacters();
        
        //JQuery UI styling
        $("#tombioMain").css("display", ""); //Must be made visible before UI created otherwise size styling off
        createUIControls();

        //Get rid of the load spinner
        $("#downloadspin").remove();

        //Initialise size of controls' tab container
        tbv.resizeControlsAndTaxa();

        //Initialise visualisation
        //visChangedFromDropdown can load modules which is asynchronous, so 
        //no code should come after this.
        visChangedFromDropdown();

        //Fire any callback defined in tbv.loadCallback. Typically, this could be
        //set by a calling host site.
        //Be aware that this could fire before the first visualisation is fully loaded.
        if (tbv.loadCallback) {
            tbv.loadCallback();
        }
    }

    tbv.initControlsFromParams = function (params) {
        //Set values from character state parameters in tbv.characters
        //Called by visualisations that can set input controls from command-line parameters.
        for (name in params) {
            if (name.startsWith("c-")) {

                var cIndex = name.split("-")[1];
                var char = tbv.characters[cIndex];

                if (char.ControlType === "spin") {
                    char.userInput = params[name];
                } else {
                    char.userInput = params[name].split(",");
                }
                char.stateSet = true;
            }
        }
        getVisualisation().inputControl.initKeyInputFromParams(params);

        tbv.refreshVisualisation();
    }

    tbv.setParamsFromControls = function () {
        //Called from visualisations that need to generate a URL describing the current
        //user-input states.
        var params = [];

        //User input values
        tbv.characters.forEach(function (c, cIndex) {
            if (c.userInput) {
                var paramName = "c-" + cIndex
                if (c.ControlType === "spin") {
                    params.push(paramName + "=" + c.userInput)
                } else {
                    params.push(paramName + "=" + c.userInput.join(","));
                }
            }
        })

        return getVisualisation().inputControl.setParamsFromKeyInput(params);
    }

    tbv.getCitation = function (metadata, sType, coreTitle) {
        //This function is made publicly accessible so that hosting web pages
        //can access citation text if required.

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
        t += window.location.href.split('?')[0]; //$(location).attr('href');

        html.append($("<div>").html(t));
        return html;
    }

    tbv.visChanged = function (selectedToolName, lastVisualisation) {
        //This can be called from hosting sites which is why it is a public function
        //If reload selected, then reload the entire application.
        if (selectedToolName == "reload") {
            //Force reload of entire page - ignoring cache.
            //window.location.reload(true);
            //https://stackoverflow.com/questions/10719505/force-a-reload-of-page-in-chrome-using-javascript-no-cache
            $.ajax({
                url: window.location.href,
                headers: {
                    "Pragma": "no-cache",
                    "Expires": -1,
                    "Cache-Control": "no-cache"
                }
            }).done(function () {
                window.location.reload(true);
            });
            return;
        }

        if (selectedToolName == "visInfo" || selectedToolName == "kbInfo") {
            visModuleLoaded(selectedToolName);
            return;
        }

        //If the user has selected to show citation or info page, first make sure that
        //the visualisation on which these are associated (last visualisation) is loaded,
        //then pass forward to visModuleLoaded.
        if (selectedToolName == "tombioCitation" || selectedToolName == "currentVisInfo") {

            //The tombioCitation and currentVisInfo pages work using the lastVis variable.
            //If a lastVisualisation parameter is passed in to this function, then use that.
            //Otherwise, if a modState.lastVisualisation has been set, then use that. Otherwise
            //if a high-level option tbv.opts.lastVisualisation is set, then use that.
            var lastVis;
            if (lastVisualisation) {
                lastVis = lastVisualisation;
            } else if (modState.lastVisualisation) {
                lastVis = modState.lastVisualisation.visName;
            } else if (tbv.opts.lastVisualisation) {
                lastVis = tbv.opts.lastVisualisation;
            } else {
                lastVis = "vis1";
            }
            //console.log("modState.lastVisualisation", lastVis)
            //console.log("lastVis", lastVis)

            //Load lastVis if not already loaded
            tbv.showDownloadSpinner();
            if (tbv.jsFiles[lastVis]) {
                tbv.jsFiles[lastVis].markLoadReady();
            }
            tbv.loadScripts(function () {
                //Callback
                tbv.hideDownloadSpinner();
                //Create the visualisation object if it doesn't already exist
                //(may happen if option not selected from built-in drop-down list)
                if (!modState.visualisations[lastVis]) {
                    var visObj = tbv[lastVis];
                    visObj.initP(lastVis, "#tombioTaxa", modState.contextMenu, tbv);
                    modState.visualisations[lastVis] = visObj;
                }
                modState.lastVisualisation = modState.visualisations[lastVis];
                visModuleLoaded(selectedToolName);
            })
            return;
        }

        if (selectedToolName == "mediaFilesCheck") {

            visModuleLoaded(selectedToolName);
            return;
        }

        //If we got here, a visualisation (module) was selected.
        //At this point, the tool module (and it's dependencies) may or may not be loaded.
        //So we go through the steps of marking them as 'loadReady' and calling the
        //loadScripts function. If they are already loaded, then that will just return
        //(i.e. call the callback function) immediately
        //If the drop-down tool select doesn't match the selected value
        //(because latter set by parameter), then set the value.
        if ($('#tombioVisualisation').val() != selectedToolName) {
            $('#tombioVisualisation').val(selectedToolName);
        }
        //If this isn't done before the next step, something strange
        //occurs and svg's don't usually display properly.
        tbv.showDownloadSpinner();
        if (tbv.jsFiles[selectedToolName]) {
            tbv.jsFiles[selectedToolName].markLoadReady();
        }
        tbv.loadScripts(function () {
            //Callback
            tbv.hideDownloadSpinner();
            //Create the visualisation object if it doesn't already exist
            if (!modState.visualisations[selectedToolName]) {
                var visObj = tbv[selectedToolName];
                visObj.initP(selectedToolName, "#tombioTaxa", modState.contextMenu, tbv);
                modState.visualisations[selectedToolName] = visObj;
            }
            console.log("Starting", selectedToolName)
            visModuleLoaded(selectedToolName);
        });
    }

    tbv.debugText = function (text, append) {
        //A general utility function for printing diagnostic text in cases where a console is not available,
        //e.g. on mobile device browsers. The element #tombioDebugText is created in import.html
        var d = $("#tombioDebugText");
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

    tbv.refreshVisualisation = function () {

        //Score the taxa
        scoreTaxa();

        //Refresh the relevant visualisation
        if (getVisualisation()) getVisualisation().refresh();
        //var selectedTool = $("#tombioVisualisation").val();
        //if (selectedTool in modState.visualisations) {
        //    modState.visualisations[selectedTool].refresh();
        //}
        
        tbv.resizeControlsAndTaxa();

        //console.log(tbv.taxa)
    }

    tbv.resizeControlsAndTaxa = function () {

        //console.log("resize")
        //Because we want to prevent normal flow where tombioTaxa div would be moved
        //under tombioControls div, we set a min width of their parent div to accommodate
        //them both.
        // console.log($("#tombioControls").is(":visible"), $('#tombioTaxa').width())

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

    tbv.characterHasHelp = function (character) {

        //Is there any character help text on characters tab?
        var helpText = tbv.oCharacters[character].Help;
        if (helpText.length > 0) {
            return true;
        }
        //Is there any character state help text on values tab?
        var charText = tbv.values.filter(function (v) {
            if (v.Character == character && v.StateHelp) return true;
        });
        if (charText.length > 0) {
            return true;
        }
        //Are there any help images on media tab?
        var charImages = tbv.media.filter(function (m) {
            if ((m.Type == "image-local" || m.Type == "image-web") && m.Character == character) {
                return true;
            }
        });
        if (charImages.length > 0) {
            return true;
        }
        return false;
    }

    function getVisualisation() {
        var selectedTool = $("#tombioVisualisation").val();
        if (selectedTool in modState.visualisations) {
            return modState.visualisations[selectedTool];
        } else {
            return null;
        }
    }

    function addTopPageElements() {
        //Build top level intrface elements
        $("#tombiod3vis").css("position", "relative");
 
        //An area for printing diagnostic text in cases where a console is not available, e.g.on mobile device browsers
        $("<div>").attr("id", "tombioDebugText").css("display", "none").appendTo("#tombiod3vis");

        //Div and buttons for knowledge-base integrity report
        $("<div>").attr("id", "tombioKBReport").css("display", "none").appendTo("#tombiod3vis");
        $("<button>").attr("id", "tombioReload").text("Reload").appendTo("#tombioKBReport");
        $("<button>").attr("id", "tombioContinue").text("Continue").appendTo("#tombioKBReport");

        //Main div
        $("<div>").attr("id", "tombioMain").addClass("needsclick").css("display", "none").appendTo("#tombiod3vis");

        //Tool drop-down
        $("<select>").attr("id", "tombioVisualisation").css("display", "none").appendTo("#tombioMain");

        //Divs for taxa and controls
        $("<div>").addClass("tombioNoSelect").attr("id", "tombioControlsAndTaxa").appendTo("#tombioMain");
        $("<div>").attr("id", "tombioControls").css("display", "none").appendTo("#tombioControlsAndTaxa");
        $("<span>").attr("id", "tombioTaxa").appendTo("#tombioControlsAndTaxa");

        //Divs for information
        $("<div>").attr("id", "currentVisInfo").css("display", "none").appendTo("#tombioMain");
        $("<div>").attr("id", "kbInfo").css("display", "none").appendTo("#tombioMain");
        $("<div>").attr("id", "visInfo").css("display", "none").appendTo("#tombioMain");
        $("<div>").attr("id", "tombioCitation").css("display", "none").appendTo("#tombioMain");
        $("<div>").attr("id", "mediaFilesCheck").css("display", "none").appendTo("#tombioMain");

        //outlineTopDivs();
    }

    function outlineTopDivs() {
        $("#tombiod3vis").css("border", "5px solid red") //.attr("title", "tombiod3vis")
        $("#tombioMain").css("border", "5px solid blue") //.attr("title", "tombioMain")
        $("#tombioControlsAndTaxa").css("border", "5px solid green") //.attr("title", "tombioControlsAndTaxa")
        $("#tombioControls").css("border", "5px solid yellow") //.attr("title", "tombioControls")
        $("#tombioTaxa").css("border", "5px solid cyan") //.attr("title", "tombioTaxa")
    }

    function addValuesToCharacters() {

        tbv.values.forEach(function (val) {

            //console.log(val.Character);

            var character = tbv.oCharacters[val.Character];

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
        //Changed to work also for Taxonomy characters because required for earthworm vis colouration (20/03/2018)
        tbv.characters.forEach(function (character) {
            //if (character.Status == "key" && (character.ValueType == "text" || character.ValueType == "ordinal")) {

            if (character.Group == "Taxonomy" || (character.Status == "key" && (character.ValueType == "text"))) {
                tbv.taxa.forEach(function (taxon) {
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

    function createUIControls() {

        //Context menu
        createContextMenu();

        //Generate and store the visualisation controls (all enclosed in divs).
        modState.visualisations = {} //Stores the actual visualisation HTML
        var toolOptions = []; //Drop-down menu options for the visualisations

        //Add clear option
        toolOptions.push($('<option value="reload" class="html" data-class="reload">Reload</option>'));

        //Add the required visualisation tools
        tbv.includedTools.forEach(function (toolName, iTool) {

            var selOpt = $('<option class="needsclick">')
                .attr("value", toolName)
                .attr("data-class", "vis")
                .addClass("visualisation")
                .text(tbv.jsFiles[toolName].toolName);

            toolOptions.push(selOpt);
        })

        //Add the various info tools
        toolOptions.push($('<option id="optCurrentVisInfo" value="currentVisInfo" class="html" data-class="info"></option>'));
        toolOptions.push($('<option value="kbInfo" class="html" data-class="info">About the Knowledge-base</option>'));
        toolOptions.push($('<option value="visInfo" class="html" data-class="info">About FSC Identikit</option>'));
        toolOptions.push($('<option value="tombioCitation" class="html" data-class="info">Get citation text</option>'));

        //If the tbv.opts.devel option is set, add item to check media files.
        if (tbv.opts.devel) {
            toolOptions.push($('<option value="mediaFilesCheck" class="html" data-class="wrench">Check media files</option>'));
        }

        //If a selectedTool has been specified as a query parameter then set as default,
        //otherwise, if a selectedTool has been specified in top level options (in HTML) then set as default,
        //otherwise look to see if one is specified in the knowledge base to use as default.
        var defaultSelection;
        var paramSelectedTool = getURLParameter("selectedTool");
        if (paramSelectedTool) {
            defaultSelection = paramSelectedTool;
        } else if (tbv.opts.selectedTool) {
            defaultSelection = tbv.opts.selectedTool;
        } else if (tbv.kbconfig.selectedTool) {
            defaultSelection = tbv.kbconfig.selectedTool;
        }
        //Loop through options marked default as selected
        var optSelected = false;
        toolOptions.forEach(function (opt) {
            if (opt.attr("value") == defaultSelection) {
                opt.attr("selected", "selected");
                optSelected = true;
            }
        });
        //If no option selected at this point, select the second
        //option (first visualisation - the first option is to reload).
        if (!optSelected) {
            toolOptions[1].attr("selected", "selected");
        }

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
                  visChangedFromDropdown();
              }
              //width: "100%"
          })
          .iconselectmenu("menuWidget")
            .addClass("ui-menu-icons customicons");

        //If the hideVisDropdown option has been set, then hide the dropdown list.
        if (tbv.opts.hideVisDropdown == true) {
            $("#tombioVisualisation-button").hide()
        }

        $('#tombioInfotoggle')
          .button({
              icons: { primary: null, secondary: 'ui-icon-info20' }
          })
          .click(function (event) {
              $("#tombioInfoDialog").dialog("open");
          });

        $('#tombioOptions')
            .button({ icons: { primary: null, secondary: 'ui-icon-options' }, disabled: false })
            .click(function (event) {
            });

        //Context menu
        modState.visWithInput = [];

        for (name in modState.visualisations) {
            if (modState.visualisations[name].charStateInput)
                modState.visWithInput.push(name);
        };

        modState.contextMenu.addItem("Toggle key input visibility", function () {
            controlsShowHide();
        }, modState.visWithInput);
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
            help = help.replace(/##tombiopath##/g, tbv.opts.tombiopath).replace(/##tombiokbpath##/g, tbv.opts.tombiokbpath);
            $('#currentVisInfo').html(help);
        }
    }

    function createMediaCheckPage() {

        var html = $("<div id='tombioMediaChecks'>");
        var divNotFound = $("<div id='tombioMediaNotFound'>").appendTo(html);
        var divFound = $("<div id='tombioMediaFound'>").appendTo(html);

        divNotFound.append("<h3>Not found</h3>");
        divNotFound.append("<p>If a file cannot be found but you think it is present, check the case carefully. The case used to name the file must match exactly the case used in the knowledge-base. For example, a file with extension '.JPG' will not match the same filename in the knowledge-base if it is written there as '.jpg'.</p>");
        divFound.append("<h3>Found</h3>");

        tbv.media.filter(function (m) { return (m.Type == "image-local" || m.Type == "html-local" || m.Type == "image-web") }).forEach(function (m) {

            //Check that the image files actually exist
            mediaFileExists(m.URI,
                function () {
                    $('#tombioMediaFound').append($('<p>').html("The image file '" + m.URI + "' found okay."));
                },
                function () {
                    $('#tombioMediaNotFound').append($('<p>').html("The image file '" + m.URI + "' cannot be found on the server."));
                }) 
        })
        return html;

        function mediaFileExists(uri, fFound, fNotFound) {
            $.ajax({
                url: uri,
                type: 'HEAD',
                error: function () {
                    fNotFound();
                },
                success: function () {
                    fFound();
                }
            });
        }
    }

    function createCitationPage() {

        var html = $("<div>"), t;

        //Generate the citation for the core software
        html.append($("<h3>").text("Citation for FSC Identikit (core software)"))
        t = "This is the reference you can use for the FSC Identikit - in other words the core software.";
        t += " The core version number is updated whenever there is a new major release of the core software.";
        html.append($("<p>").html(t));
        html.append($("<input style='position: relative; top: 0.2em' checked='checked' type='checkbox' name='tbCitationCore' id='tbCitationCore'>"));
        html.append($("<span>").text("Copy citation"));
        html.append($("<b>").html(tbv.getCitation(tbv.metadata, "Software")));

        //Generate the citation for the current tool
        html.append($("<h3>").text("Citation for last selected visualisation tool"))
        t = "This is the reference you can use for the last selected visualisation tool.";
        t += " The tool version number is updated whenever there is a new release of the tool.";
        t += " If you cite a tool, there's no need to cite the core software separately since it is implicit.";
        html.append($("<p>").html(t));
        html.append($("<input style='position: relative; top: 0.2em' type='checkbox' name='tbCitationVis' id='tbCitationVis'>"));
        html.append($("<span>").text("Copy citation"));
        html.append($("<b>").html(tbv.getCitation(modState.lastVisualisation.metadata, "Software", tbv.metadata.title)));

        //Generate the citation for the knowledge-base
        html.append($("<h3>").text("Citation for knowledge-base"))
        t = "This is the reference you can use for the knowledge-base currently driving the software.";
        t += " The knowledge-base version number is updated whenever there is a new release of the knowledge-base.";
        html.append($("<p>").html(t));
        html.append($("<input style='position: relative; top: 0.2em' checked='checked' type='checkbox' name='tbCitationKb' id='tbCitationKb'>"));
        html.append($("<span>").text("Copy citation"));
        html.append($("<b>").html(tbv.getCitation(tbv.kbmetadata, "Knowledge-base", tbv.metadata.title)));

        var button = $("<button>Copy citations</button>").button();
        button.on("click", function () {
            $("#tbSelectedCitations").html("");//Clear

            if (document.getElementById('tbCitationCore').checked) {
                $("#tbSelectedCitations").append(tbv.getCitation(tbv.metadata, "Software"));
            }
            if (document.getElementById('tbCitationVis').checked) {
                $("#tbSelectedCitations").append(tbv.getCitation(modState.lastVisualisation.metadata, "Software", tbv.metadata.title));
            }
            if (document.getElementById('tbCitationKb').checked) {
                $("#tbSelectedCitations").append(tbv.getCitation(tbv.kbmetadata, "Knowledge-base", tbv.metadata.title));
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

    function visChangedFromDropdown() {
        //console.log("last visualisation:", modState.lastVisualisation)
        tbv.visChanged($("#tombioVisualisation").val());
    }

    function visModuleLoaded(selectedToolName) {

        //Get the selected visualisation
        var selectedTool = modState.visualisations[selectedToolName];

        //If the user has selected to show citation then generate.
        if (selectedToolName == "tombioCitation") {
            $('#tombioCitation').html(createCitationPage());
        }

        //If the user has selected to check media files
        if (selectedToolName == "mediaFilesCheck") {
            $('#mediaFilesCheck').html(createMediaCheckPage());
        }

        //If the user has selected to show kb info and not yet loaded,
        //then load.
        if (selectedToolName == "kbInfo" && $('#kbInfo').html().length == 0) {
            var title = $('<h2>').text(tbv.kbmetadata['title']);
            $('#kbInfo').html(title);
            $.get(tbv.opts.tombiokbpath + "info.html", function (html) {
                $('#kbInfo').append(html.replace(/##tombiopath##/g, tbv.opts.tombiopath).replace(/##tombiokbpath##/g, tbv.opts.tombiokbpath));
            }).always(function () {

                //Citation
                var citation = $('<h3>').attr("id", "tombioKbCitation").text("Citation");
                $('#kbInfo').append(citation);
                $('#kbInfo').append(tbv.getCitation(tbv.kbmetadata, "Knowledge-base", tbv.metadata.title));
                //Add the revision history
                var header = $('<h3>').attr("id", "tombioKbRevisionHistory").text("Knowledge-base revision history");
                $('#kbInfo').append(header);
                var currentVersion = $('<p>').html('<b>Current version: ' + tbv.kbmetadata['version'] + '</b>');
                $('#kbInfo').append(currentVersion);

                var table = $('<table>');
                var tr = $('<tr>')
                    .css('background-color', 'black')
                    .css('color', 'white');
                tr.append($('<td>').text('Date').css('padding', '3px'));
                tr.append($('<td>').text('Version').css('padding', '3px'));
                tr.append($('<td>').text('Notes').css('padding', '3px'));
                table.append(tr);

                tbv.kbreleaseHistory.forEach(function (version, iRow) {
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

        //If the user has selected to show info for current visualisation and not yet loaded,
        //then load.
        if (selectedToolName == "currentVisInfo") {

            //Dimension and empty array to accommodate all the help
            //files referenced by this object.
            var helpFiles = new Array(modState.lastVisualisation.helpFiles.length); //???

            modState.lastVisualisation.helpFiles.forEach(function (helpFile, i) {

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

        //Change tool if necessary and associated input control
        if (selectedToolName != modState.currentTool) {

            //Hide previous tool and input control
            if (modState.currentTool) {
                //Hide tool
                var $prevToolDiv = $("#" + modState.currentTool)
                $prevToolDiv.hide();
                //Hide input control
                var prevTool = modState.visualisations[modState.currentTool]
                if (prevTool && prevTool.inputControl) {
                    prevTool.inputControl.$div.hide();
                }
            }
            //Show selected tool
            var $currentToolDiv = $("#" + selectedToolName);
            $currentToolDiv.show();
            //Show input control of selected tool (if there is one)
            //and initialise input controls from current character input
            var currentTool = modState.visualisations[selectedToolName]
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

        //If no visualisation is selected then hide the entire tombioControlsAndTaxa element
        //(otherwise it takes up space at top of info pages).
        if (selectedTool) {
            $("#tombioControlsAndTaxa").show();
        } else {
            $("#tombioControlsAndTaxa").hide();
        }

        //Refresh the selected tool
        tbv.refreshVisualisation();

        //If the previous tool (stored in modState.currentTool) is a visualisation with an input control, hide the input control

        //Store current tool
        modState.currentTool = selectedToolName;

        //Store the last used visualisation and change the name of the menu
        //item for getting info about it.
        if (Object.keys(modState.visualisations).indexOf(selectedToolName) > -1) {

            modState.lastVisualisation = modState.visualisations[selectedToolName];
            $("#optCurrentVisInfo").text("Using the " + modState.lastVisualisation.metadata.title);
            $("#tombioVisualisation").iconselectmenu("refresh");
        }

        //Refresh context menu
        modState.contextMenu.contextChanged(selectedToolName);

        //If this is the first time through - i.e. page just loaded - and
        //this is a visualisation too, then process any URL initialisation parameters.
        if (modState.initialising && modState.visualisations[selectedToolName]) {
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
            modState.visualisations[selectedToolName].urlParams(params);

            //Turn off initialising flag
            modState.initialising = false;
        }
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
            $("#tombioControls").show(0, tbv.resizeControlsAndTaxa);
        } else {
            modState.controlsWidth = $("#tombioControls").width();
            $("#tombioControls").hide(0, tbv.resizeControlsAndTaxa);
        }
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

    function createContextMenu() {

        //Create the context menu object and store in the module state object.
        modState.contextMenu = {};

        //Add a property which is an object which links to each item
        //in the menu. 
        modState.contextMenu.items = {};

        //Add a property which is an object which stores the
        //contexts (visualisations) valid for each item.
        modState.contextMenu.contexts = {};

        //Initialise the ul element which will form basis of menu
        modState.contextMenu.menu = $("<ul>").css("white-space", "nowrap").appendTo('#tombioMain')
            .addClass("contextMenu")
            .css("position", "absolute")
            .css("display", "none")
            .css("z-index", 999999);
        //.append($('<li>').text("menu test"))

        //Make it into a jQuery menu
        modState.contextMenu.menu.menu();

        //Handle the invocation of the menu
        $("#tombioMain").on("contextmenu", function (event) {

            modState.contextMenu.menu.position({
                //This will not work for the first click for
                //some reason - subsequent clicks okay
                //my: "top left",
                //of: event
            });

            //Alternative method
            var parentOffset = $(this).parent().offset();
            var relX = event.pageX - parentOffset.left;
            var relY = event.pageY - parentOffset.top;
            modState.contextMenu.menu.css({ left: relX, top: relY });

            console.log("showing context")
            modState.contextMenu.menu.show();

            return false; //Cancel default context menu
        })

        //Handle removal of the menu
        $("#tombioMain").on("click", function () {
            modState.contextMenu.menu.hide();
        });

        //Add method to add an item
        modState.contextMenu.addItem = function (label, f, contexts, bReplace) {

            //Replace item if already exists 
            //(workaround to let different visualisations have same items with different functions)
            if (bReplace && label in modState.contextMenu.items) {
                modState.contextMenu.items[label].remove();
                delete modState.contextMenu.items[label];
                delete modState.contextMenu.contexts[label];
            }

            //Add item if it does not already exist
            if (!(label in modState.contextMenu.items)) {

                var item = $("<li>").append($("<div>").text(label).click(f));
                modState.contextMenu.menu.append(item);
                modState.contextMenu.menu.menu("refresh");
                modState.contextMenu.items[label] = item;
                modState.contextMenu.contexts[label] = contexts;
            }
        }

        //Add method to remove an item
        modState.contextMenu.removeItem = function (label) {
            if (label in modState.contextMenu.items) {
                modState.contextMenu.items[label].remove();
                delete modState.contextMenu.items[label];
                delete modState.contextMenu.contexts[label];
            }
        }

        //Add method to signal that the context has changed
        modState.contextMenu.contextChanged = function (context) {

            //Go through each item in context menu and hide it if 
            //not valid for this context.
            for (var label in modState.contextMenu.items) {

                if (modState.contextMenu.contexts[label].indexOf(context) > -1) {
                    modState.contextMenu.items[label].show();
                    //console.log("show menu item")
                } else {
                    modState.contextMenu.items[label].hide();
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
        tbv.taxa.forEach(function (taxon) {
            //taxon is an object representing the row from the KB
            //corresponding to a taxon.

            taxon.visState.score.for = 0;
            taxon.visState.score.against = 0;
            taxon.visState.score.overall = 0;

            //Loop through all characters and update score
            tbv.characters.filter(function (c) {
                return (c.Status == "key");
            }).forEach(function (c) {

                var charused, scorefor, scoreagainst, scorena;
                var character = c.Character;

                if (!c.stateSet) {

                    charused = 0;
                    scorena = 0;
                    scorefor = 0;
                    scoreagainst = 0;

                } else if (c.ValueType == "numeric") {

                    //if (taxon.Taxon == "Dicymbium brevisetosum") console.log("Dicymbium brevisetosum >>" + taxon[character] + "<<")

                    if (taxon[character] == "") {
                        //No knowledge base value for a numeric character is taken to represent
                        //missing data and is therefore neutral.
                        charused = 0;
                        scorena = 0;
                        scorefor = 0;
                        scoreagainst = 0;
                    } else if (taxon[character] == "n/a") {
                        //Scorena for a specified numeric value that is not applicable is 1
                        charused = 1;
                        scorena = 1;
                        scorefor = 0;
                        scoreagainst = 0;
                    } else {
                        var stateval = Number(c.userInput);
                        var rng = taxon[character].getRange();
                        var wholeRange = c.maxVal - c.minVal;
                        var score = tbv.score.numberVsRange(stateval, rng, c.Latitude);
                        scorefor = score[0];
                        scoreagainst = score[1];
                        charused = 1;
                        scorena = 0;
                    }

                } else if (c.ValueType == "ordinal" || c.ValueType == "ordinalCircular" || c.ValueType == "text") {

                    if (taxon[character] == "n/a") {
                        //States selected but not applicable for taxon
                        charused = 1;
                        scorena = 1;
                        scorefor = 0;
                        scoreagainst = 0;
                    } else {
                        //Translate c.userInput which is an array of selected indices into an array of values (for scoring)
                        var selectedStates = c.userInput.map(function (i) {
                            return c.CharacterStateValues[i];
                        });

                        if (c.ValueType == "ordinal" || c.ValueType == "ordinalCircular") {
                            //The KB states for this character and taxon.
                            //States that are specific to male or female are represented by suffixes of (m) and (f).
                            var kbTaxonStates = taxon[character].getOrdinalRanges(sex);
                            var posStates = c.CharacterStateValues;
                            var isCircular = c.ValueType == "ordinalCircular";

                            var score = tbv.score.ordinal(selectedStates, kbTaxonStates, posStates, c.Latitude, isCircular);

                        } else { //c.ValueType == "text"
                            //The KB states for this character and taxon.
                            //States that are specific to male or female are represented by suffixes of (m) and (f).
                            var kbTaxonStates = taxon[character].getStates(sex);
                            var score = tbv.score.character(selectedStates, kbTaxonStates);
                        }
                        //console.log(score)
                        scorefor = score[0];
                        scoreagainst = score[1];
                        charused = 1;
                        scorena = 0;
                    }
                }
                taxon[character].score.na = scorena;
                taxon[character].score.for = scorefor;
                taxon[character].score.against = scoreagainst;
                taxon[character].score.overall = scorefor - scoreagainst - scorena;

                //Update overall score for taxon (adjusted for character weight)
                var weight = Number(c.Weight) / 10;
                taxon.visState.score.for += scorefor * weight;
                taxon.visState.score.against += scoreagainst * weight;
                taxon.visState.score.against += scorena * weight;
                taxon.visState.score.overall += (scorefor - scoreagainst - scorena) * weight;
            });
        });
    }

    function debug() {
        if (modState.debug) {
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

}(jQuery, this.tombiovis));

