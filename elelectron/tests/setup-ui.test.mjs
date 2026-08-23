import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const component = readFileSync(new URL("../src/components/home_experience.jsx", import.meta.url), "utf8")
const stylesheet = readFileSync(new URL("../src/index.css", import.meta.url), "utf8")

test("setup source choices are text-only Windows 7 controls", () => {
  const sourceRail = component.match(/<div className="pixelpass-source-rail"[\s\S]*?<\/div>/)?.[0]

  assert.ok(sourceRail, "expected the setup source rail to exist")
  assert.doesNotMatch(sourceRail, /<(Images|Upload|ImageIcon)\b/)
  assert.match(sourceRail, /<strong>Sample pack<\/strong><small>Fastest for a demo<\/small>/)
  assert.match(sourceRail, /<strong>Choose files<\/strong><small>Use your own images<\/small>/)
  assert.match(sourceRail, /<strong>Paste image<\/strong><small>Repeat it as covers<\/small>/)
})

test("setup progress uses square markers", () => {
  const progressMarkerRule = stylesheet.match(/\.pixelpass-flow-progress li > span \{[\s\S]*?\n\}/)?.[0]

  assert.ok(progressMarkerRule, "expected the progress marker rule to exist")
  assert.match(progressMarkerRule, /border-radius:\s*0;/)
})

test("recovery strength omits the green survival callout", () => {
  assert.doesNotMatch(component, /pixelpass-survival-note/)
  assert.doesNotMatch(stylesheet, /\.pixelpass-survival-note/)
})
