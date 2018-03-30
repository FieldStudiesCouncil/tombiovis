﻿(function ($, tbv) {

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

        //Other initialisations
        this.taxwidth = 205;
        this.taxheight = 32;
        this.taxspace = 5;
        this.taxexpanded = 353; //Need to calculate this dynamically.
        this.delay = 450;

        //This visualisation does not use the generic state input controls, 
        //but it does supply its own.
        this.charStateInput = true;
        //Specify key input control (defined in this module)
        this.inputControl = Object.create(tbv.keyInputEarthworm);
        this.inputControl.init($("#tombioControls"));

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
        $.get(tbv.opts.tombiopath + "/visEarthworm2/confidence.html?ver=" + tbv.opts.tombiover, function (data) {

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

        //Initialise scoring characters array stored for convenient lookup
        this.scoreChars = [];
        tbv.characters
            .filter(function (c) { return c.EsbKeyOrder })
            .sort(function (a, b) { return a.EsbKeyOrder - b.EsbKeyOrder })
            .forEach(function (c) {
                _this.scoreChars.push(c);
            })

        //Add the structure to each of the taxa that will keep track of scoring specific to this
        //visualisation.
        tbv.taxa.forEach(function (t) {
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
            .data(tbv.taxa)
            .enter()
            .append("g")
            .attr("x", 0)
            .attr("class", "tombioEsbWorm")
            .on("click", function (d) {
                if (d.visState.visEarthworm2.height == this.taxheight) {
                    d.visState.visEarthworm2.height = this.taxexpanded;
                } else {
                    d.visState.visEarthworm2.height = this.taxheight;
                }
                this.refresh();
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
                return d.Taxon.kbValue;
            });

        //Add text that specifies the knowledgebase values for each taxon
        for (var i = 0; i < this.scoreChars; i++) {
            this.worms.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("class", "tombioEsbCharactervalue")
                .style("opacity", 0)
                .text(function (d) {
                    return this.scoreChars[i].Label + ": " + d[this.scoreChars[i].Character].toString();
                });
        }


        //Resize the SVG
        d3.select("#tombioEsbMultiaccess")
            .style("width", this.taxwidth * 2 + this.taxspace * 3);
    }

    visEarthworm2.refresh = function () {

        //Add/remove context menu item for getting the view URL
        this.contextMenu.addItem("Get URL for earthworm key", function () {
            getViewURL();
        }, [this.visName]);

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
            .range(this.scoreColours);
        $(".tombioEsbConfidenceLevel").css("background", charSpecifiedRamp(charUsed));

        //Score each taxon against input characters and assign to correct column array
        var taxain = [];
        var taxaout = [];
        tbv.taxa.forEach(function (t) {
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
                }
                t.visState.visEarthworm2.segdiffTotal += t.visState.visEarthworm2.scores[c.Character];

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

        //Render the graphics elements
        //Rectangles

        console.log("1")
        this.worms.select("rect")
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
            });

        console.log("2")
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

        console.log("3")
        this.worms.select("text")
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
                return d.visState.visEarthworm2.segdiffTotal;
            });

        //###############
        //Colours and the rest

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
        Array.prototype.push.apply(params, tbv.setParamsFromControls());

        
        //Generate the full URL
        var url = encodeURI(window.location.href.split('?')[0] + "?" + params.join("&"));
        _this.copyTextToClipboard(url);
        console.log(url);
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

                //Reset other colourby control
                $("#tombioEsbColourBy").val("").selectmenu('refresh');
                _this.otherState.colourby = "";
                colourUp();
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
        }).on("spinstop", function () {
            _this.otherState.tolerance = $('#tombioEsbTolerance').spinner("value"); 
            controlsChanged();
            })

        //Initialise the value
        $('#tombioEsbTolerance').spinner("value", 2);
        this.otherState.tolerance = 2;

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

        this.initFromCharacterState();

        $('#tombioEsbTolerance').spinner("value", params["tolerance"]); 

        $("#tombioEsbColourBy").val(params["colourby"]).selectmenu('refresh');
        this.otherState.colourby = params["colourby"];
        colourUp();
    }

    //##Interface##
    tbv.keyInputEarthworm.setParamsFromKeyInput = function (params) {

        //Indicate which character was selected for colouring
        params.push("colourby=" + this.otherState.colourby);
        params.push("tolerance=" + this.otherState.tolerance);

        return params
    }

    //##Interface##
    tbv.keyInputEarthworm.otherState = {
        keys: ["colourby", "tolerance"],
        colourby: null,
        tolerance: null
    }

    //Implementation dependent elements below...

    function controlsChanged(character, value) {

        //console.log("Controls changed");
        //tbv.characters.forEach(function (c) {
        //    if (c.stateSet) {
        //        console.log(c.Character, c.userInput);
        //    }
        //});
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