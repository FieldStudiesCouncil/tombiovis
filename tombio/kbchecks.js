(function ($, core) {

    "use strict";

    core.checkKnowledgeBase = function() {

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
        var taxonomy = true;
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

        var allOrdinalCharactersInTaxaTab = core.characters.filter(function (character) {
            return (character.ValueType == "ordinal" || character.ValueType == "ordinalCircular") && charactersFromTaxaTab.indexOf(character.Character) > -1;
        }).map(function (character) {
            return character.Character;
        });

        var circularOrdinalCharactersInTaxaTab = core.characters.filter(function (character) {
            return (character.ValueType == "ordinalCircular") && charactersFromTaxaTab.indexOf(character.Character) > -1;
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
                //Sometimes, unpredictably, we seem to get here and on line that tables value.substr we get a 'value.substr is
                //not a function' error - presumably because value is undefined. Can't work out why, but put an error trap
                //in here to put out some diagnostics.
                if (!value && value != "") {
                    console.log(taxon.Taxon, character, value)
                }
                
                if (!(value == "" ||
                    value == "n/a" ||
                    value == "?" ||
                    value.substr(0, 1) == "#" || //ignores comment out character state values
                    regexNumericValue.test(value) ||
                    regexNumericRange.test(value))) {
                    errors.append($('<li class="tombioValid3">').html("The value <b>'" + value + "'</b> is not a valid for the numeric character <b>'" + character + "'</b> and taxon <b>'" + taxon.Taxon + "'</b>. Values must be a number or a range in the form '[x-y]'. (Other permitted values are '?', 'n/a' and no value.)"));
                    taxa = false;
                }
            });
        });

        //Check that all ordinal character values on the taxa worksheet are specified in the correct
        //format and have a corresponding value on the values worksheet.
        var regexOrdinalRange = /^\[[^-]+-[^-]+\]$/;
        allOrdinalCharactersInTaxaTab.forEach(function (character) {

            core.taxa.forEach(function (taxon) {
                value = taxon[character];
                var stopChecking = false;
                if (!(value == "" ||
                     value == "n/a" ||
                     value == "?" ||
                     value.substr(0, 1) == "#")) { //ignores comment out character state values

                    //Get the permitted ordinal values for this character
                    var fullOrdinalRange = core.values.filter(function (vRow) {
                        return vRow.Character == character;
                    });

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
                        rangeValues.forEach(function (rValue) {
                            rValue = rValue.trim();
                            var matchingValues = fullOrdinalRange.filter(function (vRow) {
                                return vRow.CharacterState == rValue;
                            });
                            if (matchingValues.length == 0) {
                                errors.append($('<li class="tombioValid2">').html("The value <b>'" + rValue + "'</b> for character <b>'" + character + "'</b> and taxon <b>'" + taxon.Taxon + "'</b> is not represented in the values worksheet. All character state values for ordinal and ordinalCircular characters must be represented on the values worksheet."));
                                taxa = false;
                                continueChecking = false;
                            }
                        })

                        //For ordinal ranges, unless an ordinalCircular, then start value must come before end value
                        if (continueChecking && rangeValues.length == 2 && circularOrdinalCharactersInTaxaTab.indexOf(character) == -1) {
                            
                            var fullOrdinalRangeValues = fullOrdinalRange.map(function (v) { return v.CharacterState });

                            if (fullOrdinalRangeValues.indexOf(rangeValues[0]) > fullOrdinalRangeValues.indexOf(rangeValues[1])) {
                                errors.append($('<li class="tombioValid2">').html("The ordinal range <b>'" + orValue + "'</b> for character <b>'" + character + "'</b> and taxon <b>'" + taxon.Taxon + "'</b> is not valid since the start of the range appears after the end in the ordinal values expressed on the values worksheet for this character."));
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
        //Check that Taxon column has a Group value of Taxonomy
        var taxonRows = core.characters.filter(function (c) { return (c.Character == "Taxon") });
        if (taxonRows.length > 0 && taxonRows[0].Group != "Taxonomy") {
            errors.append($('<li class="tombioValid3">').html("The Taxon character must have a Group value of 'Taxonomy'. It is currently set to '" + taxonRows[0].Group + "'."));
            characters = false;
        }
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
            var validValueType = ["numeric", "ordinal", "ordinalCircular", "text"];
            var validControlType = ["single", "multi", "spin"];
            var validControlsForValues = {
                numeric: ["spin"],
                text: ["single", "multi"],
                ordinal: ["single", "multi"],
                ordinalCircular: ["single", "multi"]
            }
            var ValueTypeOK = true;
            var ControlTypeOK = true;

            //Check that all characters in characters tab that are used in the key have a weight value.
            var regexWeight = /^([1-9]|10)$/;
            if (!regexWeight.test(c.Weight)) {
                errors.append($('<li class="tombioValid3">').html("You must specify a 'Weight' value for <b>'" + c.Character + "'</b> because it has a 'Status' value of 'key'."));
                characters = false;
            }
            //Check that all numeric, ordinal and ordinal-circular characters have a strictness value between 0 and 10.
            var regexStrictness = /^([0-9]|10)$/;
            if ((c.ValueType == "numeric" || c.ValueType == "ordinal" || c.ValueType == "ordinalCircular") && !regexStrictness.test(c.Strictness)) {
                errors.append($('<li class="tombioValid3">').html("For numeric, ordinal and ordinalCircular characters, you must specify a 'Strictness' value of between 0 and 10. There is an invalid 'Strictness' value for <b>'" + c.Character + "'</b>."));
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
        //Check that all characters in the values tab have corresponding entry in the characters tab.
        charactersFromValuesTab.forEach(function (character) {
            if (charactersFromCharactersTab.indexOf(character) == -1) {
                errors.append($('<li class="tombioValid2">').html("There is no row on the <i>characters</i> worksheet for the character <b>'" + character + "'</b> represented in the <i>values</i> worksheet."));
                values = false;
            }
        });

        core.values.forEach(function (v) {
            //Check that any character with StateHelpShort set also has StateHelp set.
            if (v.StateHelpShort && !v.StateHelp) {
                errors.append($('<li class="tombioValid2">').html("A value for 'StateHelpShort' is set but there is no value for 'StateHelp' for <b>'" + v.Character + " - " + v.CharacterState + "'</b>. You can set 'StateHelp' without setting 'StateHelpShort', but not the other way around."));
                values = false;
            }
        })

        //******************************************************************************************
        //RJB The following checks were removed 26-05-2017 because I consider them to be overkill.
        //In the case of ordinal characters, values on the value tab may not always be represented
        //on the taxa tab - especially in the early stages of KB building. Separate checks have
        //now been implemented to ensure that any ordinal value on the taxa tab is represented on
        //the values tab.
        //If reinstated at any point they will need updating to account for changes to the specification
        //of ordinal characters (ordinal ranges) and the fact that some checking to see that all ordinal
        //characters represented on taxa tab are also represented on values tab have been introduced
        //before this point.
        //******************************************************************************************
        ////Check that values for a character on the values tab are also represented on the taxa tab
        ////Conversely, where a character is represented at all on the values tab, report on values
        ////in taxa tab that are not represented on values tab. For text characters, that is 
        ////for info only, but for ordinal characters this is a serious error.
        //var taxaCharacterValues, valueCharacterValues;
        //charactersFromValuesTab.forEach(function (character) {

        //    valueCharacterValues = [];
        //    core.values.forEach(function (row) {
        //        if (row.Character == character) {
        //            valueCharacterValues.push(row.CharacterState);
        //        }
        //    });

        //    if (charactersFromTaxaTab.indexOf(character) > -1) {
        //        taxaCharacterValues = [];
        //        core.taxa.forEach(function (taxon) {

        //            var splitvalues = taxon[character].split("|");
        //            splitvalues.forEach(function (charValue) {
        //                charValue = charValue.trim();
        //                if (endsWith(charValue, "(m)") || endsWith(charValue, "(f)")) {
        //                    var stateValue = charValue.substr(0, charValue.length - 4).trim();
        //                } else {
        //                    var stateValue = charValue;
        //                }

        //                if (taxaCharacterValues.indexOf(stateValue) == -1) {
        //                    taxaCharacterValues.push(stateValue);
        //                }
        //            });
        //        });

        //        //Are there values in values tab that are not in taxa tab?
        //        valueCharacterValues.forEach(function (value) {
        //            if (taxaCharacterValues.indexOf(value) == -1) {
        //                errors.append($('<li class="tombioValid2">').html("The value <b>'" + value + "'</b> listed on the <i>values</i> worksheet for the character <b>'" + character + "'</b> is not specified for any taxa on the <i>taxa</i> worksheet."));
        //                values = false;
        //            }
        //        });

        //        //For characters represented on the values tab, are there values on the
        //        //taxa tab which aren't represented on the values tab?
        //        if (charactersFromValuesTab.indexOf(character) > -1) {
        //            taxaCharacterValues.forEach(function (value) {
        //                if (value != "" && value != "n/a" && value != "?") {
        //                    if (valueCharacterValues.indexOf(value) == -1) {
        //                        errors2.append($('<li class="tombioValid1">').html("The value <b>'" + value + "'</b> listed on the <i>taxa</i> worksheet for the character <b>'" + character + "'</b> is not specified on the <i>values</i> worksheet."));
        //                        taxavalues = false;
        //                    }
        //                }
        //            });
        //        }
        //    }
        //});

        if (!values) {
            $('#tombioKBReport').append($('<h4>').text('On the values worksheet...'));
            $('#tombioKBReport').append(errors);
        }
        //if (!taxavalues) {
        //    $('#tombioKBReport').append($('<h4>').text('Values on the taxa worksheet...'));
        //    $('#tombioKBReport').append(errors2);
        //}

        //Image media files
        errors = $('<ul>');
        core.media.filter(function (m) { return (m.Type == "image-local") }).forEach(function (m) {

            if (m.Character != "" && charactersFromCharactersTab.indexOf(m.Character) == -1) {
                //A character on the media tab does not appear on the characters tab
                errors.append($('<li class="tombioValid2">').html("An image is specified for the character <b>'" + m.Character + "'</b> on the media worksheet, but that character is not on the characters worksheet."));
                media = false;
            } else if (m.Character != "") {
                //If a character is specified on media tab, no help text specified on characters tab
                //var character = core.characters.filter(function (c) { return (c.Character == m.Character) })[0];
                //if (character.Help == "") {
                //    errors.append($('<li class="tombioValid2">').html("An image is specified for the character <b>'" + m.Character + "'</b> on the media worksheet, but no help text is provided for that character on the characters worksheet, so it won't be displayed."));
                //    media = false;
                //}
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

        //Taxonomy checks
        errors = $('<ul>');
        var taxonomyCharacters = core.characters.filter(function (c) { return (c.Group == "Taxonomy") });
        var lastTaxonomyCol = taxonomyCharacters.length > 1 ? taxonomyCharacters[taxonomyCharacters.length - 1].Character : null;
        //Check that the row representing Taxon is the last Taxonomy group column on the Characters tab
        if (lastTaxonomyCol && lastTaxonomyCol != "Taxon") {
            errors.append($('<li class="tombioValid3">').html("The last Taxonomy row representing '" + lastTaxonomyCol + "' on the characters worksheet appears below the row representing 'Taxon' - it must come above."));
            taxonomy = false;
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
                core.taxa.forEach(function (t) {
                    if (t[rankCol] != "" && uniqueRankValues.indexOf(t[rankCol]) == -1) {
                        uniqueRankValues.push(t[rankCol]);
                    }
                })
                uniqueRankValues.forEach(function (rankVal) {
                    var uniqueHigherRankValues = [];
                    var taxa = core.taxa.filter(function (t) { return (t[rankCol] == rankVal) });
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
            $('#tombioKBReport').show();
            $("#downloadspin").hide();
            return false;
        }
    }

}(jQuery, this.tombiovis));