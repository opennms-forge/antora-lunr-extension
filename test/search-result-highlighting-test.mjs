/* eslint-env mocha */
'use strict'

import { createRequire } from 'module'
import { buildHighlightedText, findTermPosition } from '../data/js/search-result-highlighting.mjs'
const require = createRequire(import.meta.url)
const { expect } = require('./harness')
const lunr = require('lunr')

describe('buildHighlightedText()', () => {
  it('should highlight a single term (lunr)', async () => {
    const positions = [
      // lunr
      {
        start: 0,
        length: 4,
      },
    ]
    const result = buildHighlightedText('Lunr provides a great search experience without the need for external, server-side, search services. With this extension, you can add an offline search engine to your Antora documentation site.', positions, 100)
    expect(result).to.deep.eq(
      [
        { type: 'mark', text: 'Lunr' },
        { type: 'text', text: ' provides a great search experience without the need for external, server-side, search services. Wit...' },
      ]
    )
  })

  it('should highlight a single term (lunr) without ellipsis', async () => {
    const positions = [
      // lunr
      {
        start: 0,
        length: 4,
      },
    ]
    const result = buildHighlightedText('Lunr provides a great search experience without the need for external, server-side, search services.', positions, 100)
    expect(result).to.deep.eq(
      [
        { type: 'mark', text: 'Lunr' },
        { type: 'text', text: ' provides a great search experience without the need for external, server-side, search services.' },
      ]
    )
  })

  it('should highlight multiple terms (search, server, services)', async () => {
    const positions = [
      // search
      {
        start: 22,
        length: 6,
      },
      // server
      {
        start: 71,
        length: 6,
      },
      // services
      {
        start: 91,
        length: 8,
      },
    ]
    const result = buildHighlightedText('Lunr provides a great search experience without the need for external, server-side, search services. With this extension, you can add an offline search engine to your Antora documentation site.', positions, 100)
    expect(result).to.deep.eq(
      [
        { type: 'text', text: 'Lunr provides a great ' },
        { type: 'mark', text: 'search' },
        { type: 'text', text: ' experience without the need for external, ' },
        { type: 'mark', text: 'server' },
        { type: 'text', text: '-side, search ' },
        { type: 'mark', text: 'services' },
        { type: 'text', text: '. With this extension, you ca...' },
      ]
    )
  })

  it('should not highlight terms outside snippet range', async () => {
    const positions = [
      // search
      {
        start: 22,
        length: 6,
      },
      // documentation (out of range)
      {
        start: 172,
        length: 12,
      },
    ]
    const result = buildHighlightedText('Lunr provides a great search experience without the need for external, server-side, search services. With this extension, you can add an offline search engine to your Antora documentation site.', positions, 100)
    expect(result).to.deep.eq(
      [
        { type: 'text', text: 'Lunr provides a great ' },
        { type: 'mark', text: 'search' },
        { type: 'text', text: ' experience without the need for external, server-side, search services. With this extension, you ca...' },
      ]
    )
  })

  it('should honor snippet length', async () => {
    const positions = [
      // search
      {
        start: 0,
        length: 4,
      },
      // search
      {
        start: 22,
        length: 6,
      },
      // server (out of range)
      {
        start: 71,
        length: 6,
      },
    ]
    const result = buildHighlightedText('Lunr provides a great search experience without the need for external, server-side, search services. With this extension, you can add an offline search engine to your Antora documentation site.', positions, 50)
    expect(result).to.deep.eq(
      [
        { type: 'mark', text: 'Lunr' },
        { type: 'text', text: ' provides a great ' },
        { type: 'mark', text: 'search' },
        { type: 'text', text: ' experience without the ne...' },
      ]
    )
  })

  it('should add leading ellipse', async () => {
    const positions = [
      // documentation
      {
        start: 174,
        length: 13,
      },
    ]
    const result = buildHighlightedText('Lunr provides a great search experience without the need for external, server-side, search services. With this extension, you can add an offline search engine to your Antora documentation site.', positions, 70)
    expect(result).to.deep.eq(
      [
        { type: 'text', text: '...h this extension, you can add an offline search engine to your Antora ' },
        { type: 'mark', text: 'documentation' },
        { type: 'text', text: ' site.' },
      ]
    )
  })

  it('should add both leading and trailing ellipses', async () => {
    const positions = [
      // server
      {
        start: 71,
        length: 6,
      },
    ]
    const result = buildHighlightedText('Lunr provides a great search experience without the need for external, server-side, search services. With this extension, you can add an offline search engine to your Antora documentation site.', positions, 40)
    expect(result).to.deep.eq(
      [
        { type: 'text', text: '...perience without the need for external, ' },
        { type: 'mark', text: 'server' },
        { type: 'text', text: '-side, search services. With this extens...' },
      ]
    )
  })

  it('should not add ellipse when snippet length is undefined', async () => {
    const positions = [
      // server
      {
        start: 71,
        length: 6,
      },
    ]
    const result = buildHighlightedText('Lunr provides a great search experience without the need for external, server-side, search services. With this extension, you can add an offline search engine to your Antora documentation site.', positions)
    expect(result).to.deep.eq(
      [
        { type: 'text', text: 'Lunr provides a great search experience without the need for external, ' },
        { type: 'mark', text: 'server' },
        { type: 'text', text: '-side, search services. With this extension, you can add an offline search engine to your Antora documentation site.' },
      ]
    )
  })

  it('should return text when there\'s no position', async () => {
    const positions = []
    const result = buildHighlightedText('Lunr provides a great search experience without the need for external, server-side, search services. With this extension, you can add an offline search engine to your Antora documentation site.', positions, 100)
    expect(result).to.deep.eq(
      [
        { type: 'text', text: 'Lunr provides a great search experience without the need for external, server-side, search services....' },
      ]
    )
  })

  it('should return text when there\'s no valid position', async () => {
    const positions = [
      {
        start: 50,
        length: 0, // invalid length
      },
      {
        start: 250, // out of range
        length: 10,
      },
    ]
    const result = buildHighlightedText('Lunr provides a great search experience without the need for external, server-side, search services. With this extension, you can add an offline search engine to your Antora documentation site.', positions, 100)
    expect(result).to.deep.eq(
      [
        { type: 'text', text: 'Lunr provides a great search experience without the need for external, server-side, search services....' },
      ]
    )
  })
})

describe('findTermPosition()', () => {
  it('should found Lunr (case-insensitive)', () => {
    const result = findTermPosition(lunr, 'lunr', 'Lunr provides a great search experience without the need for external, server-side, search services.')
    expect(result).to.deep.eq({
      start: 0,
      length: 4,
    })
  })
  it('should found servic (plural removed)', () => {
    const result = findTermPosition(lunr, 'servic', 'Lunr provides a great search experience without the need for external, server-side, search services.')
    // REMIND: currently, it matches "services." because we do not run the pipeline on the text.
    // More specifically we do not run the trimmer which removes non word-characters from the beginning and end of tokens.
    expect(result).to.deep.eq({
      start: 91,
      length: 9,
    })
  })
  it('should found first match "search"', () => {
    const result = findTermPosition(lunr, 'search', 'Lunr provides a great search experience without the need for external, server-side, search services.')
    expect(result).to.deep.eq({
      start: 22,
      length: 6,
    })
  })
  it('should return empty match if not found', () => {
    const result = findTermPosition(lunr, 'algolia', 'Lunr provides a great search experience without the need for external, server-side, search services.')
    expect(result).to.deep.eq({
      start: 0,
      length: 0,
    })
  })
})
