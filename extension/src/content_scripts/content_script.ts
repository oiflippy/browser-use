/**
 * Browser Use Extension - Content Script
 * 
 * This content script runs in the context of web pages and provides
 * functionality for the Browser Use extension to interact with web pages.
 */

// DOM 观察器，用于监视页面变化
let domObserver: MutationObserver | null = null;

// 当前页面的状态
interface PageState {
  url: string;
  title: string;
  domSnapshot: string;
  lastUpdate: number;
}

// 存储当前页面状态
let currentPageState: PageState = {
  url: window.location.href,
  title: document.title,
  domSnapshot: '',
  lastUpdate: Date.now()
};

// 创建简化的 DOM 快照
function createDOMSnapshot(): string {
  // 这里可以实现一个简化的 DOM 快照函数
  // 为了演示，我们只返回一个简单的表示
  const elements = document.querySelectorAll('a, button, input, select, textarea');
  const snapshot = Array.from(elements).map(el => {
    const rect = el.getBoundingClientRect();
    return {
      tagName: el.tagName,
      id: (el as HTMLElement).id,
      className: (el as HTMLElement).className,
      text: el.textContent?.trim().substring(0, 50),
      visible: rect.width > 0 && rect.height > 0,
      position: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      }
    };
  });
  
  return JSON.stringify(snapshot);
}

// 初始化 DOM 观察器
function initDOMObserver() {
  if (domObserver) {
    domObserver.disconnect();
  }
  
  domObserver = new MutationObserver((mutations) => {
    // 当 DOM 发生变化时，更新页面状态
    const now = Date.now();
    // 限制更新频率，避免过多的消息传递
    if (now - currentPageState.lastUpdate > 1000) {
      updatePageState();
    }
  });
  
  // 开始观察整个文档的变化
  domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
}

// 更新页面状态并发送到后台脚本
function updatePageState() {
  currentPageState = {
    url: window.location.href,
    title: document.title,
    domSnapshot: createDOMSnapshot(),
    lastUpdate: Date.now()
  };
  
  // 发送更新到后台脚本
  chrome.runtime.sendMessage({
    type: 'DOM_UPDATE',
    pageState: currentPageState
  }).catch(err => {
    console.log('发送DOM更新失败:', err);
  });
}

// 执行页面上的操作
function performAction(action: any) {
  console.log('执行操作:', action);
  
  switch (action.type) {
    case 'CLICK':
      // 查找并点击元素
      const clickElement = findElement(action.selector);
      if (clickElement) {
        clickElement.click();
        return { success: true, message: '点击成功' };
      }
      return { success: false, message: '未找到元素' };
      
    case 'INPUT':
      // 查找输入框并输入文本
      const inputElement = findElement(action.selector) as HTMLInputElement;
      if (inputElement && inputElement.tagName === 'INPUT') {
        inputElement.value = action.text;
        // 触发输入事件
        const event = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(event);
        return { success: true, message: '输入成功' };
      }
      return { success: false, message: '未找到输入元素' };
      
    case 'SCROLL':
      // 滚动页面
      window.scrollTo({
        top: action.y,
        left: action.x,
        behavior: 'smooth'
      });
      return { success: true, message: '滚动成功' };
      
    default:
      return { success: false, message: '未知操作类型' };
  }
}

// 查找元素的辅助函数
function findElement(selector: string): HTMLElement | null {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.error('选择器语法错误:', error);
    return null;
  }
}

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAGE_LOADED') {
    // 页面加载完成，初始化观察器并发送初始状态
    initDOMObserver();
    updatePageState();
    sendResponse({ success: true });
  } else if (message.type === 'PERFORM_ACTION') {
    // 执行指定的操作
    const result = performAction(message.action);
    sendResponse(result);
  } else if (message.type === 'GET_PAGE_STATE') {
    // 返回当前页面状态
    updatePageState(); // 确保返回最新状态
    sendResponse({ success: true, pageState: currentPageState });
  }
  
  return true; // 保持消息通道开放以进行异步响应
});

// 初始化内容脚本
function initialize() {
  console.log('Browser Use 内容脚本已加载');
  
  // 初始化 DOM 观察器
  initDOMObserver();
  
  // 发送初始页面状态
  updatePageState();
}

// 当页面加载完成时初始化
if (document.readyState === 'complete') {
  initialize();
} else {
  window.addEventListener('load', initialize);
}
