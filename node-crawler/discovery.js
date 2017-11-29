/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

'use-strict';

const request = require('request');
const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
const remark = require('remark');
const strip = require('strip-markdown');
const stringFunctions = require('./stringfunctions');
const util = require('./util');

var log = console.log;

var username = process.env.DISCOVERY_USERNAME;
var password = process.env.DISCOVERY_PASSWORD;
var apiVersionDate = '2017-09-01';

var watsonDiscovery = new DiscoveryV1({
    username: username,
    password: password,
    version_date: apiVersionDate
});

var deleteAllDocuments = (environmentID, collectionID) => {
    var options = {
        method: 'GET',
        url: 'https://gateway.watsonplatform.net/discovery/api/v1/environments/' + environmentID + '/collections/' + collectionID + '/query',
        qs: {
            version: apiVersionDate,
            count: 10000,
            //offset: '',
            //aggregation: '',
            //filter: '',
            passages: 'true',
            highlight: 'true',
            return: 'metadata',
            natural_language_query: ''
        },
        headers: {
            authorization: 'Basic ' + new Buffer(username + ':' + password).toString('base64'),
            'content-type': 'application/json'
        }
    };
    
    request(options, function(error, response, body) {
        if (error) {
            throw new Error(error);
        }
        body = JSON.parse(body);
        body.results.forEach((item, index, array) => {
            watsonDiscovery.deleteDocument({
                environment_id: environmentID,
                collection_id: collectionID,
                document_id: item.id
            }, function(err, data) {
                if(err) {
                    log('error deleting document ' + item.id + '\n' + data);
                } else {
                    log('deleting document ' + item.id);
                }
            });
        });
    });
};

// TODO - create one large JSON object with multiple adds, so a lot of documents
// can be pushed at once
var pushSingleDocument = (url, anchorValue, bodyPortionObject, environmentID, collectionID, repoOwner, repoName) => {
    //log(markdown.toHTML(body));

    log('bodyPortionObject.content length: ' + bodyPortionObject.content.length);
    
    remark()
        .use(strip)
        .process(bodyPortionObject.content, function (err, fb) {
            log('process');
            if (err) throw err;
            //log(String(fb));
            log('pushing');
            var urlPieces = url.split('githubusercontent.com/');
            urlPieces = urlPieces[1].split('/');
            log('urlpieces: ' + urlPieces);
            var docId = urlPieces.join('-');
            if (stringFunctions.containsString(url, 'IBM-Bluemix-Docs')) {
                docId = docId.split('.').join('_') + '_' + anchorValue + '_' + bodyPortionObject.index;
            } else {
                docId = docId.split('.').join('_');
            }
            log('id: ' + docId);

            let urlAnchor = '';
            if (stringFunctions.containsString(url, 'IBM-Bluemix-Docs')) {
                if (anchorValue.length > 0) {
                    urlAnchor = '#' + anchorValue;
                }
            }
            //log(bodyPortionObject.content);
            log('url: ' + util.transformToUserURL(url) + urlAnchor);
            log('pushing to discovery');
            watsonDiscovery.updateDocument(
                {
                    environment_id: environmentID,
                    collection_id: collectionID,
                    document_id: docId,
                    file: {
                        value: String(fb), //markdown.toHTML(String(fb)),
                        options: {
                            filename: url,
                            sourceUrl: util.transformToUserURL(url) + urlAnchor,
                            contentType: 'text/html'
                        }
                    },
                    metadata: {
                        originalUrl: url,
                        srcUrl: util.transformToUserURL(url) + urlAnchor,
                        repositoryAccount: repoOwner,
                        repositoryName: repoName,
                        uploadDate:  util.getDate() // year-month-day
                    }
                },
                function(error, data) {
                    if (error) {
                        log('error pushing to discovery: ' + error);
                    }
                    log(data);
                });
        });

    //log(markdown.toHTML(body));
};

module.exports = {
    deleteAllDocuments: deleteAllDocuments,
    pushSingleDocument: pushSingleDocument
};