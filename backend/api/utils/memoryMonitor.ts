export class MemoryMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private initialMemory: NodeJS.MemoryUsage;
  private memoryHistory: Array<{timestamp: Date, usage: NodeJS.MemoryUsage}> = [];

  constructor() {
    this.initialMemory = process.memoryUsage();
  }

  start(intervalMs: number = 10000) {
    console.log('🔍 메모리 모니터링 시작...');

    this.intervalId = setInterval(() => {
      const usage = process.memoryUsage();
      const timestamp = new Date();

      this.memoryHistory.push({ timestamp, usage });

      // 최근 10개 기록만 유지
      if (this.memoryHistory.length > 10) {
        this.memoryHistory.shift();
      }

      const rss = Math.round(usage.rss / 1024 / 1024);
      const heapUsed = Math.round(usage.heapUsed / 1024 / 1024);
      const heapTotal = Math.round(usage.heapTotal / 1024 / 1024);
      const external = Math.round(usage.external / 1024 / 1024);

      console.log(`📊 메모리 사용량 [${timestamp.toLocaleTimeString()}]:`);
      console.log(`   RSS: ${rss}MB | Heap Used: ${heapUsed}MB | Heap Total: ${heapTotal}MB | External: ${external}MB`);

      // 메모리 급증 감지 (50MB 이상 증가)
      if (this.memoryHistory.length >= 2) {
        const previous = this.memoryHistory[this.memoryHistory.length - 2];
        const current = this.memoryHistory[this.memoryHistory.length - 1];

        if (previous && current) {
          const heapIncrease = (current.usage.heapUsed - previous.usage.heapUsed) / 1024 / 1024;

          if (heapIncrease > 50) {
            console.warn(`⚠️  메모리 급증 감지: +${Math.round(heapIncrease)}MB in ${intervalMs/1000}s`);
          }
        }
      }

      // 위험 수준 경고 (2GB 이상)
      if (heapUsed > 2048) {
        console.error(`🚨 메모리 위험 수준: ${heapUsed}MB - 곧 크래시 가능성!`);
      }
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️  메모리 모니터링 중지');
    }
  }

  getReport() {
    const current = process.memoryUsage();
    const heapGrowth = current.heapUsed - this.initialMemory.heapUsed;

    return {
      current: {
        rss: Math.round(current.rss / 1024 / 1024),
        heapUsed: Math.round(current.heapUsed / 1024 / 1024),
        heapTotal: Math.round(current.heapTotal / 1024 / 1024),
        external: Math.round(current.external / 1024 / 1024)
      },
      growth: {
        heap: Math.round(heapGrowth / 1024 / 1024)
      },
      history: this.memoryHistory
    };
  }

  // Express 미들웨어로 사용 가능
  middleware() {
    return (req: any, res: any, next: any) => {
      const startMemory = process.memoryUsage();

      res.on('finish', () => {
        const endMemory = process.memoryUsage();
        const heapDiff = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;

        if (heapDiff > 10) { // 10MB 이상 증가시 로그
          console.warn(`🔍 ${req.method} ${req.path} - 메모리 증가: +${Math.round(heapDiff)}MB`);
        }
      });

      next();
    };
  }
}