import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useActivities } from '../hooks/useActivities';
import ErrorAlert from './ErrorAlert';

const RecentActivity: React.FC = () => {
  const { data, isLoading, error } = useActivities();

  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        {isLoading && <CircularProgress />}
        {error && <ErrorAlert error={error} />}
        {data && data.length > 0 ? (
          <List>
            {data.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem>
                  <ListItemText
                    primary={`${activity.user_name || 'System'} ${activity.action}`}
                    secondary={`${activity.target_type || ''} ${activity.target_name || ''} - ${new Date(activity.created_at).toLocaleString()}`}
                  />
                </ListItem>
                {index < data.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          !isLoading && !error && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              No recent activity to show.
            </Typography>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
