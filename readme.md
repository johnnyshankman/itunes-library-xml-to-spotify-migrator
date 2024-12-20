# iTunes Music Library XML to Spotify Migrator

![build](https://github.com/johnnyshankman/itunes-library-xml-to-spotify-migrator/actions/workflows/build.yml/badge.svg)

Takes a standard [`iTunes Music Library.xml`](https://discussions.apple.com/thread/2116343) file (sometimes labeled `iTunes Library.xml`) and migrates each song to a Spotify playlist as best it can. Also compatible with the output of [swinsian2itlxl](https://github.com/mhite/swinsian2itlxml).

iTunes library parsing is provided by [itunes-data from shawnbot](https://github.com/shawnbot/itunes-data).

Spotify search and playlist additions are automated using the [Spotify Web API](https://developer.spotify.com/documentation/web-api), after using [Spotify's Implicit Grant OAuth](https://developer.spotify.com/documentation/web-api/tutorials/implicit-flow) flow to log you in. The only reason for this OAuth flow is so this tool has permission to add songs to any playlist you provide.

## Setup

1. Head to the Spotify Developer Portal and create a new application. Note the Client ID of the app for usage later in the CLI or `.env`. This will provide you API access to Spotify, though in a limited capacity since it will start as a Sandbox application.
2. Create a Spotify playlist. This tool will put all of the found tracks into this playlist. Note the Playlist ID for usage later in the CLI or `.env`.
3. Place your XML file somewhere in this repo for parsing by the script.

## Usage

Clone the repo locally, then use `npm install` to setup the repo.

After that, run `npm run start` and you're cooking.

The CLI will prompt you for all information it needs in order to continue properly. You can prefill that information using an optional `.env` file, see [`.env.example`](.env.example) for what to fill out if that route interests you.

Once completed, all songs will be migrated into the Playlist and you'll be left with a generated `notFoundTracks.json` file containing the track data for all songs that were not migrated.

## Search Pattern

This uses a naive two-tier search pattern.

First try searches for the song by constraining it to the exact album and artist found in the track data. If there are typos obviously this will have issues.

Second try searches for the song by constraining to just the artist name, meaning any album's version will suffice.

After that, we fail to migrate the song, as laxing the constraints further gets produces too many false positives (covers, wrong song, etc). Those songs have their track data written to `notFoundTracks.json`, allowing you to then manually go find those songs and add them to your playlist yourself.
