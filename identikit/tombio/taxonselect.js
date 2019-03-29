(function ($, tbv) {
    "use strict";

    /*
     * Normally tools that use a taxon select user interface will required
     * a separate copy of this control - i.e. they won't share a single
     * input control (in contrast to many multi-access keys which 
     * often share a user-interface).
     * */

    //##Interface##
    tbv.gui.taxonSelect = {
        //##Interface##
        //Variables that are part of the required interface...
        hiddenControlsShown: false, 
        taxonSort: null,
        width: 225, 
        //Other variables for layout...
        //Implementation constants delegated to the taxonSelect object
        filterMessage: "Filter names (use # for 'starts with')",
        filterSelectedOnly: "Show only selected taxa",
        gap: 6,
        textHeightOffset: 4,
        taxonHeight: 30,
        taxonWidth: 200
    };

    //##Interface##
    tbv.gui.taxonSelect.init = function ($parent, multi, callback) {

        // $parent - the jQuery HTML element where the taxon select HTML is inserted.
        // multi - boolean that indicates whether or not this is to act as a multi (or single) select control.
        // callback - a function of the host to be invoked whenever the user interacts with the control.

        var _this = this;

        //Assign object-level variables from passed in arguments
        this.isMultiSelect = multi;
        this.hostCallback = callback;

        //Object level variables that change (store state) must be set at the
        //level of the calling object ([this] context). Those that need initialisation
        //are set here. Others are created on the fly.
        this.filterText = "";
        this.selectedTaxa = [];

        //Create the taxon array (from tbv.d.taxa) that this control
        //will work with.
        this.taxa = [];
        tbv.d.taxa.forEach(function (t, i) {
            this.taxa.push({
                name: t.taxon.kbValue,
                abbrv: "",
                order: i
            })
        }, this)

        //Create the main control div
        var $mainDiv = $('<div class="taxonSelect" />').css("width", this.taxonWidth).appendTo($parent);
        var D3mainDiv = d3.select($mainDiv[0]);

        //##Interface##
        //Set the property which identifies the top-level div for this input
        this.$div = $mainDiv;

        //Filter textbox
        var $textFilter = $('<input type="text"/>').addClass("ui-widget ui-widget-content ui-corner-all");
        $textFilter.css("color", "silver").css("padding-left", 5).css("width", this.taxonWidth - 5).css("height", this.taxonHeight);
        $textFilter.val(this.filterMessage);
        $mainDiv.append($textFilter);
        $('<br>').appendTo($mainDiv);

        $textFilter.on('keyup', function () {
            _this.setFilter(this.value);
        });

        //Hide filter message when textbox gets focus (and change text colour to black)
        $textFilter.on('focus', function () {
            if (this.value == _this.filterMessage || this.value == _this.filterSelectedOnly) {
                _this.setFilter("");
                _this.checkFilterColour();
            }
        });

        //Show filter message when textbox loses focus and no filter specified (and change text colour to silver)
        $textFilter.on('blur', function () {
            _this.checkEmptyFilter();
            _this.checkFilterColour();
        });

        //Hidden controls
        var $hiddenControlsDiv = $('<div>').css("margin-top", 5).css("display", "none").appendTo($mainDiv);
        var $controlsArrow = $('<img>')
            .attr("src", tbv.opts.tombiopath + "resources/chevron-down.png")
            .attr("class", "taxonSelectHiddenControlsArrow")
            .appendTo($mainDiv);

        //Hiding and showing hidden controls
        $controlsArrow.on("click", function () {
            _this.toggleHiddenControls();
        })

        //Sort radio buttons
        var $sortDiv = $('<div>').appendTo($hiddenControlsDiv);
        $("<label>").attr("for", "radio-x").text("none").appendTo($sortDiv);
        $("<input>").attr("type", "radio").attr("name", "radioSort").attr("id", "radio-x").attr("checked", "true").appendTo($sortDiv);
        $("<label>").attr("for", "radio-a").text("a-z").appendTo($sortDiv);
        $("<input>").attr("type", "radio").attr("name", "radioSort").attr("id", "radio-a").appendTo($sortDiv);
        $("<label>").attr("for", "radio-z").text("z-a").appendTo($sortDiv);
        $("<input>").attr("type", "radio").attr("name", "radioSort").attr("id", "radio-z").appendTo($sortDiv);
        $sortDiv.find("input").checkboxradio();

        $('[name=radioSort]').on('change', function (e) {
            _this.taxonSort = $("[name='radioSort']").filter(":checked").attr("id");
            _this.sortTaxa();
            _this.updateTaxa();
        });

        //Add a button to clear filter
        $('<button>').text("Clear filter")
            .css("margin-top", 5).css("width", "100%")
            .appendTo($hiddenControlsDiv)
            .button()
            .on("click", function () {
                _this.setFilter("");
                _this.checkEmptyFilter();
                _this.checkFilterColour();
            })
        $('<button>').text("Clear selection")
           .css("margin-top", 5).css("width", "100%")
           .appendTo($hiddenControlsDiv)
           .button()
           .on("click", function () {
               var deselectedTaxon = _this.selectedTaxon;
               _this.deselectAllTaxa();
               //Invoke callback function
               var ret = {
                   selected: _this.selectedTaxon,
                   deselected: deselectedTaxon,
                   taxa: _this.selectedTaxa
               }
               if (_this.hostCallback) {
                   _this.hostCallback(ret)
               }
           })
        $('<button>').text("Show only selected taxa")
           .css("margin-top", 5).css("width", "100%")
           .appendTo($hiddenControlsDiv)
           .button()
           .on("click", function () {
               _this.setFilter(_this.filterSelectedOnly);
               _this.checkFilterColour();
           })

        //taxon SVG
        this.D3svg = D3mainDiv.append("svg");
        this.D3svg.attr('width', this.taxonWidth);

        //The following code tests the text for the name of each taxon to ensure
        //that it will fit within the taxon rectangle and, if it doesn't, then
        //it creates an abbreviation for it. 
        var D3svgTmp = d3.select("body").append("svg");

        this.taxa.forEach(function (t) {

            var charRemove = 0;
            var tmpName = t.name;
            var nameWidth;
            do {
                if (charRemove > 0) {
                    tmpName = t.name.substr(0, t.name.length - charRemove) + "..."
                }
                var D3txt = D3svgTmp.append("text")
                    .attr("class", "taxonSelectScientificnames")
                    .style("opacity", 0)
                    .text(tmpName);
                var nameWidth = D3txt.node().getBBox().width;
                charRemove++;
            }
            while (nameWidth > this.taxonWidth - 10);

            if (tmpName != t.name) {
                t.abbrv = tmpName;
            }
        }, this);
        D3svgTmp.remove();

        //Initialise taxa
        this.updateTaxa();

        //Store references to some of the controls
        this.$textFilter = $textFilter;
        this.$hiddenControlsDiv = $hiddenControlsDiv;
        this.$controlsArrow = $controlsArrow;
    }

    //##Interface##
    tbv.gui.taxonSelect.setFilter = function (filter) { 
        this.filterText = filter;
        this.$textFilter.val(filter);
        this.checkFilterColour();
        this.updateTaxa();
    }

    //##Interface##
    tbv.gui.taxonSelect.getFilter = function () {
        if (this.filterText != this.filterMessage) {
            return this.filterText;
        } else {
            return null;
        } 
    }

    //##Interface##
    tbv.gui.taxonSelect.setSort = function (sort) {

        if (sort == "a-z") {
            sort = "radio-a"
            $("#radio-a").attr("checked", "true")
            $('[name=radioSort]').checkboxradio("refresh");
        }
        if (sort == "z-a") {
            sort = "radio-z"
            $("#radio-z").attr("checked", "true")
            $('[name=radioSort]').checkboxradio("refresh");
        }
        if (sort == "none") {
            sort = "radio-x"
            $("#radio-x").attr("checked", "true")
            $('[name=radioSort]').checkboxradio("refresh");
        }
        this.taxonSort = sort;
        this.sortTaxa();
        this.updateTaxa();
    }

    //##Interface##
    tbv.gui.taxonSelect.toggleHiddenControls = function () {
        if (this.$hiddenControlsDiv.css("display") == "none") {
            this.$hiddenControlsDiv.slideDown(400);
            this.$controlsArrow.attr("src", tbv.opts.tombiopath + "resources/chevron-up.png")
            this.hiddenControlsShown = true;
        } else {
            this.$hiddenControlsDiv.slideUp(400);
            this.$controlsArrow.attr("src", tbv.opts.tombiopath + "resources/chevron-down.png")
            this.hiddenControlsShown = false;
        }
    }

    //##Interface##
    tbv.gui.taxonSelect.taxonClick = function (taxon) {

        var deselectedTaxon;

        //Get the rectangle and text objects corresponding to the clicked taxon
        var D3rect = this.D3svg.select("rect[taxonName=\"" + taxon + "\"]");
        var D3text = this.D3svg.select("text[taxonName=\"" + taxon + "\"]");

        //If taxon not found, warn and exit
        if (D3rect.size() == 0) {
            console.log("Couldn't find the taxon:", taxon)
            return
        }

        //Set a flag indicating whether or not the taxon is currently selected
        var currentlySelected = D3rect.classed("taxonSelectTaxarectSelected")

        //Change the display style of the taxon
        D3rect.classed("taxonSelectTaxarectDeselected", currentlySelected)
            .classed("taxonSelectTaxarectSelected", !currentlySelected);
        D3text.classed("taxonSelectScientificnamesDeselected", currentlySelected)
            .classed("taxonSelectScientificnamesSelected", !currentlySelected);

        //if the control is working in single select mode and another is currently selected,
        //then deselect it.
        if (!this.isMultiSelect && this.selectedTaxon && this.selectedTaxon != taxon) {
            //Change the style (
            var D3rectPrevious = this.D3svg.select("rect[taxonName=\"" + this.selectedTaxon + "\"]");
            var D3textPrevious = this.D3svg.select("text[taxonName=\"" + this.selectedTaxon + "\"]");

            //Change style to deselected
            D3rectPrevious.classed("taxonSelectTaxarectDeselected", true)
                .classed("taxonSelectTaxarectSelected", false);
            D3textPrevious.classed("taxonSelectScientificnamesDeselected", true)
                .classed("taxonSelectScientificnamesSelected", false);

            //Record the fact that this has been deselected (to pass to client)
            deselectedTaxon = this.selectedTaxon;
        }

        //Record the fact that the currently clicked taxon has been either
        //selected or deselected.
        if (currentlySelected) {
            this.selectedTaxon = null;
            deselectedTaxon = taxon;
        } else {
            this.selectedTaxon = taxon;
        }

        //Update the selectedTaxa array
        if (deselectedTaxon) {
            var i = this.selectedTaxa.indexOf(deselectedTaxon)
            if (i != -1) {
                this.selectedTaxa.splice(i, 1);
            }
        }
        if (this.selectedTaxon) {
            this.selectedTaxa.push(this.selectedTaxon)
        }

        //Set return object
        var ret = {
            selected: this.selectedTaxon,
            deselected: deselectedTaxon,
            taxa: this.selectedTaxa
        }

        //Call callback function
        if (this.hostCallback) {
            this.hostCallback(ret)
        }
    }

    //##Interface##
    tbv.gui.taxonSelect.deselectAllTaxa = function () {

        //Get the rectangle and text objects corresponding to the deselected taxon
        var D3rect = this.D3svg.selectAll("rect");
        var D3text = this.D3svg.selectAll("text");

        //Change the display style of the taxon
        D3rect.classed("taxonSelectTaxarectDeselected", true)
            .classed("taxonSelectTaxarectSelected", false);
        D3text.classed("taxonSelectScientificnamesDeselected", true)
            .classed("taxonSelectScientificnamesSelected", false);

        this.selectedTaxon = null;
        this.selectedTaxa = [];
        this.updateTaxa(); //To reapply filter to deselected items
    }

    //##Interface##
    tbv.gui.taxonSelect.deselectTaxon = function (taxon) {

        //Get the rectangle and text objects corresponding to the deselected taxon
        var D3rect = this.D3svg.select("rect[taxonName=\"" + taxon + "\"]");
        var D3text = this.D3svg.select("text[taxonName=\"" + taxon + "\"]");

        //Change the display style of the taxon
        D3rect.classed("taxonSelectTaxarectDeselected", true)
            .classed("taxonSelectTaxarectSelected", false);
        D3text.classed("taxonSelectScientificnamesDeselected", true)
            .classed("taxonSelectScientificnamesSelected", false);

        //If the deselected taxon was the last one selected, then set the
        //selectedTaxon object variable to null.
        if (this.selectedTaxon = taxon) {
            this.selectedTaxon = null;
        }

        //Update the selected taxa array
        var i = this.selectedTaxa.indexOf(taxon)
        if (i != -1) {
            this.selectedTaxa.splice(i, 1);
        }
    }

    //##Interface##
    tbv.gui.taxonSelect.setParamsFromState = function (params) {

        //Filter
        var filter = this.getFilter();
        if (filter) {
            if (filter.startsWith("#")) {
                var filter = "-" + filter.substr(1);
            }
            params.push("filter=" + filter);
        }

        //Sort
        if (this.taxonSort) {
            var sortType;
            if (this.taxonSort == "radio-a") {
                var sortType = "a-z";
            } else if (this.taxonSort == "radio-z") {
                var sortType = "z-a";
            }
            if (sortType) {
                params.push("sort=" + sortType);
            }
        }

        //Hiden controls
        if (this.hiddenControlsShown) {
            params.push("hc=show");
        }

        return params
    }

    //##Interface##
    tbv.gui.taxonSelect.initStateFromParams = function (params) {

        //Set the visibility of hidden controls
        if (params.hc) {
            this.toggleHiddenControls();
        }

        //Set the sort
        if (params.sort) {
            this.setSort(params.sort);
        }

        //Set the filter (after taxon selected)
        if (params.filter) {
            if (params.filter.startsWith("-")) {
                var filter = "#" + params.filter.substr(1);
            } else {
                var filter = params.filter;
            }
            this.setFilter(filter);
        }
    }

    //Implementation dependent elements below...

    tbv.gui.taxonSelect.sortTaxa = function () {

        var _this = this;

        this.taxa.sort(function (a, b) {

            if (_this.taxonSort == "radio-a") {
                var nameA = a.name.toUpperCase(); // ignore upper and lowercase
                var nameB = b.name.toUpperCase(); // ignore upper and lowercase
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;

            } else if (_this.taxonSort == "radio-z") {
                var nameA = a.name.toUpperCase(); // ignore upper and lowercase
                var nameB = b.name.toUpperCase(); // ignore upper and lowercase
                if (nameA < nameB) {
                    return 1;
                }
                if (nameA > nameB) {
                    return -1;
                }
                return 0;
            } else {
                return a.order - b.order;
            }
        })
    }

    tbv.gui.taxonSelect.updateTaxa = function () {

        var _this = this;

        var tranTime = 300;

        //D3 selection
        var D3u = this.D3svg.selectAll("g")
            .data(this.taxa.filter(function (d) {
                //Matches if no filter specified, or just '#' or text is filter message
                if (this.filterText == "" || this.filterText.toLowerCase() == this.filterMessage.toLowerCase() || this.filterText == "#") {
                    return true;
                }
                //Matches if filter starts with '#' and rest of filter text matches start of taxon name
                if (this.filterText.startsWith("#")) {
                    if (d.name.toLowerCase().startsWith(this.filterText.toLowerCase().substr(1))) {
                        return true;
                    }
                }
                //Matches if filter doesn't start with '#' and filter occurs somewhere in taxon name
                if (d.name.toLowerCase().indexOf(this.filterText.toLowerCase()) !== -1) {
                    return true;
                }
                //Matches if name is in the selected taxon set
                for (var i = 0; i < this.selectedTaxa.length; i++) {
                    if (this.selectedTaxa[i] == d.name) {
                        return true;
                    }
                }
                return false;
            }, this), function (d) { return d.name; })
        var D3e = D3u.enter();
        var D3eG = D3e.append("g");
        var D3m = D3eG.merge(D3u);
        var D3x = D3u.exit();

        D3eG.append("rect")
            .style("opacity", 0)
            .attr("x", 0)
            .attr("width", this.taxonWidth)
            .attr("height", this.taxonHeight)
            .classed("taxonSelectTaxarect", true)
            .classed("taxonSelectTaxarectDeselected", true)
            .attr("taxonName", function (d) {
                return d.name
            })
            .on("click", function (d) {
                _this.taxonClick(d.name);
            })

        D3eG.append("text")
            //Create taxon texts
            .style("opacity", 0)
            .attr("x", 5)
            .classed("taxonSelectScientificnames", true)
            .classed("taxonSelectScientificnamesDeselected", true)
            .classed("abbrvName", function (d) {
                if (d.abbrv) {
                    return true;
                } else {
                    return false;
                }
            })
            .attr("taxonName", function (d) {
                return d.name
            })
            .text(function (d) {
                if (d.abbrv) {
                    return d.abbrv;
                } else {
                    return d.name;
                }
            })
            .attr("title", function (d) {
                if (d.abbrv) {
                    return d.name;
                } else {
                    return "";
                }
            })
            .on("click", function (d) {
                _this.taxonClick(d.name);
            })

        D3m.select(".taxonSelectTaxarect")
            .transition()
            .duration(tranTime)
            .delay(function () {
                return D3x.empty() ? 0 : tranTime;
            })
            .attr("y", function (d, i) {
                return i * (_this.taxonHeight + _this.gap) + _this.gap;
            })
            .transition()
            .style("opacity", 1)

        D3m.select(".taxonSelectScientificnames")
            .transition()
            .duration(tranTime)
            .delay(function () {
                return D3x.empty() ? 0 : tranTime;
            })
            .attr("y", function (d, i) {
                return (i * (_this.taxonHeight + _this.gap)) + _this.taxonHeight / 2 + _this.textHeightOffset + _this.gap;
            })
            .transition()
            .style("opacity", 1)

        D3x.transition()
            .duration(tranTime)
            .style("opacity", 0)
            .remove();

        //Tooltips
        $(".abbrvName").tooltip({
            classes: {
                "ui-tooltip": "ui-corner-all ui-widget-shadow"
            },
            track: true,
            position: { my: "left+20 center", at: "right center" },
            open: function (event, ui) {
                setTimeout(function () {
                    $(ui.tooltip).hide({ effect: "fade", duration: 500 });
                }, 3000);
            },
            content: function () {
                return $(this).attr("title");
            }
        });

        //Resize SVG
        var svgHeight = D3m._groups[0].length * (this.taxonHeight + this.gap)
        this.D3svg.transition()
            .delay(function () {
                return D3x.empty() ? 0 : tranTime;
            })
            .attr('height', svgHeight)
            .on("end", function () {
                tbv.gui.main.resizeControlsAndTaxa();
            })
    }

    tbv.gui.taxonSelect.checkEmptyFilter = function () {
        if (this.filterText == "") {
            this.filterText = this.filterMessage;
            this.$textFilter.val(this.filterMessage);
        }
    }

    tbv.gui.taxonSelect.checkFilterColour = function () {
        if (this.filterText == this.filterMessage || this.filterText == this.filterSelectedOnly) {
            this.$textFilter.css("color", "silver");
        } else {
            this.$textFilter.css("color", "black");
        }
    }

})(jQuery, this.tombiovis)