import { jsdom as instance } from "./vendor/jsdom.js";
import { jsdom } from "./types/jsdom.ts";

export const JSDOM = instance.JSDOM as jsdom.JSDOM;
