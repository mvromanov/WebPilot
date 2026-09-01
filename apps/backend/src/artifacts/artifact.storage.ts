import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { gunzip, gzip } from 'node:zlib';
import { env } from '../config/env.js';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
const artifactsRoot = path.resolve(env.artifactsPath);

function resolveArtifactPath(contentPath: string): string {
  const absolutePath = path.resolve(artifactsRoot, contentPath);
  if (absolutePath !== artifactsRoot && !absolutePath.startsWith(`${artifactsRoot}${path.sep}`)) {
    throw new Error('Artifact path escapes the configured storage directory');
  }
  return absolutePath;
}

export async function storeArtifactContent(
  projectId: string,
  stepId: string,
  content: string,
): Promise<{ contentPath: string; contentHash: string; byteSize: number }> {
  const contentBuffer = Buffer.from(content, 'utf8');
  const contentPath = path.join(projectId, stepId, `${randomUUID()}.html.gz`);
  const absolutePath = resolveArtifactPath(contentPath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, await gzipAsync(contentBuffer));

  return {
    contentPath,
    contentHash: createHash('sha256').update(contentBuffer).digest('hex'),
    byteSize: contentBuffer.byteLength,
  };
}

export async function readArtifactContent(contentPath: string): Promise<string> {
  const compressed = await readFile(resolveArtifactPath(contentPath));
  return (await gunzipAsync(compressed)).toString('utf8');
}

export async function deleteArtifactContent(contentPath: string): Promise<void> {
  try {
    await unlink(resolveArtifactPath(contentPath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
