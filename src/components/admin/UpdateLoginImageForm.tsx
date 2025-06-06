
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getLoginPageImageURL, setLoginPageImageURL } from '@/config/firebase';

const updateImageSchema = z.object({
  imageUrl: z.string().url({ message: 'Please enter a valid URL.' }).min(1, { message: 'Image URL cannot be empty.' }),
});

type UpdateImageFormValues = z.infer<typeof updateImageSchema>;

export function UpdateLoginImageForm() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [fetchingCurrent, setFetchingCurrent] = React.useState(true);

  const form = useForm<UpdateImageFormValues>({
    resolver: zodResolver(updateImageSchema),
    defaultValues: {
      imageUrl: '',
    },
  });

  useEffect(() => {
    async function fetchCurrentImageUrl() {
      setFetchingCurrent(true);
      try {
        const currentUrl = await getLoginPageImageURL();
        if (currentUrl) {
          form.setValue('imageUrl', currentUrl);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not fetch current image URL.',
          variant: 'destructive',
        });
      } finally {
        setFetchingCurrent(false);
      }
    }
    fetchCurrentImageUrl();
  }, [form, toast]);

  const onSubmit = async (data: UpdateImageFormValues) => {
    setLoading(true);
    try {
      await setLoginPageImageURL(data.imageUrl);
      toast({
        title: 'Success!',
        description: 'Login page image URL updated successfully.',
      });
    } catch (error) {
      console.error('Error updating image URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to update image URL. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCurrent) {
    return <p>Loading current image setting...</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/image.png"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading || fetchingCurrent}>
          {loading ? 'Updating...' : 'Update Image URL'}
        </Button>
      </form>
    </Form>
  );
}
