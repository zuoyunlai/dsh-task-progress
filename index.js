/**
 * Host half of the task-progress bundle.
 *
 * The rendering lives entirely in the Client half (`./client`), which reads
 * the Host-owned `todos` / `sessionStats` session projections and the session
 * snapshot through the `conversation.input.dock` slot kit. The Host half owns
 * no state, registers no route, and adds no tool: it exists so the bundle has
 * a Host entry point next to its Client entry point.
 */

/** Cordis plugin name. */
export const name = 'task-progress';

/**
 * Host plugin body: nothing to do on the Host side.
 * @param ctx - host plugin context.
 */
export function apply(ctx) {
  ctx.logger?.info?.('dsh-task-progress: client half ready');
}
