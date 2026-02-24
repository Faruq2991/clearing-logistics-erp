import React from 'react';
import { useActivities } from '../hooks/useActivities';
import ErrorAlert from './ErrorAlert';
import styles from './RecentActivity.module.css';
import { Link } from 'react-router-dom';

const RecentActivity: React.FC = () => {
  const { data, isLoading, error } = useActivities(5);

  const renderTarget = (activity: any) => {
    if (activity.target_type === 'vehicles' && activity.target_id) {
      return (
        <Link to={`/vehicles/${activity.target_id}`} className={styles.targetLink}>
          {activity.target_name}
        </Link>
      );
    }
    return <span className={styles.target}>{activity.target_name || ''}</span>;
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Recent Activity</h2>
      {isLoading && <p>Loading...</p>}
      {error && <ErrorAlert error={error} />}
      {data && data.length > 0 ? (
        <ul className={styles.list}>
          {data.map((activity) => (
            <li key={activity.id} className={styles.listItem}>
              <div className={styles.activityDetails}>
                <span className={styles.userName}>{activity.user_name || 'System'}</span>
                <span className={styles.action}>{activity.action}</span>
                <span className={styles.targetType}>{activity.target_type}</span>
                {renderTarget(activity)}
              </div>
              <div className={styles.timestamp}>
                {new Date(activity.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !isLoading && !error && (
          <p className={styles.noActivity}>
            No recent activity to show.
          </p>
        )
      )}
    </div>
  );
};

export default RecentActivity;