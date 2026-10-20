#!/usr/bin/env node
/**
 * Merge per-module locale fragments into the source locale files.
 *
 * Usage:
 *   node scripts/i18n-merge-fragments.mjs
 *   node scripts/i18n-merge-fragments.mjs --clean
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES_DIR = path.join(ROOT, "ui", "src", "i18n", "locales");
const FRAGMENTS_DIR = path.join(LOCALES_DIR, "fragments");
const LOCALES = ["en", "zh-CN"];
const CLEAN = process.argv.includes("--clean");
const FORCE = process.argv.includes("--force");

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function merge(target, source, pathParts) {
  for (const [key, value] of Object.entries(source)) {
    const current = target[key];
    if (isPlainObject(value)) {
      if (current !== undefined && !isPlainObject(current)) {
        if (!FORCE) {
          throw new Error(`${pathParts.concat(key).join(".")} exists as a string; cannot merge an object`);
        }
        target[key] = {};
      } else {
        target[key] = current ?? {};
      }
      merge(target[key], value, pathParts.concat(key));
      continue;
    }
    if (current !== undefined && current !== value) {
      if (!FORCE) {
        throw new Error(
          `${pathParts.concat(key).join(".")} already exists with a different value`,
        );
      }
      target[key] = value;
      continue;
    }
    target[key] = value;
  }
}

function main() {
  if (!fs.existsSync(FRAGMENTS_DIR)) {
    console.log("No fragments directory; nothing to merge.");
    return;
  }

  const fragmentFiles = fs.readdirSync(FRAGMENTS_DIR).filter((name) => name.endsWith(".json"));
  if (fragmentFiles.length === 0) {
    console.log("No fragment files; nothing to merge.");
    return;
  }

  for (const locale of LOCALES) {
    const localeFile = path.join(LOCALES_DIR, `${locale}.json`);
    const messages = JSON.parse(fs.readFileSync(localeFile, "utf8"));
    const localeFragments = fragmentFiles.filter((name) => name.endsWith(`.${locale}.json`));
    for (const fragment of localeFragments) {
      const contents = JSON.parse(fs.readFileSync(path.join(FRAGMENTS_DIR, fragment), "utf8"));
      merge(messages, contents, []);
      console.log(`merged ${fragment}`);
    }
    fs.writeFileSync(localeFile, `${JSON.stringify(messages, null, 2)}\n`);
  }

  if (CLEAN) {
    for (const fragment of fragmentFiles) {
      fs.unlinkSync(path.join(FRAGMENTS_DIR, fragment));
    }
    console.log("removed merged fragments");
  }
}

main();
