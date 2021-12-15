'use strict'

// The name of the package in order to give the Antora logger a useful name
const { name: packageName } = require('../package.json')
const fs = require('fs')
const generateIndex = require('./generate-index')
const LazyReadable = require('./lazy-readable')

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

  this.on('uiLoaded', ({ playbook, uiCatalog }) => {
    const jsVendorPath = playbook.ui.outputDir + '/js/vendor'
    uiCatalog.addFile({
      contents: new LazyReadable(() => fs.createReadStream(require.resolve('lunr/lunr.min.js'))),
      type: 'asset',
      path: 'js/vendor/lunr.js',
      out: { dirname: jsVendorPath, path: jsVendorPath + '/lunr.js', basename: 'lunr.js' },
    })
  })

  this.on('beforePublish', ({ playbook, siteCatalog, contentCatalog }) => {
    const index = generateIndex(playbook, contentCatalog, { indexLatestOnly, languages, logger })
    siteCatalog.addFile(generateIndex.createIndexFile(index))
  })
}

module.exports = { generateIndex, register }
