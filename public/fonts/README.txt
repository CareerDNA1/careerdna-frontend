CareerDNA self-hosted fonts
===========================

The app no longer loads Geist from fonts.googleapis.com. It expects the font
files to live in this folder and be served from /fonts/.

One step to finish the switch:

1. Download the Geist font release from
   https://github.com/vercel/geist-font/releases
   (or the repo folder fonts/Geist/webfonts).

2. Copy ONE of the following into this folder:

   Option A (recommended, single variable file):
     Geist[wght].woff2

   Option B (static weights, if you prefer):
     Geist-Regular.woff2   (400)
     Geist-Medium.woff2    (500)
     Geist-SemiBold.woff2  (600)
     Geist-Bold.woff2      (700)
     Geist-ExtraBold.woff2 (800)

   Optional, for code and tabular figures:
     GeistMono[wght].woff2

3. If you chose Option B, replace the single @font-face block at the top of
   src/styles/global.css with one block per weight, each pointing at the
   matching file and declaring its font-weight.

Until the files are present the browser falls back to the system font stack
(-apple-system, Segoe UI, Roboto, sans-serif) with font-display: swap, so
nothing breaks, the type is just the system face.
