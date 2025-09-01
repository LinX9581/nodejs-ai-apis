#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/**
 * 分析 gpt.log 檔案的工具
 */
class LogAnalyzer {
  constructor(logFilePath = './logs/gpt.log') {
    this.logFilePath = logFilePath;
  }

  /**
   * 讀取並解析 log 檔案
   */
  readLogs() {
    if (!fs.existsSync(this.logFilePath)) {
      console.log('Log 檔案不存在:', this.logFilePath);
      return [];
    }

    const logContent = fs.readFileSync(this.logFilePath, 'utf8');
    const lines = logContent.trim().split('\n').filter(line => line.trim());
    
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.warn('無法解析的 log 行:', line);
        return null;
      }
    }).filter(log => log !== null);
  }

  /**
   * 找出 total_tokens 大於指定數值的記錄
   */
  findHighTokenUsage(minTokens = 500) {
    const logs = this.readLogs();
    
    return logs.filter(log => 
      log.type === 'ai_output' && 
      log.total_tokens && 
      log.total_tokens > minTokens
    );
  }

  /**
   * 統計分析
   */
  getStatistics() {
    const logs = this.readLogs();
    const outputLogs = logs.filter(log => log.type === 'ai_output');
    
    if (outputLogs.length === 0) {
      return { message: '沒有找到任何 ai_output 記錄' };
    }

    const tokens = outputLogs.map(log => log.total_tokens || 0);
    const durations = outputLogs.map(log => log.duration_ms || 0);
    
    return {
      總請求數: outputLogs.length,
      總token使用量: tokens.reduce((sum, t) => sum + t, 0),
      平均token: Math.round(tokens.reduce((sum, t) => sum + t, 0) / tokens.length),
      最高token: Math.max(...tokens),
      最低token: Math.min(...tokens),
      平均回應時間: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length) + 'ms',
      大於500token的請求數: tokens.filter(t => t > 500).length
    };
  }

  /**
   * 依時間範圍篩選
   */
  findByTimeRange(startTime, endTime) {
    const logs = this.readLogs();
    
    return logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      return logTime >= start && logTime <= end;
    });
  }

  /**
   * 找出最耗時的請求
   */
  findSlowestRequests(limit = 5) {
    const logs = this.readLogs();
    const outputLogs = logs.filter(log => log.type === 'ai_output');
    
    return outputLogs
      .sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0))
      .slice(0, limit);
  }

  /**
   * 根據 trace_id 找出完整的請求流程
   */
  findByTraceId(traceId) {
    const logs = this.readLogs();
    
    return logs.filter(log => log.trace_id === traceId)
             .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * 找出所有完整的請求對 (request + output)
   */
  getCompletePairs() {
    const logs = this.readLogs();
    const traceIds = [...new Set(logs.map(log => log.trace_id).filter(Boolean))];
    
    return traceIds.map(traceId => {
      const traceLogs = this.findByTraceId(traceId);
      const request = traceLogs.find(log => log.type === 'ai_request');
      const output = traceLogs.find(log => log.type === 'ai_output');
      const error = traceLogs.find(log => log.type === 'ai_error');
      
      return {
        trace_id: traceId,
        request,
        output,
        error,
        complete: !!(request && output),
        has_error: !!error
      };
    });
  }

  /**
   * 分析同時請求的情況
   */
  analyzeConcurrentRequests() {
    const logs = this.readLogs();
    const requestLogs = logs.filter(log => log.type === 'ai_request');
    
    // 按時間排序
    requestLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const concurrentGroups = [];
    let currentGroup = [];
    
    for (let i = 0; i < requestLogs.length; i++) {
      const current = requestLogs[i];
      const currentTime = new Date(current.timestamp);
      
      if (currentGroup.length === 0) {
        currentGroup.push(current);
      } else {
        const groupStartTime = new Date(currentGroup[0].timestamp);
        const timeDiff = (currentTime - groupStartTime) / 1000; // 秒
        
        if (timeDiff <= 5) { // 5秒內視為同時請求
          currentGroup.push(current);
        } else {
          if (currentGroup.length > 1) {
            concurrentGroups.push([...currentGroup]);
          }
          currentGroup = [current];
        }
      }
    }
    
    if (currentGroup.length > 1) {
      concurrentGroups.push(currentGroup);
    }
    
    return concurrentGroups;
  }
}

// 命令列工具
function main() {
  const analyzer = new LogAnalyzer();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📊 Log 分析工具');
    console.log('==================');
    console.log(analyzer.getStatistics());
    return;
  }

  const command = args[0];
  
  switch (command) {
    case 'tokens':
      const minTokens = parseInt(args[1]) || 500;
      const highTokenLogs = analyzer.findHighTokenUsage(minTokens);
      console.log(`🔍 Token 使用量 > ${minTokens} 的記錄：`);
      console.log(`找到 ${highTokenLogs.length} 筆記錄\n`);
      
      highTokenLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.timestamp}`);
        console.log(`   Tokens: ${log.total_tokens}`);
        console.log(`   Duration: ${log.duration_ms}ms`);
        console.log(`   Response: ${log.response.substring(0, 100)}...`);
        console.log('');
      });
      break;
      
    case 'slow':
      const limit = parseInt(args[1]) || 5;
      const slowRequests = analyzer.findSlowestRequests(limit);
      console.log(`🐌 最慢的 ${limit} 個請求：`);
      
      slowRequests.forEach((log, index) => {
        console.log(`${index + 1}. ${log.timestamp}`);
        console.log(`   Duration: ${log.duration_ms}ms`);
        console.log(`   Tokens: ${log.total_tokens}`);
        console.log('');
      });
      break;
      
    case 'stats':
      console.log('📊 詳細統計：');
      console.log(analyzer.getStatistics());
      break;

    case 'trace':
      const traceId = args[1];
      if (!traceId) {
        console.log('請提供 trace_id');
        return;
      }
      
      const traceLogs = analyzer.findByTraceId(traceId);
      console.log(`🔍 追蹤 ID: ${traceId}`);
      console.log(`找到 ${traceLogs.length} 筆記錄\n`);
      
      traceLogs.forEach((log, index) => {
        console.log(`${index + 1}. [${log.type}] ${log.timestamp}`);
        if (log.type === 'ai_request') {
          console.log(`   Path: ${log.path}`);
          console.log(`   Model: ${log.model}`);
          console.log(`   Prompt: ${log.prompt.substring(0, 50)}...`);
        } else if (log.type === 'ai_output') {
          console.log(`   Tokens: ${log.total_tokens}`);
          console.log(`   Duration: ${log.duration_ms}ms`);
          console.log(`   Response: ${log.response.substring(0, 50)}...`);
        } else if (log.type === 'ai_error') {
          console.log(`   Error: ${JSON.stringify(log.error)}`);
        }
        console.log('');
      });
      break;

    case 'pairs':
      const pairs = analyzer.getCompletePairs();
      console.log('🔗 完整的請求對分析：');
      console.log(`總共 ${pairs.length} 個追蹤 ID`);
      console.log(`完整請求對: ${pairs.filter(p => p.complete).length}`);
      console.log(`有錯誤的請求: ${pairs.filter(p => p.has_error).length}`);
      console.log(`未完成的請求: ${pairs.filter(p => !p.complete).length}\n`);
      
      pairs.forEach((pair, index) => {
        const status = pair.has_error ? '❌ ERROR' : (pair.complete ? '✅ COMPLETE' : '⏳ PENDING');
        console.log(`${index + 1}. ${status} [${pair.trace_id}]`);
        
        if (pair.request) {
          console.log(`   Request: ${pair.request.timestamp} - ${pair.request.path}`);
        }
        if (pair.output) {
          console.log(`   Output: ${pair.output.timestamp} - ${pair.output.total_tokens} tokens, ${pair.output.duration_ms}ms`);
        }
        if (pair.error) {
          console.log(`   Error: ${pair.error.timestamp}`);
        }
        console.log('');
      });
      break;

    case 'concurrent':
      const concurrentGroups = analyzer.analyzeConcurrentRequests();
      console.log('⚡ 同時請求分析：');
      console.log(`找到 ${concurrentGroups.length} 組同時請求\n`);
      
      concurrentGroups.forEach((group, index) => {
        console.log(`${index + 1}. 同時請求組 (${group.length} 個請求):`);
        group.forEach(req => {
          console.log(`   ${req.timestamp} [${req.trace_id}] ${req.path}`);
        });
        console.log('');
      });
      break;
      
    default:
      console.log('用法:');
      console.log('  node analyze-logs.js                # 顯示基本統計');
      console.log('  node analyze-logs.js tokens 500     # 找出 tokens > 500 的記錄');
      console.log('  node analyze-logs.js slow 5         # 找出最慢的 5 個請求');
      console.log('  node analyze-logs.js stats          # 顯示詳細統計');
      console.log('  node analyze-logs.js trace <id>     # 追蹤特定 trace_id 的完整流程');
      console.log('  node analyze-logs.js pairs          # 顯示所有請求對的配對情況');
      console.log('  node analyze-logs.js concurrent     # 分析同時請求的情況');
  }
}

// 如果是直接執行此檔案
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default LogAnalyzer;
