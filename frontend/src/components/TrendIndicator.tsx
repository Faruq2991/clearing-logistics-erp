import React from 'react';
import { Box, Typography } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

interface TrendIndicatorProps {
  trend: number;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ trend }) => {
  const trendColor = trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'text.secondary';
  const TrendIcon = trend > 0 ? ArrowUpward : trend < 0 ? ArrowDownward : null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {TrendIcon && <TrendIcon sx={{ color: trendColor, fontSize: '1rem', mr: 0.5 }} />}
      <Typography variant="caption" sx={{ color: trendColor }}>
        {trend.toFixed(2)}%
      </Typography>
    </Box>
  );
};

export default TrendIndicator;
