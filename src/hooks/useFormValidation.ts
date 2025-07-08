import { useForm, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

export function useFormValidation<T extends z.ZodType>(
  schema: T,
  options?: {
    defaultValues?: DefaultValues<z.infer<T>>;
    onSuccess?: (data: z.infer<T>) => void | Promise<void>;
    onError?: (error: Error) => void;
  }
) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: options?.defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await options?.onSuccess?.(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  });

  return {
    form,
    handleSubmit,
    isValid: form.formState.isValid,
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
  };
}