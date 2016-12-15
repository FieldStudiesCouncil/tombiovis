
(function (core) {
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
        version: 1.1
    }

    core.tombiover = "none";

    //Variables for the tools to be included
    var defaultTools = ["vis1", "vis2", "vis3", "vis4"];
    var includedTools = [];

    //Other tracking variables
    var mainScriptsLoaded = false;
    var dataLoaded = false;
    var iScript, scripts;

    //First things first, start firing up the spinner
    loadScript("dependencies/spin.js", addDownloadSpinner);
    function addDownloadSpinner() {

        //Div for wait spinner
        var waitDiv = document.createElement('div');
        waitDiv.id = 'downloadspin';
        document.getElementById('tombiod3').appendChild(waitDiv);

        //Div for main vis
        var visDiv = document.createElement('div');
        visDiv.id = 'tombiod3vis';
        document.getElementById('tombiod3').appendChild(visDiv);

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
    
    //Load the CSS files
    var iCSS = 0;
    var css = [
        "dependencies/jquery-ui-1.12.1/jquery-ui.min.css",
        "dependencies/jquery-ui-1.12.1/jquery-ui.theme.min.css",
        "dependencies/pqselect-1.3.2/pqselect.min.css", 
        "dependencies/pqgrid-2.1.0/pqgrid.min.css", //Required for vis3
        "tombiovis.css"
    ]
    css.forEach(function (cssFile) {
        loadCSSFile(cssFile);
    })

    function loadCSSFile(cssFile) {
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.type = 'text/css';
        l.href = tombiopath + cssFile;
        document.querySelector('head').appendChild(l);
    }

    //Load D3 and then use it to load the KB
    loadScript("dependencies/d3.min.js", loadKB);
    function loadKB() {
        //Read in the data
        var antiCache = "none"; //Allow caching because of new reload function

        function filterAndClean(row) {
            //Filter out rows with first cells that are either blank or contain a value starting with #
            if (row[Object.keys(row)[0]] != "" && row[Object.keys(row)[0]].substr(0, 1) != "#") {
                //Trim all values
                for (var key in row) {
                    if (row.hasOwnProperty(key)) {
                        row[key] = row[key].trim();
                    }
                }
                return row;
            } else {
                return null;
            }
        }

        d3.csv(tombiokbpath + "taxa.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {
                core.taxa = data;
                loadStatus();
            });

        d3.csv(tombiokbpath + "characters.csv?" + antiCache,
           function (row) {
               return filterAndClean(row);
           },
           function (data) {
               core.characters = data;
               loadStatus();
           });

        d3.csv(tombiokbpath + "values.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {
                core.values = data;
                loadStatus();
            });

        d3.csv(tombiokbpath + "config.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {

                core.kbconfig = {};
                core.kbmetadata = {};
                core.kbreleaseHistory = [];
                var excludedTools = [];
                data.forEach(function (d) {
                    //Set config values
                    if (d.Type == "config") {
                        core.kbconfig[d.Key] = d.Value;
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
                                includedTools.push(tool.trim());
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
                        includedTools.push(tool);
                    }
                })
                loadStatus();
            });

        d3.csv(tombiokbpath + "media.csv?" + antiCache,
            function (row) {
                return filterAndClean(row);
            },
            function (data) {
                core.media = data;
                loadStatus();
            });
    }

    //Define functions for script loading
    function loadScript(src, callback, allDoneCallback) {
        var s = document.createElement('script');
        s.src = tombiopath + src;
        s.onreadystatechange = s.onload = function () {
            //Cross-browser test of when element loaded from jQuery
            if (!s.readyState || /loaded|complete/.test(s.readyState)) {
                //console.log("Loaded " + src);
                callback(allDoneCallback);
            }
        };
        document.querySelector('head').appendChild(s);
    }
    function nextScript(allDoneCallback) {
        if (iScript < scripts.length - 1) {
            iScript++;
            loadScript(scripts[iScript], nextScript, allDoneCallback);
        } else {
            allDoneCallback();
        }
    }

    //Start loading other scripts sequentially
    iScript = 0;
    scripts = [
        "dependencies/jquery-3.1.1/jquery-3.1.1.min.js",
        "dependencies/jquery-ui-1.12.1/jquery-ui.min.js",
        "dependencies/jquery.mousewheel.min.js",
        "dependencies/pqselect-1.3.2/pqselect.min.js",
        "dependencies/pqgrid-2.1.0/pqgrid.min.js",
        "tombiovis.js?ver=" + core.tombiover,
        "score.js?ver=" + core.tombiover,
        "visP.js?ver=" + core.tombiover
    ]
    loadScript(scripts[iScript], nextScript, function () {
        mainScriptsLoaded = true;
        loadStatus();
    });

    //When main scripts and KB loaded, sort out modules and HTML import
    function loadStatus() {

        if (mainScriptsLoaded &&
            core.taxa &&
            core.characters &&
            core.values &&
            core.metadata) {

            //Create javascript modules corresponding to the required tools
            //which has been determined from KB.
            scripts = [];
            includedTools.forEach(function (tool) {
                //Add javascript to list to be loaded sequentially
                scripts.push(tool + "/" + tool + ".js?ver=" + core.tombiover);
                //Load any associated css now
                var toolCSS = tool + "/" + tool + ".css?ver=" + core.tombiover;
                jQuery.ajax({
                    url: tombiopath + toolCSS,
                    type: 'HEAD',
                    error: function () {
                        //file not exists
                        console.log("CSS file '" + toolCSS + "' not found.")
                    },
                    success: function () {
                        //file exists
                        loadCSSFile(toolCSS);
                    }
                });
            });

            //Initialise loading of module scripts and on completion
            //invoke scripLoadComplete;
            iScript = 0;
            loadScript(scripts[iScript], nextScript, function () {

                //At this point, all kb, main javascript,
                //and module javascript loads are done, so
                //main routine in tombiovis.js can be called.

                //Create the core.requiredVisTools for tombiovis.js
                core.requiredVisTools = [];
                includedTools.forEach(function (tool) {
                    core.requiredVisTools.push(core[tool]);
                });

                //Load the import HTML
                jQuery.get(tombiopath + "import.html?ver=" + core.tombiover, function (data) {

                    jQuery("#tombiod3vis").html(data);

                    //console.log("load", jQuery.fn.jquery)

                    //Finally invoke function in tombiovis.js to get things going
                    core.loadComplete();
                });
            });
        }
    }

})(this.tombiovis = {});