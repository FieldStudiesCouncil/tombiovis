(function ($, tbv) {
    "use strict"; 

    //Get rid of test harness tombiod3-header and tombiod3-footer - not suitable for onsen UI
    $('#tombiod3-header').remove();
    $('#tombiod3-footer').remove();

    var tools = {};
    var onsSplitterSideMediaQuery;
    var pinMenu;
    tbv.gui.main = {
        fn: {}
    };

    //Required for standard gui interface
    tbv.gui.main.setSelectedTool = function (toolName) {

    }

    tbv.gui.main.updateProgress = function (value) {
        //Increments offline download progress (value is in percent of resources)
        if (value == 100) {
            $('#tombioOnsDownloadProgressHeader').text("Resource download complete")
        }
        $('#tombioOnsDownloadProgressHeader').show();
        $('#tombioOnsDownloadProgress').attr("value", value);
    }

    tbv.gui.main.offlineOptions = function () {
        //Instructs the GUI to present offline management options to user.
        var html = ""
        html += '<ons-button  modifier="outline" onclick="tombiovis.f.cacheAll()">Download for offline use</ons-button>';
        html += '<p id="tombioOnsDownloadProgressHeader" style="display: none">Downloading resources...</p>';
        html += '<ons-progress-bar id="tombioOnsDownloadProgress" value="0"></ons-progress-bar>';

        tbv.gui.main.dialog("Offline options", html)
    }

    tbv.gui.main.offerRefresh = function () {
        //Instructs the GUI to offer refresh to user.
        var dialog = document.getElementById('refreshPrompt');

        if (dialog) {
            dialog.show();
        } else {
            ons.createElement('refreshPromptTemplate', { append: true })
                .then(function (dialog) {
                    dialog.show();
                });
        }
    }

    //Required for standard gui interface
    tbv.gui.main.resizeControlsAndTaxa = function () {

    }

    //Required for standard gui interface
    tbv.gui.main.init = function () {

        onsSplitterSideMediaQuery = "(max-width: 979px)"; //Break should match equivalent media queries in CSS file 
        if (!window.matchMedia(onsSplitterSideMediaQuery).matches) {
            pinMenu = true;
        } else {
            pinMenu = false;
        }

        //Build top level interface elements
        $("#tombiod3vis").html(''); //This point can be reached a second time if checking is enabled and 'continue' button uses, so clear out the div.

        $('<div>').attr('id', 'tombioOnsHiddenVisualisation').hide().appendTo('#tombiod3vis');
        $('<div>').attr('id', 'tombioOnsHiddenControls').hide().appendTo('#tombiod3vis');

        tbv.gui.main.divVis = "#tombioOnsHiddenVisualisation";
        tbv.gui.main.divInput = "#tombioOnsHiddenControls";

        $("<div>").attr("id", "tombioOns").appendTo($("#tombiod3vis"));

        var html = '';
        html += '<ons-navigator swipeable id="tombioOnsNavigator" page="tombioOnsSelectTemplate"></ons-navigator>';

        html += '<template id="tombioOnsSelectTemplate">';
        html += '<ons-page id="tombioOnsToolSelect">';
        html += '<ons-toolbar>';
        html += '<div class="center">' + tbv.d.kbmetadata.title + '</div>';
        html += '</ons-toolbar>';
        html += '<ons-list id="tombioOnsTools"></ons-list>';
        html += '</ons-page>';
        html += '</template>';

       
        html += '<template id="tombioOnsVisualisationTemplate">';
        html += '<ons-page id="tombioOnsVisualisation">';
        html += '<ons-splitter>';

        //html += '<ons-splitter-side id="tombioOnsMenu" side="left" collapse="' + onsSplitterSideMediaQuery + '" swipeable>';
        html += '<ons-splitter-side id="tombioOnsMenu" side="left" collapse swipeable>';
        html += '<ons-page id="tombioOnsVisInput">';
        html += '<ons-toolbar>';
        html += '<div class="left">';
        html += '<ons-back-button id="tombioUiSideMenuBackButton"></ons-back-button>';
        html += '</div>';
        html += '<div class="right">';
        html += '<ons-toolbar-button id="tombioUiSideMenuPin" onclick="tombiovis.gui.main.fn.toggleMenuPin()">';
        html += '<ons-icon  id="tombioUiSideMenuPinIcon" icon=""></ons-icon>';
        html += '</ons-toolbar-button>';
        html += '</div>';
        //html += '<div class="center"><ons-icon icon="md-keyboard" size="30px" style="color: #1e88e5; margin-top: 7px"></ons-icon></div>';
        html += '</ons-toolbar>';
        html += '<div id="tombioOnsVisInputDiv"></div>';
        html += '</ons-page>';
        html += '</ons-splitter-side>';

        html += '<ons-splitter-content id="content" page="tombioOnsVisDisplayTemplate"></ons-splitter-content>';
        html += '</ons-splitter>';
        html += '</ons-page>';
        html += '</template>';

        html += '<template id="tombioOnsVisDisplayTemplate">';
        html += '<ons-page id="tombioOnsVisDisplay">';
        html += '<ons-toolbar>';

        var tb = "";
        //tb += '<ons-toolbar-button id="tombioUiFullscreenMenuButton" onclick="tombiovis.gui.main.fn.requestFullscreen()">';
        //tb += '<ons-icon icon="md-fullscreen"></ons-icon>';
        //tb += '</ons-toolbar-button>';
        //tb += '<ons-toolbar-button id="tombioUiExitFullscreenMenuButton" onclick="tombiovis.gui.main.fn.exitFullscreen()" style="display: none">';
        //tb += '<ons-icon icon="md-fullscreen-exit"></ons-icon>';
        //tb += '</ons-toolbar-button>';
        tb += '<ons-toolbar-button id="tombioUiContextMenuButton" onclick="tombiovis.gui.main.openContext()">';
        tb += '<ons-icon icon="md-more-vert"></ons-icon>';
        tb += '</ons-toolbar-button>';
        tb += '<ons-toolbar-button onclick="tombiovis.gui.main.popPage()">';
        tb += '<ons-icon icon="md-menu"></ons-icon>';
        tb += '</ons-toolbar-button>';

        html += '<div class="left">';
        html += '<ons-toolbar-button id="tombioUiInputToolbarButton" onclick="tombiovis.gui.main.openMenu()">';
        html += '<ons-icon icon="md-keyboard"></ons-icon>';
        html += '</ons-toolbar-button>';
        html += '<div id="tombioOnsToolsLeft" style="display:none">';
        html += tb;
        html += '</div>';
        html += '</div>';
        html += '<div id="tombioOnsToolsRight" class="right">';
        html += tb;
        html += '</div>';
        html += '</ons-toolbar>';

        html += '<div id="tombioOnsVisDisplayDiv"></div>';
        html += '<div id="tombioOnsOtherInfoDiv"></div>';
        html += '</ons-page>';
        html += '</template>';

        //Dialog template
        html += '<template id="tombioOnsDialogTemplate">';
        html += '<ons-page id="tombioOnsDialog">';
        html += '<ons-toolbar>';
        html += '<div class="left">';
        html += '<ons-back-button></ons-back-button>';
        html += '</div>';
        html += '<div id="tombioOnsDialogTitle" class="center"></div>';
        html += '</ons-toolbar>';
        html += '<div id="tombioOnsDialogContent" style="margin: 1em"></div>';
        html += '</ons-page>';
        html += '</template>';

        //Context menu template
        html += '<template id="tombioOnsContextTemplate">';
        html += '<ons-page id="tombioOnsContext">';
        html += '<ons-toolbar>';
        html += '<div class="left">';
        html += '<ons-back-button></ons-back-button>';
        html += '</div>';
        html += '<div class="center">Context menu</div>';
        html += '</ons-toolbar>';
        //html += '<div id="tombioOnsContextContent" style="margin: 1em"></div>';
        html += '<ons-list id="tombioOnsContextContent"></ons-list>';
        html += '</ons-page>';
        html += '</template>';

        //Refresh dialog template
        html += '<template id="refreshPromptTemplate">';
        html += '<ons-alert-dialog id="refreshPrompt" modifier="rowfooter">';
        html += '<div class="alert-dialog-title">Refresh required</div>';
        html += '<div class="alert-dialog-content">';
        html += 'To complete preparation for using offline, a refresh is required.';
        html += '</div>';
        html += '<div class="alert-dialog-footer">';
        html += '<ons-alert-dialog-button onclick="tombiovis.gui.main.fn.refreshDialogDismissed()">Not now</ons-alert-dialog-button>';
        html += '<ons-alert-dialog-button onclick="tombiovis.gui.main.fn.refreshDialogDismissed(true)">Refresh</ons-alert-dialog-button>';
        html += '</div>';
        html += '</ons-alert-dialog>';
        html += '</template>';

        $("#tombioOns").append($(html));

        tbv.gui.main.fn.refreshDialogDismissed = function (refresh) {
            document.getElementById('refreshPrompt')
                .hide();
            if (refresh) {
                console.log("Refresh", refresh);
                window.location.reload();
            }
        }

        tbv.gui.main.openMenu = function () {
            var menu = document.getElementById('tombioOnsMenu');
            menu.open();
        };

        tbv.gui.main.openContext = function () {
            document.querySelector('#tombioOnsNavigator').pushPage('tombioOnsContextTemplate')
                .then(function () {
                    generateContextMenu();
                })
        };

        tbv.gui.main.popPage = function () {
            document.querySelector('#tombioOnsNavigator').popPage()
                .then(function () {
                    //console.log("Page popped");
                })
                .catch(function () {
                    //console.log("Page pop error");
                })
        }

        document.addEventListener('init', function (event) {
            var page = event.target;
            //console.log("init", page.id)

            if (page.id === 'tombioOnsToolSelect') {
                //Populate the interface controls (skipped from the usual call from tombiovis)
                tbv.gui.main.createUIControls(true);
            } else if (page.id === 'tombioOnsVisDisplay') {
                $('#tombioOnsVisDisplayDiv').append($('#tombioOnsHiddenVisualisation'));
                $('#tombioOnsHiddenVisualisation').show();
            } else if (page.id === 'tombioOnsVisInput') {
                $('#tombioOnsVisInputDiv').append($('#tombioOnsHiddenControls'));
                $('#tombioOnsHiddenControls').show();

                //Override back-button on side menu
                //(Note that this cannot be added via the onclick attribute which doesn't cancel the default behaviour
                //of popping the last navigator page)
                document.querySelector('#tombioUiSideMenuBackButton').onClick = function (event) {
                    var menu = document.getElementById('tombioOnsMenu');
                    menu.close();
                };
            }
        });

        document.addEventListener('destroy', function (event) {
            var page = event.target;
            //console.log('destroy', page.id);

            if (page.id === 'tombioOnsVisualisation') {
                $('#tombioOnsHiddenVisualisation').hide();
                $('#tombiod3vis').append($('#tombioOnsHiddenVisualisation'));
                $('#tombioOnsHiddenControls').hide();
                $('#tombiod3vis').append($('#tombioOnsHiddenControls'));
            }
        });

        document.addEventListener('show', function (event) {
            var page = event.target;
            //console.log('show', page.id);
        });

        document.addEventListener('hide', function (event) {
            var page = event.target;
            //console.log('hide', page.id);
        });

        //Add handler for orientation change
        ons.orientation.on('change', function () {
            console.log("Orientation changed")
            splitterSideHideShow();
            resizeElements();
            //Refresh the selected tool
            //The timeout delay seems to be required otherwise the refresh method fires before divs have resized
            setTimeout(function () {
                tbv.f.refreshVisualisation();
                mainMenuPos();
            }, 1000);
        });    

        //Check interface
        tbv.f.checkInterface("guiOnsenUi", tbv.templates.gui.main, tbv.gui.main);
    }

    //Required for standard gui interface
    tbv.gui.main.createUIControls = function () {

        //Drop-down menu options for the visualisations
        var toolOptions = [];
        
        //Developer's header
        if (tbv.opts.checkKB || tbv.opts.devel) {
            toolOptions.push($('<ons-list-header>For developers</ons-list-header>'));
        }

        //If the tbv.opts.devel option is set, add item to check media files.
        //The option *values* mediaFilesCheck & tvkCheck have software-wide meaning, not just this gui
        icon = '<div class="left"><ons-icon icon="md-wrench" class="list-item__icon"></ons-icon></div>'
        if (tbv.opts.checkKB) {
            toolOptions.push($('<ons-list-item value="reloadkb" class="html" data-class="wrench">' + icon + 'Reload KB</ons-list-item>'));
            toolOptions.push($('<ons-list-item value="mediaFilesCheck" class="html" data-class="wrench">' + icon + 'Check media files</ons-list-item>'));
            if (tbv.d.oCharacters.tvk) {
                toolOptions.push($('<ons-list-item value="tvkCheck" class="html" data-class="wrench">' + icon + 'Check TVKs</ons-list-item>'));
            }
        }
        //if (tbv.opts.devel) {
        //    toolOptions.push($('<ons-list-item value="reloadGuiOnsen" class="html" data-class="wrench">' + icon + 'Reload with mobile-first interface</ons-list-item>'));
        //    toolOptions.push($('<ons-list-item value="reloadGuiJQuery" class="html" data-class="wrench">' + icon + 'Reload with large format interface</ons-list-item>'));
        //}

        icon = '<div class="left"><ons-icon icon="md-lamp" class="list-item__icon"></ons-icon></div>'
        toolOptions.push($('<ons-list-header>Visualisations</ons-list-header>'));
        //Add the required visualisation tools
        tbv.v.includedVisualisations.forEach(function (toolName, iTool) {

            // User can override default toolname in options
            if (tbv.opts.toolconfig[toolName] && tbv.opts.toolconfig[toolName].name) {
                var displayName = tbv.opts.toolconfig[toolName].name
            } else {
                var displayName = tbv.js.jsFiles[toolName].toolName
            }

            var selOpt = $('<ons-list-item>')
                .attr("value", toolName)
                .attr("data-class", "vis")
                //.text(tbv.js.jsFiles[toolName].toolName);
                .text(displayName);

            selOpt.append($(icon))

            toolOptions.push(selOpt);
        })

        if (!tbv.opts.dd || 
            (tbv.opts.dd.indexOf("help") > -1) ||
            (tbv.opts.dd.indexOf("kb") > -1) ||
            (tbv.opts.dd.indexOf("identikit") > -1) ||
            (tbv.opts.dd.indexOf("citation") > -1))  {
            toolOptions.push($('<ons-list-header>Help &amp; Information</ons-list-header>'));
        }
        //Add the various info tools

        //The option *values* currentVisInfo, kbInfo, visInfo & tombioCitation have software-wide meaning, not just this gui
        icon = '<div class="left"><ons-icon icon="md-info" class="list-item__icon"></ons-icon></div>'

        if (!tbv.opts.dd || tbv.opts.dd.indexOf("help") > -1) {
            toolOptions.push($('<ons-list-item id="optCurrentVisInfo" value="currentVisInfo" class="html" data-class="info">' + icon + 'Using the...</ons-list-item>'));
        }
        if (!tbv.opts.dd || tbv.opts.dd.indexOf("kb") > -1) {
            toolOptions.push($('<ons-list-item value="kbInfo" class="html" data-class="info">' + icon + 'About the Knowledge-base</ons-list-item>'));
        }
        if (!tbv.opts.dd || tbv.opts.dd.indexOf("identikit") > -1) {
            toolOptions.push($('<ons-list-item value="visInfo" class="html" data-class="info">' + icon + 'About FSC Identikit</ons-list-item>'));
        }
        if (!tbv.opts.dd || tbv.opts.dd.indexOf("citation") > -1) {
            toolOptions.push($('<ons-list-item value="tombioCitation" class="html" data-class="info">' + icon + 'Get citation text</ons-list-item>'));
        }
        toolOptions.push($('<ons-list-item id="optPdfInfo" style="display: none">' + icon + '<a href="' + tbv.opts.tombiokbpath + "info.pdf" + '">About this resource PDF</a></ons-list-item>'));

        //Show the PDF Info option if info.pdf file is found
        $.ajax({
            //https://forums.asp.net/t/1640966.aspx?Check+file+exist+on+server+using+Javascript
            type: "HEAD",
            url: tbv.opts.tombiokbpath + "info.pdf",
            success: function (data) {
                $('#optPdfInfo').show();
            }
        });

        //If developer's section added above, then add a header for standard reload and download
        if (tbv.opts.pwa || (!tbv.opts.dd || tbv.opts.dd.indexOf("reload") > -1)) {
            toolOptions.push($('<ons-list-header>Other</ons-list-header>'));
        }
        //Add option for offline options
        if (tbv.opts.pwa) {
            var icon = '<div class="left"><ons-icon icon="md-download" class="list-item__icon"></ons-icon></div>'
            toolOptions.push($('<ons-list-item value="offline" class="html" data-class="?">' + icon + 'Offline options</ons-list-item>'));
        }
        //Add reload option
        if (!tbv.opts.dd || tbv.opts.dd.indexOf("reload") > -1) {
            var icon = '<div class="left"><ons-icon icon="md-redo" class="list-item__icon"></ons-icon></div>'
            toolOptions.push($('<ons-list-item value="reload" class="html" data-class="reload">' + icon + 'Reload app</ons-list-item>'));
        }

        //Add click event to the menu items
        toolOptions.forEach(function (i) {

            if (i.prop("tagName").toLowerCase() == "ons-list-item") {
                //Store the names of the tools for later
                tools[i.attr("value")] = i.text();

                //Add event handler
                i.on("click", function () {
                    tbv.v.selectedTool = i.attr("value");
                    tbv.f.visChanged(tbv.v.selectedTool);
                })
            }
        })

        $("#tombioOnsTools").append(toolOptions);
    }

    //Required for standard gui interface
    tbv.gui.main.visShow = function (selectedToolName) {

        var templateMenu = document.querySelector('#tombioOnsVisualisationTemplate').content.querySelector('#tombioOnsMenu');
        if (pinMenu) {
            templateMenu.removeAttribute("collapse")
        } else {
            templateMenu.setAttribute("collapse", "")
        }
        document.querySelector('#tombioOnsNavigator').pushPage('tombioOnsVisualisationTemplate')
            .then(updatePage);

        function updatePage() {

            //Replace gui item with visname
            //$('#tombioOnsVisName').text(tools[selectedToolName]);

            //Needs to be done after the promise to display the interface is fulfilled otherwise
            //the visualisations don't initialise properly.

            $('#tombioOnsOtherInfoDiv').html(null);

            //Get the selected visualisation
            var selectedTool = tbv.v.visualisations[selectedToolName];

            //If the user has selected to show citation then generate
            if (selectedToolName == "tombioCitation") {
                $('#tombioOnsOtherInfoDiv').html(createCitationPage());
            }

            //If the user has selected to check media files
            if (selectedToolName == "mediaFilesCheck") {
                $('#tombioOnsOtherInfoDiv').html(tbv.f.createMediaCheckPage());
            }

            //If the user has selected to check media files
            if (selectedToolName == "tvkCheck") {
                $('#tombioOnsOtherInfoDiv').html(tbv.f.createTvkCheckPage());
            }

            //If the user has selected to show kb info
            if (selectedToolName == "kbInfo") {
                tbv.f.setKbInfo($('#tombioOnsOtherInfoDiv'));
            }

            //If the user has selected to show general tombio vis info
            if (selectedToolName == "visInfo") {
                tbv.f.setVisInfo($('#tombioOnsOtherInfoDiv'));
            }

            //If the user has selected to show info for current visualisation then load.
            //(This is done every time because info can changed depending on last selected tool.)
            if (selectedToolName == "currentVisInfo") {
                $('#tombioOnsOtherInfoDiv').html('');
                tbv.f.setSelectedToolInfo($('#tombioOnsOtherInfoDiv'));
            }

            //Change tool if necessary and associated input control
            if (selectedToolName != tbv.v.currentTool) {

                //Hide previous tool and input control
                if (tbv.v.currentTool) {
                    if (tbv.v.visualisations[tbv.v.currentTool]) {
                        tbv.v.visualisations[tbv.v.currentTool].hide();
                    } else {
                        $('#' + tbv.v.currentTool).hide();
                    }
                }
                //Show new control
                if (tbv.v.visualisations[selectedToolName]) {
                    tbv.v.visualisations[selectedToolName].show();
                } else {
                    $('#' + selectedToolName).show();
                }
            }

            //Refresh the selected tool
            tbv.f.refreshVisualisation();

            //Store current tool
            tbv.v.currentTool = selectedToolName;

            //Store the last used visualisation and change the name of the menu
            //item for getting info about it.
            if (Object.keys(tbv.v.visualisations).indexOf(selectedToolName) > -1) {

                tbv.v.lastVis = selectedToolName;
                $("#optCurrentVisInfo>div.center").text("Using the " + tbv.v.visualisations[tbv.v.lastVis].metadata.title);
            }

            //Show/hide the correct div
            if (tbv.v.includedVisualisations.indexOf(selectedToolName) > -1) {
                $('#tombioOnsVisDisplayDiv').show();
                $('#tombioOnsOtherInfoDiv').hide();
            } else {
                $('#tombioOnsVisDisplayDiv').hide();
                $('#tombioOnsOtherInfoDiv').show();
            }

            splitterSideHideShow();

            //If this is the first time through - i.e. page just loaded - and
            //this is a visualisation too, then process any URL initialisation parameters.
            if (!tbv.v.initialised && tbv.v.visualisations[selectedToolName]) {
                //Get all the URL parameters
                var params = {};
                //(The global replace on plus characters is to overcome a problem with links put into facebook which
                //replace some space characters with plus characters).
                var sPageURL = decodeURI(window.location.search.substring(1)).replace(/\+/g, ' ');

                var splitParamAndValue = sPageURL.split('&');
                for (var i = 0; i < splitParamAndValue.length; i++) {
                    var sParamAndValue = splitParamAndValue[i].split('=');
                    params[sParamAndValue[0]] = sParamAndValue[1];
                }
                //Pass into selected tool
                tbv.v.visualisations[selectedToolName].urlParams(params);

                //Set initialised flag
                tbv.v.initialised = true;
            }

            //Show/hide context menu button
            var contextMenuNeeded;
            console.log(selectedToolName);
            Object.keys(tbv.gui.main.contextMenu.items).forEach(function (contextItem) {
                console.log(tbv.gui.main.contextMenu.visContexts[contextItem])
                if (tbv.gui.main.contextMenu.visContexts[contextItem].indexOf(selectedToolName) != -1) {
                    contextMenuNeeded = true;
                }
            })
            if (contextMenuNeeded) {
                $('ons-toolbar-button#tombioUiContextMenuButton.toolbar-button').show();
            } else {
                $('ons-toolbar-button#tombioUiContextMenuButton.toolbar-button').hide();
            }
        }
    }

    //Required for standard gui interface
    tbv.gui.main.dialog = function (title, html) {

        document.querySelector('#tombioOnsNavigator').pushPage('tombioOnsDialogTemplate')
            .then(function () {
                $('#tombioOnsDialogTitle').text(title);
                $('#tombioOnsDialogContent').html(html);
            })
    }

    //Required for standard gui interface
    tbv.gui.main.createCharacterTooltips = function (selector) {
        //No tooltips
    }

    //Interface
    tbv.gui.main.createTaxonToolTips = function (selector, displayToolTips) {
        //No taxon tooltips
    }

    //##Interface
    tbv.gui.main.tooltip = function (selector) {
        //No tooltips
    }

    //##Interface
    tbv.gui.main.showFullDetails = function (taxon, selected, x, y) {

        var _this = this;

        function getHTMLFileSelectionDiv(taxon, container) {

            var htmlDiv = $('<div>').css("margin", "10px").appendTo(container);

            var htmlFiles = tbv.f.getTaxonHtmlFiles(taxon);
            if (htmlFiles.length == 0) {
                //If there are no html files for this taxon, return a message to that effect.
                htmlDiv.text("No text information files (HTML) are specified in the knowledge-base for this taxon.")
            } else {
                var htmlDiv2 = $("<div>");
                if (htmlFiles.length > 1) {
                    html = '<ons-select onchange="tombiovis.gui.main.textFileSelect(event)">'
                    htmlFiles.forEach(function (file, iFile) {
                        html += '<option value="' + iFile + '">';
                        html += file.Caption;
                        html += '</option>'
                    });
                    html += '</ons-select>'
                    htmlDiv.html(html);
                }
                htmlDiv2.appendTo(htmlDiv);
                tbv.f.addTaxonHtmlToContainer(taxon, htmlDiv2, 0);

                tbv.gui.main.textFileSelect = function (event) {
                    tbv.f.addTaxonHtmlToContainer(taxon, htmlDiv2, event.target.value);
                }
            }
        }

        if ($("#tombioOnsFullDetailsTemplate").length == 0) {

            var html = '';
            html += '<template id="tombioOnsFullDetailsTemplate">';
            html += '<ons-page id="tombioOnsFullDetails">';
            html += '<ons-toolbar>';
            html += '<div class="left">';
            html += '<ons-back-button></ons-back-button>';
            html += '</div>';
            html += '<div id="tombioOnsFullDetailsTitle" class="center"></div>';
            html += '</ons-toolbar>';
            html += '<ons-tabbar id="tombioOnsFullDetailsTabBar" swipeable position="auto">';
            html += '<ons-tab page="tombioOnsFullDetailsTab1Template" label="Knowledge" icon="md-grid" active>';
            html += '</ons-tab>';
            html += '<ons-tab page="tombioOnsFullDetailsTab2Template" label="Images" icon="md-image">';
            html += '</ons-tab>';
            if (tbv.d.oCharacters.tvk) {
                html += '<ons-tab page="tombioOnsFullDetailsTab3Template" label="NBN Atlas" icon="md-map">';
                html += '</ons-tab>';
            }
            html += '<ons-tab page="tombioOnsFullDetailsTab4Template" label="Info" icon="md-file-text">';
            html += '</ons-tab>';
            html += '</ons-tabbar>';
            html += '</ons-page>';
            html += '</template>';

            html += '<template id="tombioOnsFullDetailsTab1Template">';
            html += '<ons-page id="tombioOnsFullDetailsTab1">';
            html += '<div id="tombioOnsFullDetailsTab1Content" style="margin: 1em"></div>';
            html += '</ons-page>';
            html += '</template>';

            html += '<template id="tombioOnsFullDetailsTab2Template">';
            html += '<ons-page id="tombioOnsFullDetailsTab2">';
            html += '<div id="tombioOnsFullDetailsTab2Content"></div>';
            html += '</ons-page>';
            html += '</template>';

            html += '<template id="tombioOnsFullDetailsTab3Template">';
            html += '<ons-page id="tombioOnsFullDetailsTab3">';
            html += '<div id="tombioOnsFullDetailsTab3Content"></div>';
            html += '</ons-page>';
            html += '</template>';

            html += '<template id="tombioOnsFullDetailsTab4Template">';
            html += '<ons-page id="tombioOnsFullDetailsTab4">';
            html += '<div id="tombioOnsFullDetailsTab4Content"></div>';
            html += '</ons-page>';
            html += '</template>';

            $("#tombioOns").append($(html));

            document.addEventListener('show', function (event) {

                var taxon = document.querySelector('#tombioOnsNavigator').topPage.data.taxon;
                var tab = document.querySelector('#tombioOnsNavigator').topPage.data.tab;

                $('#tombioOnsFullDetailsTitle').html("<i>" + taxon + "</i>");

                if (event.target.matches('#tombioOnsFullDetailsTab1')) {  
                    $('#tombioOnsFullDetailsTab1Content').html(tbv.f.getTaxonCharacterValues(tbv.d.oTaxa[taxon]));
                }
                if (event.target.matches('#tombioOnsFullDetailsTab2')) {  
                    $('#tombioOnsFullDetailsTab2Content').html("");
                    $('#tombioOnsFullDetailsTab2Content').attr("data-taxon", taxon);
                    tbv.f.addTaxonImagesToContainer({ taxon: taxon, container: $('#tombioOnsFullDetailsTab2Content'), height: $('#tombioOnsFullDetailsTab2').css('height') });
                }
                if (event.target.matches('#tombioOnsFullDetailsTab3')) {
                    $('#tombioOnsFullDetailsTab3Content').html("");
                    tbv.f.addNBNMapToContainer(tbv.d.oTaxa[taxon].tvk, $('#tombioOnsFullDetailsTab3Content'));
                    $("#tombioNbnMapImage").css("height", $('#tombioOnsFullDetailsTab3').height() - 10);
                }
                if (event.target.matches('#tombioOnsFullDetailsTab4')) {
                    $('#tombioOnsFullDetailsTab4Content').html("");
                    getHTMLFileSelectionDiv(taxon, $('#tombioOnsFullDetailsTab4Content'));
                }

                if (event.target.matches('#tombioOnsFullDetails') && tab) {
                    document.querySelector('#tombioOnsFullDetailsTabBar').setActiveTab(tab)
                }

            }, false);
        }

        document.querySelector('#tombioOnsNavigator').pushPage('tombioOnsFullDetailsTemplate', {
            data: { taxon: taxon, tab: selected}
        }).then(function () {
            //This may work just as well as using the event listerner waiting for page show, but I don't
            //know - some problems with page scrolling? Maybe not.
            //$('#tombioOnsFullDetailsTitle').html("<i>" + taxon + "</i>");
            //$('#tombioOnsFullDetailsTab1Content').html(tbv.f.getTaxonCharacterValues(tbv.d.oTaxa[taxon]));
            })
    }

    tbv.gui.main.fn.toggleMenuPin = function () {
        pinMenu = !pinMenu;
        if (pinMenu) {
            $('#tombioOnsMenu').removeAttr('collapse');
        } else {
            $('#tombioOnsMenu').attr('collapse', '');
        }

        mainMenuPos();

        splitterSideHideShow();

        tbv.f.refreshVisualisation();
    }

    tbv.gui.main.contextMenu = {
        //Create the context menu object
        items: {}, //Links to each item in the menu
        functions: {}, //Stores the functions to be executed when items selection
        visContexts: {}, //The visualisations contexts valid for each item
        guiContexts: {} //The GUI contexts valid for each item
    };

    tbv.gui.main.contextMenu.addItem = function (label, f, bReplace, visContexts, guiContexts) {
        //Add method to add an item
        //Replace item if already exists 
        //(workaround to let different visualisations have same items with different functions)
        if (bReplace && label in tbv.gui.main.contextMenu.items) {
            tbv.gui.main.contextMenu.items[label].remove();
            delete tbv.gui.main.contextMenu.items[label];
            delete tbv.gui.main.contextMenu.functions[label];
            delete tbv.gui.main.contextMenu.visContexts[label];
            delete tbv.gui.main.contextMenu.guiContexts[label];
        }

        //Add item if it does not already exist
        if (!(label in tbv.gui.main.contextMenu.items)) {

            var icon = '<div class="left"><ons-icon icon="md-caret-right" class="list-item__icon"></ons-icon></div>'
            var item = $('<ons-list-item>' + icon + label + '</ons-list-item>');

            tbv.gui.main.contextMenu.items[label] = item;
            tbv.gui.main.contextMenu.visContexts[label] = visContexts;
            tbv.gui.main.contextMenu.guiContexts[label] = guiContexts;
            tbv.gui.main.contextMenu.functions[label] = f;
        }
    }

    tbv.gui.main.contextMenu.removeItem = function (label) {
        //Add method to remove an item
        if (label in tbv.gui.main.contextMenu.items) {
            delete tbv.gui.main.contextMenu.items[label];
            delete tbv.gui.main.contextMenu.functions[label];
            delete tbv.gui.main.contextMenu.visContexts[label];
            delete tbv.gui.main.contextMenu.guiContexts[label];
        }
    } 

    tbv.gui.main.fn.requestFullscreen = function () {

        var elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }

        $('#tombioUiFullscreenMenuButton').hide();
        $('#tombioUiExitFullscreenMenuButton').show();
    }

    tbv.gui.main.fn.exitFullscreen = function () {

        console.log("exit fullscreen")
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        $('#tombioUiFullscreenMenuButton').show();
        $('#tombioUiExitFullscreenMenuButton').hide();
    }

    function mainMenuPos() {
        if ($('#tombioOnsVisDisplay').width() < 208) {
            $('#tombioOnsToolsRight').hide();
            $('#tombioOnsToolsLeft').show();
        } else {
            $('#tombioOnsToolsRight').show();
            $('#tombioOnsToolsLeft').hide();
        }  
    }

    function splitterSideHideShow() {

        //This function has several purposes.
        //Firstly it is used to hide the ons-splitter-side if a tool other than a visualisation
        //is selected and therefore ons-splitter-side has no content.
        //Secondly it is used to dynamically resize the onsen menu depending on the selected tool.
        //Also it works around a bug in onsen. Media query is set on collapsible attribute of ons-splitter-side
        //but although it works and is not collapsible on screen sizes greater than max-width, the ons-splitter-content 
        //is not offset to the right to allow space and is therefore partially shown under ons-splitter-side. If page 
        //is manually taken below threshold and then above threshold, it works, but not otherwise.

        var vis = tbv.v.visualisations[tbv.v.currentTool]; //Will be undefined if current tool not a visualisation
        var w;
        if (vis && vis.inputControl) {
            //console.log("setting width from input control")
            w = vis.inputControl.width;
        } else if (vis && vis.taxonSelect) {
            //console.log("setting width from taxon select")
            w = vis.taxonSelect.width;
        } else {
            //console.log("setting default width")
            w = 230;
        }
        $('#tombioOnsMenu').css("width", w);

        //if (!window.matchMedia(onsSplitterSideMediaQuery).matches) {
        if (pinMenu) {
            //Move the splitter content to the right and resize the splitter-side, but only if a visualisation is
            //shown (and therefore there is content in splitter-side),
            if (tbv.v.includedVisualisations.indexOf(tbv.v.currentTool) > -1) {

                $('ons-splitter-content').css("left", w);
                $('ons-splitter-side').show();
            } else {
                $('ons-splitter-content').css("left", "0px");
                $('ons-splitter-side').hide();
            }

            $('#tombioUiSideMenuBackButton').hide();
            $('#tombioUiSideMenuPinIcon').attr('icon', 'md-pin');
        } else {
            $('#tombioUiSideMenuBackButton').show();
            $('#tombioUiSideMenuPinIcon').attr('icon', 'md-pin-off');
        }

        //Also take care of display of input button - i.e. button that invokes side menu
        if (tbv.v.includedVisualisations.indexOf(tbv.v.currentTool) > -1) {
            //if (window.matchMedia(onsSplitterSideMediaQuery).matches) {
            if (!pinMenu) {
                $('#tombioUiInputToolbarButton').show();
            } else {
                $('#tombioUiInputToolbarButton').hide();
            }
        } else {
            $('#tombioUiInputToolbarButton').hide();
        }
    }

    function createCitationPage() {
        var html = $("<div>"), t;

        //Generate the citation for the core software
        html.append($("<h3>").text("Citation for FSC Identikit (core software)"))
        t = "This is the reference you can use for the FSC Identikit - in other words the core software.";
        t += " The core version number is updated whenever there is a new major release of the core software.";
        html.append($("<p>").html(t));
        html.append($("<b>").html(tbv.f.getCitation(tbv.d.softwareMetadata, "Software")));

        ////Generate the citation for the current tool
        //html.append($("<h3>").text("Citation for last selected visualisation tool"))
        //t = "This is the reference you can use for the last selected visualisation tool.";
        //t += " The tool version number is updated whenever there is a new release of the tool.";
        //t += " If you cite a tool, there's no need to cite the core software separately since it is implicit.";
        //html.append($("<p>").html(t));
        //html.append($("<b>").html(tbv.f.getCitation(tbv.v.visualisations[tbv.v.lastVis].metadata, "Software", tbv.d.softwareMetadata.title)));

        //Generate the citation for the knowledge-base
        html.append($("<h3>").text("Citation for knowledge-base"))
        t = "This is the reference you can use for the knowledge-base currently driving the software.";
        t += " The knowledge-base version number is updated whenever there is a new release of the knowledge-base.";
        html.append($("<p>").html(t));
        html.append($("<b>").html(tbv.f.getCitation(tbv.d.kbmetadata, "Knowledge-base", tbv.d.softwareMetadata.title)));

        return html;
    }

    function generateContextMenu() {
        //var html = "";
        var contextItems = [];

        for (var label in tbv.gui.main.contextMenu.items) {

            var show = true;
            //For visualisation contexts, then the menu item will be show if the current visualisation
            //appears in that items visContexts array.
            if (tbv.gui.main.contextMenu.visContexts[label].indexOf(tbv.v.currentTool) == -1) {
                show = false;
            }
            //For GUI contexts then if the guiContexts is empty array or undefined, then the menu item
            //will be shown, otherwise it will only be shown if the current gui appears in the guiContexts array.
            if (tbv.gui.main.contextMenu.guiContexts[label]) {
                if (tbv.gui.main.contextMenu.guiContexts[label].indexOf(tbv.opts.gui) == -1) {
                    show = false;
                }
            }

            if (show) {
                //html += tbv.gui.main.contextMenu.items[label];
                //tbv.gui.main.contextMenu.items[label].on("click", function () {
                //    tbv.gui.main.contextMenu.functions[label]();
                //    tbv.gui.main.popPage();
                //});
                tbv.gui.main.contextMenu.items[label].on("click", tbv.gui.main.popPage);
                tbv.gui.main.contextMenu.items[label].on("click", tbv.gui.main.contextMenu.functions[label]);
                contextItems.push(tbv.gui.main.contextMenu.items[label]);
            }
        }

        $('#tombioOnsContextContent').html("");
        $("#tombioOnsContextContent").append(contextItems);
    }

    function resizeElements() {
        if ($('#tombioOnsFullDetailsTab3').length > 0) {
            $("#tombioNbnMapImage").css("height", $('#tombioOnsFullDetailsTab3').height() - 10);
        }

        if ($('#tombioOnsFullDetailsTab2').length > 0) {
            $('.tombio-galleria-pane').data('galleria').resize({ height: $('#tombioOnsFullDetailsTab2').height() });
        }
    }

}(jQuery, this.tombiovis));