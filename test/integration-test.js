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
  const playbookFile = ospath.join(FIXTURES_DIR, 'docs-site/antora-playbook.yml')

  beforeEach(() => fsp.rm(outputDir, { recursive: true, force: true }))
  after(() => fsp.rm(WORK_DIR, { recursive: true, force: true }))

  it('should generate a site with a search index', async () => {
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], {
      DOCSEARCH_ENABLED: 'true',
    })
    global.window = {
      antoraLunr: {
        init (index) {
          expect(index.store['/antora-lunr/index.html'].title).to.equal('Antora x Lunr')
          expect(index.store['/antora-lunr/index.html'].url).to.equal('/antora-lunr/index.html')
        },
      },
    }
    require(ospath.join(outputDir, 'search-index.js'))
    const startPageContents = await fsp.readFile(ospath.join(outputDir, 'antora-lunr', 'index.html'))
    const $ = cheerio.load(startPageContents)
    expect($('#search-input')).to.have.lengthOf(1)
    delete global.window
  })

  it('should output lunr.js client/engine to js vendor directory of UI output folder', async () => {
    await generateSite(['--playbook', playbookFile, '--to-dir', outputDir, '--cache-dir', cacheDir, '--quiet'], {
      DOCSEARCH_ENABLED: 'true',
    })
    const expected = ospath.join(outputDir, '_/js/vendor/lunr.js')
    expect(expected).to.be.a.file().and.equal(require.resolve('lunr/lunr.min.js'))
  })
})
