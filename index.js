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
    stream.on('error', function (err) {
        throw err;
    });
});

function sendPasswordResetEmail(username) {
    var jar = request.jar();

    kgo
    ('begin', function (done) {
        console.log('Starting reset process for @' + username);
        request.get(URL_ROOT + 'begin_password_reset', {
            jar: jar
        }, function (err, response, body) {
            var token;
            if (!err && response.statusCode == 200) {
                token = response.body.match(AUTH_TOKEN_REGEX);
                if (!token || token.length < 2) {
                    return done('Too many attempts');
                }
                token = token[1];
                return done(null, token);
            }
            done(err || response.statusCode);
        });
    })
    ('identify', ['begin'], function (token, done) {
        console.log('Identifying email address for @' + username);
        request.post(URL_ROOT + 'begin_password_reset', {
            form: {
                authenticity_token: token,
                account_identifier: username
            },
            followAllRedirects: true,
            jar: jar
        }, function (err, response, body) {
            var token;
            if (!err && response.statusCode == 200) {
                token = response.body.match(AUTH_TOKEN_REGEX);
                if (!token || token.length < 2) {
                    return done('Too many attempts');
                }
                token = token[1];
                return done(null, token);
            }
            done(err || response.statusCode);
        });
    })
    ('send', ['identify'], function (token, done) {
        console.log('Sending email to @' + username);
        request.post(URL_ROOT + 'send_password_reset', {
            form: {
                authenticity_token: token,
                'method_hint[-1]': 'email',
                'method': '-1'
            },
            followAllRedirects: true,
            jar: jar
        }, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                console.log('Sent email to @' + username);
                return done(null);
            }
            done(err || response.statusCode);
        });
    })
    .on('error', function (err, stepName) {
        console.log('Failed to send email to @' + username + '\n[error: "' + err + '"]');
    });
}
