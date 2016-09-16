/**
 * Created by Andreas on 07-Sep-16.
 */
var express = require('express');
var router = express.Router();
var SpotifyWebApi = require("spotify-web-api-node");


var spotifyApi = new SpotifyWebApi({
    clientId: 'af152524f1c14b06b3f05eb7dc238ff1',
    clientSecret: '463867271f724fed8168b6bb6d0a8e6a',
    redirectUri: 'http://localhost:3001/'
});

var artistID = "";
var artistName = "";
var popularSongs = [];


var searchTracks = function (query) {
    spotifyApi.searchTracks('track:' + query, {
        limit: 1
    }).then(function (data) {
        console.log('Track: ' + (data.body.tracks.items));  // This gives the whole object, but it does not print i json format

        var firstPage = data.body.tracks.items;
        console.log('The tracks in the first page are.. (popularity in parentheses)');


        firstPage.forEach(function (track, index) {
            console.log(index + ': ' + track.name + ' (' + track.popularity + ')');
        });

        // This shoould be done by just getting json objects, not stringify it
        firstPage.forEach(function (track, index) {
            var artistObject = JSON.stringify(track.artists);
            var artisSplit = artistObject.split(",");
            artistID = artisSplit[2].split(":")[1].slice(1, artistID.length - 1); // get the id string.
            artistName = artisSplit[3].split(":")[1].slice(1, artistName.length - 1);  // get the name string
            //            console.log(index + ": Artist: " + JSON.stringify(track.artists)  + " (yolo) ");
        });
    }, function (err) {
        console.log('Something went wrong!', err);
    });
};


var findArtistTopTracks = function () {
    // Retrieve an access token
    spotifyApi.clientCredentialsGrant()
        .then(function (data) {
            // Set the access token on the API object so that it's used in all future requests
            spotifyApi.setAccessToken(data.body['access_token']);

            // Get the most popular tracks by David Bowie in Great Britain
            return spotifyApi.getArtistTopTracks(artistID, 'NO')
        }).then(function (data) {
        data.body.tracks.forEach(function (track, index) {
            popularSongs.push(track.name); // List will be sorted by popularity
            //        console.log((index+1) + '. ' + track.name + ' (popularity is ' + track.popularity + ')');

        });
        console.log(popularSongs)

    }).catch(function (err) {
        console.log('Unfortunately, something has gone wrong.', err.message);
    });

};


module.exports = router;
