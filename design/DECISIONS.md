# Design decisions log (paste deltas into every Claude Design prompt)
- Halts are amber, never red.
- Violet appears only on on-chain UI (proof badge, moments, claims).
- River plots to 90'; unplayed time stays empty.
- Every number is IBM Plex Mono tabular, one decimal.
- Every page renders through one AppShell (TerminalHeader + Footer); Moments leads with a hero, never a uniform grid.
- Standings/qualification highlights use a neutral tint; up-green and down-pink stay price-only (ADR-051).
- The halt is the terminal's cold-open money-shot (GSAP cliff-draw/sweep/wash choreography), never reduced to a static amber watermark (ADR-054).
- `/` is the landing (hyperfoundation restraint: one filled CTA per page, repeated verbatim, never multiplied; violet proof chapter is the page's only chain surface); the board lives at `/board` — board-intent links point there, wordmark/sign-out keep `/` (ADR-056).
