export interface Donation {
  id: string;
  amount: number;
  donor: string;
  message?: string;
  timestamp: Date;
}

export interface DonationGoalConfig {
  title: string;
  goalAmount: number;
  currency: string;
  initialAmount: number;
  showLastDonation: boolean;
  animationDuration: number;
  notificationDuration: number;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    text: string;
    background: string;
  };
  streamElements: {
    enabled: boolean;
    jwtToken: string;
    channelId: string;
    testMode: boolean;
  };
}

export interface DonationGoalState {
  currentAmount: number;
  goalAmount: number;
  lastDonation: Donation | null;
  showNotification: boolean;
  isConnected: boolean;
  donations: Donation[];
}

export interface StreamElementsEvent {
  type: string;
  provider: string;
  data: {
    username: string;
    amount: number;
    message?: string;
    currency?: string;
    displayName?: string;
  };
}

export interface StreamElementsActivity {
  _id: string;
  channel: string;
  username: string;
  activityGroup: string;
  message: string;
  type: string;
  data: any;
  createdAt: string;
}
