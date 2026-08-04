import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Search,
  ListChecks,
  FileText,
  Sparkles,
  BookOpen,
  X,
  Copy,
  Check,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import client from '../api/client';

const TOOLS = [
  {
    key: 'brainstorm',
    title: 'Brainstorm',
    description: 'Open-ended chat to explore angles, risks and opportunities.',
    icon: MessageSquare,
    tint: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400',
    needsProject: true,
    inputLabel: 'What do you want to brainstorm?',
    placeholder: 'e.g. New pricing tiers for the mobile app',
    endpoint: '/ai-tools/brainstorm',
    buildBody: (project, input) => ({ projectName: project?.name, topic: input }),
  },
  {
    key: 'research',
    title: 'Auto Research',
    description: 'Generate a structured research brief on any topic.',
    icon: Search,
    tint: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
    needsProject: true,
    inputLabel: 'Research topic',
    placeholder: 'e.g. Competitor landscape for field-service CRMs',
    endpoint: '/ai-tools/research',
    buildBody: (project, input) => ({ projectName: project?.name, topic: input }),
  },
  {
    key: 'plan-to-tasks',
    title: 'Plan → Tasks',
    description: 'Turn a rough plan into a task list with owners and priorities.',
    icon: ListChecks,
    tint: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    needsProject: true,
    inputLabel: 'Rough plan',
    placeholder: 'e.g. Ship v2 of onboarding by end of month, needs design + copy + QA...',
    multiline: true,
    endpoint: '/ai-tools/plan-to-tasks',
    buildBody: (project, input) => ({ projectName: project?.name, plan: input }),
    resultType: 'tasks',
  },
  {
    key: 'summarize',
    title: 'Summarize',
    description: 'Condense meeting notes, docs, or long threads.',
    icon: FileText,
    tint: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    needsProject: true,
    inputLabel: 'Paste text to summarize',
    placeholder: 'Paste meeting notes or a long thread here...',
    multiline: true,
    endpoint: '/ai-tools/summarize',
    buildBody: (project, input) => ({ text: input }),
  },
  {
    key: 'dashboard-insight',
    title: 'Dashboard Insight',
    description: 'Ask Soblait AI about portfolio-wide progress.',
    icon: Sparkles,
    tint: 'bg-gradient-to-br from-brand-purple to-brand-pink text-white',
    noInput: true,
    endpoint: '/ai-tools/dashboard-insight',
    buildBody: () => ({}),
    actionLabel: 'Open',
  },
];

function currency(n) {
  return `$${Number(n || 0).toLocaleString()}`;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard API unavailable — silently ignore, copy just won't work
        }
      }}
      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function AiConfigWarning({ message }) {
  return (
    <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm p-3 flex items-start gap-2">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function ToolModal({ tool, projects, initialProjectId, onClose }) {
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [checkedTasks, setCheckedTasks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingTasks, setAddingTasks] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const project = projects.find((p) => String(p.id) === String(projectId));

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    setTasks(null);
    setSaved(false);
    setAddedCount(0);
    try {
      const body = tool.buildBody(project, input);
      const { data } = await client.post(tool.endpoint, body);
      if (tool.resultType === 'tasks') {
        const list = Array.isArray(data.tasks) ? data.tasks : [];
        setTasks(list);
        setCheckedTasks(list.map(() => true));
        if (list.length === 0) setResult(data.raw || 'No tasks could be parsed — try rephrasing the plan.');
      } else {
        setResult(data.result);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong generating this.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tool.noInput) handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveToNotes() {
    if (!project || !result) return;
    setSaving(true);
    try {
      const stamp = new Date().toLocaleDateString();
      const entry = `[${tool.title} — ${stamp}]\n${result}`;
      const newNotes = project.notes ? `${project.notes}\n\n${entry}` : entry;
      await client.put(`/projects/${project.id}`, { notes: newNotes });
      setSaved(true);
    } catch {
      setError('Could not save to project notes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTasks() {
    setAddingTasks(true);
    try {
      const toAdd = tasks.filter((_, i) => checkedTasks[i]);
      for (const t of toAdd) {
        await client.post('/tasks', {
          title: t.title,
          priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
          related_to: project?.name || '',
        });
      }
      setAddedCount(toAdd.length);
    } catch {
      setError('Could not add tasks.');
    } finally {
      setAddingTasks(false);
    }
  }

  const Icon = tool.icon;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tool.tint}`}>
              <Icon size={17} />
            </div>
            <h3 className="font-semibold text-lg">{tool.title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {tool.needsProject && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">No specific project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {!tool.noInput && (
            <div>
              <div className="text-xs text-gray-400 mb-1">{tool.inputLabel}</div>
              {tool.multiline ? (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={tool.placeholder}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none"
                />
              ) : (
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={tool.placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                />
              )}
            </div>
          )}

          {!tool.noInput && (
            <button
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
              className="btn-gradient w-full justify-center flex items-center gap-1.5 text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {loading ? 'Generating…' : 'Generate'}
            </button>
          )}

          {loading && tool.noInput && (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4 justify-center">
              <Loader2 size={16} className="animate-spin" /> Thinking…
            </div>
          )}

          {error && (error.includes('ANTHROPIC_API_KEY') ? <AiConfigWarning message={error} /> : (
            <div className="text-sm text-red-500">{error}</div>
          ))}

          {result && (
            <div className="space-y-2">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 p-3 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-200 max-h-64 overflow-y-auto">
                {result}
              </div>
              <div className="flex items-center gap-2">
                <CopyButton text={result} />
                {project && (
                  <button
                    onClick={handleSaveToNotes}
                    disabled={saving || saved}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
                  >
                    {saved ? 'Saved to notes ✓' : saving ? 'Saving…' : `Save to ${project.name}'s notes`}
                  </button>
                )}
              </div>
            </div>
          )}

          {tasks && tasks.length > 0 && (
            <div className="space-y-2">
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {tasks.map((t, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-2 text-sm rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-2.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedTasks[i]}
                      onChange={() =>
                        setCheckedTasks((prev) => prev.map((c, idx) => (idx === i ? !c : c)))
                      }
                      className="mt-0.5"
                    />
                    <span className="flex-1">
                      <span className="text-gray-900 dark:text-white font-medium">{t.title}</span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {t.owner ? `${t.owner} · ` : ''}
                        <span className="capitalize">{t.priority || 'medium'} priority</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleAddTasks}
                disabled={addingTasks || addedCount > 0 || !checkedTasks.some(Boolean)}
                className="btn-gradient w-full justify-center flex items-center gap-1.5 text-sm disabled:opacity-50"
              >
                {addedCount > 0
                  ? `Added ${addedCount} task${addedCount === 1 ? '' : 's'} ✓`
                  : addingTasks
                  ? 'Adding…'
                  : `Add ${checkedTasks.filter(Boolean).length} Task${checkedTasks.filter(Boolean).length === 1 ? '' : 's'}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PromptLibraryModal({ projects, onClose }) {
  const [prompts, setPrompts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [runningPrompt, setRunningPrompt] = useState(null);

  function refresh() {
    client.get('/ai-tools/prompts').then((res) => setPrompts(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;
    await client.post('/ai-tools/prompts', { title: newTitle, prompt: newPrompt, category: newCategory });
    setNewTitle('');
    setNewPrompt('');
    setNewCategory('general');
    setShowAdd(false);
    refresh();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this prompt?')) return;
    await client.delete(`/ai-tools/prompts/${id}`);
    refresh();
  }

  if (runningPrompt) {
    return (
      <RunPromptModal
        prompt={runningPrompt}
        projects={projects}
        onClose={() => setRunningPrompt(null)}
        onBack={() => setRunningPrompt(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <BookOpen size={18} /> Prompt Library
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {prompts.map((p) => (
            <div key={p.id} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{p.title}</div>
                  <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500 capitalize mt-1 inline-block">{p.category}</span>
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-red-500 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-2 line-clamp-2">{p.prompt}</div>
              <button
                onClick={() => setRunningPrompt(p)}
                className="mt-2 px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-brand-purple to-brand-pink text-white"
              >
                Use this prompt
              </button>
            </div>
          ))}
          {prompts.length === 0 && <div className="text-sm text-gray-400 text-center py-6">No saved prompts yet.</div>}
        </div>

        {showAdd ? (
          <form onSubmit={handleAdd} className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category (e.g. research, planning)"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Prompt text — use {project}, {topic}, {plan}, {audience} as placeholders"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none"
            />
            <div className="flex gap-2">
              <button type="submit" className="btn-gradient flex-1 justify-center text-sm">
                Save Prompt
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700 text-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Plus size={14} /> Add Prompt
          </button>
        )}
      </div>
    </div>
  );
}

function RunPromptModal({ prompt, projects, onClose, onBack }) {
  const [projectId, setProjectId] = useState('');
  const [text, setText] = useState(prompt.prompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const project = projects.find((p) => String(p.id) === String(projectId));

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const { data } = await client.post('/ai-tools/run', { prompt: text });
      setResult(data.result);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong generating this.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToNotes() {
    if (!project || !result) return;
    setSaving(true);
    try {
      const stamp = new Date().toLocaleDateString();
      const entry = `[${prompt.title} — ${stamp}]\n${result}`;
      const newNotes = project.notes ? `${project.notes}\n\n${entry}` : entry;
      await client.put(`/projects/${project.id}`, { notes: newNotes });
      setSaved(true);
    } catch {
      setError('Could not save to project notes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{prompt.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          >
            <option value="">No specific project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div>
            <div className="text-xs text-gray-400 mb-1">
              Edit the prompt — replace any {'{'}placeholders{'}'} before generating
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none"
            />
          </div>

          <button
            onClick={handleRun}
            disabled={loading || !text.trim()}
            className="btn-gradient w-full justify-center flex items-center gap-1.5 text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loading ? 'Generating…' : 'Generate'}
          </button>

          {error && (error.includes('ANTHROPIC_API_KEY') ? <AiConfigWarning message={error} /> : (
            <div className="text-sm text-red-500">{error}</div>
          ))}

          {result && (
            <div className="space-y-2">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 p-3 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-200 max-h-64 overflow-y-auto">
                {result}
              </div>
              <div className="flex items-center gap-2">
                <CopyButton text={result} />
                {project && (
                  <button
                    onClick={handleSaveToNotes}
                    disabled={saving || saved}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
                  >
                    {saved ? 'Saved to notes ✓' : saving ? 'Saving…' : `Save to ${project.name}'s notes`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AITools() {
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState({});
  const [activeTool, setActiveTool] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    client.get('/projects').then((res) => setProjects(res.data));
    client.get('/ai-tools/status').then((res) => setConfigured(res.data.configured));
  }, []);

  return (
    <div className="space-y-5">
      {!configured && (
        <AiConfigWarning message="AI Tools aren't connected yet — add an ANTHROPIC_API_KEY environment variable to the backend on Render, then redeploy. Until then, launching a tool will show this same message." />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <div key={tool.key} className="card p-5 flex flex-col">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${tool.tint}`}>
                <Icon size={20} />
              </div>
              <div className="font-semibold text-gray-900 dark:text-white mb-1">{tool.title}</div>
              <div className="text-sm text-gray-400 flex-1">{tool.description}</div>
              <div className="flex items-center gap-2 mt-4">
                {tool.needsProject && (
                  <select
                    value={selectedProjects[tool.key] || ''}
                    onChange={(e) => setSelectedProjects((prev) => ({ ...prev, [tool.key]: e.target.value }))}
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  >
                    <option value="">Pick a project…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => setActiveTool({ ...tool, initialProjectId: selectedProjects[tool.key] })}
                  className="btn-gradient shrink-0 flex items-center gap-1.5 text-sm"
                >
                  {tool.actionLabel || 'Launch'} →
                </button>
              </div>
            </div>
          );
        })}

        <div className="card p-5 flex flex-col">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
            <BookOpen size={20} />
          </div>
          <div className="font-semibold text-gray-900 dark:text-white mb-1">Prompt Library</div>
          <div className="text-sm text-gray-400 flex-1">Reusable prompts you can drop into any tool.</div>
          <div className="mt-4">
            <button onClick={() => setShowLibrary(true)} className="btn-gradient flex items-center gap-1.5 text-sm">
              Browse →
            </button>
          </div>
        </div>
      </div>

      {activeTool && (
        <ToolModal
          tool={activeTool}
          projects={projects}
          initialProjectId={activeTool.initialProjectId}
          onClose={() => setActiveTool(null)}
        />
      )}

      {showLibrary && <PromptLibraryModal projects={projects} onClose={() => setShowLibrary(false)} />}
    </div>
  );
}
