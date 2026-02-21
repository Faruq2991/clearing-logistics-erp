import { Alert, AlertTitle } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface ErrorAlertProps {
  error: string | Error | null;
  sx?: SxProps<Theme>;
}

export default function ErrorAlert({ error, sx }: ErrorAlertProps) {
  if (!error) return null;
  
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <Alert severity="error" sx={sx}>
      <AlertTitle>Error</AlertTitle>
      {errorMessage}
    </Alert>
  );
}
