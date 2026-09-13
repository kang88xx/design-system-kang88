import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.join(root, "figma", "figma-variables.json");
const outputPath = path.join(root, "figma", "tokens-studio.json");
const document = JSON.parse(await readFile(inputPath, "utf8"));

const allowedTypes = new Set(["BOOLEAN", "COLOR", "FLOAT", "STRING"]);
const collectionNames = new Set(document.collections.map((collection) => collection.name));
const variablesByReference = new Map();

for (const collection of document.collections) {
  if (!collection.name || !Array.isArray(collection.modes) || collection.modes.length === 0) {
    throw new Error(`Invalid collection: ${collection.name || "<unnamed>"}`);
  }

  const localNames = new Set();
  for (const variable of collection.variables) {
    if (!allowedTypes.has(variable.type)) {
      throw new Error(`Unsupported Figma variable type: ${variable.type}`);
    }
    if (localNames.has(variable.name)) {
      throw new Error(`Duplicate variable in ${collection.name}: ${variable.name}`);
    }
    localNames.add(variable.name);

    for (const mode of collection.modes) {
      if (!(mode in variable.values)) {
        throw new Error(`Missing ${mode} value for ${collection.name}/${variable.name}`);
      }
    }

    variablesByReference.set(`${collection.name}/${variable.name}`, variable);
  }
}

for (const collection of document.collections) {
  for (const variable of collection.variables) {
    for (const value of Object.values(variable.values)) {
      if (value && typeof value === "object" && "alias" in value) {
        const aliasCollection = value.alias.split("/")[0];
        if (!collectionNames.has(aliasCollection) || !variablesByReference.has(value.alias)) {
          throw new Error(`Unresolved alias: ${value.alias}`);
        }
      }
    }
  }
}

function setNested(target, name, token) {
  const segments = name.split("/");
  const leaf = segments.pop();
  let cursor = target;
  for (const segment of segments) cursor = cursor[segment] ??= {};
  cursor[leaf] = token;
}

function tokensStudioType(variable) {
  if (variable.type === "COLOR") return "color";
  if (variable.type === "BOOLEAN") return "boolean";
  if (variable.type === "STRING") return "string";
  if (variable.unit === "px") return "dimension";
  if (variable.unit === "ms") return "duration";
  return "number";
}

function tokensStudioValue(variable, value) {
  if (value && typeof value === "object" && "alias" in value) {
    const [, ...tokenPath] = value.alias.split("/");
    return `{${tokenPath.join(".")}}`;
  }
  if (variable.unit === "px") return `${value}px`;
  if (variable.unit === "ms") return `${value}ms`;
  return value;
}

const output = {};
const order = [];

for (const collection of document.collections) {
  for (const mode of collection.modes) {
    const setName = collection.modes.length === 1
      ? collection.name.toLowerCase()
      : `${collection.name.toLowerCase()}-${mode.toLowerCase()}`;
    const tokenSet = {};

    for (const variable of collection.variables) {
      setNested(tokenSet, variable.name, {
        value: tokensStudioValue(variable, variable.values[mode]),
        type: tokensStudioType(variable),
      });
    }

    output[setName] = tokenSet;
    order.push(setName);
  }
}

output.$metadata = { tokenSetOrder: order };
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);

const variableCount = document.collections.reduce(
  (count, collection) => count + collection.variables.length,
  0,
);
console.log(`Validated ${document.collections.length} collections and ${variableCount} variables.`);
console.log(`Generated ${path.relative(root, outputPath)} with ${order.length} token sets.`);
