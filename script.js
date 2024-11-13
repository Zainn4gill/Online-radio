const clientId = 'YOUR_SPOTIFY_CLIENT_ID'; // Replace with your Spotify Client ID
const redirectUri = 'YOUR_NETLIFY_DEPLOYED_URL'; // Replace with your Netlify URL
let accessToken = '';

/** Authentication Flow */
function authenticateSpotify() {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user-read-playback-state user-modify-playback-state`;
  window.location = authUrl;
}

function getAccessToken() {
  const hash = window.location.hash;
  if (hash) {
    accessToken = new URLSearchParams(hash.substring(1)).get('access_token');
  }
  if (!accessToken) {
    authenticateSpotify();
  }
}

/** Initialize Playlist Player */
async function initPlaylistPlayer(playlistId) {
  getAccessToken();
  let trackIndex = 0;
  const trackList = await fetchPlaylistTracks(playlistId);

  async function playNextTrack() {
    if (trackIndex >= trackList.length) trackIndex = 0;
    const trackUri = trackList[trackIndex].track.uri;
    await playTrack(trackUri);
    trackIndex++;
  }

  playNextTrack();

  setInterval(async () => {
    const updatedTracks = await fetchPlaylistTracks(playlistId);
    if (updatedTracks.length !== trackList.length) {
      trackList.push(...updatedTracks.slice(trackList.length));
    }
  }, 30000); // Check every 30 seconds for new tracks
}

/** Fetch Playlist Tracks */
async function fetchPlaylistTracks(playlistId) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json();
  return data.items;
}

/** Play a Specific Track */
async function playTrack(uri) {
  await fetch(`https://api.spotify.com/v1/me/player/play`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ uris: [uri] })
  });
}

/** Search and Play Individual Songs */
async function searchSong() {
  getAccessToken();
  const query = document.getElementById('searchInput').value;
  const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json();
  displaySearchResults(data.tracks.items);
}

function displaySearchResults(tracks) {
  const resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = '';
  tracks.forEach(track => {
    const trackDiv = document.createElement('div');
    trackDiv.textContent = `${track.name} - ${track.artists[0].name}`;
    trackDiv.onclick = () => playTrack(track.uri);
    resultsDiv.appendChild(trackDiv);
  });
}

getAccessToken();
