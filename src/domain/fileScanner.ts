import { File, FileMode } from 'expo-file-system';
import { assessFile, signatureFor, type FileEvidence } from './fileAssessment';
import type { FileScanInput } from '../types/scanning';
import type { FileAssessment } from '../types/security';

export { assessFile, extensionFor, signatureFor } from './fileAssessment';

export async function inspectPickedFile(input: FileScanInput): Promise<FileAssessment> {
  let evidence: FileEvidence = { sha256: null, signature: null, fingerprintStatus: 'unavailable' };
  try {
    const file = new File(input.uri);
    const sha256 = await file.digest('SHA-256');
    const handle = file.open(FileMode.ReadOnly);
    try { evidence = { sha256, signature: signatureFor(await handle.readBytes(16)), fingerprintStatus: 'computed' }; }
    finally { handle.close(); }
  } catch {
    // Some Storage Access Framework providers expose picker metadata without a readable byte stream.
  }
  return assessFile(input, evidence);
}
