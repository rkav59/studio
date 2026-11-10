// Preserve existing form date handling while storing JSONB in PostgreSQL.
export class Timestamp {
  constructor(private readonly iso: string) {
    if (!Number.isFinite(Date.parse(iso))) throw new Error("Invalid timestamp");
  }
  static fromDate(date: Date) {
    return new Timestamp(date.toISOString());
  }
  static now() {
    return Timestamp.fromDate(new Date());
  }
  toDate() {
    return new Date(this.iso);
  }
  toMillis() {
    return this.toDate().getTime();
  }
}
export function encode(value: any): any {
  if (value instanceof Timestamp || value instanceof Date)
    return {
      __sheiq_timestamp:
        value instanceof Date
          ? value.toISOString()
          : value.toDate().toISOString(),
    };
  if (Array.isArray(value))
    return value.map((v) => (v === undefined ? null : encode(v)));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, encode(v)]),
    );
  return value;
}
export function decode(value: any): any {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === "object") {
    if (
      Object.keys(value).length === 1 &&
      typeof value.__sheiq_timestamp === "string"
    )
      return new Timestamp(value.__sheiq_timestamp);
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, decode(v)]),
    );
  }
  return value;
}

/** Read dates written by either ISO-string forms or Timestamp-based forms. */
export function toIso(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  throw new Error("Invalid stored date");
}
