import React, { useState, useEffect } from 'react';
import { useGetFamilyHistory, useUpdateFamilyHistory } from '../hooks/useQueries';
import UploadPasscodeModal from './UploadPasscodeModal';
import { Button } from '@/components/ui/button';
import { Edit2, Save, X, BookOpen } from 'lucide-react';

export default function FamilyHistory() {
  const { data: history = '', isLoading } = useGetFamilyHistory();
  const updateMutation = useUpdateFamilyHistory();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [passcodeOpen, setPasscodeOpen] = useState(false);

  useEffect(() => {
    if (history) setEditContent(history);
  }, [history]);

  function handleEditClick() {
    setEditContent(history);
    setIsEditing(true);
  }

  function handleSaveClick() {
    setPasscodeOpen(true);
  }

  async function doSave() {
    try {
      await updateMutation.mutateAsync(editContent);
      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
    }
  }

  function handleCancel() {
    setEditContent(history);
    setIsEditing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif text-ink font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-seal" />
          家族历史
        </h3>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            className="border-seal/40 text-seal hover:bg-seal/10"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            编辑
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="border-ink/30 text-ink/60"
            >
              <X className="w-4 h-4 mr-1" />
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSaveClick}
              disabled={updateMutation.isPending}
              className="bg-seal hover:bg-seal/90 text-parchment"
            >
              <Save className="w-4 h-4 mr-1" />
              {updateMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-ink/50">加载中...</div>
      ) : isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={20}
          placeholder="请输入家族历史内容..."
          className="w-full px-4 py-3 rounded-xl border border-ink/30 bg-parchment text-ink font-serif text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-seal/30"
        />
      ) : history ? (
        <div className="manuscript-border rounded-xl p-6 bg-parchment-dark">
          <p className="font-serif text-ink leading-relaxed whitespace-pre-wrap text-sm">
            {history}
          </p>
        </div>
      ) : (
        <div className="text-center py-16 text-ink/40 font-serif">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无家族历史记录，点击编辑添加内容</p>
        </div>
      )}

      {/* Use `open` prop (not `isOpen`) */}
      <UploadPasscodeModal
        open={passcodeOpen}
        onClose={() => setPasscodeOpen(false)}
        onConfirmed={() => {
          setPasscodeOpen(false);
          doSave();
        }}
      />
    </div>
  );
}
