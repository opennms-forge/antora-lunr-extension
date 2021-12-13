'use strict'

// The name of the package in order to give the Antora logger a useful name
const { name: packageName } = require('../package.json')
const generateIndex = require('./generate-index')

/**
 * Lunr integration for an Antora documentation site.
 *
 * @module lunr-extension
 */
function register ({ config: { indexLatestOnly, languages, ...extraArguments } }) {
  const logger = this.getLogger(packageName)

  if (Object.keys(extraArguments).length > 0) {
    const args = Object.keys(extraArguments)
      .map((x) => `"${x}"`)
      .join(', ')
    throw new Error(`Remove unrecognized extension option(s) for ${packageName}: ${args}`)
  }

  this.on('beforePublish', ({ playbook, siteCatalog, contentCatalog }) => {
    const index = generateIndex(playbook, contentCatalog, {
      indexLatestOnly,
      languages
    }, logger)
    siteCatalog.addFile(generateIndex.createIndexFile(index))
  })
}

module.exports = { register }
