(function ($, tbv) {

    "use strict";

    tbv.score = {};

    tbv.score.numberVsRange = function (stateval, rng, wholeRange, kbStrictness) {
        //Numeric characters are scored thus:
        //If the specified number is within the range specified for the taxon, the character scores 1.
        //Otherwise the score depends on how far outside the range it is. The maximum distance
        //outside the range at which a specified value can score is here called 'latitude'.
        //If outside the latitude, the specified value scores 0.
        //The latitude is equal to the whole range of the character across all taxa, 
        //reduced by an amount proportional to the strictness value. For maximum strictness value (10)
        //latitude is zero. For minimum strictness value (0) latitude is equal to the whole range.
        //The score of a specified number is equal to its distance outside the range, divided by its
        //latitude.

        //Only scores with values are passed in, so no need to deal with missing values.

        //console.log(stateval, rng, wholeRange, kbStrictness);

        var scorefor;
        var latitude = (1 - kbStrictness / 10) * wholeRange;
        if (stateval >= rng.min && stateval <= rng.max) {
            scorefor = 1;
        } else if (stateval < rng.min - latitude) {
            scorefor = 0;
        } else if (stateval < rng.min) {
            scorefor = 1 - ((rng.min - stateval) / latitude);
        } else if (stateval > rng.max + latitude) {
            scorefor = 0;
        } else { //stateval> rng.max
            scorefor = 1 - ((stateval - rng.max) / latitude);
        }
        //Score against is simply 1 minus the score for
        var scoreagainst = 1 - scorefor;

        //Return array with both values
        return [scorefor, scoreagainst];
    }

    tbv.score.ordinal = function (selState, kbTaxonStates, posStates, kbStrictness) {

        //selState is the state we're assessing for a match.
        //kbTaxonStates are the states recorded in the KB for the taxon (already adjusted for sex).
        //posStates are the ordinal states that can be taken on by this character.
        //kbStrictness is the strictness for this character in the KB.

        //For an ordinal value, only one value should be selected by the user (single selects)
        //but more than one could be specified in the kb to express a range. 

        //This function changes all the ordinal states into scores and then simply refers
        //the resulting numbers to the numberVsRange function.

        //Deal first with missing KB values
        if (kbTaxonStates.length == 0) {
            return [0, 0];
        }

        var stateval;
        var rng = { min: null, max: null }
        posStates.forEach(function (state, rank) {
            if (state == selState) {
                stateval = rank;
            }
            kbTaxonStates.forEach(function (taxState) {
                if (!rng.min && taxState == state) {
                    rng.min = rank;
                }
                if (taxState == state) {
                    rng.max = rank;
                }
            })
        })
        return tbv.score.numberVsRange(stateval, rng, posStates.length - 1, kbStrictness)
    }

    tbv.score.ordinal2 = function (selectedStates, kbTaxonStates, posStates, kbStrictness, isCircular) {

        //console.log("selectedStates", selectedStates)
        //console.log("kbTaxonStates", kbTaxonStates)
        //console.log("posStates", posStates)
        //console.log("kbStrictness", kbStrictness)
        //console.log("isCircular", isCircular)

        //selectedStates is an array of states we're assessing for a match. Can be more than one for multiple selection controls.
        //kbTaxonStates are the states recorded in the KB for the taxon (already adjusted for sex) - note
        //that any of these states could be expressed as ordinal ranges so this parameter is an array of
        //arrays. Within the outer array, single ordinals are an array of size one. In this routine, all the arrays within
        //the outer array will simply be merged into a single array and all treated as alternatives.
        //posStates are the ordinal states that can be taken on by this character.
        //kbStrictness is the strictness for this character in the KB.

        //This function changes all the ordinal states into scores and then simply refers
        //the resulting numbers to the numberVsRange function.

        //Deal first with missing KB values
        if (kbTaxonStates.length == 0) {
            return [0, 0];
        }

        //Merge the kbTaxonStates arrays.
        var kbAllTaxonStates = [];
        kbTaxonStates.forEach(function (a) {
            kbAllTaxonStates = kbAllTaxonStates.concat(a);
        });

        //Return the best score
        var ret;
        selectedStates.forEach(function (selState) {
            var selStateRank;
            posStates.forEach(function (state, rank) {
                if (state == selState) selStateRank = rank;
            })

            //If the selected state was not in 
            kbAllTaxonStates.forEach(function (taxState) {
                var taxStateRank;
                posStates.forEach(function (state, rank) {
                    if (state == taxState) taxStateRank = rank;
                })
                if (taxStateRank) {
                    //taxStateRank might still be undefined if the taxState was not in the posStates array
                    // - this shouldn't happen but can if kb developer has ignored warnings.
                    var rngTaxonStateRank = { min: taxStateRank, max: taxStateRank };
                    var r = tbv.score.numberVsRange(selStateRank, rngTaxonStateRank, posStates.length - 1, kbStrictness);
                    //console.log("standard", r[0])
                    if (!ret || ret[0] < r[0]) {
                        ret = r;
                    }
                    //If it is a circular ordinal then change the value of taxStateRank by either subtracting or adding
                    //the number of all values - whichever brings the value of taxStateRank and selStateRank closer
                    //together - and score for those values. If the score is better than the unmodified taxStateRank then
                    //use it instead.
                    if (isCircular) {
                        if (selStateRank > taxStateRank) {
                            taxStateRank = taxStateRank + posStates.length;
                        } else {
                            taxStateRank = taxStateRank - posStates.length;
                        }
                        var rngTaxonStateRankC = { min: taxStateRank, max: taxStateRank };
                        var rC = tbv.score.numberVsRange(selStateRank, rngTaxonStateRankC, posStates.length - 1, kbStrictness);
                        //console.log("circular", rC[0])
                        if (!ret || ret[0] < rC[0]) {
                            ret = rC;
                        }
                    }
                }
            })
        })
        //ret could be be undefined if none of the taxon states was not in the posStates array
        // - this shouldn't happen but can if kb developer has ignored warnings.
        if (ret) {
            return ret;
        } else {
            return [0, 0];
        }
    }

    tbv.score.character = function (selectedStates, kbTaxonStates) {

        //selState is the state we're assessing for a match.
        //kbTaxonStates are the states recorded in the KB for the taxon (already adjusted for sex).

        //For each state selected in control, look for a match in KB. 
        //If at least one selected state matches, the entire selection scores 1.
        //If at least one selected state does not match, the entire selection scores 1 against.

        //Deal first with missing KB values
        if (kbTaxonStates.length == 0) {
            return [0, 0];
        }

        //Work out scores for taxa with specified states
        var scorefor, scoreagainst;
        var intersect = [];
        selectedStates.forEach(function (selState) {
            kbTaxonStates.forEach(function (kbState) {
                if (selState == kbState) {
                    intersect.push(selState);
                }
            });
        });
        if (intersect.length > 0) {
            scorefor = 1;
        } else {
            scorefor = 0;
        }
        scoreagainst = 1 - scorefor;
        return [scorefor, scoreagainst];
            
    }

    tbv.score.jaccard = function (setA, setB) {

        //The Jaccard coefficient measures similarity between finite sample sets, 
        //and is defined as the size of the intersection divided by the size 
        //of the union of the sample sets. (https://en.wikipedia.org/wiki/Jaccard_index)

        var unionAB = [], intersectAB = [];
        setA.forEach(function (a) {
            setB.forEach(function (b) {
                if (a == b) {
                    intersectAB.push(a);
                }
            });
            unionAB.push(a);
        });
        setB.forEach(function (b) {
            if (unionAB.indexOf(b) == -1)
                unionAB.push(b);
        });
        return intersectAB.length / unionAB.length;
    }

})(jQuery, this.tombiovis)