import { useState } from 'react';
import { bookingService } from '../services/booking';
import { useBookingStore } from '../store/bookingStore';
import { InitiateBookingRequest } from '@/types';
import { useRouter } from 'next/navigation';

export const useBooking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bookingStore = useBookingStore();
  const router = useRouter();

  const initiateBooking = async (data: InitiateBookingRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingService.initiateBooking(data);
      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    initiateBooking, 
    loading, 
    error,
    ...bookingStore 
  };
};
