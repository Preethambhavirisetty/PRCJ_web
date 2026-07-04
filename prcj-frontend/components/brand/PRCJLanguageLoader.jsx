import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const LANGUAGE_MARKS = [
  { text: 'PRCJ', label: 'English' },
  { text: 'पीआरसीजे', label: 'Hindi' },
  { text: 'పీఆర్‌సీజే', label: 'Telugu' },
  { text: 'பிஆர்சிஜே', label: 'Tamil' },
  { text: 'ಪಿಆರ್ಸಿಜೆ', label: 'Kannada' },
  { text: 'പിആർസിജെ', label: 'Malayalam' },
  { text: 'পিআরসিজে', label: 'Bengali' },
  { text: 'પીઆરસીજે', label: 'Gujarati' },
  { text: 'ਪੀ ਆਰ ਸੀ ਜੇ', label: 'Punjabi' },
  { text: 'पीआरसीजे', label: 'Marathi' },
  { text: 'پی آر سی جے', label: 'Urdu' },
  { text: 'بي آر سي جيه', label: 'Arabic' },
  { text: '普尔西杰', label: 'Chinese' },
  { text: 'ピーアールシージェー', label: 'Japanese' },
  { text: '피알씨제이', label: 'Korean' },
  { text: 'PRCJ', label: 'French' },
  { text: 'PRCJ', label: 'Spanish' },
];

export function PRCJLanguageLoader({ compact = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = LANGUAGE_MARKS[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % LANGUAGE_MARKS.length);
    }, 420);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={compact ? 'flex items-center justify-center' : 'fixed inset-0 z-[100] flex items-center justify-center bg-[#120b0b]'}>
      <div className="relative flex min-h-[220px] w-full max-w-xl flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-[#C9933A]/60 to-transparent" />
        <div className="absolute h-48 w-48 rounded-full border border-[#C9933A]/20" />
        <div className="absolute h-32 w-32 rounded-full border border-[#E8C97A]/25" />
        <div className="absolute h-64 w-64 rounded-full border border-dashed border-[#C9933A]/15 animate-[mandala-spin_8s_linear_infinite]" />

        <div className="relative z-10 flex h-32 items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${active.label}-${active.text}`}
              initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -18, filter: 'blur(8px)' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="text-[clamp(3rem,11vw,6.5rem)] font-semibold leading-none text-[#FEFDF9]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {active.text}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 mt-4 flex flex-col items-center gap-3">
          <p className="text-xs uppercase tracking-[0.36em] text-[#E8C97A]">{active.label}</p>
          <div className="h-1 w-52 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#A8771F] via-[#E8C97A] to-[#C9933A]"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#9e9790]">Fine jewellery since 1997</p>
        </div>
      </div>
    </div>
  );
}
