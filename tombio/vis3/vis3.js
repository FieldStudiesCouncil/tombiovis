
(function ($, core) {

    "use strict";
    
    var visName = "vis3";
    var exports = core[visName] = {};

    //Module-wide helper function
    function matchingScore(taxon0, taxonI, oCharacter) {

        //This function is referenced in initialise and refresh (for different purposes)
        //and is therefore absracted to top level of the module. (It's used both for
        //colouring cells and ranking taxa.)

        var character = oCharacter.Character;
        var charScore = null;

        if (oCharacter.Status == "key") {

            if (taxonI[character].value == "n/a" || taxonI[character].value == "") {

                if (taxon0[character].value == "n/a" || taxon0[character].value == "") {
                    //No score.
                } else {
                    //Any taxonI character without a value where one is specified for Taxon0 is non-matching.
                    charScore = -1;
                }
            } else if (taxon0[character].value == "n/a" || taxon0[character].value == "") {

                //Any taxonI character with a value where none specified for Taxon0 is non-matching.
                charScore = -1;

            } else if (oCharacter.ValueType == "numeric") {

                //Takes the min and max of the range for TaxonI, compares each to Taxon0 and takes
                //average of the two overall scores.
                var wholeRange = oCharacter.maxVal - oCharacter.minVal;
                var scoreMin = tombioScore.numberVsRange(taxonI[character].getRange().min, taxon0[character].getRange(), wholeRange, oCharacter.Strictness);
                var scoreMax = tombioScore.numberVsRange(taxonI[character].getRange().max, taxon0[character].getRange(), wholeRange, oCharacter.Strictness);
                charScore = (scoreMin[0] - scoreMin[1] + scoreMax[0] - scoreMax[1]) / 2;

            } else if (oCharacter.ValueType == "ordinal" || oCharacter.ValueType == "ordinalCircular") {

                //Match all possible states for TaxonI against taxon0 and take the average.
                var iCount = 0, scoreTotal = 0, score;
                ["male", "female", ""].forEach(function (sex) {
                    //console.log(character, taxon0.Taxon.toString(), "vs", taxonI.Taxon.toString(), "sex: ", sex);
                    taxonI[character].getOrdinalRanges(sex).forEach(function (state) {
                        score = tombioScore.ordinal2(state, taxon0[character].getOrdinalRanges(sex), oCharacter.CharacterStateValues, oCharacter.Strictness, (oCharacter.ValueType == "ordinalCircular"));
                        //console.log("for", score[0].toFixed(2), "against", score[1].toFixed(2));
                        scoreTotal += score[0];
                        scoreTotal -= score[1];
                        iCount++;
                    });
                });
                charScore = scoreTotal / iCount;
                //console.log("overall", charScore);

            } else {//Character type
                var iCount = 0, scoreTotal = 0;
                ["male", "female", ""].forEach(function (sex) {
                    scoreTotal += tombioScore.jaccard(taxonI[character].getStates(sex), taxon0[character].getStates(sex));
                    iCount++;
                });
                var meanJaccard = scoreTotal / iCount;
                //Jaccard returns a value between 0 and 1 - adjust this to range between -1 and 1.
                charScore = meanJaccard * 2 - 1;
            }
        }
        return charScore;
    }

    exports.Obj = function (parent, contextMenu, core) {

        core.visP.Obj.call(this, visName, parent, contextMenu, core);

        //Initialise the meta data
        this.metadata.title = "Side by side comparison";
        this.metadata.year = "2016";
        this.metadata.authors = "Burkmar, R";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Shrewsbury, England";
        this.metadata.contact = "richardb@field-studies-council.org";
        this.metadata.version = '1.1.0';
    }

    exports.Obj.prototype = Object.create(core.visP.Obj.prototype);

    exports.Obj.prototype.initialise = function () {

        var _this = this;

        //Control doesn't work with character state input controls
        this.charStateInput = false;

        //Help files
        this.helpFiles = [
            tombiopath + "vis3/vis3Help.html"
        ]

        //Helper functions
        function addTop(n) {

            var sortedTaxa = [];
            _this.taxa.forEach(function (taxon) {
                sortedTaxa.push(taxon);
            });
            _this.sortTaxa(sortedTaxa);

            if (sortedTaxa.length > n) {
                var slicedTaxa = sortedTaxa.slice(0, n);
            } else {
                var slicedTaxa = sortedTaxa;
            }
            _this.vis3Taxa = slicedTaxa.map(function (taxon) { return taxon.Taxon.value });
        }

        function matchFirst(topNo) {
            //If topNo is null, only those currently displayed will
            //be used.

            //Examine the pqgrid column model to get the currently displayed taxa
            var orderedTaxa = [];
            $("#visType3Grid").pqGrid("getColModel").forEach(function (col) {
                if (col.dataIndx != "group" && col.dataIndx != "character") {
                    orderedTaxa.push(_this.oTaxa[col.dataIndx]);
                }
            });

            //We can only work if at least one taxon is already displayed
            if (orderedTaxa.length == 0) return;

            var taxon0 = orderedTaxa[0];

            //If topNo is specified, then we need to compare all taxa
            if (topNo) {
                orderedTaxa = _this.taxa
            }

            //Reorder those currently displayed matching each against the first.
            orderedTaxa.forEach(function (taxon) {

                if (taxon.Taxon == taxon0.Taxon) {
                    taxon.vis3CompScore = 999999; //Top score!
                } else {
                    taxon.vis3CompScore = 0;
                    _this.characters.forEach(function (character) {
                        if (character.Status == "key") {
                            taxon.vis3CompScore += matchingScore(taxon0, taxon, character);
                        }
                    });
                }
            });
            //Sort the array
            orderedTaxa.sort(function (a, b) {
                if (a.vis3CompScore > b.vis3CompScore) {
                    return -1;
                } else {
                    return 1;
                }
            });
            //Slice the array if topNo specified
            if (topNo) {
                var slicedTaxa = orderedTaxa.slice(0, topNo + 1);
            } else {
                var slicedTaxa = orderedTaxa;
            }

            _this.vis3Taxa = slicedTaxa.map(function (taxon) { return taxon.Taxon.value });
        }

        //Initialise context menu items
        this.contextMenu.addItem("Rank those shown against first", function () {
            matchFirst();
            _this.refresh();
        }, [this.visName]);
        this.contextMenu.addItem("Show closest two to first", function () {
            matchFirst(2);
            _this.refresh();
        }, [this.visName]);
        this.contextMenu.addItem("Show closest five to first", function () {
            matchFirst(5);
            _this.refresh();
        }, [this.visName]);
        this.contextMenu.addItem("Show closest ten to first", function () {
            matchFirst(10);
            _this.refresh();
        }, [this.visName]);
        this.contextMenu.addItem("Show top two from key", function () {
            addTop(2);
            _this.refresh();
        }, [this.visName]);
        this.contextMenu.addItem("Show top five from key", function () {
            addTop(5);
            _this.refresh();
        }, [this.visName]);
        this.contextMenu.addItem("Show top ten from key", function () {
            addTop(10);
            _this.refresh();
        }, [this.visName]);
        this.contextMenu.addItem("Show all", function () {
            addTop(10000);
            _this.refresh();
        }, [this.visName]);
        this.contextMenu.addItem("Remove all", function () {
            _this.vis3Taxa = [];
            _this.refresh();
        }, [this.visName]);

        //Initialise the list with the top two matching taxa
        _this.vis3Taxa = [];
        //addTop(2);

        //$(this.cssSel).css("display", "flex");

        this.controlsDiv = $("<div/>").css("width", 210);
        $(this.cssSel).append(this.controlsDiv);

        var taxSel = Object.create(core.taxonSelect);
        taxSel.control(this.controlsDiv, true);

        var visDiv = $("<div/>").css("flex-grow", 1);
        $(this.cssSel).append(visDiv);

        //Selection of taxa
        var taxaSel = $("<select id='taxaSel'></select>");
        this.taxa.forEach(function (taxon) {

            //console.log(taxon);

            var opt = $("<option/>").text(taxon.Taxon.value);
            taxaSel.append(opt);
        });
        
        visDiv.append(taxaSel);

        //If done here the following results in menu of zero width. So it's done in refresh instead.
        //taxaSel.selectmenu()
        //    .selectmenu("menuWidget")
        //    .css("height", 200)
        //    .css("width", 250)
        //    .css("vertical-align", "top");

        //Add and minus buttons for add/remove taxa
        var addButton = $("<button id='addTaxon'>Add selected taxon to dispaly</button>").button({ text: false, icons: { secondary: 'ui-icon-plusx' } })
            .css("vertical-align", "top").css("margin-left", 1).css("width", 40).css("font-weight", "bold").css("font-size", 12)
            .on("click", function () {
                var selectedName = $("#taxaSel").find(":selected").text();
                if (_this.vis3Taxa.indexOf(selectedName) == -1) {
                    _this.vis3Taxa.push(selectedName);
                    _this.refresh();
                }
            });

        visDiv.append(addButton);

        //Radio buttons to group characters or not
        if (_this.charactersGrouped) {
            var radios = $("<fieldset>").css("display", "inline-block").css("padding", "0px").css("border", "none").css("vertical-align", "top").css("margin-left", 20);
            radios.append($("<label>").attr("for", "groupvisible").text("group"));
            radios.append($("<input>").attr("type", "radio").attr("name", "groupvisibility").attr("id", "groupvisible").attr("value", "visible"));
            radios.append($("<label>").attr("for", "groupinvisible").text("ungroup"));
            radios.append($("<input>").attr("type", "radio").attr("name", "groupvisibility").attr("id", "groupinvisible").attr("value", "invisible").attr("checked", "checked"));
            visDiv.append(radios);
            $("[name='groupvisibility']").checkboxradio({ icon: false });
            radios.on("change", function () {
                _this.refresh();
            });   
        }

        //Grid div
        var gridDiv = $("<div id='visType3Grid'></div>").css("margin-top", 10)
        visDiv.append(gridDiv);

        //Create taxon state object array
        this.stateTaxa = {};
        this.taxa.forEach(function (taxon) {
            _this.stateTaxa[taxon.Taxon.value] = {}
        })
    }

    exports.Obj.prototype.refresh = function () {

        var _this = this;

        if (!$('#visType3Grid').is(':empty')){
            $("#visType3Grid").pqGrid("destroy")
        }

        //I don't know why but this has to be done here - not in initialisation where it
        //results in a menu of zero width.
        $("#taxaSel").selectmenu()
            .selectmenu("menuWidget")
            .css("height", 200)
            .css("width", 250)
            .css("vertical-align", "top");

        //Build the descriptions array that contains the table data.
        //We need to create an array of objects with the following structure.
        //{ character: "character 1 label", pq_cellcls: { "character": "character 1 name" }, "taxon 1 name": "taxon 1 character 1 value, "taxon 2 name": "taxon 2 character 1 value" },
        //{ character: "character 2 label", pq_cellcls: { "character": "character 2 name" }, "taxon 1 name": "taxon 1 character 2 value, "taxon 2 name": "taxon 2 character 2 value" }
        var descriptions = [];

        var imgRow = { group: " Images", character: "Images" } //The space ensures the Images group is at the top
        this.vis3Taxa.forEach(function (name) {

            var taxon = _this.oTaxa[name];

            var imgIcon = $("<div>")
                .attr("taxon", name)
                .css("position", "relative")
                .attr("class", "vis3ImageDiv");
            imgRow[taxon.Taxon] = imgIcon[0].outerHTML;
        });
        descriptions.push(imgRow);

        this.characters.forEach(function (character) {

            if (character.Status == "display" || (character.Status == "key" && character.Character != "Sex")) {
                var char = { group: character.Group, character: character.Label, pq_cellcls: { "character": character.Character } };
                _this.vis3Taxa.forEach(function (name) {

                    var taxon = _this.oTaxa[name];
                    char[taxon.Taxon] = taxon[character.Character].toHtml1();
                });
                descriptions.push(char);
            }
        });

        //Build the model array that contains the column definitions.
        //We need to create an array of objects with the following structure.
        //{ title: "Character", width: 200, dataType: "string", dataIndx: "character", sortable: false },
        //{ title: "Megabunus diadema", width: 200, dataType: "string", dataIndx: "Megabunus diadema", sortable: false },
        //{ title: "Leiobunum rotundum", width: 200, dataType: "string", dataIndx: "Leiobunum rotundum", sortable: false }
        var model = [];
        var columns = ["group"].concat(["character"].concat(this.vis3Taxa));
        columns.forEach(function (name, i) {
            if (i == 0) { //Group
                var hidden = true;
            } else {
                var hidden = false;
            }
            if (i == 1) { //Character
                var styleName = "Character";
            } else {
                var styleName = "<i>" + name + "</i>";
            }
            
            //Column widths
            if (!_this.vis3ColWidth)
                _this.vis3ColWidth = 200;
            if (!_this.vis3CharColWidth)
                _this.vis3CharColWidth = 200;
            if (i == 1) {
                var colWidth = _this.vis3CharColWidth;
            } else {
                var colWidth = _this.vis3ColWidth;
            }

            var col = {
                title: styleName,
                hidden: hidden,
                width: colWidth,
                dataType: "string",
                dataIndx: name,
                sortable: false
            }
            model.push(col);
        });

        var visibility = $("input[name=groupvisibility]:checked").val();

        var grpModel = null;
        if (visibility == "visible") {
            grpModel = {
                dataIndx: ["group"],
                collapsed: [true],
                title: ["<b style='font-weight:bold;'>{0}</b>", "{0}"],
                dir: ["up", "down"]
            };
        }

        var obj = {
            flexHeight: true,
            flexWidth: true,
            showTop: false,
            showBottom: false,
            showTitle: false,
            numberCell: { show: false },
            stripeRows: true,
            columnBorders: true,
            showHeader: true,
            editable: false,
            resizable: false,
            groupModel: grpModel,
            selectionModel: { type: null, mode: null} ,
            columnResize: function( event, ui ) {
                vis3ColumnResize(ui);
            },
            refresh: function () {
                vis3GridRefresh();
            }
        };

        obj.colModel = model;

        obj.dataModel = {
            data: descriptions, 
            location: "local"
        };

        //Make the grid
        $("#visType3Grid").pqGrid(obj);

        //resizeControlsAndTaxa();

        //Helpers
        function vis3ColumnResize(ui) {

            if (ui.dataIndx == "character") {
                _this.vis3CharColWidth = ui.newWidth;
                return;
            }
            _this.vis3ColWidth = ui.newWidth;

            $("#visType3Grid").pqGrid("getColModel").forEach(function (col) {
                if (col.dataIndx != "group" && col.dataIndx != "character") {
                    col.width = ui.newWidth;
                }
            });
            $("#visType3Grid").pqGrid("refresh");
        }

        function vis3GridRefresh() {

            //Ensure that the header rows contain the remove icon
            $(".pq-grid-title-row").find(".pq-td-div:not(:contains('Character'))")
               .append("<img class='vis3removeIcon' src='" + tombiopath + "resources/minus.png'>");

            $(".vis3removeIcon").on("click", function () {
                var selectedName = $(this).parent().text().trim();
                var selIndex = _this.vis3Taxa.indexOf(selectedName);
                if (selIndex != -1) {
                    _this.vis3Taxa.splice(selIndex, 1);
                    _this.refresh();
                }
            });

            //Handle image display
            //Declare two functions because they have each to be used in two places since everytime
            //pqGrid refreshes, image DIV has to be recreated.
            var addRemoveHandler = function (vis3ImageDiv, taxonImgDiv, loadImgIcon, taxon) {
                taxonImgDiv.on("remove", function () {
                    vis3ImageDiv.closest(".pq-td-div").css("padding", "");
                    vis3ImageDiv.closest("td").css("background-color", "");
                    loadImgIcon.fadeIn();

                    _this.stateTaxa[taxon.Taxon.value].indexSelected = taxonImgDiv.attr("indexSelected");
                    if (taxonImgDiv.is(".userRemoved")) {
                        _this.stateTaxa[taxon.Taxon.value].displayImages = false;
                    }
                });
            }

            var addTaxonImages = function (vis3ImageDiv) {

                var taxonName = vis3ImageDiv.attr("taxon");
                var taxon = _this.oTaxa[taxonName];

                if (_this.stateTaxa[taxonName].indexSelected) {
                    var taxonImgDiv = _this.getTaxonImagesDiv(taxonName, null, _this.stateTaxa[taxonName].indexSelected);
                } else {
                    var taxonImgDiv = _this.getTaxonImagesDiv(taxonName);
                }
                vis3ImageDiv.closest(".pq-td-div").css("padding", 0);
                vis3ImageDiv.closest("td").css("background-color", "grey");

                vis3ImageDiv.append(taxonImgDiv);

                var loadImgIcon = vis3ImageDiv.find(".loadImgIcon");
                loadImgIcon.fadeOut(0);
                addRemoveHandler(vis3ImageDiv, taxonImgDiv, loadImgIcon, taxon);

                _this.stateTaxa[taxonName].displayImages = true;
                return taxonImgDiv;
            }

            $(".vis3ImageDiv")
                .each(function () {

                    var vis3ImageDiv = $(this);
                    var taxonName = $(this).attr("taxon");
                    var taxon = _this.oTaxa[taxonName];

                    if (_this.getTaxonImages(taxonName).length > 0) {

                        var loadImg = $("<img>")
                        .attr("src", tombiopath + "resources/camera.png")
                        .addClass("loadImgIcon")
                        .css("cursor", "pointer")
                        .css("width", 15)
                        .on("click", function () {
                            var loadImgIcon = $(this);
                            var taxonImgDiv = addTaxonImages(vis3ImageDiv);
                            addRemoveHandler(vis3ImageDiv, taxonImgDiv, loadImgIcon, taxon);
                        });
                        $(this).append(loadImg);

                        //if (taxon.vis3["displayImages"]) {
                        if(_this.stateTaxa[taxonName].displayImages) {
                            addTaxonImages(vis3ImageDiv);
                        }
                    }
                });

            //Colour up the cell columns to show how well each matches against first taxon
            //in list.
            var scaleOverall = d3.scaleLinear()
                .domain([-1, 0, 1])
                .range(_this.scoreColours);

            //Get the column model to reflect the order of the columns
            var orderedTaxa = [];
            $("#visType3Grid").pqGrid("getColModel").forEach(function (col) {
                if (col.dataIndx != "group" && col.dataIndx != "character") {
                    orderedTaxa.push(col.dataIndx);
                }
            })

            //Do nothing if less than two taxa present
            if (orderedTaxa.length < 2) return;

            var taxon0 = _this.oTaxa[orderedTaxa[0]];
            for (var i = 1; i < orderedTaxa.length; i++) {
                var taxonI = _this.oTaxa[orderedTaxa[i]];

                for (var character in _this.oCharacters) {
                    var oCharacter = _this.oCharacters[character];
           
                    //When the data array was created, character cells (td) were tagged with
                    //a class - the name of the character. So we can now use this to retrieve
                    //the td cell and, by getting the parent of that, get the row and it's
                    //pq-row-indx attribute which we can then use to get the cells for each
                    //taxon/character combo.

                    //console.log("oCharacter.Character", oCharacter.Character);

                    var pqrowindx = $("." + oCharacter.Character).closest("tr").attr("pq-row-indx");

                    //pqrowindx will be undefined if row is not displayed (e.g. because of grouping)
                    if (pqrowindx != undefined) {

                        //First time through the loop colour up taxon0
                        if (i == 1) {
                            var td0 = $("#visType3Grid").pqGrid("getCell", { rowIndx: pqrowindx, dataIndx: orderedTaxa[0] });
                            if (oCharacter.Status == "key") {
                                if (taxon0[character].value == "n/a" || taxon0[character].value == "" || taxon0[character].value == "?") {
                                    td0.css("background-color", "white");
                                } else {
                                    td0.css("background-color", scaleOverall(1));
                                }
                            } else if (oCharacter.Status == "display") {
                                td0.css("background-color", "silver");
                            }
                        }

                        //Colour up taxonI.
                        var tdI = $("#visType3Grid").pqGrid("getCell", { rowIndx: pqrowindx, dataIndx: orderedTaxa[i] });
                        var score = matchingScore(taxon0, taxonI, oCharacter);

                        if (oCharacter.Status == "display") {
                            tdI.css("background-color", "silver");
                        } else if (score == null) {
                            tdI.css("background-color", "white");
                        } else {
                            tdI.css("background-color", scaleOverall(score));
                        }
                    }
                }
            }
        }
    }

})(jQuery, this.tombiovis)