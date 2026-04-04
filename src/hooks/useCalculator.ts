import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { modules, getYoutubePrice } from '@/data/services';

export type Duration = 1 | 6 | 12;
export type PaymentOption = 'upfront' | 'installment_3' | 'installment_6';

export interface SelectedService {
  serviceId: string;
  moduleId: string;
  quantity: number;
  packageSize?: number;
  youtubeMinutes?: number;
}

export interface CalculatorState {
  duration: Duration | null;
  selectedServices: SelectedService[];
  clientName: string;
  paymentOption: PaymentOption;
}

const STORAGE_KEY = 'noexcuse-calculator-state';

const loadFromStorage = (): CalculatorState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    logger.error('Error loading from localStorage:', e);
  }
  return null;
};

const saveToStorage = (state: CalculatorState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    logger.error('Error saving to localStorage:', e);
  }
};

export const useCalculator = (surplus?: { type: 'fixed' | 'percentage'; value: number }) => {
  const [state, setState] = useState<CalculatorState>(() => {
    const saved = loadFromStorage();
    return saved || {
      duration: null,
      selectedServices: [],
      clientName: '',
      paymentOption: 'upfront',
    };
  });

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const setDuration = useCallback((duration: Duration) => {
    setState(prev => ({ ...prev, duration }));
  }, []);

  const setClientName = useCallback((clientName: string) => {
    setState(prev => ({ ...prev, clientName }));
  }, []);

  const setPaymentOption = useCallback((paymentOption: PaymentOption) => {
    setState(prev => ({ ...prev, paymentOption }));
  }, []);

  const toggleService = useCallback((moduleId: string, serviceId: string) => {
    setState(prev => {
      const exists = prev.selectedServices.find(s => s.serviceId === serviceId);
      if (exists) {
        return { ...prev, selectedServices: prev.selectedServices.filter(s => s.serviceId !== serviceId) };
      }
      const module = modules.find(m => m.id === moduleId);
      const service = module?.services.find(s => s.id === serviceId);
      if (!service) return prev;

      const newService: SelectedService = {
        serviceId,
        moduleId,
        quantity: service.quantityType === 'quantity' || service.quantityType === 'youtube_time' ? (service.minQuantity || 1) : 1,
        packageSize: service.quantityType === 'package' ? service.packages?.[0] : undefined,
        youtubeMinutes: service.quantityType === 'youtube_time' ? 2 : undefined,
      };

      return { ...prev, selectedServices: [...prev.selectedServices, newService] };
    });
  }, []);

  const updateServiceQuantity = useCallback((serviceId: string, quantity: number) => {
    setState(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s =>
        s.serviceId === serviceId ? { ...s, quantity } : s
      ),
    }));
  }, []);

  const updateServicePackage = useCallback((serviceId: string, packageSize: number) => {
    setState(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s =>
        s.serviceId === serviceId ? { ...s, packageSize } : s
      ),
    }));
  }, []);

  const updateYoutubeMinutes = useCallback((serviceId: string, minutes: number) => {
    setState(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s =>
        s.serviceId === serviceId ? { ...s, youtubeMinutes: minutes } : s
      ),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState({ duration: null, selectedServices: [], clientName: '', paymentOption: 'upfront' });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isServiceSelected = useCallback((serviceId: string) => {
    return state.selectedServices.some(s => s.serviceId === serviceId);
  }, [state.selectedServices]);

  const getServiceSelection = useCallback((serviceId: string) => {
    return state.selectedServices.find(s => s.serviceId === serviceId);
  }, [state.selectedServices]);

  const applySurplus = useCallback((price: number): number => {
    if (!surplus || !surplus.value) return price;
    if (surplus.type === 'percentage') return price * (1 + surplus.value / 100);
    return price + surplus.value;
  }, [surplus]);

  const calculateServicePrice = useCallback((selection: SelectedService) => {
    const module = modules.find(m => m.id === selection.moduleId);
    const service = module?.services.find(s => s.id === selection.serviceId);
    if (!service) return 0;

    let basePrice = 0;
    if (service.quantityType === 'youtube_time' && selection.youtubeMinutes) {
      basePrice = getYoutubePrice(selection.youtubeMinutes) * (selection.quantity || 1);
    } else if (service.quantityType === 'package' && selection.packageSize) {
      basePrice = service.price * selection.packageSize;
    } else if (service.quantityType === 'quantity') {
      basePrice = service.price * selection.quantity;
    } else {
      basePrice = service.price;
    }
    return applySurplus(basePrice);
  }, [applySurplus]);

  const totals = (() => {
    let totalOneTime = 0;
    let totalMonthly = 0;

    state.selectedServices.forEach(selection => {
      const module = modules.find(m => m.id === selection.moduleId);
      const service = module?.services.find(s => s.id === selection.serviceId);
      if (!service) return;
      const price = calculateServicePrice(selection);
      if (service.type === 'one_time') totalOneTime += price;
      else totalMonthly += price;
    });

    const duration = state.duration || 6;
    const totalPeriod = totalOneTime + (totalMonthly * duration);

    return { oneTime: totalOneTime, monthly: totalMonthly, totalPeriod };
  })();

  const getPaymentSchedule = useCallback(() => {
    const duration = state.duration || 6;
    const { oneTime, monthly } = totals;
    const schedule: { month: number; amount: number; breakdown: string }[] = [];

    for (let i = 1; i <= duration; i++) {
      let amount = monthly;
      let breakdown = `Mensal: R$ ${monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

      if (state.paymentOption === 'upfront' && i === 1) {
        amount += oneTime;
        breakdown = `Unitário: R$ ${oneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + Mensal: R$ ${monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else if (state.paymentOption === 'installment_3' && i <= 3) {
        const installment = oneTime / 3;
        amount += installment;
        breakdown = `Parcela ${i}/3: R$ ${installment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + Mensal: R$ ${monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else if (state.paymentOption === 'installment_6' && i <= 6) {
        const installment = oneTime / 6;
        amount += installment;
        breakdown = `Parcela ${i}/6: R$ ${installment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + Mensal: R$ ${monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }

      schedule.push({ month: i, amount, breakdown });
    }
    return schedule;
  }, [state.duration, state.paymentOption, totals]);

  const getSelectedServicesByModule = useCallback(() => {
    const result: Record<string, { module: typeof modules[0]; selections: (SelectedService & { service: typeof modules[0]['services'][0]; price: number })[] }> = {};

    state.selectedServices.forEach(selection => {
      const module = modules.find(m => m.id === selection.moduleId);
      const service = module?.services.find(s => s.id === selection.serviceId);
      if (!module || !service) return;

      if (!result[module.id]) result[module.id] = { module, selections: [] };
      result[module.id].selections.push({ ...selection, service, price: calculateServicePrice(selection) });
    });

    return result;
  }, [state.selectedServices, calculateServicePrice]);

  return {
    ...state,
    setDuration,
    setClientName,
    setPaymentOption,
    toggleService,
    updateServiceQuantity,
    updateServicePackage,
    updateYoutubeMinutes,
    clearSelection,
    isServiceSelected,
    getServiceSelection,
    calculateServicePrice,
    totals,
    getPaymentSchedule,
    getSelectedServicesByModule,
  };
};
