import type { AlpineComponent } from "alpinejs";

export const defineComponent = <T>(fn: () => AlpineComponent<T>) => fn;
