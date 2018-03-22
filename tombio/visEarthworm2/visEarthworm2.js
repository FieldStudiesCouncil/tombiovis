(function ($, tbv) {

    "use strict";

    var visName = "visEarthworm2";

    var visEarthworm2 = tbv[visName] = Object.create(tbv.visP);
    var _this;

    visEarthworm2.initialise = function () {

        _this = this;

        //Initialise the meta data
        this.metadata.title = "Earthworm multi-access key";
        this.metadata.authors = 'Rich Burkmar';
        this.metadata.year = '2018';
        this.metadata.publisher = 'Field Studies Council';
        this.metadata.location = 'Preston Montford';
        this.metadata.contact = 'richardb@field-studies-council.org';
        this.metadata.version = '4.0';

        //This visualisation does not use the generic state input controls, 
        //it supplies its own.
        this.charStateInput = true;

        //Help files
        this.helpFiles = [
            tbv.opts.tombiopath + "visEarthworm2/visEarthwormHelp2.html"
        ]

        //Initialise the visualisation
        $("#" + this.visName).append($("<p>").text("Visualisation goes here"));

        //Specify key input control (defined in this module)
        visEarthworm2.inputControl = Object.create(tbv.keyInputEarthworm);
        visEarthworm2.inputControl.init($("#tombioControls"));
    }

    visEarthworm2.refresh = function () {
    }

    visEarthworm2.urlParams = function (params) {
    }

    function getViewURL() {
        //Will need implementing and will be called from relevant point in
        //refresh where context menu is created.
    }

    function earthwormVis2() {

        var tombio = {
            data: {},
            worms: {},
            infowidth: 640,
            taxwidth: 205,
            taxheight: 32,
            taxexpanded: 353,
            imagedim: 12,
            taxspace: 5,
            indrad: 6,
            tvk: 0,
            delay: 450,
            tolerance: null
        }

        var characters = [
            { kbname: "HeadShape", label: "Head shape" },
            { kbname: "SetaeSpacing", label: "Setae spacing" },
            { kbname: "MalePore", label: "Male pore" },
            { kbname: "CliStart", label: "Clitellum start" },
            { kbname: "CliEnd", label: "Clitellum end" },
            { kbname: "CliWidth", label: "Clitellum length" },
            { kbname: "TPStart", label: "TP start" },
            { kbname: "TPEnd", label: "TP end" },
            { kbname: "Length", label: "Length" },
            { kbname: "Diameter", label: "Diameter" },
            { kbname: "Family", label: "Family" },
            { kbname: "Genus", label: "Genus" },
            { kbname: "EcoGroup", label: "Ecological group" },
            { kbname: "Colour", label: "Colour" },
            { kbname: "TPShape", label: "TP shape" }
        ];

        //Load the imported HTML
        $(document).ready(function () {
            $.get(tbv.opts.tombiopath + "/visEarthworm/earthworms-import.html?ver=" + tbv.opts.tombiover, function (data) {

                $("#tombiod3Earthworm").html(data.replace(/##tombiopath##/g, tbv.opts.tombiopath));

                htmlLoaded();
            });
        });

        function htmlLoaded() {

            //Align the header texts
            $("#headerTaxaW").css("width", tombio.taxspace * 3 + tombio.taxwidth * 2);
            $("#candidateTaxaW").css("left", tombio.taxspace * 1);
            $("#excludedTaxaW").css("left", tombio.taxspace * 2 + tombio.taxwidth);

            $('#confidenceLevelButton')
                .click(function (event) {
                    $("#tombioConfidenceDialog").dialog("open");
                });

            $("#tombioConfidenceDialog").dialog({
                title: "Identification confidence",
                autoOpen: false,
                modal: true,
                width: 410,
                height: 450,
                show: {
                    effect: "slideDown",
                    duration: 500
                },
                hide: {
                    effect: "explode",
                    duration: 500
                }
            });

            $("#tombioOptionsDialog").dialog({
                title: "Options",
                autoOpen: false,
                modal: true,
                width: 410,
                height: 200,
                show: {
                    effect: "slideDown",
                    duration: 500
                },
                hide: {
                    effect: "explode",
                    duration: 500
                }
            });

            $("#tombioConfidenceDialogContent").focus();
            //Can only change the title font style of *all* dialogs with css since jquery makes
            //the div, e.g. #tombioPopup, a child of the dialog and there's no CSS selector 
            //for parent, but there is a way of getting parent with jQuery.
            //$("#tombioConfidenceDialog").parent().find(".ui-dialog-title").css("font-style", "italic");

            $('#tombioResetW')
                .button({ icons: { primary: null, secondary: 'ui-icon-reset' } })
                .click(function (event) {
                    $("#headtype").val("").selectmenu('refresh');
                    $("#setaespacing").val("").selectmenu('refresh');
                    $("#colourby").val("").selectmenu('refresh');
                    $("#malepore").spinner("value", "");
                    $("#clitstart").spinner("value", "");
                    $("#clitend").spinner("value", "");
                    $("#tpstart").spinner("value", "");
                    $("#tpend").spinner("value", "");
                    $("#bodylength").spinner("value", "");
                    $("#bodydiameter").spinner("value", "");
                    $("#clitwidth").spinner("value", "");
                    colourChart(0);
                    configureChart();
                });

            $(".resetImage").attr("src", tbv.opts.tombiopath + "/visEarthworm/resources/reset2.png");

            $('#tombioOptions')
                .button({ icons: { primary: null, secondary: 'ui-icon-options' }, disabled: false })
                .click(function (event) {
                    $("#tombioOptionsDialog").dialog("open");
                });

            makeSpinner('malepore', 0, 40, 1);
            makeSpinner('clitstart', 0, 40, 1);
            makeSpinner('clitend', 0, 40, 1);
            makeSpinner('tpstart', 0, 40, 1);
            makeSpinner('tpend', 0, 40, 1);
            makeSpinner('bodylength', 0, 350, 1);
            makeSpinner('bodydiameter', 0, 10, 0.1);
            makeSpinner('clitwidth', 0, 13, 1);
            makeMenuSelect('headtype');
            makeMenuSelect('setaespacing');

            //var headtype = $("#headtype").val();
            //var setaespacing = $("#setaespacing").val();
            //console.log("headtype", ">>" + headtype + "<<", "setaespacing", ">>" + setaespacing + "<<")

            //Option spinner
            var spinner = $("#tolerance").spinner({
                min: 0,
                max: 5,
                step: 1
            }).on("spinchange", configureChart)
                .on("spinstop", configureChart);


            $("#colourby").selectmenu().on('selectmenuchange', function () { colourChart(1000) });
            //Reset button
            $("#colourbyReset")
                .click(function () {
                    $("#colourby").val("").selectmenu('refresh');
                    colourChart(100);
                });

            $("#tombioPopup").dialog({
                autoOpen: false,
                width: 410,
                height: 610,
                show: {
                    effect: "slideDown",
                    duration: 500
                },
                hide: {
                    effect: "explode",
                    duration: 500
                }
            });
            //Can only change the title font style of *all* dialogs with css since jquery makes
            //the div, e.g. #tombioPopup, a child of the dialog and there's no CSS selector 
            //for parent, but there is a way of getting parent with jQuery.
            $("#tombioPopup").parent().find(".ui-dialog-title").css("font-style", "italic");

            $("#tombioPopupTabs").tabs();

            $("#tombioMapBack").selectmenu().on('selectmenuchange', injectMap);
            $("#tombioMapData").selectmenu().on('selectmenuchange', injectMap);


            //Help dialog
            $("#tombioHelpDialog").dialog({
                title: "Morphological features",
                width: 600,
                height: 470,
                autoOpen: false,
                modal: true,
                show: {
                    effect: "slideDown",
                    duration: 500
                },
                hide: {
                    effect: "explode",
                    duration: 500
                }
            });
            $("#tombioHelpTabs").tabs();

            //Add visEarthworm object to each tbv.taxa object to specifically
            //store stuff related to the visEarthworm visualisation.
            tbv.taxa.forEach(function (t) {
                t.visEarthworm = {};
            });

            //Initialise 
            tombio.worms = d3.select("#multiaccess").selectAll(".worm")
                .data(tbv.taxa)
                .enter()
                .append("g")
                .attr("class", "worm")
                .on("click", function (d) {
                    if (d.visEarthworm.height == tombio.taxheight) {
                        d.visEarthworm.height = tombio.taxexpanded;
                    } else {
                        d.visEarthworm.height = tombio.taxheight;
                    }
                    configureChart();
                });

            tombio.worms.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("height", tombio.taxheight)
                .attr("width", tombio.taxwidth);

            //Label with scientific names
            tombio.worms.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("class", "scientificnames")
                .style("opacity", 0)
                .text(function (d) {
                    return d.Taxon.kbValue;
                });

            //Add text that specifies the knowledgebase values for 
            //each taxon
            for (var i = 0; i < characters.length; i++) {
                tombio.worms.append("text")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("class", "charactervalue")
                    .style("opacity", 0)
                    .text(function (d) {
                        var val = String(d[characters[i].kbname].kbValue);
                        return characters[i].label + ": " + val.replace("[", "").replace("]", "").replace(" |", ",").replace("|", ",");
                    });
            }

            //Add the Info image
            tombio.worms.append("image")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", tombio.imagedim)
                .attr("height", tombio.imagedim)
                .style("opacity", 0)
                .attr("xlink:href", tbv.opts.tombiopath + "/visEarthworm/resources/info20.png")
                .attr("class", "infoimage")
                .attr("id", function (d, i) {
                    return "infoimage-" + i;
                })
                .on("click", function (d, i) {

                    if ($(this).css("opacity") > 0) {
                        d3.event.stopPropagation();

                        $("#tombioPopup").dialog("open");

                        $('#tombioPopupTitleText').html(d.Taxon.kbValue);
                        $('#tombioInfoSpName').html(d.Taxon.kbValue);
                        $('#tombioInfoSpAccount').html(d.AccountPage.kbValue);
                        $('#tombioInfoSpTable').html(d.TablePage.kbValue);

                        $("#tombioPopup").dialog('option', 'title', d.Taxon.kbValue);

                        tombio.tvk = d.TVK.kbValue;
                        injectMap();
                    }
                });

            //Indicator circles
            for (var i = 1; i <= 10; i++) {
                var g = tombio.worms.append("g").attr("class", "indg");

                g.append("circle")
                    .attr("class", "indicator" + i)
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .attr("r", function () {
                        if (i < 3) {
                            return tombio.indrad;
                        } else if (i < 9) {
                            return tombio.indrad * 0.8;
                        } else {
                            return tombio.indrad * 0.6;
                        }
                    });
                g.append("text").attr("class", "indText");
            }

            d3.select("#multiaccess")
                .attr("width", tombio.taxwidth * 2 + tombio.taxspace * 3);

            d3.select("#legend")
                .attr("width", 130);

            //Add attributes
            for (var i = 0; i < tbv.taxa.length; i++) {
                tbv.taxa[i].visEarthworm.height = tombio.taxheight;
            }

            //Morpho label configuration
            $(".morphoLabel")
                .hover(
                function () {
                    // do this on hover
                    $(this).animate({
                        'color': '#D55E00'
                    }, 'fast');
                },
                function () {
                    // do this on hover out
                    $(this).animate({
                        'color': 'black'
                    }, 'fast');
                }
                )
                .click(function () {
                    //Open help dialog with the correct tab pre-selected
                    var index = $('#tombioHelpTabs a[href="#tombioHelpTab-' + $(this).attr("morphokey") + '"]').parent().index();
                    $("#tombioHelpTabs").tabs("option", "active", index);
                    $("#tombioHelpDialog").dialog("open");
                });
            //Initialise option
            $('#tolerance').spinner("value", 2);

            configureChart();
        }

        function makeMenuSelect(id) {

            $("#" + id).selectmenu().on('selectmenuchange', configureChart);

            //Reset button
            $("#" + id + "Reset")
                .click(function () {
                    $("#" + id).val("").selectmenu('refresh');
                    configureChart();
                });
        }

        function makeSpinner(id, min, max, step) {

            var spinner = $("#" + id).spinner({
                min: min,
                max: max,
                step: step
            })

            spinner.on("spinchange", configureChart)
                .on("spinstop", configureChart);

            spinner.on("spin", function (event, ui) {
                if (ui.value == spinner.spinner('option', 'min')) {
                    spinner.spinner("value", "");
                    //console.log("blanked value");
                    return false;
                }
            });

            //Make the reset image
            $("#" + id + "Reset")
                .click(function () {
                    $("#" + id).val("").spinner("value", "");
                    configureChart();
                });
        }

        function injectMap() {

            var background = $("#tombioMapBack").val();
            var datasets = $("#tombioMapData").val();

            if (datasets == "esb") {
                alert("Earthworm Society of Britain (ESB) verified data will be accessible via NBN soon! For now, all currently available datasets will be displayed instead.");

                $("#tombioMapData").val("all");
                $("#tombioMapData").selectmenu("refresh");
                datasets = "";
            }

            if (datasets == "all") {
                datasets = "";
            }

            //The new NBN Atlas static mapping doesn't seem to include the ability to limit datasets
            //and there's very little choice of UK background mapping.
            $('#tombioMapDiv').html(
                "<img id='tombioPopupMap' src='" + "https://records-ws.nbnatlas.org/mapping/wms/image?" +
                "baselayer=world&format=jpg&pcolour=3531FF&scale=on&popacity=1&q=*:*&fq=lsid:" + tombio.tvk +
                "&extents=-11.2538,48.6754,3.0270,60.7995&outline=false&outlineColour=0x000000&pradiusmm=1&dpi=200&widthmm=100'" +
                " width='100%'/>");

            //$('#tombioMapDiv').html(
            //    "<img id='tombioPopupMap' src='" + "https://gis.nbn.org.uk/SingleSpecies/" + tombio.tvk +
            //    "/atlas/circle/map?" +
            //    "imagesize=4&" +
            //    "datasets=" + datasets + "&" +
            //    "background=" + background + "&" +
            //    "fillcolour=ff0000&" +
            //    "outlinecolour=000000" +
            //    "' />");

            //For some reason, when the image displayed in Tom.bio Drupal website, width recalculated
            //and set too narrow. Setting width in line above or in stylesheet did not help. Has to
            //be dynamically resized here.
            d3.select('#tombioMapDiv').style("width", "400px");
        }

        function showHideDialog(opacity) {
            d3.select("#tombioPopup")
                .transition()
                .duration(1000)
                .style("opacity", opacity)
                .style("visibility", function () {
                    if (opacity == 0) {
                        return "hidden";
                    } else {
                        return "";
                    }
                });
        }

        //function getNBNMap(imageID, tvk) {

        //    d3.select('#' + imageID)
        //        .attr("width", 200)
        //        .attr("height", 270)
        //        //.attr("xlink:href", "https://gis.nbn.org.uk/SingleSpecies/" + tvk + "/atlas/circle/map?imagesize=2");
        //        .attr("xlink:href", "https://records-ws.nbnatlas.org/mapping/wms/image?baselayer=world&format=jpg&pcolour=3531FF&scale=on&popacity=1&q=*:*&fq=lsid:" + tvk + "&extents=-11.2538,48.6754,3.0270,60.7995&outline=true&outlineColour=0x000000&pradiusmm=1&dpi=300");
        //}

        function getGradient(colour1, colour2, colourValue) {

            var gradientName = colourValue.replace("[", "").replace("]", "").replace(/,/g, "").replace(/ /g, "");

            var gradient = d3.select("#multiaccess")
                .append("linearGradient")
                .attr("id", gradientName);

            gradient
                .append("stop")
                .attr("offset", "0%")
                .attr("stop-color", colour1);

            gradient
                .append("stop")
                .attr("offset", "100%")
                .attr("stop-color", colour2);

            return gradientName;
        }

        function getList(val) {

            var retList = [];

            if (val.indexOf('[') === 0) {

                //A numeric range
                var r1 = val.substr(1, val.length - 2);
                var delim;
                if (val.indexOf("-") > -1) {
                    delim = "-";
                } else {
                    delim = ",";
                }
                var r2 = r1.split(delim);
                for (var i = 0; i < r2.length; i++) {
                    retList.push(r2[i].trim());
                }
            } else if (val.indexOf('|') > 0) {
                //The 'or' character is used. For earthworms at the time of writing
                //this is only used for text characters and only two options in 
                //every case. So these are treated as a range for the purposes of
                //colouration. Return an array containing the two values.
                var splitVals = val.split("|");
                retList = splitVals.map(function (v) {
                    return v.trim();
                });
            } else {
                retList.push(val);
            }

            for (var i = 0; i < retList.length; i++) {
                if (val.indexOf("-") > -1) {
                    retList[i] = Number(retList[i]);
                }
            }
            return retList;
        }

        function inrange(val, range) {

            if (String(range) == "") return false;

            if (String(range).indexOf('[') === 0) {
                //This is a range
                var r1 = range.substr(1, range.length - 2);
                var r2 = r1.split('-');
                var min = Number(r2[0]);
                var max = Number(r2[1]);
            } else {
                var min = Number(range);
                var max = Number(range);
            }
            if (val >= min & val <= max) {
                return true;
            } else {
                return false;
            }
        }

        function segDiff(val, range) {

            if (val == "") return null;
            if (String(range) == "") return null;
            if (String(range) == "n/a") return val; //Treat n/a as if specified as zero in kb

            if (String(range).indexOf('[') === 0) {
                //This is a range
                var r1 = range.substr(1, range.length - 2);
                var r2 = r1.split('-');
                var min = Number(r2[0]);
                var max = Number(r2[1]);
            } else {
                var min = Number(range);
                var max = Number(range);
            }
            if (val < min) {
                return min - val;
            } else if (val > max) {
                return val - max;
            } else {
                return 0;
            }
        }

        function sizeDiff(val, range) {

            if (val == "") return null;
            if (String(range) == "") return null;

            if (String(range).indexOf('[') === 0) {
                //This is a range
                var r1 = range.substr(1, range.length - 2);
                var r2 = r1.split('-');
                var min = Number(r2[0]);
                var max = Number(r2[1]);
            } else {
                var min = Number(range);
                var max = Number(range);
            }

            //We use the value of 0.48 for a full match so that if both diameter and
            //length match, the score for the size characters will be 0.98, which is
            //less than 1 - ensuring correct ranking in relation to other characters.
            if (val < min) {
                return (min - val) / val < 1 ? (min - val) / val : 0.48;
            } else if (val > max) {
                return (val - max) / val < 1 ? (val - max) / val : 0.48;
            } else {
                return 0;
            }
        }

        function sortTaxa(array, lastPosAttr) {
            return array.sort(function (a, b) {

                var aScore = a.visEarthworm.matcharray.reduce(segScore, 0);
                var bScore = b.visEarthworm.matcharray.reduce(segScore, 0);

                if (bScore > aScore) return -1;
                if (aScore > bScore) return 1;
                if (bScore == aScore) {
                    if (a.visEarthworm[lastPosAttr] > b.visEarthworm[lastPosAttr]) {
                        return 1;
                    } else {
                        return -1;
                    }
                }
            });
        }

        function segDiscrepancy(previousValue, currentValue) {

            //if (currentValue >= 1 && currentValue < 100) {
            //    return previousValue + currentValue;
            //} else {
            //    return previousValue;
            //}
            if (currentValue >= 1 && currentValue < 100 && currentValue > previousValue) {

                return currentValue;
            } else {
                return previousValue;
            }
        }

        function totalSegDiscrepancy(previousValue, currentValue) {

            if (currentValue >= 1 && currentValue < 100) {

                return previousValue + currentValue;
            } else {
                return previousValue;
            }
        }

        function segScore(previousValue, currentValue) {

            return previousValue + currentValue;
        }

        function configureChart() {

            //Initialisations
            tombio.tolerance = $("#tolerance").spinner("value");

            var taxain = [];
            var taxaout = [];

            var headtype = $("#headtype").val();
            var setaespacing = $("#setaespacing").val();
            var malepore = Number($("#malepore").val());
            var clitstart = Number($("#clitstart").val());
            var clitend = Number($("#clitend").val());
            var clitwidth = Number($("#clitwidth").val());
            var tpstart = Number($("#tpstart").val());
            var tpend = Number($("#tpend").val());
            var bodylength = Number($("#bodylength").val());
            var bodydiameter = Number($("#bodydiameter").val());

            //Update data array to reflect whether or not each taxa meets
            //the criteria specified by user.
            for (i = 0; i < tbv.taxa.length; i++) {

                var taxon = tbv.taxa[i];

                //Taxon-level initialisations
                taxon.visEarthworm.matcharray = [null, null, null, null, null, null, null, null, null, null];

                if (taxon.HeadShape.kbValue == headtype) {
                    taxon.visEarthworm.matcharray[0] = 0;
                } else if (headtype != "") {
                    taxon.visEarthworm.matcharray[0] = 100;
                }

                if (taxon.SetaeSpacing.kbValue == setaespacing) {
                    taxon.visEarthworm.matcharray[1] = 0;
                } else if (setaespacing != "") {
                    taxon.visEarthworm.matcharray[1] = 100;
                }
                taxon.visEarthworm.matcharray[2] = segDiff(malepore, taxon.MalePore.kbValue);
                taxon.visEarthworm.matcharray[3] = segDiff(clitstart, taxon.CliStart.kbValue);
                taxon.visEarthworm.matcharray[4] = segDiff(clitend, taxon.CliEnd.kbValue);
                taxon.visEarthworm.matcharray[5] = segDiff(clitwidth, taxon.CliWidth.kbValue);
                taxon.visEarthworm.matcharray[6] = segDiff(tpstart, taxon.TPStart.kbValue);
                taxon.visEarthworm.matcharray[7] = segDiff(tpend, taxon.TPEnd.kbValue);

                taxon.visEarthworm.matcharray[8] = sizeDiff(bodylength, taxon.Length.kbValue);
                taxon.visEarthworm.matcharray[9] = sizeDiff(bodydiameter, taxon.Diameter.kbValue);

                if (taxon.visEarthworm.matcharray[0] + taxon.visEarthworm.matcharray[1] > 0) {
                    taxaout.push(taxon);
                } else if (taxon.visEarthworm.matcharray.reduce(segDiscrepancy, 0) > tombio.tolerance) {
                    taxaout.push(taxon);
                } else {
                    taxain.push(taxon);
                }
            }

            //Change the configuration of the confidenceLevel elements to reflect the
            //number of characters selected.
            var charSpecified = 0;
            if (headtype != "") charSpecified++;
            if (setaespacing != "") charSpecified++;
            if (malepore > 0) charSpecified++;
            if (clitstart > 0) charSpecified++;
            if (clitend > 0) charSpecified++;
            if (clitwidth > 0) charSpecified++;
            if (tpstart > 0) charSpecified++;
            if (tpend > 0) charSpecified++;
            if (bodylength > 0) charSpecified++;
            if (bodydiameter > 0) charSpecified++;

            var charSpecifiedRamp = d3.scaleLinear()
                .domain([0, 5, 10])
                .range(["#D55E00", "#F0E442", "#0072B2"]); //Vermillion-Yellow-Blue http://jfly.iam.u-tokyo.ac.jp/color/
            $(".confidenceLevel").css("background", charSpecifiedRamp(charSpecified));

            if (charSpecified == 0) {
                $(".confidenceLevel").css("display", "none");
            } else {
                $(".confidenceLevel").css("display", "inline-block");
            }
            $("#charCount").text(charSpecified);

            //Highlight nonsense values for clitellum
            var nonsense = false;
            if (clitwidth != "" && clitstart != "" && clitend != "") {
                if (clitwidth != (clitend - clitstart) + 1) {
                    nonsense = true;
                }
            }
            if (nonsense) {
                $("#clitwidth").css("color", "#D55E00");
            } else {
                $("#clitwidth").css("color", "black");
            }
            nonsense = false;
            if (clitstart != "" && clitend != "") {
                if (clitend <= clitstart) {
                    nonsense = true;
                }
            }
            if (nonsense) {
                $("#clitend").css("color", "#D55E00");
            } else {
                $("#clitend").css("color", "black");
            }

            //Highlight nonsense values for TP
            nonsense = false;
            if (tpstart != "" && tpend != "") {
                if (tpend <= tpstart) {
                    nonsense = true;
                }
            }
            if (nonsense) {
                $("#tpend").css("color", "#D55E00");
            } else {
                $("#tpend").css("color", "black");
            }

            //Sort the lists of taxa that are in and taxa that are out based
            //their matching scores and their previous positions.
            //These lists reference the actual items in the data array.
            sortTaxa(taxain, "visEarthworm.lastPosInTaxain");
            sortTaxa(taxaout, "visEarthworm.lastPosInTaxaout");

            //Record the current position in each list so that when next sorted, this
            //can be taken into account in order to minimise travel through list. If
            //this is not used, then priority will be given to taxa that come first in
            //KB which is arbitrary.
            for (var i = 0; i < taxain.length; i++) {
                taxain[i].visEarthworm.lastPosInTaxain = i;
                taxain[i].visEarthworm.lastPosInTaxaout = i - 100; //Ensures enters at the top (all else being equal)
            }
            for (var i = 0; i < taxaout.length; i++) {
                taxaout[i].visEarthworm.lastPosInTaxaout = i;
                taxaout[i].visEarthworm.lastPosInTaxain = 100 + i; //Ensures enters at the bottom (all else being equal)
            }

            //Update the data array items to reflect the position of each taxon
            //in each of the sorted lists so that these values are available
            //in the D3 functions.
            var yCursor = 0;
            for (i = 0; i < taxain.length; i++) {
                taxain[i].visEarthworm.x = tombio.taxspace;
                taxain[i].visEarthworm.y = yCursor + tombio.taxspace;
                yCursor = taxain[i].visEarthworm.y + taxain[i].visEarthworm.height;
            }

            yCursor = 0;
            for (i = 0; i < taxaout.length; i++) {
                taxaout[i].visEarthworm.x = tombio.taxwidth + 2 * tombio.taxspace;
                //taxaout[i].y = i * (tombio.taxheight + tombio.taxspace) + tombio.taxspace;
                taxaout[i].visEarthworm.y = yCursor + tombio.taxspace;
                yCursor = taxaout[i].visEarthworm.y + taxaout[i].visEarthworm.height;
            }

            //Render the graphics elements
            //Rectangles
            tombio.worms.select("rect")
                .transition()
                .duration(1000)
                .delay(tombio.delay)
                .attr("x", function (d) {
                    return d.visEarthworm.x;
                })
                .attr("y", function (d) {
                    return d.visEarthworm.y;
                })
                .attr("height", function (d) {
                    return d.visEarthworm.height;
                });

            //Scientific names
            tombio.worms.select(".scientificnames")
                .transition()
                .duration(1000)
                .delay(tombio.delay)
                .style("opacity", 1)
                .attr("x", function (d) {
                    return d.visEarthworm.x + tombio.taxspace;
                })
                .attr("y", function (d, i) {
                    return 1 + d.visEarthworm.y + tombio.taxheight / 2 - 2;
                });

            tombio.worms.select("text")
                .text(function (d) {
                    return d.Taxon.kbValue + " - ";
                })
                .append("tspan")
                .style("font-style", "normal")
                .style("font-weight", "bold")
                .style("font-size", "0.9em")
                .style("color", "red")
                .text(function (d) {

                    //console.log(d.ScientificName + " - " + d.matcharray);
                    return d.visEarthworm.matcharray.reduce(totalSegDiscrepancy, 0);
                });

            //Character values
            tombio.worms.selectAll(".charactervalue")
                .transition()
                .duration(1000)
                .delay(tombio.delay)
                .style("opacity", function (d, i, j) {
                    if (d.visEarthworm.height == tombio.taxheight) {
                        //Taxon not expanded
                        return 0;
                    } else {
                        //Taxon expanded
                        return 1;
                    }
                })
                .attr("x", function (d) {
                    return d.visEarthworm.x + 2 * (tombio.taxspace + tombio.indrad);
                })
                .attr("y", function (d, i) {
                    return (d.visEarthworm.y + tombio.taxheight + tombio.indrad - 1) + (i * (2 * (tombio.indrad + tombio.taxspace)));
                });

            //Images
            tombio.worms.selectAll(".infoimage")
                .transition()
                .duration(1000)
                .delay(tombio.delay)
                .style("opacity", function (d, i, j) {
                    if (d.visEarthworm.height == tombio.taxheight) {
                        //Taxon not expanded
                        return 0;
                    } else {
                        //Taxon expanded
                        return 1;
                    }
                })
                .attr("x", function (d) {
                    return d.visEarthworm.x + tombio.taxwidth - tombio.imagedim - 3;
                })
                .attr("y", function (d, i) {
                    return d.visEarthworm.y + tombio.imagedim / 2 - 2;
                });

            ///
            //#0072B2; /*Blue http://jfly.iam.u-tokyo.ac.jp/color/ */
            //#D55E00; /*Vermillion http://jfly.iam.u-tokyo.ac.jp/color/ */
            var indOthColour = d3.scaleLinear().domain([0, 100]).range(['#0072B2', '#D55E00']);
            var indSegColour = d3.scaleLinear().domain([0, tombio.tolerance + 1]).range(['#0072B2', '#D55E00']);
            var indSizeColour = d3.scaleLinear().domain([0, 0.48]).range(['#0072B2', '#D55E00']); //0.48 is max match value for size char

            //Indicator circles
            tombio.worms.selectAll("circle")
                .on('mouseover', handleMouseOver)
                .on('mouseout', handleMouseOut)
                .transition()
                .duration(1000)
                .delay(tombio.delay)
                .attr("cx", function (d, i, j) {
                    if (d.visEarthworm.height == tombio.taxheight) {
                        //Taxon not expanded, so arrange indicators in a row
                        //return d.x + tombio.taxspace + tombio.indrad + (i * (2 * tombio.indrad + tombio.taxspace));

                        if (i < 2) {
                            var startPos = d.visEarthworm.x;
                            var j = i;
                            var radFactor = 1;
                        } else if (i < 8) {
                            var startPos = d.visEarthworm.x + 2 * (2 * tombio.indrad + tombio.taxspace);
                            var j = i - 2;
                            var radFactor = 0.8;
                        } else {
                            var startPos = d.visEarthworm.x + 2 * (2 * tombio.indrad + tombio.taxspace) + 6 * (1.6 * tombio.indrad + tombio.taxspace);
                            var j = i - 8;
                            var radFactor = 0.6;
                        }
                        return startPos + tombio.taxspace + radFactor * tombio.indrad + (j * (2 * radFactor * tombio.indrad + tombio.taxspace));
                    } else {
                        //Taxon expanded, so arrange indicators in a column
                        return d.visEarthworm.x + tombio.taxspace + tombio.indrad;
                    }
                })
                .attr("cy", function (d, i, j) {
                    if (d.visEarthworm.height == tombio.taxheight) {
                        //Taxon not expanded, so arrange indicators in a row
                        return d.visEarthworm.y + tombio.taxheight - tombio.indrad - 2;
                    } else {
                        //Taxon expanded, so arrange indicators in a column
                        return (d.visEarthworm.y + tombio.taxheight) + (i * (2 * (tombio.indrad + tombio.taxspace)));
                    }
                })
                .style("fill", function (d, i) {
                    if (d.visEarthworm.matcharray[i] != null) {
                        if (i < 2) {
                            return indOthColour(d.visEarthworm.matcharray[i]);
                        } else if (i < 8) {
                            if (d.visEarthworm.matcharray[i] > tombio.tolerance + 1) {
                                return indSegColour(tombio.tolerance + 1);
                            } else {
                                return indSegColour(d.visEarthworm.matcharray[i]);
                            }
                        } else {
                            if (d.visEarthworm.matcharray[i] > 1) {
                                return 1;
                            } else {
                                return indSizeColour(d.visEarthworm.matcharray[i]);
                            }
                        }
                    } else {
                        return "white";
                    }
                });

            //Indicator circles
            tombio.worms.selectAll(".indText")
                .text(function (d, i) {
                    if (d.visEarthworm.matcharray[i] != null) {
                        if (i > 1 && i < 8) {
                            return d.visEarthworm.matcharray[i];
                        } else {
                            return "";
                        }
                    } else {
                        return "";
                    }
                });

            //Resize height of multiacces svg so page can be scrolled to end of taxa objects.
            d3.select("#multiaccess")
                .transition()
                .duration(1000)
                .delay(tombio.delay)
                .attr("height", function () {
                    var heightout, heightin;
                    if (taxaout.length == 0) {
                        heightout = 0;
                    } else {
                        heightout = taxaout[taxaout.length - 1].visEarthworm.y + taxaout[taxaout.length - 1].visEarthworm.height
                    }
                    if (taxain.length == 0) {
                        heightin = 0;
                    } else {
                        heightin = taxain[taxain.length - 1].visEarthworm.y + taxain[taxain.length - 1].visEarthworm.height
                    }
                    return Math.max(heightin, heightout);
                });

        }

        function handleMouseOver(d, i) {

            var ind = d3.select(this);
            var indText = d3.select(this.parentNode).select("text");

            indText
                .style("opacity", "1")
                .attr("x", Number(ind.attr("cx")))
                .attr("y", Number(ind.attr("cy")) + 4); //Plus 4 to centre. Can use alignment-baseline: central on Chrome but not firefox

            ind.attr("oR", ind.attr("r"));
            ind.attr("r", function () {
                if (d.visEarthworm.matcharray[i] != null) {
                    if (i > 1 && i < 8) {
                        return Number(ind.attr("r")) + tombio.taxspace;
                    } else {
                        return Number(Number(ind.attr("r")));
                    }
                } else {
                    return Number(Number(ind.attr("r")));
                }
            })
                .attr("cursor", function () {
                    if (d.visEarthworm.matcharray[i] != null) {
                        if (i > 1 && i < 8) {
                            return "none";
                        } else {
                            return "auto";
                        }
                    } else {
                        return "auto";
                    }
                });
        }

        function handleMouseOut(d, i) {

            var ind = d3.select(this);
            var indText = d3.select(this.parentNode).select("text");

            //ind.style("fill", ind.attr("oFill"));

            ind.attr("r", Number(ind.attr("oR")));
            indText
                .style("opacity", "0");
        }

        function isInArray(value, array) {
            return array.indexOf(value) > -1;
        }

        function colourChart(milliDuration) {

            var colourby = $("#colourby").val();
            var uniqueobjs = [];
            var uniquevals = [];

            //Get the unique values for the selected attribute
            if (colourby != "") {
                for (i = 0; i < tbv.taxa.length; i++) {

                    var val = tbv.taxa[i][colourby].kbValue;
                    var vals = getList(val);
                    for (var j = 0; j < vals.length; j++) {

                        if (!isInArray(vals[j], uniquevals)) {
                            uniquevals.push(vals[j]);
                            var obj = new Object();
                            obj.colval = vals[j];
                            uniqueobjs.push(obj);
                        }
                    }
                }
            }

            //Set the colour scale
            var keyGradient = "";
            var keyGradientText = "";

            if (colourby == "Length" || colourby == "Diameter") {
                //Numeric
                var iRange, iMin, iMax;
                var domainMin = 1000;
                var domainMax = 0;
                //colourDomain 
                for (var i = 0; i < tbv.taxa.length; i++) {

                    iRange = getList(tbv.taxa[i][colourby].kbValue);

                    if (iRange != "") {
                        iMin = iRange[0];
                        //console.log ("iMin: " + iMin)
                        if (iMin < domainMin) domainMin = iMin;
                        if (iRange.length > 1) {
                            iMax = iRange[1];
                        } else {
                            iMax = iRange[0];
                        }

                        if (iMax > domainMax) domainMax = iMax;
                    }
                }
                //Create, for the key the gradient item
                if (colourby == "Length") {
                    var colour = d3.scaleLinear().domain([Math.log(domainMin), Math.log(domainMax)]).range(['yellow', 'blue']);
                } else {
                    var colour = d3.scaleLinear().domain([domainMin, domainMax]).range(['yellow', 'blue']);
                }
                keyGradient = "url(#" + getGradient('yellow', 'blue', domainMin + '-' + domainMax) + ")";
                keyGradientText = domainMin + '-' + domainMax + " mm"
            } else if (colourby == "TPShape") {
                //If the selected colour variable is 'TPShape', it's a special case
                //and we use a coloru scale that groups different TP shapes.
                var colourArray = ["3 mounds", "2 mounds", "2 humps", "3 discs", "2 discs", "Band", "Raised band", "Thick band", "Thin band", "Thin bands", "Long, thin band", "Ridge", "Thin ridge", "Raised area", "Swelling", "None", ""]
                var colour = d3.scaleOrdinal()
                    .domain(colourArray)
                    .range(["#006BB2", "#2379AF", "#4585AD", "#FF7700", "#FF9232", "#009E00", "#0F9B0F", "#1E991E", "#2D992D", "#3D993D", "#4C994C", "#D30003", "#D1292C", "#6100BC", "#6F25BA", "yellow", "lightgrey"]);  //#891600
            } else if (colourby == "Colour") {
                //If the selected colour variable is 'Colour', it's a special case
                //so we use a colour scale to reflect the real colours.
                var colourArray = ["Pale", "Pink", "Pinky grey", "Red", "Dull red", "Green", "Grey", "Blue grey", "Phosphorescent", "Almost black", ""]
                var colour = d3.scaleOrdinal()
                    .domain(colourArray)
                    .range(["#FFF996", "#FF56F9", "#CC7EA0", "#FF0000", "#CC3B3B", "#43A31A", "#999999", "#4C6B99", "#4CFFA7", "#000000", "lightgrey"]);
            } else if (uniquevals.length <= 10) {
                //Otherwise if there's 10 or less use the category10 scale
                var colour = d3.scaleOrdinal(d3.schemeCategory10).domain(uniquevals);
            } else {
                //Otherwise the catebory20 scale
                var colour = d3.scaleOrdinal(d3.schemeCategory20).domain(uniquevals);
            }

            //Colour the taxa
            tombio.worms.select("rect")
                .transition()
                .duration(milliDuration)
                .attr("fill", function (d) {
                    if (colourby != "") {
                        if (d[colourby] == "") {
                            //Value of colourby column is blank for this taxon
                            return "lightgrey";
                        } else {
                            var colours = getList(d[colourby].kbValue);
                            if (colours.length == 1) {
                                if (colourby == "Length)") {
                                    return colour(Math.log(colours[0]));
                                } else {
                                    return colour(colours[0]);
                                }
                            } else {
                                //There are two colours - make a gradient between them.
                                if (colourby == "Length") {
                                    return "url(#" + getGradient(colour(Math.log(colours[0])), colour(Math.log(colours[1])), d[colourby].kbValue) + ")";
                                } else {
                                    return "url(#" + getGradient(colour(colours[0]), colour(colours[1]), d[colourby].kbValue) + ")";
                                }
                            }
                        }
                    } else {
                        //Colourby column not selected
                        return ("lightgrey");
                    }
                });

            //Create the legend objects

            d3.select("#legend").selectAll(".legenditem").remove();

            if (colourby == "Length" || colourby == "Diameter") {
                var keyColour = [];
                var obj = new Object();
                obj.colval = keyGradient;
                keyColour.push(obj);
                var legenditems = d3.select("#legend").selectAll(".legenditem").data(keyColour)

            } else if (colourby == "Colour" || colourby == "TPShape") {
                var keyColour = [];
                for (var i = 0; i < colourArray.length; i++) {
                    var obj = new Object();
                    obj.colval = colourArray[i];
                    keyColour.push(obj);
                }
                var legenditems = d3.select("#legend").selectAll(".legenditem").data(keyColour);
            } else {
                var legenditems = d3.select("#legend").selectAll(".legenditem").data(uniqueobjs);
            }

            var legenditemsEnter = legenditems.enter()
                .append("g")
                .attr("class", "legenditem");

            legenditemsEnter.append("rect")
                .attr("x", 0)
                .attr("y", function (d, i) {
                    return tombio.taxspace + i * (tombio.taxheight + tombio.taxspace)
                })
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("height", tombio.taxheight)
                .attr("width", 130)
                .attr("fill", function (d) {
                    if (d.colval == "") {
                        return "lightgrey";
                    } else if (d.colval.substr(0, 5) == "url(#") {
                        return d.colval;
                    } else {
                        return colour(d.colval);
                    }
                });

            legenditemsEnter.append("text")
                .attr("class", "legend")
                .attr("x", tombio.taxspace)
                .attr("y", function (d, i) {
                    return tombio.taxspace + i * (tombio.taxheight + tombio.taxspace) + tombio.taxheight * 2 / 3;
                })
                .text(function (d) {

                    if (d.colval.substr(0, 5) == "url(#") {
                        return keyGradientText;
                    } else {
                        return d.colval;
                    }
                });

            //Resize height of legend svg so page can be scrolled to end of taxa objects.
            d3.select("#legend")
                .attr("height", tombio.taxspace + (d3.select("#legend").selectAll(".legenditem").size() + 1) * (tombio.taxheight + tombio.taxspace));
            //.attr("height", tombio.taxspace + (uniqueobjs.length + 1) * (tombio.taxheight + tombio.taxspace));
        }
    }

})(jQuery, this.tombiovis);

(function ($, tbv) {

    "use strict";

    //##Interface##
    tbv.keyInputEarthworm = {
        //##Interface##
        //Variables that are part of the required interface...

        //Other variables 
        keyItemWidth: 130,
        keyItemHeight: 30,
        keyItemSpace: 5
    };

    //##Interface##
    tbv.keyInputEarthworm.init = function ($parent) {

        //Dynamically create the character input widgets
        var _this = this;

        //Create tool interface
        $("<div>").attr("id", "tombioEsbKeyInput").appendTo($parent);

        //Set the property which identifies the top-level div for this input
        tbv.keyInputEarthworm.$div = $("#tombioEsbKeyInput");

        var $table, $tr, $td, $el, $input, $reset
        $table = $("<table>").attr("id", "tombioEsbControlsTable")
        $table.appendTo($("#tombioEsbKeyInput"));

        //Options button
        $tr = $("<tr>").appendTo($table);
        $("<td>").appendTo($tr);
        $td = $("<td>").attr("colspan", "2").appendTo($tr);
        $el = $("<button>").attr("id", "tombioEsbOptions").text("Options").appendTo($td);

        $el.button({ icons: { primary: null, secondary: 'ui-icon-options' }, disabled: false })
            .click(function (event) {
                $("#tombioEsbOptionsDialog").dialog("open");
            });

        //Reset all button
        $tr = $("<tr>").appendTo($table);
        $("<td>").appendTo($tr);
        $td = $("<td>").attr("colspan", "2").appendTo($tr);
        $el = $("<button>").attr("id", "tombioEsbReset").text("Reset all").appendTo($td);

        $el.button({ icons: { primary: null, secondary: 'ui-icon-reset' } })
            .click(function (event) {

                //Reset the character input controls
                $(".tombioEsbInputSpin").val("").spinner("value", "");
                $(".tombioEsbInputMenu").val("").selectmenu('refresh');

                //Reset stateSet flags
                tbv.characters.forEach(function (character) {
                    character.stateSet = false;
                    character.userInput = null;
                });

                controlsChanged();
            });

        //Get those characters from knowledgebase that are marked for inclusion in this 
        //particular key by addition of a rank value to special column EsbKeyOrder
        //on characters tab.
        tbv.characters.filter(function (c) {
            //Filter to get only those marked for inclusion
            if (c.EsbKeyOrder == "") {
                return false;
            } else {
                return true;
            }
        }).sort(function (a, b) {
            //Sort to arrange in given order
            return a.EsbKeyOrder - b.EsbKeyOrder;
        }).forEach(function (c) {
            //Create control
            $tr = $("<tr>").appendTo($table);
            $td = $("<td>").attr("morphokey",c.EsbMorphoKey).appendTo($tr);
            $td.addClass("tombioEsbMorphoLabel").text(c.Label).appendTo($td);
            $td = $("<td>").appendTo($tr);
            if (c.ControlType == "spin") {
                $input = $("<input>");
                $input.addClass("tombioEsbInputSpin")
            } else {
                $input = $("<select>");
                if (c.ControlType == "multi") {
                    $input.attr("multiple", "multiple"); //Has no effect
                }
                $input.addClass("tombioEsbInputMenu")
            }
            $input.addClass("tombioEsbInput").attr("id", "tombioEsbInput-" + c.Character).appendTo($td);
            $td = $("<td>").appendTo($tr);
            $reset = $("<img>").attr("src", tbv.opts.tombiopath + "/visEarthworm2/resources/reset2.png").addClass("tombioEsbResetImage").attr("id", "tombioEsbReset-" + c.Character).appendTo($td);

            if (c.ControlType == "spin") {

                var spinParams = c.Params.split(",");
                var spinMin = Number(spinParams[0]);
                var spinMax = Number(spinParams[1]);
                var spinStep = Number(spinParams[2]);

                //Spinner control for a numeric character
                var $spinner = $input.spinner({
                    min: spinMin,
                    max: spinMax,
                    step: spinStep
                })

                $spinner.on("spinstop", function (event, ui) {
                    var val = $("#tombioEsbInput-" + c.Character).spinner("value");
                    c.stateSet = (val != null && val != "");
                    c.userInput = val;

                    console.log(val)

                    controlsChanged();
                    });
                $spinner.on("spin", function (event, ui) {
                    //This is just for blanking control if user spins down to minimum
                    var $thisSpinner = $("#tombioEsbInput-" + c.Character)
                    if (ui.value == $thisSpinner.spinner('option', 'min')) {
                        $thisSpinner.spinner("value", "");
                        return false;
                    }
                });
                //Make the reset image
                $reset.click(function () {
                    var $thisSpinner = $("#tombioEsbInput-" + c.Character)
                    $thisSpinner.val("").spinner("value", "");

                    c.stateSet = false;
                    c.userInput = null;

                    controlsChanged();
                });
            } else {
                //Selection control for a text characters
                $input.attr("name", "tombioEsbInput-" + c.Character)
                $el = $("<option>").attr("value", "").attr("selected", "selected").text("");
                $input.append($el);
                c.CharacterStateValues.forEach(function (stateValue) {
                    $el = $("<option>").text(stateValue);
                    $input.append($el);
                })
                
                $input.selectmenu().on('selectmenuchange', function () {
                    //userInput for text controls is an array of values representing the index of the 
                    //selected character states - this conforms with other input controls where multiple
                    //selection is possible. (It's not possible with this control.)
                    var indx = c.CharacterStateValues.indexOf($("#tombioEsbInput-" + c.Character).val());
                    if (indx == -1) {
                        c.stateSet = false;
                        c.userInput = null;
                    } else {
                        c.stateSet = true;
                        c.userInput = [indx];
                    }
                    controlsChanged();
                });

                //Reset button
                $reset.click(function () {
                    $("#tombioEsbInput-" + c.Character).val("").selectmenu('refresh');

                    c.stateSet = false;
                    c.userInput = null;

                    controlsChanged();
                });
            }
            });

        //Add colour by drop-down and reset button
        $tr = $("<tr>").appendTo($table);
        $td = $("<td>").addClass("tombioEsbMorphoLabelNoLink").text("Colour by").appendTo($tr);
        $td = $("<td>").appendTo($tr);
        $input = $("<select>").attr("id", "tombioEsbColourBy").addClass("tombioEsbInputMenu").appendTo($td);
        //Dropdown options
        $el = $("<option>").attr("value", "").attr("selected", "selected").text("").appendTo($input);
        tbv.characters.filter(function (c) {
            //Filter to get only those marked for inclusion
            if (c.EsbColourParams == "") {
                return false;
            } else {
                return true;
            }
        }).sort(function (a, b) {
            //Sort to arrange in given order
            //Items are of the format 'index type'
            return a.EsbColourParams.split(" ")[0] - b.EsbColourParams.split(" ")[0];
        }).forEach(function (c) {
            $el = $("<option>").attr("value", c.Character).text(c.Label).appendTo($input);
            })
        $input.selectmenu().on('selectmenuchange', function () { colourUp(); });
        //Reset button
        $td = $("<td>").appendTo($tr);
        $reset = $("<img>").attr("src", tbv.opts.tombiopath + "/visEarthworm2/resources/reset2.png").addClass("tombioEsbResetImage").attr("id", "tombioEsbReset-colour").appendTo($td);
        $reset.click(function () {
            $("#tombioEsbColourBy").val("").selectmenu('refresh');
            colourUp();
        });

        //Add SVG for colourby key
        $tr = $("<tr>").appendTo($table);
        $("<td>").appendTo($tr);
        $td = $("<td>").appendTo($tr);
        $el = $('<svg xmlns="http://www.w3.org/2000/svg" version="1.1">').attr("id", "tombioEsbLegend").appendTo($td);
        $el.css("width", this.keyItemWidth).css("height", 0); //.css("background-color", "red");
        
        //Character labels and dialog actions
        $(".tombioEsbMorphoLabel")
            .hover(
            function () {
                // do this on hover
                $(this).animate({
                    'color': '#D55E00'
                }, 'fast');
            },
            function () {
                // do this on hover out
                $(this).animate({
                    'color': 'black'
                }, 'fast');
            }
            )
            .click(function () {
                //Open help dialog with the correct tab pre-selected
                var index = $('#tombioEsbHelpTabs a[href="#tombioEsbHelpTab-' + $(this).attr("morphokey") + '"]').parent().index();
                $("#tombioEsbHelpTabs").tabs("option", "active", index);
                $("#tombioEsbHelpDialog").dialog("open");
            });

        //Create options dialog
        $("<div>").attr("id", "tombioEsbOptionsDialog").appendTo($("#tombioEsbKeyInput"));
        $table = $("<table>").appendTo($("#tombioEsbOptionsDialog"));
        $tr = $("<tr>").appendTo($table);
        $td = $("<td>").text("Tolerance").appendTo($tr);
        $td = $("<td>").appendTo($tr);
        $("<input>").attr("id", "tombioEsbTolerance").appendTo($td);

        $("<p>").text("(Consult the information dialog for details of how the"
            + " tolerance value affects the display of species in the 'possible species'"
            + " and 'unlikely species' lists.)").appendTo($("#tombioEsbOptionsDialog"));

        $("#tombioEsbOptionsDialog").dialog({
            title: "Options",
            autoOpen: false,
            modal: true,
            width: 410,
            height: 200,
            show: {
                effect: "slideDown",
                duration: 500
            },
            hide: {
                effect: "explode",
                duration: 500
            }
        });

        //Options dialog spinner
        $("#tombioEsbTolerance").spinner({
            min: 0,
            max: 5,
            step: 1
        }).on("spinchange", controlsChanged)
            .on("spinstop", controlsChanged);
        $('#tombioEsbTolerance').spinner("value", 2);

        //Create dialog for input controls
        $(document).ready(function () {
            $.get(tbv.opts.tombiopath + "/visEarthworm2/characterHelp.html?ver=" + tbv.opts.tombiover, function (data) {

                $("#tombioEsbKeyInput").append(data.replace(/##tombiopath##/g, tbv.opts.tombiopath));

                //Help dialog
                $("#tombioEsbHelpDialog").dialog({
                    title: "Morphological features",
                    width: 600,
                    height: 470,
                    autoOpen: false,
                    modal: true,
                    show: {
                        effect: "slideDown",
                        duration: 500
                    },
                    hide: {
                        effect: "explode",
                        duration: 500
                    }
                });
                $("#tombioEsbHelpTabs").tabs();
            });
        });
    }

    //Interface
    tbv.keyInputEarthworm.initFromCharacterState = function () {
        //Set the character state input controls
        tbv.characters.forEach(function (c, cIndex) {

            if (c.ControlType === "spin") {
                var control = $("#tombioEsbInput-" + c.Character);
                control.spinner("value", c.stateSet ? c.userInput : "");
            } else {
                var control = $("#tombioEsbInput-" + c.Character);

                if (c.stateSet) {
                    //Only single select is allowed
                    var stateValues = c.userInput.map(function (valueIndex) {
                        return c.CharacterStateValues[valueIndex];
                    });
                    if (stateValues.length == 0) {
                        var val = "";
                    } else {
                        var val = stateValues[0];
                    }
                } else {
                    var val = "";
                }
                control.val(val).selectmenu('refresh'); 
            }
        })
    }

    //##Interface##
    tbv.keyInputEarthworm.initKeyInputFromParams = function (params) {
        return;
    }

    //##Interface##
    tbv.keyInputEarthworm.setParamsFromKeyInput = function (params) {
        return;
    }

    //Implementation dependent elements below...

    function controlsChanged(character, value) {

        console.log("Controls changed");
        tbv.characters.forEach(function (c) {
            if (c.stateSet) {
                console.log(c.Character, c.userInput);
            }
        });
        tbv.refreshVisualisation();
    }

    function colourUp(milliDuration) {

        var _this = this;
        var kiw = tbv.keyInputEarthworm.keyItemWidth;
        var kih = tbv.keyInputEarthworm.keyItemHeight;
        var kis = tbv.keyInputEarthworm.keyItemSpace;
        var legendobjs = [];

        //Delete any current legend colour swatches
        d3.select("#tombioEsbLegend").selectAll(".tombioesb-legenditem").remove();

        //Get character to colour by
        var colourby = $("#tombioEsbColourBy").val();
        if (colourby != "") {

            //Get the type of colouring from EsbColourParams
            var colourType = tbv.oCharacters[colourby].EsbColourParams.split(" ")[1];
            var colour, domainMin, domainMax;
            if (colourType == "number" || colourType == "log") {
                domainMin = tbv.oCharacters[colourby].minVal;
                domainMax = tbv.oCharacters[colourby].maxVal;
                if (colourType == "log") {
                    domainMin = Math.log(domainMin);
                    domainMax = Math.log(domainMax);
                }
                colour = d3.scaleLinear().domain([domainMin, domainMax]).range(['yellow', 'blue']); //Not used yet
                legendobjs = [{
                    colval: "url(#" + createGradient('yellow', 'blue', domainMin + '-' + domainMax) + ")",
                    coltext: tbv.oCharacters[colourby].Label,
                    coltitle: "Range is " + tbv.oCharacters[colourby].minVal + "-" + tbv.oCharacters[colourby].maxVal
                }]
            } else if (colourType == "default" || colourType == "specified") {
                var stateValues, colours;
                if (colourType == "default") {
                    stateValues = tbv.oCharacters[colourby].CharacterStateValues;
                    if (tbv.oCharacters[colourby].CharacterStateValues.length <= 10) {
                        colours = d3.schemeCategory10;
                    } else {
                        colours = d3.schemeCategory20;
                    }
                } else { //colourType == "specified"
                    stateValues = [];
                    colours = [];
                    tbv.values.filter(function (v) {
                        return v.Character == colourby;
                    }).forEach(function (v) {
                        stateValues.push(v.CharacterState);
                        colours.push(v.EsbColour.replace("*", "#")); //Colours in kb use '*' in place of '#' which has special meaning in kb
                    })
                }
                colour = d3.scaleOrdinal().domain(stateValues).range(colours);
                legendobjs = stateValues.map(function (v) {
                    return { colval: colour(v), coltext: v }
                })
            }
            //console.log(legendobjs);

            //Creat the colour swatches for the key
            var legenditems = d3.select("#tombioEsbLegend").selectAll(".tombioesb-legenditem").data(legendobjs);

            var legenditemsEnter = legenditems.enter()
                .append("g")
                .attr("class", "tombioesb-legenditem");

            legenditemsEnter.append("rect")
                .attr("class", "tombioEsbLegendRect")
                .attr("x", 0)
                .attr("y", function (d, i) {
                    return kis + i * (kih + kis)
                })
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("height", kih)
                .attr("width", kiw)
                .style("opacity", 0.5)
                .attr("fill", function (d) {
                    return d.colval;
                })
                .attr("title", function (d) {
                    if (d.coltitle) {
                        return d.coltitle;
                    } else {
                        return "";
                    }
                });

            legenditemsEnter.append("text")
                .attr("class", "tombioEsbLegendText")
                .attr("x", kis)
                .attr("y", function (d, i) {
                    return kis + i * (kih + kis) + kih * 2 / 3;
                })
                .text(function (d) {
                    return d.coltext;
                })
                .attr("title", function (d) {
                    if (d.coltitle) {
                        return d.coltitle;
                    } else {
                        return "";
                    }
                });

            //Tooltip to show range for numeric charactgers
            $(".tombioEsbLegendRect[title!='']").tooltip({ track: true });
            $(".tombioEsbLegendText[title!='']").tooltip({ track: true });
        }
        //Resize height of legend svg so page can be scrolled to end of taxa objects.
        d3.select("#tombioEsbLegend")
            .style("height", kis + (legendobjs.length) * (kih + kis));

        controlsChanged();
    }

    function createGradient(colour1, colour2, colourValue) {

        var gradientName = colourValue.replace("[", "").replace("]", "").replace(/,/g, "").replace(/ /g, "");

        var gradient = d3.select("#tombioEsbLegend")
            .append("linearGradient")
            .attr("id", gradientName);

        gradient
            .append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colour1);

        gradient
            .append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colour2);

        return gradientName;
    }

}(jQuery, this.tombiovis));