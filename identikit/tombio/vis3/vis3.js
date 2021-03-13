
(function ($, tbv) {

    "use strict";
    
    var visName = "vis3";
    var vis3 = tbv.v.visualisations[visName] = Object.create(tbv.v.visP);
    vis3.visName = visName;

    var _this;
    var taxSel;

    vis3.initialise = function () {

        _this = this;

        //Initialise the metadata
        this.metadata.title = "Side by side comparison";
        this.metadata.year = "2018";
        this.metadata.authors = "Burkmar, R";
        this.metadata.publisher = "Field Studies Council";
        this.metadata.location = "Shrewsbury, England";
        this.metadata.contact = "r.burkmar@field-studies-council.org";
        this.metadata.version = '1.8.0';

        //Object variable to store image index
        this.imageIndex = 0;

        //Help files
        this.helpFiles = [
            tbv.opts.tombiopath + "vis3/vis3Help.html",
            tbv.opts.tombiopath + "common/taxon-select-help.html"
        ]

        function taxonSelectCallback(retValue) {

            if (retValue.selected && _this.vis3Taxa.indexOf(retValue.selected) == -1) {
                _this.vis3Taxa.push(retValue.selected);
                _this.refresh();
            }
            if (retValue.deselected && _this.vis3Taxa.indexOf(retValue.deselected) != -1) {
                _this.vis3Taxa.splice(_this.vis3Taxa.indexOf(retValue.deselected), 1);
                _this.refresh();
            }
            if (retValue.taxa.length == 0) {
                _this.vis3Taxa = [];
                _this.refresh();
            }
        }

        //Initialise context menu items
        tbv.gui.main.contextMenu.addItem("Get URL for side by side comparison view", function () {
            getViewURL();
        }, false, [this.visName]);
        tbv.gui.main.contextMenu.addItem("Rank those shown against first", function () {
            matchFirst();
            _this.refresh();
        }, false, [this.visName]);
        tbv.gui.main.contextMenu.addItem("Show closest two to first", function () {
            matchFirst(2);
            _this.refresh();
        }, false, [this.visName]);
        tbv.gui.main.contextMenu.addItem("Show closest five to first", function () {
            matchFirst(5);
            _this.refresh();
        }, false, [this.visName]);
        tbv.gui.main.contextMenu.addItem("Show closest ten to first", function () {
            matchFirst(10);
            _this.refresh();
        }, false, [this.visName]);
        tbv.gui.main.contextMenu.addItem("Show top two from key", function () {
            addTop(2);
            _this.refresh();
        }, false, [this.visName]);
        tbv.gui.main.contextMenu.addItem("Show top five from key", function () {
            addTop(5);
            _this.refresh();
        }, false, [this.visName]);
        tbv.gui.main.contextMenu.addItem("Show top ten from key", function () {
            addTop(10);
            _this.refresh();
        }, false, [this.visName]);
        tbv.gui.main.contextMenu.addItem("Remove all", function () {
            _this.vis3Taxa = [];
            _this.refresh();
            taxSel.deselectAllTaxa();
        }, false, [this.visName]);
        

        //Initialise the list with the top two matching taxa
        _this.vis3Taxa = [];

        //Top level div
        var visDiv = $("<div/>")
            //The following adjustment necessary to move to top of div
            .css("position", "relative").css("top", -13);
        $(this.cssSel).append(visDiv);

        //Taxon selection control
        taxSel = Object.create(tbv.gui.taxonSelect);
        taxSel.init(tbv.gui.main.divInput, true, taxonSelectCallback);

        //Radio buttons to group characters or not
        //if (tbv.d.oCharacters.grouped) {
        //    var radios = $("<fieldset>").css("display", "inline-block").css("padding", "0px").css("border", "none").css("vertical-align", "top");
        //    radios.append($("<label>").attr("for", "groupvisible").text("group"));
        //    radios.append($("<input>").attr("type", "radio").attr("name", "groupvisibility").attr("id", "groupvisible").attr("value", "visible"));
        //    radios.append($("<label>").attr("for", "groupinvisible").text("ungroup"));
        //    radios.append($("<input>").attr("type", "radio").attr("name", "groupvisibility").attr("id", "groupinvisible").attr("value", "invisible").attr("checked", "checked"));
        //    visDiv.append(radios);
        //    $("[name='groupvisibility']").checkboxradio({ icon: false });
        //    radios.on("change", function () {
        //        _this.refresh();
        //    });   
        //}

        //Don't know why, but if nothing is put in here (in place of group controls above), then 
        //pqgrid width is zero (or one or something).
        visDiv.append($("<div>").css("display", "inline-block").css("width", 150).css("height",1));

        //Grid div
        var gridDiv = $("<div id='visType3Grid'></div>");//.css("margin-top", 10)
        visDiv.append(gridDiv);

        //Create taxon state object array
        //this.stateTaxa = {};
        //tbv.d.taxa.forEach(function (taxon) {
        //    _this.stateTaxa[taxon.taxon.kbValue] = {}
        //})

        //Interface
        this.taxonSelect = taxSel;

        //Mark as initialised
        this.initialised = true;

        //Check interface
        tbv.f.checkInterface(visName, tbv.templates.visTemplate, tbv.v.visualisations[visName]);
    }

    vis3.refresh = function () {

        if (!$('#visType3Grid').is(':empty')){
            $("#visType3Grid").pqGrid("destroy")
        }

        ////I don't know why but this has to be done here - not in initialisation where it
        ////results in a menu of zero width.
        //$("#taxaSel").selectmenu()
        //    .selectmenu("menuWidget")
        //    .css("height", 200)
        //    .css("width", 250)
        //    .css("vertical-align", "top");

        //Build the descriptions array that contains the table data.
        //We need to create an array of objects with the following structure.
        //{ character: "character 1 label", pq_cellcls: { "character": "character 1 name" }, "taxon 1 name": "taxon 1 character 1 value, "taxon 2 name": "taxon 2 character 1 value" },
        //{ character: "character 2 label", pq_cellcls: { "character": "character 2 name" }, "taxon 1 name": "taxon 1 character 2 value, "taxon 2 name": "taxon 2 character 2 value" }
        var descriptions = [];

        var imgRow = { group: " Images", character: "Images" } //The space ensures the Images group is at the top
        this.vis3Taxa.forEach(function (name) {

            var taxon = tbv.d.oTaxa[name];

            var imgIcon = $("<div>")
                .attr("taxon", name)
                .css("position", "relative")
                .attr("class", "vis3ImageDiv");
            imgRow[taxon.taxon] = imgIcon[0].outerHTML;
        });
        descriptions.push(imgRow);

        tbv.d.characters.forEach(function (character) {

            if (character.Status == "display" || (character.Status == "key" && character.Character != "Sex")) {
                var char = { group: character.Group, character: character.Label, pq_cellcls: { "character": character.Character } };
                _this.vis3Taxa.forEach(function (name) {

                    var taxon = tbv.d.oTaxa[name];
                    char[taxon.taxon] = taxon[character.Character].toHtml1();
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
            columnResize: function (event, ui) {
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

        //Ensure that the columns are all correctly sized
        resizeColumns();

        //Helpers
        function vis3ColumnResize(ui) {

            if (ui.dataIndx == "character") {
                _this.vis3CharColWidth = ui.newWidth;
                return;
            }

            console.log(ui.newWidth);

            _this.vis3ColWidth = ui.newWidth;

            resizeColumns();
        }

        function resizeColumns() {
            //Set all columns (except character to same size)
            $("#visType3Grid").pqGrid("getColModel").forEach(function (col) {
                if (col.dataIndx != "group" && col.dataIndx != "character") {
                    col.width = _this.vis3ColWidth;
                }
            });

            //Call refresh
            $("#visType3Grid").pqGrid("refresh");
        }

        function vis3GridRefresh() {

            //Ensure that the header rows contain the remove icon
            //(Taken out 27/10/2017 since crowded display and could look bad on narrow cells and
            //moreover, no longer needed since introduction of taxonSelect control from which taxa
            //can be deselected.))
            //$(".pq-grid-title-row").find(".pq-td-div:not(:contains('Character'))")
            //   .append("<img class='vis3removeIcon' src='" + tbv.opts.tombiopath + "resources/minus.png'>");

            //$(".vis3removeIcon").on("click", function () {
            //    var selectedName = $(this).parent().text().trim();
            //    var selIndex = _this.vis3Taxa.indexOf(selectedName);
            //    if (selIndex != -1) {
            //        _this.vis3Taxa.splice(selIndex, 1);
            //        _this.refresh();
            //        //Deselect this taxon in the taxonselect control
            //        taxSel.deselectTaxon(selectedName)
            //    }
            //});

            $(".vis3ImageDiv")
                .each(function () {

                    var vis3ImageDiv = $(this);
                    var taxonName = $(this).attr("taxon");
                    var taxon = tbv.d.oTaxa[taxonName];

                    if (tbv.f.getTaxonImages(taxonName).length > 0) {

                        var loadImg = $("<img>")
                        .attr("src", tbv.opts.tombiopath + "resources/camera.png")
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
                        //if(_this.stateTaxa[taxonName].displayImages) {
                        if (tbv.d.oTaxa[taxonName].visState[visName].displayImages) {
                            addTaxonImages(vis3ImageDiv);
                        }
                    }
                });

            //Colour up the cell columns to show how well each matches against first taxon
            //in list.
            var scaleOverall = d3.scaleLinear()
                .domain([-1, 0, 1])
                .range(tbv.d.scoreColours);

            //Get the column model to reflect the order of the columns
            var orderedTaxa = [];
            $("#visType3Grid").pqGrid("getColModel").forEach(function (col) {
                if (col.dataIndx != "group" && col.dataIndx != "character") {
                    orderedTaxa.push(col.dataIndx);
                }
            })

            //Do nothing if less than two taxa present
            if (orderedTaxa.length < 2) return;

            //Colour the header columns
            orderedTaxa.forEach(function (t, i) {
                $("td[pq-row-indx=0][pq-col-indx=" + (i + 2) + "]")
                    .css("background-color", "rgb(100,100,100)")
                    .css("color", "white");
            })

            var taxon0 = tbv.d.oTaxa[orderedTaxa[0]];
            for (var i = 1; i < orderedTaxa.length; i++) {
                var taxonI = tbv.d.oTaxa[orderedTaxa[i]];

                for (var character in tbv.d.oCharacters) {
                    var oCharacter = tbv.d.oCharacters[character];
           
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
                                if (taxon0[character].kbValue == "n/a" || taxon0[character].kbValue == "novalue" || taxon0[character].kbValue == "" || taxon0[character].kbValue == "?") {
                                    td0.css("background-color", "white");
                                } else {
                                    td0.css("background-color", scaleOverall(1));
                                }
                            } else if (oCharacter.Status == "display") {
                                td0.css("background-color", "lightgrey");
                            }
                        }

                        //Colour up taxonI.
                        var tdI = $("#visType3Grid").pqGrid("getCell", { rowIndx: pqrowindx, dataIndx: orderedTaxa[i] });
                        var score = matchingScore(taxon0, taxonI, oCharacter);

                        if (oCharacter.Status == "display") {
                            tdI.css("background-color", "lightgrey");
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

    vis3.urlParams = function (params) {

        //Set the column widths
        _this.vis3ColWidth = params.colwidth;

        //Set the taxa
        if (params.taxa) {
            params.taxa.split("^").forEach(function (t) {
                taxSel.taxonClick(t.replace(/%20/g, " "));
            })
        }

        //Display images where required (must come after taxa selected)
        if (params.imgs) {
            params.imgs.split("-").forEach(function (iImage, i) {
                var taxon = _this.vis3Taxa[i];
                if (iImage != "x") {
                    //_this.stateTaxa[taxon].indexSelected = iImage;
                    tbv.d.oTaxa[taxon].visState[visName].indexSelected = iImage;

                    var vis3ImageDiv = $('.vis3ImageDiv[taxon="' + taxon + '"]')
                    var loadImgIcon = vis3ImageDiv.find('.loadImgIcon')

                    var taxonImgDiv = addTaxonImages(vis3ImageDiv);
                    addRemoveHandler(vis3ImageDiv, taxonImgDiv, loadImgIcon, taxon);
                }

            })
        }

        setTimeout(function () {
            //For some reason the pqgrid seems to interfer with 
            //the D3 transitions of the taxaselect tool (or the 
            //SVG graphics or whatever) but it can be fixed
            //by calling the taxaselect functions in a timeout.

            //Set the taxon input controls
            taxSel.initStateFromParams(params);

        }, 100)
    }

    vis3.show = function () {
        //Responsible for showing all gui elements of this tool
        $("#vis3").show();
        taxSel.$div.show();

        //Initialise the view if set within options
        if (tbv.opts.toolconfig.vis3.init) {
            try {
                eval(tbv.opts.toolconfig.vis3.init)
            } catch {
                console.log(tbv.opts.toolconfig.vis3.init, 'not a valid function call.')
            }
        }
    }

    vis3.hide = function () {
        //Responsible for hiding all gui elements of this tool
        $("#vis3").hide();
        taxSel.$div.hide();
    }

    function addTop(n) {

        var sortedTaxa = [];
        tbv.d.taxa.forEach(function (taxon) {
            sortedTaxa.push(taxon);
        });
        tbv.f.sortTaxa(sortedTaxa);

        if (sortedTaxa.length > n) {
            var slicedTaxa = sortedTaxa.slice(0, n);
        } else {
            var slicedTaxa = sortedTaxa;
        }
        _this.vis3Taxa = slicedTaxa.map(function (taxon) { return taxon.taxon.kbValue });

        //Match taxon selection control to selection
        taxSel.deselectAllTaxa();
        _this.vis3Taxa.forEach(function (t) {
            taxSel.taxonClick(t);
        })
    }

    function matchFirst(topNo) {
        //If topNo is null, only those currently displayed will
        //be used.

        //Examine the pqgrid column model to get the currently displayed taxa
        var orderedTaxa = [];
        $("#visType3Grid").pqGrid("getColModel").forEach(function (col) {
            if (col.dataIndx != "group" && col.dataIndx != "character") {
                orderedTaxa.push(tbv.d.oTaxa[col.dataIndx]);
            }
        });

        //We can only work if at least one taxon is already displayed
        if (orderedTaxa.length == 0) return;

        var taxon0 = orderedTaxa[0];

        //If topNo is specified, then we need to compare all taxa
        if (topNo) {
            orderedTaxa = tbv.d.taxa
        }

        //Reorder those currently displayed matching each against the first.
        orderedTaxa.forEach(function (taxon) {

            if (taxon.taxon == taxon0.taxon) {
                taxon.vis3CompScore = 999999; //Top score!
            } else {
                taxon.vis3CompScore = 0;
                tbv.d.characters.forEach(function (character) {
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

        _this.vis3Taxa = slicedTaxa.map(function (taxon) { return taxon.taxon.kbValue });

        //Match taxon selection control to selection
        taxSel.deselectAllTaxa();
        _this.vis3Taxa.forEach(function (t) {
            taxSel.taxonClick(t);
        })
    }

    function getViewURL() {

        var params = [];

        //Tool
        params.push("selectedTool=" + visName)

        //The taxa...
        //params.push("taxa=" + _this.vis3Taxa.join("^"));
        //In case taxa have been reordered, we have to
        //get the taxon names from the pqgrid to reproduce the order
        var taxa = [];

        var cells = $(".pq-grid-title-row").find(".pq-td-div");
        for (var i = 1; i < cells.length; i++) {
            taxa.push(cells[i].children[0].innerText);
        }
        params.push("taxa=" + taxa.join("^"));

        //Taxa images
        var imgs = [];
        taxa.forEach(function (t) {
            //if (typeof _this.stateTaxa[t].indexSelected != "undefined") {
            if (typeof tbv.d.oTaxa[t].visState[visName].indexSelected != "undefined") {
                //imgs.push(_this.stateTaxa[t].indexSelected);
                imgs.push(tbv.d.oTaxa[t].visState[visName].indexSelected);
            } else {
                imgs.push("x");
            }
        })
        params.push("imgs=" + imgs.join("-"));

        //Column width
        params.push("colwidth=" + _this.vis3ColWidth);

        //Get the taxon select URL params
        params = taxSel.setParamsFromState(params);

        //Generate the full URL
        tbv.f.createViewURL(params);
    }

    function addRemoveHandler (vis3ImageDiv, taxonImgDiv, loadImgIcon, taxon) {
        taxonImgDiv.on("remove", function () {

            vis3ImageDiv.closest(".pq-td-div").css("padding", "");
            vis3ImageDiv.closest("td").css("background-color", "");
            loadImgIcon.fadeIn();

            //_this.stateTaxa[taxon.taxon.kbValue].imgDiv = null;
            tbv.d.oTaxa[taxon.taxon.kbValue].visState[visName].imgDiv = null;
            if (taxonImgDiv.is(".userRemoved")) {
                //_this.stateTaxa[taxon.taxon.kbValue].displayImages = false;
                tbv.d.oTaxa[taxon.taxon.kbValue].visState[visName].displayImages = false;
            }
        });
    }

    function addTaxonImages (vis3ImageDiv) {

        //console.trace();

        var taxonName = vis3ImageDiv.attr("taxon");
        var taxon = tbv.d.oTaxa[taxonName];

        var taxonImgDiv = $('<div>');

        tbv.f.addTaxonImagesToContainer({
            taxon: taxonName,
            container: taxonImgDiv,
            indexSelected: tbv.d.oTaxa[taxonName].visState[visName].indexSelected,
            imageRemovalButton: true,
            height: _this.vis3ColWidth,
            fImageSelect: function (index) {
                tbv.d.oTaxa[taxonName].visState[visName].indexSelected = index;
            }
        });

        //_this.stateTaxa[taxonName].imgDiv = taxonImgDiv;
        tbv.d.oTaxa[taxonName].visState[visName].imgDiv = taxonImgDiv;

        vis3ImageDiv.closest(".pq-td-div").css("padding", 0);
        vis3ImageDiv.closest("td").css("background-color", "lightgrey");

        vis3ImageDiv.append(taxonImgDiv);

        var loadImgIcon = vis3ImageDiv.find(".loadImgIcon");
        loadImgIcon.fadeOut(0);
        addRemoveHandler(vis3ImageDiv, taxonImgDiv, loadImgIcon, taxon);

        //_this.stateTaxa[taxonName].displayImages = true;
        tbv.d.oTaxa[taxonName].visState[visName].displayImages = true;

        return taxonImgDiv;
    }

    function matchingScore(taxon0, taxonI, oCharacter) {

        //This function is referenced in initialise and refresh (for different purposes)
        //and is therefore absracted to top level of the module. (It's used both for
        //colouring cells and ranking taxa.)

        var character = oCharacter.Character;
        var charScore = null;

        if (oCharacter.Status == "key") {

            if (taxonI[character].kbValue == "n/a" || taxonI[character].kbValue == "novalue" || taxonI[character].kbValue == "") {

                if (taxon0[character].kbValue == "n/a" || taxon0[character].kbValue == "novalue" || taxon0[character].kbValue == "") {
                    //No score.
                } else {
                    //Any taxonI character without a value where one is specified for Taxon0 is non-matching.
                    charScore = -1;
                }
            } else if (taxon0[character].kbValue == "n/a" || taxon0[character].kbValue == "novalue" || taxon0[character].kbValue == "") {

                //Any taxonI character with a value where none specified for Taxon0 is non-matching.
                charScore = -1;

            } else if (oCharacter.ValueType == "numeric") {

                //Takes the min and max of the range for TaxonI, compares each to Taxon0 and takes
                //average of the two overall scores.
                var wholeRange = oCharacter.maxVal - oCharacter.minVal;
                var scoreMin = tbv.f.score.numberVsRange(taxonI[character].getRange().min, taxon0[character].getRange(), oCharacter.Latitude);
                var scoreMax = tbv.f.score.numberVsRange(taxonI[character].getRange().max, taxon0[character].getRange(), oCharacter.Latitude);
                charScore = (scoreMin[0] - scoreMin[1] + scoreMax[0] - scoreMax[1]) / 2;

            } else if (oCharacter.ValueType == "ordinal" || oCharacter.ValueType == "ordinalcircular") {

                //Match all possible states for TaxonI against taxon0 and take the average.
                var iCount = 0, scoreTotal = 0, score;
                ["male", "female", ""].forEach(function (sex) {
                    //console.log(character, taxon0.taxon.toString(), "vs", taxonI.taxon.toString(), "sex: ", sex);
                    taxonI[character].getOrdinalRanges(sex).forEach(function (state) {
                        score = tbv.f.score.ordinal(state, taxon0[character].getOrdinalRanges(sex), oCharacter.CharacterStateValues, oCharacter.Latitude, (oCharacter.ValueType == "ordinalcircular"));
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
                    scoreTotal += tbv.f.score.jaccard(taxonI[character].getStates(sex), taxon0[character].getStates(sex));
                    iCount++;
                });
                var meanJaccard = scoreTotal / iCount;
                //Jaccard returns a value between 0 and 1 - adjust this to range between -1 and 1.
                charScore = meanJaccard * 2 - 1;
            }
        }
        return charScore;
    }

})(jQuery, this.tombiovis)