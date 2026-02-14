import { TextField } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';

interface InputFieldProps {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  fullWidth?: boolean;
  [x: string]: any; // for other props
}

export default function InputField({
  name,
  label,
  type = 'text',
  required = false,
  fullWidth = true,
  ...rest
}: InputFieldProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          {...rest}
          label={label}
          type={type}
          required={required}
          fullWidth={fullWidth}
          error={!!error}
          helperText={error?.message as string | undefined}
          onFocus={(e) => {
            if (type === 'number' && field.value === 0) {
              field.onChange('');
            }
            if (rest.onFocus) {
              rest.onFocus(e);
            }
          }}
          onBlur={(e) => {
            if (type === 'number' && field.value === '') {
              field.onChange(0);
            }
            if (rest.onBlur) {
              rest.onBlur(e);
            }
          }}
        />
      )}
    />
  );
}
