import { Box, Typography } from '@mui/material';
import CostOfRunningCalculator from '../components/CostOfRunningCalculator';

export default function CostOfRunningPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cost of Running Calculator
      </Typography>
      <CostOfRunningCalculator />
    </Box>
  );
}
