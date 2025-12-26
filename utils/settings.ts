
export const AVAILABLE_MODELS = [
  { 
    id: 'qwen3-omni-flash', 
    name: 'Qwen 3 Omni Flash (推荐)', 
    type: 'fast',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultKey: 'sk-8e91ea7d3fba4f22b9a6a3e796ec8a2b'
  },
  { 
    id: 'qwen3-omni-flash-realtime', 
    name: 'Qwen 3 Omni Flash (Realtime)', 
    type: 'fast',
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
  const userModel = localStorage.getItem('user_model');
  // 如果用户设置了模型，直接使用
  if (userModel) return userModel;
  
  // 默认使用 Qwen 3 Omni Flash
  return 'qwen3-omni-flash';
};

export const getEffectiveApiKey = (): string => {
  // 1. 优先使用用户手动保存到 LocalStorage 的 Key (如果有且不为空)
  const userKey = localStorage.getItem('user_api_key');
  if (userKey && userKey.trim() !== '') return userKey;

  // 2. 如果没有用户 Key，检查当前选中的模型是否有预设的默认 Key
  const currentModel = getEffectiveModel();
  const modelConfig = AVAILABLE_MODELS.find(m => m.id === currentModel);
  if (modelConfig?.defaultKey) {
    return modelConfig.defaultKey;
  }

  // 3. 最后尝试环境变量
  return process.env.API_KEY || '';
};

export const getEffectiveBaseUrl = (): string => {
  // 1. 优先使用用户手动保存的 URL
  const userUrl = localStorage.getItem('user_base_url');
  if (userUrl && userUrl.trim() !== '') return userUrl;

  // 2. 检查当前模型是否有预设 Base URL
  const currentModel = getEffectiveModel();
  const modelConfig = AVAILABLE_MODELS.find(m => m.id === currentModel);
  if (modelConfig?.baseUrl) {
    return modelConfig.baseUrl;
  }

  return '';
};

export const saveUserSettings = (apiKey: string, model: string, baseUrl: string = '') => {
  // 如果输入为空，则移除 key，这样 getEffectiveApiKey 就会读取默认值
  if (apiKey && apiKey.trim() !== '') {
    localStorage.setItem('user_api_key', apiKey.trim());
  } else {
    localStorage.removeItem('user_api_key');
  }
  
  if (model) {
    localStorage.setItem('user_model', model);
  } else {
    localStorage.removeItem('user_model');
  }

  // 同理处理 Base URL
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
    baseUrl: localStorage.getItem('user_base_url') || ''
  };
};
