const AboutPage = () => {
  return (
    <div className="space-y-8">
      <div className="bg-slate-950/95 dark:bg-slate-950 rounded-[28px] p-8 border border-slate-800 shadow-2xl shadow-slate-950/40">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
              Student hub
            </span>
            <h1 className="mt-5 text-4xl md:text-5xl font-black tracking-tight text-white">
              CampusSphere brings every campus tool into one polished student dashboard.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Save lecture notes, generate AI-powered summaries, manage courses, explore campus events, track wellness, and prepare for placements with a single app designed for modern students.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              <section className="rounded-[24px] border border-slate-800 bg-slate-900/95 p-6">
                <h2 className="text-3xl font-semibold text-white">Command Palette</h2>
                <p className="mt-4 text-slate-300 leading-8">
                  Open the command palette from anywhere in the app to jump instantly to pages, search notes, open AI helpers, and navigate faster without clicking through menus.
                </p>
                <div className="mt-5 inline-flex items-center gap-3 rounded-3xl border border-slate-700 bg-slate-800 px-4 py-3">
                  <span className="text-sm uppercase tracking-[0.15em] text-slate-400">Hotkey</span>
                  <code className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100">Alt + K</code>
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-800 bg-slate-900/95 p-6">
                <h2 className="text-3xl font-semibold text-white">Why use CampusSphere?</h2>
                <ul className="mt-6 space-y-4 text-slate-300">
                  <li className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-400" />
                    Centralize your study materials, course work, and campus schedules in one place.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    Use AI tools to summarize notes, prep for interviews, and generate practice content.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-fuchsia-400" />
                    Discover events, connect with clubs, and view placement opportunities directly from your dashboard.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    Track wellness, attendance, and habits with clear visuals and personalized progress prompts.
                  </li>
                </ul>
              </section>
            </div>

            <aside className="rounded-[24px] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/95 p-6 text-slate-100 shadow-xl shadow-slate-950/30">
              <h2 className="text-3xl font-semibold text-white">Designed for dark mode</h2>
              <p className="mt-4 text-slate-300 leading-8">
                CampusSphere uses deep dark surfaces, high-contrast text, and soft accent highlights so your app stays easy on the eyes during long night sessions.
              </p>
              <div className="mt-6 space-y-4 text-slate-200">
                <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-4">
                  <p className="font-semibold text-white">Readable content</p>
                  <p className="text-sm text-slate-300">Text, headings, and controls are tuned for strong contrast on dark backgrounds.</p>
                </div>
                <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-4">
                  <p className="font-semibold text-white">Clear sections</p>
                  <p className="text-sm text-slate-300">Cards and panels are separated by soft borders and subtle shadows for easy scanning.</p>
                </div>
                <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-4">
                  <p className="font-semibold text-white">Bold action cues</p>
                  <p className="text-sm text-slate-300">Buttons, links, and hotkeys use brighter palettes to stand out without being harsh.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
