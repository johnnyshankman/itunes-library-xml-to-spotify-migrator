import * as fs from 'fs';
import fetch from 'node-fetch';
import * as readline from 'readline';
import open from 'open';
import itunes from "itunes-data";
import 'dotenv/config'
import * as cliProgress from 'cli-progress';

const pBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

type Library = {
  Tracks: {
    [trackId: string]: Track;
  };
}

type Track = {
  Name?: string;
  Artist?: string;
  Album?: string;
  Genre?: string;
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }))
}

let libraryXMLPath: string = process.env.LIBRARY_XML || '';
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

let redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
if (!redirect_uri) {
  redirect_uri = await askQuestion("Enter Spotify Redirect URI:");
}

const scope = 'playlist-modify-private playlist-modify-public';
let url = 'https://accounts.spotify.com/authorize';
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
const notFoundTracks: Track[] = [];
const onLibrary = async (library: Library) => {
  const tracks = library['Tracks'];

  if (!oneLibrarySemaphore) {
    oneLibrarySemaphore = true;
    pBar.start(Object.keys(tracks).length, 0);

    for (const trackId in tracks) {
      const track = tracks[trackId];
      pBar.increment();
      await onTrack(track);
    }
  }
}

const onTrack = async (track: Track) => {
  let uriToAddToPlaylist;

  if (!track) {
    return;
  }

  const trackName = track['Name'];
  const trackArtist = track['Artist'];
  const trackAlbum = track['Album'];

  if (!trackName || !trackArtist) {
    notFoundTracks.push(track);
    return;
  }

  const uriEncodedTrackName = encodeURIComponent(trackName);
  const uriEncodedTrackArtist = encodeURIComponent(trackArtist);
  const uriEncodedTrackAlbum = encodeURIComponent(trackAlbum || '');

  let endpointString = `https://api.spotify.com/v1/search?q=${uriEncodedTrackName}%20artist:${uriEncodedTrackArtist}%20album:${uriEncodedTrackAlbum}&type=track&limit=1`;
  let searchResponse, searchData;
  try {
    searchResponse = await fetch(
      endpointString,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // check if the response was "Too many requests"
    if (searchResponse.status === 429) {
      pBar.stop();
      console.log('');
      console.log('ERROR: Spotify API rate limit reached, try again later');
      process.exit(1);
    }

    searchData = (await searchResponse.json()) as {
      tracks: {
        items: {
          uri: string;
        }[];
      };
    };
  } catch (e) {
    if (e.message === 'invalid_grant') {
      pBar.stop();
      console.log('');
      console.log('ERROR: Invalid token, please try again');
      process.exit(1);
    }

    console.log('Error fetching track', e);
  }


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

    searchData = (await searchResponse.json()) as {
      tracks: {
        items: {
          uri: string;
        }[];
      };
    };

    if (searchData.tracks.items.length !== 0) {
      uriToAddToPlaylist = searchData.tracks.items[0].uri;
    } else {
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
  const addTrackData = (await addTrackResponse.json()) as {
    snapshot_id?: string;
  };

  if (!addTrackData.snapshot_id) {
    notFoundTracks.push(track);
    console.log(`Failure migrating ${trackName} by ${trackArtist} from ${trackAlbum} to playlist`);
  }
}

const stream = fs.createReadStream(libraryXMLPath);
const parser = itunes.parser();

parser.on("library", onLibrary);

parser.on("end", () => {
  pBar.stop();
  console.log('');
  console.log('Migration complete!');
  fs.writeFileSync('notFoundTracks.json', JSON.stringify(notFoundTracks, null, 2));
  console.log(`${notFoundTracks.length} tracks were not migrated. That data has been written to notFoundTracks.json`);
});

// @dev: kick the whole process off
stream.pipe(parser);
