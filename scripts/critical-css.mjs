import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { compile } from "@tailwindcss/node";
import { transform } from "lightningcss";

// Compile the same theme/reset as the full stylesheet with only landing-page classes.
// Extract string literals (including conditional/template classes) rather than maintaining
// a hand-written list that can lose desktop breakpoints or form interaction states.
export async function landingCriticalCss(root) {
  const candidates = new Set();
  const landing = await fs.readFile(path.join(root, "src/components/OpenBarreLanding.tsx"), "utf8");
  const source = ts.createSourceFile(
    "landing.tsx",
    landing,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const visit = (node) => {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      for (const candidate of node.text.split(/\s+/)) if (candidate) candidates.add(candidate);
    }
    ts.forEachChild(node, visit);
  };
  const names = new Set([
    "Header",
    "Stat",
    "SignupCard",
    "Field",
    "ConsentLine",
    "DeferredSignaturePad",
  ]);
  for (const node of source.statements) {
    if (ts.isFunctionDeclaration(node) && names.has(node.name?.text)) visit(node);
  }
  const heroStart = landing.indexOf('<section className="hero-shell');
  const heroEnd = landing.indexOf("</section>", heroStart) + "</section>".length;
  if (heroStart < 0 || heroEnd <= heroStart)
    throw new Error("Cannot find landing hero for critical CSS");
  visit(
    ts.createSourceFile(
      "hero.tsx",
      "<>" + landing.slice(heroStart, heroEnd) + "</>",
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
  );
  visit(
    ts.createSourceFile(
      "signature.tsx",
      await fs.readFile(path.join(root, "src/components/SignaturePad.tsx"), "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
  );
  candidates.add("min-h-screen");
  const full = await fs.readFile(path.join(root, "src/styles.css"), "utf8");
  // The reset, theme, hero, form, logo and fonts are needed for the first viewport.
  // Policy pages, galleries and other later sections keep their external styles.
  const base = full.slice(0, full.indexOf(".feature-card"));
  const form = full.slice(full.indexOf(".signup-card input"), full.indexOf("/* Marquee */"));
  const logo = full.slice(
    full.indexOf("@keyframes brand-logo-breathe"),
    full.indexOf(".animate-marquee"),
  );
  const fonts = full.slice(full.indexOf("@font-face"));
  const input = (base + form + logo + fonts).replace('@source "../src";', "");
  const compiler = await compile(input, { base: path.join(root, "src"), onDependency() {} });
  return transform({
    filename: "landing-critical.css",
    code: Buffer.from(compiler.build([...candidates])),
    minify: true,
  }).code.toString();
}

export function criticalCssPlugin() {
  const id = "virtual:p57-critical-css";
  let root;
  let cached;
  return {
    name: "p57-critical-css",
    configResolved(config) {
      root = config.root;
    },
    resolveId(source) {
      if (source === id) return "\0" + id;
    },
    async load(source) {
      if (source !== "\0" + id) return;
      cached ??= landingCriticalCss(root);
      return `export default ${JSON.stringify(await cached)};`;
    },
    handleHotUpdate(ctx) {
      if (!ctx.file.endsWith(".tsx") && !ctx.file.endsWith("styles.css")) return;
      cached = undefined;
      const mod = ctx.server.moduleGraph.getModuleById("\0" + id);
      if (mod) {
        ctx.server.moduleGraph.invalidateModule(mod);
        return [...ctx.modules, mod];
      }
    },
  };
}
