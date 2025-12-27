
export const AVAILABLE_MODELS = [
  { 
    id: 'qwen3-omni-flash', 
    name: 'Qwen 3 Omni Flash (推荐)', 
    type: 'multimodal',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultKey: 'sk-8e91ea7d3fba4f22b9a6a3e796ec8a2b'
  },
  { 
    id: 'qwen3-omni-flash-realtime', 
    name: 'Qwen 3 Omni Flash (Realtime)', 
    type: 'multimodal',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultKey: 'sk-8e91ea7d3fba4f22b9a6a3e796ec8a2b'
  },
  { 
    id: 'qwen-flash', 
    name: 'Qwen Flash', 
    type: 'fast',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultKey: 'sk-8e91ea7d3fba4f22b9a6a3e796ec8a2b'
  },
  { 
    id: 'mimo-v2-flash', 
    name: 'Xiaomi Mimo V2 Flash', 
    type: 'fast',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    defaultKey: 'sk-c6ff967bzbr38ailaga6wpsr6k4ry8ig5t0ae4lj4xxba9ep'
  },
];

export const getEffectiveModel = (taskType: 'ocr' | 'text' = 'text'): string => {
  // 1. 如果是 OCR 任务，优先检查是否有独立的 OCR 模型设置
  if (taskType === 'ocr') {
    const ocrModel = localStorage.getItem('user_model_ocr');
    if (ocrModel && ocrModel.trim() !== '') return ocrModel;
  }

  // 2. 否则使用全局/文本模型
  const userModel = localStorage.getItem('user_model');
  if (userModel) return userModel;
  
  // 3. 默认回退
  return 'qwen3-omni-flash';
};

/**
 * 获取特定模型的完整配置 (API Key, Base URL)
 * @param modelId 指定的模型ID，如果不传则自动根据 taskType 获取
 */
export const getModelConfig = (taskType: 'ocr' | 'text' = 'text') => {
  const modelId = getEffectiveModel(taskType);
  const preset = AVAILABLE_MODELS.find(m => m.id === modelId);

  // 获取用户自定义的全局设置
  const userKey = localStorage.getItem('user_api_key');
  const userUrl = localStorage.getItem('user_base_url');

  let apiKey = userKey || '';
  let baseUrl = userUrl || '';

  // 策略：
  // 1. 如果用户没有设置全局 Key/URL，且当前模型是预设模型，则使用预设的 Key/URL
  // 2. 如果用户设置了全局 Key/URL，则覆盖预设（适用于 Custom 模型或用户想用自己的 Key 跑预设模型）
  if (preset) {
    if (!apiKey && preset.defaultKey) apiKey = preset.defaultKey;
    if (!baseUrl && preset.baseUrl) baseUrl = preset.baseUrl;
  }

  // 3. 环境变量兜底
  if (!apiKey) apiKey = process.env.API_KEY || '';

  return {
    model: modelId,
    apiKey,
    baseUrl,
    isPreset: !!preset,
    modelName: preset ? preset.name : modelId
  };
};

export const saveUserSettings = (
  apiKey: string, 
  textModel: string, 
  ocrModel: string,
  baseUrl: string = ''
) => {
  if (apiKey && apiKey.trim() !== '') {
    localStorage.setItem('user_api_key', apiKey.trim());
  } else {
    localStorage.removeItem('user_api_key');
  }
  
  if (textModel) {
    localStorage.setItem('user_model', textModel);
  } else {
    localStorage.removeItem('user_model');
  }

  if (ocrModel) {
    localStorage.setItem('user_model_ocr', ocrModel);
  } else {
    localStorage.removeItem('user_model_ocr');
  }

  if (baseUrl && baseUrl.trim() !== '') {
    localStorage.setItem('user_base_url', baseUrl.trim());
  } else {
    localStorage.removeItem('user_base_url');
  }
};

export const getUserSettings = () => {
  return {
    apiKey: localStorage.getItem('user_api_key') || '',
    model: localStorage.getItem('user_model') || AVAILABLE_MODELS[0].id,
    ocrModel: localStorage.getItem('user_model_ocr') || '',
    baseUrl: localStorage.getItem('user_base_url') || ''
  };
};

// 兼容旧代码的辅助函数
export const getEffectiveApiKey = () => getModelConfig('text').apiKey;
export const getEffectiveBaseUrl = () => getModelConfig('text').baseUrl;
