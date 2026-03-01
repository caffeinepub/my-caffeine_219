import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasscodeGateProps {
  onAuthenticated: () => void;
}

const CORRECT_PASSCODE = 'dsjzsdxw';

export default function PasscodeGate({ onAuthenticated }: PasscodeGateProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passcode === CORRECT_PASSCODE) {
      onAuthenticated();
    } else {
      setError('口令错误，请重新输入');
      setShaking(true);
      setPasscode('');
      setTimeout(() => setShaking(false), 600);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, oklch(0.22 0.04 45) 0px, oklch(0.22 0.04 45) 1px, transparent 1px, transparent 50%)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-gold opacity-60" />
      <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-gold opacity-60" />
      <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-gold opacity-60" />
      <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-gold opacity-60" />

      <div
        className={`relative z-10 w-full max-w-md mx-4 ${shaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
        style={shaking ? { animation: 'shake 0.5s ease-in-out' } : {}}
      >
        {/* Main card */}
        <div className="bg-card border-2 border-gold shadow-manuscript rounded-sm overflow-hidden">
          {/* Header band */}
          <div className="bg-primary px-8 py-6 text-center relative">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gold opacity-60" />
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-seal flex items-center justify-center shadow-seal">
                <Lock className="w-6 h-6 text-seal-foreground" />
              </div>
            </div>
            <h1 className="font-serif text-2xl font-bold text-primary-foreground tracking-widest">
              邓氏家族族谱
            </h1>
            <p className="text-primary-foreground/70 text-sm mt-1 tracking-wider font-serif">
              DENG FAMILY GENEALOGY
            </p>
          </div>

          {/* Form area */}
          <div className="px-8 py-8">
            <div className="text-center mb-6">
              <p className="text-muted-foreground text-sm font-serif tracking-wide">
                请输入访问口令以进入族谱系统
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError('');
                  }}
                  placeholder="请输入口令"
                  className="pr-10 text-center tracking-widest font-serif border-gold/50 focus:border-gold bg-background/50"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-seal text-sm text-center font-serif animate-in fade-in slide-in-from-top-1">
                  ⚠ {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-serif tracking-widest text-base py-5"
              >
                进 入 族 谱
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="section-divider" />
              <p className="text-muted-foreground text-xs font-serif tracking-wider mt-3">
                仅限家族成员访问 · 请妥善保管口令
              </p>
            </div>
          </div>
        </div>

        {/* Seal decoration */}
        <div className="flex justify-center mt-4">
          <div className="seal-stamp px-4 py-1 text-xs tracking-widest rounded-sm shadow-seal opacity-80">
            邓氏宗族
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
