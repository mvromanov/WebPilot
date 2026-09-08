import { ApiError } from '../api/projectsApi';
import './ApiErrorMessage.css';

type Props = {
  error: Error | string;
  className?: string;
};

function formatDetails(details: unknown) {
  if (typeof details === 'string') return details;
  return JSON.stringify(details, null, 2);
}

export function ApiErrorMessage({ error, className = 'form-error' }: Props) {
  const message = typeof error === 'string' ? error : error.message;
  const apiError = error instanceof ApiError ? error : null;

  return (
    <div className={`api-error ${className}`} role="alert">
      <p>{message}</p>
      {apiError?.details !== undefined && (
        <details>
          <summary>API error details</summary>
          <pre>{formatDetails(apiError.details)}</pre>
        </details>
      )}
    </div>
  );
}
