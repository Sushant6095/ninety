# Visual references for Fix 1 (ticker) + Fix 2 (search)

## ⚠ ACTION — drop the screenshots here with these EXACT names

Sushant: save the images you pasted in chat into this folder, named exactly:

| Filename | What it shows |
|---|---|
| `ref-ticker.png` | The broadcast strap: "Match for 3rd place · Tomorrow · 02:30 France–England · Final · 20 Jul · 00:30 Spain–Argentina" |
| `ref-search-all.png` | Search open, "All" tab: Recent (Barcelona, Real Madrid) + Suggested (clubs, Ronaldo) |
| `ref-search-manager.png` | The "Manager" tab: Mourinho, Flick, Maresca… photo + club crest rows |
| `ref-search-match.png` | The "Match" tab: "England - Argentina (1:2)" style rows with date + competition |
| `ref-ours-ticker.png` | OUR current ticker (the mono one) — the before |
| `ref-ours-palette.png` | OUR current ⌘K palette (Canada v Morocco, 90') — the before |
| `ref-player-header.png` | Player page top: Ronaldo header, metadata strip, Previous match card, Matches table with rating chips |
| `ref-player-attributes.png` | Player page lower: Attribute Overview radar, year slider, compare box, prose summary |
| `ref-team-header.png` | Team page top: Barcelona crest/coach header, Previous + Next match cards, Matches panel, Standings tab |
| `ref-team-standings.png` | Team page lower: grouped match list by competition, Recent form strip, full standings with qualification zones |

Both prompts (`PROMPT-live-ticker.md`, `PROMPT-search-entities.md`) tell the terminal to **LOOK at these
files** before building. Claude Code can read images — pointing it at the real screenshot beats any prose.

The written spec below is the backup: it survives even if the images don't, and it's what "same font,
spacing and all" actually means in numbers. **Ninety tokens always win on colour** (ADR-049: the reference is
INTENT, not a pixel target — a screen SHOULD beat its reference). Match the *structure, rhythm and
hierarchy*; never copy their hex.

---

## Reference spec — the ticker (Fix 1)

- **Bar height** ~64px, chips vertically centred, generous horizontal breathing room between groups (~28px).
- **Group label** ("Match for 3rd place", "Final"): system font, **semibold**, white/`--text-hi`, ~15px.
- **Date label** ("Tomorrow", "20 Jul"): same size, **`--text-lo`**, sits immediately right of the group
  label with ~10px gap. This muted/bright pairing is what creates the hierarchy — the current all-mono bar
  has none, which is exactly why it reads as a log file.
- **Time chip** ("02:30", "00:30"): its own pill — lighter surface, radius ~10px, ~8px×12px padding,
  **mono + tabular-nums**, white.
- **Match chip**: contains time chip + `TeamName [flag] – [flag] TeamName`. Team names **system font
  semibold**, NOT mono. Flags ~22px, circular, ~8px from the name.
- **Chip container**: subtle lighter-than-bar surface, radius ~12px, ~10px×16px padding, hairline border.
- **The rule**: mono is reserved for time / minute / score / price. Everything else is the system font.

## Reference spec — the search palette (Fix 2)

**Input**
- Full-width, height ~56px, radius ~14px, surface bg, magnifier icon ~22px at left with ~16px inset.
- Placeholder `--text-lo`, ~17px: "Search matches, competitions, teams, players, and more".

**Category pills**
- Row directly under the input, ~12px gap, horizontally scrollable with a thin rounded scrollbar.
- Each pill: radius-full, ~10px×20px padding, ~15px system font.
- **Active** = filled light (in Ninety: `--up` fill with `--bg` ink, or `--surface` raised), inactive =
  dark surface + `--text-hi`.

**Section headers**
- "Recent" / "Suggested": ~15px, `--text-hi`, ~16px above / ~10px below.
- Right-aligned action ("CLEAR HISTORY"): uppercase, letter-spaced ~0.08em, ~13px, accent colour
  (theirs is violet — ours should be `--chain` or `--up`, never a new hex).

**Result row (the important one — ours is one line, theirs is two)**
- Row height ~72px for two-line rows, full-width hover highlight, ~16px horizontal padding.
- **Avatar**: 40px circular crest / player photo / flag at left, ~16px gap to the text.
- **Line 1**: name, system font **semibold**, ~17px, `--text-hi`. Optional `•` separator then a small icon +
  count (e.g. followers) in `--text-lo`.
- **Line 2** (meta): ~15px `--text-lo` — small flag/crest ~18px + country, `•`, sport/competition.
- **Right edge**: star (favourite) outline ~22px; `×` (remove) only on Recent rows; for matches, the live
  minute in `--up` **mono** or the kickoff time.
- **Match rows** specifically: two crests slightly overlapped, then `TeamA - TeamB (1:2)`, meta line =
  date + competition emblem + competition name.

**Ours today, for contrast** (`ref-ours-palette.png`): single-line rows, `MATCHES` uppercase header, two
crests, "Canada v Morocco" with a grey "v", minute right-aligned in green mono. The structure is already
right — what's missing is the **second meta line, the 40px avatars, the taller row rhythm, and the category
pills**. That's the whole delta.
