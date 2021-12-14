'use strict'

const ContentCatalog = require(require.resolve('@antora/content-classifier/lib/content-catalog', {
  paths: [require.resolve('@antora/site-generator')],
}))

module.exports = (playbook, files = []) => {
  const catalog = new ContentCatalog(playbook)
  const contentVersionKeys = new Set()
  files.forEach((file) => {
    file = Object.assign({ asciidoc: {} }, file)
    const src = (file.src = Object.assign({ module: 'ROOT', family: 'page', relative: 'index.adoc' }, file.src))
    const { component, version } = src
    const contentVersionKey = `${version}@${component}`
    if (!contentVersionKeys.has(contentVersionKey)) {
      catalog.registerComponentVersion(component, version)
      contentVersionKeys.add(contentVersionKey)
    }
    catalog.addFile(file)
  })
  return catalog
}
