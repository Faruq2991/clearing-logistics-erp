import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { useEstimate } from '../hooks/useEstimate';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function formatMatchType(matchType: string): string {
    return matchType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' & ');
}

export default function EstimateDisplay() {
  const { watch } = useFormContext();
  const make = watch('make');
  const model = watch('model');
  const year = watch('year');
  const terminal = watch('terminal');

  const debouncedMake = useDebounce(make, 500);
  const debouncedModel = useDebounce(model, 500);
  const debouncedYear = useDebounce(year, 500);
  const debouncedTerminal = useDebounce(terminal, 500);

  const { data, isLoading, error } = useEstimate(debouncedMake, debouncedModel, debouncedYear, debouncedTerminal);

  const shouldShow = make && model && year;

  if (!shouldShow) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom>
        Smart Estimate
      </Typography>
      {isLoading && <CircularProgress size={20} />}
      {error && <Typography color="error">{error}</Typography>}
      {data && !isLoading && data.average_clearing_cost && (
        <Box>
          <Typography variant="body1">
            Based on {data.sample_size} historical records:
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            ₦{data.average_clearing_cost.toLocaleString()}
          </Typography>
          {data.is_normalized && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              (Normalized for current exchange rate)
            </Typography>
          )}
          {data.match_type && (
            <Typography variant="caption" color="text.secondary">
              Match Type: {formatMatchType(data.match_type)}
            </Typography>
          )}
        </Box>
      )}
      {!isLoading && !error && !data && (
         <Typography variant="body2" color="text.secondary">
            Enter make, model, and year to get an estimate.
         </Typography>
      )}
    </Paper>
  );
}