(function (exports) {

    "use strict";

    exports.numberVsRange = function(stateval, rng, kbStrictness) {
        //Numeric characters are scored thus:
        //If the specified number is within the range specified for the taxon, the character scores 1.
        //Otherwise the score depends on how far outside the range it is, expressed as a proportion
        //of the mid point of the range and adjusted by a strictness value.
        //Take the smaller of the differences between the specified number and the 
        //upper and lower limits of the range (diff).
        //Calculate the ratio of the value diff to the mid-point of the specified range (prop).
        //If prop is 1 or more, the character scores 0.
        //Otherwise the character scores (1 - prop) * strictness.

        //The strictness value indicates how important it is to be within the specified range.
        //It is expressed in the kb as a number between 1 and 10.
        //A strictness value of 1 gives maximum latitude, 10 maximum strictness (least latitude).
        //It is converted thus for use as a factor in the calculations: (1 - strictness / 10).

        //Only scores with values are passed in, so no need to deal with missing values

        var scorefor;
        var strictness = (1 - kbStrictness / 10);
        if (stateval >= rng.min && stateval <= rng.max) {
            scorefor = 1;
        } else {
            var diff = Math.min(Math.abs(stateval - rng.min), Math.abs(stateval - rng.max));
            var prop = diff / rng.mid;
            if (prop >= 1) {
                scorefor = 0;
            } else {
                scorefor = strictness * (1 - prop);
            }
        }
        //Score against is simply 1 minus the score for
        var scoreagainst = 1 - scorefor;
        //var scoreagainst = 0;

        //Return array with both values
        return [scorefor, scoreagainst];
    }

    exports.ordinal = function(selState, kbTaxonStates, posStates, kbStrictness) {

        //selState is the state we're assessing for a match.
        //kbTaxonStates are the states recorded in the KB for the taxon (already adjusted for sex).
        //posStates are the ordinal states that can be taken on by this character.
        //kbStrictness is the strictness for this character in the KB.

        //The ordinal score of a selected value against a value in the knowledge base is:
        //  1 - (d / (n-1))
        //Where d is the difference in ranks between the two values and n is the number
        //values in the ordinal series.

        //For an ordinal value, only one value should be selected by the user (single selects0
        //but more than one could be specified in the kb to express a range. So the selected
        //value should be scored against each in the KB and the best score returned.

        //The strictness value indicates how important it is to match the ordinal value.
        //It is expressed in the kb as a number between 1 and 10.
        //A strictness value of 1 gives maximum latitude, 10 maximum strictness (least latitude).
        //It is converted thus for use as a factor in the calculations: (1 - strictness / 10).

        //Deal first with missing KB values
        if (kbTaxonStates.length == 0) {
            return [0, 0];
        }

        //Work out scores for taxa with specified states
        var scorefor = 0, scoreagainst;

        kbTaxonStates.forEach(function (kbTaxonState) {

            var thisScore, selStateRank, kbStateRank;

            for (var i = 0; i < posStates.length; i++) {
                if (selState == posStates[i])
                    selStateRank = i;

                if (kbTaxonState == posStates[i])
                    kbStateRank = i;
            }
            //1 - (d / (n - 1))
            thisScore = 1 - (Math.abs(selStateRank - kbStateRank) / (posStates.length - 1));

            if (thisScore > scorefor)
                scorefor = thisScore;
        });
        //Adjust for strictness
        var strictness = (1 - kbStrictness / 10);
        if (scorefor < 1) {
            scorefor = strictness * scorefor;
        }
        scoreagainst = 1 - scorefor;
        //scoreagainst = 0;

        //console.log(selState, kbTaxonStates, posStates, kbStrictness);
        //console.log(scorefor, scoreagainst);

        return [scorefor, scoreagainst];
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
        var scorefor = 0, scoreagainst = 0;
        selectedStates.forEach(function (selState) {
            var match = false;
            kbTaxonStates.forEach(function (kbState) {
                if (selState == kbState) {
                    scorefor = 1;
                    match = true;
                }
            });
            if (!match) scoreagainst = 1;
        });
        return [scorefor, scoreagainst];
        //return [scorefor, 0];
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