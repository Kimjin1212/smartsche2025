import React, { useState } from 'react';
import { nlpService } from '../../services/nlpService';
import NLPTester, { runQuickTest } from '../../utils/nlpTester';

/**
 * NLP测试组件 - 简化版
 */
const NLPTesterComponent: React.FC = () => {
  // 状态管理
  const [input, setInput] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [quickTestResult, setQuickTestResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 单条测试
  const runSingleTest = () => {
    if (!input.trim()) {
      setError('请输入测试内容');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = NLPTester.testInput(input);
      setResults([result]);
    } catch (error) {
      console.error('运行测试出错:', error);
      setError('测试过程中出错');
    } finally {
      setLoading(false);
    }
  };

  // 运行快速测试
  const handleQuickTest = () => {
    setLoading(true);
    setError('');
    try {
      const result = runQuickTest();
      setQuickTestResult(result);
    } catch (error) {
      console.error('运行快速测试出错:', error);
      setError('快速测试过程中出错');
    } finally {
      setLoading(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.currentTarget.value);
  };

  // 渲染UI
  return (
    <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
      <h2>NLP功能测试工具</h2>
      <p>使用此工具测试自然语言处理功能，特别是时间和任务识别能力。</p>

      <div style={{ marginBottom: 16, border: '1px solid #ddd', padding: 16, borderRadius: 4 }}>
        <h3>测试设置</h3>
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="输入测试内容，例如：明天下午3点开会"
            rows={4}
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div>
          <button 
            onClick={runSingleTest} 
            disabled={loading}
            style={{ marginRight: 8, padding: '6px 16px' }}
          >
            {loading ? '处理中...' : '运行测试'}
          </button>
          <button 
            onClick={handleQuickTest} 
            disabled={loading}
            style={{ padding: '6px 16px' }}
          >
            {loading ? '处理中...' : '运行快速测试'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div style={{ marginBottom: 16, border: '1px solid #ddd', padding: 16, borderRadius: 4 }}>
          <h3>测试结果</h3>
          <div>
            {results.map((item, index) => (
              <div key={index} style={{ marginBottom: 16, padding: 16, border: '1px solid #eee', borderRadius: 4 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '2px 6px', 
                    borderRadius: 3, 
                    fontSize: 12, 
                    backgroundColor: '#e6f7ff', 
                    color: '#1890ff', 
                    marginRight: 8 
                  }}>
                    {item.detectedLanguage}
                  </span>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '2px 6px', 
                    borderRadius: 3, 
                    fontSize: 12, 
                    backgroundColor: item.success ? '#f6ffed' : '#fff2f0', 
                    color: item.success ? '#52c41a' : '#ff4d4f'
                  }}>
                    {item.success ? '成功' : '失败'}
                  </span>
                </div>
                
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                  <span style={{ color: '#888' }}>输入: </span>
                  {item.input}
                </div>
                
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: '#888' }}>提取内容: </span>
                  {item.extractedContent || '无'}
                </div>
                
                <div>
                  <span style={{ color: '#888' }}>日期: </span>
                  {item.date || '无'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {quickTestResult && (
        <div style={{ marginBottom: 16, border: '1px solid #ddd', padding: 16, borderRadius: 4 }}>
          <h3>快速测试结果</h3>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto', backgroundColor: '#f5f5f5', padding: 16, borderRadius: 4 }}>
            {quickTestResult}
          </pre>
        </div>
      )}
    </div>
  );
};

export default NLPTesterComponent; 