'use strict'

function highlightText (doc, position, snippetLength) {
  const nodes = []
  const start = position[0]
  const length = position[1]

  const text = doc.text
  const highlightMark = {
    type: 'mark',
    text: text.substr(start, length),
  }

  const end = start + length
  const textEnd = text.length - 1
  const contextAfter = end + snippetLength > textEnd ? textEnd : end + snippetLength
  const contextBefore = start - snippetLength < 0 ? 0 : start - snippetLength
  if (start === 0 && end === textEnd) {
    nodes.push(highlightMark)
  } else if (start === 0) {
    nodes.push(highlightMark)
    nodes.push({
      type: 'text',
      text: text.substr(end, contextAfter),
    })
  } else if (end === textEnd) {
    nodes.push({
      type: 'text',
      text: text.substr(0, start),
    })
    nodes.push(highlightMark)
  } else {
    nodes.push({
      type: 'text',
      text: '...' + (text.substr(contextBefore, start - contextBefore)),
    })
    nodes.push(highlightMark)
    nodes.push({
      type: 'text',
      text: (text.substr(end, contextAfter - end)) + '...',
    })
  }
  return nodes
}

function highlightTitle (sectionTitle, doc, position) {
  const nodes = []
  const start = position[0]
  const length = position[1]

  let title
  if (sectionTitle) {
    title = sectionTitle.text
  } else {
    title = doc.title
  }
  const highlightMark = {
    type: 'mark',
    text: title.substr(start, length),
  }

  const end = start + length
  const titleEnd = title.length - 1
  if (start === 0 && end === titleEnd) {
    nodes.push(highlightMark)
  } else if (start === 0) {
    nodes.push(highlightMark)
    nodes.push({
      type: 'text',
      text: title.substr(length, titleEnd),
    })
  } else if (end === titleEnd) {
    nodes.push({
      type: 'text',
      text: title.substr(0, start),
    })
    nodes.push(highlightMark)
  } else {
    nodes.push({
      type: 'text',
      text: title.substr(0, start),
    })
    nodes.push(highlightMark)
    nodes.push({
      type: 'text',
      text: title.substr(end, titleEnd),
    })
  }
  return nodes
}

export function highlightHit (searchMetadata, sectionTitle, doc, snippetLength) {
  let nodes = []
  for (const token in searchMetadata) {
    const fields = searchMetadata[token]
    for (const field in fields) {
      const positions = fields[field]
      if (positions.position) {
        const position = positions.position[0] // only higlight the first match
        if (field === 'title') {
          nodes = highlightTitle(sectionTitle, doc, position)
        } else if (field === 'text') {
          nodes = highlightText(doc, position, snippetLength)
        }
      }
    }
  }
  return nodes
}
