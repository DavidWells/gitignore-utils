const path = require('path')
const { find, addRules } = require('./')

async function example() {
  const nearestIgnore = await find(__dirname)
  console.log('nearestIgnore', nearestIgnore)

  const gitIgnorePath = path.join(__dirname, '.gitignore')
  const details = await addRules(gitIgnorePath, [
    {
      comment: '# General OS stuff',
      patterns: ['.DS_Store']
    },
    {
      comment: '# Netlify stuff',
      patterns: ['.netlify', 'functions_out']
    },
    {
      comment: '# Rad stuff',
      patterns: ['.hello']
    }
  ])
  console.log('details', details)
}

example()
