(function ($, tbv) {

    "use strict";

    //This is the base prototype for visualisations and should not contain any
    //GUI framework dependent stuff, e.g. jQuery UI or D3.
    //It should be just plain HTML5 and jQuery.

    var visP = tbv.v.visP = {};

    //Colour ramp for the matching indicators to be used across all visualisations
    //Vermillion-Yellow-Blue http://jfly.iam.u-tokyo.ac.jp/color/
    visP.scoreColours = ['#fc8d59', '#ffffbf', '#91bfdb'];

    visP.initP = function (visName, gui) {

        var parent = gui.visTaxa;
        var contextMenu = gui.contextMenu;

        this.visName = visName;
        this.contextMenu = contextMenu;
        this.div = $("<div/>").attr("id", visName).css("display", "none").appendTo(parent);
        this.cssSel = parent + " > #" + visName;

        var _this = this;

        //Initialise the metadata structure for visualisations.
        this.metadata = {};

        //NBN image cache
        this.nbnMapCache = {};

        //Initialise state object for each taxon
        tbv.d.taxa.forEach(function (taxon) {
            taxon.visState[visName] = {};
        })

        //Fire the visualisations own initialisation function.
        this.initialise();
    }

    visP.sortTaxa = function (array) {
    //visP.sortTaxa = function (array, vis, lastPosAttr) {
        //lastPosAttr removed for version 1.7.0 because it resulted in unpredictable sorting
        //e.g. when initialising from URL.
        return array.sort(function (a, b) {

            if (a.visState.score.overall > b.visState.score.overall) return -1;
            if (b.visState.score.overall > a.visState.score.overall) return 1;
            if (b.visState.score.overall == a.visState.score.overall) {
                if (a.visState.score.for > b.visState.score.for) return 1;
                if (b.visState.score.for > a.visState.score.for) return -1;
                //if (lastPosAttr == undefined || vis == undefined) return 1;
                //if (a.visState[vis][lastPosAttr] > b.visState[vis][lastPosAttr]) {
                //    return 1;
                //} else {
                //    return -1;
                //}
                if (a.kbPosition > b.kbPosition) {
                    return 1;
                } else {
                    return -1;
                }
            }
        });
    }

    visP.addNBNMapToContainer = function (tvk, $parent) {

        //TVK might be passed as a string or as a state value object
        //so coerce.
        tvk = tvk += "";

        var $div = $("<div>").appendTo($parent)
            .css("border", "1px solid black")
            .css("padding", "5px")
            .css("border-radius", "10px");

        //NBN logo
        var $nbnLogo = $('<img>').addClass("tombioNbnLogo")
            .attr('src', tbv.opts.tombiopath + '/resources/nbn-logo-centred.png')
            .addClass(function () {
                if (tvk) return 'tombioSpiningNbn';
            }())
            .appendTo($div);

        //Loading text
        var $nbnLoading = $('<div>').addClass("tombioNbnLoading")
            .css("font-size", "0.8em")
            .text(function () {
                if (tvk) {
                    return "Loading distribution map from NBN...";
                } else {
                    return "No TVK specified for this taxon";
                } 
            }())
            .appendTo($div);

        if (tvk) {
            if (this.nbnMapCache[tvk]) {
                var $img = this.nbnMapCache[tvk];
                $nbnLogo.attr('src', tbv.opts.tombiopath + '/resources/nbn-logo-colour-centred.png').removeClass('tombioSpiningNbn');
                $nbnLoading.hide();
            } else {
                var src = "https://records-ws.nbnatlas.org/mapping/wms/image?" +
                    "baselayer=world&format=jpg&pcolour=3531FF&scale=on&popacity=1&q=*:*&fq=lsid:" + tvk +
                    "&extents=-11.2538,48.6754,3.0270,60.7995&outline=false&outlineColour=0x000000&pradiusmm=1&dpi=200&widthmm=100";

                var $img = $('<img>')
                    .css("width", "100%")
                    .on('load', function () {
                        $nbnLogo.attr('src', tbv.opts.tombiopath + '/resources/nbn-logo-colour-centred.png').removeClass('tombioSpiningNbn');
                        $nbnLoading.hide();
                    }).on('error', function () {
                        $nbnLogo.removeClass('tombioSpiningNbn');
                        $nbnLoading.text("An error was encountered attemping to retrieve an NBN distribution map for the TVK " + tvk);
                        $img.hide();
                    }).attr("src", src)

                this.nbnMapCache[tvk] = $img;
            }
        }

        $('<div>').append($img).appendTo($div);
    }

    visP.addTaxonImagesToContainer = function (options) {

        var taxon = options.taxon;
        var container = options.container;
        var indexSelected = options.indexSelected ? options.indexSelected : 0;
        var imageRemovalButton = options.imageRemovalButton ? options.imageRemovalButton : false;
        var fImageSelect = options.fImageSelect ? options.fImageSelect : null;
        var height = options.height ? options.height : 400;

        var _this = this;
        var taxonImages = this.getTaxonImages(taxon);

        if (taxonImages.length == 0) {
            //If there are no images for this taxon, return a message to that effect.
            var noImages = $("<div>").css("margin", "10px");
            noImages.text("No images are specified in the knowledge-base for this taxon.").appendTo(container);
            return;
        }

        var pane = $('<div>')
            .addClass("tombio-galleria-pane")
            .css("position", "relative")
            .css("max-width", "2000px")
            .css("height", height)
            .appendTo(container);

        //Create the image gallery data object
        var data = [];
        taxonImages.forEach(function (ti) {

            var img = {
                image: ti.URI,
                thumb: ti.SmallURI ? ti.SmallURI : null,
                big: ti.LargeURI ? ti.LargeURI : null,
                alt: ti.Caption,
                title: ti.Caption
            }
            data.push(img);
        })
        Galleria.run(pane, {
            transition: 'fade',
            //imageCrop: true,
            //imagePan: true,
            //lightbox: true,
            wait: true,
            dataSource: data,
            theme: 'classic',
            show: indexSelected
        });

        pane.data('galleria').bind('loadfinish', function (e) {
            //Invoke image selection changed callback
            if (fImageSelect) fImageSelect(e.index);
        });

        //Lightbox button. Have to add this because the click event (on image) which by default 
        //opens the lightbox is consumed by the zoom plugin
        $('<img>').attr("src", tbv.opts.tombiopath + "resources/enlarge.png").appendTo(pane)
            .addClass("tombio-galleria-lightbox-button")
            .on("click", function () {
                //Galleria saves its instance inside the data property of the jQuery object
                pane.data('galleria').openLightbox();
            })

        //Image removal button
        if (imageRemovalButton) {
            $('<img>').attr("src", tbv.opts.tombiopath + "resources/remove.png").appendTo(pane)
                .addClass("tombio-galleria-remove-button")
                .on("click", function () {
                    //Galleria saves its instance inside the data property of the jQuery object
                    pane.data('galleria').destroy();
                    container.addClass("userRemoved");
                    container.remove();
                })
        }
    }

    visP.addTaxonHtmlToContainer = function (taxon, container, iFile) {

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

    visP.getTaxonImages = function (taxon) {
        //Return list of all media images for taxon, sorted by priority
        var taxonImages = tbv.d.media.filter(function (m) {
            if (m.Taxon == taxon && (m.Type == "image-local" || m.Type == "image-web")) return true;
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });
        return taxonImages;
    }

    visP.getTaxonTipImage = function (taxon, parentObject) {
        //Return list of all media images for taxon, sorted by priority
        var taxonImages = tbv.d.media.filter(function (m) {
            if (m.Taxon == taxon && (m.Type == "image-local" || m.Type == "image-web")) {
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
        var taxonHtmlFiles = tbv.d.media.filter(function (m) {
            if (m.Taxon == taxon && m.Type == "html-local") return true;
        }).sort(function (a, b) {
            return Number(a.Priority) - Number(b.Priority)
        });
        return taxonHtmlFiles;
    }

    visP.getCharacterScoreDetails = function (taxon, character) {

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
        html += "<p>Knowledge-base <b>latitude</b> for this character: <b>" + character.Latitude + "</b></p>";

        //Taxon characters scores
        html += "<hr/>";

        //NNormalised to 1...
        html += "<p>Unweighted character score: <b>" + Math.round(taxon[character.Character].score.overall * 100) / 100 + "</b>; ";
        html += "(for, " + Math.round(taxon[character.Character].score.for * 100) / 100;
        html += "; against, " + Math.round((taxon[character.Character].score.against + taxon[character.Character].score.na) * 100) / 100 + ")</p>";
        html += "<p>Weighted character score: <b>" + Math.round(taxon[character.Character].score.overall * character.Weight * 10) / 100 + "</b></p>";

        return html
    }

    visP.getTaxonCharacterValues = function (taxon) {

        var html = $("<table>");
        html.css("width", "100%");
        html.css("margin", "0px");

        var iChar = 0;
        var lastCharacterGroup = "";

        tbv.d.characters.forEach(function (character) {
            if (character.Status == "key" || character.Status == "display") {

                if (tbv.d.oCharacters.grouped && character.Group != lastCharacterGroup) {
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

        return html;
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

    visP.createViewURL = function (params) {
        //var url = encodeURI(window.location.href.split('?')[0] + "?" + params.join("&"));
        //Split on ?tbv= to avoid problems with pages that use other params, e.g. Drupal
        var baseURL = window.location.href.split('tbv=')[0];
        var j = (baseURL.indexOf("?") == -1) ? "?" : "&";
        var url = encodeURI(baseURL + j + "tbv=&" + params.join("&"));
        this.copyTextToClipboard(url);
    }

})(jQuery, this.tombiovis);
