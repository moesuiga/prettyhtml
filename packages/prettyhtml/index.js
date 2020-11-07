'use strict'

const VFile = require('vfile')
const unified = require('unified')
const parse = require('@wayowe/rehype-webparser')
const stringify = require('@wayowe/prettyhtml-formatter/stringify')
const format = require('@wayowe/prettyhtml-formatter')
const sortAttributes = require('@wayowe/prettyhtml-sort-attributes')

module.exports = prettyhtml

function core(value, processor, options) {
  const file = new VFile(value)
  let proc = processor().use(format, {
    tabWidth: options.tabWidth,
    useTabs: options.useTabs,
    usePrettier: options.usePrettier,
    prettier: options.prettier
  })

  if (options.sortAttributes) {
    proc = proc.use(sortAttributes)
  }

  return proc
    .use(stringify, {
      wrapAttributes: options.wrapAttributes,
      printWidth: options.printWidth,
      tabWidth: options.tabWidth,
      useTabs: options.useTabs,
      singleQuote: options.singleQuote,
      voids: options.voids,
      closeSelfClosing: options.closeSelfClosing === undefined ? true : options.closeSelfClosing,
      tightSelfClosing: options.tightSelfClosing,
      closeEmptyElements: options.closeEmptyElements === undefined ? true : options.closeEmptyElements,
      tightCommaSeparatedLists: options.tightCommaSeparatedLists
    })
    .processSync(file)
}

function prettyhtml(value, options) {
  const opt = Object.assign({}, options)
  return core(
    value,
    unified()
      .use(parse, {
        ignoreFirstLf: false,
        decodeEntities: false,
        selfClosingCustomElements: true,
        selfClosingElements: true,
        voids: opt.voids
      })
      .freeze(),
    opt
  )
}
