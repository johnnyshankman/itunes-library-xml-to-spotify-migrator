# iTunes Music Library XML to Spotify Migrator
This tool can take a standard `iTunes Music Library.xml` file and automatically migrate each song found inside that library to Spotify, if possible.

iTunes library parsing is provided by [itunes-data from shawnbot](https://github.com/shawnbot/itunes-data).

Automatic Spotify search and playlist additions are done using the [Spotify Web API](https://developer.spotify.com/documentation/web-api).

## Setup

1. Head to the Spotify Developer Portal and create a new application. Note the Client ID of the app for usage later in the CLI or `.env`.
2. Place your XML file somewhere in this repo.
3. Create a Spotify playlist (private or public) for this tool to place all of the tracks into. Note the Playlist ID for usage later in the CLI or `.env`.

## Usage

Just `yarn install` and `yarn start` and you're off.

The CLI will prompt you for all information it needs in order to continue properly. You can prefill that information using an optional `.env` file, see [.env.example](.env.example) for what to fill out if that route interests you.
