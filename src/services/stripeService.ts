export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  metadata: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string | StripeCustomer;
  status: string;
  current_period_end: number;
  plan: {
    amount: number;
    currency: string;
    interval: string;
  };
}

export interface StripePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  customer: string;
}

export const fetchStripeCustomers = async (): Promise<StripeCustomer[]> => {
  const response = await fetch('/api/stripe/customers');
  if (!response.ok) throw new Error('Failed to fetch Stripe customers');
  return response.json();
};

export const fetchStripeSubscriptions = async (): Promise<StripeSubscription[]> => {
  const response = await fetch('/api/stripe/subscriptions');
  if (!response.ok) throw new Error('Failed to fetch Stripe subscriptions');
  return response.json();
};

export const fetchStripePayments = async (): Promise<StripePayment[]> => {
  const response = await fetch('/api/stripe/payments');
  if (!response.ok) throw new Error('Failed to fetch Stripe payments');
  return response.json();
};

export interface SyncedPayment {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  invoiceUrl: string;
}

export const syncStripePayments = async (params: { email?: string; name?: string; phone?: string }): Promise<SyncedPayment[]> => {
  const response = await fetch('/api/stripe/sync-payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to sync Stripe payments');
  }
  const data = await response.json();
  return data.payments;
};
