export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  phone?: string;
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
  if (!response.ok) throw new Error(`Failed to fetch Stripe customers: ${response.status}`);
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }
  throw new Error('Server returned non-JSON response');
};

export const fetchStripeSubscriptions = async (): Promise<StripeSubscription[]> => {
  const response = await fetch('/api/stripe/subscriptions');
  if (!response.ok) throw new Error(`Failed to fetch Stripe subscriptions: ${response.status}`);
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }
  throw new Error('Server returned non-JSON response');
};

export const fetchStripePayments = async (): Promise<StripePayment[]> => {
  const response = await fetch('/api/stripe/payments');
  if (!response.ok) throw new Error(`Failed to fetch Stripe payments: ${response.status}`);
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }
  throw new Error('Server returned non-JSON response');
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

export const syncStripePayments = async (params: { email?: string; name?: string; phone?: string; stripeCustomerId?: string }): Promise<{ payments: SyncedPayment[], subscription?: { planName: string, status: string, current_period_end: number } }> => {
  const response = await fetch('/api/stripe/sync-payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    let errorMessage = 'Failed to sync Stripe payments';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // If parsing JSON fails, it might be an HTML error page
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const data = await response.json();
    return { payments: data.payments, subscription: data.subscription };
  } else {
    throw new Error('Server returned non-JSON response');
  }
};
