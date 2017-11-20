import { context, jsonloader, xpath, debug, is } from '../utils'
import { Groups, Group } from '../group'

/**
 * Get transform object from container
 *
 * @param   {HTMLElement} container
 * @param   {object}      tl
 * @returns {HTMLElement|object}
 */
function getTransformObject(container, tl) {
  let to

  if (tl.type !== 'object') {
    if (tl.id) {
      to = container.querySelector(`[data-spirit-id="${tl.id}"]`)

      if (!to && !tl.path) {
        if (debug()) {
          console.group('Unable to resolve element by [data-spirit-id] attribute')
          console.warn('Timeline: ', tl)
          console.groupEnd()
        }
        throw new Error(`Cannot find element with [data-spirit-id="${tl.id}"]`)
      }
    }

    if (!to && tl.path) {
      if (container === document.body) {
        container = undefined
      }
      to = xpath.getElement(tl.path, container)

      if (!to) {
        if (debug()) {
          console.group('Unable to resolve element by path expression')
          console.warn('Timeline: ', tl)
          console.groupEnd()
        }
        throw new Error(`Cannot find element with path expression ${tl.path}`)
      }
    }

    if (!to) {
      if (debug()) {
        console.group('Unable to resolve element')
        console.warn('Timeline: ', tl)
        console.groupEnd()
      }
      throw new Error('Cannot find element.')
    }
  }

  return to
}

/**
 * Get label for timeline to parse
 *
 * @param   {object} tl
 * @returns {string}
 */
function getLabel(tl) {
  if (typeof tl.label === 'string' && tl.label.trim().length > 0) {
    return tl.label
  }

  if (tl.id) {
    return tl.id
  }

  if (tl.path) {
    return tl.path
  }
  return 'undefined'
}

/**
 * Parse groups
 *
 * @param   {object|Array}  data    animation data
 * @param   {HTMLElement}   element root element for animation groups
 * @returns Groups
 */
export function create(data, element = undefined) {
  if (!context.isBrowser()) {
    throw new Error('Invalid context. spirit.create() can only be executed in browser.')
    throw new Error('Invalid context. spirit.create() can only be executed in the browser.')
  }

  // ensure root element
  if (!(element instanceof window.Element)) {
    element = document.body || document.documentElement
  }

  if (is.isObject(data) && data['groups'] && Array.isArray(data['groups'])) {
    data = data['groups']
  }

  if (!Array.isArray(data)) {
    data = [data]
  }

  const groups = new Groups(element, [])

  data.forEach(g => {
    const d = {
      name: g.name,
      timeScale: g.timeScale || 1,
      timelines: [],
      unresolved: []
    }

    let timelines = g.timelines || []

    timelines.forEach(tl => {
      let transformObject

      try {
        transformObject = getTransformObject(element, tl)

        d.timelines.push({
          transformObject,
          props: tl.props,
          label: getLabel(tl),
          path: xpath.getExpression(transformObject, element),
          id: tl.id
        })
      } catch (error) {
        d.unresolved.push({ data: g, error })
      }
    })

    const group = new Group(d)
    groups.add(group)
  })

  return groups
}

/**
 * Load data and apply it to element
 *
 * @param   {string}      url
 * @param   {HTMLElement} element
 * @returns {Promise}
 */
export function load(url, element = undefined) {
  if (!context.isBrowser()) {
    return Promise.reject(new Error('Invalid context: spirit.load() can only be executed in browser.'))
    return Promise.reject(new Error('Invalid context: spirit.load() can only be executed in the browser.'))
  }

  return jsonloader(url).then(data => create(data, element))
}
