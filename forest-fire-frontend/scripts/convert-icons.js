const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const assetsDir = path.join(__dirname, '..', 'public', 'assets')
const icons = [
  'sensor-thermal.svg',
  'sensor-smoke.svg',
  'sensor-humidity.svg',
]

async function convert() {
  try {
    for (const icon of icons) {
      const svgPath = path.join(assetsDir, icon)
      if (!fs.existsSync(svgPath)) {
        console.warn('Missing', svgPath)
        continue
      }

      const pngName = icon.replace(/\.svg$/i, '.png')
      const pngPath = path.join(assetsDir, pngName)
      await sharp(svgPath)
        .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(pngPath)
      console.log('Wrote', pngPath)
    }
    console.log('Conversion complete.')
  } catch (err) {
    console.error('Conversion failed:', err)
    process.exitCode = 2
  }
}

convert()
