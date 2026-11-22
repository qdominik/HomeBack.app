type ClockTimers = {
  now: () => number;
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (id: number) => void;
};

/** Re-read the real clock on every update, including after visibility/focus. */
export function startMinuteClock(tick: () => void, timers: ClockTimers) {
  let timer: number | undefined;
  let stopped = false;
  const update = () => {
    if (stopped) return;
    if (timer !== undefined) timers.clearTimeout(timer);
    tick();
    timer = timers.setTimeout(update, 60_000 - timers.now() % 60_000);
  };
  const stop = () => {
    stopped = true;
    if (timer !== undefined) timers.clearTimeout(timer);
    timer = undefined;
  };
  update();
  return { update, stop };
}
