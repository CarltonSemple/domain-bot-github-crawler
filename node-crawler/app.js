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

const Crawler = require('js-crawler');
const request = require('request');
const util = require('./util');
const sleep = require('sleep');
const stringFunctions = require('./stringfunctions');
const discoveryFunctions = require('./discovery');
const striptags = require('striptags'); // remove html tags

var log = console.log;

var username = process.env.DISCOVERY_USERNAME;
var password = process.env.DISCOVERY_PASSWORD;
if (!util.usernameAndPasswordSet(username, password)) {
    log('environment variables DISCOVERY_USERNAME & DISCOVERY_PASSWORD need to be set');
    process.exit(1); 
}

var environmentID = process.env.DISCOVERY_ENVIRONMENT_ID;

var reposFromEnv = process.env.REPOSITORIES;

function addMarkdownDocToCollection(githubRawUrl, environmentID, collectionID, repoOwner, repoName) {
    request.get(githubRawUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            let anchors = util.getAnchorTags(body);
            let anchorSections = util.getSections(anchors, body);
            //log(JSON.stringify(anchors));
            //log(JSON.stringify(anchorSections));
            //log(githubRawUrl);
            
            for(let a = 0; a < anchorSections.length; a++) {
                //log(anchorSections[a].content);
                // strip tags with no allowed tags, replacing tags with a ' '
                let contentBody = striptags(anchorSections[a].content, [], ' ');
                //log(body);

                //log(contentBody);
                    
                log(githubRawUrl + ' downloaded');    
                contentBody = stringFunctions.removeTagSection('{%', '%}', contentBody);
                contentBody = stringFunctions.removeTagSection('{:', '}', contentBody);
                contentBody = stringFunctions.removeTagSection('{{', '}}', contentBody);
                contentBody = contentBody.trim();
                contentBody = contentBody.replace(/\n\s*\n/g, '\n');
        
                if (contentBody.length == 0) {
                    log('empty content');
                    return;
                }
        
                let bodyPortions = stringFunctions.splitString(contentBody);//ToPassages(body);
                for(let i = 0; i < bodyPortions.length; i++) {
                    sleep.sleep(3);

                    //writeToFile(githubRawUrl + "_" + i + "_", bodyPortions[i]);
                    //log('discoveryFunctions.pushSingleDoc');
                    var bodyPortionObject = {
                        content: bodyPortions[i],
                        index: i
                    };
                    discoveryFunctions.pushSingleDocument(githubRawUrl, anchorSections[a].anchor, bodyPortionObject, environmentID, collectionID, repoOwner, repoName);
                }
            }
        } else if (error) {
            log('error: ' + error);
        }
    });
}

var getTrackedRepositories = () => {
    return JSON.parse(reposFromEnv);
};

var repoInfoList = [];

var main = () => {
    repoInfoList = getTrackedRepositories();
    log('repoInfoList: ' + JSON.stringify(repoInfoList));
    for(var i = 0; i < repoInfoList.length; i++) {
        let currentIndex = i;
        var newCrawler = new Crawler().configure({
            shouldCrawl: function(url) {
                try {
                    //log('hello ' + url);
                    if ((url.indexOf('kubernetes/website') > -1) || (url.indexOf('istio/istio.github.io') > -1)) { 
                        if ((url.indexOf('tree/master') > -1) || (url.indexOf('blob/master') > -1)){ 
                            return true;
                        }
                    } else if (url.indexOf('IBM-Bluemix-Docs/containers/') > -1) { 
                        if ((url.indexOf('tree/master') > -1) || (url.indexOf('blob/master') > -1)){ 
                            if (stringFunctions.containsString(url, '/de/') ||
                                stringFunctions.containsString(url, '/es/') ||
                                stringFunctions.containsString(url, '/fr/') || 
                                stringFunctions.containsString(url, '/it/') ||
                                stringFunctions.containsString(url, '/ja/') ||
                                stringFunctions.containsString(url, '/ko/') || 
                                stringFunctions.containsString(url, '/pt/') ||
                                stringFunctions.containsString(url, '/zh/')) {
                                return false;
                            }
                            return true;
                        }
                    }
                } catch (ex) {
                    log('ex:', ex);
                }
                return false;
            },
            depth: 5,
            maxRequestsPerSecond: 1,
        });

        repoInfoList[currentIndex].crawler = newCrawler;

        repoInfoList[currentIndex].crawler.crawl({
            url: repoInfoList[currentIndex].url,
            success: function(page) {    
                if (page.url.indexOf('.md') > 0 && page.url.indexOf('/blob') > 0) {
                    var rawUrl = page.url.replace('/blob', '');
                    log(rawUrl);
                    rawUrl = rawUrl.replace('https://github.com', 'https://raw.githubusercontent.com');
                    try {
                        addMarkdownDocToCollection(rawUrl, environmentID, repoInfoList[currentIndex].collection_id, repoInfoList[currentIndex].owner, repoInfoList[currentIndex].name);
                    } catch(err) {
                        log(err);
                        log('i:' + currentIndex);
                    }
                }
                //log(page.url);
            },
            failure: function(page) {
                log('failed:' + page.status + ' url: ' + page.url);
            },
            finished: function(crawledUrls) {
                log('crawled urls: ' + crawledUrls);
            }
        }, function onAllFinished(crawledUrls) {
            log('All crawling finished');
            log(crawledUrls);
        });
        
    }
};

main();