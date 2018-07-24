(function (tbv) {

    "use strict";

    //The following fix is required to stop IE11 throwing its arms up if
    //console.log is used without console being open.
    if (!window.console) {
        window.console = {
            log: function () { }
        };
    }

    //Options object initialisations
    if (!tbv.opts) {
        tbv.opts = {}
    }
    if (!tbv.opts.toolconfig) {
        tbv.opts.toolconfig = {}
    }

    //For backward compatibility (prior to 1.6.0) allow for direct
    //use of tombiover, tombiopath and tombiokbpath. If they are
    //there, use them to set properties of tombiovis (tbv)
    if (typeof tombiover !== 'undefined') {
        tbv.opts.tombiover = tombiover;
    }
    if (typeof tombiopath !== 'undefined') {
        tbv.opts.tombiopath = tombiopath;
    }
    if (typeof tombiokbpath !== 'undefined') {
        tbv.opts.tombiokbpath = tombiokbpath;
    }

    //If main gui is set as a parameter, override that already set
    var urlParams = new URLSearchParams(window.location.search);
    var gui = urlParams.get('gui');
    console.log("gui", gui)
    if (gui) {
        tbv.opts.gui = gui;
    }
    
    //The reload option (tombiovis.js) uses window.location.reload(true)
    //to reload the page without cache. While this seems to reload all javascript files
    //on laptop browsers, it doesn't seem to work on Android Chrome or iOS Safari (03/07/2017)
    //so in that case we have to specify (and change) the tombiover variable in the calling
    //HTML page.
    //if (!tbv.opts.tombiover) {
    //    tbv.opts.tombiover = "none";
    //}

    //Object for storing general functions
    tbv.f = {};

    //Object to store all data
    tbv.d = {};
    tbv.d.nbnMapCache = {}; //NBN image cache

    //Colour ramp for the matching indicators to be used across all visualisations
    //Vermillion-Yellow-Blue http://jfly.iam.u-tokyo.ac.jp/color/
    tbv.d.scoreColours = ['#fc8d59', '#ffffbf', '#91bfdb'];

    //Object to store visualisation information
    tbv.v = {};
    tbv.v.visualisations = {} //Stores the visualisation

    //Object to store all the JS related stuff
    tbv.js = {};

    //Object to store all the gui related stuff
    tbv.gui = {};
    tbv.gui.sharedKeyInput = {};

    //Metadata about the core software. This should be updated for any
    //new release. This includes changes to all code and files in the
    //root source directory, but not that in the sub-directories of the
    //visualisations which each have their own metadata.
    tbv.d.softwareMetadata = {
        title: "FSC Identikit",
        year: "2018",
        authors: "Burkmar, R.",
        publisher: "Field Studies Council",
        location: "Shrewsbury, England",
        contact: "r.burkmar@field-studies-council.org",
        version: "1.7.1"
    }

    //Variables for the tools to be included
    var defaultTools = ["vis1", "vis2", "vis5", "vis4", "vis3"];
    tbv.v.includedVisualisations = [];

    //Application-wide structure for holding all the necessary information for
    //dynamically loaded JS modules and associated CSS files
    var jsF = tbv.js.jsFiles = {
        add: function (id, file, toolName) {
            tbv.js.jsFiles[id] = Object.create(jsFile);
            tbv.js.jsFiles[id].init(id, file, toolName);
        },
        asArray: function () {
            var ret = [];
            for (var f in tbv.js.jsFiles) {
                if (tbv.js.jsFiles.hasOwnProperty(f)) {
                    ret.push(tbv.js.jsFiles[f]);
                }
            }
            return ret;
        }
    };

    //Object for representing a JS module,
    //its dependencies and associated CSS files.
    //For each module, an object is created using this as its
    //prototype and is added to the tbv.js.jsFiles collection
    var jsFile = {
        init: function (id, file, toolName) {
            this.id = id;
            this.file = minifyIfRequired(tbv.opts.tombiopath + file);
            this.requires = [];
            this.requiresFirst = [];
            this.css = [];
            this.toolName = toolName;
        },
        addCSS: function (cssFile) {
            this.css.push(minifyIfRequired(tbv.opts.tombiopath + cssFile));
        },
        loadJs: function (requiredBy, before) {

            if (!this.p) {
                var thisId = this.id;

                //Get promises for other JS required with this JS
                var pRequires = [];
                this.requires.forEach(function (id) {
                    pRequires.push(jsF[id].loadJs(thisId, false));
                });

                //Get promises for other JS required before this JS
                var pRequiresFirst = [];
                this.requiresFirst.forEach(function (id) {
                    console.log(id)
                    pRequiresFirst.push(jsF[id].loadJs(thisId, true));
                });

                var js = this.file;
                var css = this.css;
                var initF = this.initF;

                this.p = Promise.all(pRequiresFirst).then(function () {

                    //Create a promise for this JS file, but only after all other JS required before this JS resolved
                    var p = new Promise(function (resolve, reject) {
                        var s = document.createElement('script');
                        s.src = js
                        s.onreadystatechange = s.onload = function () {
                            //Cross-browser test of when element loaded correctly (from jQuery)
                            if (!s.readyState || /loaded|complete/.test(s.readyState)) {
                                var msgDep = "";
                                if (requiredBy) {
                                    if (before) {
                                        msgDep = " (req before " + requiredBy + ")";
                                    } else {
                                        msgDep = " (req by " + requiredBy + ")";
                                    }
                                }
                                console.log("%cLoaded JS file for " + thisId + msgDep, "color: blue");

                                //Execute any required initialisations
                                if (initF) initF();

                                //Load CSS associated with this JS
                                css.forEach(function (cssFile) {
                                    var l = document.createElement('link');
                                    l.rel = 'stylesheet';
                                    l.type = 'text/css';
                                    l.href = cssFile;
                                    document.querySelector('head').appendChild(l);
                                    console.log("%cLoaded CSS file " + nameFromPath(cssFile), "color: green");
                                })


                                resolve();
                            } else {
                                console.log("%cFiled to load JS file for " + thisId, "color: red");
                                reject();
                            }
                        };
                        document.querySelector('head').appendChild(s);
                    });
                    //Add this promise to the pRequires array
                    pRequires.push(p);
                    //Return a promise for load of this JS file and all dependecies
                    return Promise.all(pRequires);
                });
            }
            return this.p;
        }
    }

    //Application-wide download spinner create
    tbv.f.showDownloadSpinner = function () {
        //Empty out any thing (e.g. nbsp; already in div)
        //document.getElementById('tombiod3').innerHTML = "";

        //Div for wait spinner
        var waitDiv = document.createElement('div');

        waitDiv.id = 'downloadspin';

        //waitDiv.style = "position: absolute";
        //document.getElementById('tombiod3').appendChild(waitDiv);
        var tombiod3 = document.getElementById('tombiod3');
        tombiod3.insertBefore(waitDiv, tombiod3.firstChild);

        var opts = {
            lines: 13 // The number of lines to draw
            , length: 28 // The length of each line
            , width: 14 // The line thickness
            , radius: 42 // The radius of the inner circle
            , scale: 0.8 // Scales overall size of the spinner
            , corners: 1 // Corner roundness (0..1)
            , color: '#000' // #rgb or #rrggbb or array of colors
            , opacity: 0.15 // Opacity of the lines
            , rotate: 0 // The rotation offset
            , direction: 1 // 1: clockwise, -1: counterclockwise
            , speed: 1 // Rounds per second
            , trail: 60 // Afterglow percentage
            , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
            , zIndex: 2e9 // The z-index (defaults to 2000000000)
            , className: 'spinner' // The CSS class to assign to the spinner
            , top: '49%' // Top position relative to parent
            , left: '50%' // Left position relative to parent
            , shadow: false // Whether to render a shadow
            , hwaccel: false // Whether to use hardware acceleration
            , position: 'absolute' // Element positioning
        }
        //var target = document.getElementById('downloadspin');
        var spinner = new Spinner(opts).spin(waitDiv);
    }

    //Application-wide download spinner hide
    tbv.f.hideDownloadSpinner = function () {
        var tombiod3 = document.getElementById('tombiod3');
        var spinner = document.getElementById('downloadspin');
        tombiod3.removeChild(spinner);
    }

    //Populate the tbv.js.jsFiles (jsF) with modules and their associated CSS files
    //The following are always required and loaded first therefore don't need to be
    //specified as being required by other JS files.
    jsF.add("spinner", "dependencies/spin.min.js");
    jsF.add("jquery", "dependencies/jquery-3.1.1/jquery-3.1.1.min.js");
    jsF.add("d3", "dependencies/d3-4.10.0/d3.v4.min.js");

    //JQuery UI
    jsF.add("jqueryui", "dependencies/jquery-ui-1.12.1/jquery-ui.min.js");
    jsF.jqueryui.addCSS("dependencies/jquery-ui-1.12.1/jquery-ui.min.css");
    jsF.jqueryui.addCSS("dependencies/jquery-ui-1.12.1/jquery-ui.theme.min.css");
    jsF.jqueryui.addCSS("css/jquery-ui-tombio.css");

    //Galleria & Zoom Master reference by visP
    jsF.add("zoomMaster", "dependencies/zoom-master/jquery.zoom.min.js");
    jsF.add("galleria", "dependencies/galleria-1.5.7/galleria/galleria-1.5.7.min.js");
    jsF.galleria.addCSS("dependencies/galleria-1.5.7/galleria/themes/classic/galleria.classic.css")
    jsF.galleria.initF = function () {
        //Initialise Galleria
        Galleria.loadTheme(tbv.opts.tombiopath + 'dependencies/galleria-1.5.7/galleria/themes/classic/galleria.classic.min.js');
        Galleria.on('image', function (e) {
            //requires zoom plugin http://www.jacklmoore.com/zoom/
            $(e.imageTarget).parent().zoom({ on: 'grab' });
        });
    }

    //These required by visP to provide various interface elements
    jsF.add("mousewheel", "dependencies/jquery.mousewheel.min.js");
    jsF.add("hammer", "dependencies/hammer.min.js");
    //jsF.add("touchpunch", "dependencies/jquery.ui.touch-punch.min.js");
    //jsF.touchpunch.requires = ["jqueryui"];
    
    //Required by the character input controls
    jsF.add("pqselect", "dependencies/pqselect-1.3.2/pqselect.min.js");
    jsF.pqselect.addCSS("dependencies/pqselect-1.3.2/pqselect.min.css");
    jsF.pqselect.requiresFirst = ["jqueryui"];

    //Required by vis3
    jsF.add("pqgrid", "dependencies/pqgrid-2.1.0/pqgrid.min.js");
    jsF.pqgrid.addCSS("dependencies/pqgrid-2.1.0/pqgrid.min.css");
    jsF.pqgrid.requiresFirst = ["jqueryui"];

    //KeyInput
    jsF.add("keyInput", "keyinput.js?ver=" + tbv.opts.tombiover);
    jsF.keyInput.addCSS("css/keyinput.css");
    jsF.keyInput.requires = ["pqselect", "jqueryui"];

    //KeyInputBasic
    jsF.add("keyInputBasic", "keyinputBasic.js?ver=" + tbv.opts.tombiover);
    jsF.keyInputBasic.addCSS("css/keyinputbasic.css");

    //The main tombiovis module
    jsF.add("tombiovis", "tombiovis.js?ver=" + tbv.opts.tombiover);
    jsF.tombiovis.addCSS("css/tombiovis.css");
    jsF.tombiovis.requires = ["kbchecks"];

    //Knowledge-base checks
    jsF.add("kbchecks", "kbchecks.js?ver=" + tbv.opts.tombiover);
    jsF.add("score", "score.js?ver=" + tbv.opts.tombiover);

    //Taxon selection control used by some visualisations
    jsF.add("taxonselect", "taxonselect.js?ver=" + tbv.opts.tombiover);
    jsF.taxonselect.addCSS("css/taxonselect.css");
    jsF.taxonselect.requires = ["jqueryui"];

    //The base prototype visualisation module
    jsF.add("visP", "visP.js?ver=" + tbv.opts.tombiover);
    //jsF.visP.requires = ["mousewheel", "hammer", "galleria", "zoomMaster"];
    jsF.visP.requires = ["mousewheel", "galleria", "zoomMaster"];

    //Main GUI - Large format with jQuery UI
    jsF.add("guiLargeJqueryUi", "guiLargeJqueryUi.js?ver=" + tbv.opts.tombiover);
    jsF.guiLargeJqueryUi.addCSS("css/guiLargeJqueryUi.css");
    jsF.guiLargeJqueryUi.requires = ["jqueryui"];

    //Main GUI - Large format test (no jQuery)
    jsF.add("guiLarge", "guiLarge.js?ver=" + tbv.opts.tombiover);
    jsF.guiLarge.addCSS("css/guiLarge.css");

    //Onsen mobile-first GUI
    jsF.add("guiOnsenUi", "guiOnsenUi.js?ver=" + tbv.opts.tombiover);
    jsF.guiOnsenUi.addCSS("css/guiOnsenUi.css");
    jsF.guiOnsenUi.requiresFirst = ["onsenui"];

    //Onsenui
    jsF.add("onsenui", "dependencies/onsenui-2.10.3/js/onsenui.js");
    jsF.onsenui.addCSS("dependencies/onsenui-2.10.3/css/onsenui.css");
    jsF.onsenui.addCSS("dependencies/onsenui-2.10.3/css/onsen-css-components.min.css");
    jsF.onsenui.addCSS("dependencies/onsenui-2.10.3/css/onsenui-fonts.css");

    //The visualisation modules
    jsF.add("vis1", "vis1/vis1.js?ver=" + tbv.opts.tombiover, "Two-column key");
    jsF.vis1.addCSS("vis1/vis1.css");
    jsF.vis1.requiresFirst = ["visP"];
    jsF.vis1.requires = ["score"];
    setVisDependencies("vis1", true);

    jsF.add("vis2", "vis2/vis2.js?ver=" + tbv.opts.tombiover, "Single-column key");
    jsF.vis2.addCSS("vis2/vis2.css");
    jsF.vis2.requiresFirst = ["visP"];
    jsF.vis2.requires = ["score"];
    setVisDependencies("vis2", true);

    jsF.add("vis3", "vis3/vis3.js?ver=" + tbv.opts.tombiover, "Side by side comparison");
    jsF.vis3.addCSS("vis3/vis3.css");
    jsF.vis3.requiresFirst = ["visP"];
    jsF.vis3.requires = ["taxonselect", "pqgrid", "score"];
    setVisDependencies("vis3", false);

    jsF.add("vis4", "vis4/vis4.js?ver=" + tbv.opts.tombiover, "Full taxon details");
    jsF.vis4.addCSS("vis4/vis4.css");
    jsF.vis4.requiresFirst = ["visP"];
    jsF.vis4.requires = ["taxonselect"];
    setVisDependencies("vis4", false);

    jsF.add("vis5", "vis5/vis5.js?ver=" + tbv.opts.tombiover, "Circle-pack key");
    jsF.vis5.addCSS("vis5/vis5.css");
    jsF.vis5.requiresFirst = ["visP"];
    jsF.vis5.requires = ["score"];
    setVisDependencies("vis5", true);

    jsF.add("visEarthworm2", "visEarthworm2/visEarthworm2.js?ver=" + tbv.opts.tombiover, "Bespoke earthworm key");
    jsF.visEarthworm2.addCSS("visEarthworm2/visEarthworm2.css");
    jsF.visEarthworm2.requiresFirst = ["visP"];
    jsF.visEarthworm2.requires = ["jqueryui", "score"];

    tbv.f.startLoad = function () {

        jsF.spinner.loadJs()
        .then(function () {
            tbv.f.showDownloadSpinner();
            //D3 and jQuery always loaded up front
            return Promise.all([jsF.d3.loadJs(), jsF.jquery.loadJs()]);
        })
        .then(function () {
            //Use jQuery to create div for visualisations
            jQuery(document).ready(function () {
                jQuery('#tombiod3').append(jQuery('<div id="tombiod3vis">'));
            })
            return loadKB();
        })
        .then(function () {
            //Load tombiovis and the main gui
            if (tbv.opts.gui) {
                var gui = tbv.opts.gui;
            } else {
                //For when gui not specified in opts
                var gui = "guiLargeJqueryUi";
            }
            var pLoad = [jsF.tombiovis.loadJs(), jsF[gui].loadJs()];
            Promise.all(pLoad).then(function () {
                tbv.f.hideDownloadSpinner();
                //Call the application-wide loadComplete (supplied by tombiovis)
                tbv.f.loadcomplete();
            })
        });
    }

    //If the loadWait option is set in the HTML page, then we do not call
    //the load module immediately and wait for it to be explicitly started
    //by the HMTL. (This is to wait for dynamic loads in the main web page.)
    //But if that option is not set, then kick off the load immediately.
    if (!tbv.opts.loadWait) {
        tbv.f.startLoad();
    }

    //Load the KB - returns a promise which fulfills when all loaded
    function loadKB() {
        //Read in the data
        var antiCache = "none"; //Allow caching because of new reload function

        var pAll = [], p;
        p = new Promise(function (resolve) {
            d3.csv(tbv.opts.tombiokbpath + "taxa.csv?" + antiCache,
                function (row) {
                    return filterAndClean(row);
                },
                function (data) {
                    tbv.d.taxa = data;
                    console.log("%cLoading - kb taxa loaded", "color: blue");
                    resolve();
                });
        })
        pAll.push(p);

        p = new Promise(function (resolve) {
            d3.csv(tbv.opts.tombiokbpath + "characters.csv?" + antiCache,
                function (row) {
                    return filterAndClean(row);
                },
                function (data) {
                    tbv.d.characters = data;
                    console.log("%cLoading - kb characters loaded", "color: blue");
                    resolve();
                });
        })
        pAll.push(p);

        p = new Promise(function (resolve) {
            d3.csv(tbv.opts.tombiokbpath + "values.csv?" + antiCache,
                function (row) {
                    return filterAndClean(row);
                },
                function (data) {
                    tbv.d.values = data;
                    console.log("%cLoading - kb values loaded", "color: blue");
                    resolve();
                });
        })
        pAll.push(p);

        p = new Promise(function (resolve) {
            d3.csv(tbv.opts.tombiokbpath + "media.csv?" + antiCache,
                function (row) {
                    return filterAndClean(row);
                },
                function (data) {
                    tbv.d.media = data;
                    console.log("%cLoading - kb media loaded", "color: blue");
                    resolve();
                });
        })
        pAll.push(p);

        p = new Promise(function (resolve) {
            d3.csv(tbv.opts.tombiokbpath + "config.csv?" + antiCache,
                function (row) {
                    return filterAndClean(row);
                },
                function (data) {
                    tbv.d.config = data;
                    tbv.d.kbconfig = {};
                    tbv.d.kbmetadata = {};
                    tbv.d.kbreleaseHistory = [];
                    var excludedTools = [];
                    data.forEach(function (d) {
                        //Set config values
                        if (d.Type == "config") {
                            tbv.d.kbconfig[d.Key] = d.Value;
                        }
                        //tbv.opts.selectedTool (specified in HTML) trumps kb selectedTool setting
                        if (tbv.opts.selectedTool) {

                        }
                        //Populate array of excluded default tools from metadata
                        if (d.Key == "excludedDefaultTools") {
                            if (d.Value.trim() != "") {
                                var excluded = d.Value.split(",");
                                excluded.forEach(function (tool) {
                                    excludedTools.push(tool.trim());
                                });
                            }
                        }
                        //Add other tools from metadata to list of included tools
                        if (d.Key == "otherIncludedTools") {
                            if (d.Value.trim() != "") {
                                var excluded = d.Value.split(",");
                                excluded.forEach(function (tool) {
                                    tbv.v.includedVisualisations.push(tool.trim());
                                });
                            }
                        }
                        //Set metadata values
                        if (d.Type == "metadata") {
                            tbv.d.kbmetadata[d.Key] = d.Value;
                        }
                        //Set metadata values
                        if (d.Key == "release") {
                            tbv.d.kbreleaseHistory.push(d);
                        }
                    });
                    //Update list of included tools from default tools not
                    //explicitly excluded.
                    defaultTools.forEach(function (tool) {
                        if (excludedTools.indexOf(tool) == -1) {
                            tbv.v.includedVisualisations.push(tool);
                        }
                    })
                    //tbv.opts.tools (specified in HTML) trumps kb settings
                    if (tbv.opts.tools && Array.isArray(tbv.opts.tools) && tbv.opts.tools.length > 0) {
                        tbv.v.includedVisualisations = tbv.opts.tools;
                    }

                    console.log("%cLoading - kb config loaded", "color: blue");
                    resolve();
                });
        })
        pAll.push(p);

        //This function returns a promise which fulfills when all KB files are loaded
        return Promise.all(pAll).then(function () {
            console.log("%cKB is loaded!", "color: blue");
        })

        function filterAndClean(row) {
            //Filter out rows with first cells that are either blank or contain a value starting with #
            if (row[Object.keys(row)[0]] != "" && row[Object.keys(row)[0]].substr(0, 1) != "#") {
                //Trim all values
                for (var key in row) {
                    if (row.hasOwnProperty(key)) {
                        //This is to cope with a problem which occurred in some 'empty' cells
                        //when CSV generated by older version of Excel. There must be some sort
                        //of invisible character or something in the cell because D3.csv doesn't
                        //like it and seems to return undefined and whole thing doesn't work
                        //properly. So we look for an undefined value and replace with empty string.
                        //row[key] = row[key].trim();
                        row[key] = row[key] ? row[key].trim() : "";

                        //Lone question marks are notation for KB developers only - they are treated
                        //as missing values by the software, so replace with empty string.
                        if (row[key] == "?") {
                            row[key] = "";
                        }
                    }
                }
                return row;
            } else {
                return null;
            }
        }
    }

    function minifyIfRequired(file) {
        if (!tbv.opts.devel) {
            var i = file.lastIndexOf('.');
            var fileExtension = file.substr(i + 1);
            var fileName = file.substr(0, i);

            //If file is already minified (fileName ends in .min) then
            //no need to change name.
            if (fileName.endsWith(".min")) {
                return file;
            } else {
                return fileName + ".min." + fileExtension;
            }
        } else {
            return file;
        }
    }

    function nameFromPath(file) {
        var split = file.split("/");
        return split[split.length - 1];
    }

    function setVisDependencies (vis, hasKeyInput) {

        if (!tbv.opts.toolconfig[vis]) tbv.opts.toolconfig[vis] = {};
        if (!jsF[vis].requiresFirst) jsF[vis].requiresFirst = [];

        ////Set prototype option
        //if (!tbv.opts.toolconfig[vis].prototype) {
        //    //Prototype for tool is not specified in opts
        //    if (tbv.opts.toolconfig.defaultPrototype) {
        //        //General prototype specified in opts so set to this
        //        tbv.opts.toolconfig[vis].prototype = tbv.opts.toolconfig.defaultPrototype;
        //    } else {
        //        //No general prototype specified either, so set default
        //        tbv.opts.toolconfig[vis].prototype = "visPjQueryUILargeFormat";
        //    }
        //}
        //jsF[vis].requiresFirst.push(tbv.opts.toolconfig[vis].prototype);

        if (hasKeyInput) {
            var keyinput;
            if (!tbv.opts.toolconfig[vis].keyinput) {
                //keyinput for tool is not specified in opts
                if (tbv.opts.toolconfig.defaultKeyinput) {
                    //General keyinput specified in opts so set to this
                    tbv.opts.toolconfig[vis].keyinput = tbv.opts.toolconfig.defaultKeyinput;
                } else {
                    //No general keyinput specified either, so set to default
                    tbv.opts.toolconfig[vis].keyinput = "keyInput";
                }
            }
            jsF[vis].requiresFirst.push(tbv.opts.toolconfig[vis].keyinput);
        }
    }
})(
    //Pass the tombiovis object into this IIFE if it exists (e.g. defined in HTML page)
    //otherwise, initialise it to empty object.
    this.tombiovis ? this.tombiovis : this.tombiovis = {}
);

//Set top level shortcut for tombiovis to allow easier interrogation in browser console
if (tombiovis.opts.devel) {
    var v = tombiovis;
}