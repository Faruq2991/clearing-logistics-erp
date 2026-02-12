import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface PieChartData {
  name: string;
  value: number;
}

interface PieChartComponentProps {
  title: string;
  data: PieChartData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6666'];

const PieChartComponent: React.FC<PieChartComponentProps> = ({ title, data }) => {
  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PieChartComponent;
