# iTunes Library XML to Spotify Migrator
By providing a standardized iTunes Library XML file, this tool will migrate all songs found inside that library and add them to a specified Spotify playlist.

## Setup

1. Head to the Spotify Developer Portal and create a new application. Note the Client ID of the app for use later.
2. Place your XML file somewhere in this repo.
3. Create a Spotify playlist (private or public) for this tool to place all of the tracks into. Note the Playlist ID for use later.

## Usage

Simply `yarn install` and `yarn start` to get going.

The CLI will prompt you for all information it needs in order to continue properly. You can prefill that information using a `.env` file, see [.env.example](.env.example) for what to fill out.
