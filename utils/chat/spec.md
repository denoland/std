# Overview

The module takes a shared conversation URL, extracts the conversation’s unique
ID, fetches and parses its HTML to obtain the conversation data and creation
time. It then formats the conversation into Markdown and saves it under a
filename derived from the conversation’s date and a shortened version of the ID.
In essence, it transforms a given URL into a clean Markdown file containing the
extracted chat.

## Formal Representation

We define the following functions:

- $g(u)$: Extract the conversation ID from URL $u$.
- $h(u)$: Fetch HTML content from URL $u$.
- $i(\text{html}, \text{id})$: Extract the creation time $t$ and conversation
  $C$ from the given HTML and ID.
- $d(t)$: Extract the date (YYYY-MM-DD) from timestamp $t$.
- $s(\text{id})$: Shorten the conversation ID.
- $f(t, \text{id})$: Construct the output filename using $d(t)$ and
  $s(\text{id})$.
- $w(\text{filename}, C)$: Write the Markdown conversation $C$ to the specified
  filename.

Putting it together:

$$ M(u) = w\bigl(f(t, g(u)), C\bigr) \text{ where } (t, C) = i(h(u), g(u)) $$

This equation expresses the entire module’s functionality as a composition of
these functions.
