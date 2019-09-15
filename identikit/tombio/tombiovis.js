(function ($, tbv) {
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
        if (this.valueType == "ordinal" || this.valueType == "ordinalcircular") {
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
        } else if (this.valueType == "text" || this.valueType == "ordinal" || this.valueType == "ordinalcircular") {
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

    tbv.d.stateValue.toHtml2 = function (supressList) {

        var liS = "<li>"
        var liE = "</li>"
        if (supressList) {
            liS = "";
            liE = "";
        }

        //Used, for example, to show character score details for single-column key.
        if (this.kbValue == "n/a") {
            return "<li><i>not applicable</i></li>";
        } else if (this.kbValue == "novalue") {
            return "<li><i>not manifest</i></li>";
        } else if (this.valueType == "text" || this.valueType == "ordinal" || this.valueType == "ordinalcircular") {
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
                    charVal += " <i>or</i> ";

                html += liS;
                html += charVal;
                html += liE;
            }
            return html;
        } else if (this.valueType == "numeric") {
            var rng = this.getRange();
            if (rng.hasValue == false) {
                return liS + "<i>no value in knowledge-base</i>" + liE;
            } else if (rng.min == rng.max) {
                return liS + "<b>" + rng.min + "</b>" + liE;
            } else {
                return liS + "<b>" + rng.min + " - " + rng.max + "</b> (range)" + liE;
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

        //To avoid some nasty bugs, we need to replace any multiple spaces with single spaces in translated
        //values from the values tab. I think that this needs to be done for where double spaces
        //have been inserted into text state values or translated values because the pqselect control does the same.
        //Fixes https://github.com/burkmarr/tombiovis/issues/8
        //Fixes https://github.com/burkmarr/tombiovis/issues/25
        tbv.d.values.forEach(function (v) {
            if (v.CharacterStateTranslation) {
                v.CharacterStateTranslation = v.CharacterStateTranslation.replace(/ +(?= )/g, '');
            }
        })

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

        //Store character groups
        tbv.d.groupedCharacters = {};
        tbv.d.groupedCharacters.groups = [];
        tbv.d.characters.forEach(function (character) {
            if (character.Status == "key") {
                if (!tbv.d.groupedCharacters[character.Group]) {
                    tbv.d.groupedCharacters[character.Group] = [];
                    tbv.d.groupedCharacters.groups.push(character.Group);
                }
                tbv.d.groupedCharacters[character.Group].push(character);
            }
        });


        //Map taxa to properties of an object for easy reference by name (Taxon property)
        tbv.d.oTaxa = {};
        var iTaxon = 0;
        tbv.d.taxa.forEach(function (taxon) {
            tbv.d.oTaxa[taxon.taxon] = taxon;
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
            if (character.ValueType == "numeric" || character.ValueType == "ordinal" || character.ValueType == "ordinalcircular") {
                if (typeof (character.Latitude) != "undefined") {
                    character.Latitude = Number(character.Latitude); //If latitude unspecified, default will be 0.
                    //if (character.ValueType == "ordinal" || character.ValueType == "ordinalcircular") {
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
                        if (character.ValueType == "ordinalcircular") {
                            character.Latitude = character.Latitude / 2;
                        }
                    }
                }
            }
        });

        //Update relative URIs of local resources to reflect the full path of knowledge-base
        tbv.d.media.forEach(function (m) {

            if (m.Type == "html-local") {
                m.URI = tbv.opts.tombiokbpath + m.URI + "?t=kbtxt";
            } else if (m.Type == "image-local") {
                m.URI = tbv.opts.tombiokbpath + m.URI + "?t=kbimgstd";
                if (m.SmallURI) {
                    m.SmallURI = tbv.opts.tombiokbpath + m.SmallURI + "?t=kbimgsml";
                }
                if (m.LargeURI) {
                    m.LargeURI = tbv.opts.tombiokbpath + m.LargeURI + "?t=kbimglrg";
                }
            }
        });

        //Enrich the tbv.d.characters collection with the data from tbv.d.values.
        addValuesToCharacters();

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

        //Build top-level page elements.
        tbv.gui.main.init();

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

    tbv.f.cacheAll = function () {
        console.log("caching all")

        var ticks = 0;
        var ticksMax = 0;

        var pAllCaches = [];
        //Load tools which will automatically cache all their resources via
        //the service worker (since self.clients.claim() is set).
        tbv.opts.tools.forEach(function (t) {
            console.log("Caching tool " + t);
            var pTool = tbv.js.jsFiles[t].loadJs().then(function () {
                console.log("Tool " + t + " successfully cached.");
            }).catch(function () {
                console.log("Tool " + t + " unsuccessfully cached.");
                })

            ticksMax += 1;
            addTick(pTool);
            pAllCaches.push(pTool);
        })

        //THESE MUST MATCH THE CACHENAMES IN SERVICE WORKER
        var kbCacheName = "tombio-kb-cache-1";
        var kbImgStdCacheName = "tombio-kb-img-std-cache-1";
        var kbImgSmlCacheName = "tombio-kb-img-sml-cache-1";
        var kbImgLrgCacheName = "tombio-kb-img-lrg-cache-1";
        var kbTxtCacheName = "tombio-kb-txt-cache-1";
        var genCacheName = "tombio-gen-cache-1";
        ///////////////////////////////////////////////////

        //Core knowledgebase files and homepage
        var kbFiles = [];
        //kbFiles.push(tbv.opts.tombiokbpath + 'taxa.csv');
        //kbFiles.push(tbv.opts.tombiokbpath + 'characters.csv');
        //kbFiles.push(tbv.opts.tombiokbpath + 'values.csv');
        //kbFiles.push(tbv.opts.tombiokbpath + 'media.csv');
        //kbFiles.push(tbv.opts.tombiokbpath + 'config.csv');
        kbFiles.push(tbv.opts.tombiokbpath + 'info.html');
        //kbFiles.push(location.pathname);

        //tombio/common 
        var commonFolder = tbv.opts.tombiopath + 'common/'
        var commonFiles = [];
        commonFiles.push(commonFolder + 'character-help.png');
        commonFiles.push(commonFolder + 'character-input.png');
        commonFiles.push(commonFolder + 'full-details.html');
        commonFiles.push(commonFolder + 'nbn-map.jpg');
        commonFiles.push(commonFolder + 'stateInputHelp.html');
        commonFiles.push(commonFolder + 'taxon-details-2.png');
        commonFiles.push(commonFolder + 'taxon-select-help.html');
        commonFiles.push(commonFolder + 'taxon-select.png');
        commonFiles.push(commonFolder + 'taxonDetailsHelp.html');
        commonFiles.push(commonFolder + 'text-selection-input.png');

        //Media resources
        var kbImagesSmall = tbv.d.media.filter(function (m) { return (m.SmallURI && m.Type == "image-local") }).map(function (m) { return m.SmallURI });
        var kbImagesStandard = tbv.d.media.filter(function (m) { return (m.URI && m.Type == "image-local") }).map(function (m) { return m.URI });
        var kbImagesLarge = tbv.d.media.filter(function (m) { return (m.LargeURI && m.Type == "image-local") }).map(function (m) { return m.LargeURI });
        var kbTextFiles = tbv.d.media.filter(function (m) { return (m.URI && m.Type == "html-local") }).map(function (m) { return m.URI });

        pAllCaches.push(loadCache(kbImagesSmall, kbImgSmlCacheName, "small images from knowledge-base"));
        pAllCaches.push(loadCache(kbImagesStandard, kbImgStdCacheName, "standard images from knowledge-base"));
        pAllCaches.push(loadCache(kbImagesLarge, kbImgLrgCacheName, "large images from knowledge-base"));
        pAllCaches.push(loadCache(kbTextFiles, kbTxtCacheName, "text files from knowledge-base"));
        pAllCaches.push(loadCache(kbFiles, kbCacheName, "core knowledge-base"));
        pAllCaches.push(loadCache(commonFiles, genCacheName, "common help resources"));


        Promise.all(pAllCaches).then(function () {
            console.log("All caches completed");
            tbv.gui.main.offerRefresh();
        }).catch(function () {
            console.log("Not all caches completed successfully")
        });

        function addTick(p) {
            p.then(function () {
                ticks += 1;
                //console.log("tick", ticks);
                tbv.gui.main.updateProgress(ticks * 100 / ticksMax);
            }) 
        }

        function loadCache(files, cache, desc) {

            //return caches.open(cache).then(function (cache) {
            //    console.log("Caching " + desc);
            //    return cache.addAll(files).then(function () {
            //        console.log("Sucessfully cached " + desc);
            //    }).catch(function () {
            //        console.log("Failed to cache " + desc);
            //    })
            //})

            //The method below, using cache.add, is used in preference to
            //the method above, using cache.addAll, because if one of the
            //files is not found, then whole addAll fails, adding none of the
            //files to the cache.

            ticksMax += files.length;
            return caches.open(cache).then(function (cache) {
                console.log("Caching " + desc);

                var pFiles = [];
                files.forEach(function (file) {
                    var pAdd = cache.add(file);
                    addTick(pAdd);
                    pFiles.push(pAdd);
                })
                return Promise.all(pFiles).then(function () {
                    console.log("Sucessfully cached " + desc);
                }).catch(function () {
                    console.log("One or more files failed to cache " + desc);
                })
            })
        }
    }

    tbv.f.visChanged = function (selectedToolName, lastVisualisation) {

        if (!selectedToolName) return;

        //Initialise the visTemplate object for interface checking (if devel flag set)
        if (tbv.opts.devel) tbv.templates.visTemplate.initP('visTemplate');

        tbv.v.selectedTool = selectedToolName;

        //This can be called from hosting sites
        //If reload selected, then reload the entire application.
        if (selectedToolName == "reload") {
            //This is called from the reload button that users see.
            //Force reload of app - ignoring cache.

            //Delete caches
            if (caches) {
                caches.keys()
                    .then(function (keyList) {
                        return Promise.all(keyList.map(function (key) {
                            if (key.startsWith('tombio-')) {
                                console.log('[ServiceWorker] Removing cache', key);
                                return caches.delete(key);
                            }
                        }));
                    })
                    .then(function () {
                        window.location.reload();
                    });
            } else {
                window.location.reload(true);
                ////https://stackoverflow.com/questions/10719505/force-a-reload-of-page-in-chrome-using-javascript-no-cache
                //$.ajax({
                //    url: window.location.href,
                //    headers: {
                //        "Pragma": "no-cache",
                //        "Expires": -1,
                //        "Cache-Control": "no-cache"
                //    }
                //}).done(function () {
                //    window.location.reload(true);
                //});
                return;
            }
            return;
        }

        //If reloadkb selected, reload (without ignoring cache), but first clear
        //cached knowledge-base files and any kb resources which can be identified
        //from caches that start with tombio-kb-.
        //Reload the kb cache since this happens in sw install which won't get
        //called again until the service worker changes.
        if (selectedToolName == "reloadkb") {

            //Delete the knowledge-base cache
            if (caches) {
                caches.keys()
                    .then(function (keyList) {
                        return Promise.all(keyList.map(function (key) {
                            if (key.startsWith('tombio-kb-')) {
                                console.log('[ServiceWorker] Removing cache', key);
                                return caches.delete(key);
                            }
                        }));
                    })
                    .then(function () {
                        window.location.reload();
                    });
            } else {
                window.location.reload(true);
            }
            return;
        }

        //Reload with guiOnsenUi
        if (selectedToolName == "reloadGuiOnsen") {

            var initialPage = location.pathname;
            window.location.replace(location.pathname + "?gui=guiOnsenUi");
            return;
        }

        //Reload with guiLargeJqueryUi
        if (selectedToolName == "reloadGuiJQuery") {

            var initialPage = location.pathname;
            window.location.replace(location.pathname + "?gui=guiLargeJqueryUi");
            return;
        }

        if (selectedToolName == "offline") {
            tbv.gui.main.offlineOptions();
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
                if (!tbv.v.visualisations[lastVis].initialised) {
                    var visObj = tbv.v.visualisations[lastVis];
                    visObj.initP(lastVis);
                    visObj.hide();
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

            if (!tbv.v.visualisations[selectedToolName].initialised) {

                var visObj = tbv.v.visualisations[selectedToolName];
                visObj.initP(selectedToolName);
            }
            console.log("Starting", selectedToolName);
            tbv.gui.main.visShow(selectedToolName);

            //Following is a workaround for visualisation that need to be displayed before they
            //can initialise properly, e.g. vis2. Addresses https://github.com/burkmarr/tombiovis/issues/49
            setTimeout(function () { tbv.v.visualisations[selectedToolName].refresh() }, 100);

        }).catch(function (error) {

            console.log("Error", error);

            var html = "";
            html += "<p>You are working offline but the tool you tried to load( " + selectedToolName + ") was not previously loaded into memory.</p>";
            html += "<p>Load the tool when you next have an internet connection. Then you will be able to use it offline.</p>";
            tbv.gui.main.dialog("Currently unavailable", html)
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

    tbv.f.setKbInfo = function ($kbInfo) {

        $.get(tbv.opts.tombiokbpath + "info.html", function (html) {
            $kbInfo.append(html.replace(/##tombiopath##/g, tbv.opts.tombiopath).replace(/##tombiokbpath##/g, tbv.opts.tombiokbpath));
        }).always(function () {
            //Citation
            var citation = $('<h3>').attr("id", "tombioKbCitation").text("Citation");
            $kbInfo.append(citation);
            $kbInfo.append(tbv.f.getCitation(tbv.d.kbmetadata, "Knowledge-base", tbv.d.softwareMetadata.title));
            //Add the revision history
            var header = $('<h3>').attr("id", "tombioKbRevisionHistory").text("Knowledge-base revision history");
            $kbInfo.append(header);
            var currentVersion = $('<p>').html('<b>Current version: ' + tbv.d.kbmetadata['version'] + '</b>');
            $kbInfo.append(currentVersion);

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
            $kbInfo.append(table);
        });
    }

    tbv.f.setVisInfo = function ($visInfo) {
        $.get(tbv.opts.tombiopath + "visInfo.html", function (html) {
            $visInfo.html(html.replace(/##tombiopath##/g, tbv.opts.tombiopath).replace(/##tombiokbpath##/g, tbv.opts.tombiokbpath));
        });
    }

    tbv.f.setSelectedToolInfo = function ($currentVisInfo) {
        
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
            $currentVisInfo.html(help);
        })
    }

    tbv.f.createCitationPage = function () {
        var html = $("<div>"), t;

        //html.addClass('tombioSelect');

        //Generate the citation for the core software
        html.append($("<h3>").text("Citation for FSC Identikit (core software)"))
        t = "This is the reference you can use for the FSC Identikit - in other words the core software.";
        t += " The core version number is updated whenever there is a new major release of the core software.";
        html.append($("<p>").html(t));
        html.append($("<input style='position: relative; top: 0.2em' checked='checked' type='checkbox' name='tbCitationCore' id='tbCitationCore'>"));
        html.append($("<span>").text("Copy citation"));
        html.append($("<b>").html(tbv.f.getCitation(tbv.d.softwareMetadata, "Software")));

        ////Generate the citation for the current tool
        //html.append($("<h3>").text("Citation for last selected visualisation tool"))
        //t = "This is the reference you can use for the last selected visualisation tool.";
        //t += " The tool version number is updated whenever there is a new release of the tool.";
        //t += " If you cite a tool, there's no need to cite the core software separately since it is implicit.";
        //html.append($("<p>").html(t));
        //html.append($("<input style='position: relative; top: 0.2em' type='checkbox' name='tbCitationVis' id='tbCitationVis'>"));
        //html.append($("<span>").text("Copy citation"));
        //html.append($("<b>").html(tbv.f.getCitation(tbv.v.visualisations[tbv.v.lastVis].metadata, "Software", tbv.d.softwareMetadata.title)));

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
            //if (document.getElementById('tbCitationVis').checked) {
            //    $("#tbSelectedCitations").append(tbv.f.getCitation(tbv.v.visualisations[tbv.v.lastVis].metadata, "Software", tbv.d.softwareMetadata.title));
            //}
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

    tbv.f.refreshVisualisation = function () {

        //Score the taxa
        scoreTaxa();

        //Refresh the relevant visualisation
        if (getVisualisation()) getVisualisation().refresh();
        tbv.f.resizeControlsAndTaxa();

        //Viewport diagnostics
        //console.log("viewport width", window.innerWidth)
        //console.log("viewport height", window.innerHeight)

        //console.log("Device width", window.screen.width)
        //console.log("Device height", window.screen.height)
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
                $('#tombioTvkFound').append($('<p>').html("TVK '" + t.tvk + "' found."));
            },
            function (t) {
                $('#tombioTvkNotFound').append($('<p>').html("TVK '" + t.tvk + "' for '" + t.taxon + "' cannot be found."));
            },
            function () {
                divProgress.text("Completed checking TVKs");
            }
        );

        return (html);
    }

    tbv.f.getTaxonCharacterValues = function (taxon) {

        var html = $("<table>");
        html.css("width", "100%");
        html.css("margin", "0px");

        var iChar = 0;
        var lastCharacterGroup = "";

        tbv.d.characters.forEach(function (character) {
            if (character.Status == "key" || character.Status == "display") {

                if (tbv.d.oCharacters.grouped && character.Group != lastCharacterGroup) {
                    var tr = $("<tr>");
                    tr.css("background-color", "rgb(100,100,100)");
                    tr.css("color", "rgb(255,255,255)");
                    var td = $("<td colspan='3'>");
                    tr.append(td.append(character.Group));
                    html.append(tr);
                    lastCharacterGroup = character.Group;
                }

                iChar++;
                var tr = $("<tr>");
                if (iChar % 2 != 0) {
                    tr.css("background-color", "rgb(200,200,200)");
                } else {
                    tr.css("background-color", "rgb(230,230,230)");
                }
                //var tdLabel = $("<td>").append($("<b>").append(character.Label));
                var tdLabel = $("<td>").append(character.Label);

                var tdValue = $("<td>").append(taxon[character.Character].toHtml1());
                tr.append(tdLabel);
                tr.append(tdValue);
                html.append(tr);
            }
        });

        html.find("td").css("padding", "2");

        return html;
    }

    tbv.f.addTaxonImagesToContainer = function (options) {

        var taxon = options.taxon;
        var container = options.container;
        var indexSelected = options.indexSelected ? options.indexSelected : 0;
        var imageRemovalButton = options.imageRemovalButton ? options.imageRemovalButton : false;
        var fImageSelect = options.fImageSelect ? options.fImageSelect : null;
        var height = options.height ? options.height : 400;

        var _this = this;
        var taxonImages = tbv.f.getTaxonImages(taxon);

        if (taxonImages.length == 0) {
            //If there are no images for this taxon, return a message to that effect.
            var noImages = $("<div>").css("margin", "10px");
            noImages.text("No images are specified in the knowledge-base for this taxon.").appendTo(container);
            return;
        }

        var pane = $('<div>')
            .addClass("tombio-galleria-pane")
            .css("position", "relative")
            .css("max-width", "2000px")
            .css("height", height)
            .appendTo(container);

        //Create the image gallery data object
        var data = [];
        taxonImages.forEach(function (ti) {

            var img = {
                image: ti.URI,
                thumb: ti.SmallURI ? ti.SmallURI : null,
                big: ti.LargeURI ? ti.LargeURI : null,
                alt: ti.Caption,
                title: ti.Caption
            }
            data.push(img);
        })
        Galleria.run(pane, {
            transition: 'fade',
            //imageCrop: true,
            //imagePan: true,
            //lightbox: true,
            wait: true,
            dataSource: data,
            theme: 'classic',
            show: indexSelected
        });

        pane.data('galleria').bind('loadfinish', function (e) {
            //Invoke image selection changed callback
            if (fImageSelect) fImageSelect(e.index);
        });

        //Lightbox button. Have to add this because the click event (on image) which by default 
        //opens the lightbox is consumed by the zoom plugin
        $('<img>').attr("src", tbv.opts.tombiopath + "resources/enlarge.png").appendTo(pane)
            .addClass("tombio-galleria-lightbox-button")
            .on("click", function () {
                //Galleria saves its instance inside the data property of the jQuery object
                pane.data('galleria').openLightbox();
            })

        //Image removal button
        if (imageRemovalButton) {
            $('<img>').attr("src", tbv.opts.tombiopath + "resources/remove.png").appendTo(pane)
                .addClass("tombio-galleria-remove-button")
                .on("click", function () {
                    //Galleria saves its instance inside the data property of the jQuery object
                    pane.data('galleria').destroy();
                    container.addClass("userRemoved");
                    container.remove();
                })
        }
    }

    tbv.f.getTaxonImages = function (taxon) {
        //Return list of all media images for taxon, sorted by priority
        var taxonImages = tbv.d.media.filter(function (m) {
            if (m.Taxon == taxon && (m.Type == "image-local" || m.Type == "image-web")) return true;
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });
        return taxonImages;
    }

    tbv.f.getCharacterImages = function (charName, state, useFor) {
        //Return list of character images sorted by priority
        var taxonImages = tbv.d.media.filter(function (m) {
            if (m.Character == charName && (m.Type == "image-local" || m.Type == "image-web")) {
                if (!state || m.State == state) {
                    if (!useFor || !m.UseFor || m.UseFor.split(",").indexOf(useFor) > -1) {
                        return true;
                    }
                }
            }
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });
        return taxonImages;
    }

    tbv.f.addNBNMapToContainer = function (tvk, $parent) {

        //TVK might be passed as a string or as a state value object
        //so coerce.
        tvk = tvk += "";

        var $div = $("<div>").appendTo($parent)
            .css("border", "1px solid black")
            .css("padding", "5px")
            .css("border-radius", "10px");

        //NBN logo
        var $nbnLogo = $('<img>').addClass("tombioNbnLogo")
            .attr('src', tbv.opts.tombiopath + '/resources/nbn-logo-centred.png')
            .addClass(function () {
                if (tvk) return 'tombioSpiningNbn';
            }())
            .appendTo($div);

        //Loading text
        var $nbnLoading = $('<div>').addClass("tombioNbnLoading")
            .css("font-size", "0.8em")
            .text(function () {
                if (tvk) {
                    return "Loading distribution map from NBN...";
                } else {
                    return "No TVK specified for this taxon";
                }
            }())
            .appendTo($div);

        if (tvk) {
            if (tbv.d.nbnMapCache[tvk]) {
                var $img = tbv.d.nbnMapCache[tvk];
                $nbnLogo.attr('src', tbv.opts.tombiopath + '/resources/nbn-logo-colour-centred.png').removeClass('tombioSpiningNbn');
                $nbnLoading.hide();
            } else {
                var src = "https://records-ws.nbnatlas.org/mapping/wms/image?" +
                    "baselayer=world&format=jpg&pcolour=3531FF&scale=on&popacity=1&q=*:*&fq=lsid:" + tvk +
                    "&extents=-11.2538,48.6754,3.0270,60.7995&outline=false&outlineColour=0x000000&pradiusmm=1&dpi=200&widthmm=100";

                var $img = $('<img>')
                    .attr("id", "tombioNbnMapImage")
                    .on('load', function () {
                        $nbnLogo.attr('src', tbv.opts.tombiopath + '/resources/nbn-logo-colour-centred.png').removeClass('tombioSpiningNbn');
                        $nbnLoading.hide();
                    }).on('error', function () {
                        $nbnLogo.removeClass('tombioSpiningNbn');
                        $nbnLoading.text("An error was encountered attemping to retrieve an NBN distribution map for the TVK " + tvk);
                        $img.hide();
                    }).attr("src", src)

                tbv.d.nbnMapCache[tvk] = $img;
            }
        }

        $('<div>').append($img).appendTo($div);
    }

    tbv.f.addTaxonHtmlToContainer = function (taxon, container, iFile) {

        var taxonHtmlFiles = tbv.f.getTaxonHtmlFiles(taxon);

        if (iFile <= taxonHtmlFiles.length - 1) {
            //$.get(taxonHtmlFiles[iFile].URI + "?ver=" + tbv.opts.tombiover, function (data) {
            $.get(taxonHtmlFiles[iFile].URI, function (data) {

                //We need to extract the html in the body tag and ignore everything
                //else. Trouble is when using jQuery to insert the full HTML into 
                //an element such as a div, the body and header don't come through.
                //So we use good old javascript searching for the body start and end
                //tags to find it instead. Then insert that into a div and extract the
                //HTML (which is without body).
                var bStart = data.indexOf("<body");
                var bEnd = data.indexOf("</body");
                var bodyHtml = data.slice(bStart, bEnd);

                var $tmpDiv = $("<div>").html(bodyHtml);
                container.html($tmpDiv.html());

            });
        } else {
            container.html(null);
        }
    }

    tbv.f.getTaxonHtmlFiles = function (taxon) {
        //Return list of all media html files for taxon, sorted by priority
        var taxonHtmlFiles = tbv.d.media.filter(function (m) {
            if (m.Taxon == taxon && m.Type == "html-local") return true;
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });
        return taxonHtmlFiles;
    }

    tbv.f.getCharacterScoreDetails = function (taxon, character) {

        //Character state specified
        var html;
        html = "<p>Specified state(s) for character <b>" + character.Label + "</b>: </p>"

        html += "<ul>";
        if (character.ValueType != "numeric") {
            tbv.d.oCharacters[character.Character].userInput.forEach(function (i) {
                html += "<li><b>";
                html += tbv.d.oCharacters[character.Character].CharacterStateValues[i];
                html += "</b></li>";
            });
        } else {
            html += "<li><b>";
            html += tbv.d.oCharacters[character.Character].userInput;
            html += "</b></li>";
        }
        html += "</ul>";

        //Knowledge-base state for this character and taxon
        html += "<p>Valid state(s) for <b>" + character.Label + "</b> recorded against "
        html += "<b><i>" + taxon.taxon + "</i></b> in the knowledge base: "
        html += "<ul>";
        html += taxon[character.Character].toHtml2();
        html += "</ul>";

        //Knowledge-base parametrs for this character
        html += "<hr/>";
        html += "<p>Knowledge-base <b>weighting</b> for this character: <b>" + character.Weight + "</b></p>";
        html += "<p>Knowledge-base <b>latitude</b> for this character: <b>" + character.Latitude + "</b></p>";

        //Taxon characters scores
        html += "<hr/>";

        //NNormalised to 1...
        html += "<p>Unweighted character score: <b>" + Math.round(taxon[character.Character].score.overall * 100) / 100 + "</b>; ";
        html += "(for, " + Math.round(taxon[character.Character].score.for * 100) / 100;
        html += "; against, " + Math.round((taxon[character.Character].score.against + taxon[character.Character].score.na) * 100) / 100 + ")</p>";
        html += "<p>Weighted character score: <b>" + Math.round(taxon[character.Character].score.overall * character.Weight * 10) / 100 + "</b></p>";

        return html
    }

    tbv.f.sortTaxa = function (array, type) {
        //tbv.f.sortTaxa = function (array, vis, lastPosAttr) {
        //lastPosAttr removed for version 1.7.0 because it resulted in unpredictable sorting
        //e.g. when initialising from URL.

        if (!type) {
            type = "all";
        }

        return array.sort(function (a, b) {

            if (type == "matched") {
                if (a.visState.score.charFor > b.visState.score.charFor) return -1;
                if (b.visState.score.charFor > a.visState.score.charFor) return 1;
            }

            //If we get here, then either type is 'all' or a and b are equal for charFor
            if (a.visState.score.overall > b.visState.score.overall) return -1;
            if (b.visState.score.overall > a.visState.score.overall) return 1;
            if (b.visState.score.overall == a.visState.score.overall) {
                if (a.visState.score.for > b.visState.score.for) return 1;
                if (b.visState.score.for > a.visState.score.for) return -1;
                //if (lastPosAttr == undefined || vis == undefined) return 1;
                //if (a.visState[vis][lastPosAttr] > b.visState[vis][lastPosAttr]) {
                //    return 1;
                //} else {
                //    return -1;
                //}
                if (a.kbPosition > b.kbPosition) {
                    return 1;
                } else {
                    return -1;
                }
            }
        });
    }

    tbv.f.getTaxonTipImage = function (taxon, parentObject) {
        //Return list of all media images for taxon, sorted by priority
        var taxonImages = tbv.d.media.filter(function (m) {
            if (m.Taxon == taxon && (m.Type == "image-local" || m.Type == "image-web")) {
                //Check UseFor field - it id doesn't exist or exists and empty then allow image
                //Otherwise ensure that "tip" is amongst comma separated list
                if (!m.UseFor) {
                    return true;
                } else {
                    var use = false;
                    m.UseFor.split(",").forEach(function (useForVal) {
                        if (useForVal.toLowerCase().trim() == "tip") {
                            use = true;
                        }
                    })
                    return use;
                }
            }
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });


        //In the case of more than one image, just return the first
        if (taxonImages.length > 0) {
            var ret = $('<div/>');
            var taxonImg = taxonImages[0];
            var img = $('<img/>', { src: taxonImg.URI }).appendTo(ret).css("margin-top", 2);
            var cap = $('<figcaption/>', { html: taxonImg.Caption }).appendTo(ret);
            if (taxonImg.ImageWidth) {
                img.css("width", taxonImg.ImageWidth);
            }
            return ret;
        } else {
            return null;
        }
    }

    tbv.f.taxonTag = function (taxonName) {
        //return taxonName.replace(/[|&;$%@"<>()+:.,'\/ ]/g, '');
        return taxonName.replace(/[\/|&;$%@"<>()+:.,' ]/g, '')
    }

    tbv.f.copyTextToClipboard = function (text) {
        //https://codepen.io/Mestika/pen/NxLzNq
        var textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
            console.log('Copying text ' + msg);
        } catch (err) {
            console.log('Oops, unable to copy text');
        }
        document.body.removeChild(textArea);
    }

    tbv.f.createViewURL = function (params) {
        //var url = encodeURI(window.location.href.split('?')[0] + "?" + params.join("&"));
        //Split on ?tbv= to avoid problems with pages that use other params, e.g. Drupal
        var baseURL = window.location.href.split('tbv=')[0];
        var j = (baseURL.indexOf("?") == -1) ? "?" : "&";
        var url = encodeURI(baseURL + j + "tbv=&" + params.join("&"));
        tbv.f.copyTextToClipboard(url);
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

    tbv.f.checkInterface = function (name, template, implementation) {

        if (!tbv.opts.devel) return;

        //Interface checks
        checkProperties("", template, implementation);

        function checkProperties(propString, template, implementation) {
            for (var prop in template) {
                if (template.hasOwnProperty(prop)) {
                    if (implementation[prop]) {
                        //console.log("%cInterface: " + name + propString + "." + prop + " found.", "color: grey");
                        if (typeof template[prop] == "object") {
                            checkProperties(propString + "." + prop, template[prop], implementation[prop])
                        }
                    } else {
                        console.log("%cInterface warning: " + name + propString + "." + prop + " not found in " + name, "color: red");
                    }
                } 
            }
        }
    }

    tbv.f.stateValueHelpPresent = function (charName) {
        //Is there any state value help text?
        for (var i = 0; i < tbv.d.values.length; i++) {
            var v = tbv.d.values[i];
            if (v.Character == charName && v.StateHelp) {
                return true;
            }
        }
        return false;
    }

    tbv.f.getFullCharacterHelp = function(charName) {

        //Clear existing HTML
        var $divHelp = $("<div>");

        $('<p>').html(tbv.d.oCharacters[charName].Help).appendTo($divHelp);

        //Help images for character (not necessarily illustrating particular states)
        var charImages = tbv.d.media.filter(function (m) {
            //Only return images for matching character if no state value is set
            if ((m.Type == "image-local" || m.Type == "image-web") && m.Character == charName && !m.State) {
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
            //if (v.Character == charName && v.StateHelp) return true;
            if (v.Character == charName) return true; //All included as of v1.9
        });

        charText.forEach(function (charState) {

            if (charState.CharacterStateTranslation && charState.CharacterStateTranslation != "") {
                var charStateText = charState.CharacterStateTranslation;
            } else {
                var charStateText = charState.CharacterState;
            }
            if (charState.StateHelp) charStateText += ": ";

            var para = $('<p/>').appendTo($divHelp);
            var spanState = $('<span/>', { text: charStateText}).css("font-weight", "Bold");
            para.append(spanState);
            var spanHelp = $('<span/>', { html: charState.StateHelp }).css("font-weight", "Normal");
            para.append(spanHelp);

            //Help images for character states
            var charImages = tbv.d.media.filter(function (m) {
                //Only return images for matching character if no state value is set
                if ((m.Type == "image-local" || m.Type == "image-web") && m.Character == charName && m.State == charState.CharacterState) return true;
            }).sort(function (a, b) {
                return Number(a.Priority) - Number(b.Priority)
            });

            charImages.forEach(function (charState, i) {

                var $statDiv = $('<div>').appendTo($divHelp);
                $statDiv.css("background-color", "rgb(220,220,220)")
                $statDiv.css("border-radius", "5px")
                $statDiv.css("padding", "5px")
                $statDiv.css("margin-bottom", "10px")

                //var fig = $('<figure/>').appendTo($divHelp);
                var img = $('<img/>', { src: charState.URI })
                var cap = $('<figcaption/>', { html: charState.Caption });
                //fig.append(img).append(cap);
                img.appendTo($statDiv)
                if (i > 0) {
                    //img.css("margin-top", 10);
                }
                cap.appendTo($statDiv);
                if (charState.ImageWidth) {
                    img.css("width", charState.ImageWidth);
                }
            });
        });

        return $divHelp.html();
    }

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

                //Check if character is already in the array because they can appear more
                //than once in the values tab if in more than one stateGroup
                if (character.CharacterStateValues.indexOf(charState) == -1) {
                    character.CharacterStates.push(
                        {
                            CharacterState: charState,
                            StateHelp: val.StateHelp,
                            StateHelpShort: val.StateHelpShort
                        }
                    )
                    character.CharacterStateValues.push(charState);
                } 
            }
        });

        //Now enrich with any text character states specified in the taxa knowledge base
        //that aren't in the values table. These are just added to the array for 
        //each character in the order that they are found. This isn't done for ordinal
        //characters - they *must* be specified on values tab.
        //Changed to work also for Taxonomy characters because required for earthworm vis colouration (20/03/2018)
        tbv.d.characters.forEach(function (character) {
            //if (character.Status == "key" && (character.ValueType == "text" || character.ValueType == "ordinal")) {

            if (character.Group.toLowerCase() == "taxonomy" || (character.Status == "key" && (character.ValueType == "text"))) {
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
            taxon.visState.score.charFor = 0;
            taxon.visState.score.charAgainst = 0;
            taxon.visState.score.charNeutral = 0;
            taxon.visState.score.charUsed = 0;

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

                    //if (taxon.taxon == "Dicymbium brevisetosum") console.log("Dicymbium brevisetosum >>" + taxon[character] + "<<")

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

                } else if (c.ValueType == "ordinal" || c.ValueType == "ordinalcircular" || c.ValueType == "text") {

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

                        if (c.ValueType == "ordinal" || c.ValueType == "ordinalcircular") {
                            //The KB states for this character and taxon.
                            //States that are specific to male or female are represented by suffixes of (m) and (f).
                            var kbTaxonStates = taxon[character].getOrdinalRanges(sex);
                            var posStates = c.CharacterStateValues;
                            var isCircular = c.ValueType == "ordinalcircular";

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

                if (charused == 1) {
                    if (scorefor - scoreagainst - scorena > 0) {
                        taxon.visState.score.charFor += 1;
                    } else {
                        taxon.visState.score.charAgainst += 1;
                    }
                }

                taxon.visState.score.charUsed += charused;
            });
        });
    }
   
}(jQuery, this.tombiovis));