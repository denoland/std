tree ./ > ./briefing/folders.md
concat --output ./briefing/READMEs.md ./domains/**/README.md
concat --output ./briefing/transcript-summaries.md ./transcripts/2024-12/**/*SUMMARY.md
concat --output ./briefing/basic-definitions.md ./domains/innovation/**/*
