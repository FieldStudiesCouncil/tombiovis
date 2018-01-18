(function (tbv) {

    "use strict";
    
    //The following fix is required to stop IE11 throwing its arms up if
    //console.log is used without console being open.
    if (!window.console) {
        window.console = {
            log: function () { }
        };
    }

    //ES6 polyfills - we are standardising on ES5, not ES6, but these functions are particularly useful
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

    if (!tbv.opts) {
        //If tbv.opts doesn't exist, initialise to an empty object
        //to prevent access of properties of tbv.opts from failing.
        //(For backwards compatibility - tvb.opts was not introduced until 1.6.0)
        tbv.opts = {}
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
    
    //The reload option (tombiovis.js) uses window.location.reload(true)
    //to reload the page without cache. While this seems to reload all javascript files
    //on laptop browsers, it doesn't seem to work on Android Chrome or iOS Safari (03/07/2017)
    //so in that case we have to specify (and change) the tombiover variable in the calling
    //HTML page.
    if (!tbv.opts.tombiover) {
        tbv.opts.tombiover = "none";
    }

    //Metadata about the core software. This should be updated for any
    //new release. This includes changes to all code and files in the
    //root source directory, but not that in the sub-directories of the
    //visualisations which each have their own metadata.
    tbv.metadata = {
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
    tbv.includedTools = [];

    //Application-wide structure for holding all the necessary information for
    //dynamically loaded JS modules and associated CSS files
    var jsF = tbv.jsFiles = {
        add: function (id, file, toolName) {
            tbv.jsFiles[id] = Object.create(tbv.jsFile);
            tbv.jsFiles[id].init(id, file, toolName);
        },
        asArray: function () {
            var ret = [];
            for (var f in tbv.jsFiles) {
                if (tbv.jsFiles.hasOwnProperty(f)) {
                    ret.push(tbv.jsFiles[f]);
                }
            }
            return ret;
        }
    };

    //Template object for representing a JS module,
    //its dependencies and associated CSS files.
    //For each module, an object is created using this as its
    //prototype and is added to the tbv.jsFiles collection
    tbv.jsFile = {
        init: function (id, file, toolName) {
            this.id = id;
            this.file = tbv.opts.tombiopath + file;
            this.dependencies = [];
            this.css = [];
            this.load = false;
            this.loading = false;
            this.loaded = false;
            this.toolName = toolName;
        },
        addCSS: function (cssFile) {
            this.css.push(tbv.opts.tombiopath + cssFile)
        },
        markLoadReady: function () {
            //Set the load flag for this object to be true
            this.load = true;
            //And that of any dependencies
            this.dependencies.forEach(function (d) {
                d.markLoadReady();
            })
        }
    }

    //Application-wide function for dynamically loading JS scripts and CSS files.
    //When this is called, any scripts marked as 'loadReady' in the tbv.jsFiles
    //object (and not yet loaded) will be loaded along with any associated 
    //CSS files. It loads each file sequentially (by means of recursive calls).
    //Note that this function is ansynchronous and returns immediately. If it
    //if called again whilst it is already running, it doesn't work properly
    //because things get out of synch with the global tbv.jsFiles object, so
    //avoid doing that!
    tbv.loadScripts = function (callback) {
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
                console.log("%cLoading - something's gone wrong, these files were not loaded...", "color: red")
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
        if (!tbv.opts.devel) {
            jsFile = minifiedName(file.file);
        } else {
            jsFile = file.file;
        }
        s.src = jsFile;

        s.onreadystatechange = s.onload = function () {
            //Cross-browser test of when element loaded correctly from jQuery
            if (!s.readyState || /loaded|complete/.test(s.readyState)) {
                console.log("%cLoading - javascript file loaded: " + jsFile, "color: blue");
                //Mark this file as loaded
                file.loaded = true;
                file.loading = false;
                //Recursively call this function, passing on the callback.
                tbv.loadScripts(callback);
            } else {
                console.log("%cLoading - javascript file load failed: " + jsFile, "color: red");
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
            if (!tbv.opts.devel) {
                cssFileName = minifiedName(cssFile);
            } else {
                cssFileName = cssFile;
            }
            l.href = cssFileName;
            document.querySelector('head').appendChild(l);
            console.log("%cLoading - CSS file added to head: " + cssFileName, "color: blue");
        })
    }

    //Application-wide download spinner create
    tbv.showDownloadSpinner = function () {
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
    tbv.hideDownloadSpinner = function () {
        var tombiod3 = document.getElementById('tombiod3');
        var spinner = document.getElementById('downloadspin');
        tombiod3.removeChild(spinner);
    }

    //Populate the tbv.JSFiles (jsF) with modules and their 
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
    jsF.add("tombiovis", "tombiovis.js?ver=" + tbv.opts.tombiover);
    jsF.tombiovis.addCSS("tombiovis.css");

    //Knowledge-base checks
    jsF.add("kbchecks", "kbchecks.js?ver=" + tbv.opts.tombiover);
    jsF.add("score", "score.js?ver=" + tbv.opts.tombiover);

    //Taxon selection control used by some visualisations
    jsF.add("taxonselect", "taxonselect.js?ver=" + tbv.opts.tombiover);
    jsF.taxonselect.addCSS("taxonselect.css");

    //The prototype visualisation module
    jsF.add("visP", "visP.js?ver=" + tbv.opts.tombiover);

    //The visualisation modules
    jsF.add("vis1", "vis1/vis1.js?ver=" + tbv.opts.tombiover, "Two-column key");
    jsF.vis1.addCSS("vis1/vis1.css");
    jsF.add("vis2", "vis2/vis2.js?ver=" + tbv.opts.tombiover, "Single-column key");
    jsF.vis2.addCSS("vis2/vis2.css");
    jsF.add("vis3", "vis3/vis3.js?ver=" + tbv.opts.tombiover, "Side by side comparison");
    jsF.vis3.addCSS("vis3/vis3.css");
    jsF.add("vis4", "vis4/vis4.js?ver=" + tbv.opts.tombiover, "Full taxon details");
    jsF.vis4.addCSS("vis4/vis4.css");
    jsF.add("vis5", "vis5/vis5.js?ver=" + tbv.opts.tombiover, "Circle-pack key");
    jsF.vis5.addCSS("vis5/vis5.css");
    jsF.add("visEarthworm", "visEarthworm/visEarthworm.js?ver=" + tbv.opts.tombiover, "Earthworm multi-access key");
    jsF.visEarthworm.addCSS("visEarthworm/visEarthworm.css");

    //Specify module dependencies
    jsF.visP.dependencies = [jsF.mousewheel, jsF.hammer];
    jsF.taxonselect.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui];
    jsF.pqgrid.dependencies = [jsF.jquery, jsF.jqueryui];
    jsF.pqselect.dependencies = [jsF.jquery, jsF.jqueryui]; //##Attention - sort pqselect,  pqselect dependences etc
    jsF.tombiovis.dependencies = [jsF.jquery, jsF.jqueryui, jsF.kbchecks, jsF.pqselect];
    jsF.vis1.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui, jsF.visP, jsF.score, keyInput1.js];
    jsF.vis2.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui, jsF.visP, jsF.score, keyInput1.js];
    jsF.vis3.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui, jsF.visP, jsF.taxonselect, jsF.pqgrid, jsF.score];
    jsF.vis4.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui, jsF.visP, jsF.taxonselect];
    jsF.vis5.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui, jsF.visP, jsF.score, keyInput1.js];
    jsF.visEarthworm.dependencies = [jsF.d3, jsF.jquery, jsF.jqueryui, jsF.visP];

    tbv.startLoad = function () {
        //Because of the asynchronous nature of tbv.loadScripts,
        //all functionality is called by chaining from one
        //function to another via the callback of tbv.loadScripts.

        //Load and show the spinner
        jsF.spinner.markLoadReady();
        tbv.loadScripts(function () {
            tbv.showDownloadSpinner();
            //Call jquery load
            jQueryLoad();
        });
    }

    //If the loadWait option is set in the HTML page, then we do not call
    //the load module immediately and wait for it to be explicitly started
    //by the HMTL. (This is to wait for dynamic loads in the main web page.)
    //But if that option is not set, then kick off the load immediately.
    if (!tbv.opts.loadWait) {
        tbv.startLoad();
    }

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
        jsF.jquery.markLoadReady();
        tbv.loadScripts(function () {
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
        jsF.d3.markLoadReady();
        tbv.loadScripts(function () {
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

        d3.csv(tbv.opts.tombiokbpath + "taxa.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {
                tbv.taxa = data;
                console.log("%cLoading - kb taxa loaded", "color: blue");
                loadStatus();
            });

        d3.csv(tbv.opts.tombiokbpath + "characters.csv?" + antiCache,
           function (row) {
               return filterAndClean(row);
           },
           function (data) {
               tbv.characters = data;
               tbv.characters.columns = null; ///////////////////////////////
               console.log("%cLoading - kb characters loaded", "color: blue");
               loadStatus();
           });

        d3.csv(tbv.opts.tombiokbpath + "values.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {
                tbv.values = data;
                console.log("%cLoading - kb values loaded", "color: blue");
                loadStatus();
            });

        d3.csv(tbv.opts.tombiokbpath + "config.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {
                tbv.kbconfig = {};
                tbv.kbmetadata = {};
                tbv.kbreleaseHistory = [];
                var excludedTools = [];
                data.forEach(function (d) {
                    //Set config values
                    if (d.Type == "config") {
                        tbv.kbconfig[d.Key] = d.Value;
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
                                tbv.includedTools.push(tool.trim());
                            });
                        }
                    }
                    //Set metadata values
                    if (d.Type == "metadata") {
                        tbv.kbmetadata[d.Key] = d.Value;
                    }
                    //Set metadata values
                    if (d.Key == "release") {
                        tbv.kbreleaseHistory.push(d);
                    }
                });
                //Update list of included tools from default tools not
                //explicitly excluded.
                defaultTools.forEach(function (tool) {
                    if (excludedTools.indexOf(tool) == -1) {
                        tbv.includedTools.push(tool);
                    }
                })
                //tbv.opts.tools (specified in HTML) trumps kb settings
                if (tbv.opts.tools && Array.isArray(tbv.opts.tools) && tbv.opts.tools.length > 0) {
                    tbv.includedTools = tbv.opts.tools;
                }

                console.log("%cLoading - kb metadata loaded", "color: blue");
                loadStatus();
            });

        d3.csv(tbv.opts.tombiokbpath + "media.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {
                tbv.media = data;
                console.log("%cLoading - kb media loaded", "color: blue");
                loadStatus();
            });
    }

    //Called by loadKB every time one of the
    //CSVs is loaded. Since they are loaded 
    //asynchronously we don't know the order
    //they will complete, so loadStatus checks
    //their completion and only calls kbLoadComplete
    //when they are all loaded.
    function loadStatus() {

        if (tbv.taxa &&
            tbv.characters &&
            tbv.values &&
            tbv.kbmetadata &&
            tbv.media) {

            console.log("%cKB is loaded!", "color: blue");
            kbLoadComplete();
        }
    }

    function kbLoadComplete() {
        //Load the import HTML
        jQuery.get(tbv.opts.tombiopath + "import.html?ver=" + tbv.opts.tombiover, function (data) {
            jQuery("#tombiod3vis").html(data);

            //Finally load tombiovis and invoke function in tombiovis.js to get things going
            jsF.tombiovis.markLoadReady();
            tbv.loadScripts(function () {
                tbv.hideDownloadSpinner();
                //Call the application-wide loadComplete
                //(supplied by tombiovis).
                tbv.loadComplete();
            });
        });
    }
    
})(this.tombiovis ? this.tombiovis : this.tombiovis = {});