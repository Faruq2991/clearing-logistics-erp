import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';
import {
  Box,
  Button,
  Typography,
  Paper,
  Avatar,
  Container,
} from '@mui/material';
import { PersonAddOutlined as PersonAddOutlinedIcon } from '@mui/icons-material';
import { getErrorMessage } from '../services/errorHandler';
import ErrorAlert from '../components/ErrorAlert';
import Form from '../components/form/Form';
import InputField from '../components/form/InputField';
import { authApi } from '../services/api'; // Import authApi instead of usersApi

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string().min(8, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// type RegisterFormInputs = z.infer<typeof schema>; // Removed: declared but never used

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (data: z.infer<typeof schema>) => { // Use z.infer directly
    setServerError(null);
    try {
      // Use authApi.register
      await authApi.register({ email: data.email, password: data.password, role: "USER" });
      navigate('/login?registered=true'); // Redirect to login with a success message
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <Container component="main" maxWidth="xs"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <PersonAddOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign Up
        </Typography>
        <Paper
          sx={{ mt: 3, p: 3, width: '100%' }}
        >
          <Form<z.infer<typeof schema>> onSubmit={onSubmit} schema={schema}>
            <ErrorAlert error={serverError} />
            <InputField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <InputField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
            />
            <InputField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Register
            </Button>
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              Already have an account?{' '}
              <RouterLink to="/login">Sign In</RouterLink>
            </Typography>
          </Form>
        </Paper>
      </Box>
    </Container>
  );
}
