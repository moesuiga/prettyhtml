#!/usr/bin/env node

'use strict'

const { PassThrough } = require('stream')
const { basename, join } = require('path')
const prettier = require('prettier')
const engine = require('unified-engine')
const unified = require('unified')
const updateNotifier = require('update-notifier')
const { cosmiconfigSync } = require('cosmiconfig')
const { configTransform, processResult } = require('./processor')
const args = require('./args')
const pkg = require('./../package')

const explorerSync = cosmiconfigSync('prettyhtml')

function getDefaultSettings() {
  const settings = {
    extensions: ['html'],
    streamError: new PassThrough(), // sink errors
    // rcName: '.prettyhtmlrc',
    packageField: 'prettyhtml',
    ignoreName: '.prettyhtmlignore',
    frail: false
  }
  return settings
}

function getPrettyhtmlRC(config) {
  try {
    let result = null
    if (config) {
      result = explorerSync.load(join(process.cwd(), config))
    } else {
      result = explorerSync.search(process.cwd())
    }
    return (result && result.config) || {}
  } catch (e) {
    console.warn(e)
    return {}
  }
}

module.exports = { getDefaultSettings, getPrettyhtmlRC }

// this was run directly from the command line
if (require.main === module) {
  const notifier = updateNotifier({
    pkg: {
      name: 'prettyhtml',
      version: pkg.version
    },
    updateCheckInterval: 1000 * 60 * 60 * 24 * 7 // 1 week
  })

  notifier.notify({
    isGlobal: false,
    defer: false
  })

  const prettierConfig = prettier.resolveConfig.sync(process.cwd()) || {}
  const cli = args(prettierConfig)

  cli.flags = Object.assign({}, cli.flags, getPrettyhtmlRC())

  const settings = getDefaultSettings()
  settings.configTransform = configTransform
  settings.defaultConfig = configTransform({ prettierConfig, cli })
  settings.processor = unified()

  if (cli.flags.stdin === false) {
    if (cli.input.length === 0) {
      cli.showHelp()
    } else {
      settings.files = cli.input
      settings.output = true // Whether to overwrite the input files
      settings.out = false // Whether to write the processed file to streamOut

      engine(settings, processResult({ cli }))
    }
  } else {
    if (cli.input.length !== 0) {
      settings.output = basename(cli.input[0])
    }
    engine(settings, processResult({ cli }))
  }
}
