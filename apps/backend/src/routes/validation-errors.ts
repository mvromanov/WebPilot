import type { ZodError } from 'zod';

function formatFieldPath(path: PropertyKey[]): string {
  return path.reduce<string>((field, segment) => {
    if (typeof segment === 'number') return `${field}[${segment}]`;
    return field ? `${field}.${String(segment)}` : String(segment);
  }, '') || '_root';
}

export function formatFieldErrors(error: ZodError): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((fieldErrors, issue) => {
    const field = formatFieldPath(issue.path);
    (fieldErrors[field] ??= []).push(issue.message);
    return fieldErrors;
  }, {});
}
