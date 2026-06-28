#!/usr/bin/env node
/**
 * Create and push a git tag to trigger the GitHub Release workflow.
 *
 * Usage:
 *   pnpm release:tag              # uses package.json version → v0.1.0
 *   pnpm release:tag 0.1.1        # explicit version
 *
 * Requires: git remote `origin` and GitHub Actions secrets configured.
 */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const versionArg = process.argv[2]
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const version = (versionArg ?? pkg.version).replace(/^v/, '')
const tag = `v${version}`

function run(command) {
  console.log(`> ${command}`)
  execSync(command, { cwd: root, stdio: 'inherit' })
}

console.log(`Creating release tag ${tag}…`)
console.log('This pushes the tag to GitHub and triggers the Release workflow.\n')

run(`git tag -a ${tag} -m "Release ${tag}"`)
run(`git push origin ${tag}`)

console.log(`\nTag ${tag} pushed.`)
console.log('Watch the build: https://github.com/yasirijaz/FuelMS/actions')
console.log('Releases:        https://github.com/yasirijaz/FuelMS/releases')
