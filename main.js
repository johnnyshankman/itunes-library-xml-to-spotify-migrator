import fs from 'fs';
import fetch from 'node-fetch';
import readline from 'readline';
import open from 'open';
import itunes from "itunes-data";
import 'dotenv/config'


function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }))
}

let libraryXMLPath = process.env.LIBRARY_XML;
if (libraryXMLPath) {
  console.log('Using library XML path from .env file');
} else {
  console.log('No library XML path found in .env file');
  libraryXMLPath = await askQuestion("Enter path to iTunes Library XML file:");
}

let clientId = process.env.SPOTIFY_CLIENT_ID;
if (!clientId) {
  clientId = await askQuestion("Enter Spotify Client ID:");
}

var scope = 'playlist-modify-private playlist-modify-public';
var redirect_uri = 'https://whitelights.co';
var url = 'https://accounts.spotify.com/authorize';
  url += '?response_type=token';
  url += '&client_id=' + encodeURIComponent(clientId);
  url += '&scope=' + encodeURIComponent(scope);
  url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
  url += '&state=' + encodeURIComponent(1);

console.log('Opening Spotify login page...');
open(url);

/**
 * @dev the expectation is that the URL will look like this:
 * https://whitelights.co/#access_token=BQDVwoPK1hK-_iXN-zV0yMq-RYJndkZ80bzl5q1oCNUkNHGuxiuCuHyGzW-HGXWHkuTQp8iAF1T4gJ6sqep6UhjxNKVCbm35mehpyB6t1MvMCAb2o6_0mKmcDYJsKFDMZifI5ljH8rYzgJSiLkLHTlv1z9-00fL1i3RjxMWON6r3fI7Ujc0j56K2eF6BMpZEw_ZDY7xm7NcTA7Xh5FZo6zTHeTD5oyJUAuHXZiKR5nHATQ4sSdw&token_type=Bearer&expires_in=3600&state=1
 */
const ans = await askQuestion("Paste URL you were redirected to after login:");
const token = ans.split('access_token=')[1].split('&')[0];

let playlistId = process.env.SPOTIFY_PLAYLIST_ID;
if (!playlistId) {
  playlistId = await askQuestion("Enter Spotify Playlist ID to migrate found songs into:");
}

let oneLibrarySemaphore = false;
let notFoundTracks = [];
const onLibrary = async (library) => {
  const tracks = library['Tracks'];

  if (!oneLibrarySemaphore) {
    oneLibrarySemaphore = true;
    for (const trackId in tracks) {
      const track = tracks[trackId];
      await onTrack(track);
    }
  }
}

const onTrack = async (track) => {
  let uriToAddToPlaylist;
  const trackName = track['Name'];
  const trackArtist = track['Artist'];
  const trackAlbum = track['Album'];
  const uriEncodedTrackName = encodeURIComponent(trackName);
  const uriEncodedTrackArtist = encodeURIComponent(trackArtist);
  const uriEncodedTrackAlbum = encodeURIComponent(trackAlbum);

  let endpointString = `https://api.spotify.com/v1/search?q=${uriEncodedTrackName}%20artist:${uriEncodedTrackArtist}%20album:${uriEncodedTrackAlbum}&type=track&limit=1`;
  let searchResponse = await fetch(
    endpointString,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  let searchData = await searchResponse.json();

  if (searchData.tracks.items.length !== 0) {
    uriToAddToPlaylist = searchData.tracks.items[0].uri;
  } else {
    // @dev: let's try without the album constraint
    endpointString = `https://api.spotify.com/v1/search?q=${uriEncodedTrackName}%20artist:${uriEncodedTrackArtist}&type=track&limit=1`;

    searchResponse = await fetch(
      endpointString,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    searchData = await searchResponse.json();

    if (searchData.tracks.items.length !== 0) {
      uriToAddToPlaylist = searchData.tracks.items[0].uri;
    } else {
      // @dev we should do a super fuzzy match here
      // endpointString = `https://api.spotify.com/v1/search?q=${uriEncodedTrackName}%20${uriEncodedTrackArtist}&type=track&limit=1`;
      notFoundTracks.push(track);
      return;
    }
  }

  const addTrackResponse = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [uriToAddToPlaylist],
        position: 0,
      }),
    }
  );
  const addTrackData = await addTrackResponse.json();

  if (addTrackData.snapshot_id) {
    console.log(`Successfully migrated ${trackName} by ${trackArtist} from ${trackAlbum} to playlist`);
  } else {
    console.log(`Failure migrating ${trackName} by ${trackArtist} from ${trackAlbum} to playlist`);
  }
}

const stream = fs.createReadStream(libraryXMLPath);
const parser = itunes.parser();

parser.on("library", onLibrary);

parser.on("end", () => {
  console.log('Migration complete!');
  fs.writeFileSync('notFoundTracks.json', JSON.stringify(notFoundTracks));
  console.log(`Could not migrate ${notFoundTracks.length} tracks, that data has been written to notFoundTracks.json`);
});

// @dev: kick the whole process off
stream.pipe(parser);
