const createServer = require('./lib').default

const PORT = parseInt(process.env.PORT, 10) || 27064

async function main() {
  const server = await createServer({ port: PORT })
  console.log(`Listening at ws://127.0.0.1:${PORT}`)
}

main()
