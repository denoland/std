tree ./ > ./commander-briefing/folders.txt
concat --output ./commander-briefing/READMEs.md ./domains/**/README.md
concat --output ./commander-briefing/transcript-summaries.md ./data/transcripts/2024-12/**/*SUMMARY.md
concat --output ./commander-briefing/basic-definitions.md ./domains/innovation/**/*
