var express = require('express');
var router = express.Router();
var SpotifyWebApi = require("spotify-web-api-node");
var Twit = require("twit");
//var async = require('async');
//var path = require('path');
//var fs = require('fs');
//var google = require('googleapis');


// Gets home page
router.get("/", function (req, resp) {
    resp.render("home", {
        title: "ArtistFinder"
    });
});

var spotifyApi = new SpotifyWebApi({
    clientId: ,
    clientSecret: ,
    redirectUri: '/'
});

var T = new Twit({
    consumer_key: ,
    consumer_secret: ,
    access_token: ,
    access_token_secret: 
});


router.get("/search", function (req, res, next) {
    var searchForm = req.query.q;
    var artistID = "";
    var artistName = "";
    var trackSearchedFor = "";
    var twitterAccount = "";
    var tweets = [];
    var popularSongs = [];

    if(searchForm ==""){
        return res.render("invalidsearch", {
            message: "WHOOPS, looks like you didn't search for anything."
        });
    }
    // Start searching for a track
    spotifyApi.searchTracks("track:" + searchForm, {
        limit: 1 // Limit set to one, will give the most popular song by that name or containing that name
    })
        .then(function (data) {
            var page = data.body.tracks.items;
            page.forEach(function (track, index) {
                trackSearchedFor = track.name;  // Find the name of the track searched for
                // console.log("TRACK SEARCHED FOR " + trackSearchedFor);

                artistID = track.artists[index].id; // Find the artist ID
                artistName = track.artists[index].name; // Find the artist name

                // console.log("Artist: " + artistName + ", Track: " + trackSearchedFor + ", Popularity: " + track.popularity + ", ArttistID: " + artistID);

                // Create parameters for twitter account search
                var TwitterAccountParams = {
                    q: artistName,  // uses the artist's  name
                    count: 1  // Takes the most popular
                };
                // Callback function for Twitter Account get request
                var collectAccountData = function (err, data) {
                    if (err) {
                        console.log("Find twitter account failed: " + err)
                    }
                    // twitterAccount = "";
                    // Goes through the data received and finds the name. In this case the length will only be 1
                    for (var i = 0; i < data.length; i++) {
                        twitterAccount = data[i].screen_name;  // sets the account
                    }
                    // console.log("Twitter Account: " + twitterAccount);

                    // When Twitter Account is set, we can start searching for that account's latest tweets
                    // Parameters for tweet search
                    var tweetParams = {
                        screen_name: twitterAccount,  // uses the account name
                        count: 10,  // ten latest tweets
                        exclude_replies: true,  // Drops extra information that we don't need
                        include_entities: false // Drops extra information that we don't need
                    };
                    // Callback function for tweets get request
                    var collectTweetData = function (err, data) {
                        if (err) {
                            console.log("Get tweets failed: " + err.message)
                        }
                        tweets = []; // Makes sure the array is empty
                        // Goes through all the tweets (ten tweets)
                        for (var i = 0; i < data.length; i++) {
                            tweets.push([data[i].text, data[i].id_str]);  // saves tweet text and id_string, this can be used make nice twitter cards on client side
                        }
                        //console.log("Tweets from: " + artistName);
                        // console.log(tweets);
                    };
                    T.get('statuses/user_timeline', tweetParams, collectTweetData);  // sends in the parameter and the callback function in the get request for the tweets
                };
                T.get('users/search', TwitterAccountParams, collectAccountData);  // send in the parameters and the callback function in the get request fot the twitter account
                // This can seem messy, but I found it easier to handle the get request if declared callback functions and parameters first and then send them into the request
            });


            spotifyApi.clientCredentialsGrant()
                .then(function (data) {
                    // Set the access token on the API object so that it's used in all future requests
                    spotifyApi.setAccessToken(data.body['access_token']);

                    // Get the most popular song by the artist with id == artistID
                    return spotifyApi.getArtistTopTracks(artistID, 'NO');  // Change this to AU
                }).then(function (data) {
                popularSongs = []; // empties the list before searching

                var tracks = data.body.tracks;
                tracks.forEach(function (track) {
                    popularSongs.push([track.name, track.external_urls.spotify]); // List will be sorted by popularity, adds name and uri
                });
                //console.log(popularSongs);

            }).catch(function (err) {
                // if there is a bad request from client, typically a song does not exist, and no artist are found
                // then an empty string are passed to this function, and that returns in an empty request
                if (err.message == "Bad Request") {
                    console.log(err.message);
                    res.render("invalidsearch", {message: 'Spotify failed to find any track with the name: "' + searchForm + '"'});  // renders a page with error message to client
                }
            });
        }, function (err) {
            console.log('search track failed!', err);
            if (err.message == 'Unauthorized'){
                res.render("invalidsearch", {message: "Unauthorized by Spotify. Don't know why"});  // this has only happened ones, and do not know why or how to provoke this
                // Have only encountered this when searching for NOT. This is a problem in the actually Spotify Application as well.
            }else if(err.message == "Not Found"){
                res.render("invalidsearch", {message: "An error occurred. Please try searching again"});  // The error message is the same as Spotify uses for this error.
            }
        });

    // sets interval to be sure that all information are in place before rendering the page
    setInterval(function () {
        if (popularSongs != "") {  // popular songs are the last thing collected from the APIs, so if there is information here everything will be set
            if(twitterAccount == ""){  // handles the case if the artist does not have any twitter account
                tweets = [["It seems like this artist doesn't have a twitter account", null]]; // Creates a tweet to notify the user
                twitterAccount = "AndreasNorstein";// Give the developer some creeds
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
            clearInterval(this);
        }

    }, 300);

});

module.exports = router;
