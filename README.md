# Ali Awada Portfolio

A portfolio recreation based on the current Ali Awada site. The splash screen, navigation, work covers, About page, and contact details are included. Talking head, Reels, and Video editing use a vertical, scroll-snapping reel feed with a full-screen portrait player, likes, comments, and sharing. Branding and Social Media use an image gallery with a lightbox and the same community controls.

## Run locally

```sh
npm install
npm run dev
```

The site runs on Vite and the API runs alongside it on port 3002. Without Drive configured, the site uses small reference previews so its layout is visible.

## Connect Google Drive

The server checks Drive once per minute while it runs. New images and videos appear in their matching sections after the next refresh.

For a folder shared as **Anyone with the link — Viewer**, copy its URL to `GOOGLE_DRIVE_ROOT_FOLDER`. The app discovers matching child folders by name (Talking Head, Reels, Branding/Logo, Video Editing, Social Media) and reads their media. The root and section folders must remain link-accessible.

For private folders, enable the Google Drive API in a Google Cloud project, create a service account, and download its JSON key into the project root as `google-service-account.json` (or set `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` to its path). Share each section folder with the service account email as a Viewer, then set the five `GOOGLE_DRIVE_FOLDER_*` values to their IDs or URLs.

Copy `.env.example` to `.env`, configure one of these modes, and restart the app. The service account key stays on the server. Media is streamed through the API with byte-range support; uploads remain in Google Drive.

Likes and comments are stored by the API in `server/data/community.json`. A browser-only fallback uses local storage if the API is unavailable. Sharing uses the device share sheet when supported and copies the link otherwise.

## Production

```sh
npm run build
npm start
```

The server serves the built site and API from one origin. Keep `.env`, the service-account key, and `server/data/community.json` on persistent private storage.
