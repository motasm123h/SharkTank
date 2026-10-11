import "server-only";

type Run = { controller: AbortController; done: Promise<void> };

// One engine run per session. Single-process registry: fine for one web
// container; a multi-instance deployment would need a shared lock instead.
const runs = new Map<string, Run>();

/**
 * Stops any run already in progress for this session and waits until it has
 * saved its progress, so the new run starts from an up-to-date transcript.
 */
export async function takeOverRun(sessionId: string): Promise<{
  signal: AbortSignal;
  finish: () => void;
}> {
  const previous = runs.get(sessionId);
  if (previous) {
    previous.controller.abort(new Error("superseded"));
    await previous.done;
  }

  const controller = new AbortController();
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));
  const run = { controller, done };
  runs.set(sessionId, run);

  return {
    signal: controller.signal,
    finish: () => {
      if (runs.get(sessionId) === run) runs.delete(sessionId);
      finish();
    },
  };
}
