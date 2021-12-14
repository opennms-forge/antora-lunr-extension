/* eslint-env mocha */
'use strict'

process.env.NODE_ENV = 'test'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
chai.use(dirtyChai)
const { configureLogger } = require(require.resolve('@antora/logger', {
  paths: [require.resolve('@antora/site-generator')],
}))
const buildContentCatalog = require('./build-content-catalog')

beforeEach(() => configureLogger({ level: 'silent' }))

module.exports = { buildContentCatalog, configureLogger, expect: chai.expect }
