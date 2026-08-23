import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const component = readFileSync(new URL("../src/components/home_experience.jsx", import.meta.url), "utf8")
const dashboard = readFileSync(new URL("../src/pages/dashboard.jsx", import.meta.url), "utf8")
const featureClient = readFileSync(new URL("../src/lib/vault-feature-client.js", import.meta.url), "utf8")
const iconSystem = readFileSync(new URL("../src/components/win7_icons.jsx", import.meta.url), "utf8")
const mainProcess = readFileSync(new URL("../src/main.js", import.meta.url), "utf8")
const packageManifest = readFileSync(new URL("../package.json", import.meta.url), "utf8")
const stylesheet = readFileSync(new URL("../src/index.css", import.meta.url), "utf8")

function colorHue(red, green, blue) {
  const channels = [red, green, blue].map((channel) => channel / 255)
  const maximum = Math.max(...channels)
  const minimum = Math.min(...channels)
  const delta = maximum - minimum
  const lightness = (maximum + minimum) / 2
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0

  if (delta !== 0) {
    if (maximum === channels[0]) hue = ((channels[1] - channels[2]) / delta) % 6
    if (maximum === channels[1]) hue = (channels[2] - channels[0]) / delta + 2
    if (maximum === channels[2]) hue = (channels[0] - channels[1]) / delta + 4
    hue = (hue * 60 + 360) % 360
  }

  return { hue, saturation }
}

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

test("recovery uses the real mode-5 backend contract", () => {
  const recoveryAdapter = featureClient.match(
    /export async function recoverVault[\s\S]*?\n\}/,
  )?.[0]

  assert.ok(recoveryAdapter, "expected a recovery adapter")
  assert.match(recoveryAdapter, /mode:\s*5/)
  assert.match(recoveryAdapter, /password:\s*masterKey/)
  assert.match(recoveryAdapter, /paths:\s*normalizedPaths/)
  assert.match(recoveryAdapter, /response\.read_only/)
})

test("recovery UI uses native PNG paths without fixture inspection", () => {
  const imagePicker = mainProcess.match(
    /ipcMain\.handle\('dialog:select-image-paths'[\s\S]*?return selection\.canceled \? \[\] : selection\.filePaths;/,
  )?.[0]

  assert.ok(imagePicker, "expected the native image picker")
  assert.match(imagePicker, /extensions:\s*\['png'\]/)
  assert.match(component, /pixelPassBackend\?\.selectImagePaths/)
  assert.doesNotMatch(component, /Frontend demo|Load cat-image demo|inspectRecoveryImages/)
  assert.doesNotMatch(featureClient, /createDemoRecoveryFiles|inspectRecoveryImages/)
})

test("read-only recovery disables dashboard mutations", () => {
  assert.match(dashboard, /const isReadOnly = Boolean\(location\.state\?\.readOnly\)/)
  assert.match(dashboard, /className="pixelpass-read-only-notice"/)
  assert.match(dashboard, /disabled=\{isReadOnly\}/)
  assert.match(dashboard, /<PasswordRow\s+isReadOnly=\{isReadOnly\}/)
})

test("frontend uses the authored Windows 7 icon system without Lucide", () => {
  assert.match(iconSystem, /function IconArtwork/)
  assert.match(iconSystem, /export const HomeIcon = icon\("home"\)/)
  assert.match(iconSystem, /export const KeyRound = icon\("key"\)/)
  assert.doesNotMatch(packageManifest, /lucide-react/)
})

test("frontend palette contains no purple or violet colors", () => {
  const colors = []

  for (const match of stylesheet.matchAll(/#([0-9a-f]{6})\b/gi)) {
    colors.push({
      source: match[0],
      values: [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16)),
    })
  }
  for (const match of stylesheet.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)) {
    colors.push({ source: match[0], values: match.slice(1, 4).map(Number) })
  }

  const purpleColors = colors.filter(({ values }) => {
    const { hue, saturation } = colorHue(...values)
    return hue >= 255 && hue <= 330 && saturation > 0.12
  })

  assert.deepEqual(purpleColors, [])
  assert.doesNotMatch(stylesheet, /\b(?:purple|violet)\b/i)
})
