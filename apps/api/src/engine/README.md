# engine/ — the single writer (LAW)
- One logical writer per market. Commands in via queue → validate → JOURNAL → apply → emit.
- Nothing in engine/ imports from http/ or ws/. Ever. (CI should grep for this.)
- This folder is the future standalone service / Rust rewrite. Keep it framework-free.
