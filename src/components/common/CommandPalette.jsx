import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const defaultCommands = [
  { id: 'notes', label: 'Open Notes', path: '/notes' },
  { id: 'placements', label: 'Open Placements', path: '/placements' },
  { id: 'courses', label: 'Manage Courses', path: '/courses' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'dashboard', label: 'Dashboard', path: '/' },
];

const CommandPalette = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ w: 380, h: 320 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const [commands] = useState(defaultCommands);

  useEffect(() => {
    const onKey = (e) => {
      // Alt+K toggles
      if (e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      // Escape closes
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const onUp = () => setDragging(false);
    const onMove = (e) => {
      if (!dragging) return;
      setPos({ x: e.clientX - dragRef.current.offsetX, y: e.clientY - dragRef.current.offsetY });
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [open, dragging]);

  const startDrag = (e) => {
    dragRef.current = { offsetX: e.clientX - pos.x, offsetY: e.clientY - pos.y };
    setDragging(true);
  };

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  const run = (cmd) => {
    setOpen(false);
    navigate(cmd.path);
  };

  if (!open) return null;

  return (
    <div
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      className="fixed z-50 bg-white dark:bg-slate-950/95 border border-slate-800 dark:border-slate-600 rounded-3xl shadow-2xl shadow-slate-900/30 overflow-hidden"
    >
      <div
        onMouseDown={startDrag}
        className="cursor-move px-4 py-3 bg-slate-100 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
      >
        <div className="font-semibold text-slate-900 dark:text-slate-100">Command Palette</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">Alt+K</div>
      </div>
      <div className="p-4">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <div className="mt-4 max-h-[190px] overflow-auto space-y-2">
          {filtered.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">No commands found.</div>}
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => run(c)}
              className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div
        onMouseDown={(e)=>{
          const startW = size.w; const startH = size.h; const startX = e.clientX; const startY = e.clientY;
          const onMove = (ev) => setSize({ w: Math.max(240, startW + ev.clientX - startX), h: Math.max(200, startH + ev.clientY - startY) });
          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
        className="w-4 h-4 absolute right-1 bottom-1 cursor-se-resize bg-transparent"
      />
    </div>
  );
};

export default CommandPalette;
