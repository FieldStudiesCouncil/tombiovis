(function ($, tbv) {

    "use strict";

    var visName = "visEarthworm2";
    var visEarthworm2 = tbv.v.visualisations[visName] = Object.create(tbv.v.visP);
    visEarthworm2.visName = visName;

    var _this;

    visEarthworm2.initialise = function () {

        _this = this;

        //Initialise the meta data
        this.metadata.title = "Bespoke earthworm key";
        this.metadata.authors = 'Rich Burkmar';
        this.metadata.year = '2018';
        this.metadata.publisher = 'Field Studies Council';
        this.metadata.location = 'Preston Montford';
        this.metadata.contact = 'richardb@field-studies-council.org';
        this.metadata.version = '4.0';

        //Other initialisations
        this.taxwidth = 205;
        this.taxheight = 32;
        this.taxspace = 5;
        this.taxexpanded = null; //Need to calculate this dynamically.
        this.delay = 200;
        this.indrad = 6;
        this.imagedim = 12;

        //Specify key input control (defined in this module)
        this.inputControl = Object.create(tbv.gui.keyInputEarthworm);
        this.inputControl.init($(tbv.gui.main.divInput));

        //Help files
        this.helpFiles = [
            tbv.opts.tombiopath + "visEarthworm2/visEarthwormHelp2.html"
        ]

        //Initialise the visualisation
        var $div1 = $('<div>').appendTo($("#" + this.visName));
        var $div2 = $('<div>').attr('id', 'tombioEsbHeaderTaxa').appendTo($div1);
        $div2.html('<span id="tombioEsbCandidateTaxa">Possible species  <span class="tombioEsbConfidenceLevel" id="tombioEsbConfidenceLevelButton">!</span></span><span id="tombioEsbExcludedTaxa">Unlikely species</span>');

        //!!!Important lesson here. The first method of creating the SVG creates an element in which 
        //!!!text items do not position correctly. So always use the D3 method to create SVG.
        //$('<svg>').attr('id', 'tombioEsbMultiaccess').appendTo($("#" + this.visName));
        svg = d3.select("#" + this.visName).append("svg").attr('id', 'tombioEsbMultiaccess');

        $("#tombioEsbHeaderTaxa").css("width", this.taxspace * 3 + this.taxwidth * 2);
        $("#tombioEsbCandidateTaxa").css("left", this.taxspace * 1);
        $("#tombioEsbExcludedTaxa").css("left", this.taxspace * 2 + this.taxwidth);

        //Create dialog for confidence
        //$.get(tbv.opts.tombiopath + "/visEarthworm2/confidence.html?ver=" + tbv.opts.tombiover, function (data) {
        $.get(tbv.opts.tombiopath + "/visEarthworm2/confidence.html", function (data) {

            var $div = $('<div>').appendTo($("#" + _this.visName));
            $div.html(data.replace(/##tombiopath##/g, tbv.opts.tombiopath))

            $('#tombioEsbConfidenceLevelButton')
                .click(function (event) {
                    var charUsed = _this.scoreChars.filter(function (c) { return c.stateSet }).length;
                    $('#tombioEsbCharCount').html(_this.scoreChars.length);
                    $('#tombioEsbCharUsed').html(charUsed);
                    $("#tombioEsbConfidenceDialog").dialog("open");
                });

            $("#tombioEsbConfidenceDialog").dialog({
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
        });

        //Create dialog for species info
        var $el;
        $('<div>').attr('id', 'tombioEsbPopup').appendTo($("#" + _this.visName));
        $('<div>').attr('id', 'tombioEsbPopupTabs').appendTo($('#tombioEsbPopup'));
        var $ul = $('<ul>').appendTo($('#tombioEsbPopupTabs'));
        var $li1 = $('<li>').appendTo($ul);
        $('<a>').attr('href', '#tombioEsbPopupTabs1').text('Map').appendTo($li1);
        var $li2 = $('<li>').appendTo($ul);
        $('<a>').attr('href', '#tombioEsbPopupTabs2').text('Information').appendTo($li2);
        $('<div>').attr('id', 'tombioEsbPopupTabs1').appendTo($('#tombioEsbPopupTabs'));
        $('<div>').attr('id', 'tombioEsbMapDiv').appendTo($('#tombioEsbPopupTabs1'));

        //NBN logo
        $('<img>').attr("id", "tombioEsbNbnLogo").appendTo($('#tombioEsbPopupTabs1'));
        //Loading text
        $('<div>').attr("id", "tombioEsbNbnLoading").text("Loading distribution map from NBN...").appendTo($('#tombioEsbPopupTabs1'));

        $('<div>').attr('id', 'tombioEsbPopupTabs2').appendTo($('#tombioEsbPopupTabs'));
        $('<div>').attr('id', 'tombioEsbSpInfo').appendTo($('#tombioEsbPopupTabs2'));
        $el = $('<a>').attr('target', '_blank').attr('href', 'http://www.field-studies-council.org/publications/pubs/earthworms.aspx').appendTo($('#tombioEsbPopupTabs2'));
        $('<img>').attr('src', tbv.opts.tombiopath + '/visEarthworm2/resources/sherlock.png')
            .css('float', 'left').css('width', '120px').css('padding', '0 10px 10px 0').appendTo($el);

        $('<p>').html('More information on the morphology and ecology of <i><span id="tombioEsbInfoSpName"></span></i>' +
            'can be found in Emma Sherlock\'s FSC AIDGAP publication,' +
            '<a href="http://www.field-studies-council.org/publications/pubs/earthworms.aspx" target="_blank"> ' +
            '<span class="tombioEsbBooklink">Key to the earthworms of UK and Ireland</span></a>, on ' +
            '<b>pages <span id="tombioEsbInfoSpAccount"></span> (species account) and ' +
            '<span id="tombioEsbInfoSpTable"></span> (species comparison chart)</b>.' +
            '(The knowledge base behind this visualisation is drawn from Emma Sherlock\'s key.)'
        ).appendTo($('#tombioEsbPopupTabs2'));

        $('<p>').html('Additional information can be found in the Linnean Society synopsis,' +
            '<a href="http://www.field-studies-council.org/publications/pubs/earthworms-synopsis.aspx" target="_blank"> ' +
            '<span class="tombioEsbBooklink">Earthworms</span></a>, ' +
            'by Sims and Gerard, also published by FSC.'
        ).appendTo($('#tombioEsbPopupTabs2'));

        $("#tombioEsbPopup").dialog({
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
        $("#tombioEsbPopup").parent().find(".ui-dialog-title").css("font-style", "italic");
        $("#tombioEsbPopupTabs").tabs();

        //Initialise scoring characters array stored for convenient lookup
        this.scoreChars = [];
        tbv.d.characters
            .filter(function (c) { return c.EsbKeyOrder })
            .sort(function (a, b) { return a.EsbKeyOrder - b.EsbKeyOrder })
            .forEach(function (c) {
                _this.scoreChars.push(c);
            })

        //Initialise display characters array
        this.displayChars = [];
        tbv.d.characters
            .filter(function (c) { return (c.EsbKeyOrder || c.EsbColourParams) })
            .sort(function (a, b) {
                if (a.EsbKeyOrder && b.EsbKeyOrder) {
                    return a.EsbKeyOrder - b.EsbKeyOrder
                } else if (a.EsbKeyOrder && !b.EsbKeyOrder) {
                    return -1;
                } else if (!a.EsbKeyOrder && b.EsbKeyOrder) {
                    return 1;
                } else {
                    return a.EsbColourParams.split(" ")[0] - b.EsbColourParams.split(" ")[0];
                } 
            })
            .forEach(function (c) {
                _this.displayChars.push(c);
            })
        //Calculated the height of expanded taxon rectangle based on number of characters to display
        this.taxexpanded = (this.displayChars.length + 1) * 2 * (this.indrad + this.taxspace);

        //Add the structure to each of the taxa that will keep track of scoring specific to this
        //visualisation.
        tbv.d.taxa.forEach(function (t) {
            t.visState.visEarthworm2.scores = {}
            _this.scoreChars.forEach(function (c) {
                t.visState.visEarthworm2.scores[c.Character] = null; //{score: null}
            })

            t.visState.visEarthworm2.x = 0;
            t.visState.visEarthworm2.y = 0;
            t.visState.visEarthworm2.height = _this.taxheight;
        })

        //Add the SVG elements
        var svg = d3.select("#tombioEsbMultiaccess"); 

        this.worms = d3.select("#tombioEsbMultiaccess").selectAll(".tombioEsbWorm")
            .data(tbv.d.taxa)
            .enter()
            .append("g")
            .attr("x", 0)
            .attr("class", "tombioEsbWorm")
            .on("click", function (d) {
                if (d.visState.visEarthworm2.height == _this.taxheight) {
                    d.visState.visEarthworm2.height = _this.taxexpanded;
                } else {
                    d.visState.visEarthworm2.height = _this.taxheight;
                }
                _this.refresh();
            });

        this.worms.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("height", this.taxheight)
            .attr("width", this.taxwidth);

        //Label with scientific names
        this.worms.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("class", "tombioEsbScientificnames")
            .style("opacity", 0)
            .text(function (d) {
                return d.taxon.kbValue;
            });

        //Add text that specifies the knowledgebase values for each taxon
        for (var i = 0; i < this.displayChars.length; i++) {
            this.worms.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("class", "tombioEsbCharactervalue")
                .style("opacity", 0)
                .attr("pointer-events", "none")
                .text(function (d) {
                    return _this.displayChars[i].Label + ": " + d[_this.displayChars[i].Character].toString();
                });
        }

        //Add the Info image
        this.worms.append("image")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.imagedim)
            .attr("height", this.imagedim)
            .style("opacity", 0)
            .attr("xlink:href", tbv.opts.tombiopath + "/visEarthworm2/resources/info20.png")
            .attr("class", "tombioEsbInfoimage")
            .attr("id", function (d, i) {
                return "tombioEsbInfoimage-" + i;
            })
            .on("click", function (d, i) {

                if ($(this).css("opacity") > 0) {
                    d3.event.stopPropagation();

                    $("#tombioEsbPopup").dialog("open");

                    $('#tombioEsbPopupTitleText').html(d.taxon.kbValue);
                    $('#tombioEsbInfoSpName').html(d.taxon.kbValue);
                    $('#tombioEsbInfoSpAccount').html(d.AccountPage.kbValue);
                    $('#tombioEsbInfoSpTable').html(d.TablePage.kbValue);

                    $("#tombioEsbPopup").dialog('option', 'title', d.taxon.kbValue);

                    injectMap(d.tvk.kbValue);
                }
            });

        //Indicator circles
        for (var i = 1; i <= this.scoreChars.length; i++) {

            var c = this.scoreChars[i-1];
            var g = this.worms.append("g").attr("class", "tombioEsbIndg");

            g.append("circle")
                .attr("class", "tombioEsbIndicator" + i)
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", function () {
                    if (c.EsbScoreType == "redline") {
                        return _this.indrad;
                    } else if (c.EsbScoreType == "segnum") {
                        return _this.indrad * 0.8;
                    } else { //c.EsbScoreType == "size"
                        return _this.indrad * 0.6;
                    }
                });
            g.append("text")
                .attr("pointer-events", "none")
                .attr("class", "tombioEsbIndText");
        }


        //Resize the SVG
        d3.select("#tombioEsbMultiaccess")
            .style("width", this.taxwidth * 2 + this.taxspace * 3)

        //Mark as initialised
        this.initialised = true;

        //Check interface
        tbv.f.checkInterface(visName, tbv.templates.visTemplate, tbv.v.visualisations[visName]);
    }

    visEarthworm2.refresh = function () {

        function makeGradient(val1, val2) {
            var strVal1 = String(Math.round(val1, 2));
            var strVal2 = String(Math.round(val2, 2));

            var gradientName = colourby + "-" + strVal1 + "-" + strVal2;
            gradientName = gradientName.replace(/ /g, "");

            if (!document.getElementById(gradientName)) {
                //console.log("creating ", gradientName)
                var gradient = d3.select("#tombioEsbMultiaccess")
                    .append("linearGradient")
                    .attr("id", gradientName);
                gradient
                    .append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", colour(val1));
                gradient
                    .append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", colour(val2));
            }
            return gradientName;
        }

        //Add/remove context menu item for getting the view URL
        tbv.gui.main.contextMenu.addItem("Get URL for earthworm key", function () {
            getViewURL();
        }, false, [this.visName]);

        //If no characters are set in key, hide the confidence button
        var charUsed = this.scoreChars.filter(function (c) { return c.stateSet }).length;
        if (charUsed > 0) {
            $('#tombioEsbConfidenceLevelButton').show();
        } else {
            $('#tombioEsbConfidenceLevelButton').hide();
        }
        //Colour the confidence button
        var charSpecifiedRamp = d3.scaleLinear()
            .domain([0, this.scoreChars.length/2, this.scoreChars.length])
            .range(tbv.d.scoreColours);
        $(".tombioEsbConfidenceLevel").css("background", charSpecifiedRamp(charUsed));

        //Score each taxon against input characters and assign to correct column array
        var taxain = [];
        var taxaout = [];
        tbv.d.taxa.forEach(function (t) {
            t.visState.visEarthworm2.redlineTotal = 0;
            t.visState.visEarthworm2.segdiffTotal = 0;
            //t.visState.visEarthworm2.sizediffTotal = 0;

            _this.scoreChars.forEach(function (c) {

                //Redline characters
                if (c.EsbScoreType == 'redline') {
                    if (c.userInput && t[c.Character].kbValue == c.CharacterStateValues[c.userInput]) {
                        t.visState.visEarthworm2.scores[c.Character] = 0;
                    } else if (c.userInput) {
                        t.visState.visEarthworm2.scores[c.Character] = 100;
                        t.visState.visEarthworm2.redlineTotal += 100;
                    } else {
                        t.visState.visEarthworm2.scores[c.Character] = null;
                    }
                }
                //Segnum characters
                if (c.EsbScoreType == 'segnum') {
                    t.visState.visEarthworm2.scores[c.Character] = segDiff(c.userInput, t[c.Character].kbValue);
                    t.visState.visEarthworm2.segdiffTotal += t.visState.visEarthworm2.scores[c.Character];
                }

                //Size characters
                if (c.EsbScoreType == 'size') {
                    t.visState.visEarthworm2.scores[c.Character] = sizeDiff(c.userInput, t[c.Character].kbValue);
                }
                //t.visState.visEarthworm2.sizediffTotal += t.visState.visEarthworm2.scores[c.Character];
            })
            if (t.visState.visEarthworm2.redlineTotal > 0) {
                taxaout.push(t);
            } else if (t.visState.visEarthworm2.segdiffTotal > _this.inputControl.otherState.tolerance) {
                taxaout.push(t);
            } else {
                taxain.push(t);
            }
        })

        //Sort the lists of taxa that are in and taxa that are out based
        //their matching scores and their previous positions.
        //These lists reference the actual items in the data array.
        sortTaxa(taxain, "lastPosInTaxain");
        sortTaxa(taxaout, "lastPosInTaxaout");

        //Record the current position in each list so that when next sorted, this
        //can be taken into account in order to minimise travel through list. If
        //this is not used, then priority will be given to taxa that come first in
        //KB which is arbitrary.
        for (var i = 0; i < taxain.length; i++) {
            taxain[i].visState.visEarthworm2.lastPosInTaxain = i;
            taxain[i].visState.visEarthworm2.lastPosInTaxaout = i - 100; //Ensures enters at the top (all else being equal)
        }
        for (var i = 0; i < taxaout.length; i++) {
            taxaout[i].visState.visEarthworm2.lastPosInTaxaout = i;
            taxaout[i].visState.visEarthworm2.lastPosInTaxain = 100 + i; //Ensures enters at the bottom (all else being equal)
        }

        //Update the data array items to reflect the position of each taxon
        //in each of the sorted lists so that these values are available
        //in the D3 functions.
        var yCursor = 0;
        for (i = 0; i < taxain.length; i++) {
            taxain[i].visState.visEarthworm2.x = this.taxspace;
            taxain[i].visState.visEarthworm2.y = yCursor + this.taxspace;
            yCursor = taxain[i].visState.visEarthworm2.y + taxain[i].visState.visEarthworm2.height;
        }

        yCursor = 0;
        for (i = 0; i < taxaout.length; i++) {
            taxaout[i].visState.visEarthworm2.x = this.taxwidth + 2 * this.taxspace;
            //taxaout[i].y = i * (this.taxheight + this.taxspace) + this.taxspace;
            taxaout[i].visState.visEarthworm2.y = yCursor + this.taxspace;
            yCursor = taxaout[i].visState.visEarthworm2.y + taxaout[i].visState.visEarthworm2.height;
        }

        //If user has selected to colour rectangles, work out the colours
        var colourby = tbv.v.visualisations.visEarthworm2.inputControl.otherState.colourby;
        if (colourby) {
            //Define the D3 colour scale
            //This really just reflects the code in the earthworm input control and really
            //should use common code. Otherwise, as is, changes made in one will need to be
            //reflected in the other.
            var colourType = tbv.d.oCharacters[colourby].EsbColourParams.split(" ")[1];
            var colour, domainMin, domainMax;
            if (colourType == "number" || colourType == "log") {
                domainMin = tbv.d.oCharacters[colourby].minVal;
                domainMax = tbv.d.oCharacters[colourby].maxVal;
                if (colourType == "log") {
                    domainMin = Math.log(domainMin);
                    domainMax = Math.log(domainMax);
                }
                colour = d3.scaleLinear().domain([domainMin, domainMax]).range(['yellow', 'blue']);

            } else if (colourType == "default" || colourType == "specified") {
                var stateValues, colours;
                if (colourType == "default") {
                    stateValues = tbv.d.oCharacters[colourby].CharacterStateValues;
                    if (tbv.d.oCharacters[colourby].CharacterStateValues.length <= 10) {
                        colours = d3.schemeCategory10;
                    } else {
                        //colours = d3.schemeCategory20; //Discontinued with d3 v5
                        colours = d3.schemeCategory10;
                    }
                } else { //colourType == "specified"
                    stateValues = [];
                    colours = [];
                    tbv.d.values.filter(function (v) {
                        return v.Character == colourby;
                    }).forEach(function (v) {
                        stateValues.push(v.CharacterState);
                        colours.push(v.EsbColour.replace("*", "#")); //Colours in kb use '*' in place of '#' which has special meaning in kb
                    })
                }
                colour = d3.scaleOrdinal().domain(stateValues).range(colours);
            } 
        }
        //Create the gradients
        tbv.d.taxa.forEach(function (t) {
            if (colourby) {
                //This really just reflects the code in the earthworm input control and really
                //should use common code. Otherwise, as is, changes made in one will need to be
                //reflected in the other.
                if (t[colourby].kbValue == "") {
                    t.visState.visEarthworm2.fill = "lightgrey";
                } else if (colourType == "number" || colourType == "log") {
                    //If it's a numeric range, return a gradient
                    var kbval = t[colourby].kbValue.trim();
                    if (kbval.startsWith("[")) {
                        kbval = kbval.substr(1, kbval.length - 2);
                        var kbvalsplit = kbval.split("-");
                        var val1 = Number(kbvalsplit[0].trim());
                        var val2 = Number(kbvalsplit[1].trim());
                        if (colourType == "log") {
                            val1 = Math.log(val1);
                            val2 = Math.log(val2);
                        }
                        var gradientName = "url(#" + makeGradient(val1, val2, colour) + ")";
                        console.log("Gradient name: ", gradientName)
                        t.visState.visEarthworm2.fill = gradientName;
                    } else {
                        t.visState.visEarthworm2.fill = colour(t[colourby].kbValue)
                    }
                } else if (colourType == "default" || colourType == "specified") {
                    //If there is more than one possible value, then take first and last and make a gradient
                    //between them. (Works for earthworms becaue only really required for colour attribute and
                    //there are only ever two options.)
                    var kbval = t[colourby].kbValue;
                    var kbvalsplit = kbval.split("|");
                    if (kbvalsplit.length > 1) {
                        var val1 = kbvalsplit[0].trim();
                        var val2 = kbvalsplit[kbvalsplit.length - 1].trim();
                        t.visState.visEarthworm2.fill = "url(#" + makeGradient(val1, val2) + ")";
                    } else {
                        t.visState.visEarthworm2.fill = colour(t[colourby].kbValue);
                    }
                }
            } else {
                t.visState.visEarthworm2.fill = "lightgrey";
            }
        })

        //Render the graphics elements
        //Rectangles
        this.worms.select("rect")
            .style("opacity", 0.5)
            .style("fill", function (d) {
                //Colours are best done before the transition because gradient fills don't
                //transition anyway and if all fills are transition, then all rectangles
                //go white for the full transition period before getting right colour.
                return d.visState.visEarthworm2.fill;
            })
            .transition()
            .duration(1000)
            .delay(_this.delay)
            .attr("x", function (d) {
                return d.visState.visEarthworm2.x;
            })
            .attr("y", function (d) {
                return d.visState.visEarthworm2.y;
            })
            .attr("height", function (d) {
                return d.visState.visEarthworm2.height;
            })  

        //Scientific names
        this.worms.select(".tombioEsbScientificnames")
            .transition()
            .duration(1000)
            .delay(_this.delay)
            .style("opacity", 1)
            .attr("x", function (d) {
                return d.visState.visEarthworm2.x + _this.taxspace;
            })
            .attr("y", function (d, i) {
                return 1 + d.visState.visEarthworm2.y + _this.taxheight / 2 - 2;
            });
        this.worms.select("text")
            .text(function (d) {
                return d.taxon.kbValue + " - ";
            })
            .append("tspan")
            .style("font-style", "normal")
            .style("font-weight", "bold")
            .style("font-size", "0.9em")
            .style("color", "red")
            .text(function (d) {
                //console.log(d.ScientificName + " - " + d.matcharray);
                return d.visState.visEarthworm2.segdiffTotal;
            });

        //Character values
        this.worms.selectAll(".tombioEsbCharactervalue")    
            .transition()
            .duration(1000)
            .delay(this.delay)
            .style("opacity", function (d, i, j) {
                if (d.visState.visEarthworm2.height == _this.taxheight) {
                    //Taxon not expanded
                    return 0;
                } else {
                    //Taxon expanded
                    return 1;
                }
            })
            .attr("x", function (d) {
                return d.visState.visEarthworm2.x + 2 * (_this.taxspace + _this.indrad);
            })
            .attr("y", function (d, i) {
                return (d.visState.visEarthworm2.y + _this.taxheight + _this.indrad - 1) + (i * (2 * (_this.indrad + _this.taxspace)));
            })

        //Images
        this.worms.selectAll(".tombioEsbInfoimage")
            .transition()
            .duration(1000)
            .delay(this.delay)
            .style("opacity", function (d, i, j) {
                if (d.visState.visEarthworm2.height == _this.taxheight) {
                    //Taxon not expanded
                    return 0;
                } else {
                    //Taxon expanded
                    return 1;
                }
            })
            .attr("x", function (d) {
                return d.visState.visEarthworm2.x + _this.taxwidth - _this.imagedim - 3;
            })
            .attr("y", function (d, i) {
                return d.visState.visEarthworm2.y + _this.imagedim / 2 - 2;
            });

        //#0072B2; /*Blue http://jfly.iam.u-tokyo.ac.jp/color/ */
        //#D55E00; /*Vermillion http://jfly.iam.u-tokyo.ac.jp/color/ */
        var tolerance = this.inputControl.otherState.tolerance;
        var numRedline = this.scoreChars.filter(function (c) { return c.EsbScoreType == "redline" }).length
        var numSegnum = this.scoreChars.filter(function (c) { return c.EsbScoreType == "segnum" }).length;
        //var numSize = this.scoreChars.filter(function (c) { return c.EsbScoreType == "size" }).length;

        var indOthColour = d3.scaleLinear().domain([0, 100]).range(['#0072B2', '#D55E00']);
        var indSegColour = d3.scaleLinear().domain([0, tolerance + 1]).range(['#0072B2', '#D55E00']);
        var indSizeColour = d3.scaleLinear().domain([0, 0.48]).range(['#0072B2', '#D55E00']); //0.48 is max match value for size char

        //Indicator circles
        this.worms.selectAll("circle")
            .on('mouseover', handleMouseOver)
            .on('mouseout', handleMouseOut)
            .transition()
            .duration(1000)
            .delay(_this.delay)
            .attr("cx", function (d, i, j) {
                if (d.visState.visEarthworm2.height == _this.taxheight) {
                    //Taxon not expanded, so arrange indicators in a row
                    var c = _this.scoreChars[i];

                    if (c.EsbScoreType == "redline") {
                        var startPos = d.visState.visEarthworm2.x;
                        var j = i;
                        var radFactor = 1;
                    } else if (c.EsbScoreType == "segnum") {
                        var startPos = d.visState.visEarthworm2.x + numRedline * (2 * _this.indrad + _this.taxspace);
                        var j = i - numRedline;
                        var radFactor = 0.8;
                    } else {//c.EsbScoreType == "size"
                        var startPos = d.visState.visEarthworm2.x + numRedline * (2 * _this.indrad + _this.taxspace) + numSegnum * (1.6 * _this.indrad + _this.taxspace);
                        var j = i - numRedline - numSegnum;
                        var radFactor = 0.6;
                    }
                    return startPos + _this.taxspace + radFactor * _this.indrad + (j * (2 * radFactor * _this.indrad + _this.taxspace));
                } else {
                    //Taxon expanded, so arrange indicators in a column
                    return d.visState.visEarthworm2.x + _this.taxspace + _this.indrad;
                }
            })
            .attr("cy", function (d, i, j) {
                if (d.visState.visEarthworm2.height == _this.taxheight) {
                    //Taxon not expanded, so arrange indicators in a row
                    return d.visState.visEarthworm2.y + _this.taxheight - _this.indrad - 2;
                } else {
                    //Taxon expanded, so arrange indicators in a column
                    return (d.visState.visEarthworm2.y + _this.taxheight) + (i * (2 * (_this.indrad + _this.taxspace)));
                }
            })
            .style("fill", function (d, i) {
                var c = _this.scoreChars[i];
                if (d.visState.visEarthworm2.scores[c.Character] != null) {
                    if (i < 2) {
                        return indOthColour(d.visState.visEarthworm2.scores[c.Character]);
                    } else if (i < 8) {
                        if (d.visState.visEarthworm2.scores[c.Character] > tolerance + 1) {
                            return indSegColour(tolerance + 1);
                        } else {
                            return indSegColour(d.visState.visEarthworm2.scores[c.Character]);
                        }
                    } else {
                        if (d.visState.visEarthworm2.scores[c.Character] > 1) {
                            return 1;
                        } else {
                            return indSizeColour(d.visState.visEarthworm2.scores[c.Character]);
                        }
                    }
                } else {
                    return "white";
                }
            });

        //Indicator circles text
        this.worms.selectAll(".tombioEsbIndText")
            .text(function (d, i) {
                var c = _this.scoreChars[i];
                if (d.visState.visEarthworm2.scores[c.Character] != null) {
                    if (c.EsbScoreType == "segnum") {
                        return d.visState.visEarthworm2.scores[c.Character];
                    } else {
                        return "";
                    }
                } else {
                    return "";
                }
            });

        //Resize height of multiacces svg so page can be scrolled to end of taxa objects.
        d3.select("#tombioEsbMultiaccess")
            .transition()
            .duration(1000)
            .delay(_this.delay)
            .attr("height", function () {
                var heightout, heightin;
                if (taxaout.length == 0) {
                    heightout = 0;
                } else {
                    heightout = taxaout[taxaout.length - 1].visState.visEarthworm2.y + taxaout[taxaout.length - 1].visState.visEarthworm2.height
                }
                if (taxain.length == 0) {
                    heightin = 0;
                } else {
                    heightin = taxain[taxain.length - 1].visState.visEarthworm2.y + taxain[taxain.length - 1].visState.visEarthworm2.height
                }
                return Math.max(heightin, heightout);
            });
    }

    visEarthworm2.urlParams = function (params) {
    }

    visEarthworm2.show = function () {
        //Responsible for showing all gui elements of this tool
        $("#visEarthworm2").show();
        $(visEarthworm2.inputControl.divSel).show();
        visEarthworm2.inputControl.initFromCharacterState();
    }

    visEarthworm2.hide = function () {
        //Responsible for hiding all gui elements of this tool
        $("#visEarthworm2").hide();
        $(visEarthworm2.inputControl.divSel).hide();
    }

    function sortTaxa(array, lastPosAttr) {
        return array.sort(function (a, b) {

            var aScore = a.visState.visEarthworm2.segdiffTotal;
            var bScore = b.visState.visEarthworm2.segdiffTotal;

            if (bScore > aScore) return -1;
            if (aScore > bScore) return 1;
            if (bScore == aScore) {
                if (a.visState.visEarthworm2[lastPosAttr] > b.visState.visEarthworm2[lastPosAttr]) {
                    return 1;
                } else {
                    return -1;
                }
            }
        });
    }

    function getViewURL() {
        var params = [];

        //Tool
        params.push("selectedTool=" + visName)

        //Get user input control params
        Array.prototype.push.apply(params, tbv.f.setParamsFromControls());
        
        //Generate the full URL
        tbv.f.createViewURL(params);
    }

    function segDiff(val, range) {

        if (val == "" || val == null) return null;
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

        if (val == "" || val == null) return null;
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

    function handleMouseOver(d, i) {

        var ind = d3.select(this);
        var indText = d3.select(this.parentNode).select("text");

        indText
            .style("opacity", "1")
            .attr("x", Number(ind.attr("cx")))
            .attr("y", Number(ind.attr("cy")) + 4); //Plus 4 to centre. Can use alignment-baseline: central on Chrome but not firefox

        ind.attr("oR", ind.attr("r"));
        ind.attr("r", function () {
            var c = _this.scoreChars[i];
            if (d.visState.visEarthworm2.scores[c.Character] != null) {
                if (c.EsbScoreType == "segnum") {
                    return Number(ind.attr("r")) + _this.taxspace;
                } else {
                    return Number(Number(ind.attr("r")));
                }
            } else {
                return Number(Number(ind.attr("r")));
            }
        })
            .attr("cursor", function () {
                var c = _this.scoreChars[i];
                if (d.visState.visEarthworm2.scores[c.Character] != null) {
                    if (c.EsbScoreType == "segnum") {
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

    function injectMap(tvk) {

        //The new NBN Atlas static mapping doesn't seem to include the ability to limit datasets
        //and there's very little choice of UK background mapping.
        //$('#tombioEsbMapDiv').html(
        //    "<img id='tombioPopupMap' src='" + "https://records-ws.nbnatlas.org/mapping/wms/image?" +
        //    "baselayer=world&format=jpg&pcolour=3531FF&scale=on&popacity=1&q=*:*&fq=lsid:" + tvk +
        //    "&extents=-11.2538,48.6754,3.0270,60.7995&outline=false&outlineColour=0x000000&pradiusmm=1&dpi=200&widthmm=100'" +
        //    " width='100%'/>");

        $('#tombioEsbNbnLogo').attr('src', tbv.opts.tombiopath + '/visEarthworm2/resources/nbn-logo-centred.png').addClass('tombioEsbSpiningNbn');
        $('#tombioEsbNbnLoading').show();

        var src = "https://records-ws.nbnatlas.org/mapping/wms/image?" +
            "baselayer=world&format=jpg&pcolour=3531FF&scale=on&popacity=1&q=*:*&fq=lsid:" + tvk +
            "&extents=-11.2538,48.6754,3.0270,60.7995&outline=false&outlineColour=0x000000&pradiusmm=1&dpi=200&widthmm=100";

        $('#tombioEsbMapDiv').html("<img id='tombioEsbPopupMap' width='100%' />")

        $('#tombioEsbPopupMap').on('load', function () {
            $('#tombioEsbNbnLogo').attr('src', tbv.opts.tombiopath + '/visEarthworm2/resources/nbn-logo-colour-centred.png').removeClass('tombioEsbSpiningNbn');
            $('#tombioEsbNbnLoading').hide();
        }).attr("src", src)

            //"<img id='tombioEsbPopupMap' src='" + "https://records-ws.nbnatlas.org/mapping/wms/image?" +
            //"baselayer=world&format=jpg&pcolour=3531FF&scale=on&popacity=1&q=*:*&fq=lsid:" + tvk +
            //"&extents=-11.2538,48.6754,3.0270,60.7995&outline=false&outlineColour=0x000000&pradiusmm=1&dpi=200&widthmm=100'" +
            //" width='100%'/>");

        //For some reason, when the image displayed in Tom.bio Drupal website, width recalculated
        //and set too narrow. Setting width in line above or in stylesheet did not help. Has to
        //be dynamically resized here.
        //d3.select('#tombioMapDiv').style("width", "400px");
    }

})(jQuery, this.tombiovis);

(function ($, tbv) {

    "use strict";

    tbv.gui.keyInputEarthworm = {
        //Variables that are part of the required interface...
        width: 280,
        otherState: {
            keys: ["colourby", "tolerance"],
            colourby: null,
            tolerance: null
        },
        //Other variables 
        keyItemWidth: 130,
        keyItemHeight: 30,
        keyItemSpace: 5
    };

    tbv.gui.keyInputEarthworm.init = function ($parent) {

        //Dynamically create the character input widgets
        var _this = this;

        //Create tool interface
        var $mainDiv = $("<div>").attr("id", "tombioEsbKeyInput").appendTo($parent);

        //##Interface##
        //Set the property which identifies the top-level div for this input
        this.divSel = "#tombioEsbKeyInput";

        //Set the property which identifies the top-level div for this input
        //tbv.gui.keyInputEarthworm.$div = $("#tombioEsbKeyInput");

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
                tbv.d.characters.forEach(function (character) {
                    character.stateSet = false;
                    character.userInput = null;
                });
                controlsChanged();

                //Reset other colourby control
                $("#tombioEsbColourBy").val("").selectmenu('refresh');
                _this.otherState.colourby = "";
                colourUp();
            });

        //Get those characters from knowledgebase that are marked for inclusion in this 
        //particular key by addition of a rank value to special column EsbKeyOrder
        //on characters tab.
        tbv.d.characters.filter(function (c) {
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
            $td = $("<td>").attr("morphokey", c.EsbMorphoKey).appendTo($tr);
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
                    controlsChanged();
                });
                //$spinner.on("spin", function (event, ui) {
                //    //This is just for blanking control if user spins down to minimum
                //    var $thisSpinner = $("#tombioEsbInput-" + c.Character)
                //    if (ui.value == $thisSpinner.spinner('option', 'min')) {
                //        $thisSpinner.spinner("value", "");
                //        return false;
                //    }
                //});
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
        tbv.d.characters.filter(function (c) {
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
        $input.selectmenu().on('selectmenuchange', function () {
            _this.otherState.colourby = $("#tombioEsbColourBy").val();
            colourUp();
        });
        //Reset button
        $td = $("<td>").appendTo($tr);
        $reset = $("<img>").attr("src", tbv.opts.tombiopath + "/visEarthworm2/resources/reset2.png").addClass("tombioEsbResetImage").attr("id", "tombioEsbReset-colour").appendTo($td);
        $reset.click(function () {
            $("#tombioEsbColourBy").val("").selectmenu('refresh');
            _this.otherState.colourby = "";
            colourUp();
        });

        //Add SVG for colourby key
        $tr = $("<tr>").appendTo($table);
        $("<td>").appendTo($tr);
        $td = $("<td style='display:flex'>").appendTo($tr);
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
        }).on("spinstop", function () {
            _this.otherState.tolerance = $('#tombioEsbTolerance').spinner("value"); 
            controlsChanged();
            })

        //Initialise the value
        $('#tombioEsbTolerance').spinner("value", 2);
        this.otherState.tolerance = 2;

        //Create dialog for input controls
        //$.get(tbv.opts.tombiopath + "/visEarthworm2/characterHelp.html?ver=" + tbv.opts.tombiover, function (data) {
        $.get(tbv.opts.tombiopath + "/visEarthworm2/characterHelp.html", function (data) {

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

        //For some reason this needs to be done with a setTimeout otherwise the 
        //control hasn't resized properly.
        setTimeout(tbv.gui.main.resizeControlsAndTaxa, 100)

        //Check interface
        tbv.f.checkInterface("keyInputEarthworm", tbv.templates.gui.keyInput, tbv.gui["keyInputEarthworm"]);
    }

    tbv.gui.keyInputEarthworm.initFromCharacterState = function () {
        //Set the character state input controls
        tbv.d.characters.forEach(function (c, cIndex) {

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

    tbv.gui.keyInputEarthworm.initStateFromParams = function (params) {

        this.initFromCharacterState();

        $('#tombioEsbTolerance').spinner("value", params["tolerance"]); 

        $("#tombioEsbColourBy").val(params["colourby"]).selectmenu('refresh');
        this.otherState.colourby = params["colourby"];
        colourUp();
    }

    tbv.gui.keyInputEarthworm.setParamsFromState = function (params) {

        //Indicate which character was selected for colouring
        params.push("colourby=" + this.otherState.colourby);
        params.push("tolerance=" + this.otherState.tolerance);

        return params
    }

    //Implementation dependent elements below...

    function controlsChanged(character, value) {

        //console.log("Controls changed");
        //tbv.d.characters.forEach(function (c) {
        //    if (c.stateSet) {
        //        console.log(c.Character, c.userInput);
        //    }
        //});
        tbv.f.refreshVisualisation();
    }

    function colourUp(milliDuration) {

        var _this = this;
        var kiw = tbv.gui.keyInputEarthworm.keyItemWidth;
        var kih = tbv.gui.keyInputEarthworm.keyItemHeight;
        var kis = tbv.gui.keyInputEarthworm.keyItemSpace;
        var legendobjs = [];

        //Delete any current legend colour swatches
        d3.select("#tombioEsbLegend").selectAll(".tombioesb-legenditem").remove();

        //Get character to colour by
        var colourby = $("#tombioEsbColourBy").val();

        if (colourby != "") {

            //Get the type of colouring from EsbColourParams
            var colourType = tbv.d.oCharacters[colourby].EsbColourParams.split(" ")[1];
            var colour, domainMin, domainMax;
            if (colourType == "number" || colourType == "log") {
                domainMin = tbv.d.oCharacters[colourby].minVal;
                domainMax = tbv.d.oCharacters[colourby].maxVal;
                if (colourType == "log") {
                    domainMin = Math.log(domainMin);
                    domainMax = Math.log(domainMax);
                }
                colour = d3.scaleLinear().domain([domainMin, domainMax]).range(['yellow', 'blue']); //Not used yet
                legendobjs = [{
                    colval: "url(#" + createGradient('yellow', 'blue', domainMin + '-' + domainMax) + ")",
                    coltext: tbv.d.oCharacters[colourby].Label,
                    coltitle: "Range is " + tbv.d.oCharacters[colourby].minVal + "-" + tbv.d.oCharacters[colourby].maxVal
                }]
            } else if (colourType == "default" || colourType == "specified") {
                var stateValues, colours;
                if (colourType == "default") {
                    stateValues = tbv.d.oCharacters[colourby].CharacterStateValues;
                    if (tbv.d.oCharacters[colourby].CharacterStateValues.length <= 10) {
                        colours = d3.schemeCategory10;
                    } else {
                        colours = d3.schemeCategory20;
                    }
                } else { //colourType == "specified"
                    stateValues = [];
                    colours = [];
                    tbv.d.values.filter(function (v) {
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

}(jQuery, this.tombiovis.templates.loading ? this.tombiovis.templates : this.tombiovis));