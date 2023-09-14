# iTunes Music Library XML to Spotify Migrator
This tool takes a standard `iTunes Music Library.xml` file (also called `iTunes Library.xml`) and automatically migrates each song found inside that library to Spotify, if possible.

iTunes library parsing is provided by [itunes-data from shawnbot](https://github.com/shawnbot/itunes-data).

Automatic Spotify search and playlist additions are done using the [Spotify Web API](https://developer.spotify.com/documentation/web-api).

## Setup

1. Head to the Spotify Developer Portal and create a new application. Note the Client ID of the app for usage later in the CLI or `.env`. This will provide you API access to Spotify, though in a limited capacity since it will start as a Sandbox application.
2. Create a Spotify playlist. This tool will put all of the found tracks into this playlist. Note the Playlist ID for usage later in the CLI or `.env`.
3. Place your XML file somewhere in this repo for parsing by the script.

## Usage

Clone the repo locally, then use `yarn install` to setup the repo.

After that, run `yarn start` and you're cooking.

The CLI will prompt you for all information it needs in order to continue properly. You can prefill that information using an optional `.env` file, see [.env.example](.env.example) for what to fill out if that route interests you.

Once completed, all songs will be migrated into the Playlist and you'll be left with a generated `notFoundTracks.json` file containing the track data for all songs that were not migrated.

## Search Pattern

First, we search for the song by constraining it to the exact album and artist found in the track data.

If that produces no results, we lax the constraints and search for the exact song from the eact artist on any of their albums.

After that, we fail to migrate the song, as laxing the constraints further gets messy and produces false positives (covers, wrong song, etc). Those songs have their track data written to `notFoundTracks.json`, allowing you to then manually go find those songs and add them to your playlist yourself.
