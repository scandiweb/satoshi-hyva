import { Magics } from "alpinejs";

export type SliderType = {
  remainingDays: number;
  remainingHours: number;
  remainingMinutes: number;
  remainingSeconds: number;
  isFinished: boolean;
  isLoaded: boolean;
  isInfinite: boolean;
  remainingChunk: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };

  init(): void;
  calculateInterval(): void;
  targetDateString: string;
} & Magics<{}>;

export const CountdownTimer = (
  targetDateString: string = "",
  isInfinite: boolean = false,
  remainingChunk: object = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  },
) =>
  <SliderType>{
    targetDateString: targetDateString,
    isLoaded: false,
    isFinished: false,
    isInfinite: isInfinite,
    remainingChunk: remainingChunk,

    init() {
      let target = new Date(this.targetDateString);
      const now = new Date();
      let remainingTime = Number(target) - Number(now);

      if (this.isInfinite) {
        while (target < now) {
          target = new Date(target.setDate(target.getDate() + 14));
          remainingTime = Number(target) - Number(now);
        }
      }

      if (remainingTime <= 0) {
        this.isFinished = true;
        this.isLoaded = true;
        this.remainingChunk = {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
        return;
      }

      this.isLoaded = true;

      var timerId = setInterval(() => {
        const now = new Date();
        const remainingTime = Number(target) - Number(now);

        if (remainingTime <= 0) {
          clearInterval(timerId);
          this.isFinished = true;
        } else {
          this.remainingChunk = {
            days: Math.floor(remainingTime / (1000 * 60 * 60 * 24)),
            hours: Math.floor((remainingTime / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((remainingTime / 1000 / 60) % 60),
            seconds: Math.floor((remainingTime / 1000) % 60),
          };
        }
      }, 1000);
    },
  };
