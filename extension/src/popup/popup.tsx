import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './popup.css';

interface PageInfo {
  url: string;
  title: string;
}

const Popup: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageInfo | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [taskStatus, setTaskStatus] = useState('准备就绪');
  const [isRunning, setIsRunning] = useState(false);

  // 获取当前活动标签页信息
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentPage({
          url: tabs[0].url || '',
          title: tabs[0].title || ''
        });
      }
    });
  }, []);

  // 运行任务
  const handleRunTask = async () => {
    if (!taskInput.trim() || isRunning) return;
    
    setIsRunning(true);
    setTaskStatus('正在执行任务...');
    
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) throw new Error('无法获取当前标签页');
      
      // 向内容脚本发送消息，获取页面状态
      const response = await chrome.tabs.sendMessage(tabs[0].id, { 
        type: 'GET_PAGE_STATE' 
      });
      
      if (!response.success) throw new Error('无法获取页面状态');
      
      // 这里可以添加与后端 API 的通信，将任务发送到 browser-use 服务
      // 为了演示，我们只是模拟一个延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTaskStatus('任务完成');
    } catch (error) {
      console.error('执行任务时出错:', error);
      setTaskStatus(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsRunning(false);
    }
  };

  // 捕获页面
  const handleCapturePage = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) throw new Error('无法获取当前标签页');
      
      setTaskStatus('正在捕获页面...');
      
      // 向内容脚本发送消息，获取页面状态
      const response = await chrome.tabs.sendMessage(tabs[0].id, { 
        type: 'GET_PAGE_STATE' 
      });
      
      if (!response.success) throw new Error('无法获取页面状态');
      
      setTaskStatus('页面已捕获');
      console.log('页面状态:', response.pageState);
    } catch (error) {
      console.error('捕获页面时出错:', error);
      setTaskStatus(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 打开设置页面
  const handleOpenSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="popup-container">
      <div className="section">
        <div className="section-title">当前页面</div>
        {currentPage ? (
          <div className="current-page-info">
            <div className="page-title">{currentPage.title}</div>
            <div className="page-url">{currentPage.url}</div>
          </div>
        ) : (
          <div>加载中...</div>
        )}
      </div>
      
      <div className="section">
        <div className="section-title">执行任务</div>
        <textarea 
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          className="task-input"
          placeholder="输入您想要执行的任务..."
          disabled={isRunning}
        />
        <button 
          onClick={handleRunTask}
          className="button"
          disabled={isRunning || !taskInput.trim()}
        >
          {isRunning ? '运行中...' : '运行'}
        </button>
        <div className="status">{taskStatus}</div>
      </div>
      
      <div className="section">
        <div className="section-title">快速操作</div>
        <div className="button-group">
          <button 
            onClick={handleCapturePage}
            className="button"
            disabled={isRunning}
          >
            捕获页面
          </button>
          <button 
            onClick={handleOpenSettings}
            className="button"
          >
            设置
          </button>
        </div>
      </div>
    </div>
  );
};

// 渲染弹出窗口
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
