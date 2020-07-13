const fs = require('fs')
const escalade = require('escalade')
const parseIgnore = require('parse-gitignore')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const fileExists = (s) => new Promise(r => fs.access(s, fs.F_OK, e => r(!e))) // eslint-disable-line

async function findGitIgnore(dir) {
  const gitIgnorePath = await escalade(dir, (foundDir, names) => {
    if (names.includes('.gitignore')) {
      // will be resolved into absolute
      return '.gitignore'
    }
  })
  return gitIgnorePath
}

function parser(input, fn = line => line) {
  let lines = input.toString().split(/\r?\n/)
  let section = { name: 'default', patterns: [] }
  let state = { patterns: [], sections: [section] }

  for (let line of lines) {
    if (line.charAt(0) === '#') {
      section = { name: line.slice(1).trim(), patterns: [] }
      state.sections.push(section)
      continue
    }

    if (line.trim() !== '') {
      let pattern = fn(line, section, state)
      section.patterns.push(pattern)
      state.patterns.push(pattern)
    }
  }
  return state
}

function stringify(state) {
  return parseIgnore.stringify(state.sections, section => {
    if (!section.patterns.length) {
      return ''
    }

    return `# ${section.name}\n${section.patterns.join('\n')}\n\n`
  })
}

function parse(input, fn) {
  const state = parser(input, fn)

  state.concat = i => {
    const newState = parser(i, fn)

    for (let s2 in newState.sections) {
      const sec2 = newState.sections[s2]

      let sectionExists = false
      for (let s1 in state.sections) {
        const sec1 = state.sections[s1]

        // Join sections under common name
        if (sec1.name === sec2.name) {
          sectionExists = true
          sec1.patterns = Array.from(new Set(sec1.patterns.concat(sec2.patterns)))
        }
      }

      // Add new section
      if (!sectionExists) {
        state.sections.push(sec2)
      }
    }

    return state
  }

  return state
}

function gatherMatches(currentFileContents, patterns) {
  const matches = patterns.reduce((acc, curr) => {
    const patternsToSet = curr.patterns || []
    const values = patternsToSet.map((pattern) => {
      const ignoreData = parseIgnore.parse(currentFileContents) || {}
      if (pattern instanceof RegExp) {
        // Todo maybe support
      }
      if (typeof pattern === 'string' && !ignoreData.patterns.includes(pattern)) {
        return pattern
      }
    }).filter((Boolean))

    if (values.length) {
      acc = acc.concat({
        comment: curr.comment,
        pattern: values
      })
    }
    return acc
  }, [])
  return matches
}

function generateNewIgnoreRules(matches) {
  const writeData = matches.reduce((acc, curr, i) => {
    const lastItem = matches.length === (i + 1)
    const comment = (curr.comment) ? `${curr.comment}\n` : ''
    const patterns = curr.pattern.reduce((a, c, n) => {
      if (curr.pattern.length === (n + 1)) {
        const postFix = (lastItem) ? '\n' : '\n\n'
        a += `${c}${postFix}`
      } else {
        a += `${c}\n`
      }
      return a
    }, '')
    const write = `${comment}${patterns}`
    acc += write
    return acc
  }, '')
  return writeData
}

async function addGitIgnoreRules(gitIgnorePath, patterns) {
  const exists = await fileExists(gitIgnorePath)

  /* No .gitignore file. Create one in dir & insert contents */
  if (!exists) {
    const matches = gatherMatches('', patterns)
    const writeData = generateNewIgnoreRules(matches)
    await writeFile(gitIgnorePath, writeData, 'utf8')
    return parseIgnore.parse(writeData)
  }

  const gitIgnoreContents = await readFile(gitIgnorePath, 'utf8')

  const matches = gatherMatches(gitIgnoreContents, patterns)

  // console.log('matches', matches)
  if (!matches || !matches.length) {
    return parseIgnore.parse(gitIgnoreContents)
  }

  const writeData = generateNewIgnoreRules(matches)

  const newIgnoreContents = `${gitIgnoreContents.replace(/[\r|\n|\r\n]$/, '')}\n\n${writeData}`
  // Update gitignore
  await writeFile(gitIgnorePath, newIgnoreContents, 'utf8')
  // Return parsed info
  return parseIgnore.parse(newIgnoreContents)
}

module.exports = {
  parse: parse,
  stringify: stringify,
  format: parseIgnore.format,
  find: findGitIgnore,
  addRules: addGitIgnoreRules,
}
