import { useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Eye, EyeOff, Loader2 } from 'lucide-react';

const DELETE_PASSCODE = 'dsjzyyxw3344';

interface DeletePasscodeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmed: () => void;
  itemName?: string;
  isLoading?: boolean;
}

export default function DeletePasscodeModal({
  open,
  onClose,
  onConfirmed,
  itemName,
  isLoading = false,
}: DeletePasscodeModalProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passcode === DELETE_PASSCODE) {
      setPasscode('');
      setError('');
      onConfirmed();
    } else {
      setError('删除口令错误，请重新输入');
      setPasscode('');
    }
  };

  const handleClose = () => {
    setPasscode('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="bg-card border-seal/40 font-serif max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full bg-seal flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-4 h-4 text-seal-foreground" />
            </div>
            <DialogTitle className="font-serif tracking-wider text-lg text-seal">删除验证</DialogTitle>
          </div>
          <DialogDescription className="font-serif text-sm text-muted-foreground">
            {itemName
              ? `即将删除「${itemName}」，请输入删除口令以确认`
              : '请输入删除口令以确认此操作，删除后无法恢复'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="relative">
            <Input
              type={showPasscode ? 'text' : 'password'}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError('');
              }}
              placeholder="请输入删除口令"
              className="pr-10 font-serif border-seal/30 focus:border-seal bg-background/50 tracking-widest"
              autoFocus
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-seal text-xs font-serif animate-in fade-in slide-in-from-top-1">
              ⚠ {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="font-serif border-gold/40"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={!passcode || isLoading}
              className="bg-seal hover:bg-seal/90 font-serif tracking-wider text-black"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
