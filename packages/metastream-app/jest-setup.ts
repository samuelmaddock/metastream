// module.exports = async () => {
//   const sodium = require('libsodium-wrappers')
//   await sodium.ready
// }

// beforeAll(async () => {
//   const sodium = require('libsodium-wrappers')
//   await sodium.ready
// })

process.on('unhandledRejection', reason => {
  console.error(reason)
})
