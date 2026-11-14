// One theme drawn as a person would see it: the scene, and over it a plain chat
// frame with frosted panels. Used by the screenshots and the contact sheet.

import type { LoadedTheme, Mode } from './themes'

export const frame = (theme: LoadedTheme, mode: Mode, scene: string, hasChat: boolean) => {
  const anchors = theme.palette[mode]!.gray.anchors
  const pick = (key: string, fallback: string) => anchors[key] ?? anchors[fallback]!
  const vars = [
    `--s0:${anchors['surface-0']}`,
    `--s1:${pick('surface-1', 'surface-0')}`,
    `--s2:${pick('surface-2', 'surface-0')}`,
    `--t1:${anchors['text-primary']}`,
    `--t2:${pick('text-secondary', 'text-primary')}`,
    `--t3:${pick('text-muted', 'text-primary')}`,
    `--accent:${theme.palette.roles.accent}`,
    `--glass:${Math.round(theme.glass.opacity * 100)}%`,
    `--blur:${theme.glass.blur}px`,
  ].join(';')

  const chat = `
    <div class="ui">
      <div class="side glass"><b>Sessions</b><span class="on">Fix the login bug</span><span>Write release notes</span><span>Refactor the parser</span>
        <div class="dots">${Object.values(theme.palette.roles).map(color => `<i style="background:${color}"></i>`).join('')}</div></div>
      <div class="main glass">
        <div class="me">Why does the login test fail on CI?</div>
        <div class="you">The test reads <code>SESSION_SECRET</code>, which CI never sets. Locally it comes from your <code>.env</code> file, so the test passes on your machine and fails in the pipeline.<div class="muted">Read 3 files, ran 1 command</div></div>
        <div class="you">I added the variable to the workflow file and the test passes now.<div class="muted">Edited ci.yml</div></div>
        <div class="box"><span class="muted">Reply</span><span class="send"></span></div>
      </div>
    </div>`

  return `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;height:100%}
    .frame{position:relative;width:100vw;height:100vh;overflow:hidden;background:var(--s0);color:var(--t1);font:15px/1.55 system-ui,sans-serif}
    .scene{position:absolute;inset:0}.scene svg{width:100%;height:100%;display:block}
    .ui{position:absolute;inset:0;display:grid;grid-template-columns:240px 1fr}
    .glass{background:color-mix(in srgb,var(--s1) var(--glass),transparent);backdrop-filter:blur(var(--blur))}
    .side{padding:22px 16px;font-size:13px;color:var(--t2);border-right:1px solid color-mix(in srgb,var(--t3) 18%,transparent)}
    .side b{display:block;color:var(--t1);margin-bottom:14px}
    .side span{display:block;padding:6px 8px;border-radius:8px}
    .side span.on{background:color-mix(in srgb,var(--s2) 80%,transparent);color:var(--t1)}
    .main{display:flex;flex-direction:column;justify-content:flex-end;gap:16px;padding:28px 18%}
    .me{align-self:flex-end;padding:10px 14px;border-radius:14px;max-width:70%;background:color-mix(in srgb,var(--s2) 90%,transparent)}
    .you{max-width:92%}.you code{color:var(--accent);font:13px ui-monospace,monospace}
    .muted{color:var(--t3);font-size:13px;margin-top:4px}
    .box{margin-top:10px;padding:14px 16px;border-radius:14px;border:1px solid color-mix(in srgb,var(--t3) 35%,transparent);display:flex;justify-content:space-between;align-items:center}
    .send{width:26px;height:26px;border-radius:50%;background:var(--accent)}
    .dots{display:flex;gap:8px;margin-top:14px}.dots i{width:16px;height:16px;border-radius:50%}
  </style><div class="frame" style="${vars}"><div class="scene">${scene}</div>${hasChat ? chat : ''}</div>`
}
