# Miacarta

Personal vocab flashcards for words you collect while reading. Look up definitions, tag them by book, and quiz yourself with spaced repetition.

## First-run setup (do these once)

1. **Enable anonymous sign-ins in Supabase**
   - Dashboard → Authentication → Providers → Anonymous → toggle **Enabled** → Save
   - Without this, the app can't sign you in on first open.

2. **Create the database tables**
   - Dashboard → SQL Editor → New query
   - Paste the contents of `SCHEMA.sql` from this repo → **Run**

3. **Install Expo Go on your iPhone** (App Store)

## Running the app

```bash
cd vocab-cards
npm start
```

Scan the QR with your iPhone camera. Phone and computer must be on the same Wi-Fi.

## OAuth setup (optional — needed for Google / Apple sign-in)

Email/password works with no extra setup. To enable Google or Apple, configure them in Supabase:

### Google

1. **Google Cloud Console** → APIs & Services → Credentials → Create Credentials → **OAuth Client ID** → Web application
2. Add authorized redirect URI: `https://jwptckzighooftpdyobe.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret**
4. **Supabase Dashboard** → Authentication → Providers → Google → toggle Enabled, paste Client ID + Secret → Save
5. **Supabase Dashboard** → Authentication → URL Configuration → add `miacarta://auth-callback` to **Redirect URLs**

### Apple

Requires an **Apple Developer account ($99/yr)** to set up:

1. **Apple Developer** → Certificates, Identifiers & Profiles → create a **Services ID**
2. Configure Sign In with Apple capability, add return URL: `https://jwptckzighooftpdyobe.supabase.co/auth/v1/callback`
3. Create a **Key** with Sign In with Apple enabled, download the `.p8` file
4. **Supabase Dashboard** → Authentication → Providers → Apple → paste Services ID, Team ID, Key ID, and the contents of the `.p8` file → Save
5. **Supabase Dashboard** → Authentication → URL Configuration → confirm `miacarta://auth-callback` is in **Redirect URLs**

### For local Expo Go testing

In Expo Go, the redirect URL is dynamic (an `exp://...` URL with your LAN IP). After OAuth redirects back, expo-auth-session captures it. If the redirect ever fails, the actual URL appears in the Expo console — copy it and add to Supabase's Redirect URLs list while testing.

## What's in here

- `app/` — screens (file-based routing via `expo-router`)
  - `(tabs)/` — Review, Library, Add Word, Settings
  - `book/[id].tsx`, `word/[id].tsx` — detail/edit screens
  - `sign-in.tsx` — sign in to an existing account on a new device
- `lib/`
  - `supabase.ts` — Supabase client + anonymous auth
  - `auth-helpers.ts` — email/OAuth/sign-out flows
  - `dictionary.ts` — Free Dictionary API + Wiktionary fallback + Datamuse autocomplete
  - `srs.ts` — SM-2 spaced-repetition algorithm with pace multiplier
  - `prefs.ts` — AsyncStorage-backed prefs (review pace)
  - `db.ts` — typed CRUD wrappers
- `constants/theme.ts` — colors, spacing, type tokens
- `SCHEMA.sql` — paste into Supabase SQL editor

## Eventually shipping to the App Store

When ready (no rush):

1. Apple Developer account ($99/yr)
2. `npx eas-cli build --platform ios`
3. Submit via `eas submit`

App Store note: because you offer Sign In with Apple, you're free to also offer Google + Email — Apple's rule only blocks offering other social logins *without* Apple.
