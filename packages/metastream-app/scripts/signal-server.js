const createServer = require('@metastream/signal-server').default

const PORT = process.env.SIGNAL_SERVER_PORT || 27064

async function main() {
  await createServer({ port: PORT })
  console.log(`Signal server listening on ws://localhost:${PORT}`)
}

main()
