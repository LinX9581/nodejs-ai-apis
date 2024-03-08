// global.js
import developmentConfig from './development';
import testConfig from './test';
import productionConfig from './production';

// 默認配置
const defaultConfig = {
  
};

// 預設環境變數為 development
const environment = process.env.NODE_ENV || 'development';

// 根據環境變數，載入對應的環境配置
const envConfig = (() => {
  switch (environment) {
    case 'development':
      return developmentConfig;
    case 'test':
      return testConfig;
    case 'production':
      return productionConfig;
    default:
      return defaultConfig;
  }
})();

const config = {
  ...defaultConfig,
  ...envConfig,
};
console.log(config)
export default config;