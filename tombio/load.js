
(function (core) {

    "use strict";

    //ES6 polyfills
    if (!String.prototype.endsWith) {
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/
        String.prototype.endsWith = function (searchStr, Position) {
            // This works much better than >= because
            // it compensates for NaN:
            if (!(Position < this.length))
                Position = this.length;
            else
                Position |= 0; // round position
            return this.substr(Position - searchStr.length,
                               searchStr.length) === searchStr;
        };
    }
    if (!String.prototype.startsWith) {
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/
        String.prototype.startsWith = function (searchString, position) {
            return this.substr(position || 0, searchString.length) === searchString;
        };
    }

    //For backward compatibility (prior to 1.6.0) allow for direct
    //use of tombiover, tombiopath and tombiokbpath. If they are
    //there, use them to set properties of tombiovis (core)
    if (typeof tombiover !== 'undefined') {
        core.tombiover = tombiover;
    }
    if (typeof tombiopath !== 'undefined') {
        core.tombiopath = tombiopath;
    }
    if (typeof tombiokbpath !== 'undefined') {
        core.tombiokbpath = tombiokbpath;
    }
    if (!core.opts) {
        //If core.opts doesn't exist, initialise to an empty object
        //to prevent access of properties of core.opts from failing.
        core.opts = {}
    }
    //The reload option (tombiovis.js) uses window.location.reload(true)
    //to reload the page without cache. While this seems to reload all javascript files
    //on laptop browsers, it doesn't seem to work on Android Chrome or iOS Safari (03/07/2017)
    //so in that case we have to specify (and change) the tombiover variable in the calling
    //HTML page.
    if (!core.tombiover) {
        core.tombiover = "none";
    }

    //Metadata about the core software. This should be updated for any
    //new release. This includes changes to all code and files in the
    //root source directory, but not that in the sub-directories of the
    //visualisations which each have their own metadata.
    core.metadata = {
        title: "Tom.bio Framework for ID visualisations",
        year: "2016",
        authors: "Burkmar, R.",
        publisher: "Field Studies Council",
        location: "Shrewsbury, England",
        contact: "richardb@field-studies-council.org",
        version: "1.6.0"
    }

    //Variables for the tools to be included
    var defaultTools = ["vis1", "vis2", "vis5", "vis4", "vis3"];
    //var defaultTools = ["vis4", "vis1", "vis2", "vis5"];
    //var defaultTools = ["vis3", "vis1", "vis2", "vis5"];
    core.includedTools = [];

    //Application-wide structure for holding all the necessary information for
    //dynamically loaded JS modules and associated CSS files
    var jsF = core.jsFiles = {
        add: function (id, file, toolName) {
            core.jsFiles[id] = Object.create(core.jsFile);
            core.jsFiles[id].init(id, file, toolName);
        },
        asArray: function () {
            var ret = [];
            for (var f in core.jsFiles) {
                if (core.jsFiles.hasOwnProperty(f)) {
                    ret.push(core.jsFiles[f]);
                }
            }
            return ret;
        }
    };

    //Template object for representing a JS module,
    //its dependencies and associated CSS files.
    //For each module, an object is created using this as its
    //prototype and is added to the core.jsFiles collection
    core.jsFile = {
        init: function (id, file, toolName) {
            this.id = id;
            this.file = core.tombiopath + file;
            this.dependencies = [];
            this.css = [];
            this.load = false;
            this.loading = false;
            this.loaded = false;
            this.toolName = toolName;
        },
        addCSS: function (cssFile) {
            this.css.push(core.tombiopath + cssFile)
        },
        loadReady: function () {
            //Set the load flag for this objec to be true
            this.load = true;
            //And that of any dependencies
            this.dependencies.forEach(function (d) {
                //console.log(d)
                d.loadReady();
            })
        }
    }

    //Application-wide function for dynamically loading JS scripts and CSS files.
    //When this is called, any scripts marked as 'loadReady' in the core.jsFiles
    //object (and not yet loaded) will be loaded along with any associated 
    //CSS files. It loads each file sequentially (by means of recursive calls).
    //Note that this function is ansynchronous and returns immediately. If it
    //if called again whilst it is already running, it doesn't work properly
    //because things get out of synch with the global core.jsFiles object, so
    //avoid doing that!
    core.loadScripts = function (callback) {
        //Filter jsF collection to get all those with load set to true and loaded set to false
        var files = jsF.asArray().filter(function (f) {
            if (f.load && !f.loading && !f.loaded) {
                //At this point we a file marked as ready for load which
                //has not already been loaded (or currently loading).
                //Now we also check its dependencies - only taking those with no unloaded dependencies.
                for (var i = 0; i < f.dependencies.length; i++) {
                    if (!f.dependencies[i].loaded) {
                        return false;
                    }
                }
                return true;
            }
        })

        //If at this point, we have an empty array if all loadReady files are
        //be loaded - if so call the callback.
        if (files.length == 0) {
            //Check to see if all loadReady files have been loaded because
            //if not then something has gone wrong in specification of dependencies.
            var notLoaded = jsF.asArray().filter(function (f) {
                if (f.load && !f.loaded) {
                    return true;
                }
            })
            if (notLoaded.length > 0) {
                console.log("Something's gone wrong, these files were not loaded...")
                notLoaded.forEach(function (f) {
                    console.log(f.id, "load: " + f.load, "loading: " + f.loading, "loaded: " + f.loaded);
                })
                return;
            }

            //All is well
            callback();
            return;
        }
        //Otherwise, take the first file from the array and load it.
        var file = files[0];
        file.loading = true;
        var s = document.createElement('script');

        //If not working in development, minify file names
        var jsFile;
        if (!core.opts.devel) {
            jsFile = minifiedName(file.file);
        } else {
            jsFile = file.file;
        }
        s.src = jsFile;

        s.onreadystatechange = s.onload = function () {
            //Cross-browser test of when element loaded from jQuery
            if (!s.readyState || /loaded|complete/.test(s.readyState)) {
                console.log("Javascript file loaded:", jsFile);
                //Mark this file as loaded
                file.loaded = true;
                file.loading = false;
                //Recursively call this function, passing on the callback.
                core.loadScripts(callback);
            }
        };
        document.querySelector('head').appendChild(s);

        //Add any CSS
        file.css.forEach(function (cssFile) {
            var l = document.createElement('link');
            l.rel = 'stylesheet';
            l.type = 'text/css';
            //If not working in development, minify file names
            var cssFileName;
            if (!core.opts.devel) {
                cssFileName = minifiedName(cssFile);
            } else {
                cssFileName = cssFile;
            }
            l.href = cssFileName;
            document.querySelector('head').appendChild(l);
            console.log("Loading - CSS file added to head:", cssFileName)
        })
    }

    //Application-wide download spinner create
    core.showDownloadSpinner = function () {
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
    core.hideDownloadSpinner = function () {
        var tombiod3 = document.getElementById('tombiod3');
        var spinner = document.getElementById('downloadspin');
        tombiod3.removeChild(spinner);
    }

    //Populate the core.JSFiles (jsF) with modules and their 
    //associated CSS files

    //JQuery
    jsF.add("jquery", "dependencies/jquery-3.1.1/jquery-3.1.1.min.js");

    //JQuery UI
    jsF.add("jqueryui", "dependencies/jquery-ui-1.12.1/jquery-ui.min.js");
    jsF.jqueryui.addCSS("dependencies/jquery-ui-1.12.1/jquery-ui.min.css");
    jsF.jqueryui.addCSS("dependencies/jquery-ui-1.12.1/jquery-ui.theme.min.css");

    //D3
    jsF.add("d3", "dependencies/d3-4.10.0/d3.v4.min.js");

    //Load spinner
    jsF.add("spinner", "dependencies/spin.min.js");

    //These required by visP to provide various interface elements
    jsF.add("mousewheel", "dependencies/jquery.mousewheel.min.js");
    jsF.add("touchpunch", "dependencies/jquery.ui.touch-punch.min.js");
    jsF.add("hammer", "dependencies/hammer.min.js");

    //Required by the character input controls
    jsF.add("pqselect", "dependencies/pqselect-1.3.2/pqselect.min.js");
    jsF.pqselect.addCSS("dependencies/pqselect-1.3.2/pqselect.min.css");

    //Required by vis3
    jsF.add("pqgrid", "dependencies/pqgrid-2.1.0/pqgrid.min.js");
    jsF.pqgrid.addCSS("dependencies/pqgrid-2.1.0/pqgrid.min.css");

    //The main tombiovis module
    jsF.add("tombiovis", "tombiovis.js?ver=" + core.tombiover);
    jsF.tombiovis.addCSS("tombiovis.css");

    //Knowledge-base checks
    jsF.add("kbchecks", "kbchecks.js?ver=" + core.tombiover);
    jsF.add("score", "score.js?ver=" + core.tombiover);

    //Taxon selection control used by some visualisations
    jsF.add("taxonselect", "taxonselect.js?ver=" + core.tombiover);
    jsF.taxonselect.addCSS("taxonselect.css");

    //The prototype visualisation module
    jsF.add("visP", "visP.js?ver=" + core.tombiover);

    //The visualisation modules
    jsF.add("vis1", "vis1/vis1.js?ver=" + core.tombiover, "Two-column key");
    jsF.vis1.addCSS("vis1/vis1.css");
    jsF.add("vis2", "vis2/vis2.js?ver=" + core.tombiover, "Single-column key");
    jsF.vis2.addCSS("vis2/vis2.css");
    jsF.add("vis3", "vis3/vis3.js?ver=" + core.tombiover, "Side by side comparison");
    jsF.vis3.addCSS("vis3/vis3.css");
    jsF.add("vis4", "vis4/vis4.js?ver=" + core.tombiover, "Full taxon details");
    jsF.vis4.addCSS("vis4/vis4.css");
    jsF.add("vis5", "vis5/vis5.js?ver=" + core.tombiover, "Circle-pack key");
    jsF.vis5.addCSS("vis5/vis5.css");
    jsF.add("visEarthworm", "visEarthworm/visEarthworm.js?ver=" + core.tombiover, true);
    jsF.visEarthworm.addCSS("visEarthworm/visEarthworm.css");

    //Specify module dependencies
    jsF.visP.dependencies = [jsF.mousewheel, jsF.hammer];
    jsF.taxonselect.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui];
    jsF.pqgrid.dependencies = [jsF.jquery, jsF.jqueryui];
    jsF.pqselect.dependencies = [jsF.jquery, jsF.jqueryui];
    jsF.tombiovis.dependencies = [jsF.jquery, jsF.jqueryui, jsF.kbchecks, jsF.pqselect];
    jsF.vis1.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui, jsF.visP, jsF.score];
    jsF.vis2.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui, jsF.visP, jsF.score];
    jsF.vis3.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui, jsF.visP, jsF.taxonselect, jsF.pqgrid, jsF.score];
    jsF.vis4.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui, jsF.visP, jsF.taxonselect];
    jsF.vis5.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui, jsF.visP, jsF.score];
    jsF.visEarthworm.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui];

    //Because of the asynchronous nature of core.loadScripts,
    //all functionality is called by chaining from one
    //function to another via the callback of core.loadScripts.

    //Load and show the spinner
    jsF.spinner.loadReady();
    core.loadScripts(function () {
        core.showDownloadSpinner();
        //Call jquery load
        jQueryLoad();
    });

    function minifiedName(file) {

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
    }

    //Load jQuery
    function jQueryLoad() {
        jsF.jquery.loadReady();
        core.loadScripts(function () {
            //Use jQuery to create div for visualisations
            jQuery(document).ready(function () {
                jQuery('#tombiod3').append(jQuery('<div id="tombiod3vis">'));
            })
            //Now load D3
            loadD3andKB();
        });
    }

    //Load D3
    function loadD3andKB() {
        jsF.d3.loadReady();
        core.loadScripts(function () {
            //Now load the KB
            loadKB();
        });
    }

    //Load the KB
    function loadKB() {
        //Read in the data
        var antiCache = "none"; //Allow caching because of new reload function

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
                    }
                }
                return row;
            } else {
                return null;
            }
        }

        d3.csv(core.tombiokbpath + "taxa.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {
                //console.log("taxa", data)
                core.taxa = data;
                console.log("Loading - kb taxa loaded");
                loadStatus();
            });

        d3.csv(core.tombiokbpath + "characters.csv?" + antiCache,
           function (row) {
               return filterAndClean(row);
           },
           function (data) {
               //console.log("characters", data)
               core.characters = data;
               console.log("Loading - kb characters loaded");
               loadStatus();
           });

        d3.csv(core.tombiokbpath + "values.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {
                //console.log("values", data)
                core.values = data;
                console.log("Loading - kb values loaded");
                loadStatus();
            });

        d3.csv(core.tombiokbpath + "config.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {
                //console.log("config", data)
                core.kbconfig = {};
                core.kbmetadata = {};
                core.kbreleaseHistory = [];
                var excludedTools = [];
                data.forEach(function (d) {
                    //Set config values
                    if (d.Type == "config") {
                        core.kbconfig[d.Key] = d.Value;
                    }
                    //core.opts.selectedTool (specified in HTML) trumps kb selectedTool setting
                    if (core.opts.selectedTool) {

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
                                core.includedTools.push(tool.trim());
                            });
                        }
                    }
                    //Set metadata values
                    if (d.Type == "metadata") {
                        core.kbmetadata[d.Key] = d.Value;
                    }
                    //Set metadata values
                    if (d.Key == "release") {
                        core.kbreleaseHistory.push(d);
                    }
                });
                //Update list of included tools from default tools not
                //explicitly excluded.
                defaultTools.forEach(function (tool) {
                    if (excludedTools.indexOf(tool) == -1) {
                        core.includedTools.push(tool);
                    }
                })
                //core.opts.tools (specified in HTML) trumps kb settings
                if (core.opts.tools && Array.isArray(core.opts.tools) && core.opts.tools.length > 0) {
                    core.includedTools = core.opts.tools;
                }

                console.log("Loading - kb metadata loaded");
                loadStatus();
            });

        d3.csv(core.tombiokbpath + "media.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {
                //console.log("media", data)
                core.media = data;
                console.log("Loading - kb media loaded");
                loadStatus();
            });
    }

    //Called by loadKB every time one of the
    //CSVs is loaded. Since they are loaded 
    //asynchronously we don't know the order
    //they will complete, so loadStatus checks
    //their completion and only calls loadComplete
    //when they are all loaded.
    function loadStatus() {

        if (core.taxa &&
            core.characters &&
            core.values &&
            core.kbmetadata &&
            core.media) {

            console.log("KB is loaded!")
            loadComplete();
        }
    }

    function loadComplete() {
        //Load the import HTML
        jQuery.get(core.tombiopath + "import.html?ver=" + core.tombiover, function (data) {
            jQuery("#tombiod3vis").html(data);

            //Finally load tombiovis and invoke function in tombiovis.js to get things going
            jsF.tombiovis.loadReady();

            core.loadScripts(function () {
                core.hideDownloadSpinner();
                //Call the application-wide loadComplete
                //(supplied by tombiovis).
                core.loadComplete();
            });
        });
    }

    
})(this.tombiovis ? this.tombiovis : this.tombiovis = {});