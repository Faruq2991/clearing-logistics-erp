import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  MenuItem,
} from '@mui/material';
import { useForm, type SubmitHandler } from 'react-hook-form'; // Changed to type-only import
import { zodResolver } from '@hookform/resolvers/zod';
import Form from '../components/form/Form';
import InputField from '../components/form/InputField';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import type { UserCreate } from '../types';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['staff', 'guest']),
});

export function useCreateUser() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: UserCreate) => api.post('/users', data),
    onSuccess: () => {
      navigate('/users'); // Redirect to a user list page (to be created)
    },
  });
}

type UserFormInputs = z.infer<typeof userSchema>;

export default function CreateUserPage() {
  const navigate = useNavigate();
  const createUser = useCreateUser();

  const methods = useForm<UserFormInputs>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'staff',
    },
  });


  const onSubmit: SubmitHandler<UserFormInputs> = async (data) => {
    try {
      await createUser.mutateAsync(data);
    } catch (err) {
      // Error handled by mutation hook
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Create a New User
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <ErrorAlert error={createUser.error} />

        <Form<UserFormInputs>
          onSubmit={onSubmit}
          schema={userSchema}
          methods={methods}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <InputField name="email" label="Email" required />
            </Grid>
            <Grid item xs={12}>
              <InputField name="password" label="Password" type="password" required />
            </Grid>
            <Grid item xs={12}>
              <InputField name="role" label="Role" select required>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="guest">Guest</MenuItem>
              </InputField>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createUser.isPending}>
              {createUser.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </Box>
        </Form>
      </Paper>
    </Box>
  );
}
