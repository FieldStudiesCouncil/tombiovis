(function ($, tbv) {

    //Define StateValue object 
    "use strict";
    
    tbv.d.stateValue = {
        //This property set when object created based on this one - stores the original value from the knowledge base
        //Must be set on initialisation because it is immediately replaced by the object.
        v: null, 
    }

    tbv.d.stateValue.init = function (taxon, characterName) {

        var character = tbv.d.oCharacters[characterName];

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

            //Strip off training sex brand
            charValue = charValue.trim();
            var noSexVal, sex;
            if (charValue.endsWith("(m)") || charValue.endsWith("(f)")) {
                noSexVal = charValue.substr(0, charValue.length - 4).trim();
                sex = charValue.substr(charValue.length - 4, 4)
            } else {
                noSexVal = charValue;
                sex = "";
            }

            //Deal with state group values
            if (character.stateGroups && character.stateGroups.indexOf(noSexVal) > -1) {
                //If the value is actually a group value expand the group to values
                var expandedValues = [];
                tbv.d.values.forEach(function (v) {
                    if (v.Character == characterName && v.StateGroup == noSexVal) {
                        expandedValues.push(v.CharacterState)
                    }
                })
            } else {
                var expandedValues = [noSexVal];
            }

            //Translate the characters and append the sex brand
            expandedValues.forEach(function (val) {
                var translatedValue = _this.translateStateValue(_this.character, val);
                if (sex != "") {
                    translatedValue = translatedValue + " " + sex;
                }
                if (translatedValues) {
                    translatedValues = translatedValues + " | " + translatedValue;
                } else {
                    translatedValues = translatedValue;
                }
            })

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

    tbv.d.stateValue.translateStateValue = function (character, state) {

        function translateValue(character, state) {
            var stateValues = tbv.d.values.filter(function (valueObj) {
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

    tbv.d.stateValue.getStates = function (sex) {

        if (!sex) sex = "";

        var states = [];
        var splitvalues = this.kbValue.split("|");

        for (var i = 0; i < splitvalues.length; i++) {
            //Only those relevant to the sex, if specified, are returned.
            //Suffixes representing sex are trimmed off.
            var state = splitvalues[i];
            state = state.trim();

            if (state != "n/a" && state != "novalue" && state != "?" && state != "") {
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

    tbv.d.stateValue.getRange = function () {
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

    tbv.d.stateValue.getOrdinalRanges = function (sex) {
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
                    tbv.d.oCharacters[_this.character].CharacterStateValues.forEach(function (ordinalState) {
                        //console.log("ordinalState", ordinalState)
                        if (ordinalState == lowerState) inRange = true;
                        if (inRange) ordinalRange.push(ordinalState);
                        if (ordinalState == upperState) inRange = false;
                    });
                    //If this is a circular ordinal the end point of and ordinal range can come before the
                    //start point, so we could reach this point with inRange still set to true, in which
                    //case we need to go through the range again.
                    if (inRange) {
                        tbv.d.oCharacters[_this.character].CharacterStateValues.forEach(function (ordinalState) {
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

    tbv.d.stateValue.toHtml1 = function () {
        //Used, for example, by tombiovis.js to display KB values 
        //for a taxon to a user.
        if (this.kbValue == "n/a") {
            return "<i>not applicable</i>";
        } else if (this.kbValue == "novalue") {
            return "<i>not manifest</i>";
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

    tbv.d.stateValue.toHtml2 = function () {
        //Used, for example, to show character score details for single-column key.
        if (this.kbValue == "n/a") {
            return "<li><i>not applicable</i></li>";
        } else if (this.kbValue == "novalue") {
            return "<li><i>not manifest</i></li>";
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

    tbv.d.stateValue.toString = function () {
        return this.kbValue;
    }

}(jQuery, this.tombiovis));

(function ($, tbv) {

    "use strict";

    tbv.f.loadcomplete = function (force) {
        //Called from load.js after all initial loading complete

        //TEST
        //$("#tombiod3-header").on("click", function () {
        //    tbv.f.visChanged("vis5");
        //})

        //Replace content in header and footer tags with tombiod3 id's - this is most relevant for test harness.
        $("#tombiod3-header").text(tbv.d.kbmetadata.title);
        $("#tombiod3-footer").html(tbv.f.getCitation(tbv.d.kbmetadata, "Knowledge-base", tbv.d.softwareMetadata.title));

        //Check the validity of the knowledge-base
        if (!force) {
            if (!tbv.f.checkKnowledgeBase()) return;
        }

        //Map characters to properties of an object for easy reference by name (Character property)
        //and enrich the character objects with some additional values.
        //Here we add values that can (or must) be added before the taxon state values
        //are set. After the taxon values are set we return to the characters collection
        //to set some values that must be done after this.
        tbv.d.oCharacters = {};
        tbv.d.characters.forEach(function (character) {
            tbv.d.oCharacters[character.Character] = character;
            //CharacterStates is an array of state objects including help text etc
            character.CharacterStates = [];
            //CharacterStateValues is an array state values only
            character.CharacterStateValues = [];
            //stateSet attribute
            character.stateSet = false;
            //userInput attribute
            character.userInput = null;
            //Initialise minVal - the minimum value for numeric values
            character.minVal = null;
            //Initialise maxVal - the maximum value for numeric values
            character.maxVal = null;

            if (character.Status == "key" && character.Group.toLowerCase() != "none") {
                //Indicate characters are grouped
                tbv.d.oCharacters.grouped = true
            }

            //The following must be done before taxa are updated with state values
            character.stateGroups = [];
            tbv.d.values.forEach(function (vRow) {
                if (vRow.Character == character.Character && vRow.StateGroup && character.stateGroups.indexOf(vRow.StateGroup) == -1) {
                    character.stateGroups.push(vRow.StateGroup);
                }
            })
        })

        //Map taxa to properties of an object for easy reference by name (Taxon property)
        tbv.d.oTaxa = {};
        var iTaxon = 0;
        tbv.d.taxa.forEach(function (taxon) {
            tbv.d.oTaxa[taxon.Taxon] = taxon;
            //Replace each cell value with a StateValue object.
            for (var property in taxon) {
                if (taxon.hasOwnProperty(property)) {
                    //property is actually the name of a character
                    taxon[property] = Object.create(tbv.d.stateValue, { v: { writable: true, value: taxon[property] } });
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

        //Add some extra properties to character objects - these are properties which
        //can only be calculated after the taxon state values have been generated
        tbv.d.characters.forEach(function (character) {
            //Set minVal & maxVal for numeric characters
            if (character.ValueType == "numeric") {
                tbv.d.taxa.forEach(function (taxon) {
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
                        var stateNumber = tbv.d.values.filter(function (v) {
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

        //Update relative URIs of local resources to reflect the full path of knowledge-base
        tbv.d.media.forEach(function (m) {
            if (m.Type == "image-local" || m.Type == "html-local") {
                m.URI = tbv.opts.tombiokbpath + m.URI;
                if (m.SmallURI) {
                    m.SmallURI = tbv.opts.tombiokbpath + m.SmallURI;
                }
                if (m.LargeURI) {
                    m.LargeURI = tbv.opts.tombiokbpath + m.LargeURI;
                }
            }
        });

        //Enrich the tbv.d.characters collection with the data from tbv.d.values.
        addValuesToCharacters();

        //Build top-level page elements.
        tbv.gui.main.addTopPageElements();

        //Create main interface controls
        tbv.gui.main.createUIControls();

        //Get rid of the load spinner
        $("#downloadspin").remove();

        //Initialise size of controls' tab container
        tbv.f.resizeControlsAndTaxa();

        //Initialise visualisation
        tbv.f.visChanged(tbv.v.selectedTool);

        //Fire any callback defined in tbv.loadCallback. Typically, this could be
        //set by a calling host site.
        //Be aware that this could fire before the first visualisation is fully loaded.
        if (tbv.loadCallback) {
            tbv.loadCallback();
        }
    }

    tbv.f.visChanged = function (selectedToolName, lastVisualisation) {
        //This can be called from hosting sites
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
            tbv.gui.main.visShow(selectedToolName);
            return;
        }

        //If the user has selected to show citation or info page, first make sure that
        //the visualisation on which these are associated (last visualisation) is loaded,
        //then pass forward to visShow.
        if (selectedToolName == "tombioCitation" || selectedToolName == "currentVisInfo") {

            //The tombioCitation and currentVisInfo pages work using the lastVis variable.
            //If a lastVisualisation parameter is passed in to this function, then use that.
            //Otherwise, if tbv.v.lastVis has been set, then use that. Otherwise
            //if a high-level option tbv.opts.lastVisualisation is set, then use that.
            var lastVis;
            if (lastVisualisation) {
                lastVis = lastVisualisation;
            } else if (tbv.v.lastVis) {
                lastVis = tbv.v.lastVis;
            } else if (tbv.opts.lastVisualisation) {
                lastVis = tbv.opts.lastVisualisation;
            } else {
                lastVis = tbv.v.includedVisualisations[0].visName;
            }

            //Load lastVis if not already loaded
            tbv.f.showDownloadSpinner();
            tbv.js.jsFiles[lastVis].loadJs().then(function () {
                tbv.f.hideDownloadSpinner();
                //Initialise visualisation object if it isn't already
                //(may happen if option not selected from built-in drop-down list)
                if (!tbv.v.visualisations[lastVis].visName) {
                    var visObj = tbv.v.visualisations[lastVis];
                    visObj.initP(lastVis, tbv.gui.main);
                }
                tbv.v.lastVis = lastVis;
                tbv.gui.main.visShow(selectedToolName);
            })
            return;
        }

        if (selectedToolName == "mediaFilesCheck" || selectedToolName == "tvkCheck") {

            tbv.gui.main.visShow(selectedToolName);
            return;
        }

        //If we got here, a visualisation (module) was selected.
        tbv.f.showDownloadSpinner();
        tbv.js.jsFiles[selectedToolName].loadJs().then(function () {
            tbv.f.hideDownloadSpinner();
            if (!tbv.v.visualisations[selectedToolName].visName) {
                var visObj = tbv.v.visualisations[selectedToolName];
                visObj.initP(selectedToolName, tbv.gui.main);
            }
            console.log("Starting", selectedToolName);
            tbv.gui.main.visShow(selectedToolName);
        })

        //Because this routine can be called outside of the immediate interface, we need
        //to send the interface a message to say that the tool has been selected
        //so that interface can change its displayed value if necessary.
        tbv.gui.main.setSelectedTool(selectedToolName);
    }

    tbv.f.initControlsFromParams = function (params) {
        //Set values from character state parameters in tbv.d.characters
        //Called by visualisations that can set input controls from command-line parameters.
        for (name in params) {
            if (name.startsWith("c-")) {

                var cIndex = name.split("-")[1];
                var char = tbv.d.characters[cIndex];

                if (char.ControlType === "spin") {
                    char.userInput = params[name];
                } else {
                    char.userInput = params[name].split(",");
                }
                char.stateSet = true;
            }
        }
        getVisualisation().inputControl.initStateFromParams(params);

        tbv.f.refreshVisualisation();
    }

    tbv.f.setParamsFromControls = function () {
        //Called from visualisations that need to generate a URL describing the current
        //user-input states.
        var params = [];

        //User input values
        tbv.d.characters.forEach(function (c, cIndex) {
            if (c.userInput) {
                var paramName = "c-" + cIndex
                if (c.ControlType === "spin") {
                    params.push(paramName + "=" + c.userInput)
                } else {
                    params.push(paramName + "=" + c.userInput.join(","));
                }
            }
        })

        return getVisualisation().inputControl.setParamsFromState(params);
    }

    tbv.f.getCitation = function (metadata, sType, coreTitle) {
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

    tbv.f.refreshVisualisation = function () {

        //Score the taxa
        scoreTaxa();

        //Refresh the relevant visualisation
        if (getVisualisation()) getVisualisation().refresh();
        
        tbv.f.resizeControlsAndTaxa();
    }

    tbv.f.resizeControlsAndTaxa = function () {
        tbv.gui.main.resizeControlsAndTaxa();
    };

    tbv.f.characterHasHelp = function (character) {

        //Is there any character help text on characters tab?
        var helpText = tbv.d.oCharacters[character].Help;
        if (helpText.length > 0) {
            return true;
        }
        //Is there any character state help text on values tab?
        var charText = tbv.d.values.filter(function (v) {
            if (v.Character == character && v.StateHelp) return true;
        });
        if (charText.length > 0) {
            return true;
        }
        //Are there any help images on media tab?
        var charImages = tbv.d.media.filter(function (m) {
            if ((m.Type == "image-local" || m.Type == "image-web") && m.Character == character) {
                return true;
            }
        });
        if (charImages.length > 0) {
            return true;
        }
        return false;
    }

    tbv.f.getURLParameter = function (sParam) {
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

    tbv.f.createMediaCheckPage = function () {

        var html = $("<div id='tombioMediaChecks'>");
        var divProgress = $("<h2>").appendTo(html);
        var divNotFound = $("<div id='tombioMediaNotFound'>").appendTo(html);
        var divFound = $("<div id='tombioMediaFound'>").appendTo(html);

        divNotFound.append("<h3>Not found</h3>");
        divNotFound.append("<p>If a file cannot be found but you think it is present, check the case carefully. The case used to name the file must match exactly the case used in the knowledge-base. For example, a file with extension '.JPG' will not match the same filename in the knowledge-base if it is written there as '.jpg'.</p>");
        divFound.append("<h3>Found</h3>");

        divProgress.text("Checking media files...");

        tbv.f.mediaCheck(
            "URI",
            function (uri) {
                $('#tombioMediaFound').append($('<p>').html("The media file '" + uri + "' found okay."));
            },
            function (uri) {
                $('#tombioMediaNotFound').append($('<p>').html("The media file '" + uri + "' cannot be found."));
            }
        ).then(function () {
            tbv.f.mediaCheck(
                "SmallURI",
                function (uri) {
                    $('#tombioMediaFound').append($('<p>').html("The small media file '" + uri + "' found okay."));
                },
                function (uri) {
                    $('#tombioMediaNotFound').append($('<p>').html("The small media file '" + uri + "' cannot be found."));
                }
            )
        }).then(function () {
            tbv.f.mediaCheck(
                "LargeURI",
                function (uri) {
                    $('#tombioMediaFound').append($('<p>').html("The large media file '" + uri + "' found okay."));
                },
                function (uri) {
                    $('#tombioMediaNotFound').append($('<p>').html("The large media file '" + uri + "' cannot be found."));
                }
            )
        }).then(function () {
            divProgress.text("Completed checking media files");
        });

        return (html);
    }

    tbv.f.createTvkCheckPage = function () {

        var html = $("<div id='tombioTvkChecks'>");
        var divProgress = $("<h2>").appendTo(html);
        var divNotFound = $("<div id='tombioTvkNotFound'>").appendTo(html);
        var divFound = $("<div id='tombioTvkFound'>").appendTo(html);

        divNotFound.append("<h3>Not found</h3>");
        divNotFound.append("<p>If a TVK cannot be found by the NBN web service used for this checking, then you can double-check by going directly to the NBN Atlas page and searching on the TVK (https://nbnatlas.org/). To resolve problems with TVKs not being recognised, you may have to contact the NBN or the NHM who look after the UKSI.</p>");
        divFound.append("<h3>Found</h3>");

        divProgress.text("Checking TVKs...");

        tbv.f.tvkCheck(
            function (t) {
                $('#tombioTvkFound').append($('<p>').html("TVK '" + t.TVK + "' found."));
            },
            function (t) {
                $('#tombioTvkNotFound').append($('<p>').html("TVK '" + t.TVK + "' for '" + t.Taxon + "' cannot be found."));
            },
            function () {
                divProgress.text("Completed checking TVKs");
            }
        );

        return (html);
    }

    tbv.f.getCitationText

    function addValuesToCharacters() {

        tbv.d.values.forEach(function (val) {

            //console.log(val.Character);

            var character = tbv.d.oCharacters[val.Character];

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
        tbv.d.characters.forEach(function (character) {
            //if (character.Status == "key" && (character.ValueType == "text" || character.ValueType == "ordinal")) {

            if (character.Group == "Taxonomy" || (character.Status == "key" && (character.ValueType == "text"))) {
                tbv.d.taxa.forEach(function (taxon) {
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

    function getVisualisation() {
        if (tbv.v.selectedTool in tbv.v.visualisations) {
            return tbv.v.visualisations[tbv.v.selectedTool];
        } else {
            return null;
        }
    }

    tbv.f.selectElementText = function (el, win) {
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

    function scoreTaxa() {

        //Set variable to indicate whether or not sex has been indicated.
        var sex = $("#Sex").val();

        //Update data array to reflect whether or not each taxa meets
        //the criteria specified by user.
        tbv.d.taxa.forEach(function (taxon) {
            //taxon is an object representing the row from the KB
            //corresponding to a taxon.

            taxon.visState.score.for = 0;
            taxon.visState.score.against = 0;
            taxon.visState.score.overall = 0;

            //Loop through all characters and update score
            tbv.d.characters.filter(function (c) {
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
                        scorena = tbv.opts.ignoreNegativeScoring ? 0 : 1;
                        scorefor = 0;
                        scoreagainst = 0;
                    } else if (taxon[character] == "novalue") {
                        //States selected have a value of 'novalue' (not manifest) score against
                        charused = 1;
                        scorena = 0;
                        scorefor = 0;
                        scoreagainst = tbv.opts.ignoreNegativeScoring ? 0 : 1;
                    } else {
                        var stateval = Number(c.userInput);
                        var rng = taxon[character].getRange();
                        var wholeRange = c.maxVal - c.minVal;
                        var score = tbv.f.score.numberVsRange(stateval, rng, c.Latitude);
                        scorefor = score[0];
                        scoreagainst = score[1];
                        charused = 1;
                        scorena = 0;
                    }

                } else if (c.ValueType == "ordinal" || c.ValueType == "ordinalCircular" || c.ValueType == "text") {

                    if (taxon[character] == "n/a") {
                        //States selected but not applicable for taxon
                        charused = 1;
                        scorena = tbv.opts.ignoreNegativeScoring ? 0 : 1;
                        scorefor = 0;
                        scoreagainst = 0;
                    } else if (taxon[character] == "novalue") {
                        //States selcted have a value of 'novalue' (not manifest) score against
                        charused = 1;
                        scorena = 0;
                        scorefor = 0;
                        scoreagainst = 1;
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

                            var score = tbv.f.score.ordinal(selectedStates, kbTaxonStates, posStates, c.Latitude, isCircular);

                        } else { //c.ValueType == "text"
                            //The KB states for this character and taxon.
                            //States that are specific to male or female are represented by suffixes of (m) and (f).
                            //If the character itself is 'Sex', it shouldn't score.
                            if (character == "Sex") {
                                var score = [0, 0];
                            } else {
                                var kbTaxonStates = taxon[character].getStates(sex);
                                var score = tbv.f.score.character(selectedStates, kbTaxonStates);
                            }
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
   
}(jQuery, this.tombiovis));