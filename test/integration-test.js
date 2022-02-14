/* eslint-env mocha */
'use strict'

const { expect } = require('./harness')
const { promises: fsp } = require('fs')
const cheerio = require('cheerio')
const ospath = require('path')

const FIXTURES_DIR = ospath.join(__dirname, 'fixtures')
const WORK_DIR = ospath.join(__dirname, 'work')

const generateSite = require('@antora/site-generator')

describe('generateSite()', () => {
  const cacheDir = ospath.join(WORK_DIR, '.cache/antora')
  const outputDir = ospath.join(WORK_DIR, 'public')
  let playbookFile = ospath.join(FIXTURES_DIR, 'docs-site/antora-playbook.yml')

  beforeEach(() => fsp.rm(outputDir, { recursive: true, force: true }))
  after(() => fsp.rm(WORK_DIR, { recursive: true, force: true }))

  it('should generate a site with a search index', async () => {
    const env = {}
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], env)
    expect(env).to.not.have.property('SITE_SEARCH_PROVIDER')
    const searchIndexPath = ospath.join(outputDir, 'search-index.js')
    expect(searchIndexPath).to.be.a.file()
    global.lunr = {}
    global.initSearch = function (lunr, index) {
      expect(Object.keys(index.store).length).to.equal(2)
      expect(index.store[1]).to.include({
        title: 'Antora x Lunr',
        url: '/antora-lunr/index.html',
      })
      expect(index.store[2]).to.include({
        title: 'The Page',
        url: '/antora-lunr/named-module/the-page.html',
      })
    }
    require(searchIndexPath)
    delete global.lunr
    delete global.initSearch
  })

  it('should insert script element with predefined data attributes', async () => {
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], {})
    const startPageContents = await fsp.readFile(ospath.join(outputDir, 'antora-lunr/index.html'))
    let $ = cheerio.load(startPageContents)
    expect($('#search-input')).to.have.lengthOf(1)
    let searchScript = $('#search-ui-script')
    expect(searchScript).to.have.lengthOf(1)
    expect(searchScript.attr('data-site-root-path')).to.equal('..')
    expect(searchScript.attr('data-stylesheet')).to.equal('../_/css/search.css')
    expect(searchScript.attr('data-snippet-length')).to.equal('100')
    const thePageContents = await fsp.readFile(ospath.join(outputDir, 'antora-lunr/named-module/the-page.html'))
    $ = cheerio.load(thePageContents)
    searchScript = $('#search-ui-script')
    expect(searchScript.attr('data-site-root-path')).to.equal('../..')
    expect(searchScript.attr('data-stylesheet')).to.equal('../../_/css/search.css')
  })

  it('should output lunr.js client/engine to js vendor directory of UI output folder', async () => {
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], {})
    const expected = ospath.join(outputDir, '_/js/vendor/lunr.js')
    expect(expected).to.be.a.file().and.equal(require.resolve('lunr/lunr.min.js'))
    const thePageContents = await fsp.readFile(ospath.join(outputDir, 'antora-lunr/named-module/the-page.html'))
    const $ = cheerio.load(thePageContents)
    expect($('script[src="../../_/js/vendor/lunr.js"]').get()).to.have.lengthOf(1)
  })

  it('should output language support files to js vendor directory of UI output folder', async () => {
    playbookFile = ospath.join(FIXTURES_DIR, 'docs-site', 'antora-playbook-with-languages.yml')
    const env = {}
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], env)
    expect(env).to.not.have.property('SITE_SEARCH_LANGUAGES')
    const expectedContents = await Promise.all([
      fsp.readFile(require.resolve('lunr-languages/lunr.stemmer.support.js')),
      fsp.readFile(require.resolve('lunr-languages/lunr.fr.js')),
      fsp.readFile(require.resolve('lunr-languages/lunr.de.js')),
    ]).then(Buffer.concat)
    expect(ospath.join(outputDir, '_/js/vendor/lunr-languages.js'))
      .to.be.a.file()
      .and.have.content(expectedContents.toString())
    const thePageContents = await fsp.readFile(ospath.join(outputDir, 'antora-lunr/named-module/the-page.html'))
    const $ = cheerio.load(thePageContents)
    expect($('script[src="../../_/js/vendor/lunr-languages.js"]').get()).to.have.lengthOf(1)
    expect($('script[src="../../_/js/vendor/lunr.stemmer.support.js"]').get()).to.have.lengthOf(0)
    expect($('script[src="../../_/js/vendor/lunr.fr.js"]').get()).to.have.lengthOf(0)
  })

  it('should allow extension to configure snippet length', async () => {
    playbookFile = ospath.join(FIXTURES_DIR, 'docs-site', 'antora-playbook-with-snippet-length.yml')
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], {})
    const startPageContents = await fsp.readFile(ospath.join(outputDir, 'antora-lunr/index.html'))
    const searchScript = cheerio.load(startPageContents)('#search-ui-script')
    expect(searchScript.attr('data-snippet-length')).to.equal('250')
  })

  it('should use existing search-scripts.hbs partial if present in UI', async () => {
    playbookFile = ospath.join(FIXTURES_DIR, 'docs-site', 'antora-playbook-with-custom-supplemental-ui.yml')
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], {})
    const startPageContents = await fsp.readFile(ospath.join(outputDir, 'antora-lunr/index.html'))
    const searchScript = cheerio.load(startPageContents)('#search-ui-script')
    expect(searchScript).to.have.lengthOf(1)
    expect(searchScript.attr('data-snippet-length')).to.equal('150')
    expect(searchScript.attr('data-stylesheet')).to.be.undefined()
  })

  it('should not generate search index or add scripts to pages if extension is not enabled', async () => {
    playbookFile = ospath.join(FIXTURES_DIR, 'docs-site', 'antora-playbook-without-extension.yml')
    const env = {}
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], env)
    expect(env).to.not.have.property('SITE_SEARCH_PROVIDER')
    expect(ospath.join(outputDir, 'search-index.js')).to.not.be.a.path()
    const startPageContents = await fsp.readFile(ospath.join(outputDir, 'antora-lunr/index.html'))
    const $ = cheerio.load(startPageContents)
    expect($('#search-input')).to.have.lengthOf(0)
    expect($('#search-ui-script')).to.have.lengthOf(0)
  })

  it('should throw error if unknown options are specified in playbook', async () => {
    playbookFile = ospath.join(FIXTURES_DIR, 'docs-site', 'antora-playbook-with-unknown-options.yml')
    const expectedMessage = 'Unrecognized options specified for @antora/lunr-extension: foo, yin'
    expect(
      await generateSite(['--playbook', playbookFile], {}).then(
        (result) => () => result,
        (err) => () => {
          throw err
        }
      )
    ).to.throw(expectedMessage)
  })
})
