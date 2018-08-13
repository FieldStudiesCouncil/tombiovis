(function ($, tbv) {
    "use strict";

    //#################################################
    //Need to replace keyInput with name of new control
    //#################################################

    tbv.gui.keyInput = {
        //Variables that are part of the required interface...
        width: 360, //Must have a default width
        otherState: { keys: [] }
        //Other variables 
    };

    tbv.gui.keyInput.init = function ($parent) {
        //This is where the interface of the key input is built.
        //$parent - jquery object representing container div

        //Set the property which identifies the top-level div for this input
        tbv.gui.keyInput.divSel = "#divName";

        //Check interface
        //tbv.f.checkInterface("keyInput", tbv.templates.gui.keyInput, tbv.gui["keyinputName"]);
    }

    tbv.gui.keyInput.initFromCharacterState = function () {
    }

    tbv.gui.keyInput.initStateFromParams = function (params) {
        //Function to initialise state of visualisation from parameters
        //params - array of parameters passed in URL
    }

    tbv.gui.keyInput.setParamsFromState = function (params) {
        //Function to derive parameters for use with URL from state of control
        //params - array of parameters passed in URL
    }
}(jQuery, this.tombiovis.templates));