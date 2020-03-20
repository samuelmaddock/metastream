const createServer = require('./lib').default

const PORT = parseInt(process.env.PORT, 10) || 27064

async function main() {
  const username = process.env.SIGNAL_USERNAME
  const password = process.env.SIGNAL_PASSWORD
  const credentials = username && password ? { username, password } : undefined

  const server = await createServer({
    port: PORT,
    credentials
  })
  console.log(`Listening at ws://127.0.0.1:${PORT}`)
}

main()
