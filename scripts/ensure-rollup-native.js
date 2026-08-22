'use strict'

const { spawnSync } = require('child_process')
const path = require('path')

function log(message) {
  if (process.env.CI || process.env.VERCEL) {
    console.log(`[rollup-native] ${message}`)
  }
}

function ensureRollup() {
  if (process.platform !== 'win32') {
    log('Non-Windows platform detected. Skipping ensure step.')
    return
  }

  try {
    require.resolve('@rollup/rollup-win32-x64-msvc')
    return
  } catch {
    log('Native Rollup package missing. Installing...')
  }

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const result = spawnSync(npmCmd, ['install', '--no-save', '@rollup/rollup-win32-x64-msvc'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    console.warn('[rollup-native] Failed to install Rollup native package. Continuing anyway.')
  }
}

ensureRollup()
