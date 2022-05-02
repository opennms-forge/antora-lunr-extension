/* eslint-env mocha */
'use strict'

import { createRequire } from 'module'
import { highlightHit } from '../data/js/search-result-highlighting.mjs'
const require = createRequire(import.meta.url)
const { expect } = require('./harness')

describe('highlightHit()', () => {
  it('should highlight a single term (lunr)', () => {
    const searchMetadata = {
      lunr: {
        text: {
          // Lunr
          position: [[0, 4]],
        },
      },
    }
    const doc = { text: 'Lunr provides a great search experience without the need for external, server-side, search services. With this extension, you can add an offline search engine to your Antora documentation site.' }
    const result = highlightHit(searchMetadata, undefined, doc, 100)
    expect(result).to.deep.eq(
      [
        { type: 'mark', text: 'Lunr' },
        { type: 'text', text: ' provides a great search experience without the need for external, server-side, search services. With th' },
      ]
    )
  })
})
