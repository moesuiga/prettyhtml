'use strict'

var find = require('property-information/find')
var parseSelector = require('hast-util-parse-selector')
var spaces = require('space-separated-tokens').parse
var commas = require('comma-separated-tokens').parse

module.exports = factory

function factory(schema, defaultTagName) {
  return h

  /* Hyperscript compatible DSL for creating virtual HAST trees. */
  function h(selector, properties, children) {
    var node = parseSelector(selector, defaultTagName)
    var property

    if (!children && properties && !properties[Symbol.for('hast.isProp')] && isChildren(properties, node)) {
      children = properties
      properties = null
    }

    if (properties) {
      for (property in properties) {
        addProperty(node.properties, property, properties[property])
      }
    }

    addChild(node.children, children)

    return node
  }

  function addProperty(properties, key, value) {
    var info
    var property
    var result

    /* Ignore nully and NaN values. */
    // eslint-disable-next-line no-self-compare
    if (value === null || value === undefined || value !== value) {
      return
    }

    info = find(schema, key)
    property = info.property
    result = value

    /* Handle list values. */
    if (typeof result === 'string') {
      if (info.spaceSeparated) {
        result = spaces(result)
      } else if (info.commaSeparated) {
        result = commas(result)
      } else if (info.commaOrSpaceSeparated) {
        result = spaces(commas(result).join(' '))
      }
    }

    /* Accept `object` on style. */
    if (property === 'style' && typeof value !== 'string') {
      result = style(result)
    }

    /* Class-names (which can be added both on the `selector` and here). */
    if (property === 'className' && properties.className) {
      result = properties.className.concat(result)
    }

    properties[property] = parsePrimitives(info, property, result)
  }
}

// Value can be: string for text node, array for chilNodes
function isChildren(value, node) {
  return typeof value === 'string' || 'length' in value || isNode(node.tagName, value)
}

function isNode(tagName, value) {
  var type = value.type

  if (tagName === 'input' || !type || typeof type !== 'string') {
    return false
  }

  if (typeof value.children === 'object' && 'length' in value.children) {
    return true
  }

  type = type.toLowerCase()

  if (tagName === 'button') {
    // 小程序文件中 button 组件的 type 属性是 default/primary/warn
    // 且可以使用动态数据更改，如 type="{{ buttonType }}"
    // 原有逻辑会返回 true，导致后续以有子组件来解析出错，实际如果有子组件的话，根本不会进入这个分支，甚至可能都不会触发 isNode 这个方法
    return false
    // return type !== 'menu' && type !== 'submit' && type !== 'reset' && type !== 'button'
  }

  return 'value' in value
}

function addChild(nodes, value) {
  var index
  var length

  if (value === null || value === undefined) {
    return
  }

  if (typeof value === 'string' || typeof value === 'number') {
    nodes.push({ type: 'text', value: String(value) })
    return
  }

  if (typeof value === 'object' && 'length' in value) {
    index = -1
    length = value.length

    while (++index < length) {
      addChild(nodes, value[index])
    }

    return
  }

  if (typeof value !== 'object' || !('type' in value)) {
    throw new Error('Expected node, nodes, or string, got `' + value + '`')
  }

  nodes.push(value)
}

/* Parse a (list of) primitives. */
function parsePrimitives(info, name, value) {
  var index
  var length
  var result

  if (typeof value !== 'object' || !('length' in value)) {
    return parsePrimitive(info, name, value)
  }

  length = value.length
  index = -1
  result = []

  while (++index < length) {
    result[index] = parsePrimitive(info, name, value[index])
  }

  return result
}

/* Parse a single primitives. */
function parsePrimitive(info, name, value) {
  var result = value

  if (info.number || info.positiveNumber) {
    if (!isNaN(result) && result !== '') {
      result = Number(result)
    }
  } else if (info.boolean || info.overloadedBoolean) {
    /* Accept `boolean` and `string`. */
    if (typeof result === 'string' && result === '') {
      result = true
    }
  }

  return result
}

function style(value) {
  var result = []
  var key

  for (key in value) {
    result.push([key, value[key]].join(': '))
  }

  return result.join('; ')
}
