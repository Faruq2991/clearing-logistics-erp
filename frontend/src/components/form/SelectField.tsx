import {
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  type SelectProps,
  MenuItem,
} from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';

type SelectFieldProps = SelectProps<any> & {
  name: string;
  label: string;
  options?: { value: any; label: string }[];
  children?: React.ReactNode;
};

export default function SelectField({
  name,
  label,
  options,
  children,
  ...props
}: SelectFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth error={!!error}>
          <InputLabel id={`${name}-label`}>{label}</InputLabel>
          <Select {...field} labelId={`${name}-label`} label={label} {...props}>
            {options
              ? options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))
              : children}
          </Select>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}
