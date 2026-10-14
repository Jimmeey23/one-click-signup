import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const source = await fs.readFile(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile(
  "root.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let factory;
const visit = (node) => {
  if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "scripts")
    factory = node.initializer.getText(ast);
  ts.forEachChild(node, visit);
};
visit(ast);
assert.ok(factory, "Root tracker factory is present");
const javascript = ts.transpileModule(
  `(${factory.replaceAll("import.meta.env", "fixtureEnv")})()`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } },
).outputText;

for (const gtm of ["GTM-EXAMPLE\n", undefined]) {
  const fixtureEnv = {
    VITE_GTM_ID: gtm,
    VITE_GA_MEASUREMENT_ID: "G-EXAMPLE",
    VITE_GOOGLE_ADS_ID: "AW-EXAMPLE",
    VITE_META_PIXEL_ID: "123",
    VITE_SNAP_PIXEL_ID: "456",
    VITE_CLARITY_PROJECT_ID: "789",
  };
  const scripts = vm.runInNewContext(javascript, { fixtureEnv });
  assert.equal(
    scripts.some((script) => script.id === "gtag-loader"),
    !gtm,
    "Only standalone configuration loads gtag directly",
  );
  const listeners = new Map();
  const pending = [];
  const loadListeners = [];
  const downloads = [];
  const css = {
    media: "print",
    sheet: null,
    addEventListener(name, callback) {
      listeners.set(`css:${name}`, callback);
    },
  };
  const document = {
    readyState: "loading",
    getElementById() {
      return css;
    },
    createElement() {
      return {};
    },
    head: {
      appendChild(script) {
        downloads.push(script.src);
      },
    },
    getElementsByTagName() {
      return [
        {
          parentNode: {
            insertBefore(script) {
              downloads.push(script.src);
            },
          },
        },
      ];
    },
  };
  const context = {
    document,
    Date,
    setTimeout(callback) {
      pending.push(callback);
    },
  };
  context.window = context;
  context.addEventListener = (name, callback) => loadListeners.push(callback);
  context.requestIdleCallback = (callback) => pending.push(callback);
  vm.createContext(context);
  for (const script of scripts) vm.runInContext(script.children, context);
  assert.equal(downloads.length, 0, "No network downloads before load/idle");
  assert.equal(context.fbq.queue.length, 2, "Meta init and pageview queued");
  assert.equal(context.snaptr.queue.length, 2, "Snap init and pageview queued");
  context.gtag("event", "signup_start", { test: true });
  assert.equal(context.dataLayer.at(-1)[0], "event", "Funnel event retained before Google loads");
  const configs = Array.from(context.dataLayer).filter((entry) => entry[0] === "config");
  assert.equal(
    configs.filter((entry) => entry[1] === "G-EXAMPLE").length,
    1,
    "GA initialized once",
  );
  assert.equal(
    configs.filter((entry) => entry[1] === "AW-EXAMPLE").length,
    gtm ? 0 : 1,
    "GTM owns Ads; standalone still initializes Ads",
  );
  listeners.get("css:load")();
  assert.equal(css.media, "all", "Full stylesheet activated after load");
  for (const callback of loadListeners) callback();
  while (pending.length) pending.shift()();
  assert.equal(downloads.length, 4, "All configured providers loaded");
  assert.equal(downloads.filter((url) => url.includes("gtm.js")).length, gtm ? 1 : 0);
  assert.equal(downloads.filter((url) => url.includes("gtag/js")).length, gtm ? 0 : 1);
  assert.ok(
    downloads.every((url) => !url.includes("\n")),
    "Tracker IDs are trimmed",
  );
}
console.log(
  "Tracker queues, Google ownership, fallback loading and async stylesheet checks passed",
);
