'use client';

const themeInitScript = `(function () {
  try {
    var s = JSON.parse(localStorage.getItem('theme') || '{}');
    var t = (s && s.state && s.state.theme) || 'system';
    var d = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme:dark)').matches);
    document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
  } catch (e) {}
})()`;

export function ThemeScript() {
  const isServer = typeof window === 'undefined';

  return (
    <script
      suppressHydrationWarning
      {...(!isServer && { type: 'application/json' })}
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
