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
    global.lunrSiteSearch = {
      init (lunr, index) {
        expect(index.store['/antora-lunr/index.html']).to.include({
          title: 'Antora x Lunr',
          url: '/antora-lunr/index.html',
        })
        expect(index.store['/antora-lunr/named-module/the-page.html']).to.include({
          title: 'The Page',
          url: '/antora-lunr/named-module/the-page.html',
        })
      },
    }
    require(searchIndexPath)
    delete global.lunr
    delete global.lunrSiteSearch
  })

  it('should insert script element with predefined data attributes', async () => {
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], {})
    const startPageContents = await fsp.readFile(ospath.join(outputDir, 'antora-lunr/index.html'))
    let $ = cheerio.load(startPageContents)
    expect($('#search-input')).to.have.lengthOf(1)
    let searchScript = $('#search-script')
    expect(searchScript).to.have.lengthOf(1)
    expect(searchScript.attr('data-base-path')).to.equal('..')
    expect(searchScript.attr('data-stylesheet')).to.equal('../_/css/search.css')
    const thePageContents = await fsp.readFile(ospath.join(outputDir, 'antora-lunr/named-module/the-page.html'))
    $ = cheerio.load(thePageContents)
    searchScript = $('#search-script')
    expect(searchScript.attr('data-base-path')).to.equal('../..')
    expect(searchScript.attr('data-stylesheet')).to.equal('../../_/css/search.css')
  })

  it('should output lunr.js client/engine to js vendor directory of UI output folder', async () => {
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], {})
    const expected = ospath.join(outputDir, '_/js/vendor/lunr.js')
    expect(expected).to.be.a.file().and.equal(require.resolve('lunr/lunr.min.js'))
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
    expect($('#search-script')).to.have.lengthOf(0)
  })
})
