import { useState, useEffect, useCallback } from 'react';
import {
  checkOllamaAvailability,
  OllamaStatus,
  getOllamaUrl,
  setOllamaUrl,
  getOllamaModel,
  setOllamaModel,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_URL,
} from './ollamaService';

export function useOllama() {
  const [status, setStatus] = useState<OllamaStatus>({
    isAvailable: false,
    url: getOllamaUrl(),
    selectedModel: getOllamaModel(),
    availableModels: [],
  });
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const recheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await checkOllamaAvailability();
      setStatus(res);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    recheck();

    // Sprawdzaj co 15 sekund w tle, czy Ollama została uruchomiona/wyłączona
    const interval = setInterval(recheck, 15000);
    return () => clearInterval(interval);
  }, [recheck]);

  const changeModel = useCallback((model: string) => {
    setOllamaModel(model);
    setStatus((prev) => ({ ...prev, selectedModel: model }));
  }, []);

  const changeUrl = useCallback((url: string) => {
    setOllamaUrl(url);
    setStatus((prev) => ({ ...prev, url }));
  }, []);

  return {
    isOllamaAvailable: status.isAvailable,
    status,
    isChecking,
    recheck,
    changeModel,
    changeUrl,
  };
}
