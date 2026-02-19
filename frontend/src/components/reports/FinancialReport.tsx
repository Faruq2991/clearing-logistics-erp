import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import type { FinancialsReport } from '../../types';

interface Props {
  report: FinancialsReport;
}

export default function FinancialReport({ report }: Props) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Financial Report ({new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()})
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vehicle ID</TableCell>
              <TableCell>VIN</TableCell>
              <TableCell>Make</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Total Cost</TableCell>
              <TableCell>Amount Paid</TableCell>
              <TableCell>Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report.items.map((item) => (
              <TableRow key={item.vehicle_id}>
                <TableCell>{item.vehicle_id}</TableCell>
                <TableCell>{item.vin}</TableCell>
                <TableCell>{item.make}</TableCell>
                <TableCell>{item.model}</TableCell>
                <TableCell>{item.year}</TableCell>
                <TableCell>{item.total_cost.toLocaleString()}</TableCell>
                <TableCell>{item.amount_paid.toLocaleString()}</TableCell>
                <TableCell>{item.balance.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="h6" sx={{ mt: 2 }}>
        Total Revenue: {report.total_revenue.toLocaleString()}
      </Typography>
      <Typography variant="h6">
        Total Expenses: {report.total_expenses.toLocaleString()}
      </Typography>
      <Typography variant="h6">
        Net Profit: {report.net_profit.toLocaleString()}
      </Typography>
    </Paper>
  );
}
