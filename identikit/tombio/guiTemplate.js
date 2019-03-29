(function ($, tbv) {
    "use strict"; 

    tbv.gui.main = {};

    //These two properties must be set somewhere within the template. They are used 
    //by visualisations and input controls to host their interfaces. Normally
    //These will be set to the value of DIV elements 
    tbv.gui.main.divVis = '#selector';
    tbv.gui.main.divInput = '#selector';

    //Context menu object must be defined whether or not it is used and must have the two
    //methods addItem and removeItem - whether or not implemented.
    tbv.gui.main.contextMenu = {};
    tbv.gui.main.contextMenu.addItem = function (label, f, bReplace, visContexts, guiContexts) {
        //label - string for the name to appear in 'context menu'
        //f - function to execute if element selected
        //bReplace - boolean indicating whether or not to replace element if already existing (same label)
        //visContexts - an array of strings indicating visualisation for which this applies, e.g. ['vis1
        //guiContexts - an array of strings indicating gui contexts for which this applies, e.g. ['guiLargeJqueryUi']
    }
    tbv.gui.main.contextMenu.removeItem = function (label) {
        //label - identifying element in 'context menu'
    }

    tbv.gui.main.updateProgress = function (value) {
        //Increments offline download progress (value is in percent of resources)

        //value is in percent of resources
    }

    tbv.gui.main.offlineOptions = function () {
        //Instructs the GUI to present offline management options to user
    }

    tbv.gui.main.offerRefresh = function () {
        //Instructs the GUI to offer refresh to user
    }

    tbv.gui.main.setSelectedTool = function (toolName) {
        //Allows the selected tool to be set programatically. This called by
        //tombiovis e.g. when tool set from outside Identikit (e.g. by
        //hosting website).

        //toolName - e.g. 'vis1', 'kbInfo'
    }

    tbv.gui.main.resizeControlsAndTaxa = function () {
        //Can be called whenever other elements of the GUI, e.g. input
        //tool or visualisation, is changed. Here the main GUI can 
        //be tweaked in response if required.
    }

    tbv.gui.main.init = function() {
       //This is where the main GUI layout is built and normally where 
       //the values of  tbv.gui.main.divVis and tbv.gui.main.divInput are set.
       //Called by tombiovis.

        //Check interface
        //tbv.f.checkInterface("guiTemplate", tbv.templates.gui.main, tbv.gui.main);
    }

    tbv.gui.main.createUIControls = function () {
        //This is where the main elements of the top level GUI (e.g. visualisation
        //selection list) are built. Called by tombiovis.
    }

    tbv.gui.main.visShow = function (selectedToolName) {
        //Show the selected visualisation/tool.

        //selectedToolName - e.g. 'vis1', 'kbInfo'
    }

    tbv.gui.main.dialog = function (title, html) {
        //Show 'dialog' with title and main html supplied.
        //Used, for example, by input control to display help.

        //title - title of 'dialog'
        //html - text string of html contents
    }

    tbv.gui.main.createCharacterTooltips = function (selector) {
        //Key input controls use this to display tooltips on character
        //inputs. Some interfaces, e.g. mobile-first won't implement
        //anything here.
    }

    tbv.gui.main.createTaxonToolTips = function (selector, displayToolTips) {
        //Other gui elements use this to display tooltips on taxa.
        //Some interfaces, e.g. mobile-first won't implement
        //anything here.
    }

    tbv.gui.main.tooltip = function (selector) {
        //Can be used by GUI elements to set up standards tooltips on
        //elements (i.e. those that use the title attribute.)
    }

    tbv.gui.main.showFullDetails = function (taxon, selected, x, y) {
        //Used to display full details of a taxon.

        //taxon - name of the taxon
        //selected - index of element to be selected (0=kb, 1=images, 2=map, 3=text)
        //x & y - pixel location for floating gui elements
    }

}(jQuery, this.tombiovis.templates));