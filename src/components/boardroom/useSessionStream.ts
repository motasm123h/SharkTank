"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { SessionEventSchema, type Answer, type SessionEvent, type Transcript } from "@/domain";
import { replayTimeline } from "./replay";
import {
  EMPTY_SCENE,
  isPerforming,
  needsTurn,
  sceneFromTranscript,
  sceneReducer,
} from "./sceneState";

/** Reads an NDJSON body line by line. */
async function* readLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield line;
      newline = buffer.indexOf("\n");
    }
  }
  if (buffer.trim()) yield buffer.trim();
}

/** Keeps a client-side copy of the transcript in step with the stream (used by replay). */
function mirror(transcript: Transcript, event: SessionEvent): void {
  if (event.type === "question") transcript.questions.push(event.question);
  if (event.type === "debate_turn") transcript.debate.push(event.turn);
  if (event.type === "verdict") transcript.verdicts.push(event.verdict);
  if (event.type === "report") transcript.report = event.report;
}

export type PlaybackMode = "live" | "replay";

type Options = { sessionId: string; transcript: Transcript };

/**
 * Drives the boardroom: runs turns against the API, folds the events into
 * scene state, and offers skip (fast-forward) and replay.
 */
export function useSessionStream({ sessionId, transcript: initial }: Options) {
  const [state, dispatch] = useReducer(sceneReducer, initial, sceneFromTranscript);
  const [mode, setMode] = useState<PlaybackMode>("live");
  const transcriptRef = useRef<Transcript>(structuredClone(initial));
  const controllerRef = useRef<AbortController | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const runTurn = useCallback(
    async (options: { answer?: Answer; fast?: boolean } = {}) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      dispatch({ type: "turn_started" });

      try {
        const response = await fetch(`/api/sessions/${sessionId}/turn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

        for await (const line of readLines(response.body)) {
          const event = SessionEventSchema.parse(JSON.parse(line));
          mirror(transcriptRef.current, event);
          dispatch({ type: "event", event });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          dispatch({ type: "connection_failed" });
        }
      }
    },
    [sessionId],
  );

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const answer = useCallback(
    (questionId: string, text: string) => {
      transcriptRef.current.answers.push({ questionId, text });
      dispatch({ type: "answer_sent", questionId, text });
      void runTurn({ answer: { questionId, text } });
    },
    [runTurn],
  );

  /** Retries after a connection error. Resends nothing the server already saved. */
  const retry = useCallback(() => void runTurn(), [runTurn]);

  /** Fast-forward: finish what the panel is doing right now, without delays. */
  const skip = useCallback(() => {
    if (mode === "replay") {
      clearTimers();
      setMode("live");
      dispatch({ type: "reset", state: sceneFromTranscript(transcriptRef.current) });
      return;
    }
    void runTurn({ fast: true });
  }, [mode, runTurn]);

  /** Plays the finished session again from the entrance. */
  const replay = useCallback(() => {
    clearTimers();
    setMode("replay");
    dispatch({ type: "reset", state: EMPTY_SCENE });
    let at = 0;
    for (const { action, delayMs } of replayTimeline(transcriptRef.current)) {
      at += delayMs;
      timersRef.current.push(setTimeout(() => dispatch(action), at));
    }
    timersRef.current.push(setTimeout(() => setMode("live"), at + 50));
  }, []);

  // Start (or resume) the panel when nothing is waiting on the user.
  const shouldStart = needsTurn(state);
  useEffect(() => {
    if (!shouldStart) return;
    void runTurn();
    return () => controllerRef.current?.abort();
    // Only on mount: later turns are started by `answer`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      clearTimers();
    },
    [],
  );

  return {
    state,
    mode,
    answer,
    retry,
    skip,
    replay,
    canSkip: mode === "replay" || isPerforming(state),
    canReplay: mode === "live" && state.phase === "done",
  };
}
