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
              
              // Set the token expiration time
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



// app.use(async (req, res, next) => {
//   try {
//     if (!spotifyApi.getAccessToken() || tokenNeedsRefresh(spotifyApi)) {
//       const data = await spotifyApi.refreshAccessToken();
//       spotifyApi.setAccessToken(data.body['access_token']);
//       console.log('Access token refreshed!');
//     }
//     next();
//   } catch (error) {
//     console.error('Error refreshing access token:', error);
//     res.status(500).json({ error: 'Failed to refresh access token' });
//   }
// });

// app.get('/login', (req, res) => {
//   res.redirect(spotifyApi.createAuthorizeURL(scopes));
// });

// app.get('/callback', (req, res) => {
//   const error = req.query.error;
//   const code = req.query.code;
//   const state = req.query.state;

//   if (error) {
//     console.error('Callback Error:', error);
//     res.send(`Callback Error: ${error}`);
//     return;
//   }

//   spotifyApi
//     .authorizationCodeGrant(code)
//     .then(data => {
//       const access_token = data.body['access_token'];
//       const refresh_token = data.body['refresh_token'];
//       const expires_in = data.body['expires_in'];

//       spotifyApi.setAccessToken(access_token);
//       spotifyApi.setRefreshToken(refresh_token);

//       console.log('access_token:', access_token);
//       console.log('refresh_token:', refresh_token);

//       console.log(
//         `Sucessfully retreived access token. Expires in ${expires_in} s.`
//       );
//       res.send('Success! You can now close the window.');

//       setInterval(async () => {
//         const data = await spotifyApi.refreshAccessToken();
//         const access_token = data.body['access_token'];

//         console.log('The access token has been refreshed!');
//         console.log('access_token:', access_token);
//         spotifyApi.setAccessToken(access_token);
//       }, expires_in / 2 * 1000);
//     }).catch(error => {
//       console.error('Error:', error);
//       res.send(`Error: ${error}`);
//     });
// });