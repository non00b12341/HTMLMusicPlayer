# Music Player

Static HTML music player prepared for GitHub Pages.

## Publish

1. Open **Settings → Pages** in this repository.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Open the **Actions** tab and check the “Deploy music player to GitHub Pages” workflow.

The workflow deploys the repository root when changes are pushed to `main`.

## Audio files

The player expects these MP3 files under `songs/`:
- `01-katyusha.mp3`
- `02-on-the-22nd-of-june.mp3`
- `03-sacred-war.mp3`
- `04-smuglianka.mp3`
- `05-farewell-of-slavianka.mp3`
- `06-kalinka.mp3`

**Important:** The current repository entries for these MP3 paths are empty placeholders. Upload the actual MP3 files at those paths or the player will load without playable audio.
