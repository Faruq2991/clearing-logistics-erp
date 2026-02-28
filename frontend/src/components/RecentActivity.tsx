import React from 'react';
import { Link } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import ErrorAlert from './ErrorAlert';
import styles from './RecentActivity.module.css';
import type { Activity } from '../types';

const RecentActivity: React.FC = () => {
  const { data, isLoading, error } = useActivities(5);

  const renderTarget = (activity: Activity) => {
    // If it's a vehicle and has an ID, make it clickable
    if (activity.target_type === 'vehicles' && activity.target_id) {
      return (
        
        <Link 
          to={`/vehicles/${activity.target_id}`}
          className={styles.targetLink}
        >
          {activity.target_name}
        </Link>
      );
    }
    
    // Otherwise just show the name
    return <span className={styles.target}>{activity.target_name}</span>;
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
                <span className={styles.userName}>
                  {activity.user_name || 'System'}
                </span>
                <span className={styles.action}>{activity.action}</span>
                {activity.target_name && renderTarget(activity)}
                {activity.details && (
                  <span className={styles.details}>({activity.details})</span>
                )}
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