# iTunes Music Library XML to Spotify Migrator
This tool takes a standard `iTunes Music Library.xml` file (also called `iTunes Library.xml`) and automatically migrates each song found inside that library to Spotify, if possible.

iTunes library parsing is provided by [itunes-data from shawnbot](https://github.com/shawnbot/itunes-data).

Automatic Spotify search and playlist additions are done using the [Spotify Web API](https://developer.spotify.com/documentation/web-api).

## Setup

1. Head to the Spotify Developer Portal and create a new application. Note the Client ID of the app for usage later in the CLI or `.env`. This will provide you API access to Spotify, though in a limited capacity since it will start as a Sandbox application.
2. Create a Spotify playlist. This tool will put all of the found tracks into this playlist. Note the Playlist ID for usage later in the CLI or `.env`.
3. Place your XML file somewhere in this repo for parsing by the script.

## Usage

Just `yarn install` and `yarn start` and you're off.

The CLI will prompt you for all information it needs in order to continue properly. You can prefill that information using an optional `.env` file, see [.env.example](.env.example) for what to fill out if that route interests you.

Once completed, all songs will be migrated into the Playlist and you'll be left with a generated `notFoundTracks.json` file containing the track data for all songs that were not migrated.
