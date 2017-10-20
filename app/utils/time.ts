const formatSeconds = (sec: number): string => {
  sec = Math.round(sec);

  let hours: string | number = Math.floor(sec / 3600);
  let minutes: string | number = Math.floor((sec % 3600) / 60);
  let seconds: string | number = sec % 60;

  if (minutes < 10) {
    minutes = '0' + minutes;
  }

  if (seconds < 10) {
    seconds = '0' + seconds;
  }

  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
};

export const formatMs = (ms: number): string => {
  return formatSeconds(ms / 1000);
};

export const formatShortMs = (ms: number): string => {
  const sec = Math.round(ms / 1000);

  let hours: string | number = Math.floor(sec / 3600);
  let minutes: string | number = Math.floor((sec % 3600) / 60);
  let seconds: string | number = sec % 60;

  if (hours > 0 && minutes < 10) {
    minutes = '0' + minutes;
  }

  if (minutes > 0 && seconds < 10) {
    seconds = '0' + seconds;
  }

  return hours > 0
    ? `${hours}:${minutes}:${seconds}`
    : minutes > 0 ? `${minutes}:${seconds}` : `${seconds}`;
};
