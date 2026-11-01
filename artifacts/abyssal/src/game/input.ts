const ACTION_KEYS = new Set(["KeyE", "KeyR", "KeyO", "KeyV", "Tab"]);

/** Preserve one-shot actions even if keydown and keyup both occur between frames. */
export function queueActionKey(queue: Set<string>, code: string, repeat = false) {
  if (!repeat && ACTION_KEYS.has(code)) queue.add(code);
}

export function consumeActionEdge(code: string, down: boolean, previous: Set<string>, queue: Set<string>) {
  const queued = queue.delete(code);
  const was = previous.has(code);
  if (down) previous.add(code);
  else previous.delete(code);
  return queued || (down && !was);
}
