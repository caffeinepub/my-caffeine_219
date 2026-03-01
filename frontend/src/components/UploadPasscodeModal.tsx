import React, { useState, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Lock } from 'lucide-react';

const UPLOAD_PASSCODE = 'dsjzscxx';

interface UploadPasscodeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmed: () => void;
  isLoading?: boolean;
}

export default function UploadPasscodeModal({
  open,
  onClose,
  onConfirmed,
  isLoading = false,
}: UploadPasscodeModalProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (passcode === UPLOAD_PASSCODE) {
      setPasscode('');
      setError('');
      onConfirmed();
    } else {
      setError('上传口令错误，请重新输入');
      setPasscode('');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPasscode('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-ink-900">
            <Lock className="w-5 h-5 text-seal-600" />
            请输入上传口令
          </DialogTitle>
          <DialogDescription className="text-ink-500">
            请输入正确的口令以继续上传操作
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError('');
              }}
              placeholder="请输入口令"
              autoFocus
              className="w-full border border-parchment-300 rounded px-3 py-2 text-sm text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-seal-400"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="px-4 py-2 border border-parchment-300 text-ink-700 rounded text-sm font-medium hover:bg-parchment-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !passcode}
              className="flex items-center gap-2 px-4 py-2 bg-seal-600 text-black rounded text-sm font-medium hover:bg-seal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  处理中...
                </>
              ) : (
                '确认'
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
