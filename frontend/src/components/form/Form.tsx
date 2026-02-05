import {
  useForm,
  FormProvider,
  type SubmitHandler,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

interface FormProps<T extends FieldValues> {
  children: React.ReactNode;
  onSubmit: SubmitHandler<T>;
  schema: z.ZodSchema<T>;
  defaultValues?: T;
  methods?: UseFormReturn<T>;
}

export default function Form<T extends FieldValues = FieldValues>({
  children,
  onSubmit,
  schema,
  defaultValues,
  methods: providedMethods,
}: FormProps<T>) {
  const defaultMethods = useForm({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as any,
    mode: 'onBlur',
  }) as any;

  const methods = providedMethods || defaultMethods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
}