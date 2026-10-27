/**
 * ASSUMPTION A1: exact JSON envelope of GET /v1/analytics/schema is unverified.
 * Expected something like {version, fields:[{name,type,nullable,description}]}.
 * Only used for the schema version badge and unknown-field warnings.
 * If the shape doesn't match, fall back to "unknown".
 */

export interface SchemaInfo {
  version: string;
  fieldNames: string[];
}

export function parseSchemaResponse(raw: unknown): SchemaInfo {
  if (!raw || typeof raw !== "object") {
    return { version: "unknown", fieldNames: [] };
  }
  const obj = raw as Record<string, unknown>;

  const version =
    typeof obj.version === "string"
      ? obj.version
      : typeof obj.schema_version === "string"
        ? obj.schema_version
        : typeof obj.SchemaVersion === "string"
          ? obj.SchemaVersion
          : "unknown";

  let fieldNames: string[] = [];
  const fields = obj.fields ?? obj.Fields;
  if (Array.isArray(fields)) {
    fieldNames = fields
      .map((f) => {
        if (!f || typeof f !== "object") return null;
        const name = (f as Record<string, unknown>).name ?? (f as Record<string, unknown>).Name;
        return typeof name === "string" ? name : null;
      })
      .filter((n): n is string => Boolean(n));
  }

  return { version, fieldNames };
}

export function warnUnknownFields(
  known: readonly string[],
  sampleKeys: string[],
): string[] {
  const set = new Set(known);
  return sampleKeys.filter((k) => !set.has(k));
}
