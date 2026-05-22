import api from './api';
import { Booking, InitiateBookingRequest, InitiateBookingResponse, ApiSuccess } from '@/types';

export const bookingService = {
  initiateBooking: async (data: InitiateBookingRequest) => {
    const res = await api.post<ApiSuccess<InitiateBookingResponse>>('/bookings', data);
    return res.data;
  },
  getMyBookings: async () => {
    const res = await api.get<ApiSuccess<Booking[]>>('/bookings/my');
    return res.data;
  },
  getBookingById: async (id: string) => {
    const res = await api.get<ApiSuccess<Booking>>(`/bookings/${id}`);
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await api.put<ApiSuccess<Booking>>(`/bookings/${id}/status`, { status });
    return res.data;
  }
};
