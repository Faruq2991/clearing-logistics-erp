import { useDashboardStats } from '../hooks/useDashboard';
import ErrorAlert from '../components/ErrorAlert';
import PieChartComponent from '../components/charts/PieChartComponent';
import HorizontalBarChartComponent from '../components/charts/HorizontalBarChartComponent';
import RecentActivity from '../components/RecentActivity';
import KPICard from '../components/kpi/KPICard';
import styles from './DashboardPage.module.css';
import Button from '../components/button/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();
  const { user } = useAuth();

  const summaryData = [
    { title: 'Vehicles In Progress', value: data?.vehicles_in_progress ?? '...', trend: data?.vehicles_in_progress_trend ?? 0 },
    { title: 'Total Cleared', value: data?.total_cleared_vehicles ?? '...', trend: data?.total_cleared_vehicles_trend ?? 0 },
    { title: 'Pending Documents', value: data?.pending_documents ?? '...', trend: data?.pending_documents_trend ?? 0 },
{ title: 'Total Outstanding Debt', value: data?.total_outstanding_debt !== undefined ? `₦${data.total_outstanding_debt.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '...', trend: data?.total_outstanding_debt_trend ?? 0 },
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
          <h1 className={styles.greeting}>{getGreeting()}{user?.last_name ? `, ${user.last_name}` : ''}</h1>
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
                <HorizontalBarChartComponent
                title="Active Vessel Counts"
                data={activeVesselChartData}
                xLabel="Number of Vehicles"
                yLabel="Vessel"
                />
            </div>
          </div>

          <RecentActivity />
        </>
      )}
    </div>
  );
}
