'use-strict';

var log = console.log;

var containsString = function(fullString, substring) {
    if (fullString.indexOf(substring) > -1) {
        return true;
    }
    return false;
};

var moveToIndexWithSpace = function(index, inputString) {
    while (inputString.charAt(index) != ' ') {
        if (index < 0) {
            return -1;
        }
        index--;
    }
    return index;
};

var moveForwardToNextParagraph = function(index, inputString) {
    var indexOrig = index;
    //while (inputString.charAt(index) != '\n') {
    while (true) {
        if (index >= inputString.length-1) {
            return indexOrig;
        }
        if (inputString.charAt(index) == ' ' && inputString.charAt(index-1) == '\n') {
            break;
        }
        index++;
    }
    return index;
};

function removeTagSection(openingTag, endingTag, inputString) {    
    while (true) {
        var leftIndex = inputString.indexOf(openingTag);
        var rightIndex = inputString.indexOf(endingTag, leftIndex);
        if ((leftIndex == -1) || (rightIndex == -1) || (leftIndex > rightIndex)) {
            log('breaking');
            break;
        }
        var secondHalf = inputString.substring(rightIndex + endingTag.length, inputString.length);
        inputString = inputString.substring(0,leftIndex) + secondHalf;
    }    
    return inputString;
}

var splitString = function(inputString) {
    var substringLength = 39000;
    var retList = [];
    var startIndex = 0;
    var endIndex = startIndex + substringLength;
    if (inputString.length <= substringLength) {
        retList.push(inputString);
        return retList;
    }
    while(startIndex < inputString.length) {
        var prevIndexWithSpace = moveToIndexWithSpace(endIndex, inputString);
        if (prevIndexWithSpace > startIndex) {
            endIndex = prevIndexWithSpace;
        }
        var s = '';
        if(endIndex <= inputString.length) {
            s = inputString.substring(startIndex, endIndex);
            if (s.length > 0) {
                retList.push(s);
            }
        } else {
            s = inputString.substring(startIndex, inputString.length);
            if (s.length > 0) {
                retList.push(s);
            }
        }
        startIndex = endIndex;
        endIndex += substringLength;
    }
    return retList;
};

var splitStringToPassages = function(inputString) {
    var passageLength = 2000;
    var retList = [];
    //var splitIndices = [];
    var startIndex = 0;
    for (var i = passageLength; i < inputString.length; i += passageLength) {
        i = moveForwardToNextParagraph(i, inputString);//moveToIndexWithSpace(i, inputString);
        //i += 100;
        var s = '';
        s = inputString.substring(startIndex, i);
        retList.push(s);
        if (i + passageLength > inputString.length) {
            s = inputString.substring(i, inputString.length);
            retList.push(s);
            break;
        }
        startIndex = i;
    }
    return retList;
};

module.exports = {
    containsString: containsString,
    removeTagSection: removeTagSection,
    splitString: splitString,
    splitStringToPassages: splitStringToPassages
};