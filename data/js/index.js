/* global CustomEvent, globalThis */
'use strict'

import { highlightHit } from './search-result-highlighting.mjs'

const config = document.getElementById('search-ui-script').dataset
const snippetLength = parseInt(config.snippetLength || 100, 10)
const siteRootPath = config.siteRootPath || ''
appendStylesheet(config.stylesheet)
const searchInput = document.getElementById('search-input')
const searchResult = document.createElement('div')
searchResult.classList.add('search-result-dropdown-menu')
searchInput.parentNode.appendChild(searchResult)
const facetFilterInput = document.querySelector('#search-field input[type=checkbox][data-facet-filter]')

function appendStylesheet (href) {
  if (!href) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

function createSearchResult (result, store, searchResultDataset) {
  result.forEach(function (item) {
    const ids = item.ref.split('-')
    const docId = ids[0]
    const doc = store[docId]
    let sectionTitle
    if (ids.length > 1) {
      const titleId = ids[1]
      sectionTitle = doc.titles.filter(function (item) {
        return String(item.id) === titleId
      })[0]
    }
    const metadata = item.matchData.metadata
    const nodes = highlightHit(metadata, sectionTitle, doc, snippetLength)
    searchResultDataset.appendChild(createSearchResultItem(doc, sectionTitle, item, nodes))
  })
}

function createSearchResultItem (doc, sectionTitle, item, nodes) {
  const documentTitle = document.createElement('div')
  documentTitle.classList.add('search-result-document-title')
  documentTitle.innerText = doc.title
  const documentHit = document.createElement('div')
  documentHit.classList.add('search-result-document-hit')
  const documentHitLink = document.createElement('a')
  documentHitLink.href = siteRootPath + doc.url + (sectionTitle ? '#' + sectionTitle.hash : '')
  documentHit.appendChild(documentHitLink)
  nodes.forEach(function (node) {
    let element
    if (node.type === 'text') {
      element = document.createTextNode(node.text)
    } else {
      element = document.createElement('span')
      element.classList.add('search-result-highlight')
      element.innerText = node.text
    }
    documentHitLink.appendChild(element)
  })
  const searchResultItem = document.createElement('div')
  searchResultItem.classList.add('search-result-item')
  searchResultItem.appendChild(documentTitle)
  searchResultItem.appendChild(documentHit)
  searchResultItem.addEventListener('mousedown', function (e) {
    e.preventDefault()
  })
  return searchResultItem
}

function createNoResult (text) {
  const searchResultItem = document.createElement('div')
  searchResultItem.classList.add('search-result-item')
  const documentHit = document.createElement('div')
  documentHit.classList.add('search-result-document-hit')
  const message = document.createElement('strong')
  message.innerText = 'No results found for query "' + text + '"'
  documentHit.appendChild(message)
  searchResultItem.appendChild(documentHit)
  return searchResultItem
}

function clearSearchResults (reset) {
  if (reset === true) searchInput.value = ''
  searchResult.innerHTML = ''
}

function filter (result, store) {
  const facetFilter = facetFilterInput && facetFilterInput.checked && facetFilterInput.dataset.facetFilter
  if (facetFilter) {
    const [field, value] = facetFilter.split(':')
    return result.filter((item) => {
      const ids = item.ref.split('-')
      const docId = ids[0]
      const doc = store[docId]
      return field in doc && doc[field] === value
    })
  }
  return result
}

function search (index, store, queryString) {
  // execute an exact match search
  let query
  let result = filter(
    index.query(function (lunrQuery) {
      const parser = new globalThis.lunr.QueryParser(queryString, lunrQuery)
      parser.parse()
      query = lunrQuery
    }),
    store
  )
  if (result.length > 0) {
    return result
  }
  // no result, use a begins with search
  result = filter(
    index.query(function (lunrQuery) {
      lunrQuery.clauses = query.clauses.map((clause) => {
        if (clause.presence !== globalThis.lunr.Query.presence.PROHIBITED) {
          clause.term = clause.term + '*'
          clause.wildcard = globalThis.lunr.Query.wildcard.TRAILING
          clause.usePipeline = false
        }
        return clause
      })
    }),
    store
  )
  if (result.length > 0) {
    return result
  }
  // no result, use a contains search
  result = filter(
    index.query(function (lunrQuery) {
      lunrQuery.clauses = query.clauses.map((clause) => {
        if (clause.presence !== globalThis.lunr.Query.presence.PROHIBITED) {
          clause.term = '*' + clause.term + '*'
          clause.wildcard = globalThis.lunr.Query.wildcard.LEADING | globalThis.lunr.Query.wildcard.TRAILING
          clause.usePipeline = false
        }
        return clause
      })
    }),
    store
  )
  return result
}

function searchIndex (index, store, text) {
  clearSearchResults(false)
  if (text.trim() === '') {
    return
  }
  const result = search(index, store, text)
  const searchResultDataset = document.createElement('div')
  searchResultDataset.classList.add('search-result-dataset')
  searchResult.appendChild(searchResultDataset)
  if (result.length > 0) {
    createSearchResult(result, store, searchResultDataset)
  } else {
    searchResultDataset.appendChild(createNoResult(text))
  }
}

function confineEvent (e) {
  e.stopPropagation()
}

function debounce (func, wait, immediate) {
  let timeout
  return function () {
    const context = this
    const args = arguments
    const later = function () {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}

function enableSearchInput (enabled) {
  searchInput.disabled = !enabled
  searchInput.title = enabled ? '' : 'Loading index...'
}

function isClosed () {
  return searchResult.childElementCount === 0
}

function executeSearch (index) {
  const debug = 'URLSearchParams' in globalThis && new URLSearchParams(globalThis.location.search).has('lunr-debug')
  const query = searchInput.value
  try {
    if (!query) return clearSearchResults()
    searchIndex(index.index, index.store, query)
  } catch (err) {
    if (debug) console.debug('Invalid search query: ' + query + ' (' + err.message + ')')
  }
}

function toggleFilter (e, index) {
  searchInput.focus()
  if (!isClosed()) {
    executeSearch(index)
  }
}

export function initSearch (lunr, data) {
  const start = performance.now()
  const index = { index: lunr.Index.load(data.index), store: data.store }
  enableSearchInput(true)
  searchInput.dispatchEvent(
    new CustomEvent('loadedindex', {
      detail: {
        took: performance.now() - start,
      },
    })
  )
  searchInput.addEventListener(
    'keydown',
    debounce(function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') return clearSearchResults(true)
      executeSearch(index)
    }, 100)
  )
  searchInput.addEventListener('click', confineEvent)
  searchResult.addEventListener('click', confineEvent)
  if (facetFilterInput) {
    facetFilterInput.parentElement.addEventListener('click', confineEvent)
    facetFilterInput.addEventListener('change', (e) => toggleFilter(e, index))
  }
  document.documentElement.addEventListener('click', clearSearchResults)
}

// disable the search input until the index is loaded
enableSearchInput(false)
