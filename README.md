# Gitignore utils

Utilities for working with `.gitignore` files

```js
const path = require('path')
const { addRules } = require('gitignore-utils')
 
async function ensureGitIgnore() {
  const gitIgnorePath = path.resolve(__dirname, '.gitignore')
  const gitIgnoreDetails = await addRules(gitIgnorePath, [
    {
      comment: '# Super secret stuff',
      patterns: ['.env', '.env.prod']
    },
    {
      comment: '# Project stuff',
      patterns: ['.netlify', '.serverless']
    },
    {
      comment: '# Other things',
      patterns: ['.shhhh', '/folder']
    }
  ])
  console.log('gitIgnoreDetails', gitIgnoreDetails)
}

ensureGitIgnore()

/*
.gitignore file now has these lines added

# Super secret stuff
.env
.env.prod

# Project stuff
.netlify
.serverless

# Other things
.shhhh
/folder
*/
```
