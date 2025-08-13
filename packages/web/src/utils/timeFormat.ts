/**
 * 格式化时间长度为 mm:ss 格式
 * @param time 时间（秒）
 * @returns 格式化的时间字符串，如 "3:45" 或 "0:00"
 */
export function formatTime(time: number): string {
  // 处理 NaN、undefined、null 和负数的情况
  if (!time || isNaN(time) || time < 0) {
    return '0:00';
  }
  
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 格式化长时间为 h:mm:ss 格式
 * @param time 时间（秒）
 * @returns 格式化的时间字符串，如 "1:23:45" 或 "0:00"
 */
export function formatLongTime(time: number): string {
  // 处理 NaN、undefined、null 和负数的情况
  if (!time || isNaN(time) || time < 0) {
    return '0:00';
  }
  
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}