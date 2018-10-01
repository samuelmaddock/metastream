import process from 'process'
import os from 'os'
import { dialog, clipboard } from 'electron'
import { PRODUCT_NAME } from 'constants/app'

const isNativeDllError = (err: Error) =>
  os.platform() === 'win32' &&
  err.message.indexOf('The specified module could not be found') > -1 &&
  err.message.indexOf('dlopen') > -1

process.on('uncaughtException', err => {
  const message = err.stack || err.message || 'Unknown error'
  if (isNativeDllError(err)) {
    dialog.showErrorBox(
      'Error: Missing native dependency',
      `Please install 'Visual C++ Redistributable for Visual Studio 2015' to continue.

${message}`
    )
  } else {
    const reportUrl = 'https://github.com/samuelmaddock/metastream/issues'

    console.error(message)
    clipboard.writeText(`${reportUrl}\n${message}`)

    dialog.showErrorBox(
      `${PRODUCT_NAME} Error`,
      `An error occurred while running ${PRODUCT_NAME}. The program will terminate after closing this message.

Please report this issue to the developer by creating an issue on GitHub. The full error message has been copied to your clipboard.
${reportUrl}

${message}`
    )
  }

  process.exit(1)
})
