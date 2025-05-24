import type { DonationGoalConfig } from "../types/donation";

export const defaultConfig: DonationGoalConfig = {
  title: "Custom VTuber Model",
  goalAmount: 1000,
  currency: "$",
  initialAmount: 0,
  showLastDonation: true,
  animationDuration: 300,
  notificationDuration: 5000,
  colors: {
    primary: "bg-gradient-to-r from-violet-200 to-pink-200",
    secondary: "bg-white border-3 border-violet-200",
    success: "bg-pink-500",
    text: "text-amarillo-claro font-bold drop-shadow-[0_1.2px_1.2px_rgba(1,0,0.5,0.8)]",
    background: "",
  },
  streamElements: {
    enabled: false,
    jwtToken: "",
    channelId: "",
    testMode: false,
  },
};

export const getConfig = (): DonationGoalConfig => {
  const urlParams = new URLSearchParams(window.location.search);
  const customGoal = urlParams.get("goal");
  const customTitle = urlParams.get("title");
  const customInitialAmount = urlParams.get("initialAmount");

  return {
    ...defaultConfig,
    ...(customGoal && { goalAmount: parseInt(customGoal) }),
    ...(customTitle && { title: decodeURIComponent(customTitle) }),
    ...(customInitialAmount && {
      initialAmount: parseInt(customInitialAmount),
    }),
    streamElements: {
      enabled: import.meta.env.VITE_STREAMELEMENTS_ENABLED === "true",
      jwtToken: import.meta.env.VITE_STREAMELEMENTS_JWT_TOKEN || "",
      channelId: import.meta.env.VITE_STREAMELEMENTS_CHANNEL_ID || "",
      testMode: import.meta.env.VITE_STREAMELEMENTS_TEST_MODE === "true",
    },
  };
};
