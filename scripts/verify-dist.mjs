import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'

function listFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath))
      continue
    }
    files.push(fullPath)
  }

  return files.sort()
}

const repoRoot = process.cwd()
const tempRoot = resolve(repoRoot, '.tmp')
mkdirSync(tempRoot, { recursive: true })
const workspace = mkdtempSync(join(tempRoot, 'verify-dist-'))
const generatedDist = join(workspace, 'dist')
const require = createRequire(import.meta.url)
const nccPkgPath = require.resolve('@vercel/ncc/package.json')
const nccPkg = JSON.parse(readFileSync(nccPkgPath, 'utf8'))
const nccPath = resolve(dirname(nccPkgPath), nccPkg.bin.ncc)

try {
  const result = spawnSync(
    nccPath,
    [
      'build',
      '-s',
      'src/index.ts',
      '-o',
      generatedDist,
      '--license',
      'licenses.txt',
    ],
    { cwd: repoRoot, stdio: 'inherit' },
  )

  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error(`ncc build failed with exit code ${result.status ?? 1}.`)
  }

  const committedFiles = listFiles(resolve(repoRoot, 'dist')).map((file) =>
    relative(resolve(repoRoot, 'dist'), file),
  )
  const generatedFiles = listFiles(generatedDist).map((file) =>
    relative(generatedDist, file),
  )

  if (JSON.stringify(committedFiles) !== JSON.stringify(generatedFiles)) {
    throw new Error('Committed dist file set does not match generated output.')
  }

  for (const file of committedFiles) {
    const committed = readFileSync(resolve(repoRoot, 'dist', file))
    const generated = readFileSync(resolve(generatedDist, file))
    if (!committed.equals(generated)) {
      throw new Error(
        `Committed dist file differs from generated output: ${file}`,
      )
    }
  }
} finally {
  rmSync(workspace, { recursive: true, force: true })
}
