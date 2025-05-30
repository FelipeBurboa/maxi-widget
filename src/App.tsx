import React, { useState, useEffect, useCallback } from "react";
import type { Donation, DonationGoalState } from "./types/donation";
import { getConfig } from "./config/widget";
import { useStreamElements } from "./hooks/useStreamElementsSimple";
import matcha_cup from "./public/matcha1.png";

const App: React.FC = () => {
  const config = getConfig();

  // Check if initialAmount is provided in URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialAmountParam = urlParams.get("initialAmount");
  const hasInitialAmountParam = initialAmountParam !== null;

  const [state, setState] = useState<DonationGoalState>(() => {
    const saved = localStorage.getItem("donation-progress");

    // If initialAmount is provided in URL, check if we need to reset
    if (hasInitialAmountParam) {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Check if the saved initialAmount matches the current URL parameter
          const savedInitialAmount = parsed.initialAmount || 0;
          const currentInitialAmount = parseInt(initialAmountParam || "0");

          // If they match, load the saved progress
          if (savedInitialAmount === currentInitialAmount) {
            console.log(
              "📊 Loading existing progress for initial amount:",
              currentInitialAmount
            );
            return {
              currentAmount: parsed.currentAmount || config.initialAmount,
              goalAmount: config.goalAmount,
              lastDonation: null,
              showNotification: false,
              isConnected: false,
              donations: parsed.donations || [],
            };
          } else {
            // Different initial amount, clear and start fresh
            console.log(
              "🔄 Different initial amount detected, clearing saved progress"
            );
            localStorage.removeItem("donation-progress");
          }
        } catch (e) {
          console.error("Failed to parse saved donation data");
          localStorage.removeItem("donation-progress");
        }
      }

      console.log(
        "🆕 Starting fresh with initial amount:",
        config.initialAmount
      );
      return {
        currentAmount: config.initialAmount,
        goalAmount: config.goalAmount,
        lastDonation: null,
        showNotification: false,
        isConnected: false,
        donations: [],
      };
    }

    // No initialAmount in URL, load saved state normally
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          currentAmount: parsed.currentAmount || 0,
          goalAmount: config.goalAmount,
          lastDonation: null,
          showNotification: false,
          isConnected: false,
          donations: parsed.donations || [],
        };
      } catch (e) {
        console.error("Failed to parse saved donation data");
      }
    }

    return {
      currentAmount: 0,
      goalAmount: config.goalAmount,
      lastDonation: null,
      showNotification: false,
      isConnected: false,
      donations: [],
    };
  });

  const handleNewDonation = useCallback(
    (donation: Donation) => {
      console.log("🎯 New donation received in App:", donation);

      setState((prev) => ({
        ...prev,
        currentAmount: Math.min(
          prev.currentAmount + donation.amount,
          prev.goalAmount
        ),
        lastDonation: donation,
        showNotification: true,
        donations: [...prev.donations, donation].slice(-10),
      }));

      setTimeout(() => {
        setState((prev) => ({ ...prev, showNotification: false }));
      }, config.notificationDuration);
    },
    [config.notificationDuration]
  );

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "donation-progress",
      JSON.stringify({
        currentAmount: state.currentAmount,
        donations: state.donations,
        initialAmount: config.initialAmount, // Save the initial amount for comparison
        lastUpdated: new Date().toISOString(),
      })
    );
  }, [state.currentAmount, state.donations, config.initialAmount]);

  const { connectionError, testDonation } = useStreamElements({
    jwtToken: config.streamElements.jwtToken,
    channelId: config.streamElements.channelId,
    enabled: config.streamElements.enabled,
    testMode: config.streamElements.testMode,
    onDonation: handleNewDonation,
    onConnect: () => {
      console.log("🔗 StreamElements connected");
      setState((prev) => ({ ...prev, isConnected: true }));
    },
    onDisconnect: () => {
      console.log("💔 StreamElements disconnected");
      setState((prev) => ({ ...prev, isConnected: false }));
    },
  });

  useEffect(() => {
    if (!config.streamElements.enabled) {
      console.log(
        "🎭 Demo mode: StreamElements disabled, showing demo donations"
      );

      const simulateDonations = () => {
        const demoDonations: Omit<Donation, "id" | "timestamp">[] = [
          { amount: 25, donor: "StreamFan123" },
          { amount: 50, donor: "GamerGirl99", message: "Love the content!" },
          { amount: 100, donor: "BigSupporter", message: "Keep it up!" },
          { amount: 15, donor: "Anonymous" },
          { amount: 75, donor: "TechNinja", message: "Amazing stream!" },
        ];

        let index = 0;
        const interval = setInterval(() => {
          if (index < demoDonations.length) {
            const demoDonation = demoDonations[index];
            const donation: Donation = {
              ...demoDonation,
              id: `demo-${Date.now()}-${index}`,
              timestamp: new Date(),
            };
            handleNewDonation(donation);
            index++;
          } else {
            clearInterval(interval);
          }
        }, 8000);

        return () => clearInterval(interval);
      };

      const timeout = setTimeout(simulateDonations, 3000);
      return () => clearTimeout(timeout);
    }
  }, [config.streamElements.enabled, handleNewDonation]);

  const progressPercentage = Math.min(
    (state.currentAmount / state.goalAmount) * 100,
    100
  );
  const isGoalReached = state.currentAmount >= state.goalAmount;

  return (
    <div className="w-auto h-auto p-4 font-sans relative">
      {connectionError && (
        <div className="absolute top-8 left-16 right-16 bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-2 text-xs text-red-400 backdrop-blur-sm">
          {connectionError}
        </div>
      )}

      {config.streamElements.testMode && (
        <div className="absolute top-14 left-14 z-20">
          <button
            onClick={testDonation}
            className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-3 py-1.5 rounded-full transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Test Donation
          </button>
        </div>
      )}

      {/* Debug info - remove in production */}
      {/*  {hasInitialAmountParam && (
        <div className="absolute top-2 right-2 bg-blue-500/20 border border-blue-500/50 rounded px-2 py-1 text-xs text-blue-400">
          Started with initial: ${config.initialAmount}
        </div>
      )} */}

      {/* Main Widget Container with Animated Borders */}
      <div
        className={`${config.colors.background} backdrop-blur-sm rounded-2xl px-6 py-2 relative w-[450px] mt-5`}
      >
        {/* Title */}
        <div className="relative z-10">
          <h2
            className={`${config.colors.text} text-xl font-bold text-center mb-5 flex items-center justify-center relative`}
          >
            <span className="text-white text-xs mr-3 animate-[pulse_1s_linear_infinite]">
              •
            </span>
            <span
              className="text-white text-xs mr-3 animate-[pulse_2s_linear_infinite]"
              style={{ animationDelay: "0.5s" }}
            >
              •
            </span>
            <span
              className="text-amarillo-claro text-2xl mr-3 animate-[pulse_3s_linear_infinite]"
              style={{ animationDelay: "1s" }}
            >
              ⟡
            </span>
            <span className="relative">
              {config.title}
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amarillo-claro to-transparent opacity-60"></div>
            </span>
          </h2>

          {/* Progress Bar Container */}
          <div className="mb-1">
            <div
              className={`w-full bg-white/80 rounded-full h-5 overflow-visible relative shadow-inner border-2 border-green-900/50 shadow-green-100/30`}
            >
              <div
                className={`h-full transition-all duration-1000 ease-out ${
                  isGoalReached
                    ? "bg-gradient-to-r from-green-400 to-green-500"
                    : "bg-gradient-to-r from-lime-400 to-lime-500"
                } rounded-full relative overflow-hidden shadow-lg animate-pulse`}
                style={{ width: `${progressPercentage}%` }}
              >
                {/* Progress Bar Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>

                {/* Progress Bar Glow */}
                <div className="absolute inset-0 shadow-[0_0_15px_rgba(34,197,94,0.4)]"></div>

                {/* Additional decorative border glow */}
                <div className="absolute -inset-[1px] rounded-full border border-green-500/50 animate-[border-glow_2s_ease-in-out_infinite]"></div>
              </div>

              {/* Matcha Cup at Progress Bar Tip */}
              <img
                src={matcha_cup}
                alt="matcha_cup"
                className="size-13 absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 drop-shadow-lg animate-[wiggle_2s_ease-in-out_infinite] transition-all duration-1000 ease-out"
                style={{
                  left: `${Math.max(progressPercentage, 2)}%`,
                  opacity: progressPercentage > 0 ? 1 : 0,
                }}
              />
            </div>

            {/* Amount Display */}
            <div className="text-center flex items-center justify-end relative mt-2 pr-4">
              {/* Decorative elements positioned around the amount */}
              <span
                className="text-amarillo-claro text-2xl mr-3 font-bold drop-shadow-[0_1.2px_1.2px_rgba(1,0,0.5,0.8)] animate-[pulse_3s_linear_infinite] "
                style={{ animationDelay: "0.5s" }}
              >
                ⟡
              </span>
              <span
                className="text-white text-sm mr-2 font-bold drop-shadow-[0_1.2px_1.2px_rgba(1,0,0.5,0.8)] opacity-80 animate-[pulse_2s_linear_infinite]"
                style={{ animationDelay: "1s" }}
              >
                •
              </span>
              <span
                className="text-white text-sm mr-4 font-bold drop-shadow-[0_1.2px_1.2px_rgba(1,0,0.5,0.8)] opacity-80 animate-[pulse_1s_linear_infinite]"
                style={{ animationDelay: "1.5s" }}
              >
                •
              </span>

              {/* Amount text with enhanced styling */}
              <div className=" px-4 py-1">
                <div
                  className={`${config.colors.text} font-bold transition-all duration-500 text-lg tracking-wide`}
                >
                  {config.currency}
                  {state.currentAmount.toLocaleString()}
                  <span className="text-white/80 font-normal mx-2">/</span>
                  {config.currency}
                  {state.goalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
