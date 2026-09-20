import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface WellnessWelcomeModalProps {
  onClose?: () => void;
  onEnter?: () => void;
}

export function WellnessWelcomeModal({ onClose, onEnter }: WellnessWelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show only once per visit / session
    const hasSeen = sessionStorage.getItem("saavic_wellness_welcome_seen");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("saavic_wellness_welcome_seen", "true");
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleEnter = () => {
    sessionStorage.setItem("saavic_wellness_welcome_seen", "true");
    setIsOpen(false);
    if (onEnter) {
      onEnter();
    } else if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-300"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#FAF8F5] text-[#1C211D] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E8E4DC] overflow-hidden animate-in zoom-in-95 duration-300"
      >
        {/* Subtle decorative leaf watermark */}
        <div className="absolute -top-6 -right-6 text-7xl opacity-10 pointer-events-none select-none">
          🌿
        </div>

        {/* Minimal Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-[#7A8277] hover:text-[#1C211D] w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#EDE9E1] transition-colors"
          aria-label="Close message"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Eyebrow */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1B4D2E]"></span>
          <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#1B4D2E]">
            WELCOME TO SAAVIC
          </span>
        </div>

        {/* Main Heading */}
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#163E24] leading-[1.15]">
          EAT HEALTHY.
          <br />
          <span className="font-normal italic text-[#4A6046]">FEEL BETTER.</span>
        </h2>

        {/* Supporting Quote */}
        <blockquote className="mt-3 text-xs sm:text-sm text-[#50594D] leading-relaxed italic border-l-2 border-[#1B4D2E]/40 pl-3 py-0.5">
          &ldquo;Good food isn&apos;t about eating less. It&apos;s about choosing better.&rdquo;
        </blockquote>

        {/* 3 Wellness Principles */}
        <div className="mt-6 space-y-3.5 pt-4 border-t border-[#E8E4DC]">
          {/* Principle 1 */}
          <div className="flex items-start gap-3">
            <span className="text-base select-none mt-0.5">🌿</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[1.5px] text-[#163E24]">
                EAT CLEAN
              </h4>
              <p className="text-xs text-[#5D665A] mt-0.5 leading-snug">
                Fresh ingredients, thoughtfully prepared.
              </p>
            </div>
          </div>

          {/* Principle 2 */}
          <div className="flex items-start gap-3">
            <span className="text-base select-none mt-0.5">💪</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[1.5px] text-[#163E24]">
                FUEL YOUR BODY
              </h4>
              <p className="text-xs text-[#5D665A] mt-0.5 leading-snug">
                Protein-rich meals designed to keep you going.
              </p>
            </div>
          </div>

          {/* Principle 3 */}
          <div className="flex items-start gap-3">
            <span className="text-base select-none mt-0.5">❤️</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[1.5px] text-[#163E24]">
                LIVE BETTER
              </h4>
              <p className="text-xs text-[#5D665A] mt-0.5 leading-snug">
                Simple food choices. Better everyday habits.
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-7 pt-2">
          <button
            onClick={handleEnter}
            className="w-full py-3 px-5 rounded-full bg-[#1B4D2E] hover:bg-[#143B23] active:scale-98 text-white font-bold text-xs tracking-[1px] uppercase transition-all shadow-xs cursor-pointer"
          >
            Enter Café
          </button>
        </div>
      </div>
    </div>
  );
}
