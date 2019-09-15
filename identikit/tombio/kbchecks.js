(function ($, tbv) {
    "use strict";

    tbv.f.defaultsForMissing = function () {

    }

    tbv.f.checkKnowledgeBase = function() {

        /*
        At this point, the following objects are available for checking
        tbv.d.taxa
        tbv.d.characters
        tbv.d.values
        tbv.d.media
        tbv.d.softwareMetadata
        tbv.d.kbconfig
        */
        //Only carry out the validity checks if tbv.d.kbconfig.checkValidity set to yes.
        //Deprecated in version 1.6.0 in favour of top level tbv.opts.checkKB flag (which therefore has precedence).
        if (typeof tbv.opts.checkKB  === "undefined") {
            tbv.opts.checkKB = tbv.d.kbconfig.checkValidity && tbv.d.kbconfig.checkValidity == "yes";
        }
        if (!tbv.opts.checkKB) {
            //From version 1.9 we must go through checks because some modification is
            //carried out here in case of missing data.
            //return true;
        }

        //Create HTML report elements.
        $("<div>").attr("id", "tombioKBReport").css("display", "none").appendTo("#tombiod3vis");
        $("<button>").attr("id", "tombioReload").text("Reload").appendTo("#tombioKBReport");
        $("<button>").attr("id", "tombioContinue").text("Continue").appendTo("#tombioKBReport");

        var taxa = true;
        var characters = true;
        var values = true;
        var taxavalues = true;
        var media = true;
        var taxonomy = true;
        var metadata = true;
        var errors, errors2;
        var field, requiredFields, optionalFields;
        var defaultValue, defaultValues;

        //Reload button to avoid cache when KB problems are fixed.
        $('#tombioReload')
          .click(function (event) {
              //Force reload of entire page - ignoring cache.
              window.location.reload(true);
          })

        //Continue button to force continue.
        $('#tombioContinue')
          .css("margin-left", "5px")
          .click(function (event) {
              $("#downloadspin").show();
              $('#tombioKBReport').hide();
              //If I don't use a setTimeout function here, the spinner doesn't re-appear
              setTimeout(function () { tbv.f.loadcomplete("force") }, 100);
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
        errors = $('<ul>');
        //If taxa.csv was missing, tbv.d.taxa will not be present
        if (!tbv.d.taxa) {
            console.log("ad")
            errors.append($('<li class="tombioValid3">').html("The file 'taxa.csv' could not be found in the the knowledge-base folder '" + tbv.opts.tombiokbpath + "'"));
            $('#tombioKBReport').append($('<h4>').text('On the taxa worksheet...'));
            $('#tombioKBReport').append(errors);
            $('#tombioKBReport').show();
            return; //End checking here
        }

        //Derive some variables for use later
        var charactersFromCharactersTab = tbv.d.characters.map(function (character) {
            return character.Character;
        });

        var charactersFromTaxaTab = Object.keys(tbv.d.taxa[0]).filter(function (character) {
            return character != "";
        });
        var charactersFromValuesTab = [];
        tbv.d.values.forEach(function (row) {
            if (row.Character && charactersFromValuesTab.indexOf(row.Character) == -1) {
                charactersFromValuesTab.push(row.Character);
            }
        });

        var numericCharactersInTaxaTab = tbv.d.characters.filter(function (character) {
            return character.ValueType == "numeric" && charactersFromTaxaTab.indexOf(character.Character) > -1;
        }).map(function (character) {
            return character.Character;
        });

        var allOrdinalCharactersInTaxaTab = tbv.d.characters.filter(function (character) {
            return (character.ValueType == "ordinal" || character.ValueType == "ordinalcircular") && charactersFromTaxaTab.indexOf(character.Character) > -1;
        }).map(function (character) {
            return character.Character;
        });

        var circularOrdinalCharactersInTaxaTab = tbv.d.characters.filter(function (character) {
            return (character.ValueType == "ordinalcircular") && charactersFromTaxaTab.indexOf(character.Character) > -1;
        }).map(function (character) {
            return character.Character;
        });

        //Metadata
        errors = $('<ul>');

        //Check that required columns are present on the config tab
        requiredFields = ["Key", "Type", "Mandatory", "Value", "Date", "Notes"];

        if (tbv.d.config.columns) {
            requiredFields.forEach(function (f) {
                if ($.inArray(f, tbv.d.config.columns) == -1) {
                    errors.append($('<li class="tombioValid3">').html("The mandatory column <b>'" + f + "'</b> is missing."));
                    metadata = false;
                }
            })
        } else {
            //No value for tbv.d.media.columns indicates that it is likely that the CSV was missing
            errors.append($('<li class="tombioValid2">').html("No CSV file was found. Identikit can function without it by providing some dummy values."));
            metadata = false;

            //Generate default values
            tbv.d.config.columns = requiredFields;
            var now = new Date();
            var year = now.getYear();
            tbv.d.kbmetadata["title"] = "Indentikit - no title provided";
            tbv.d.kbmetadata["year"] = String(1900 + year);
            tbv.d.kbmetadata["authors"] = "Anon";
            tbv.d.kbmetadata["version"] = "0.1";
        }

        //Metadata title
        if (!metadataValue('title', "You should specify a title for the KB (Key - title). This is used to generate a citation. A default will be used.")) {
            tbv.d.kbmetadata["title"] = "Indentikit - no title provided";
        }
        //Metadata year
        if (!metadataValue('year', "You should specify a year for the KB (Key - year). This is used to generate a citation. Curent year will be used.")) {
            var now = new Date();
            var year = now.getYear();
            tbv.d.kbmetadata["year"] = String(1900 + year);
        }
        //Metadata version 
        if (!metadataValue('authors', "You should specify one or more authors for the KB (Key - authors). This is used to generate a citation. Authors will appear in the citation exactly as you specify them.")) {
            tbv.d.kbmetadata["authors"] = "Anon";
        }
        //Metadata version 
        if (!metadataValue('version', "You should specify a version for the KB (Key - version). This is used to generate a citation. The value 0.1 will be used.")) {
            tbv.d.kbmetadata["version"] = "0.1";
        } 
        if (!metadata) {
            $('#tombioKBReport').append($('<h4>').text('On the config worksheet...'));
            $('#tombioKBReport').append(errors);
        }

        function metadataValue(key, error) {
            if (!tbv.d.kbmetadata[key] || String(tbv.d.kbmetadata[key]).trim() == "") {
                metadata = false;
                errors.append($('<li class="tombioValid2">').text(error));
                return false;
            } else {
                return true;
            }
        }

        //Taxa
        errors = $('<ul>');

        //Taxon column must be present
        if (!tbv.d.taxa[0]["taxon"]) {
            errors.append($('<li class="tombioValid3">').html("There must be a column called <i>taxon</i> which stores the names of the taxa you are working with."));
            taxa = false;
        }
        //Check that character names are alphanumeric without any space
        var regexCharID = /^[a-zA-Z0-9\-_]+$/;
        Object.keys(tbv.d.taxa[0]).forEach(function (character, iCol) {
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
            tbv.d.taxa.forEach(function (taxon) {
                value = taxon[character];
                //Sometimes, unpredictably, we seem to get here and on line that tables value.substr we get a 'value.substr is
                //not a function' error - presumably because value is undefined. Can't work out why, but put an error trap
                //in here to put out some diagnostics.
                if (!value && value != "") {
                    console.log(taxon.taxon, character, value)
                }
                
                if (!(value == "" ||
                    value == "n/a" ||
                    value == "novalue" ||
                    value == "?" ||
                    value.substr(0, 1) == "#" || //ignores comment out character state values
                    regexNumericValue.test(value) ||
                    regexNumericRange.test(value))) {
                    errors.append($('<li class="tombioValid3">').html("The value <b>'" + value + "'</b> is not a valid for the numeric character <b>'" + character + "'</b> and taxon <b>'" + taxon.taxon + "'</b>. Values must be a number or a range in the form '[x-y]'. (Other permitted values are '?', 'n/a', 'novalue' and no specified value.)"));
                    taxa = false;
                }
            });
        });

        //Check that all ordinal character values on the taxa worksheet are specified in the correct
        //format and have a corresponding value on the values worksheet.
        var regexOrdinalRange = /^\[[^-]+-[^-]+\]$/;
        allOrdinalCharactersInTaxaTab.forEach(function (character) {

            //Get the permitted ordinal values for this character
            var fullOrdinalRange = tbv.d.values.filter(function (vRow) {
                return vRow.Character == character;
            });
            //Get the stateGroups for this character
            var stateGroups = [];
            tbv.d.values.forEach(function (vRow) {
                if (vRow.Character == character && vRow.StateGroup && stateGroups.indexOf(vRow.StateGroup) == -1) {
                    stateGroups.push(vRow.StateGroup);
                }
            })

            tbv.d.taxa.forEach(function (taxon) {
                value = taxon[character];

                var stopChecking = false;
                if (!(value == "" ||
                     value == "n/a" ||
                     value == "novalue" ||
                     value == "?" ||
                     value.substr(0, 1) == "#")) { //ignores comment out character state values

                    //Split on the or character (|) and check each part
                    var orValues = value.split("|").forEach(function (orValue) {
                        var continueChecking = true;
                        orValue = orValue.trim();
                        //Trim off any male/female markers
                        if (orValue.length > 3 && (orValue.substr(orValue.length - 3, 3) == '(m)' || orValue.substr(orValue.length - 3, 3) == '(f)')) {
                            orValue = orValue.substr(0, orValue.length - 3).trim();
                        }
                        //If value is of the format [v1-v2] then this is an ordinal range, so split it.
                        if (regexOrdinalRange.test(orValue)) {
                            var rangeValues = orValue.slice(1, -1).split("-").slice(0,2); //Ignore parts after first two!
                        } else {
                            var rangeValues = [orValue]
                        }

                        //Ensure that all specified ordinal values on the taxa tab are represented in the values tab
                        //where they may be represented either as a state value (CharacterState), or a state group (StateGroup)
                        rangeValues.forEach(function (rValue) {
                            rValue = rValue.trim();
                            var matchingValues = fullOrdinalRange.filter(function (vRow) {
                                return vRow.CharacterState == rValue;
                            });
                            if (matchingValues.length == 0) {
                                //No match found in ordinal values, but now check if theres a match for state group.
                                if (stateGroups.indexOf(rValue) == -1) {
                                    errors.append($('<li class="tombioValid2">').html("The value <b>'" + rValue + "'</b> for character <b>'" + character + "'</b> and taxon <b>'" + taxon.taxon + "'</b> is not represented in the values worksheet either as a state value or a state group. All character state values for ordinal and ordinalcircular characters must be represented on the values worksheet."));
                                    taxa = false;
                                    continueChecking = false;
                                } 
                            }
                        })

                        //For ordinal ranges, unless an ordinalcircular, then start value must come before end value
                        if (continueChecking && rangeValues.length == 2 && circularOrdinalCharactersInTaxaTab.indexOf(character) == -1) {
                            
                            var fullOrdinalRangeValues = fullOrdinalRange.map(function (v) { return v.CharacterState });

                            if (fullOrdinalRangeValues.indexOf(rangeValues[0]) > fullOrdinalRangeValues.indexOf(rangeValues[1])) {
                                errors.append($('<li class="tombioValid2">').html("The ordinal range <b>'" + orValue + "'</b> for character <b>'" + character + "'</b> and taxon <b>'" + taxon.taxon + "'</b> is not valid since the start of the range appears after the end in the ordinal values expressed on the values worksheet for this character."));
                                taxa = false;
                            }
                        }
                    })   
                }
            });
        });

        if (!taxa) {
            $('#tombioKBReport').append($('<h4>').text('On the taxa worksheet...'));
            $('#tombioKBReport').append(errors);
        }

        //Characters
        errors = $('<ul>');
        requiredFields = ["Group", "Character", "Label", "Help", "Status", "ValueType", "ControlType", "Params", "Weight"];
        optionalFields = ["HelpShort"];
        if (tbv.d.characters.columns) {

            tbv.d.characters.forEach(function (char) {
                //If Group value is missing, replace with 'None'
                //Fix for https://github.com/burkmarr/tombiovis/issues/43
                if (char.Group == "") {
                    char.Group = "None";
                }
            });
        } else {
            //No value for tbv.d.characters.columns indicates that it is likely that the CSV was missing
            errors.append($('<li class="tombioValid2">').html("No CSV file was found. Identikit can function without it by providing some default values, but you will need to use it to make use of many Identikit features."));
            characters = false;
            tbv.d.characters.columns = [...requiredFields, ...optionalFields, "Latitude"];

            tbv.d.taxa.columns.forEach(function(c) {

                tbv.d.characters.push({

                    Group: c.toLowerCase() == "taxon" ? "taxonomy" : "None",
                    Character: c.toLowerCase(),
                    Label: c,
                    Help: "",
                    HelpShort: "",
                    Status: c.toLowerCase() == "taxon" ? "" : "key",
                    ValueType: "text",
                    ControlType: "single",
                    Params: "",
                    Weight: "10",
                    Latitude: ""
                })             
                charactersFromCharactersTab.push(c.toLowerCase());
            }) 
        }
       
        //Check that required columns are present on the characters tab  
        requiredFields.forEach(function (f) {
            if ($.inArray(f, tbv.d.characters.columns) == -1) {
                errors.append($('<li class="tombioValid3">').html("The madatory column <b>'" + f +"'</b> is missing."));
                characters = false;
            }
        })
        optionalFields.forEach(function (f) {
            if ($.inArray(f, tbv.d.characters.columns) == -1) {
                errors.append($('<li class="tombioValid1">').html("The optional column <b>'" + f + "'</b> is missing."));
                characters = false;
            }
        })
        //Check that either 'Strictness' or 'Latitdue' is present. Warn if strictness is used.
        if ($.inArray("Strictness", tbv.d.characters.columns) == -1 && $.inArray("Latitude", tbv.d.characters.columns) == -1) {
            errors.append($('<li class="tombioValid3">').html("The column <b>'Latitude'</b> is missing."));
            characters = false;
        } else if ($.inArray("Strictness", tbv.d.characters.columns) > -1 && $.inArray("Latitude", tbv.d.characters.columns) > -1) {
            errors.append($('<li class="tombioValid1">').html("Columns <b>'Strictness'</b> and  <b>'Latitude'</b> are both specified. 'Strictness' has been deprecated and will be ignored in favour of 'Latitude'."));
            characters = false;
        } else if ($.inArray("Strictness", tbv.d.characters.columns) > -1) {
            errors.append($('<li class="tombioValid1">').html("You are using <b>'Strictness'</b> which has been deprecated (since version 1.7.0) in favour of <b>'Latitude'</b>. Strictness will still work, but you are advised to change to Latitude (see documentation)."));
            characters = false;
        }
 
        //Check that Taxon column has a Group value of Taxonomy
        var taxonRows = tbv.d.characters.filter(function (c) { return (c.Character == "taxon") });
        if (taxonRows.length > 0 && taxonRows[0].Group.toLowerCase() != "taxonomy") {
            errors.append($('<li class="tombioValid2">').html("The Taxon character must have a Group value of 'Taxonomy'. It is currently set to '" + taxonRows[0].Group + "'. Identikit will use 'Taxonomy' instead."));
            characters = false;
            taxonRows[0].Group = "taxonomy";
        }
        //Check that all characters (column headers) on the taxa tab have corresponding values in the characters tab.
        charactersFromTaxaTab.forEach(function (character, iCol) {
            if (charactersFromCharactersTab.indexOf(character) == -1) {
                if (character == "taxon") {
                    //Add the taxon column silently. Before version 1.9.0 the column "taxon"
                    //had to be added to the characters worksheet, but from 1.9.0 it doesn't have
                    //to be there.
                    tbv.d.characters.push({
                        Group: "taxonomy",
                        Character: "taxon"
                    })
                } else {
                    errors.append($('<li class="tombioValid2">').html("There is no row on the <i>characters</i> worksheet for the character <b>'" + character + "'</b> represented by a column (column " + (iCol + 1) + ") on the <i>taxa</i> worksheet. All columns on the <i>taxa</i> tab must be represented by a row in the <i>characters</i> worksheet regardless of whether or not they are used. Identikit will add default values, but to take full advantage of some facilities you wil need to add a row to the knowledge-base."));
                    characters = false;
                    tbv.d.characters.columns.push(character)
                    tbv.d.characters.push({
                        Group: "None",
                        Character: character,
                        Label: character,
                        Help: "",
                        HelpShort: "",
                        Status: "key",
                        ValueType: "text",
                        ControlType: "single",
                        Params: "",
                        Weight: "10",
                        Latitude: ""
                    })
                } 
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
        tbv.d.characters.filter(function (c) { return (c.Status == "key") }).forEach(function (c) {
            var validValueType = ["numeric", "ordinal", "ordinalcircular", "text"];
            var validControlType = ["single", "multi", "spin"];
            var validControlsForValues = {
                numeric: ["spin"],
                text: ["single", "multi"],
                ordinal: ["single", "multi"],
                ordinalcircular: ["single", "multi"]
            }
            var ValueTypeOK = true;
            var ControlTypeOK = true;

            //Check that all characters in characters tab that are used in the key have a weight value.
            var regexWeight = /^([1-9]|10)$/;
            if (!regexWeight.test(c.Weight)) {
                errors.append($('<li class="tombioValid3">').html("You must specify a 'Weight' value for <b>'" + c.Character + "'</b> because it has a 'Status' value of 'key'."));
                characters = false;
            }
            //Check that all numeric, ordinal and ordinal-circular characters have a strictness value between 0 and 10 (if specified)
            if (typeof (c.Strictness) != "undefined") {
                if (c.Strictness != "") {
                    var regexStrictness = /^([0-9]|10)$/;
                    if ((c.ValueType == "numeric" || c.ValueType == "ordinal" || c.ValueType == "ordinalcircular") && !regexStrictness.test(c.Strictness)) {
                        errors.append($('<li class="tombioValid2">').html("For numeric, ordinal and ordinalcircular characters, 'Strictness', if specified, must be between 0 and 10. There is an invalid 'Strictness' value for <b>'" + c.Character + "'</b>."));
                        characters = false;
                    }
                }
            }
            //Check that all numeric, ordinal and ordinal-circular characters have a numeric Latitude value(if specified)
            if (typeof (c.Latitude) != "undefined") {
                if (c.Latitude != "") {
                    var regexLatitudeN = /^[0-9]\d*(\.\d+)?$/;
                    if ((c.ValueType == "numeric") && !regexLatitudeN.test(c.Latitude)) {
                        errors.append($('<li class="tombioValid2">').html("For numeric characters, 'Latitude', if specified, must be a valid number. There is an invalid 'Latitude' value for <b>'" + c.Character + "'</b>."));
                        characters = false;
                    }
                    var regexLatitudeI = /^(?:[0-9]|0[1-9]|10)$/;
                    if ((c.ValueType == "ordinal" || c.ValueType == "ordinalcircular") && !regexLatitudeI.test(c.Latitude)) {
                        errors.append($('<li class="tombioValid2">').html("For ordinal and ordinalcircular characters, 'Latitude', if specified, must be a whole number. There is an invalid 'Latitude' value for <b>'" + c.Character + "'</b>."));
                        characters = false;
                    }
                }
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
            //Check that any character with HelpShort set also has Help set.
            if (c.HelpShort && !c.Help) {
                errors.append($('<li class="tombioValid2">').html("A value for 'HelpShort' is set but there is no value for 'Help' for <b>'" + c.Character + "'</b>. You can set 'Help' without setting 'HelpShort', but not the other way around."));
                characters = false;
            }
        })
        if (!characters) {
            $('#tombioKBReport').append($('<h4>').text('On the characters worksheet...'));
            $('#tombioKBReport').append(errors);
        }

        //Values tab
        errors = $('<ul>');
        errors2 = $('<ul>');

        requiredFields = ["Character", "CharacterState", "CharacterStateTranslation", "StateHelp"];
        optionalFields = ["StateHelpShort", "StateGroup"];
        if (tbv.d.values.columns) {
            //Check that required columns are present on the values tab
            
            requiredFields.forEach(function (f) {
                if ($.inArray(f, tbv.d.values.columns) == -1) {
                    errors.append($('<li class="tombioValid3">').html("The madatory column <b>'" + f + "'</b> is missing."));
                    values = false;
                }
            })
            
            optionalFields.forEach(function (f) {
                if ($.inArray(f, tbv.d.values.columns) == -1) {
                    errors.append($('<li class="tombioValid1">').html("The optional column <b>'" + f + "'</b> is missing."));
                    values = false;
                }
            })

            //Check that all characters in the values tab have corresponding entry in the characters tab.
            charactersFromValuesTab.forEach(function (character) {
                if (charactersFromCharactersTab.indexOf(character) == -1) {
                    errors.append($('<li class="tombioValid2">').html("There is no row on the <i>characters</i> worksheet for the character <b>'" + character + "'</b> represented in the <i>values</i> worksheet."));
                    values = false;
                }
            });

            tbv.d.values.forEach(function (v) {
                //Check that any character with StateHelpShort set also has StateHelp set.
                if (v.StateHelpShort && !v.StateHelp) {
                    errors.append($('<li class="tombioValid2">').html("A value for 'StateHelpShort' is set but there is no value for 'StateHelp' for <b>'" + v.Character + " - " + v.CharacterState + "'</b>. You can set 'StateHelp' without setting 'StateHelpShort', but not the other way around."));
                    values = false;
                }
            })
        } else {
            //No value for tbv.d.values.columns indicates that it is likely that the CSV was missing
            errors.append($('<li class="tombioValid2">').html("No CSV file was found. Identikit can function without it, but you need it to take advantage of some features."));
            values = false;
            //tbv.d.values.columns = [...requiredFields, ...optionalFields];
        }

        if (!values) {
            $('#tombioKBReport').append($('<h4>').text('On the values worksheet...'));
            $('#tombioKBReport').append(errors);
        }

        //Image media files
        errors = $('<ul>');

        //Check that required columns are present on the media tab
        requiredFields = ["URI", "ImageWidth", "Type", "Priority", "Caption", "Taxon", "Character", "State"];
        optionalFields = ["UseFor", "TipStyle", "SmallURI", "LargeURI"];
        defaultValues = {
            ImageWidth: "100%",
            Type: "image-local"
        }

        if (tbv.d.media.columns) {

            requiredFields.forEach(function (f) {
                if ($.inArray(f, tbv.d.media.columns) == -1) {
                    defaultValue = defaultValues[f] ? defaultValues[f]  : ""; 
                    errors.append($('<li class="tombioValid3">').html("The madatory column <b>'" + f + "'</b> is missing."));
                    media = false;
                }
            })
            
            optionalFields.forEach(function (f) {
                if ($.inArray(f, tbv.d.media.columns) == -1) {
                    errors.append($('<li class="tombioValid1">').html("The optional column <b>'" + f + "'</b> is missing."));
                    media = false;
                }
            })
    
            tbv.d.media.filter(function (m) { return (m.Type == "image-local" || m.Type == "image-web") }).forEach(function (m) {
    
                if (m.Character != "" && charactersFromCharactersTab.indexOf(m.Character) == -1) {
                    //A character on the media tab does not appear on the characters tab
                    errors.append($('<li class="tombioValid2">').html("An image is specified for the character <b>'" + m.Character + "'</b> on the media worksheet, but that character is not on the characters worksheet."));
                    media = false;
                }
    
                if (m.State != "" && m.Character == "") {
                    //Value specified without character on media tab
                    errors.append($('<li class="tombioValid2">').html("An image is specified for the state value <b>'" + m.State + "'</b> on the media worksheet, but no character is specified."));
                    media = false;
                }
                // if (m.State != "" && m.Character != "") {
                //     //If a character/value pair is not present on values tab or does not have an associated help value
                //     var values = tbv.d.values.filter(function (v) { return (m.Character == v.Character && m.State == v.CharacterState) });
    
                //     if (values.length == 0 || values[0].StateHelp == "") {
                //         errors.append($('<li class="tombioValid2">').html("An image is specified for the character <b>'" + m.Character + "'</b> and state <b>'" + m.State + "'</b> on the media worksheet, but no corresponding pair is found with help text on the values worksheet, so it won't be displayed."));
                //         media = false;
                //     }
                // }
            })
        } else {
            //No value for tbv.d.media.columns indicates that it is likely that the CSV was missing
            errors.append($('<li class="tombioValid2">').html("No CSV file was found. Identikit can function without it, but you need it to take advantage of some features."));
            media = false;
        }
        
        if (!media) {
            $('#tombioKBReport').append($('<h4>').text('On the media worksheet...'));
            $('#tombioKBReport').append(errors);
        }

        //Taxonomy checks
        errors = $('<ul>');
        //Sort characters so that taxonomy types (Group == Taxonomy) always appear before 
        //other Taxonomy types and before the taxon character. Otherwise keep the existing
        //order - specified by temporary atttribute sortIndex.
        tbv.d.characters.forEach((c,i)=>c.sortIndex = i);
        tbv.d.characters.sort(function(a, b){
            let score = c => {
                if (c.Character == "taxon") {
                    return 2000 + c.sortIndex;
                } else if (c.Group.toLowerCase() == "taxonomy") {
                    return 1000 + c.sortIndex;
                } else {
                    return 3000 + c.sortIndex;
                }
            }
            return score(a) - score(b);
        })
        tbv.d.characters.forEach((c,i)=>delete c.sortIndex);

        var taxonomyCharacters = tbv.d.characters.filter(function (c) { return (c.Group.toLowerCase() == "taxonomy") });
        var lastTaxonomyCol = taxonomyCharacters.length > 1 ? taxonomyCharacters[taxonomyCharacters.length - 1].Character : null;
        //Check that the row representing Taxon is the last Taxonomy group column on the Characters tab
        if (lastTaxonomyCol && lastTaxonomyCol != "taxon") {
            errors.append($('<li class="tombioValid3">').html("The last Taxonomy row representing '" + lastTaxonomyCol + "' on the characters worksheet appears below the row representing 'Taxon' - it must come above."));
            taxonomy = false; //Previous sorting should now make this redundant.
        }

        //Check that we have a strict hierarchical taxonomy
        //console.log(lastTaxonomyCol, taxonomyCharacters.length)
        if (lastTaxonomyCol == "Taxon" && taxonomyCharacters.length > 2) {
            for (var iRank = taxonomyCharacters.length - 2; iRank > 0; iRank--) {
                //Each unique 
                var rankCol = taxonomyCharacters[iRank].Character;
                var rankColName = taxonomyCharacters[iRank].Label;
                var parentRankCol = taxonomyCharacters[iRank - 1].Character;
                var parentRankColName = taxonomyCharacters[iRank - 1].Label;
                var uniqueRankValues = [];
                tbv.d.taxa.forEach(function (t) {
                    if (t[rankCol] != "" && uniqueRankValues.indexOf(t[rankCol]) == -1) {
                        uniqueRankValues.push(t[rankCol]);
                    }
                })
                uniqueRankValues.forEach(function (rankVal) {
                    var uniqueHigherRankValues = [];
                    var taxa = tbv.d.taxa.filter(function (t) { return (t[rankCol] == rankVal) });
                    taxa.forEach(function (t) {
                        if (uniqueHigherRankValues.indexOf(t[parentRankCol]) == -1) {
                            uniqueHigherRankValues.push(t[parentRankCol]);
                        }
                    })
                    if (uniqueHigherRankValues.length > 1) {
                        errors.append($('<li class="tombioValid3">').html("Taxa of " + rankColName + " " + rankVal +
                            " are represented by more than one " + parentRankColName + ", breaking the rules of a strict hierarchical taxonomy." +
                            " Check that the taxonomy columns are specified in the correct order on the characters worksheet " +
                            " (at the moment " + parentRankColName + " is specified at a higher level than " + rankColName + ")." +
                            " If they are, then check the values for " + parentRankColName + " and " + rankColName + " on the taxa worksheet."));
                        taxonomy = false;
                    }
                })
                //console.log(rankCol, uniqueRankValues);
            }
        }
        if (!taxonomy) {
            $('#tombioKBReport').append($('<h4>').text('Taxonomy problems...'));
            $('#tombioKBReport').append(errors);
        }

        //Final output
        if (taxa && characters && values && media && metadata & taxonomy) {
            return true;
        } else {
            if (tbv.opts.checkKB) {
                $('#tombioKBReport').show();
                $("#downloadspin").hide();
                return false;
            } else {
                return true;
            }
        }
    }

    tbv.f.mediaCheck = function(uriField, fSuccess, fFail){
        //Using Promises
        var pAll = [];

        tbv.d.media.filter(function (m) { return (m[uriField] &&(m.Type == "image-local" || m.Type == "html-local" || m.Type == "image-web")) }).forEach(function (m) {

            var p = new Promise(function (resolve, reject) {

                if (m.Type == "image-web") {
                    //It's generally not possible to check presence of an image file on another web site asynchronously 
                    //because CORS headers will generally not be set. Only way I can find to check presence of web image is
                    //to load the whole image which will be very slow if lots of images are referenced.
                    var i = new Image();
                    i.onload = function () {
                        resolve(m[uriField]);
                    }
                    i.onerror = function () {
                        reject(m[uriField]);
                    }
                    i.src = m[uriField];
                } else {
                    $.ajax({
                        url: m[uriField],
                        type: 'HEAD',
                        success: function () {
                            //console.log("Found", m[uriField] )
                            resolve(m[uriField]);
                        },
                        error: function () {
                            //console.log("NOT Found", m[uriField])
                            reject(m[uriField]);
                        }
                    });
                }
            })
            .then(
                function (uri) {
                    fSuccess(uri)
                },
                function (uri) {
                    fFail(uri)
                }
            );
            pAll.push(p);
        })
        return (Promise.all(pAll));
    }

    tbv.f.tvkCheck = function (fSuccess, fFail, fComplete) {
        //Using Promises
        var pAll = [];

        if (!tbv.d.oCharacters.tvk) {
            fComplete();
            return;
        }

        tbv.d.taxa.forEach(function (t) {
            if (t.tvk.kbValue) {
                var p = new Promise(function (resolve, reject) {

                    $.ajax({
                        url: "https://species-ws.nbnatlas.org/species/" + t.tvk.kbValue,
                        dataType: "json",
                        success: function () {
                            resolve(t);
                        },
                        error: function () {
                            reject(t);
                        }
                    });
                }).then(
                    function (t) {
                        fSuccess(t)
                    },
                    function (t) {
                        fFail(t)
                    }
                    );
                pAll.push(p);
            }
        })

        Promise.all(pAll).then(function () {
            fComplete();
        });
    }

}(jQuery, this.tombiovis));