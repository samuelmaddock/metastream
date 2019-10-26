import {
  parseDescription,
  TIMESTAMP_REGEX,
  LINK_REGEX,
  ParseToken,
  BOLD_REGEX,
  ITALIC_REGEX,
  parseText
} from './description'

it('matches timestamps', () => {
  expect(TIMESTAMP_REGEX.test('0:12')).toBeTruthy()
  expect(TIMESTAMP_REGEX.test('1:23')).toBeTruthy()
  expect(TIMESTAMP_REGEX.test('11:23')).toBeTruthy()
  expect(TIMESTAMP_REGEX.test('11:2')).toBeFalsy()
  expect(TIMESTAMP_REGEX.test('1:2')).toBeFalsy()

  expect(TIMESTAMP_REGEX.test('1:23:45')).toBeTruthy()
  expect(TIMESTAMP_REGEX.test('11:23:45')).toBeTruthy()

  expect(TIMESTAMP_REGEX.test('11:23:45:67')).toBeTruthy()

  expect(TIMESTAMP_REGEX.test('nope')).toBeFalsy()
})

it('matches URLs', () => {
  expect(LINK_REGEX.test('https://example.com')).toBeTruthy()
  expect(LINK_REGEX.test('http://example.com')).toBeTruthy()
  expect(LINK_REGEX.test('http://')).toBeFalsy()
  expect(LINK_REGEX.test('ftp://unsupported-protocol')).toBeFalsy()
  expect(LINK_REGEX.test('not URL')).toBeFalsy()
})

it('matches bold text', () => {
  expect(BOLD_REGEX.test('__bold__')).toBeTruthy()
  expect(BOLD_REGEX.test('__bold__ ')).toBeTruthy()
  expect(BOLD_REGEX.test(' __bold__')).toBeTruthy()
  expect(BOLD_REGEX.test(' __bold__ ')).toBeTruthy()
  expect(BOLD_REGEX.test('__not__bold')).toBeFalsy()
  expect(BOLD_REGEX.test('_____')).toBeTruthy()
  expect(BOLD_REGEX.test('__ _ __')).toBeTruthy()

  expect(BOLD_REGEX.test('**bold**')).toBeTruthy()
  expect(BOLD_REGEX.test('**bold** ')).toBeTruthy()
  expect(BOLD_REGEX.test(' **bold**')).toBeTruthy()
  expect(BOLD_REGEX.test(' **bold** ')).toBeTruthy()
  expect(BOLD_REGEX.test('**not**bold')).toBeFalsy()
  expect(BOLD_REGEX.test('*****')).toBeTruthy()
  expect(BOLD_REGEX.test('** ** **')).toBeTruthy()
})

it('matches italic text', () => {
  expect(ITALIC_REGEX.test('_italic_')).toBeTruthy()
  expect(ITALIC_REGEX.test(' _italic_')).toBeTruthy()
  expect(ITALIC_REGEX.test('_italic_ ')).toBeTruthy()
  expect(ITALIC_REGEX.test(' _italic_ ')).toBeTruthy()

  expect(ITALIC_REGEX.test('_not_italic')).toBeFalsy()
  expect(ITALIC_REGEX.test('not_italic_')).toBeFalsy()
})

it('parses invalid timestamps as text', () => {
  const parseTimestamp = (text: string) => parseText(text, [ParseToken.TIMESTAMP])
  expect(parseTimestamp('1:23:45:67')).toEqual([{ type: ParseToken.TEXT, content: '1:23:45:67' }])
  expect(parseTimestamp('1:22:33:44 11:22 1:22:33')).toEqual([
    { type: ParseToken.TEXT, content: '1:22:33:44 ' },
    { type: ParseToken.TIMESTAMP, content: '11:22' },
    { type: ParseToken.TEXT, content: ' ' },
    { type: ParseToken.TIMESTAMP, content: '1:22:33' }
  ])
  expect(parseTimestamp('test1:23')).toEqual([{ type: ParseToken.TEXT, content: 'test1:23' }])
  expect(parseTimestamp('1:23test')).toEqual([{ type: ParseToken.TEXT, content: '1:23test' }])
  expect(parseTimestamp('test1:23test')).toEqual([
    { type: ParseToken.TEXT, content: 'test1:23test' }
  ])
})

it('parses bold text', () => {
  const parseBold = (text: string) => parseText(text, [ParseToken.BOLD])
  expect(parseBold('__bold__')).toEqual([{ type: ParseToken.BOLD, content: 'bold' }])
  expect(parseBold('yo __bold__ text')).toEqual([
    { type: ParseToken.TEXT, content: 'yo ' },
    { type: ParseToken.BOLD, content: 'bold' },
    { type: ParseToken.TEXT, content: ' text' }
  ])
  expect(parseBold('__double__ __bold__')).toEqual([
    { type: ParseToken.BOLD, content: 'double' },
    { type: ParseToken.TEXT, content: ' ' },
    { type: ParseToken.BOLD, content: 'bold' }
  ])
  expect(parseBold('__bold with text inside__')).toEqual([
    { type: ParseToken.BOLD, content: 'bold with text inside' }
  ])
})

it('parses description', () => {
  expect(parseDescription('just text')).toEqual([{ type: ParseToken.TEXT, content: 'just text' }])
  expect(parseDescription('0:00')).toEqual([{ type: ParseToken.TIMESTAMP, content: '0:00' }])
  expect(parseDescription('0:00 Song Name')).toEqual([
    { type: ParseToken.TIMESTAMP, content: '0:00' },
    { type: ParseToken.TEXT, content: ' Song Name' }
  ])

  const input = `0:00 Song A
2:34 Song B

Check out my soundcloud:
https://soundcloud.com/user

Fin`
  expect(parseDescription(input)).toEqual([
    { type: ParseToken.TIMESTAMP, content: '0:00' },
    { type: ParseToken.TEXT, content: ' Song A\n' },
    { type: ParseToken.TIMESTAMP, content: '2:34' },
    {
      type: ParseToken.TEXT,
      content: ' Song B\n\nCheck out my soundcloud:\n'
    },
    { type: ParseToken.LINK, content: 'https://soundcloud.com/user' },
    { type: ParseToken.TEXT, content: '\n\nFin' }
  ])
})
