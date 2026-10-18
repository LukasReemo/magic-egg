# Kouzelné vajíčko · Magic Egg

A calm Czech hatching timer for a preschool child. Choose 1–10 minutes, watch a gently moving illustrated egg, and meet one of 30 original animals. There are exactly three application states: ready, countdown and hatched. **Hotovo** ends the experience; it never starts another timer.

## Run locally

Use Node.js 22 or newer. No dependencies are required to build or serve the application. The sole development dependency is Playwright for browser tests.

```sh
npm ci
npm run dev
```

Open `http://localhost:4173/magic-egg/`. The server builds `dist/` on launch; restart it after source edits. It deliberately serves the GitHub Pages project prefix, so broken subpath URLs are caught locally. `PORT=4174 npm run dev` selects another port.

```sh
npm test                         # Node unit, state, asset and build checks
npx playwright install --with-deps chromium webkit
npm run test:browser              # Chromium portrait/landscape + WebKit landscape
npm run build                    # Static production files in dist/
```

On machines with a system Chromium, use `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser -- --project=chromium-portrait --project=chromium-landscape`. Playwright browser installations are development tools, never part of the deployed app. On restricted Linux systems the browsers may need administrator-installed system libraries. CI installs these with Playwright's supported helper.

## Implementation

- Plain HTML, CSS and ES modules; no frontend framework, backend, external font, analytics, CDN or runtime dependency.
- `src/timer.js`: minute boundaries, Czech grammar, deadline arithmetic and random selection. Cryptographic rejection sampling chooses uniformly among all 30 animals initially, then among the 29 other animals.
- `src/state.js`: a small versioned localStorage record holds duration, sound preference, previous animal and current session. Completion saves the selected animal **before** choreography begins. Reloading a finished timer preserves its result.
- `src/app.js`: three screen states, lifecycle synchronization, guarded completion, timeout cleanup and best-effort screen Wake Lock. The displayed seconds are derived from `Date.now()` and the saved deadline, never from an interval counter.
- `src/audio.js`: a quiet, original four-note Web Audio jingle, unlocked on a tap. Audio failures cannot stop visual completion.
- `style.css`: layered SVG shell animation, a roughly three-second hatch, character entrance and short CSS confetti. Reduced motion uses a brief direct reveal.
- All interface text, accessibility labels and animal names are Czech. Controls have generous touch targets, visible keyboard focus, safe-area support and responsive portrait/landscape layouts. Pinch zoom remains available.

## Artwork

All 30 animal illustrations are original local SVGs under `assets/animals/`, with stable IDs in `src/animals.js`. They use a consistent soft picture-book palette and individual full-body compositions: recognizable silhouettes, horns, trunks, spots, stripes, shells, fins and eight octopus arms. They are vector illustrations, not emoji, downloaded clip art or generated images requiring an online service.

Edit the SVGs directly or edit `scripts/draw-animals.py` and run `python3 scripts/draw-animals.py` to regenerate the full set. Shared drawing helpers cover lighting and facial details; each animal's anatomy is composed separately. If adding an animal in a future version, update definitions, artwork, the generator count assertion, and tests together. This release intentionally contains exactly 30.

The egg's independent top, bottom and crack layers live in `index.html`. The icons are local PNGs plus an SVG source in `assets/icon.svg`; maskable artwork has a padded safe area.

## Offline PWA and iPad installation

1. Open the deployed URL in Safari while connected to the internet. Let the initial visit finish loading so the service worker can precache the entire release, including every animal.
2. Choose **Sdílet → Přidat na plochu**, then **Přidat**. (Wording can vary with iPadOS language/version.)
3. Open the home-screen icon. Once caching has succeeded, the app and every animal work offline.

The build generates `dist/sw.js` with an explicit complete asset list and a content-based cache version. Installation is atomic: a failed asset fetch prevents activation. A new version waits until the old application's tabs/windows close, avoiding an update during a countdown. Reopen the app online to fetch an update, then close and reopen it after that download. Cache cleanup only removes this app's earlier caches at this scope. There is no network dependency after caching, although the OS can evict website data; revisiting online restores it.

## GitHub Pages deployment

The official Pages Actions workflow in `.github/workflows/pages.yml` tests and builds pull requests. Pushes to `main` and manual workflow runs also upload `dist/` with `actions/upload-pages-artifact` and deploy with `actions/deploy-pages`. Only the deployment job receives `pages: write` and `id-token: write`; it uses the `github-pages` environment.

Repository owner setup (one time):

1. In **LukasReemo/magic-egg → Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
2. In **Settings → Actions → General**, allow GitHub Actions and the official `actions/*` actions if an organization policy currently restricts them.
3. Merge the implementation PR into `main`. In **Actions**, check **Test and deploy GitHub Pages**. If the `github-pages` environment requires approval, approve its deployment.
4. Visit **https://lukasreemo.github.io/magic-egg/** after the deployment succeeds. For a private repository, GitHub Pages availability depends on the repository owner's GitHub plan; the app itself requires no paid services.

All application, icon, module, manifest and service worker paths are relative. The manifest start URL, ID and scope are `./`, supporting `/magic-egg/` without root-relative assumptions. There is no custom-domain requirement. Do not deploy the source tree directly; publish **dist/**.

## Reliability and known platform limits

The active deadline survives refresh and reopening. If Safari suspends the app past zero, it reveals the saved result on return. An active-page interval only refreshes the display; a visibility event immediately resynchronizes it. Completed sessions cannot complete twice. A bfcache return restores the appropriate screen. **Hotovo** or cancellation clears the session, retaining preferences and the previous animal.

- iOS may suspend JavaScript, audio and Wake Lock in the background. There are **no guaranteed background audio alerts or notifications**. Sound may remain unavailable until another tap; visuals always work.
- Wake Lock depends on browser support, power state and user settings. Manual system clock changes affect a wall-clock deadline.
- If storage is blocked/full, a small Czech notice explains that reopening cannot retain the session. Clearing Safari website data also removes saved state and offline files.
- The app is intended for one active window per device. Separate simultaneous tabs do not coordinate timers.
- Automated browser coverage uses desktop Chromium and Playwright WebKit at iPad-sized viewports. This is not a physical iPad hardware test; test sound, home-screen installation and device sleep on the family's iPad before relying on daily use.

## Validation in this implementation

The Node suite covers duration bounds/steps, Czech duration labels, MM:SS formatting, deadlines, background/resume, refresh, guarded completion, saved results, reset, preferences, corrupt/blocked storage, nonrepeating animal selection, exactly 30 local SVGs, manifest paths and generated cache coverage. Browser tests cover the complete flow, restored expired timers, reduced motion, viewport fit, offline reload and offline fetching of all 30 illustrations.

Verified in this workspace: **11 Node tests, 10 Chromium browser tests (both orientations), and 5 WebKit browser tests passed**; the production build and `git diff --check` also passed. Local WebKit used temporary Debian libraries and a launcher because this host does not permit system package installation. CI uses the standard browser installation shown above. Physical iPad testing remains a device-level follow-up.

Pages provisioning through the GitHub API returned `403 Resource not accessible by integration`; the manual **Settings → Pages → Source → GitHub Actions** selection above is required before the first deployment. This does not affect the app or pull request.

Review images: [portrait](docs/ready-portrait.png), [landscape](docs/ready-landscape.png), [hatched](docs/hatched-landscape.png). These development screenshots are excluded from the deployed app.
