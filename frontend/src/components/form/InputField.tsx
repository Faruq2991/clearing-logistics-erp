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

  const formError = errors[name];
  const hasError = rest.error !== undefined ? rest.error : !!formError;
  const helperText = rest.helperText !== undefined ? rest.helperText : (formError?.message as string | undefined);

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
          error={hasError}
          helperText={helperText}
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
