/* eslint-disable */
const fs = require("fs");
const path = require("path");

const roots = ["app", "components", "providers", "features", "hooks"];
const exts = new Set([".ts", ".tsx", ".js", ".jsx"]);
const files = [];

function shouldSkip(file) {
  return file.includes(`${path.sep}brand-icons${path.sep}brand-svgs.tsx`);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (exts.has(path.extname(entry.name)) && !shouldSkip(full)) {
      files.push(full);
    }
  }
}

for (const root of roots) walk(root);

const replacements = [
  [/selection:text-white/g, "selection:text-primary-foreground"],
  [/selection:bg-\[#008744\]/gi, "selection:bg-primary"],
  [/bg-\[#000305\]/gi, "bg-background"],
  [/bg-\[#04090B\]/gi, "bg-background"],
  [/bg-\[#050608\]/gi, "bg-background"],
  [/bg-\[#020507\]/gi, "bg-sidebar"],
  [/bg-\[#0A0F12\]/gi, "bg-card"],
  [/bg-\[#101419\]/gi, "bg-card"],
  [/bg-\[#12181C\]/gi, "bg-elevated"],
  [/bg-\[#131922\]/gi, "bg-card"],
  [/bg-\[#181F29\]/gi, "bg-surface"],
  [/dark:bg-\[#050608\]/gi, "dark:bg-background"],
  [/dark:bg-\[#0B0F14\]/gi, "dark:bg-surface"],
  [/dark:bg-\[#101419\]/gi, "dark:bg-card"],
  [/dark:bg-\[#131922\]/gi, "dark:bg-card"],
  [/dark:bg-\[#181F29\]/gi, "dark:bg-surface"],
  [/text-\[#008744\]/gi, "text-primary"],
  [/text-\[#00753b\]/gi, "text-primary-hover"],
  [/bg-\[#008744\]/gi, "bg-primary"],
  [/bg-\[#00753b\]/gi, "bg-primary-hover"],
  [/hover:bg-\[#008744\]/gi, "hover:bg-primary"],
  [/hover:bg-\[#00753b\]/gi, "hover:bg-primary-hover"],
  [/group-hover:bg-\[#008744\]/gi, "group-hover:bg-primary"],
  [/group-hover:text-\[#008744\]/gi, "group-hover:text-primary"],
  [/border-\[#008744\]/gi, "border-primary"],
  [/focus:border-\[#008744\]/gi, "focus:border-primary"],
  [/ring-\[#008744\]/gi, "ring-primary"],
  [/focus:ring-\[#008744\]/gi, "focus:ring-primary"],
  [/from-\[#008744\]/gi, "from-primary"],
  [/to-\[#008744\]/gi, "to-primary"],
  [/via-\[#008744\]/gi, "via-primary"],
  [/to-\[#006e37\]/gi, "to-primary-hover"],
  [/from-\[#006e37\]/gi, "from-primary-hover"],
  [/focus-visible:outline-\[#008744\]/gi, "focus-visible:outline-primary"],
  [/focus:border-emerald-500/g, "focus:border-primary"],
  [/focus:ring-emerald-500/g, "focus:ring-primary"],
  [/border-white\/\[[^\]]+\]/g, "border-border"],
  [/divide-white\/\[[^\]]+\]/g, "divide-border"],
  [/border-white\/[0-9]+/g, "border-border"],
  [/divide-white\/[0-9]+/g, "divide-border"],
  [/border-white/g, "border-border"],
  [/divide-white/g, "divide-border"],
  [/bg-black\/[0-9]+/g, "bg-overlay"],
  [/bg-black/g, "bg-background"],
  [/text-black/g, "text-foreground"],
  [/bg-white\/[0-9]+/g, "bg-muted"],
  [/hover:bg-white\/[0-9]+/g, "hover:bg-muted"],
  [/bg-white/g, "bg-card"],
  [/hover:bg-white/g, "hover:bg-card"],
  [/dark:text-white/g, "dark:text-foreground"],
  [/text-white/g, "text-foreground"],
  [/hover:text-white/g, "hover:text-foreground"],
  [/group-hover:text-white/g, "group-hover:text-foreground"],
  [/placeholder:text-white/g, "placeholder:text-foreground"],
  [/border-zinc-800\/80/g, "border-border"],
  [/border-zinc-800/g, "border-border"],
  [/border-zinc-700/g, "border-border"],
  [/border-zinc-300/g, "border-border"],
  [/border-zinc-200\/80/g, "border-border"],
  [/border-zinc-200/g, "border-border"],
  [/border-slate-300/g, "border-border"],
  [/border-slate-200/g, "border-border"],
  [/dark:border-border/g, "border-border"],
  [/divide-zinc-800/g, "divide-border"],
  [/divide-zinc-200\/80/g, "divide-border"],
  [/divide-slate-200/g, "divide-border"],
  [/hover:border-zinc-700/g, "hover:border-primary/40"],
  [/hover:border-zinc-300/g, "hover:border-primary/30"],
  [/hover:border-zinc-400/g, "hover:border-primary/40"],
  [/hover:border-slate-400/g, "hover:border-primary/40"],
  [/dark:hover:border-border/g, "hover:border-primary/40"],
  [/bg-zinc-950/g, "bg-background"],
  [/bg-slate-950/g, "bg-background"],
  [/bg-zinc-900\/90/g, "bg-surface/90"],
  [/bg-zinc-900\/80/g, "bg-surface/80"],
  [/bg-zinc-900\/70/g, "bg-surface/70"],
  [/bg-zinc-900\/60/g, "bg-surface/60"],
  [/bg-zinc-900\/50/g, "bg-surface/50"],
  [/bg-zinc-900\/40/g, "bg-surface/40"],
  [/bg-zinc-900/g, "bg-surface"],
  [/hover:bg-zinc-900\/80/g, "hover:bg-surface/80"],
  [/hover:bg-zinc-900\/50/g, "hover:bg-surface/50"],
  [/hover:bg-zinc-900/g, "hover:bg-surface"],
  [/bg-zinc-800\/80/g, "bg-muted/80"],
  [/bg-zinc-800/g, "bg-muted"],
  [/hover:bg-zinc-800/g, "hover:bg-muted"],
  [/bg-zinc-100/g, "bg-muted"],
  [/bg-zinc-50\/50/g, "bg-background"],
  [/bg-zinc-50/g, "bg-background"],
  [/hover:bg-zinc-50/g, "hover:bg-surface"],
  [/bg-slate-100/g, "bg-muted"],
  [/bg-slate-50/g, "bg-background"],
  [/dark:bg-background/g, "bg-background"],
  [/dark:bg-surface/g, "bg-surface"],
  [/dark:bg-card/g, "bg-card"],
];

const semanticFamilies = [
  [["emerald", "green", "teal"], "primary"],
  [["red", "rose"], "danger"],
  [["amber", "yellow", "orange"], "warning"],
  [["blue", "cyan", "indigo"], "info"],
  [["purple", "violet"], "accent"],
];

function migrate(source) {
  let text = source;

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  for (const [families, semantic] of semanticFamilies) {
    const familyPattern = families.join("|");
    const pattern = new RegExp(
      `(?<![\\w-])((?:dark:|hover:|focus:|group-hover:|disabled:|placeholder:|selection:)*)((?:bg|text|border|ring|from|via|to|divide|shadow|accent)-)(?:${familyPattern})-\\d{2,3}(\\/[\\w.\\[\\]-]+)?`,
      "g",
    );
    text = text.replace(
      pattern,
      (_match, state, kind, opacity = "") => `${state}${kind}${semantic}${opacity}`,
    );
  }

  text = text.replace(
    /(?<![\w-])((?:dark:|hover:|focus:|group-hover:|placeholder:)*)text-(?:zinc|slate|gray)-(50|100|200)(\/[\w.\[\]-]+)?/g,
    "$1text-foreground",
  );
  text = text.replace(
    /(?<![\w-])((?:dark:|hover:|focus:|group-hover:|placeholder:)*)text-(?:zinc|slate|gray)-\d{2,3}(\/[\w.\[\]-]+)?/g,
    "$1text-muted-foreground",
  );
  text = text.replace(
    /(?<![\w-])((?:dark:|hover:|focus:|group-hover:)*)border-(?:zinc|slate|gray)-\d{2,3}(\/[\w.\[\]-]+)?/g,
    "$1border-border",
  );
  text = text.replace(
    /(?<![\w-])((?:dark:|hover:|focus:|group-hover:)*)divide-(?:zinc|slate|gray)-\d{2,3}(\/[\w.\[\]-]+)?/g,
    "$1divide-border",
  );

  return text;
}

let changed = 0;

for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  const after = migrate(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
  }
}

console.log(`updated ${changed} files`);
