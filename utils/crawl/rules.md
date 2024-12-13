# Rules

These are the rules that must be followed when generating the software for this
project.

1. Update the Deno DOM imports to use `wasm-noinit` and call `initParser()`
   before parsing HTML.
2. Utilize `htmlToText` to convert HTML into a plain text format suitable for
   LLM consumption.
3. Write extracted text to a file (`crawl.txt`) as the crawl progresses, rather
   than collecting it at the end.
4. Print links immediately after visiting each page, instead of only returning
   them at the end.
5. Reduce whitespace in the code for a more compact, inline style.
