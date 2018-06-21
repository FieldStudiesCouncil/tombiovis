(function ($, tbv) {

    "use strict";

    //##Interface##
    tbv.gui.keyInputBasic = {
        //##Interface##
        //Variables that are part of the required interface...
        
        //Other variables 
       
    };

    //##Interface##
    tbv.gui.keyInputBasic.init = function ($parent) {

        //Dynamically create the character input widgets
        var _this = this;

        var $input = $("<div>").attr("id", "tombioKeyBasic").appendTo($parent);

        //##Interface##
        //Set the property which identifies the top-level div for this input
        tbv.gui.keyInputBasic.$div = $("#tombioKeyBasic");

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


        for (var chargroup in characters) {

            //Print header for group
            $("<div>").addClass("characterGroup").text(chargroup).appendTo($input);

            //Reset stateSet flags - when clearing a value
            //tbv.d.characters.forEach(function (character) {
            //    character.stateSet = false;
            //    character.userInput = null;
            //});

            //Reset vis when changing values
            //tbv.f.refreshVisualisation();


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
    }

    //##Interface##
    tbv.gui.keyInputBasic.initFromCharacterState = function () {
        ////Set the character state input controls
        //tbv.d.characters.forEach(function (c, cIndex) {
        //    if (c.ControlType === "spin") {
        //        var control = $("#" + c.Character + ".statespinner");
        //        var clone = $("#clone-" + c.Character + ".statespinner");

        //        var val = c.stateSet ? c.userInput : "";
        //        control.spinner("value", c.userInput);
        //        clone.spinner("value", val);
        //    } else {
        //        var control = $("#" + c.Character + ".stateselect");
        //        var clone = $("#clone-" + c.Character + ".stateselect");
        //        if (c.stateSet) {
        //            var stateValues = c.userInput.map(function (valueIndex) {
        //                return c.CharacterStateValues[valueIndex];
        //            })
        //        } else {
        //            var stateValues = [];
        //        }
        //        control.val(stateValues).pqSelect('refreshData');
        //        clone.val(stateValues).pqSelect('refreshData');
        //    }
        //})
    }

    //##Interface##
    tbv.gui.keyInputBasic.initStateFromParams = function (params) {

        //this.initFromCharacterState();

        ////Set selected group
        //$("#tombioKeyInputTabs").tabs("option", "active", params["grp"]);  //##Requires attention - tombioKeyInputTabs

        ////Visibility of unused controls (clones)
        //$("[name='charvisibility']")
        //    .removeProp('checked')
        //    .filter('[value="' + params["cvis"] + '"]')
        //    .prop('checked', true);

        //$("[name='charvisibility']").checkboxradio('refresh');

        //setCloneVisibility();
    }

    //##Interface##
    tbv.gui.keyInputBasic.setParamsFromState = function (params) {

        ////Update params to indicate which, if any group tab was selected
        //params.push("grp=" + $("#tombioKeyInputTabs").tabs("option", "active"));

        ////Update params to indicate unused controls visibility (clones)
        //params.push("cvis=" + $("input[name=charvisibility]:checked").val());

        //return params
    }

    //##Interface##
    tbv.gui.keyInputBasic.otherState = {
        keys: []
    }

    //Implementation dependent elements below...

}(jQuery, this.tombiovis));