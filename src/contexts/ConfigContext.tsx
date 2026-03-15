/**
 * Config Context
 * Manages user-specific configuration stored in localStorage
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { SetupConfig } from '@/services/googleSetup';
import { addRepository } from '@/services/googleSetup';

const CONFIG_STORAGE_KEY = 'jicompta_config';

interface ConfigContextValue {
  config: SetupConfig | null;
  isConfigured: boolean;
  saveConfig: (config: SetupConfig) => void;
  clearConfig: () => void;
  getSpreadsheetId: () => string;
  getTemplateFactureId: () => string;
  getTemplateRecuId: () => string;
  getFolderFacturesId: () => string;
  getFolderRecusId: () => string;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<SetupConfig | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConfig(parsed);
      } catch (error) {
        console.error('Failed to parse stored config:', error);
        localStorage.removeItem(CONFIG_STORAGE_KEY);
      }
    }
  }, []);

  const saveConfig = useCallback((newConfig: SetupConfig) => {
    const configWithDefaults = { ...newConfig, folderName: newConfig.folderName || 'Comptabilite' };
    setConfig(configWithDefaults);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configWithDefaults));
    addRepository(configWithDefaults);
  }, []);

  const clearConfig = useCallback(() => {
    setConfig(null);
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  }, []);

  const getSpreadsheetId = useCallback((): string => {
    if (!config?.spreadsheetId) {
      throw new Error('Configuration not initialized. Please run setup first.');
    }
    return config.spreadsheetId;
  }, [config]);

  const getTemplateFactureId = useCallback((): string => {
    if (!config?.templateFactureId) {
      throw new Error('Configuration not initialized. Please run setup first.');
    }
    return config.templateFactureId;
  }, [config]);

  const getTemplateRecuId = useCallback((): string => {
    if (!config?.templateRecuId) {
      throw new Error('Configuration not initialized. Please run setup first.');
    }
    return config.templateRecuId;
  }, [config]);

  const getFolderFacturesId = useCallback((): string => {
    if (!config?.folderFacturesId) {
      throw new Error('Configuration not initialized. Please run setup first.');
    }
    return config.folderFacturesId;
  }, [config]);

  const getFolderRecusId = useCallback((): string => {
    if (!config?.folderRecusId) {
      throw new Error('Configuration not initialized. Please run setup first.');
    }
    return config.folderRecusId;
  }, [config]);

  const value: ConfigContextValue = useMemo(() => ({
    config,
    isConfigured: config !== null,
    saveConfig,
    clearConfig,
    getSpreadsheetId,
    getTemplateFactureId,
    getTemplateRecuId,
    getFolderFacturesId,
    getFolderRecusId,
  }), [
    config,
    saveConfig,
    clearConfig,
    getSpreadsheetId,
    getTemplateFactureId,
    getTemplateRecuId,
    getFolderFacturesId,
    getFolderRecusId,
  ]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);

  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }

  return context;
}
