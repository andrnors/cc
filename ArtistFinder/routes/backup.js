var express = require('express');
var router = express.Router();
var google = require('googleapis');
var async = require('async');
var path = require('path');
var fs = require('fs');

router.use("./public", express.static(__dirname + "/../public"));


router.get("/", function (req, resp) {
    resp.sendFile("home.html", {
        root: path.join(__dirname + "/../views")
    });
});


var SpotifyWebApi = require("spotify-web-api-node");
var spotifyApi = new SpotifyWebApi({
    clientId: '',
    clientSecret: '',
    redirectUri: '/'
});

var Twit = require("twit");
var T = new Twit({
    consumer_key: "",
    consumer_secret: '',
    access_token: '',
    access_token_secret: ''
});
//var tweets = [];
//var twitterAccount = "";

var findTwitterAccount = function (artist) {
    var twitterAccount = "";
    var params = {
        q: artist,
        count: 1
    };
    var collectData = function (err, data) {
        if (err) {
            console.log("Find twitter account failed: " + err)
        }
        var stringify = JSON.stringify(data);
        var json = JSON.parse(stringify);
        twitterAccount = "";
        for (var i = 0; i < json.length; i++) {
            twitterAccount = json[i].screen_name;
        }
        // console.log("Twitter Account: " + twitterAccount);
        // getTweets(twitterAccount);
    };
    T.get('users/search', params, collectData);
    return twitterAccount;
};

var getTweets = function (account) {
    var params = {
        screen_name: account,
        count: 10,
        exclude_replies: true,
        include_entities: false
    };
    var tweets = []; // The array needs to be empty before the search starts, else it will return tweets from earlier search

    var collectData = function (err, data) {
        if (err) {
            console.log("Get tweets failed: " + err)
        }
        var stringify = JSON.stringify(data);
        var json = JSON.parse(stringify);
        tweets = []; // The array needs to be empty before the search starts, else it will return tweets from earlier search
        for (var i = 0; i < json.length; i++) {
            tweets.push([json[i].text, json[i].id_str]);
        }
        //console.log("Tweets from: " + artistName);
        console.log(tweets);
    };
    T.get('statuses/user_timeline', params, collectData);
    return tweets;

};


// These collect all the information I need from spotify
//var artistID = "";  // SpotifyID for the ArtistName
//var artistName = ""; // Artist of the trackSearchFor
//var popularSongs = [];   // Contains tracks URI for playback. If that is not approved, it contains all track names
//var trackSearchedFor = "";  // Track user is searching for


var searchTrack = function (query) {
    spotifyApi.searchTracks("track:" + query, {
        limit: 1 // Limit set to one, will give the most searched for song by that name
    })
        .then(function (data) {
            var page = data.body.tracks.items;
            var artistID = "";
            var artistName = "";
            var trackSearchedFor ="";

            page.forEach(function (track, index) {
                //console.log(JSON.stringify(track.artists[index]) + " " + track.popularity);
                trackSearchedFor = track.name;
                console.log("TRACK SEARCHED FOR "+ trackSearchedFor);
                // resets values
                artistName = "";
                artistID = "";
                // This should be done by just getting json objects, not stringify it
                // but are having trouble accessing the JSON
                var artistObject = JSON.stringify(track.artists);
                var artistSplit = artistObject.split(",");
                artistID = artistSplit[2].split(":")[1].slice(1, artistID.length - 1); // get the id string.
                artistName = artistSplit[3].split(":")[1].slice(1, artistName.length - 1);  // get the name string

                console.log("Artist: " + artistName + ", Track: " + trackSearchedFor + ", Popularity: " + track.popularity);
                //findTwitterAccount(artistName);
            });
            searchinfo  = [artistName, artistID, trackSearchedFor];
            return searchinfo;
            //findArtistTopTracks(artistID);

        }, function (err) {
            console.log('search track failed!', err);
        });
};

var findArtistTopTracks = function (artistID) {
    // Retrieve an access token
    spotifyApi.clientCredentialsGrant()
        .then(function (data) {
            // Set the access token on the API object so that it's used in all future requests
            spotifyApi.setAccessToken(data.body['access_token']);

            // Get the most popular song by the artist with id == artistID
            return spotifyApi.getArtistTopTracks(artistID, 'NO');  // Change this to AU
        }).then(function (data) {
        popularSongs = []; // empties the list before searching
        data.body.tracks.forEach(function (track) {
            popularSongs.push([track.name, track.external_urls.spotify]); // List will be sorted by popularity, adds name and uri
        });
        console.log(popularSongs);
        return popularSongs

    }).catch(function (err) {
        if(err.message == "Bad Request"){
            console.log(err.message);
            return res.render("invalidsearch", {message: "Spotify failed to find any track with this name."});
        }

    });
};

router.get("/search", function (req, res, next) {
    var searchForm = req.query.q;

    setInterval(function () {
        if (artistInformation.length() != 0 && twitterAccount != "" && tweets.length() != 0 && popularSongs.length() != 0) {
            res.render("index", {
                tweets: tweets,
                artistName: artistInformation[0],
                topTracks: popularSongs,
                placeholder: 'placeholder ="Searched for ' + artistInformation[2] + '"',
                twitterLink: 'href="https://twitter.com/' + twitterAccount + '"',
                spotifyLink: 'href="https://play.spotify.com/artist/' + artistInformation[1] + '"',
                tAccount: twitterAccount,
                artistID: artistInformation[1]
            });
        }

    }, 500);

});

/*
 router.get("/search", function (req, res, next) {
 async.series([function (callback) {
 var count = 0;
 var searchForm = req.query.q;
 if(searchForm == ""){
 res.render("invalidsearch", {message: "Sorry, you cannot send an empty search"});
 }else{
 searchTrack(searchForm);
 setInterval(function () {
 if (artistName != "" ){
 callback(console.log("First " + artistName + "  " + twitterAccount));
 clearInterval(this)
 }else if(count == 5){
 res.render("invalidsearch", {message: "Sorry, but " + searchForm + " is not a song Spotify can provide"});
 }count++;

 }, 300)
 }
 }, function(callback){
 var counter = 0;
 findTwitterAccount(artistName);
 setInterval(function () {
 if(twitterAccount == "" && counter == 5){
 tweets = [["Sorry, " + artistName + " does not seem to have an Twitter profile", null]];
 callback(console.log("SECOND: no account" ));
 clearInterval(this);
 }else if(twitterAccount != ""){
 callback(console.log("Second: Account is " + twitterAccount));
 clearInterval(this);
 }counter++;

 }, 300);

 },function (callback) {
 getTweets(twitterAccount);
 setInterval(function () {
 if(tweets.length > 0){
 callback(console.log("Third " + tweets));
 clearInterval(this)
 }
 }, 300)
 },function (callback) {
 findArtistTopTracks(artistID, res);
 setInterval(function () {
 if (popularSongs.length != 0){
 if (twitterAccount == "") {
 tweets = [["Sorry, " + artistName + " does not seem to have an Twitter profile", null]];
 }
 callback(console.log("Fourth " + popularSongs));
 clearInterval(this);
 }
 }, 350)
 }
 ], function (err) {
 if(err){return next([err])}
 res.render("index", {
 tweets: tweets,
 artistName: artistName,
 topTracks: popularSongs,
 placeholder: 'placeholder ="Searched for ' + trackSearchedFor + '"',
 twitterLink: 'href="https://twitter.com/' + twitterAccount + '"',
 spotifyLink: 'href="https://play.spotify.com/artist/' + artistID + '"',
 tAccount: twitterAccount,
 artistID: artistID
 });
 artistID = "";
 artistName = "";
 trackSearchedFor = "";
 popularSongs = [];
 tweets = [];
 twitterAccount = "";
 });

 });

 */

/*
 router.get('/search', function (req, res, next) {
 async.series([
 function (callback) {
 var searchForm = req.query.q;
 if (searchForm == "") {
 return res.render("invalidsearch", {
 message: "Sorry you cannot send an empty search"
 });
 }
 else {
 searchTrack(searchForm,res);
 setInterval(function () {
 if (popularSongs.length != 0) {
 if (twitterAccount == "") {
 tweets = [["Sorry, " + artistName + " does not seem to have an Twitter profile", null]];
 twitterAccount = "AndreasNorstein"; // cheating to get some followers on twitter
 }
 callback(console.log("CALLBACK"));
 clearInterval(this);
 }
 }, 500);
 }
 }
 ], function (err) {
 if (err) {
 return next([err]);  // passing the problem to express
 }
 res.render("index", {
 tweets: tweets,
 artistName: artistName,
 topTracks: popularSongs,
 placeholder: 'placeholder ="Searched for ' + trackSearchedFor + '"',
 twitterLink: 'href="https://twitter.com/' + twitterAccount + '"',
 spotifyLink: 'href="https://play.spotify.com/artist/' + artistID + '"',
 tAccount: twitterAccount,
 artistID: artistID
 });
 artistID = "";
 artistName = "";
 trackSearchedFor = "";
 popularSongs = [];
 tweets = [];
 twitterAccount = "";
 });
 });
 */
module.exports = router;
/**
 * Created by Andreas on 14-Sep-16.
 */
