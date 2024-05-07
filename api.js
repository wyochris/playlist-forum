require('dotenv').config(); //will access api-auth

const bodyParser = require('body-parser');
const SpotifyWebApi = require("spotify-web-api-node");

const express = require('express');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// setting the spotify-api goes here:
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URL
});

// Retrieve an access token (test)
spotifyApi
  .clientCredentialsGrant()
  .then(data => {
    console.log(data.body)
    spotifyApi.setAccessToken(data.body["access_token"]);
  })
  .catch(error => {
    console.log("Something went wrong when retrieving an access token", error);
  });