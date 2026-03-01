import React, { useState, useRef } from 'react';
import { useListManuscripts, useUploadManuscript, useDeleteManuscript } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import UploadPasscodeModal from './UploadPasscodeModal';
import DeletePasscodeModal from './DeletePasscodeModal';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, FileText, Calendar, Eye } from 'lucide-react';

export default function AncientManuscripts() {
  const { data: manuscripts = [], isLoading } = useListManuscripts();
  const uploadMutation = useUploadManuscript();
  const deleteMutation = useDeleteManuscript();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploadPasscodeOpen, setUploadPasscodeOpen] = useState(false);
  const [deletePasscodeOpen, setDeletePasscodeOpen] = useState(false);
  const [manuscriptToDelete, setManuscriptToDelete] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  function handleUploadClick(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    setUploadPasscodeOpen(true);
  }

  async function doUpload() {
    if (!selectedFile) return;
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct),
      );
      const id = `${Date.now()}-${selectedFile.name}`;
      await uploadMutation.mutateAsync({ id, fileName: selectedFile.name, description, blob });
      setSelectedFile(null);
      setDescription('');
      setUploadProgress(0);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }

  function handleDeleteClick(id: string) {
    setManuscriptToDelete(id);
    setDeletePasscodeOpen(true);
  }

  async function doDelete() {
    if (!manuscriptToDelete) return;
    try {
      await deleteMutation.mutateAsync(manuscriptToDelete);
      setManuscriptToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  function formatDate(timestamp: bigint) {
    return new Date(Number(timestamp) / 1_000_000).toLocaleDateString('zh-CN');
  }

  return (
    <div className="space-y-8">
      {/* Upload Form */}
      <div className="manuscript-border rounded-xl p-6 bg-parchment-dark">
        <h3 className="text-lg font-serif text-ink font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-seal" />
          上传古籍文献
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-ink/70 mb-1">选择文件</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
              className="block w-full text-sm text-ink/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-seal/10 file:text-seal hover:file:bg-seal/20 cursor-pointer"
            />
          </div>
          {previewUrl && selectedFile?.type.startsWith('image/') && (
            <div className="mt-2">
              <img
                src={previewUrl}
                alt="预览"
                className="max-h-48 rounded-lg border border-ink/20 object-contain"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-ink/70 mb-1">描述（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入文献描述..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-ink/30 bg-parchment text-ink text-sm resize-none focus:outline-none focus:ring-2 focus:ring-seal/30"
            />
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-ink/10 rounded-full h-2">
              <div
                className="bg-seal h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          <Button
            onClick={handleUploadClick}
            disabled={!selectedFile || uploadMutation.isPending}
            className="bg-seal hover:bg-seal/90 text-parchment"
          >
            {uploadMutation.isPending ? '上传中...' : '上传文献'}
          </Button>
        </div>
      </div>

      {/* Manuscript Gallery */}
      <div>
        <h3 className="text-lg font-serif text-ink font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-seal" />
          古籍文献库
        </h3>
        {isLoading ? (
          <div className="text-center py-12 text-ink/50">加载中...</div>
        ) : manuscripts.length === 0 ? (
          <div className="text-center py-16 text-ink/40 font-serif">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无古籍文献</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {manuscripts.map((m) => (
              <div
                key={m.id}
                className="manuscript-border rounded-xl bg-parchment-dark p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-ink truncate">{m.fileName}</h4>
                    {m.description && (
                      <p className="text-xs text-ink/60 mt-1 line-clamp-2">{m.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-ink/40">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(m.uploadDate)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a
                      href={m.blob.getDirectURL()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-ink/40 hover:text-seal transition-colors"
                      title="查看"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteClick(m.id)}
                      className="p-1.5 text-ink/40 hover:text-seal transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Passcode Modals — use `open` prop (not `isOpen`) */}
      <UploadPasscodeModal
        open={uploadPasscodeOpen}
        onClose={() => setUploadPasscodeOpen(false)}
        onConfirmed={() => {
          setUploadPasscodeOpen(false);
          doUpload();
        }}
      />
      <DeletePasscodeModal
        open={deletePasscodeOpen}
        onClose={() => setDeletePasscodeOpen(false)}
        onConfirmed={() => {
          setDeletePasscodeOpen(false);
          doDelete();
        }}
      />
    </div>
  );
}
