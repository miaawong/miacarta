# Miacarta Privacy Policy

_Last updated: June 30, 2026_

Miacarta is a personal vocabulary flashcards app built by Mia Wong. This policy explains what data the app collects, how it's stored, and what your rights are.

## What we collect

We collect only what's needed to make the app work for you across devices:

- **Account identifier.** When you first open the app, an anonymous account is created on Supabase (our backend) so your words can be stored. If you choose to link an email or Google account, your email address and the OAuth provider's user ID are also stored.
- **Your content.** The words, books, definitions, notes, and review history you create in the app.
- **No analytics, tracking, advertising, or device identifiers** are collected. The app does not use third-party trackers, ad SDKs, or fingerprinting.

## How data is stored and shared

- All data is stored in **Supabase** (Postgres), which acts as our cloud database and authentication provider. Supabase's privacy policy: https://supabase.com/privacy
- When you look up a word, the word you typed (only that word, no other info) is sent to:
  - **Free Dictionary API** (`api.dictionaryapi.dev`) for the definition.
  - **Wiktionary** (`wiktionary.org`) as a fallback when the primary dictionary has no entry.
  - **Datamuse** (`api.datamuse.com`) for autocomplete suggestions as you type.
- These lookups are not logged or linked to your account by Miacarta.
- If you sign in with Google, Google receives the standard OAuth login info (your email, profile picture, name) and shares the same with us so we can authenticate you. Google's privacy policy: https://policies.google.com/privacy

We do **not** sell, rent, or share your data with anyone outside of these services. We do not access your contacts, photos, location, microphone, camera, or any other device sensors.

## Your rights

- **Access:** All of your data is visible in the app itself.
- **Edit:** You can edit or delete any word or book at any time.
- **Delete account:** To delete your account and all associated data, email the address below. We will remove your data from Supabase within 14 days.
- **Export:** Email us if you want a copy of your data as a JSON file.

If you're in the EU, UK, or California, you have additional rights under GDPR and CCPA — primarily the same rights listed above, plus the right to object to or restrict processing. Email us to exercise any of these.

## Children

Miacarta is not directed at children under 13. We do not knowingly collect data from children. If you believe a child has created an account, email us and we'll delete it.

## Changes to this policy

If we change this policy, we'll update the "Last updated" date above. Material changes (anything affecting what data is collected or shared) will be announced in-app before taking effect.

## Contact

For any questions or requests related to this policy, email: **miawongdev@gmail.com**
