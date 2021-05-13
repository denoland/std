// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// Based on: https://github.com/nodejs/node/blob/0646eda/lib/constants.js

import { constants as fsConstants } from "./fs.ts";
import { constants as osConstants } from "./os.ts";

export default {
  ...fsConstants,
  ...osConstants.dlopen,
  ...osConstants.errno,
  ...osConstants.signals,
  ...osConstants.priority,
};
