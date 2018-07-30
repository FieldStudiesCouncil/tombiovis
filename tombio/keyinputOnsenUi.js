(function ($, tbv) {
    "use strict";

    tbv.gui.keyInputOnsenUi = {
        //Variables that are part of the required interface...
        width: 250, //Must have a default width
        otherState: { keys: [] }
        //Other variables 
    };

    tbv.gui.keyInputOnsenUi.init = function ($parent) {
        //This is where the interface of the key input is built.
        //$parent - jquery object representing container div

        //Dynamically create the character input widgets
        var _this = this;

        var $input = $("<div>").attr("id", "tombioKeyinputOnsenUi").appendTo($parent);

        var chargroup;
        var characters = {};
        var inputCharGroups = [];

        tbv.d.characters.forEach(function (character) {
            if (character.Status == "key") {
                if (!characters[character.Group]) {
                    characters[character.Group] = [];
                    inputCharGroups.push(character.Group);
                }
                characters[character.Group].push(character);
            }
        });

        //Button to clear all input controls
        $("<button>").appendTo($input).text("Clear input").click(function () {
            tbv.d.characters.forEach(function (character) {
                //Clear input control value
                var id = "#tbvKib" + character.Character;
                $(id).val(null);
                //Clear character input state
                character.stateSet = false;
                character.userInput = null;
            });
            tbv.f.refreshVisualisation();
        });

        var html = '';
        html += '<ons-page id="tombioKeyinputOnseUi" style="margin-right: 10px">';
        html += '<ons-list>';

        inputCharGroups.forEach(function (g, i) {

            if (i < 2) {
                if (inputCharGroups.length > 1) {
                    //Expandable list item for group
                    html += '<ons-list-item expandable>';
                    html += '<div class="left">' + g + '</div>';
                    html += '<div class="expandable-content">';
                    html += '<ons-list>';
                }


                characters[g].forEach(function (c) {
                    html += '<ons-list-item>';
                    html += '<div class="left">' + c.Label + '</div>';
                    html += '</ons-list-item>';
                })


                if (inputCharGroups.length > 1) {
                    html += '</ons-list>';
                    html += '</div>';
                    html += '</ons-list-item>';
                }
            }
        });

        html += '</ons-list>';
        html += '</ons-page>';

        $input.html(html);

        console.log(html)

        //Set the property which identifies the top-level div for this input
        tbv.gui.keyInputOnsenUi.divSel = "#divtombioKeyinputOnsenUi";

        //Check interface
        tbv.f.checkInterface("keyInputOnsenUi", tbv.templates.gui.keyInput, tbv.gui["keyInputOnsenUi"]);
    }

    tbv.gui.keyInputOnsenUi.initFromCharacterState = function () {
    }

    tbv.gui.keyInputOnsenUi.initStateFromParams = function (params) {
        //Function to initialise state of visualisation from parameters
        //params - array of parameters passed in URL
    }

    tbv.gui.keyInputOnsenUi.setParamsFromState = function (params) {
        //Function to derive parameters for use with URL from state of control
        //params - array of parameters passed in URL
    }
}(jQuery, this.tombiovis.templates.loading ? this.tombiovis.templates : this.tombiovis));