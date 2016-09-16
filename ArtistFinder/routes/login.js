var SpotifyWebApi = require("spotify-web-api-node");

var spotifyApi = new SpotifyWebApi({
    clientId: 'af152524f1c14b06b3f05eb7dc238ff1',
    clientSecret: '463867271f724fed8168b6bb6d0a8e6a',
    redirectUri: '/'
});

var findtoptracks = function (artistID, popularSongs, res) {
    console.log("ART ID " + artistID );
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
        return popularSongs;

    }).catch(function (err) {
        if (err.message == "Bad Request") {
            console.log(err.message);
            return res.render("invalidsearch", {message: "Spotify failed to find any track with this name."});
        }

    });

};

module.exports = {findtoptracks: findtoptracks};
