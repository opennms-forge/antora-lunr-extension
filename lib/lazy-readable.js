'use strict'

const { PassThrough } = require('stream')

// adapted from https://github.com/jpommerening/node-lazystream/blob/master/lib/lazystream.js | license: MIT
class LazyReadable extends PassThrough {
  constructor (fn, options) {
    super(options)
    const _read = this._read
    this._read = function () {
      this._read = _read.bind(this)
      fn.call(this, options).on('error', this.emit.bind(this, 'error')).pipe(this)
      return this._read.apply(this, arguments)
    }
    this.emit('readable')
  }
}

module.exports = LazyReadable
