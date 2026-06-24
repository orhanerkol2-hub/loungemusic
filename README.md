# LoungeMusic Landing Page

Premium, responsive landing page for the LoungeMusic YouTube channel.

## What is included

- Luxury black/gold lounge-music design
- Mobile-optimized responsive layout
- Hero section with premium channel positioning
- Dynamic YouTube video area
- YouTube uploads playlist fallback
- Optional YouTube Data API v3 integration for live video cards
- GitHub Pages-ready static setup

## Files

```text
index.html    Main landing page
styles.css    Full responsive design
script.js     YouTube integration and UI logic
.nojekyll     GitHub Pages helper
```

## Activate GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings** → **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main** and folder **/** root.
5. Save.

GitHub will publish the page after the first Pages build.

## Connect your YouTube videos

Open `script.js` and edit the `CHANNEL` configuration.

### Simple live option: Uploads playlist embed

Find your YouTube Channel ID. It starts with `UC`.

Then create the Uploads Playlist ID by replacing the first `UC` with `UU`.

Example:

```js
// Channel ID
UCabc123xyz

// Uploads playlist ID
UUabc123xyz
```

Then add it here:

```js
uploadsPlaylistId: "UUabc123xyz"
```

This keeps the featured player dynamically connected to your newest uploads without an API key.

### Advanced option: YouTube Data API video cards

For live thumbnail cards, add:

```js
youtubeApiKey: "YOUR_RESTRICTED_BROWSER_API_KEY",
youtubeChannelId: "UCabc123xyz"
```

Important: Restrict the API key in Google Cloud to your GitHub Pages domain.

## Brand fields to update

In `script.js`, update:

```js
name: "LoungeMusic",
handle: "@LoungeMusiq",
channelUrl: "https://www.youtube.com/@LoungeMusiq"
```

Use your exact YouTube handle and channel URL.
