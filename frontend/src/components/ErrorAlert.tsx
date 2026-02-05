import { Alert, AlertTitle } from '@mui/material';

interface ErrorAlertProps {
  error: unknown;
}

export default function ErrorAlert({ error }: ErrorAlertProps) {
  if (!error) {
    return null;
  }

  // At this point, the error message is already formatted by getErrorMessage in the hook
  const message = error as string;

  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      <AlertTitle>Error</AlertTitle>
      {message}
    </Alert>
  );
}
