import { useState } from "react";
import type { SearchSource } from "../types";

interface Props {
  sources: SearchSource[];
  onAdd: (data: { name: string; search_url_template: string; allow_embed: boolean }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function SourceManager({ sources, onAdd, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [urlTemplate, setUrlTemplate] = useState("");
  const [allowEmbed, setAllowEmbed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleAdd = async () => {
    setError(null);
    if (!name.trim() || !urlTemplate.trim()) {
      setError("请填写名称和搜索 URL 模板");
      return;
    }
    if (!urlTemplate.includes("{query}")) {
      setError("URL 模板必须包含 {query} 占位符");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd({ name: name.trim(), search_url_template: urlTemplate.trim(), allow_embed: allowEmbed });
      setName("");
      setUrlTemplate("");
      setAllowEmbed(false);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "添加失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await onDelete(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">搜索源</h2>
        <button
          onClick={() => setOpen(true)}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors text-lg leading-none"
          title="添加搜索源"
        >
          +
        </button>
      </div>

      {/* Source list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {sources.length === 0 && (
          <p className="text-sm text-gray-400">暂无搜索源，点击 + 添加</p>
        )}
        {sources.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 group text-sm"
          >
            <span className="flex-1 truncate" title={s.name}>{s.name}</span>
            {s.allow_embed && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">嵌入</span>
            )}
            <button
              onClick={() => handleDelete(s.id)}
              disabled={deleting === s.id}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity disabled:opacity-50"
              title="删除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-xl shadow-xl p-5 w-96 mx-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">添加搜索源</h3>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">名称</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：Google"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">搜索 URL 模板</span>
              <input
                type="text"
                value={urlTemplate}
                onChange={(e) => setUrlTemplate(e.target.value)}
                placeholder="https://site.com/search?q={query}"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={allowEmbed}
                onChange={(e) => setAllowEmbed(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              允许直接嵌入（iframe）
            </label>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "添加中..." : "确认添加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
