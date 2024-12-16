# @dreamcatcher/chat

## Overview

**@dreamcatcher/chat** extracts and reconstructs shared conversations from AI
chat interfaces. It focuses on retrieving single conversations via public shared
URLs. **Note:** This tool only works if the chat has been publicly shared on the
ChatGPT web app.

## Installation

To use this tool as a CLI command, first ensure you have Deno installed. Then
run:

```sh
deno install --global --allow-read --allow-write --allow-env --allow-net=jsr.io,chatgpt.com jsr:@dreamcatcher/chat
```

After this, `chat` will be available as a system-wide command.

> Note: The `--allow-net` permission is required to check for package updates
> from the jsr.io registry and to fetch conversations from chatgpt.com.

## Usage

Once installed as a CLI command, simply execute:

```bash
chat https://chatgpt.com/share/675e1d90-0408-800b-b7e8-db1ded459182 [--output filename]
```

Where:

- **URL** is the link to a publicly shared conversation HTML page (of the form
  `https://chatgpt.com/share/<GUID>`).
- **--output filename** (optional) lets you specify a custom output filename. By
  default, the conversation will be saved as `chat_<timestamp>_<guid>.md`, where
  `timestamp` is the conversation's ISO 8601 creation date (YYYY-MM-DD) and
  `guid` is a shortened version of the conversation ID extracted from the URL.

## What It Does

1. **Fetch HTML**: The tool requests the provided URL.
2. **Extract JSON**: It searches the first `<script>` tag containing the state
   JSON object.
3. **Identify Server Response**: Using the `sharedConversationId` derived from
   the URL's GUID, the tool locates the associated `serverResponse` object.
4. **Reconstruct Conversation**: The `extract` function returns
   `[timestamp, conversationMarkdown]`. The timestamp is derived from the
   conversation's creation time, and `conversationMarkdown` is a clean, readable
   Markdown representation of the conversation.
5. **Output as Markdown**: If no custom filename is provided, the output file
   follows the pattern:

   ```
   chat_<timestamp>_<guid>.md
   ```

   The `<timestamp>` and `<guid>` form a unique, descriptive filename for the
   conversation.

## Example

```bash
chat https://chatgpt.com/share/675e1d90-0408-800b-b7e8-db1ded459182
```

This command will produce a file like:

```
chat_2024-03-20_abcd.md
```

You can also specify a custom filename:

```bash
chat https://chatgpt.com/share/675e1d90-0408-800b-b7e8-db1ded459182 --output my_conversation.md
```

This will produce `my_conversation.md` containing the fully reconstructed chat.

## Requirements

- Deno (latest stable)
- Permissions:
  - `--allow-read` to read files
  - `--allow-write` if using `--output` option
  - `--allow-net` to fetch the conversation data from chatgpt.com and check for
    updates from jsr.io

## Upgrading the CLI command

```sh
deno install --global --reload --force --allow-read --allow-write --allow-env --allow-net=jsr.io,chatgpt.com jsr:@dreamcatcher/chat
```
