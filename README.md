# Inbox One

Deliver email instantly to anyone who tweets about getting to Inbox Zero.

## What?

This takes advantage of the fact that Twitter will send a password reset email to anyone, if you know their username. It listens on the Twitter streaming API for people tweeting "inboxzero", then passes their username through Twitter's password reset web pages.

## Why?

People shouldn't brag. It isn't good for them. You're doing them a favour, really.

## How?

Clone this repo.

Copy `config.example.js` to `config.js` and fill out the fields with tokens/keys you can create [here](https://apps.twitter.com/).

Then, in your terminal, `cd` into the project directory and run:

    npm install
    node index.js

### Note:

The Twitter website is pretty good at detecting bot behaviour, so you'll probably only get to help out a few users before Twitter starts ignoring the script's requests to the password reset pages.

Also, I'm sorry. Don't blame me for this. Blame [the tweet](https://twitter.com/AstroKatie/status/562118069854564352) that inspired me.
