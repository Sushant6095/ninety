# Typography

## Families

| Token | Family | Use |
|---|---|---|
| `fonts-sans` / `global-font-body` | **Sofascore Sans** | Everything — UI, labels, numbers |
| `fonts-condensed` | **Sofascore Sans Condensed** | Tight spaces: long team names, table cells, dense chips |
| fallback stack | `Arial Unicode MS, -apple-system, system-ui, Segoe UI, Helvetica, Arial…` | Broad glyph coverage (they serve global sports) |

**Observation:** SofaScore invested in a *proprietary typeface family* (a sans + a condensed
companion) rather than pairing a display serif with a sans. For a data product this is the right
call — the condensed cut is the real hero, because it lets long competition and team names fit in
narrow cells without truncation while staying on-brand. There is **no separate display font**; the
same family scales from 10px labels to the 28px score.

The fallback stack leads with `Arial Unicode MS` — a deliberate choice for a product rendering
Cyrillic, CJK, Arabic team names worldwide before the web font loads.

## Scale (7 sizes, capped at 28px)

```
2xs 10px · xs 12px · sm 14px · md 16px · lg 18px · xl 20px · 2xl 28px
```
- **10–12px** — metadata: minute markers, "FT", country labels, stat captions.
- **14px** — the workhorse for list rows, table cells, secondary labels.
- **16px** — body/default, primary row titles.
- **18–20px** — section headers, emphasized names.
- **28px** — the *largest thing in the product*: the match score, a section hero number.

There is no 40/48/64px display type. A live-data product earns hierarchy from **weight, color, and
position**, not from size jumps. This is the discipline most AI-generated dashboards miss.

## Weights (only three)

`400` (regular) · `500` (medium) · `700` (bold). Confirmed by scanning every text node — no 300,
no 600, no 800. Hierarchy is built almost entirely from **500 vs 700 + color opacity**, e.g. a
match row is: away team `400 @ 70%`, home/winner `700 @ 100%`, minute `400 @ 45%`.

## Numeric treatment (critical for a data/trading product)

- **Tabular figures everywhere numbers matter** — `font-variant-numeric: tabular-nums` was active on
  dozens of nodes (scores, tables, times, ratings). Columns of numbers align to the pixel and don't
  jitter when values change live.
- Scores render at **28px / 700**, still in the body family (no separate mono/display face).
- Ratings render as one-decimal (`7.9`, `9.1`) in colored badges — one decimal is the fixed
  precision, matching our own "prices one decimal" rule.

## Line-height / tracking

Data rows are tight (single line, no generous leading) — the product optimizes for *rows per
screen*. Body copy (news, tooltips, explanatory blurbs) gets normal leading. There is no dramatic
negative tracking on large type because there *is* no large type.

## Takeaways for Ninety

1. **One family, two cuts (regular + condensed).** Our stack is Archivo (display) + Inter (UI); the
   transferable lesson is that a **condensed cut for dense numeric cells** would earn its keep in
   tables, tickers, and the leaderboard where names + numbers compete for width.
2. **Cap the type scale low and build hierarchy from weight + opacity + color**, exactly as
   SofaScore does. Reserve any genuinely large type for the *one* hero number — for us, the live
   **price** (analogous to their 28px score, but we can go bolder because it's our signature).
3. **Tabular numerals are non-negotiable** on every price, size, time, and stat — we already mandate
   this; SofaScore confirms it's the backbone of a calm data grid.
4. **Three weights max** (we already use Archivo/Inter deliberately; keep weight count tight).
