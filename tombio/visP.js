(function ($, tbv) {

    "use strict";

    var visP = tbv.visP = {};

    visP.initP = function (visName, parent, contextMenu, tbv) {

        this.visName = visName;
        this.contextMenu = contextMenu;
        this.div = $("<div/>").attr("id", visName).css("display", "none").appendTo(parent);
        this.cssSel = parent + " > #" + visName;
        this.mobile = /Mobi/.test(navigator.userAgent);

        var _this = this;

        //Initialise the metadata structure for visualisations.
        this.metadata = {};

        //Initialise state object for each taxon
        tbv.taxa.forEach(function (taxon) {
            taxon.visState[visName] = {};
        })

        //Fire the visualisations own initialisation function.
        this.initialise();
    }

    visP.fullDetails = function (taxon, selected, x, y) {

        console.log("full details")
        var _this = this;

        //Default parameters
        x = (typeof x !== 'undefined') ?  x : 0;
        y = (typeof y !== 'undefined') ?  y : 0;
        selected = (typeof selected !== 'undefined') ? selected : 1;
        
        var tabs = $("<div>").addClass("tombioFullDetailsTabs");
        tabs.css("border", "none");
        var ul = $("<ul>").appendTo(tabs);
        ul.append("<li><a href='#tabs-1'>Knowledge-base</a></li>");
        ul.append("<li><a href='#tabs-2'>Images</a></li>");
        ul.append("<li><a href='#tabs-3'>Details</a></li>");
        var tab1 = $("<div>").attr("id", "tabs-1").appendTo(tabs);
        var tab2 = $("<div>").attr("id", "tabs-2").appendTo(tabs);
        var tab3 = $("<div>").attr("id", "tabs-3").appendTo(tabs);
        
        //Dialog
        var dlg = $("<div>").append(tabs);
        //dlg.addClass("tombioFullDetailsDlg")
        dlg.attr("title", taxon);
        dlg.dialog({
            height: 550,
            width: 600,
            modal: true,
            resizeStop: function (event, ui) {
                var img = tab2.find(".baseimage");
                img.trigger("change");
            }
        });

        //Tabs
        tabs.tabs({
            active: selected,
            activate: function (event, ui) {
                //This is necessary to initialise the image correctly
                //if image is not on tab1.
                var img = tab2.find(".baseimage");
                img.trigger("change");
                //window.setTimeout(function () {
                //    img.trigger("change");
                //}, 100);
                var iframe = tab3.find("#tombioFullDetailsHTMLDiv");
                _this.resizeIframe(iframe);
            }
        });
        tab3.css("overflow", "hidden"); //Must come after tabs created.

        //Taxon details
        var divTaxonDetails = this.showTaxonCharacterValues(tbv.oTaxa[taxon], true)
        tab1.append(divTaxonDetails);

        //Images
        var img = this.getTaxonImagesDiv(taxon, tab2, 0, true, true);
        tab2.append(img);

        //HTML files
        //tab3 is passed to function that creates drop down lists so that this
        //can be added to container before selectmenu is called, otherwise
        //drop-down menu appears under dialog.
        this.getHTMLFileSelectionDiv(taxon, tab3)

    }

    visP.sortTaxa = function (array, vis, lastPosAttr) {
        return array.sort(function (a, b) {

            if (a.visState.score.overall > b.visState.score.overall) return -1;
            if (b.visState.score.overall > a.visState.score.overall) return 1;
            if (b.visState.score.overall == a.visState.score.overall) {
                if (a.visState.score.for > b.visState.score.for) return 1;
                if (b.visState.score.for > a.visState.score.for) return -1;
                if (lastPosAttr == undefined || vis == undefined) return 1;
                if (a.visState[vis][lastPosAttr] > b.visState[vis][lastPosAttr]) {
                    return 1;
                } else {
                    return -1;
                }
            }
        });
    }

    visP.getTaxonImagesDiv = function (taxon, container, indexSelected, preventContainerResize, surpressImageRemoval) {

        var imgZoomOrigLeft, imgZoomOrigTop, imgZoomOrigCentreX, imgZoomOrigCentreY;
        var initialSelectorImage;
        var taxonImages = this.getTaxonImages(taxon);
        var _this = this;

        //Fail-safe against invalid index being specified
        if (indexSelected >= taxonImages.length) {
            indexSelected = 0;
        }

        if (taxonImages.length == 0) {
            //If there are no images for this taxon, return a message to that effect.
            var noImages = $("<div>").css("margin", "10px");
            noImages.text("No images are specified in the knowledge-base for this taxon.")
            return noImages;
        }

        //Updated to provide different image navigation controls behaviour
        //when viewed on a mobile and desktop devices.
        //https://github.com/burkmarr/tombiovis/pull/7
        //This further updated/superseded for release 1.4.0 to provide better
        //handling of zooming (pinch zoom) and invocation of controls (by
        //long press) on mobile devices.

        //Helper functions

        function imageSelected(imageIndex, f) {

            pane.attr("indexSelected", imageIndex);

            var taxonImage = taxonImages[imageIndex];

            //Change all image selector icons to grey image
            controlsImageSelectors.find("img").attr("src", tbv.opts.tombiopath + "resources/camera.png");

            //Clear current image and caption
            if (pane.css("width") != "0px") {
                //This prevents pane reducing height to zero when
                //image removed and helps avoid flickering/resize of
                //surrounding contents. It is reset later.
                console.log("resizing pane")
                pane.css("width", pane.css("width"));
                pane.css("height", pane.css("height"));
            }
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
                    pane.css("height", "100%");
                    pane.css("width", "100%");
                } else {
                    pane.css("width", img.width() + border);
                    pane.css("height", img.height() + border + 30);
                }

                img.css("opacity", 0.2); //Helps with sorting out problems

                pane.find("#imgLink" + imageIndex).attr("src", tbv.opts.tombiopath + "resources/cameragreen.png");

                //Initialise zoom image
                var _this = this;
                setTimeout(function () {
                    //Putting this in a timeout prevents an unpredictable problem of the imgZoom
                    //ending up smaller than img. Presumably because the code was firing when
                    //img was not somehow at it's full size.
                    imgZoom
                       .attr("src", _this.src)
                       .css("width", img.width())
                       .css("height", img.height())
                       .css("left", 0)
                       .css("top", 0)
                       .attr("viewWidth", img.width())
                       .attr("viewHeight", img.height())
                       .attr("xProp", 0.5)
                       .attr("yProp", 0.5);
                }, 50);

                //If function passed to ImageSelected, execute it once
                //image is loaded
                if (f) f();
            };

            imgLoad.src = taxonImage.URI;
        }

        function updateZoomImage(imgZoom, tryViewWidth, tryViewHeight, tryWidth, tryHeight, tryCentreX, tryCentreY) {

            //console.log("imgZoom", imgZoom)
            //console.log("tryViewWidth", tryViewWidth)
            //console.log("tryViewHeight", tryViewHeight)
            //console.log("tryWidth", tryWidth)
            //console.log("tryHeight", tryHeight)
            //console.log("tryCentreX", tryCentreX)
            //console.log("tryCentreY", tryCentreY)

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

                } else if (currentViewHeight == 0) {
                    newCentreY = newHeight / 2;
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
            .css("border", "")
            .css("position", "relative")
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
            .css("background-image", "url('" + tbv.opts.tombiopath + "resources/loading.gif')")
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
                if (!_this.mobile) {
                    //Use fadeTo rather than fadeOut here because
                    //latter also hides element and then no hover
                    //will detected.
                    moveright.stop().fadeTo(400, 1);
                    moveleft.stop().fadeTo(400, 1);
                }
            },
                function () {
                    if (!_this.mobile) {
                        moveright.stop().fadeTo(400, 0);
                        moveleft.stop().fadeTo(400, 0);
                    }
                })
            .click(function () {
                //If control is not visible, then just return
                if ($(this).css('opacity') == 0) return;

                var imageIndex = Number(pane.attr("indexSelected"));
                imageSelected((taxonImages.length + imageIndex - 1) % taxonImages.length,
                    function () {
                        if (!_this.mobile) {
                            moveright.stop().fadeTo(400, 1);
                            moveleft.stop().fadeTo(400, 1);
                            //Flash the camera image icons
                            controlsInner.stop().fadeIn(10).fadeOut(800);
                        }
                    }
                );
            });

        var moveleftimg = $('<img src="' + tbv.opts.tombiopath + 'resources/moveleft.png">')
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
                if (!_this.mobile) {
                    //Use fadeTo rather than fadeOut here because
                    //latter also hides element and then no hover
                    //will detected.
                    moveright.stop().fadeTo(400, 1);
                    moveleft.stop().fadeTo(400, 1);
                }
            },
            function () {
                if (!_this.mobile) {
                    moveright.stop().fadeTo(400, 0);
                    moveleft.stop().fadeTo(400, 0);
                }
            })
            .click(function () {
                //If control is not visible, then just return
                if ($(this).css('opacity') == 0) return;

                var imageIndex = Number(pane.attr("indexSelected"));
                imageSelected((taxonImages.length + imageIndex + 1) % taxonImages.length,
                    function () {
                        if (!_this.mobile) {
                            moveright.stop().fadeTo(400, 1);
                            moveleft.stop().fadeTo(400, 1);
                            //Flash the camera image icons
                            controlsInner.stop().fadeIn(10).fadeOut(800);
                        }
                    }
                );
            });

        var moverightimg = $('<img src="' + tbv.opts.tombiopath + 'resources/moveright.png">')
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
            
            var currentWidth = Number(imgZoom.css("width").replace("px", ""));
            var currentHeight = Number(imgZoom.css("height").replace("px", ""));

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

        //For the most part, the touch-punch JS library provides the mapping between mobile touch
        //events and the mouse event handlers, but it doesn't translate a pinch gesture so we are
        //using hammer.js to deal with that (cross-platform). Note hammer.js is *not* a jQuery plugin.
        //create a pinch recognizer
        if (_this.mobile) {
            console.log("this is mobile!")

            var mc = new Hammer(imgZoom.get(0));
            mc.get('pinch').set({ enable: true });
            mc.on("pinchstart", function (ev) {
                //debugText("event: " + ev.type)
                _this.initPinchWidth = Number(imgZoom.css("width").replace("px", ""));
                _this.initPinchHeight = Number(imgZoom.css("height").replace("px", ""));
            });
            mc.on("pinch", function (ev) {
                //debugText("event: " + ev.type, true)
                var newWidth = _this.initPinchWidth * ev.scale;
                var newHeight = _this.initPinchHeight * ev.scale;
                updateZoomImage(imgZoom, null, null, newWidth, newHeight, null, null);
            });
        }

        //Image controls
        var controlsInner = $('<div/>')
            //.attr("class", "tombioImageControls")
            .css("margin-right", 30)
            .css("margin-top", 6)
            .css("margin-left", 6)
            .css("display", "none");

        var controlsOuter = $('<div/>')
            .css("position", "absolute")
            .css("top", 0)
            .css("left", 0)
            .css("width", "100%")
            .css("height", 30)
            .hover(function () {
                if (!_this.mobile) {
                    controlsInner.stop().fadeIn(400);
                }
            },
            function () {
                if (!_this.mobile) {
                    controlsInner.stop().fadeOut(400);
                }
            });
        
        if (_this.mobile) {
            mc.on("press", function (ev) {
                //debugText("event: " + ev.type, true)
                if (_this.imageControlsDisplayed) {
                    controlsInner.stop().fadeOut(400);
                    moveright.stop().fadeTo(400, 0);
                    moveleft.stop().fadeTo(400, 0);
                    //debugText("fade out", true)
                } else {
                    controlsInner.stop().fadeIn(400);
                    moveright.stop().fadeTo(400, 1);
                    moveleft.stop().fadeTo(400, 1)
                    //debugText("fade in", true)
                }
                _this.imageControlsDisplayed = !_this.imageControlsDisplayed;
            });
        }

        var controlsImageSelectors = $('<div/>')
        controlsInner.append(controlsImageSelectors);

        //Image selector
        var icon;

        taxonImages.forEach(function (taxonImage, imageIndex) {

            var taxonImageLink = $('<img/>');

            if (indexSelected == imageIndex) {
                icon = tbv.opts.tombiopath + "resources/cameragreen.png";
                initialSelectorImage = taxonImageLink;
            } else {
                icon = tbv.opts.tombiopath + "resources/camera.png";
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
        if (!surpressImageRemoval) {
            var closeImage = $('<img/>');
            closeImage.attr("src", tbv.opts.tombiopath + "resources/remove.png")
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
        }

        controlsOuter.append(controlsInner);
        pane.append(controlsOuter);

        //Initialise
        imageSelected(indexSelected);

        //Add method to select by index
        pane.selectByIndex = function (i) {
            console.log("Select image", i);
        }

        return pane;
    }

    visP.getTaxonImages = function (taxon) {
        //Return list of all media images for taxon, sorted by priority
        var taxonImages = tbv.media.filter(function (m) {
            if (m.Taxon == taxon && m.Type == "image-local") return true;
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });
        return taxonImages;
    }

    visP.getTaxonTipImage = function (taxon) {
        //Return list of all media images for taxon, sorted by priority
        var taxonImages = tbv.media.filter(function (m) {
            if (m.Taxon == taxon && m.Type == "image-local") {
                //Check UseFor field - it id doesn't exist or exists and empty then allow image
                //Otherwise ensure that "tip" is amongst comma separated list
                if (!m.UseFor) {
                    return true;
                } else {
                    var use = false;
                    m.UseFor.split(",").forEach(function (useForVal) {
                        if (useForVal.toLowerCase().trim() == "tip") {
                            use = true;
                        }
                    })
                    return use;
                }
            }
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });

        //In the case of more than one image, just return the first
        if (taxonImages.length > 0) {
            var ret = $('<div/>');
            var taxonImg = taxonImages[0];
            var img = $('<img/>', { src: taxonImg.URI }).appendTo(ret).css("margin-top", 2);
            var cap = $('<figcaption/>', { html: taxonImg.Caption }).appendTo(ret);
            if (taxonImg.ImageWidth) {
                img.css("width", taxonImg.ImageWidth);
            }
            return ret;
        } else {
            return null;
        }
    }

    visP.getTaxonHtmlFiles = function (taxon) {
        //Return list of all media html files for taxon, sorted by priority
        var taxonHtmlFiles = tbv.media.filter(function (m) {
            if (m.Taxon == taxon && m.Type == "html-local") return true;
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });
        return taxonHtmlFiles;
    }

    visP.showFloatingImages = function (taxon, x, y) {

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
                //aspectRatio: true,
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

    visP.showCharacterScoreDetails = function (taxon, character) {

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

        //NNormalised to 1...
        html += "<p>Unweighted character score: <b>" + Math.round(taxon[character.Character].score.overall * 100) / 100 + "</b>; ";
        html += "(for, " + Math.round(taxon[character.Character].score.for * 100) / 100;
        html += "; against, " + Math.round((taxon[character.Character].score.against + taxon[character.Character].score.na) * 100) / 100 + ")</p>";
        html += "<p>Weighted character score: <b>" + Math.round(taxon[character.Character].score.overall * character.Weight * 10) / 100 + "</b></p>";

        //console..log(taxon);

        var $dlg = $("<div>");
        $dlg.dialog({
            height: 300,
            width: 600,
            modal: true,
            title: 'Character score details'
        });
        $dlg.html(html);
        $dlg.dialog("open");
    }

    visP.showTaxonCharacterValues = function (taxon, returnAsHtml) {

        var html = $("<table>");
        html.css("width", "100%");
        html.css("margin", "0px");

        var iChar = 0;
        var lastCharacterGroup = "";

        tbv.characters.forEach(function (character) {
            if (character.Status == "key" || character.Status == "display") {

                if (tbv.charactersGrouped && character.Group != lastCharacterGroup) {
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
            $("#tombioHelpAndInfoDialog").dialog('option', 'title', taxon.Taxon);
            $("#tombioHelpAndInfoDialog").html(html);
            $("#tombioHelpAndInfoDialog").dialog("open");
        }  
    }

    visP.getHTMLFileSelectionDiv = function (taxon, container) {

        //It's important that the container to which the dropdown list is added, is passed
        //to this function and added here *before* selectmenu is called, otherwise the selectmenu
        //can appear under dialogs.
        var htmlDiv = $('<div>').appendTo(container);

        var _this = this;
        var htmlFiles = this.getTaxonHtmlFiles(taxon);

        if (htmlFiles.length == 0) {
            //If there are no images for this taxon, return a message to that effect.
            var noFiles = $("<div>").css("margin", "10px").appendTo(htmlDiv);
            noFiles.text("No text information files (HTML) are specified in the knowledge-base for this taxon.")
        } else {
            //Control for selecting HTML file
            var htmlIframe = $('<iframe id="tombioFullDetailsHTMLDiv" scrolling="no" width="100%" frameborder="0">');
            if (htmlFiles.length > 1) {
                var divSelect = $('<div style="margin-bottom: 20px">').appendTo(htmlDiv);
                var htmlSel = $("<select id='tombioFileSelect'></select>").appendTo(divSelect);
                htmlFiles.forEach(function (file, iFile) {
                    //console.log(file.Caption)
                    var opt = $("<option/>").text(file.Caption).attr("value", iFile);
                    htmlSel.append(opt);
                });
                htmlSel.selectmenu({
                    change: function (event, data) {
                        _this.showTaxonHtmlIframe(taxon, htmlIframe, data.item.value);
                    }
                });
                //htmlSel.selectmenu({ width: 300 }); //Do this separately or you get zero width
            }
            htmlIframe.on("load", function () {
                _this.resizeIframe($(this));
            });
            htmlIframe.appendTo(htmlDiv)
            this.showTaxonHtmlIframe(taxon, htmlIframe, 0);
        }
    }

    visP.resizeIframe = function (iframe) {
        iframe.height(10); //This is necessary to get the iframe to decrease in size when a smaller document is loaded.
        iframe.height(iframe.contents().height() + 100); //The extra 100 can help avoid some documents not being displayed in full
    }

    visP.showTaxonHtmlIframe = function (taxon, iframe, iFile) {

        var taxonHtmlFiles = this.getTaxonHtmlFiles(taxon);

        if (iFile <= taxonHtmlFiles.length - 1) {
            iframe.attr("src", taxonHtmlFiles[iFile].URI + "?ver=" + tbv.opts.tombiover);
        } else {
            iframe.attr("src", null);
        }
    }

    visP.showTaxonHtmlInfo = function (taxon, container, iFile) {
        
        var taxonHtmlFiles = this.getTaxonHtmlFiles(taxon);

        if (iFile <= taxonHtmlFiles.length - 1) {
            $.get(taxonHtmlFiles[iFile].URI + "?ver=" + tbv.opts.tombiover, function (data) {

                //We need to extract the html in the body tag and ignore everything
                //else. Trouble is when using jQuery to insert the full HTML into 
                //an element such as a div, the body and header don't come through.
                //So we use good old javascript searching for the body start and end
                //tags to find it instead. Then insert that into a div and extract the
                //HTML (which is without body).
                var bStart = data.indexOf("<body");
                var bEnd = data.indexOf("</body");
                var bodyHtml = data.slice(bStart, bEnd);

                var $tmpDiv = $("<div>").html(bodyHtml);
                container.html($tmpDiv.html());

            });
        } else {
            container.html(null);
        }
    }

    visP.shortName = function (name) {
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

    visP.taxonTag = function (taxonName) {
        return taxonName.replace(/[|&;$%@"<>()+:.,'\/ ]/g, '');
    }

    visP.copyTextToClipboard = function(text) {
        //https://codepen.io/Mestika/pen/NxLzNq
        var textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
            console.log('Copying text ' + msg);
        } catch (err) {
            console.log('Oops, unable to copy text');
        }
        document.body.removeChild(textArea);
    }

    //Colour ramp for the matching indicators to be used across all visualisations
    //Vermillion-Yellow-Blue http://jfly.iam.u-tokyo.ac.jp/color/
    visP.scoreColours = ['#fc8d59', '#ffffbf', '#91bfdb'];

})(jQuery, this.tombiovis);
