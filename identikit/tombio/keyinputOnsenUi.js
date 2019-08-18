(function ($, tbv) {
    "use strict";

    //Important!!!!!
    //This implementation depends on a modified version of onsenui-2.10.10.
    //The javascript file onsenui.js has a couple of lines added in createClass(SlideListItemAnimator)
    //to fire events when an expandable list item is shown or hidden.
    //It is marked with the comment 'FSC Identikit'.
 
    tbv.gui.keyInputOnsenUi = {
        //Variables that are part of the required interface...
        width: 250, //Must have a default width
        otherState: { keys: [] },
        //Other variables
        fn: {}
    };

    tbv.gui.keyInputOnsenUi.init = function ($parent) {
        //This is where the interface of the key input is built.
        //$parent - jquery object representing container div

        //Dynamically create the character input widgets
        var _this = this;

        var $input = $("<div>").attr("id", "tombioKeyinputOnsenUi").appendTo($parent);

        var html = '';

        if (tbv.d.groupedCharacters.groups.length > 1) {
            var initialTemplate = "tombioOnsKiGroupsTemplate";
        } else {
            var initialTemplate = "tombioOnsKiGroup-None-template";
        }

        html += '<ons-navigator swipeable id="tombioOnsKiNavigator" page="' + initialTemplate + '"></ons-navigator>';

        html += '<template id="tombioOnsKiGroupsTemplate">';
        html += '<ons-page id="tombioOnsKiGroups">';
        html += '<ons-fab id="tombioOnsKiReset" position="bottom right" ripple="true" modifier="mini" style="display: none">'
        html += '<ons-icon icon="md-replay" onclick="tombiovis.gui.keyInputOnsenUi.fn.clearInput()"></ons-icon>'
        html += '</ons-fab>'
        html += '<ons-list>'

        tbv.d.groupedCharacters.groups.forEach(function (g, i) {

            if (tbv.d.groupedCharacters.groups.length > 1) {
                //Expandable list item for group
                html += '<ons-list-item expandable tappable onclick="tombiovis.gui.keyInputOnsenUi.fn.displayGroupControls(\'' + g + '\')">'
                html += '<div class="center">'
                html += '<span class="list-item__title">' + g + '</span>'
                html += '<span class="tombioOnsKiGroupSummary tombioOnsKiShortHelp" data-group="' + g + '"></span>'
                html += '</div>';
                html += '</ons-list-item>';
            }
        });

        html += '</ons-list> ';
        html += '</ons-page>';
        html += '</template>';

        //Generate the input group templates
        tbv.d.groupedCharacters.groups.forEach(function (g, i) {

            html += '<template id="tombioOnsKiGroup-' + g.replace(" ", "") + '-template">';
            html += '<ons-page id="tombioOnsKiGroup-' + g.replace(" ", "") + '">';
            tbv.d.groupedCharacters[g].forEach(function (c) {

                if (tbv.d.groupedCharacters.groups.length > 1) {
                    html += '<ons-toolbar modifier="noshadow">';
                    html += '<div class="left">';
                    html += '<ons-back-button></ons-back-button>';
                    html += '</div>';
                    html += '<div class="center">' + 'back to overview' + '</div>';
                    html += '</ons-toolbar>';
                }
                if (c.ValueType == "text" || c.ValueType == "ordinal" || c.ValueType == "ordinalcircular") {
                    html += createTextInputControl(c);
                } else if (c.ValueType == "numeric") {
                    html += createNumericInputControl(c);
                }
            })
            html += '</ons-page>';
            html += '</template>';
        });

        $input.html(html);

        //Set the property which identifies the top-level div for this input
        tbv.gui.keyInputOnsenUi.divSel = "#tombioKeyinputOnsenUi";

        //Check interface
        tbv.f.checkInterface("keyInputOnsenUi", tbv.templates.gui.keyInput, tbv.gui["keyInputOnsenUi"]);

        document.addEventListener('listAnimated', function (event) {
            //Event raised by modified onsenui.js file when expandable list item
            //is shown or hidden.

            var id = $(event.detail.listItem).attr('id')

            if (id) {
                var character = getCharacterFromID(id);
                tbv.gui.keyInputOnsenUi.fn.displaySelect(character, event.detail.action);
            }
        });

        document.addEventListener('init', function (event) {
            //When pages initialised
            var page = event.target;
            if (page.id.startsWith('tombioOnsKiGroup-')) {
                //If this is a group input page, intialise the controls
                $('#' + page.id + " .tombioKiOuiCharcterListItem").each(function () {
            
                    var character = getCharacterFromID($(this).attr('id'));

                    if (tbv.d.oCharacters[character].stateSet) {
                        console.log(character, tbv.d.oCharacters[character].ValueType)

                        if (tbv.d.oCharacters[character].ValueType == "text" || tbv.d.oCharacters[character].ValueType == "ordinal" || tbv.d.oCharacters[character].ValueType == "ordinalcircular") {
                            tbv.d.oCharacters[character].userInput.forEach(function (index) {
                                $('#tombioKiOui-' + character + '-' + index + ' ons-checkbox')[0].checked = true;
                            })
                        } else if (tbv.d.oCharacters[character].ValueType == "numeric") {

                            console.log('seting numeric ', tbv.d.oCharacters[character].userInput)
                            $('#tombioKiOui-' + character + "-stateItems ons-input")[0].value = tbv.d.oCharacters[character].userInput;
                        }
                        tbv.gui.keyInputOnsenUi.fn.displaySelect(character, 'hide');
                    }
                });  
            }   
        });

        document.addEventListener('show', function (event) {

            var page = event.target;

            if (page.id == 'tombioOnsKiGroups') {
                initGroupsPage(); 
            }
        })
    }

    tbv.gui.keyInputOnsenUi.initFromCharacterState = function () {

        //This is not required to do anything because in this implementation,
        //the controls are reset from character states every time they are shown.
        //This happens in the 'init' event listener added in tbv.gui.keyInputOnsenUi.init.
    }

    tbv.gui.keyInputOnsenUi.initStateFromParams = function (params) {
        //Function to initialise state of visualisation from parameters
        //params - array of parameters passed in URL

        initGroupsPage();
    }

    tbv.gui.keyInputOnsenUi.setParamsFromState = function (params) {
        //Function to derive parameters for use with URL from state of control
        //params - array of parameters passed in URL

        return params;
    }

    //Private functions that need to be exposed for event handling

    tbv.gui.keyInputOnsenUi.fn.displayGroupControls = function (g) {

        var template = 'tombioOnsKiGroup-' + g.replace(" ", "") + '-template';
        document.querySelector('#tombioOnsKiNavigator').pushPage(template);
    }

    tbv.gui.keyInputOnsenUi.fn.displaySelect = function (character, operation) {
        var selCharacterListItem = '#tombioKiOui-' + character;
        var selListItems = selCharacterListItem + '-stateItems > ons-list-item';

        if (operation == 'show') {
            $(selCharacterListItem).attr("data-shown", "true");
            //Show any range slider
            $(selListItems + " ons-range").show();
            //Show all list items, whether checked or not
            $(selListItems).slideDown(200);
        } else {
            $(selCharacterListItem).attr("data-shown", "false");
            $(selListItems).each(function () {
                //Only show items that have value set
                if (!isValueSet(character, this)) {
                    $(this).slideUp(200);
                } else {
                    $(this).slideDown(200);
                }
                //Hide any range slider
                $(selListItems + " ons-range").slideUp(200);
            }); 
        }

        //Colour
        $(selCharacterListItem + " .tombioKiOuiCharcterListItemText").removeClass("selected deselected");
        var selected = false;
        $(selListItems).each(function () {
            //if (this.querySelector('ons-checkbox').checked) {
            if (isValueSet(character, this)) {
                selected = true;
            }
        });
        if (selected || operation == 'show') {
            $(selCharacterListItem + " .tombioKiOuiCharcterListItemText").removeClass("deselected");
            $(selCharacterListItem + " .tombioKiOuiCharcterListItemText").addClass("selected");
        } else {
            $(selCharacterListItem + " .tombioKiOuiCharcterListItemText").removeClass("selected");
            $(selCharacterListItem + " .tombioKiOuiCharcterListItemText").addClass("deselected");
        }
    }

    tbv.gui.keyInputOnsenUi.fn.checkboxClicked = function (event, character, value) {

        //event.stopPropagation();

        //Hide the expandable character list item
        if ($('#tombioKiOui-' + character).attr("data-shown") == "true") {
            document.querySelector('#tombioKiOui-' + character).hideExpansion();
        }

        //Hide the expandable character value list item
        document.querySelector('#tombioKiOui-' + character + '-' + value).hideExpansion();

        var selListItems = '#tombioKiOui-' + character + '-stateItems > ons-list-item';

        //If this is a single select, de-select any others if this one was selected.
        if (tbv.d.oCharacters[character].ControlType == "single") {
            var cb = document.querySelector('#tombioKiOui-' + character + '-' + value + ' ons-checkbox');
            if (cb.checked) {
                $(selListItems).each(function (i) {
                    if (i != value) {
                        this.querySelector('ons-checkbox').checked = false;
                    }
                }); 
            }
        }
        //Hide unchecked value list items
        tbv.gui.keyInputOnsenUi.fn.displaySelect(character, 'hide');

        //userInput for text controls is an array of values representing the index of the 
        //selected character states.
        var values = [];
        $(selListItems).each(function (i) {
            if (this.querySelector('ons-checkbox').checked) {
                values.push(i);
            }
        }); 
        if (values.length > 0) {
            tbv.d.oCharacters[character].userInput = values;
            tbv.d.oCharacters[character].stateSet = true;
        } else {
            tbv.d.oCharacters[character].userInput = null;
            tbv.d.oCharacters[character].stateSet = false;
        }

        tbv.f.refreshVisualisation();
    }

    tbv.gui.keyInputOnsenUi.fn.toggleExpansion = function (event, character) {

        if ($('#tombioKiOui-' + character).attr("data-shown") == "false") {
            console.log("showing")
            document.querySelector('#tombioKiOui-' + character).showExpansion(function(){console.log("shown")});
        } else {
            document.querySelector('#tombioKiOui-' + character).hideExpansion();
        }
    }

    tbv.gui.keyInputOnsenUi.fn.numericChanged = function (character) {
        //Only hide the control if data-shown is false and value is cleared
        var value = document.querySelector('#tombioKiOui-' + character + "-stateItems ons-input").value;
        
        if ($('#tombioKiOui-' + character).attr("data-shown") == "false" && value == "") {
            document.querySelector('#tombioKiOui-' + character).hideExpansion();
        }

        //Match the slider
        var rangeValue = (value == "") ? 0 : value;
        document.querySelector('#tombioKiOui-' + character + "-stateItems ons-range").value = rangeValue;

        //userInput for text controls is an array of values representing the index of the 
        //selected character states.
        if (value != "") {
            tbv.d.oCharacters[character].userInput = value;
            tbv.d.oCharacters[character].stateSet = true;
        } else {
            tbv.d.oCharacters[character].userInput = null;
            tbv.d.oCharacters[character].stateSet = false;
        }

        tbv.f.refreshVisualisation();
    }

    tbv.gui.keyInputOnsenUi.fn.numericRangeChanged = function (character) {
        //Only hide the control if data-shown is false and value is cleared
        var rangeValue = document.querySelector('#tombioKiOui-' + character + "-stateItems ons-range").value;
        document.querySelector('#tombioKiOui-' + character + "-stateItems ons-input").value = rangeValue;

        tbv.gui.keyInputOnsenUi.fn.numericChanged(character);
    }

    tbv.gui.keyInputOnsenUi.fn.numericClear = function (character) {
        document.querySelector('#tombioKiOui-' + character + "-stateItems ons-input").value = "";
        tbv.gui.keyInputOnsenUi.fn.numericChanged(character);
    }

    tbv.gui.keyInputOnsenUi.fn.clearInput = function (character) {
        tbv.d.characters.forEach(function (c) {
            c.userInput = null;
            c.stateSet = false;
        });
        initGroupsPage();
        tbv.f.refreshVisualisation();
    }

    tbv.gui.keyInputOnsenUi.fn.showHelp = function (event, charName) {
        event.preventDefault(); //Prevents the hyperlink triggering reload
        event.stopPropagation(); //Stops click from propogating and toggling expansion

        //Display the help dialog
        tbv.gui.main.dialog('Character help & info', tbv.f.getFullCharacterHelp(charName));
    }
    
    //Private functions

    function initGroupsPage() {
        var stateSet = false;

        tbv.d.groupedCharacters.groups.forEach(function (g, i) {

            var html = "";
            
            tbv.d.groupedCharacters[g].forEach(function (c) {
                if (c.stateSet) {

                    stateSet = true;

                    if (!html) html += '<ul style="padding-left: 25px; margin: 0">';

                    html += '<li>';

                    html += c.Label + ": ";

                    if (c.ValueType == "text" || c.ValueType == "ordinal" || c.ValueType == "ordinalcircular") {
                        var val = "";
                        c.userInput.forEach(function (i) {
                            if (val) val += " <i>or</i> ";
                            val += '<span class="tombioOnsKiGroupSummaryValue">' + c.CharacterStateValues[i] + '</span>';
                        });
                    } else if (c.ValueType == "numeric") {
                        var val = '<span class="tombioOnsKiGroupSummaryValue">' + c.userInput + '</span>';
                    }
                    html += val;

                    html += '</li>';
                }
            })
            if (html) html += '</ul>';
            $('.tombioOnsKiGroupSummary[data-group="' + g + '"]').html(html)
        });

        //Show/hide reset button
        if (stateSet) {
            //console.log("show")
            $('#tombioOnsKiReset').show();
        } else {
            //console.log("hide")
            $('#tombioOnsKiReset').hide();
        }     
    }

    function createTextInputControl(c) {
        var html = '';

        html += '<ons-list>';

        html += '<ons-list-item tappable class="tombioKiOuiCharcterListItem" id="tombioKiOui-' + c.Character + '" data-shown="false" expandable>';
        html += '<div class="tombioKiOuiCharcterListItemText deselected middle">' + c.Label + '</div>';
        html += '<div class="expandable-content tombioOnsKiShortHelp"  onclick="tombiovis.gui.keyInputOnsenUi.fn.toggleExpansion(event, \'' + c.Character + '\')">' + getHelp(c) + '</div>';
        html += '</ons-list-item>';

        html += '<div id="tombioKiOui-' + c.Character + '-stateItems">';
        c.CharacterStateValues.forEach(function (value, i) {

            var charHelp = "";
            //var charHelp = getHelp(c, i); //Uncomment to create expandable help for character values

            var expandable = charHelp ? " expandable tappable " : "";

            html += '<ons-list-item id="tombioKiOui-' + c.Character + '-' + i + '" style="display: none" ' + expandable + '>';
            html += '<div class="middle" onclick="tombiovis.gui.keyInputOnsenUi.fn.toggleExpansion(event, \'' + c.Character + '\')">' + value + '</div>';
            html += '<div class="left">';
            html += '<ons-checkbox onclick="tombiovis.gui.keyInputOnsenUi.fn.checkboxClicked(event, \'' + c.Character + '\', \'' + i + '\')"></ons-checkbox>';
            html += '</div>';
            if (charHelp) {
                html += '<div class="expandable-content tombioOnsKiShortHelp">';
                html += charHelp;
                html += '</div>';
            }
            html += '</ons-list-item>';
        })
        html += '</div>';

        html += '</ons-list>';
 
        return html
    }

    function createNumericInputControl(c) {
        var html = '';

        html += '<ons-list>';

        html += '<ons-list-item class="tombioKiOuiCharcterListItem" id="tombioKiOui-' + c.Character + '" expandable data-shown="false">';
        html += '<div class="tombioKiOuiCharcterListItemText deselected middle">' + c.Label + '</div>';
        html += '<div class="expandable-content tombioOnsKiShortHelp">' + getHelp(c) + '</div>';
        html += '</ons-list-item>';

        
        html += '<div id="tombioKiOui-' + c.Character + '-stateItems">';

        html += '<ons-list-item style="display: none">';
        html += '<div class="middle">'

        html += '<ons-input style="width: 90%" modifier="underbar" placeholder="Enter numeric value" type="number"'
        html += ' onchange="tombiovis.gui.keyInputOnsenUi.fn.numericChanged(\'' + c.Character + '\')"';
        html += ' onkeyup="tombiovis.gui.keyInputOnsenUi.fn.numericChanged(\'' + c.Character + '\')" > ';
        html += '</ons-input>';

        var spinParams = c.Params.split(",");
        var spinMin = Number(spinParams[0]);
        var spinMax = Number(spinParams[1]);
        var spinStep = Number(spinParams[2]);

        html += '<ons-range style="width: 90%; margin-top: 10px" value="0" min="' + spinMin + '" max="' + spinMax + '" step="' + spinStep + '"'
        html += ' onchange="tombiovis.gui.keyInputOnsenUi.fn.numericRangeChanged(\'' + c.Character + '\')" > ';
        html += '</ons-range>';

        html += '</div>'

        html += '<div class="right">'
        html += '<ons-icon icon="md-close-circle" size="25px" style="color: #1e88e5"';
        html += ' onclick="tombiovis.gui.keyInputOnsenUi.fn.numericClear(\'' + c.Character + '\')" > ';
        html += '</ons-icon>'
        html += '</div>'

        html += '</ons-list-item>';

        html += '</div>';

        html += '</ons-list>';

        return html
    }

    function getCharacterFromID(id) {
        //ID is 'tombioKiOui-' concatenated to character name.
        return id.substr(12);
    }

    function getHelp(c, v) {

        var html = '';

        if (typeof v != "undefined") {
            html += c.CharacterStates[v].StateHelpShort ? c.CharacterStates[v].StateHelpShort : c.CharacterStates[v].StateHelp;
        } else {
            html += c.HelpShort ? c.HelpShort : c.Help;
        }
        
        if (typeof v != "undefined") {
            var addFullHelpLink = (c.CharacterStates[v].StateHelpShort && c.CharacterStates[v].StateHelp) || tbv.f.getCharacterImages(c.Character, c.CharacterStateValues[v], 'full').length > 0;
        } else {
            var addFullHelpLink = tbv.f.stateValueHelpPresent(c.Character) || tbv.f.getCharacterImages(c.Character, null, 'full').length > 0;
        }

        if (addFullHelpLink) {
            if (html) html += " ";
            html += '<a href="" onclick="tombiovis.gui.keyInputOnsenUi.fn.showHelp(event, \'' + c.Character + '\')">More help</a>'
        }

        if (!html && typeof v == "undefined") {
            if (c.ValueType == "numeric") {
                html += "Enter an appropriate value below.";
            } else {
                html += "Select an appropriate value below.";
            }
        }

        return html;
    }

    function getCharacterToolTip(character) {

        var ret = $('<div/>');
        var tipTextPresent = false;

        //Help text for character
        //If HelpShort exists - use this for tip text, else use Help text. Must allow
        //for KBs where HelpShort column doesn't exist for backward compatibility.
        if (tbv.d.oCharacters[character].HelpShort && tbv.d.oCharacters[character].HelpShort != "") {
            var helpText = tbv.d.oCharacters[character].HelpShort;
            tipTextPresent = true;
        } else {
            var helpText = tbv.d.oCharacters[character].Help;
        }

        //Retrieve collection of media image rows for this character and sort by priority.
        var charImagesFull = tbv.d.media.filter(function (m) {
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
            figure.addClass("keyInputHelpFigure");
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
        var valueHelp = tbv.d.values.filter(function (v) {
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

    function isValueSet(character, listItem) {

        //Set flag indicating if control has value
        var c = tbv.d.oCharacters[character];
        if (((c.ValueType == "text" || c.ValueType == "ordinal" || c.ValueType == "ordinalcircular") && listItem.querySelector('ons-checkbox').checked)
            || (c.ValueType == "numeric" && listItem.querySelector('ons-input').value != "")) {
            var valueSet = true;
        } else {
            var valueSet = false;
        }

        return valueSet;
    }

}(jQuery, this.tombiovis));