// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/** Represents IRCv3 tags parsed as an object. */
export type ParsedTags = { [tag: string]: string | boolean };

/** MessageData is a parsed representation of a client message */
export interface MessageData {
  tags: ParsedTags;
  prefix: string;
  command: string;
  params: string[];
}

const RFC1459MaxMessageLength = 512;

/**
 * `parse` expects a full IRC message WITHOUT
 * an ending CRLF sequence. Implementations should
 * remove the CRLF before passing the string to this
 * function.
 *
 * TODO: make more robust
 *
 * @export
 * @throws {InvalidMessageException}
 * @returns {MessageData}
 */
export function parse(message: string): MessageData {
  if (message.length > RFC1459MaxMessageLength) {
    throw new InvalidMessageException("Message cannot exceed 512 characters.");
  }

  if (message.endsWith("\r\n")) {
    throw new InvalidMessageException(
      "CRLF must be removed from string before using parse."
    );
  }

  let tags: ParsedTags = {};
  let prefix = "";
  let command: string;
  let params: string[] = [];
  let index = 0;
  const messageParts = message.split(" ");

  // check for tags
  if (messageParts[index].startsWith("@")) {
    tags = parseTagsToJSON(messageParts[index]);
    index++;
  }

  // check for possible prefix
  if (messageParts[index].startsWith(":")) {
    prefix = messageParts[index];
    index++;
  }

  command = messageParts[index];
  index++;

  // iterate through params and add them one at a time,
  // possibly concatenating any message after another colon (":")
  // into one string as the last parameter
  for (let i = index; i < messageParts.length; i++) {
    const currentPart = messageParts[i];

    // any param that starts with a colon is the last param with whitespace
    // included
    if (currentPart.startsWith(":")) {
      const remainingParts = messageParts.slice(i);
      const lastParam = remainingParts.reduce(
        (prev, curr) => `${prev} ${curr}`
      );
      params.push(lastParam);
      break;
    }

    params.push(currentPart);
  }

  return {
    tags,
    prefix,
    command,
    params
  };
}

function parseTagsToJSON(tags: string): ParsedTags {
  const parsedTags: ParsedTags = {};
  const strWithoutSymbol = tags.substring(1);
  const tagParts = strWithoutSymbol.split(";");

  for (const part of tagParts) {
    const [key, value] = part.split("=");
    if (value === "") {
      parsedTags[key] = "";
    } else if (!value) {
      parsedTags[key] = true;
    } else {
      parsedTags[key] = value;
    }
  }

  return parsedTags;
}

/** Indicates that there was an invalid message passed to `parse` */
export class InvalidMessageException extends Error {}
