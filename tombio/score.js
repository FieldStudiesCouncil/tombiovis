(function (exports) {

    "use strict";

    exports.numberVsRange = function (stateval, rng, wholeRange, kbStrictness) {
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

    exports.ordinal = function(selState, kbTaxonStates, posStates, kbStrictness) {

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
        var rng = {min: null, max: null}
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
        return exports.numberVsRange(stateval, rng, posStates.length -1, kbStrictness)
    }

    exports.character = function (selectedStates, kbTaxonStates) {

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

    exports.jaccard = function(setA, setB) {

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

})(this.tombioScore = {})