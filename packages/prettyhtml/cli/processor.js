const parse = require('@wayowe/rehype-webparser')
const stringify = require('@wayowe/prettyhtml-formatter/stringify')
const sortAttributes = require('@wayowe/prettyhtml-sort-attributes')
const format = require('@wayowe/prettyhtml-formatter')
const report = require('vfile-reporter')

function processResult({ cli }) {
  return (err, code, result) => {
    const out = report(err || result.files, {
      quiet: cli.flags.quiet,
      silent: cli.flags.silent
    })

    if (out) {
      console.error(out)
    }

    // eslint-disable-next-line no-process-exit
    process.exit(code)
  }
}

function configTransform({ prettierConfig, cli }) {
  const plugins = [
    [
      parse,
      {
        ignoreFirstLf: false,
        decodeEntities: false,
        selfClosingCustomElements: true,
        selfClosingElements: true,
        voids: cli.flags.voids
      }
    ],
    [
      format,
      {
        tabWidth: cli.flags.tabWidth,
        useTabs: cli.flags.useTabs,
        singleQuote: cli.flags.singleQuote,
        usePrettier: cli.flags.usePrettier,
        prettier: prettierConfig
      }
    ]
  ]

  if (cli.flags.sortAttributes || prettierConfig.sortAttributes) {
    plugins.push([sortAttributes, {}])
  }

  plugins.push([
    stringify,
    {
      tabWidth: cli.flags.tabWidth,
      printWidth: cli.flags.printWidth,
      singleQuote: cli.flags.singleQuote,
      wrapAttributes: cli.flags.wrapAttributes,
      voids: cli.flags.voids,
      closeSelfClosing: cli.flags.closeSelfClosing,
      tightSelfClosing: cli.flags.tightSelfClosing,
      closeEmptyElements: cli.flags.closeEmptyElements,
      tightCommaSeparatedLists: cli.flags.tightCommaSeparatedLists
    }
  ])

  return { plugins }
}

module.exports = { configTransform, processResult }
