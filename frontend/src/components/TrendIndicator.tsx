import React from 'react';
import styles from './TrendIndicator.module.css';

interface TrendIndicatorProps {
  trend: number;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ trend }) => {
  const trendColorClass = trend > 0 ? styles.positive : trend < 0 ? styles.negative : styles.neutral;
  const TrendIcon = trend > 0 ? '▲' : trend < 0 ? '▼' : '';

  return (
    <div className={`${styles.trendIndicator} ${trendColorClass}`}>
      {TrendIcon && <span className={styles.icon}>{TrendIcon}</span>}
      <span className={styles.value}>{trend.toFixed(2)}%</span>
    </div>
  );
};

export default TrendIndicator;