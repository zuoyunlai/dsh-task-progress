/**
 * Task progress bar for the DSH chat window.
 *
 * The bar lives in the `conversation.input.dock` slot — the strip between the
 * transcript and the message composer — and appears only while the model is
 * working. Two shapes:
 *
 * - determinate: the agent published a todo plan (`todos` projection), so the
 *   bar fills with `done / total` and the label carries the plan item in
 *   flight;
 * - plan-less: no denominator exists, so no bar at all. The strip stays
 *   invisible for the first 8 seconds (most single-step turns finish before
 *   that); past that it shows one quiet text line — status plus elapsed time
 *   from the `sessionStats` projection — with no track and no animation.
 *
 * Data comes from Host-owned session projections and the session snapshot, so
 * the client never folds session events itself. Styling copies the host's own
 * progress-bar pattern (indeterminate sweep) with a `dshTp_` class prefix and
 * theme tokens only — no Harness client package is imported.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-task-progress',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useState } = React;

    const NS = 'dshTaskProgress';

    const en = {
      running: 'Working',
      planCount: '{done}/{total}',
      elapsed: '{seconds}s',
      activity: '{turns} turns · {steps} steps',
      ariaLabel: 'Task progress',
      ariaDeterminate: '{done} of {total} tasks completed',
      ariaIndeterminate: 'Task in progress'
    };

    const zh = {
      running: '执行中',
      planCount: '{done}/{total}',
      elapsed: '{seconds} 秒',
      activity: '{turns} 轮 · {steps} 步',
      ariaLabel: '任务进度',
      ariaDeterminate: '已完成 {done} / {total} 项任务',
      ariaIndeterminate: '任务执行中'
    };

    // Width follows the host composer card: the same clearance / dock-inset
    // arithmetic the shipped TodoPanel uses, so the strip lines up with the
    // input card and with the plan panel sitting next to it.
    const CSS = [
      '.dshTp_root{box-sizing:border-box;display:flex;flex-direction:column;gap:6px;flex:none;width:calc(100% - var(--dsh-composer-side-clearance, 0px) - var(--dsh-composer-side-clearance, 0px) - var(--dsh-composer-dock-inset, 0px) - var(--dsh-composer-dock-inset, 0px) - var(--dsh-composer-dock-inset, 0px) - var(--dsh-composer-dock-inset, 0px));max-width:calc(var(--dsh-composer-card-max-width, 100%) - var(--dsh-composer-dock-inset, 0px) - var(--dsh-composer-dock-inset, 0px) - var(--dsh-composer-dock-inset, 0px) - var(--dsh-composer-dock-inset, 0px));margin:0 auto;padding:2px 0 6px}',
      '.dshTp_row{display:flex;align-items:center;gap:10px;min-width:0}',
      '.dshTp_status{min-width:0;flex:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px}',
      '.dshTp_meta{flex:none;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums;white-space:nowrap}',
      '.dshTp_track{position:relative;height:3px;border-radius:999px;background:var(--dsw-alias-bg-skeleton, #00000014);overflow:hidden}',
      '.dshTp_fill{height:100%;border-radius:inherit;background:var(--dsw-alias-brand-primary, #4d6bfe);transition:width .3s ease}',
      '@media (prefers-reduced-motion:reduce){.dshTp_fill{transition:none}}'
    ].join('');

    // Without a todo plan there is no denominator, so no bar is honest. Stay
    // fully invisible for the first QUIET_DELAY_MS of plan-less work (most
    // single-step turns finish before that), then surface one quiet text line
    // — no track, no animation — so a genuinely long unplanned task still
    // shows a heartbeat.
    const QUIET_DELAY_MS = 8000;

    /** Read the plan items out of the `todos` projection, defensively. */
    function planItems(todos) {
      if (!Array.isArray(todos)) return [];
      return todos.filter((item) => item !== null && typeof item === 'object');
    }

    function TaskProgressBar(props) {
      const useSession = props.useSession;
      const useProjection = props.useProjection;
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      // Owner props of `conversation.input.dock` carry a point-in-time session
      // snapshot; the reactive `useSession` selector wins, the snapshot is the
      // fallback when the hook is not provided.
      const ownerSession = props.session !== undefined && props.session !== null ? props.session : undefined;
      const ownerRunning = ownerSession !== undefined && ownerSession !== null ? ownerSession.running === true : false;

      const running = typeof useSession === 'function'
        ? (useSession((snapshot) => (snapshot ? snapshot.running === true : false)) ?? ownerRunning)
        : ownerRunning;
      const todos = typeof useProjection === 'function' ? useProjection('todos') : undefined;
      const stats = typeof useProjection === 'function' ? useProjection('sessionStats') : undefined;

      const [elapsed, setElapsed] = useState(0);

      useEffect(() => {
        if (!running) {
          setElapsed(0);
          return undefined;
        }
        const started = Date.now();
        setElapsed(0);
        const timer = setInterval(() => setElapsed(Date.now() - started), 1000);
        return () => clearInterval(timer);
      }, [running]);

      if (!running) return null;

      const items = planItems(todos);
      const total = items.length;
      const done = items.filter((item) => item.status === 'completed').length;
      const active = items.find((item) => item.status === 'in_progress');
      const determinate = total > 0;
      if (!determinate && elapsed < QUIET_DELAY_MS) return null;
      const percent = determinate ? Math.round((done / total) * 100) : 0;

      const statusParts = [];
      const activeContent = active !== undefined && typeof active.content === 'string' ? active.content.trim() : '';
      statusParts.push(activeContent !== '' ? activeContent : t('running'));
      if (stats !== undefined && stats !== null && Number.isFinite(stats.steps) && stats.steps > 0) {
        statusParts.push(t('activity', { turns: Number.isFinite(stats.turns) ? stats.turns : 0, steps: stats.steps }));
      }

      const meta = determinate
        ? `${t('planCount', { done, total })} · ${percent}%`
        : t('elapsed', { seconds: Math.floor(elapsed / 1000) });

      return h(React.Fragment, null,
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h('div', {
          className: 'dshTp_root',
          'data-task-progress': determinate ? 'determinate' : 'indeterminate',
          role: 'progressbar',
          'aria-label': t('ariaLabel'),
          'aria-valuemin': determinate ? 0 : undefined,
          'aria-valuemax': determinate ? 100 : undefined,
          'aria-valuenow': determinate ? percent : undefined,
          'aria-valuetext': determinate ? t('ariaDeterminate', { done, total }) : t('ariaIndeterminate')
        },
          h('div', { className: 'dshTp_row' },
            h('span', { className: 'dshTp_status' }, statusParts.join(' · ')),
            h('span', { className: 'dshTp_meta' }, meta)
          ),
          determinate ? h('div', { className: 'dshTp_track' },
            h('div', {
              className: 'dshTp_fill',
              style: { width: `${percent}%` }
            })
          ) : null
        )
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-task-progress: dictionaries');
        ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
          name: 'conversation.input.dock',
          id: 'task-progress',
          order: 1,
          locale: NS
        }, TaskProgressBar));
      }
    };
  }
});

/* nudge */
