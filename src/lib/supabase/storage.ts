import { storage } from "./client";
type Reference = { path: string };
export const ref = (_storage: typeof storage, path: string): Reference => ({
  path,
});
const bucket = () => storage.client.storage.from("contractor-documents");
export async function deleteObject(reference: Reference) {
  const { error } = await bucket().remove([reference.path]);
  if (error) throw error;
}
export async function getDownloadURL(reference: Reference) {
  const { data, error } = await bucket().createSignedUrl(reference.path, 300);
  if (error) throw error;
  return data.signedUrl;
}
export async function uploadContractorDocument(
  file: File,
  userId: string,
  contractorId: string,
  documentId: string,
  onProgress: (n: number) => void,
) {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Documents must be 10 MB or smaller.");
  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  // A new object name avoids overwriting an old file before the record save succeeds.
  const path = `contractor_documents/${userId}/${contractorId}/${documentId}/${crypto.randomUUID()}-${filename}`;
  onProgress(0);
  const { error } = await bucket().upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  onProgress(100);
  return { url: "", path, name: file.name, type: file.type, size: file.size };
}
