// 메모리 누수 분석용 스크립트
const http = require('http');

console.log('🔍 메모리 누수 검사 시작...\n');

// 1. 메모리 모니터링 함수
function checkMemory(label) {
  const usage = process.memoryUsage();
  console.log(`📊 ${label}:`);
  console.log(`   RSS: ${Math.round(usage.rss / 1024 / 1024)}MB`);
  console.log(`   Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
  console.log(`   Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)}MB`);
  console.log(`   External: ${Math.round(usage.external / 1024 / 1024)}MB\n`);
  return usage;
}

// 2. API 부하 테스트 함수
function loadTest(endpoint, times = 100) {
  return new Promise((resolve) => {
    let completed = 0;
    const startTime = Date.now();

    console.log(`🚀 API 부하 테스트 시작: ${endpoint} (${times}회)`);

    for (let i = 0; i < times; i++) {
      const req = http.get(`http://localhost:8000${endpoint}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          completed++;
          if (completed === times) {
            const endTime = Date.now();
            console.log(`✅ 완료: ${times}회 요청, ${endTime - startTime}ms 소요\n`);
            resolve();
          }
        });
      });

      req.on('error', (err) => {
        console.error('❌ 요청 오류:', err.message);
        completed++;
        if (completed === times) resolve();
      });
    }
  });
}

// 3. 메모리 누수 테스트 실행
async function runMemoryLeakTest() {
  const initial = checkMemory('초기 메모리');

  // Health check 부하 테스트
  await loadTest('/api/health', 50);
  const afterHealth = checkMemory('Health API 테스트 후');

  // 잠시 대기 (GC 시간)
  console.log('⏳ 가비지 컬렉션 대기 중...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 강제 GC (Node.js --expose-gc 필요)
  if (global.gc) {
    global.gc();
    console.log('🗑️ 가비지 컬렉션 강제 실행');
  }

  const afterGC = checkMemory('가비지 컬렉션 후');

  // 메모리 증가량 계산
  const heapIncrease = afterGC.heapUsed - initial.heapUsed;
  const rssIncrease = afterGC.rss - initial.rss;

  console.log('📈 메모리 변화 분석:');
  console.log(`   Heap 증가: ${Math.round(heapIncrease / 1024 / 1024)}MB`);
  console.log(`   RSS 증가: ${Math.round(rssIncrease / 1024 / 1024)}MB`);

  if (heapIncrease > 10 * 1024 * 1024) { // 10MB 이상
    console.warn('⚠️  메모리 누수 의심: Heap이 10MB 이상 증가');
  } else {
    console.log('✅ 메모리 사용량 정상');
  }
}

// 4. 실행
runMemoryLeakTest().catch(console.error);

// 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 테스트 중단됨');
  process.exit(0);
});