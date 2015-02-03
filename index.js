var kgo = require('kgo');
var request = require('request');
var Twitter = require('twitter');
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

function parseResponse(response, callback){
    var token;
    if (response.statusCode !== 200) {
        callback(response.statusCode);
    }

    token = response.body.match(AUTH_TOKEN_REGEX);
    if (!token || token.length < 2) {
        return done('Too many attempts');
    }

    done(null, token[1]);
}

function log(message){
    return function(){
        console.log(message);
    }
}

function sendPasswordResetEmail(username) {
    var jar = request.jar();

    console.log('Starting reset process for @' + username);

    kgo
    ({
        passwordResetUrl: URL_ROOT + 'begin_password_reset',
        resetConfig: {
            jar: jar
        },
        sendResetUrl: URL_ROOT + 'send_password_reset',
    })
    (log('Starting reset process for @' + username))
    ('beginResponse', 'beginBody', [passwordResetUrl, resetConfig], request.get)
    ('beginToken', ['beginToken'], parseResponse)
    (log('Identifying email address for @' + username))
    ('identifyResponse', 'identifyBody', ['beginToken'], request.post)
    ('identifyToken', ['beginToken'], parseResponse)
    (log('Sending email to @' + username))
    ('send', ['identifyToken'], function (token, done) {
        request.post(URL_ROOT + 'send_password_reset', , function (error, response) {
            if (!error && response.statusCode == 200) {
                console.log('Sent email to @' + username);
                return done(null);
            }
            done(error || response.statusCode);
        });
    })
    .on('error', function (error, stepName) {
        console.log('Failed to send email to @' + username + '\n[error: "' + error + '"]');
    });
}
