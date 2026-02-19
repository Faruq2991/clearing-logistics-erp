import { useDashboardStats } from '../hooks/useDashboard';
import ErrorAlert from '../components/ErrorAlert';
import PieChartComponent from '../components/charts/PieChartComponent';
import BarChartComponent from '../components/charts/BarChartComponent';
import RecentActivity from '../components/RecentActivity';
import KPICard from '../components/kpi/KPICard';
import styles from './DashboardPage.module.css';
import Button from '../components/button/Button';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();

  const summaryData = [
    { title: 'Vehicles In Progress', value: data?.vehicles_in_progress ?? '...', trend: data?.vehicles_in_progress_trend ?? 0 },
    { title: 'Total Cleared', value: data?.total_cleared_vehicles ?? '...', trend: data?.total_cleared_vehicles_trend ?? 0 },
    { title: 'Pending Documents', value: data?.pending_documents ?? '...', trend: data?.pending_documents_trend ?? 0 },
    { title: 'Total Outstanding Debt', value: data?.total_outstanding_debt !== undefined ? `$${data.total_outstanding_debt.toFixed(2)}` : '...', trend: data?.total_outstanding_debt_trend ?? 0 },
  ];

  const vehicleStatusChartData = data?.vehicle_status_distribution
    ? Object.entries(data.vehicle_status_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const activeVesselChartData = data?.active_vessel_counts
    ? Object.entries(data.active_vessel_counts).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Good Morning</h1>
          <p className={styles.subGreeting}>Hi, welcome back!</p>
        </div>
        <div className={styles.controls}>
          <Link to="/vehicles/new">
            <Button>Add New Vehicle</Button>
          </Link>
        </div>
      </div>

      {error && <ErrorAlert error={error} />}

      {isLoading ? <p>Loading...</p> : (
        <>
          <div className={styles.kpiRow}>
            {summaryData.map(item => (
              <KPICard key={item.title} title={item.title} value={item.value} trend={item.trend} />
            ))}
          </div>

          <div className={styles.analyticsGrid}>
            <div className={styles.chartContainer}>
                <PieChartComponent title="Vehicle Status Distribution" data={vehicleStatusChartData} />
            </div>
            <div className={styles.chartContainer}>
                <BarChartComponent
                title="Active Vessel Counts"
                data={activeVesselChartData}
                xLabel="Vessel"
                yLabel="Number of Vehicles"
                />
            </div>
          </div>

          <RecentActivity />
        </>
      )}
    </div>
  );
}
