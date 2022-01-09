'use strict'

// The name of the package in order to give the Antora logger a useful name
const { name: packageName } = require('../package.json')
const fs = require('fs')
const { promises: fsp } = fs
const generateIndex = require('./generate-index')
const LazyReadable = require('./lazy-readable')
const MultiFileReadStream = require('./multi-file-read-stream')
const ospath = require('path')
const template = require('./template')

/**
 * Lunr integration for an Antora documentation site.
 *
 * @module lunr-extension
 */
function register ({ config: { languages, indexLatestOnly, snippetLength = 100, ...unknownOptions } }) {
  const logger = this.getLogger(packageName)

  if (Object.keys(unknownOptions).length) {
    const keys = Object.keys(unknownOptions)
    throw new Error(`Unrecognized option${keys.length > 1 ? 's' : ''} specified for ${packageName}: ${keys.join(', ')}`)
  }

  this.on('uiLoaded', async ({ playbook, uiCatalog }) => {
    playbook.env.SITE_SEARCH_PROVIDER = 'lunr'
    const uiOutputDir = playbook.ui.outputDir
    vendorJsFile(uiCatalog, uiOutputDir, 'lunr/lunr.min.js', 'lunr.js')
    const otherLanguages = (languages || []).filter((it) => it !== 'en')
    if (otherLanguages.length) {
      playbook.env.SITE_SEARCH_LANGUAGES = otherLanguages.join(',')
      const languageRequires = ['lunr-languages/lunr.stemmer.support.js'].concat(
        otherLanguages.map((lang) => `lunr-languages/lunr.${lang}.js`)
      )
      vendorJsFile(uiCatalog, uiOutputDir, languageRequires, 'lunr-languages.js') // lunr-language-support.js?
    }
    const searchScriptsPartialPath = 'partials/search-scripts.hbs'
    if (uiCatalog.findByType('partials').some(({ path }) => path === searchScriptsPartialPath)) return
    const searchScriptsPartialFilepath = ospath.join(__dirname, '../data', searchScriptsPartialPath)
    uiCatalog.addFile({
      contents: Buffer.from(template(await fsp.readFile(searchScriptsPartialFilepath, 'utf8'), { snippetLength })),
      path: searchScriptsPartialPath,
      stem: 'search-scripts',
      type: 'partial',
    })
  })

  this.on('beforePublish', ({ playbook, siteCatalog, contentCatalog }) => {
    delete playbook.env.SITE_SEARCH_PROVIDER
    delete playbook.env.SITE_SEARCH_LANGUAGES
    const index = generateIndex(playbook, contentCatalog, { indexLatestOnly, languages, logger })
    siteCatalog.addFile(generateIndex.createIndexFile(index))
  })
}

function vendorJsFile (uiCatalog, uiOutputDir, requireRequest, basename) {
  if (!basename) {
    basename = requireRequest.split('/').pop()
  }
  const jsVendorDir = 'js/vendor'
  const jsVendorOutputDir = uiOutputDir + '/' + jsVendorDir
  let contents
  if (Array.isArray(requireRequest)) {
    const filepaths = requireRequest.map(require.resolve)
    contents = new LazyReadable(() => new MultiFileReadStream(filepaths))
  } else {
    const filepath = require.resolve(requireRequest)
    contents = new LazyReadable(() => fs.createReadStream(filepath))
  }
  uiCatalog.addFile({
    contents,
    type: 'asset',
    path: jsVendorDir + '/' + basename,
    out: { dirname: jsVendorOutputDir, path: jsVendorOutputDir + '/' + basename, basename },
  })
}

module.exports = { generateIndex, register }
