import TrendIndicator from '../TrendIndicator';
import styles from './KPICard.module.css';

interface KPICardProps {
  title: string;
  value: string | number;
  trend: number;
}

export default function KPICard({ title, value, trend }: KPICardProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.value}>{value}</div>
      <TrendIndicator trend={trend} />
    </div>
  );
}
