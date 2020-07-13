# Gitignore utils

Utilities for working with `.gitignore` files

```js
const { parse, stringify, format, find, addRules } = require('gitignore-utils')

const gitIgnorePath = path.resolve(__dirname, '.gitignore')

addRules(gitIgnorePath, [
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
]).then((gitIgnoreDetails) => {
  console.log('details', gitIgnoreDetails)
})
```
