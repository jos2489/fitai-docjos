// Genera le icone PNG dell'app a partire da public/icon.svg
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url))
const out = [
  ['../public/icon-192.png', 192],
  ['../public/icon-512.png', 512],
  ['../public/apple-touch-icon.png', 180],
]
for (const [rel, size] of out) {
  await sharp(svg, { density: 512 }).resize(size, size).png().toFile(new URL(rel, import.meta.url).pathname.replace(/^\//, ''))
  console.log('creato', rel, size)
}
