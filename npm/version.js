'use strict'

const { promises: fsp } = require('fs')
const ospath = require('path')
const { version: VERSION } = require('../package.json')

const PROJECT_ROOT_DIR = ospath.join(__dirname, '..')
const CHANGELOG_FILE = ospath.join(PROJECT_ROOT_DIR, 'CHANGELOG.adoc')

function getCurrentDate () {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
}

function updateChangelog (now) {
  const releaseDate = now.toISOString().split('T')[0]
  return fsp
    .readFile(CHANGELOG_FILE, 'utf8')
    .then((changelog) =>
      fsp.writeFile(CHANGELOG_FILE, changelog.replace(/^== Unreleased$/m, `== ${VERSION} (${releaseDate})`))
    )
}

;(async () => {
  await updateChangelog(getCurrentDate())
})()
