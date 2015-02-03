var kgo = require('kgo');
var request = require('request');
var Twitter = require('twitter');
var xtend = require('xtend');
var config = require('./config');

var URL_ROOT = 'https://twitter.com/account/';
var AUTH_TOKEN_REGEX = /authenticity_token" value="(\w+)"/;
var SPACES_REGEX = /\s/g;

(new Twitter(config)).stream('statuses/filter', {track: 'inboxzero,inbox zero'}, function (stream) {
    stream.on('data', function (tweet) {
        if (tweet.text.replace(SPACES_REGEX, '').toLowerCase().indexOf('inboxzero') > -1) {
            console.log('Inbox Zero Alert!: "' + tweet.text + '"');
            sendPasswordResetEmail(tweet.user.screen_name);
        }
    });
    stream.on('error', function (error) {
        throw error;
    });
});

function parseResponse(response, done) {
    var token;

    if (response.statusCode !== 200) {
        return done(response.statusCode);
    }

    token = response.body.match(AUTH_TOKEN_REGEX);

    if (!token || token.length < 2) {
        return done('Too many attempts');
    }

    done(null, token[1]);
}

function sendPasswordResetEmail(username) {
    var options = {
        followAllRedirects: true,
        jar: request.jar()
    };

    kgo
    ('beginResponse', function (done) {
        console.log('Starting reset process for @' + username);
        request.get(URL_ROOT + 'begin_password_reset', options, done);
    })
    ('beginToken', ['beginResponse'], parseResponse)
    ('identifyResponse', ['beginToken'], function (beginToken, done) {
        console.log('Identifying email address for @' + username);
        request.post(URL_ROOT + 'begin_password_reset', xtend(options, {
            form: {
                authenticity_token: beginToken,
                account_identifier: username
            }
        }), done);
    })
    ('identifyToken', ['identifyResponse'], parseResponse)
    ('sendResponse', ['identifyToken'], function (identifyToken, done) {
        console.log('Sending email to @' + username);
        request.post(URL_ROOT + 'send_password_reset', xtend(options, {
            form: {
                authenticity_token: identifyToken,
                method: '-1',
                'method_hint[-1]': 'email'
            }
        }), done);
    })
    ('confirmSent', ['sendResponse'], function (response, done) {
        if (response.statusCode !== 200) {
            return done(response.statusCode);
        }

        console.log('Sent email to @' + username);
        done(null);
    })
    .on('error', function (error, stepName) {
        console.log('Failed to send email to @' + username + '\n[error: "' + error + '", stepName: "' + stepName + '"]');
    });
}
