'use-strict';

const remark = require('remark');
const strip = require('strip-markdown');
const fs = require('fs');

var log = console.log;
var stringFunctions = require('./stringfunctions');

var getDate = () => {
    let date = new Date();
    return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
};

var getAnchorTags = (documentBody) => {
    if (documentBody.indexOf('{: #') < 0) {
        return [];
    }
    var openIndex = -1;
    var lastIndex = -1;
    var result = '';
    var anchors = [];
    if (documentBody.indexOf('{: #') > 0) {
        openIndex = 0;
        lastIndex = documentBody.indexOf('{: #');
        if (lastIndex > -1) {
            anchors.push('');
        }
    }
    openIndex = documentBody.indexOf('{: #') + 4;
    if (openIndex > -1) {
        lastIndex = documentBody.indexOf('}', openIndex);
        if (lastIndex > -1) {
            result = documentBody.substring(openIndex, lastIndex);
            anchors.push(result);
        }
    }
    
    while (result != '') {
        result = '';
        openIndex = documentBody.indexOf('{: #', lastIndex) + 4;
        if (openIndex < lastIndex) {
            break;
        }
        lastIndex = -1;
        if (openIndex > -1) {
            lastIndex = documentBody.indexOf('}', openIndex);
            if (lastIndex > -1 && lastIndex < documentBody.length) {
                result = documentBody.substring(openIndex, lastIndex);
                anchors.push(result);
            }
        } else {
            break;
        }
    }
    return anchors;
};

var getSections = (anchors, documentBody) => {
    if(anchors.length == 0) {
        return [{anchor: '', content: documentBody}];
    }
    let sections = [];
    for (let i = 0; i < anchors.length; i++) {
        let firstIndex = (documentBody.indexOf('{: #' + anchors[i]) + anchors[i].length + 5); // 5 = length of {: #}
        if (i == 0 && anchors[0].length == 0) {
            firstIndex = 0;
        }
        if (i < anchors.length-1) {
            let length = documentBody.indexOf('{: #' + anchors[i+1]) - firstIndex;
            sections.push({anchor: anchors[i], content: documentBody.substring(firstIndex, firstIndex + length)});
        } else {
            let length = (documentBody.length) - firstIndex;
            sections.push({anchor: anchors[i], content: documentBody.substring(firstIndex, firstIndex + length)});
        }
    }
    return sections;
};

var transformToUserURL = (srcUrl) => {
    var pieces = [];
    if (stringFunctions.containsString(srcUrl, 'IBM-Bluemix-Docs')) {
        pieces = srcUrl.split('githubusercontent.com/IBM-Bluemix-Docs/');
        pieces = pieces[1].split('/');
        srcUrl = pieces.join('/');
        srcUrl = srcUrl.replace('containers/master/','containers/');
        srcUrl = srcUrl.replace('.md','');
        srcUrl = 'https://console.bluemix.net/docs/' + srcUrl + '.html';
    } else {
        pieces = srcUrl.split('githubusercontent.com/');
        pieces = pieces[1].split('/');
        if (stringFunctions.containsString(srcUrl, '.github.io')){
            pieces.shift(); // remove 1st string, which is the github org name
        }
        srcUrl = pieces.join('/');
        if (srcUrl.indexOf('.github.io') > -1){
            srcUrl = srcUrl.replace('.github.io/master/','.io/');
        } else {
            srcUrl = srcUrl.replace('/website/master/','.io/');
        }
        srcUrl = srcUrl.replace('.md','');
        srcUrl = 'https://' + srcUrl;
        if (stringFunctions.containsString(srcUrl, 'https://istio.io/')) {
            if(stringFunctions.containsString(srcUrl, '_faq')) {
                srcUrl = srcUrl.replace('_faq', 'faq');
                let sPieces = srcUrl.split('/');
                sPieces.pop();
                srcUrl = sPieces.join('/');
            } else {
                srcUrl = srcUrl.replace('_docs', 'docs');
                srcUrl = srcUrl.replace('_glossary', 'glossary');
                srcUrl = srcUrl.replace('_includes', 'includes');
                srcUrl = srcUrl.replace('_layouts', 'layouts');
                srcUrl = srcUrl.replace('_posts', 'posts');
                srcUrl = srcUrl.replace('_sass', 'sass');
            }
        }
    }  
    return srcUrl;  
};

var usernameAndPasswordSet = (username, password) => {
    var validUser = true;
    var validPassword = true;
    if (!username) {
        validUser = false;
    } else if (username.length == 0) {
        validUser = false;
    }
    if (!password) {
        validPassword = false;
    } else if (password.length == 0) {
        validPassword = false;
    }
    if (!validUser) {
        log('username is not set');
        return false;
    }
    if (!validPassword) {
        log('password is not set');
        return false;
    }
    return true;
};

var fileNum = 0;

function writeToFile(url, body) {
    var urlPieces = url.split('/');
    var fileName = urlPieces[urlPieces.length-2] + '-' + urlPieces[urlPieces.length-1];// + ".txt";
    fileName = fileName.replace('.md', '');
    fileName = fileName + '.txt';
    
    remark()
        .use(strip)
        .process(body, function (err, file) {
            if (err) throw err;
            //log(String(file));
            fs.writeFile ('data/k8sTxt3/' + fileName, file, function(err) {
                if (err) throw err;
                log('complete');
            }
            );
        });
}

function writeToHTMLFile(body) {
    fs.writeFile ('data/k8s/' + fileNum++ + '.html', body, function(err) {
        if (err) throw err;
        log('complete');
    }
    );
}

module.exports = {
    getAnchorTags: getAnchorTags,
    getSections: getSections,
    getDate: getDate,
    transformToUserURL: transformToUserURL,
    usernameAndPasswordSet: usernameAndPasswordSet,
    writeToFile: writeToFile,
    writeToHTMLFile: writeToHTMLFile
};