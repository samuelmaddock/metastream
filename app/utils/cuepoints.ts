const TIMESTAMP_REGEX = /(\d+:\d\d(?::\d\d)?)/;

type TimestampPair = [/*time*/ string, /*label*/ string];

/** Parse string for pairs of timestamp and label */
export const parseTimestampPairs = (str: string): TimestampPair[] => {
  const lines = str.split('\n');

  const results = lines
    .map(line => {
      const match = TIMESTAMP_REGEX.exec(line);
      if (match) {
        const time = match[1];
        const start = match.index;
        const end = start + time.length;

        // add/remove 1 char to skip wrapping
        const lhs = line.substring(0, start - 1);
        const rhs = line.substring(end + 1, line.length);

        const label = lhs.length > rhs.length ? lhs : rhs;

        return [time, label.trim()];
      }
    })
    .filter(Boolean);

  return results as TimestampPair[];
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
