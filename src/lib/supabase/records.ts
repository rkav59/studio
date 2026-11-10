import { db } from "./client";
import { encode, decode } from "./serialization";
export { Timestamp } from "./serialization";

// A narrow record API keeps existing forms intact. All reads/writes go through
// authenticated Supabase RPCs; PostgreSQL owns identity, membership and access.
type Database = typeof db;
type Collection = { database: Database; name: string };
type Document = Collection & { id: string };
type Constraint =
  | { kind: "where"; field: string; op: string; value: any }
  | { kind: "order"; field: string; direction: "asc" | "desc" };
type Query = Collection & { constraints: Constraint[] };
export const collection = (database: Database, name: string): Collection => ({
  database,
  name,
});
export function doc(database: Database, name: string, id: string): Document;
export function doc(reference: Collection, id?: string): Document;
export function doc(
  reference: Database | Collection,
  name?: string,
  id?: string,
): Document {
  if ("name" in reference)
    return { ...reference, id: name ?? crypto.randomUUID() };
  if (!name || !id)
    throw new Error("A collection and document ID are required");
  return { database: reference, name, id };
}
export const where = (field: string, op: string, value: any): Constraint => ({
  kind: "where",
  field,
  op,
  value,
});
export const orderBy = (
  field: string,
  direction: "asc" | "desc" = "asc",
): Constraint => ({ kind: "order", field, direction });
export const query = (
  reference: Collection,
  ...constraints: Constraint[]
): Query => ({ ...reference, constraints });
function snapshot(reference: Document, data: any) {
  return {
    id: reference.id,
    ref: reference,
    exists: () => data != null,
    data: (): any => decode(data),
  };
}
export async function getDoc(reference: Document) {
  const { data, error } = await reference.database.client.rpc("read_record", {
    collection_name: reference.name,
    record_id: reference.id,
  });
  if (error) throw error;
  return snapshot(reference, data);
}
export async function getDocs(reference: Collection | Query) {
  const constraints = "constraints" in reference ? reference.constraints : [];
  const docs: ReturnType<typeof snapshot>[] = [];
  // Page explicitly: the hosted API's default row cap must not truncate dashboards.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await reference.database.client.rpc(
      "list_records",
      {
        collection_name: reference.name,
        filters: encode(constraints.filter((c) => c.kind === "where")),
        ordering: constraints.filter((c) => c.kind === "order"),
        page_offset: offset,
        page_size: 500,
      },
    );
    if (error) throw error;
    const rows = data as { id: string; data: any }[];
    docs.push(
      ...rows.map((row) => snapshot({ ...reference, id: row.id }, row.data)),
    );
    if (rows.length < 500) break;
  }
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: (fn: (d: ReturnType<typeof snapshot>) => void) => docs.forEach(fn),
  };
}
async function write(
  reference: Document,
  data: any,
  mode: "create" | "replace" | "merge" | "update",
) {
  const { error } = await reference.database.client.rpc("write_record", {
    collection_name: reference.name,
    record_id: reference.id,
    payload: encode(data),
    write_mode: mode,
  });
  if (error) throw error;
}
export async function addDoc(reference: Collection, data: any) {
  const document = doc(reference);
  await write(document, data, "create");
  return document;
}
export const setDoc = (
  reference: Document,
  data: any,
  options?: { merge: boolean },
) => write(reference, data, options?.merge ? "merge" : "replace");
export const updateDoc = (reference: Document, data: any) =>
  write(reference, data, "update");
export async function deleteDoc(reference: Document) {
  const { error } = await reference.database.client.rpc("delete_record", {
    collection_name: reference.name,
    record_id: reference.id,
  });
  if (error) throw error;
}
