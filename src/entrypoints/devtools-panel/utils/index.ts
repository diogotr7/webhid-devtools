export function prettyTime(timestamp: number) {
  const date = new Date(timestamp);

  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}ms`;
}

export function toHexString(bytes: Uint8Array | number[] | undefined): string {
  if (!bytes) {
    return "";
  }

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}
