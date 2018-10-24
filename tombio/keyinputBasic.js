(function ($, tbv) {
    "use strict";

    tbv.gui.keyInputBasic = {
        width: 360, //Must have a default width
        otherState: { keys: [] }
        //Variables that are part of the required interface...
        
        //Other variables 
    };

    tbv.gui.keyInputBasic.init = function ($parent) {

        //Dynamically create the character input widgets
        var _this = this;

        var $input = $("<div>").attr("id", "tombioKeyBasic").appendTo($parent);

        //Set the property which identifies the top-level div for this input
        tbv.gui.keyInputBasic.divSel = "#tombioKeyBasic";

        var characters = {};
        tbv.d.groupedCharacters.groups.forEach(function (group) {
            characters[group] = tbv.d.groupedCharacters[group];
        })

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

        for (var chargroup in characters) {

            //Print header for group
            $("<div>").addClass("characterGroup").text(chargroup).appendTo($input);

            //New control for each character
            for (var i = 0; i < characters[chargroup].length; i++) {

                var character = characters[chargroup][i];

                //Create the label for the character control
                var $characterlabel = $("<div>").addClass("characterlabel").text(character.Label);
                var $characterDiv = $("<div>").append($characterlabel);
                $input.append($characterDiv);

                var id = "tbvKib" + character.Character;

                if (character.ValueType == "numeric") {
                    //Numeric control 
                    var $numbercontrol = $("<input>").attr("type", "number").attr("id", id).addClass("numberControl").appendTo($characterDiv);
                    var spinParams = character.Params.split(",");
                    $numbercontrol.attr("min", spinParams[0]).attr("max", spinParams[1]).attr("step", spinParams[2]);

                    var data = { id: id, char: character.Character }

                    $numbercontrol.change(data, function (e) {
                        var value = $("#" + e.data.id).val();
                        if (isNaN(value) || value == "") {
                            tbv.d.oCharacters[e.data.char].userInput = null;
                            tbv.d.oCharacters[e.data.char].stateSet = false;
                        } else {
                            tbv.d.oCharacters[e.data.char].userInput = value;
                            tbv.d.oCharacters[e.data.char].stateSet = true;
                        }
                        tbv.f.refreshVisualisation();
                    });

                } else {
                    //Character control
                   
                    var $selectcontrol = $("<select>").attr("id", id).addClass("characterSelect").appendTo($characterDiv);
                    if (character.ControlType == "multi") {
                        $selectcontrol.attr("multiple", "multiple");
                    }
                    if (character.ControlType == "single") {
                        var option = $("<option>").text("").val("").appendTo($selectcontrol); 
                    }

                    //Create an HTML option element corresponding to each state
                    character.CharacterStateValues.forEach(function (state, i) {
                        $("<option>").text(state).val(i).appendTo($selectcontrol); 
                    });

                    var data = { id: id, char: character.Character}
                    $selectcontrol.change(data, function (e) {
                        var values = [];
                        $("#" + e.data.id + " option:selected").each(function () {
                            if ($(this).val() != "") {
                                values.push($(this).val())
                            }
                        });
                        if (values.length > 0) {
                            tbv.d.oCharacters[e.data.char].userInput = values;
                            tbv.d.oCharacters[e.data.char].stateSet = true;
                        } else {
                            tbv.d.oCharacters[e.data.char].userInput = null;
                            tbv.d.oCharacters[e.data.char].stateSet = false;
                        }
                        tbv.f.refreshVisualisation();
                    });
                }
            }
        }

        //Check interface
        tbv.f.checkInterface("keyInputBasic", tbv.templates.gui.keyInput, tbv.gui["keyInputBasic"]);
    }

    tbv.gui.keyInputBasic.initFromCharacterState = function () {
        //Set the character state input controls
        tbv.d.characters.forEach(function (c) {

            var control = $("#tbvKib" + c.Character);
            control.val(c.stateSet ? c.userInput : null);
        })
    }

    tbv.gui.keyInputBasic.initStateFromParams = function (params) {

        this.initFromCharacterState();

        //This routine can be used to initialise interface
        //from parameters, e.g. a selected group or visibility stuff. 
        //Counterpart of setParamsFromState.
    }

    tbv.gui.keyInputBasic.setParamsFromState = function (params) {

        //Here we can create parameters to describe other interface
        //state, e.g. selected group or visibility etc.
        //Counterpart of initStateFromParams.
        return params
    }

    //Implementation dependent elements below...

}(jQuery, this.tombiovis));