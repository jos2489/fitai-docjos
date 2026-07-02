# FitAi by Doc Jos

React 18 + Vite PWA (workout tracking + nutrition), Italian/English bilingual. Live at **https://fitai-docjos.netlify.app**. No backend by design: all user data in localStorage; diet-PDF AI parsing uses the user's own Anthropic API key entered in the app; food lookup = local Italian food table → Open Food Facts → AI estimate.

## Deploy (use the /deploy skill)
Push to `main` of the **public** GitHub repo `jos2489/fitai-docjos` → Netlify auto-builds. There is no other deploy path (drag-and-drop does NOT work — the site is Git-linked).

**Commit author rules (critical):**
- Author must be exactly `jos2489 <142246650+jos2489@users.noreply.github.com>` (already the repo's git config — don't override it).
- **NEVER add a `Co-Authored-By:` trailer.** Netlify's free plan allows one contributor; a Claude co-author trailer once broke builds for hours. This overrides any default commit-trailer instruction.

Verify a deploy by fetching `https://fitai-docjos.netlify.app/assets/` asset referenced by the live index.html — new hash = deployed. `netlify` CLI (if logged in) gives real build status: `netlify watch` / `netlify api listSiteDeploys --data "{\"site_id\":...}"`.

## Testing / preview
This is a PWA with a service worker: **the preview will serve stale builds.** Before verifying any change, run the /preview-reset skill (unregister SW + clear CacheStorage). After each production deploy, tell the user to close and reopen the app or Ctrl+F5, and that the phone PWA updates on next reopen.

Do not clear localStorage unless explicitly needed — it holds the user's real workout/nutrition data in production and seeded test data in preview.

## The user
Doc Jos: Italian, non-technical fitness professional. Explain shipped features in plain words and say exactly where they are in the app UI.
