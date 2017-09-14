export const formatSeconds = (sec: number): string => {
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
