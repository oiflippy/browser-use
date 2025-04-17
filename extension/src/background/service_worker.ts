/**
 * Browser Use Extension - Background Service Worker
 * 
 * This service worker handles the background processes for the Browser Use extension.
 * It manages communication between content scripts and the extension popup.
 */

// 存储当前活动标签页的状态
interface TabState {
  isActive: boolean;
  url: string;
  title: string;
}

// 存储所有标签页的状态
const tabStates: Record<number, TabState> = {};

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.tab) return;
  
  const tabId = sender.tab.id as number;
  
  if (message.type === 'DOM_UPDATE') {
    // 存储DOM更新信息
    console.log(`接收到来自标签页 ${tabId} 的DOM更新`);
    sendResponse({ success: true });
  } else if (message.type === 'ACTION_REQUEST') {
    // 处理来自内容脚本的动作请求
    console.log(`接收到来自标签页 ${tabId} 的动作请求:`, message.action);
    sendResponse({ success: true });
  }
  
  return true; // 保持消息通道开放以进行异步响应
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    tabStates[tabId] = {
      isActive: true,
      url: tab.url,
      title: tab.title || '',
    };
    
    // 通知内容脚本页面已完全加载
    chrome.tabs.sendMessage(tabId, { type: 'PAGE_LOADED' }).catch(err => {
      // 内容脚本可能尚未加载，这是正常的
      console.log(`无法向标签页 ${tabId} 发送消息:`, err);
    });
  }
});

// 监听标签页关闭
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabStates[tabId]) {
    delete tabStates[tabId];
  }
});

// 监听标签页激活
chrome.tabs.onActivated.addListener(({ tabId }) => {
  // 将所有标签页标记为非活动
  Object.keys(tabStates).forEach(id => {
    const numId = parseInt(id);
    if (tabStates[numId]) {
      tabStates[numId].isActive = false;
    }
  });
  
  // 将当前标签页标记为活动
  if (tabStates[tabId]) {
    tabStates[tabId].isActive = true;
  }
});

// 扩展安装或更新时的处理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装
    console.log('Browser Use 扩展已安装');
    // 可以打开欢迎页面或设置页面
    chrome.tabs.create({ url: 'https://docs.browser-use.com' });
  } else if (details.reason === 'update') {
    // 扩展更新
    console.log('Browser Use 扩展已更新到版本:', chrome.runtime.getManifest().version);
  }
});

console.log('Browser Use 扩展后台服务已启动');
