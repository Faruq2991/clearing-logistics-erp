import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface BarChartData {
  name: string;
  value: number;
}

interface HorizontalBarChartComponentProps {
  title: string;
  data: BarChartData[];
  xLabel: string;
  yLabel: string;
}

const HorizontalBarChartComponent: React.FC<HorizontalBarChartComponentProps> = ({ title, data, xLabel, yLabel }) => {
  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          {data.length === 0 ? (
            <Box textAlign="center">
              <Typography variant="body1" color="text.secondary">
                No data to display.
              </Typography>
              <Button component={RouterLink} to="/vehicles/new" variant="contained" sx={{ mt: 2 }}>
                Add First Vehicle
              </Button>
            </Box>
          ) : (
            <ResponsiveContainer>
              <BarChart
                layout="vertical"
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" label={{ value: xLabel, position: 'insideBottom', offset: 0 }} />
                <YAxis type="category" dataKey="name" label={{ value: yLabel, angle: -90, position: 'insideLeft' }} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default HorizontalBarChartComponent;
