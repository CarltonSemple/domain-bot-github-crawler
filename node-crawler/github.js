'use-strict';

var log = console.log;
const request = require('request');
var githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;

var getLatestCommit = (repoOwner, repoName) => {
    //log('getLatestCommit');
    return new Promise(function(resolve, reject) {
        //log('inside promise');
        if(!githubAccessToken) {
            log('GITHUB_ACCESS_TOKEN, a required environment variable, is empty');
            return;
        }
        //log('starting request');
        request({
            url: 'https://api.github.com/repos/' + repoOwner + '/' + repoName + '/commits/master',
            method: 'GET',
            headers: {
                'Authorization': 'token ' + githubAccessToken,
                'User-Agent': 'request'
            }
        }, function(error, response, body) {
            if (error) {
                log('github request error: ' + error);
                reject(error);
            }
            if (response.statusCode == 200) {
                //log(body);
                var obj = JSON.parse(body);
                resolve(obj.sha);
            } else {
                reject(response.statusCode);
            }
        });
    });
};

module.exports = {
    getLatestCommit: getLatestCommit
};