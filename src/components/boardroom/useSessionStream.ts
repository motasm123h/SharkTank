"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { SessionEventSchema, type Answer, type Transcript } from "@/domain";
import { needsTurn, sceneFromTranscript, sceneReducer, type SceneState } from "./sceneState";

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

type Options = {
  sessionId: string;
  transcript: Transcript;
  /** Stop listening once this phase starts (later phases are built separately). */
  stopAtPhase?: SceneState["phase"];
};

/** Drives the boardroom: runs turns against the API and folds the events into scene state. */
export function useSessionStream({ sessionId, transcript, stopAtPhase }: Options) {
  const [state, dispatch] = useReducer(sceneReducer, transcript, sceneFromTranscript);
  const controllerRef = useRef<AbortController | null>(null);

  const runTurn = useCallback(
    async (answer?: Answer) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      dispatch({ type: "turn_started" });

      try {
        const response = await fetch(`/api/sessions/${sessionId}/turn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

        for await (const line of readLines(response.body)) {
          const event = SessionEventSchema.parse(JSON.parse(line));
          dispatch({ type: "event", event });
          if (stopAtPhase && event.type === "phase" && event.phase === stopAtPhase) {
            controller.abort();
            break;
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          dispatch({ type: "connection_failed" });
        }
      }
    },
    [sessionId, stopAtPhase],
  );

  const answer = useCallback(
    (questionId: string, text: string) => {
      dispatch({ type: "answer_sent", questionId, text });
      void runTurn({ questionId, text });
    },
    [runTurn],
  );

  /** Retries after a connection error. Resends nothing the server already saved. */
  const retry = useCallback(() => void runTurn(), [runTurn]);

  // Start (or resume) the panel when nothing is waiting on the user.
  const shouldStart = needsTurn(state);
  useEffect(() => {
    if (!shouldStart) return;
    void runTurn();
    return () => controllerRef.current?.abort();
    // Only on mount: later turns are started by `answer`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { state, answer, retry };
}
