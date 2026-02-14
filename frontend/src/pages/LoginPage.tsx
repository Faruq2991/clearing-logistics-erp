import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';
import {
  Box,
  Button,
  Typography,
  Paper,
  Avatar,
  Container,
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/errorHandler';
import ErrorAlert from '../components/ErrorAlert';
import Form from '../components/form/Form';
import InputField from '../components/form/InputField';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
}); 

type LoginFormInputs = z.infer<typeof schema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const onSubmit = async (data: LoginFormInputs) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Paper
            elevation={3}
            sx={{ mt: 3, p: 3, width: '100%' }}
          >
            <Form<LoginFormInputs> onSubmit={onSubmit} schema={schema} defaultValues={{ email: '', password: '' }}>
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
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                Don't have an account?{' '}
                <RouterLink to="/register" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
                  Sign Up
                </RouterLink>
              </Typography>
            </Form>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
