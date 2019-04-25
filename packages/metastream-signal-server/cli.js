const createServer = require('./').default

const PORT = 27064

async function main() {
  const server = await createServer({ port: PORT })
  console.log(`Listening at ws://127.0.0.1:${PORT}`)
}

main()
