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
  beforeEach(() => fsp.rm(WORK_DIR, { recursive: true, force: true }))
  afterEach(() => fsp.rm(WORK_DIR, { recursive: true, force: true }))

  it('should generate a site with a search index', async () => {
    const playbookFile = ospath.join(FIXTURES_DIR, 'docs-site', 'antora-playbook.yml')
    const outputDir = ospath.join(WORK_DIR, 'public')
    const cacheDir = ospath.join(WORK_DIR, '.cache', 'antora')
    // NOTE: While all configuration is passed along with the pipeline configuration, see playbook,
    //       the supplemental_ui and its' search field are dependant on the environment variables
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], {
      DOCSEARCH_ENABLED: 'true'
    })
    global.window = {}
    global.window.antoraLunr = {}
    global.window.antoraLunr.init = (index) => {
      expect(index.store['/antora-lunr/index.html'].title).to.equal('Antora x Lunr')
      expect(index.store['/antora-lunr/index.html'].url).to.equal('/antora-lunr/index.html')
    }
    require(ospath.join(outputDir, 'search-index.js'))

    const startPageContents = await fsp.readFile(ospath.join(outputDir, 'antora-lunr', 'index.html'))
    const $ = cheerio.load(startPageContents)
    expect($('#search-input')).to.have.lengthOf(1)
  })
})
