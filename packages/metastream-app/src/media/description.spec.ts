import { parseDescription, TIMESTAMP_REGEX, LINK_REGEX, ParseToken } from './description'

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

it('ignores invalid timestamps', () => {
  expect(parseDescription('1:23:45:67')).toEqual([{ type: ParseToken.TEXT, content: '1:23:45:67' }])
  expect(parseDescription('1:22:33:44 11:22 1:22:33')).toEqual([
    { type: ParseToken.TEXT, content: '1:22:33:44 ' },
    { type: ParseToken.TIMESTAMP, content: '11:22' },
    { type: ParseToken.TEXT, content: ' ' },
    { type: ParseToken.TIMESTAMP, content: '1:22:33' }
  ])
  expect(parseDescription('test1:23')).toEqual([{ type: ParseToken.TEXT, content: 'test1:23' }])
  expect(parseDescription('1:23test')).toEqual([{ type: ParseToken.TEXT, content: '1:23test' }])
  expect(parseDescription('test1:23test')).toEqual([
    { type: ParseToken.TEXT, content: 'test1:23test' }
  ])
})
