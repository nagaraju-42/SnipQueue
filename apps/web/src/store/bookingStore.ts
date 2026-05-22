import { create } from 'zustand';
import { Salon, Barber, Service, Slot } from '@/types';

interface BookingState {
  selectedSalon: Salon | null;
  selectedBarber: Barber | null;
  selectedService: Service | null;
  selectedSlot: Slot | null;
  setSelectedSalon: (salon: Salon) => void;
  setSelectedBarber: (barber: Barber) => void;
  setSelectedService: (service: Service) => void;
  setSelectedSlot: (slot: Slot) => void;
  clearBookingSession: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedSalon: null,
  selectedBarber: null,
  selectedService: null,
  selectedSlot: null,
  setSelectedSalon: (salon) => set({ selectedSalon: salon }),
  setSelectedBarber: (barber) => set({ selectedBarber: barber }),
  setSelectedService: (service) => set({ selectedService: service }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  clearBookingSession: () => set({ selectedSalon: null, selectedBarber: null, selectedService: null, selectedSlot: null }),
}));
