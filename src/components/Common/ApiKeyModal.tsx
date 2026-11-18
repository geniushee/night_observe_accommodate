import React, { useState } from "react";
import { Key, X, ExternalLink, Check } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  onSaveKey,
}) => {
  const [inputKey, setInputKey] = useState(currentKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(inputKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
      window.location.reload();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-white/10 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">네이버 지도 API 설정</h3>
            <p className="text-xs text-gray-400">NAVER Maps v3 (ncpKeyId)</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Client ID (ncpKeyId)
            </label>
            <input
              type="text"
              placeholder="예: x9q8vj..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono transition"
            />
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-white/5 space-y-2 text-xs text-gray-300">
            <div className="font-semibold text-cyan-300 flex items-center gap-1">
              💡 발급 및 Web 서비스 URL 등록 가이드
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-400 text-[11px] leading-relaxed">
              <li>
                <a
                  href="https://console.ncloud.com/naver-service/application"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                >
                  NCP 콘솔 Application 등록 <ExternalLink className="w-3 h-3" />
                </a>
                에서 <b>Maps (Web Dynamic Map)</b> 선택
              </li>
              <li>
                <b>Web 서비스 URL</b>에 <code className="bg-slate-700 px-1 py-0.5 rounded text-white">http://localhost:5173</code> 등록
              </li>
              <li>
                발급된 인증 정보의 <b>Client ID</b>를 복사하여 위 입력창이나 <code>.env</code> 파일에 입력
              </li>
            </ol>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              닫기
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              {saved ? <Check className="w-4 h-4" /> : null}
              {saved ? "저장 완료" : "적용하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
