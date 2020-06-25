const path = require('path')
const { promises: fs, createWriteStream } = require('fs')
const archiver = require('archiver')

const src = path.join(__dirname, 'src')
const dist = path.join(__dirname, 'dist')

async function writeArchive(manifest, target) {
  return new Promise((resolve, reject) => {
    const filename = `${manifest.name
      .split(' ')
      .join('-')
      .toLowerCase()}_v${manifest.version}_${target}.zip`
    const output = createWriteStream(path.join(dist, filename))

    const archive = archiver('zip')

    archive.on('end', resolve)
    archive.on('error', reject)

    archive.pipe(output)

    archive.glob('**/*', {
      cwd: path.join('./src'),
      ignore: ['manifest.json']
    })

    if (target === 'firefox') {
      manifest.permissions = manifest.permissions.filter(permission => permission !== 'contentSettings')
    }

    archive.append(Buffer.from(JSON.stringify(manifest, null, '  ')), { name: 'manifest.json' })

    archive.finalize()
  })
}

async function main() {
  const manifestData = await fs.readFile(path.join(src, 'manifest.json'))
  const manifest = JSON.parse(manifestData.toString())
  console.log(manifest)

  try {
    await fs.mkdir(dist)
  } catch (e) {}

  const targets = ['chrome', 'firefox']
  for (const target of targets) {
    await writeArchive(manifest, target)
  }
}

main()
