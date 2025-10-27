# Strava Dashboard (Vite + React + Vercel)

A lightweight, modern dashboard that fetches your last 15 Strava rides (Ride, GravelRide, VirtualRide),
shows a clickable sidebar list, and renders analysis/graphs for the selected ride.

## One-time setup on Vercel
1. Import this repo into Vercel.
2. Add **Environment Variables** (Project Settings → Environment Variables):
   - `STRAVA_CLIENT_ID` = your Strava app client id
   - `STRAVA_CLIENT_SECRET` = your Strava app client secret
   - `STRAVA_REFRESH_TOKEN` = a valid refresh token obtained during OAuth
   - *(optional)* `VITE_DEFAULT_FTP` = your FTP for zone calc (defaults to 222)
3. Deploy. The dashboard will be served from `/` and serverless functions at `/api/strava/*`.

> TIP: Create your Strava API application at https://www.strava.com/settings/api.
> You only need the refresh token, which you can obtain once using the OAuth flow (outside this app).

## Local dev
```bash
npm i
npm run dev
```
Visit http://localhost:5173

## What it does
- Refreshes access token per request using your long-lived `STRAVA_REFRESH_TOKEN`.
- Fetches last 15 activities of type Ride/GravelRide/VirtualRide for the sidebar.
- On selection, loads power/heart rate streams and computes:
  - Normalized Power, HR drift, and zone distribution (FTP configurable).
- Dark, card-based UI with a text export button for coach-ready summaries.

## Notes
- Elevation is displayed in feet; distance in miles.
- The export button downloads a `.txt` file (easy to paste or share).
- No external UI frameworks—pure CSS + Recharts for charts.

Enjoy!
