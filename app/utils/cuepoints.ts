const TIMESTAMP_REGEX = /(\d+:\d\d(?::\d\d)?)\s+([^\n]+)/g;

export const parseTimestampPairs = (str: string) => {
  const results = [];

  let match;
  while ((match = TIMESTAMP_REGEX.exec(str))) {
    if (match[1]) {
      results.push([match[1], match[2]]);
    }
  }

  return results;
};

export const timestampToMilliseconds = (str: string) => {
  const p = str.split(':');
  let s = 0,
    m = 1;

  while (p.length > 0) {
    s += m * parseInt(p.pop() + '', 10);
    m *= 60;
  }

  return s * 1000;
};
