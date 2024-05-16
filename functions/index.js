require('dotenv').config(); //will access api-auth

const bodyParser = require('body-parser');
const SpotifyWebApi = require("spotify-web-api-node");

const express = require('express');
var app = express();
const functions = require('firebase-functions');
const cors = require('cors');

app.use(cors({ origin: true }));


const scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify'
];

app.use(bodyParser.urlencoded({ extended: true }));

// setting the spotify-api goes here:
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URL
});


function authenticateWithSpotify() {
  return new Promise((resolve, reject) => {
      spotifyApi.clientCredentialsGrant().then(
          data => {
              console.log('The access token expires in ' + data.body['expires_in']);
              console.log('The access token is ' + data.body['access_token']);

              // Save the access token so it can be used in future calls
              spotifyApi.setAccessToken(data.body['access_token']);
              
              setTokenExpiration(data.body['expires_in']);
              resolve(data.body['access_token']);  // Resolve with the token
          },
          err => {
              console.error('Something went wrong when retrieving an access token', err);
              reject(err);  // Reject the promise on error
          }
      );
  });
}


authenticateWithSpotify();


async function verifyToken(req, res, next) {
  try {
    // Check if the current token is valid or nearing expiry
    if (!spotifyApi.getAccessToken() || tokenNeedsRefresh()) {
      await authenticateWithSpotify();
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Failed to authenticate with Spotify' });
  }
}

// probably is a better way
function tokenNeedsRefresh() {
  return !spotifyApi.getAccessToken(); 
}

let tokenExpirationEpoch;

function setTokenExpiration(expiresIn) {
    const now = new Date().getTime() / 1000;
    tokenExpirationEpoch = now + expiresIn - 300;  // Set to expire 5 minutes before actual expiration
}


function tokenNeedsRefresh() {
  const now = new Date().getTime() / 1000;
  return now >= tokenExpirationEpoch;
}

app.use('/search', verifyToken);
// get search data
app.get('/search/:query', async (req, res) => {
  try {
    const queryString = req.params.query;
    const data = await spotifyApi.searchTracks(queryString);
    const trackItems = data.body.tracks.items;
    console.log("getting tracks");
    res.json(trackItems); // Send the search results to the frontend
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

console.log("backend ready");

exports.api = functions.https.onRequest(app);
