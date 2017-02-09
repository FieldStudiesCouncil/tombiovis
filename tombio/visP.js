(function ($, core) {

    "use strict";

    var exports = core.visP = {};

    exports.Obj = function (visName, parent, contextMenu, core) {

        this.visName = visName;
        this.contextMenu = contextMenu;
        this.taxa = core.taxa;
        this.oTaxa = core.oTaxa;
        this.characters = core.characters;
        this.oCharacters = core.oCharacters;
        this.media = core.media;

        this.div = $("<div/>").attr("id", visName).css("display", "none").appendTo(parent);
        this.cssSel = parent + " > #" + visName;

        var _this = this;

        //Store value to indicate whether or not characters are grouped
        this.charactersGrouped = false;
        this.characters.forEach(function (character) {
            if (character.Status == "key" && character.Group.toLowerCase() != "none") {
                _this.charactersGrouped = true;
            }
        });

        //Set up the metadata structure for visualisations.
        this.metadata = {
            title: null,
            year: null,
            authors: null,
            publisher: null,
            location: null,
            contact: null,
            version: null
        }

        this.initialise();
    }

    exports.Obj.prototype.fireRefresh = function () {
        if (typeof this.onRefresh === "function") {
            setTimeout(this.onRefresh, 1);
        }
    }

    exports.Obj.prototype.initialise = function () {

        //Reset this value if control can work with character state input controls
        this.charStateInput = false;

        //Replace the following
        this.div.append("<h2>" + this.visName + "</h2>")
        this.div.append("<p>Selector is: " + this.cssSel + "</p>")
    }

    exports.Obj.prototype.refresh = function () {

        //Replace the following
        this.div.append("<p>Refresh fired " + Date() + "</p>")

        //Consider including
        this.fireRefresh();
    }

    exports.Obj.prototype.sortTaxa = function (array, lastPosAttr) {
        return array.sort(function (a, b) {

            if (a.scoreoverall > b.scoreoverall) return -1;
            if (b.scoreoverall > a.scoreoverall) return 1;
            if (b.scoreoverall == a.scoreoverall) {
                if (a.scorefor > b.scorefor) return 1;
                if (b.scorefor > a.scorefor) return -1;
                if (lastPosAttr == undefined) return 1;
                if (a[lastPosAttr] > b[lastPosAttr]) {
                    return 1;
                } else {
                    return -1;
                }
            }
        });
    }

    exports.Obj.prototype.getTaxonImagesDiv = function (taxon, container, indexSelected, preventContainerResize) {

        var imgZoomOrigLeft, imgZoomOrigTop, imgZoomOrigCentreX, imgZoomOrigCentreY;
        var initialSelectorImage;
        var taxonImages = this.getTaxonImages(taxon);

        //Helper functions

        function imageSelected(imageIndex, f) {

            pane.attr("indexSelected", imageIndex);

            var taxonImage = taxonImages[imageIndex];

            //Change all image selector icons to grey image
            controlsImageSelectors.find("img").attr("src", tombiopath + "resources/camera.png");

            //Clear current image and caption
            img.attr("src", null);
            cap.html("");
            
            var imgLoad = new Image;
            imgLoad.onerror = function () {
                cap.html("Couldn't load image'" + taxonImage.URI + "'.");
            }
            imgLoad.onload = function () {
                //Loading images asynchronously with this callback ensures that the
                //pane resizing works correctly.
                cap.html(taxonImage.Caption);
                img.attr("src", this.src);
                cap.html(taxonImage.Caption);

                if (container) {
                    if (!preventContainerResize) {
                        container.css("width", img.width() + border);
                        container.css("height", img.height() + border + 30);
                    }
                    pane.css("width", "100%");
                } else {
                    pane.css("width", img.width() + border);
                    pane.css("height", img.height() + border + 30);
                }

                //Initialise zoom image
                imgZoom
                    .attr("src", this.src)
                    .css("width", img.width())
                    .css("height", img.height())
                    .css("left", 0)
                    .css("top", 0)
                    .attr("viewWidth", img.width())
                    .attr("viewHeight", img.height())
                    .attr("xProp", 0.5)
                    .attr("yProp", 0.5);

                img.css("opacity", 0.2); //Helps with sorting out problems

                pane.find("#imgLink" + imageIndex).attr("src", tombiopath + "resources/cameragreen.png");

                //If function passed to ImageSelected, execute it once
                //image is loaded
                if (f) f();
            };

            imgLoad.src = taxonImage.URI;
        }

        function updateZoomImage(imgZoom, tryViewWidth, tryViewHeight, tryWidth, tryHeight, tryCentreX, tryCentreY) {

            var currentViewWidth = Number(imgZoom.attr("viewWidth"));
            var currentViewHeight = Number(imgZoom.attr("viewHeight"));
            var currentWidth = Number(imgZoom.css("width").replace("px", ""));
            var currentHeight = Number(imgZoom.css("height").replace("px", ""));
            var currentXProp = Number(imgZoom.attr("xProp"));
            var currentYProp = Number(imgZoom.attr("yProp"));

            var newWidth, newHeight, newCentreX, newCentreY, newViewWidth, newViewHeight;

            //Resizing
            if (tryViewWidth) {

                newViewWidth = tryViewWidth;
                newViewHeight = tryViewHeight;
                if (tryViewWidth > currentWidth) {
                    tryWidth = tryViewWidth;
                    tryHeight = tryViewHeight;      
                }
                tryCentreX = currentXProp * currentWidth;
                tryCentreY = currentYProp * currentHeight;

            } else {
                newViewWidth = currentViewWidth;
                newViewHeight = currentViewHeight
            }


            //Zooming
            if (tryWidth) {
                if (tryWidth < newViewWidth) {
                    newWidth = newViewWidth;
                    newHeight = newViewHeight;
                } else {
                    newWidth = tryWidth;
                    newHeight = tryHeight;
                }
                //Depending on the position of the currentView,
                //zooming may require changing the centering of the image.
                tryCentreX = currentXProp * newWidth;
                tryCentreY = currentYProp * newHeight;
            } else {
                newWidth = currentWidth;
                newHeight = currentHeight;
            }

            //Re-centring
            if (tryCentreX) {

                if (tryCentreX - newViewWidth / 2 >= 0 && tryCentreX + newViewWidth / 2 <= newWidth) {
                    //Clip view would fit on the left and right.
                    newCentreX = tryCentreX;
                } else if (tryCentreX - newViewWidth / 2 < 0) {
                    //Clip view would not fit on the left.
                    newCentreX = newViewWidth / 2;
                } else {
                    //Clip view would not fit on the right.
                    newCentreX = newWidth - newViewWidth / 2;
                }
                if (tryCentreY - currentViewHeight / 2 >= 0 && tryCentreY + currentViewHeight / 2 <= newHeight) {
                    //Clip view would fit on the top and bottom.
                    newCentreY = tryCentreY;
                } else if (tryCentreY - currentViewHeight / 2 < 0) {
                    //Clip view would not fit on the top.
                    newCentreY = currentViewHeight / 2;
                } else {
                    //Clip view would not fit on the bottom.
                    newCentreY = newHeight - currentViewHeight / 2;
                }
            } else {
                newCentreX = currentXProp * currentWidth;
                newCentreY = currentYProp * currentHeight;
            }

            //Update the image and store attribute values
            //Note that if I didn't change the max-width, live Drupal site would not change width.
            imgZoom
                .css("height", newHeight)
                .css("max-width", newWidth)
                .css("width", newWidth)
                .css("left", 0 - (newCentreX - newViewWidth / 2))
                .css("top", 0 - (newCentreY - newViewHeight / 2))
                .attr("viewWidth", newViewWidth)
                .attr("viewHeight", newViewHeight)
                .attr("xProp", newCentreX / newWidth)
                .attr("yProp", newCentreY / newHeight);

            //Enable/disable image panning
            if (Math.round(newWidth) > Math.round(newViewWidth)) {

                //console.log(Math.round(newWidth) , Math.round(newViewWidth))
                imgZoom.draggable("enable");
                imgZoom.css("cursor", "-webkit-grab");
            } else {
                imgZoom.draggable("disable");
                imgZoom.css("cursor", "inherit");
            }
        }

        //End of helper functions

        if (indexSelected == undefined)
            indexSelected = 0;

        var border = 10;
        var pane = $('<div/>')
            .attr("class", "tombioImage")
            .css("border-radius", border)
            .css("background-color", "grey")
            .css("overflow", "hidden");

        var fig = $('<div/>')
            .css("line-height", 0) //Gets rid of space below enclosed images
            .css("margin", border / 2)
            .css("border-radius", border * 0.7)
            .css("position", "relative")
            .css("overflow", "hidden")
            .css("background-color", "grey")
            .css("background-image", "url('" + tombiopath + "resources/loading.gif')")
            .css("background-repeat", "no-repeat")
            .css("background-position", "center");

        var img = $('<img/>')
            .css("width", "100%")
            .attr("class", "baseimage")
            .change(function () {
                //This is invoked when the image is resized externally.
                var imgZoom = img.siblings(".zoomimage");
                updateZoomImage(imgZoom, img.width(), img.height(), null, null, null, null);
            });

        var imgZoom = $('<img/>')
            .attr("class", "zoomimage")
            .css("position", "absolute")
            .css("left", 0)
            .css("top", 0)
            .draggable({
                start: function() {
                    imgZoomOrigLeft = Number(imgZoom.css("left").replace("px", ""));
                    imgZoomOrigTop = Number(imgZoom.css("top").replace("px", ""));
                    imgZoomOrigCentreX = Number(imgZoom.css("width").replace("px", "")) * imgZoom.attr("xProp");
                    imgZoomOrigCentreY = Number(imgZoom.css("height").replace("px", "")) * imgZoom.attr("yProp");
                },
                drag: function (event, ui) { 
                    if (ui.position.left > 0) 
                        ui.position.left = 0;
                    if (ui.position.top > 0) 
                        ui.position.top = 0;
                    if (Number(imgZoom.css("width").replace("px", "")) + ui.position.left < Number(imgZoom.attr("viewWidth")))
                        ui.position.left = Number(imgZoom.attr("viewWidth")) - Number(imgZoom.css("width").replace("px", ""));
                    if (Number(imgZoom.css("height").replace("px", "")) + ui.position.top < Number(imgZoom.attr("viewHeight")))
                        ui.position.top = Number(imgZoom.attr("viewHeight")) - Number(imgZoom.css("height").replace("px", ""));

                    var deltaLeft = imgZoomOrigLeft - ui.position.left;
                    var deltaTop = imgZoomOrigTop - ui.position.top;
                    var centreX = Number(imgZoom.css("width").replace("px", "")) * imgZoom.attr("xProp");

                    updateZoomImage(imgZoom, null, null, null, null, imgZoomOrigCentreX + deltaLeft, imgZoomOrigCentreY + deltaTop);
                }
            });
            imgZoom.draggable("disable");

        var moveleft = $('<div>')
            .css("position", "absolute")
            .css("left", 0)
            .css("top", 0)
            .css("height", "100%")
            .css("width", "30px")
            .css("background", "rgba(0,0,0,0.3)")
            .css("cursor", "pointer")
            .css("opacity", 0)
            .hover(function () {
                moveright.stop().fadeTo(400, 1);
                moveleft.stop().fadeTo(400, 1);
            },
            function () {
                moveright.stop().fadeTo(400, 0);
                moveleft.stop().fadeTo(400, 0);
            })
            .click(function () {
                var imageIndex = Number(pane.attr("indexSelected"));
                moveright.stop().css("opacity", 0);
                moveleft.stop().css("opacity", 0);
                imageSelected((taxonImages.length + imageIndex - 1) % taxonImages.length,
                    function () {
                        moveright.stop().fadeTo(400, 1);
                        moveleft.stop().fadeTo(400, 1);
                        controlsInner.stop().fadeIn(10).fadeOut(800);
                    }
                );
            });

        var moveleftimg = $('<img src="' + tombiopath + 'resources/moveleft.png">')
            .css("position", "absolute")
            .css("top", "50%")
            .css("left", 0)
            .css("transform", "translate(0, -50%)")
            .css("opacity", 1);
        moveleft.append(moveleftimg);

        var moveright = $('<div>')
        moveright.css("position", "absolute")
            .css("right", 0)
            .css("top", 0)
            .css("height", "100%")
            .css("width", "30px")
            .css("background", "rgba(0,0,0,0.3)")
            .css("cursor", "pointer")
            .css("opacity", 0)
            .hover(function () {
                moveright.stop().fadeTo(400, 1);
                moveleft.stop().fadeTo(400, 1);
            },
            function () {
                moveright.stop().fadeTo(400, 0);
                moveleft.stop().fadeTo(400, 0);
            })
            .click(function () {
                moveright.stop().css("opacity", 0);
                moveleft.stop().css("opacity", 0);
                var imageIndex = Number(pane.attr("indexSelected"));
                imageSelected((taxonImages.length + imageIndex + 1) % taxonImages.length,
                    function () {
                        moveright.stop().fadeTo(400, 1);
                        moveleft.stop().fadeTo(400, 1);
                        controlsInner.stop().fadeIn(10).fadeOut(800);
                    }
                );
            });

        var moverightimg = $('<img src="' + tombiopath + 'resources/moveright.png">')
            .css("position", "absolute")
            .css("top", "50%")
            .css("right", 0)
            .css("transform", "translate(0, -50%)")
            .css("opacity", 1);
        moveright.append(moverightimg);

        var cap = $('<div/>')
            .css("margin", border / 2)
            .attr("class", "taxonImageCaption")
        fig.append(img);
        fig.append(imgZoom);
        fig.append(moveleft);
        fig.append(moveright);
        pane.append(fig);
        pane.append(cap);
        pane.attr("indexSelected", indexSelected);
 
        //Zoom behaviour
        //Using the mousewheel plugin, normalises behaviour across browsers
        imgZoom.mousewheel(function (event) {
            event.stopPropagation();

            var currentWidth = Number($(this).css("width").replace("px", ""));
            var currentHeight = Number($(this).css("height").replace("px", ""));

            if (event.deltaY > 0) {
                //Zoom in
                var newWidth = currentWidth * 1.1;
                var newHeight = currentHeight * 1.1;
            } else {
                //Zoom out
                var newWidth = currentWidth / 1.1;
                var newHeight = currentHeight / 1.1;
            }

            updateZoomImage(imgZoom, null, null, newWidth, newHeight, null, null);
            return false;
        });

        //Image controls
        var controlsOuter = $('<div/>')
            .css("position", "absolute")
            .css("top", 0)
            .css("left", 0)
            .css("width", "100%")
            .css("height", 30)

            //.css("border", "1px solid red")
            .hover(function () {
                $(this).find(".tombioImageControls").stop().fadeIn(400);
            },
            function () {
                $(this).find(".tombioImageControls").stop().fadeOut(400);
            });

        var controlsInner = $('<div/>')
            .attr("class", "tombioImageControls")
            .css("margin-right", 30)
            .css("margin-top", 6)
            .css("margin-left", 6)
            .css("display", "none")
        //.css("border", "1px solid green")

        var controlsImageSelectors = $('<div/>')
        //.css("border", "1px solid blue")

        controlsInner.append(controlsImageSelectors);

        //Image selector
        var icon;

        taxonImages.forEach(function (taxonImage, imageIndex) {

            var taxonImageLink = $('<img/>');

            if (indexSelected == imageIndex) {
                icon = tombiopath + "resources/cameragreen.png";
                initialSelectorImage = taxonImageLink;
            } else {
                icon = tombiopath + "resources/camera.png";
            }
            taxonImageLink.attr("src", icon)
                .css("cursor", "pointer")
                .css("width", 20)
                .css("margin", 2)
                .attr("id", "imgLink" + imageIndex)
                .click("click", function () {

                    imageSelected(imageIndex);
                });
            taxonImageLink.tooltip({
                items: "img",
                content: function () {
                    return taxonImage.Caption;
                }
            });
            controlsImageSelectors.append(taxonImageLink);
        });

        //Close image
        var closeImage = $('<img/>');
        closeImage.attr("src", tombiopath + "resources/remove.png")
            .css("cursor", "pointer")
            .css("position", "absolute")
            .css("top", 8)
            .css("right", 8)
            .css("width", 20)
            .click("click", function () {

                pane.addClass("userRemoved");

                if (container) {
                    container.remove();
                } else {
                    pane.remove();
                }

                ////If no images displayed, remove context menu item
                //if ($(".tombioImage").length == 0) {
                //    global.contextMenu.removeItem("Close all images");
                //}
            });

        controlsInner.append(closeImage);
        controlsOuter.append(controlsInner);
        pane.append(controlsOuter);

        //Initialise
        imageSelected(indexSelected);

        return pane;
    }

    exports.Obj.prototype.getTaxonImages = function (taxon) {
        //Return list of all media images for taxon, sorted by priority
        var taxonImages = this.media.filter(function (m) {
            if (m.Taxon == taxon && m.Type == "image-local") return true;
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });
        return taxonImages;
    }

    exports.Obj.prototype.getTaxonHtmlFiles = function (taxon) {
        //Return list of all media html files for taxon, sorted by priority
        var taxonHtmlFiles = this.media.filter(function (m) {
            if (m.Taxon == taxon && m.Type == "html-local") return true;
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });
        return taxonHtmlFiles;
    }

    exports.Obj.prototype.showFloatingImages = function (taxon, x, y) {

        var _this = this;
        var pane = $('<div/>').appendTo('#tombioMain');
        var initialWidth = 350;

        pane.attr("class", "tombioFloatingImage")
            .css("position", "absolute")
            .css("top", y)
            .css("left", x)
            .css("width", initialWidth)
            .css("background-color", "grey")
            .css("border-radius", 10)
            .css("cursor", "move")
            .css("z-index", function () {
                var zindex = 5000;
                $(".tombioFloatingImage").each(function () {
                    var thisZindex = Number($(this).css("z-index"));
                    if (thisZindex > zindex)
                        zindex = thisZindex;
                });
                return zindex + 1;
            })
            .draggable()
            .resizable({
                aspectRatio: true,
                resize: function () {
                    var img = pane.find(".baseimage");
                    img.trigger("change");
                }
            })
            .click(function () {
                var zindex = 5000;
                $(".tombioFloatingImage").each(function () {
                    var thisZindex = Number($(this).css("z-index"));
                    if (thisZindex > zindex)
                        zindex = thisZindex;
                });
                $(this).css("z-index", zindex + 1);
            });

        pane.append(this.getTaxonImagesDiv(taxon, pane));

        //Add context menu item to remove all images
        this.contextMenu.addItem("Close all images", function () {
            $(".tombioFloatingImage").remove();
            _this.contextMenu.removeItem("Close all images");
        }, [this.visName]);
    }

    exports.Obj.prototype.showCharacterScoreDetails = function (taxon, character) {

        //???? Change all this to use jQuery appends? ?????????

        //Character state specified
        var html;
        html = "<p>Specified state(s) for character <b>" + character.Label + "</b>: </p>"

        var control = $("#" + character.Character);
        html += "<ul>";
        if (character.ControlType == "spin" || character.ControlType == "single") {
            html += "<li><b>";
            html += control.val();
            html += "</b></li>";
        } else if (character.ControlType == "multi") {
            control.val().forEach(function (state) {
                html += "<li><b>";
                html += state;
                html += "</b></li>";
            });
        }
        html += "</ul>";

        //Knowledge-base state for this character and taxon
        html += "<p>Valid state(s) for <b>" + character.Label + "</b> recorded against "
        html += "<b><i>" + taxon.Taxon + "</i></b> in the knowledge base: "
        html += "<ul>";
        html += taxon[character.Character].toHtml2();
        html += "</ul>";

        //Knowledge-base parametrs for this character
        html += "<hr/>";
        html += "<p>Knowledge-base <b>weighting</b> for this character: <b>" + character.Weight + "</b></p>";
        html += "<p>Knowledge-base <b>strictness</b> for this character: <b>" + character.Strictness + "</b></p>";

        //Taxon characters scores
        html += "<hr/>";

        //Formerly normalised to 10
        //html += "<p>Unweighted character score: <b>" + Math.round(taxon.matchscore[character.Character].scoreoverall * 100) / 10 + "</b>; ";
        //html += "(for, " + Math.round(taxon.matchscore[character.Character].scorefor * 100) / 10;
        //html += "; against, " + Math.round((taxon.matchscore[character.Character].scoreagainst + taxon.matchscore[character.Character].scorena) * 100) / 10 + ")</p>";
        //html += "<p>Weighted character score: <b>" + Math.round(taxon.matchscore[character.Character].scoreoverall * character.Weight * 10) / 10 + "</b></p>";
        //Now normalised to 1...
        html += "<p>Unweighted character score: <b>" + Math.round(taxon.matchscore[character.Character].scoreoverall * 100) / 100 + "</b>; ";
        html += "(for, " + Math.round(taxon.matchscore[character.Character].scorefor * 100) / 100;
        html += "; against, " + Math.round((taxon.matchscore[character.Character].scoreagainst + taxon.matchscore[character.Character].scorena) * 100) / 100 + ")</p>";
        html += "<p>Weighted character score: <b>" + Math.round(taxon.matchscore[character.Character].scoreoverall * character.Weight * 10) / 100 + "</b></p>";
        //console..log(taxon);

	// Hide the work in progress
	$("#tombioControlsAndTaxa").hide();	
	//Add insert point
        $("#tombiod3").after("<div id='tombioHelpAndInfoDialog'></div>");
	// Show the dialog
	$("#tombioHelpAndInfoDialog").show();	
	// Now put a clear help button at the top
	$("#tombioHelpAndInfoDialog").append('<button id="tombioHideHelp">Exit Help</button>');

	// and assign an action
	
		$('#tombioHideHelp').click(function (event) {
		$("#tombioControlsAndTaxa").show();
		$("#tombioHelpAndInfoDialog").remove();
		$("#tombioVisInfoDialog").remove();		 
		});

	// Append the details
	$("#tombioHelpAndInfoDialog").append(html);
	

    }

    exports.Obj.prototype.showTaxonCharacterValues = function (taxon, returnAsHtml) {

        var html = $("<table>");
        html.css("width", "100%");
        html.css("margin", "0px");

        var iChar = 0;
        var lastCharacterGroup = "";

        var _this = this;

        this.characters.forEach(function (character) {
            if (character.Status == "key" || character.Status == "display") {

                if (_this.charactersGrouped && character.Group != lastCharacterGroup) {
                    var tr = $("<tr>");
                    tr.css("background-color", "rgb(100,100,100)");
                    tr.css("color", "rgb(255,255,255)");
                    var td = $("<td colspan='3'>");
                    tr.append(td.append(character.Group));
                    html.append(tr);
                    lastCharacterGroup = character.Group;
                }

                iChar++;
                var tr = $("<tr>");
                if (iChar % 2 != 0) {
                    tr.css("background-color", "rgb(200,200,200)");
                } else {
                    tr.css("background-color", "rgb(230,230,230)");
                }
                //var tdLabel = $("<td>").append($("<b>").append(character.Label));
                var tdLabel = $("<td>").append(character.Label);

                var tdValue = $("<td>").append(taxon[character.Character].toHtml1());
                tr.append(tdLabel);
                tr.append(tdValue);
                html.append(tr);
            }
        });

        html.find("td").css("padding", "2");

        if (returnAsHtml) {
            return html;
        } else {
            //Otherwise create dialog and display

	    // Replace the dialog

	    //Hide the work in progress
	    $("#tombioControlsAndTaxa").hide();
	    // Add the insert point
            $("#tombiod3").after("<div id='tombioHelpAndInfoDialog'></div>");
	    // Add a clear help button
	    $("#tombioHelpAndInfoDialog").append('<button id="tombioHideInfoDialog">Exit Help</button>');

		// and assign an action
	
			$('#tombioHideInfoDialog').click(function (event) {
			$("#tombioControlsAndTaxa").show();
			$("#tombioHelpAndInfoDialog").remove();
 			$("#tombioVisInfoDialog").remove();
			});

	     
            $("#tombioHelpAndInfoDialog").append("<h2>"+taxon.Taxon+"</h2>");	// Enclosing elements needed to coerce variable into text	

		
            $("#tombioHelpAndInfoDialog").append(html);
		// Need to make it visible
		$("#tombioHelpAndInfoDialog").show();

        }  
    }

    exports.Obj.prototype.showTaxonHtmlInfo = function (taxon, container, iFile) {
        
        var taxonHtmlFiles = this.getTaxonHtmlFiles(taxon);

        if (iFile <= taxonHtmlFiles.length - 1) {
            $.get(tombiokbpath + taxonHtmlFiles[iFile].URI + "?ver=" + core.tombiover, function (data) {
                container.html(data);
            });
        } else {
            container.html(null);
        }
    }

    exports.Obj.prototype.shortName = function (name) {
        //Returns a shortened name for use in visualisations
        //where long taxa name too long.

        var nameParts = name.split(" ");
        var shortName = "";
        nameParts.forEach(function (part, iPart) {
            if (iPart == 0) {
                shortName += part.substring(0, 1);
            } else {
                shortName += " ";
                shortName += part.substring(0, 3);
            }
        })
        return shortName;
    }

    exports.Obj.prototype.shortName = function (name) {
        //Returns a shortened name for use in visualisations
        //where long taxa name too long.

        var nameParts = name.split(" ");
        var shortName = "";
        nameParts.forEach(function (part, iPart) {
            if (iPart == 0) {
                shortName += part.substring(0, 1);
            } else {
                shortName += " ";
                shortName += part.substring(0, 3);
            }
        })
        return shortName;
    }

    exports.Obj.prototype.taxonTag = function (taxonName) {
        return taxonName.replace(/[|&;$%@"<>()+:.,' ]/g, '');
    }

})(jQuery, this.tombiovis);
