const fs = require('fs')
const chalk = require('chalk')
const requireFromString = require('require-from-string')
const languageToCompare = process.argv[2]

// Reading the files through fs because js can't import ts modules and typescript can't dynamically import modules
const localeBaseRaw = fs.readFileSync(__dirname + '/src/locale/en-US.ts', 'utf8')
const localeNewRaw = fs.readFileSync(__dirname + '/src/locale/' + languageToCompare + '.ts', 'utf8')

const localeBase = typescriptToObject(localeBaseRaw)
const localeNew = typescriptToObject(localeNewRaw)

console.log('---- LOCALE DIFF ----')
console.log('')

let newKeys = 0
let removedKeys = 0

// Find missing keys
for (let [key, value] of Object.entries(localeBase)) {
  if (!localeNew.hasOwnProperty(key)) {
    console.log(
      '[' + languageToCompare + '][' + chalk.red('MISSING') + '] ' + key + ": '" + value + "'"
    )
    newKeys++
  }
}

// Find removed keys
for (let [key, value] of Object.entries(localeNew)) {
  if (!localeBase.hasOwnProperty(key)) {
    console.log('[en-US][' + chalk.blue('REMOVED') + '] ' + key + ': "' + value + '"')
    removedKeys++
  }
}

console.log('')
console.log('------ RESULTS ------')
console.log('')

if (newKeys > 0 || removedKeys > 0) {
  console.log(
    'There are ' +
      chalk.red(newKeys + ' keys') +
      ' missing in ' +
      languageToCompare +
      ' and ' +
      chalk.blue(removedKeys + ' keys') +
      ' which are not present in en-US anymore.'
  )
} else {
  console.log(
    chalk.green(
      'Both ' +
        languageToCompare +
        ' and en-US have the same keys. This means ' +
        languageToCompare +
        ' is up to date'
    )
  )
}

console.log('')
console.log('---------------------')

function typescriptToObject(_data) {
  // Since this is a JS file we need to swap the ES6 export to a CommonJS export
  let fixedData = _data.replace('export default ', 'module.exports = ')

  // Using requireFromString to transform the string to a module / object
  let dataAsObject = requireFromString(fixedData)
  return dataAsObject
}
