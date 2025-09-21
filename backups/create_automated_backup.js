const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://suanhasaigon247-manager.onrender.com/api';

async function createAutomatedBackup() {
  try {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0].replace(/-/g, '');
    const timestamp = Date.now();

    console.log('🤖 자동 백업 시작...');
    console.log(`📅 백업 날짜: ${dateString}`);

    // 1. 백업 디렉토리 생성
    const backupDir = path.join(__dirname, dateString);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`📁 백업 디렉토리 생성: ${backupDir}`);
    }

    // 2. 관리자 로그인
    console.log('🔐 관리자 인증 중...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'system.admin@suanhasaigon247.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      throw new Error('관리자 로그인 실패');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ 관리자 인증 완료');

    // 3. 사용자 데이터 백업
    console.log('👥 사용자 데이터 백업 중...');
    const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.data.success) {
      throw new Error('사용자 데이터 조회 실패');
    }

    const users = usersResponse.data.data.items;

    // 4. 고객 데이터 백업
    console.log('🏢 고객 데이터 백업 중...');
    const customersResponse = await axios.get(`${API_BASE_URL}/customers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const customers = (customersResponse.data.success && customersResponse.data.data && customersResponse.data.data.items) ? customersResponse.data.data.items : [];

    // 5. 견적 데이터 백업
    console.log('📋 견적 데이터 백업 중...');
    const quotationsResponse = await axios.get(`${API_BASE_URL}/quotations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const quotations = (quotationsResponse.data.success && quotationsResponse.data.data && quotationsResponse.data.data.items) ? quotationsResponse.data.data.items : [];

    // 6. 가격 카테고리 백업
    console.log('💰 가격 데이터 백업 중...');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/prices/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const categories = (categoriesResponse.data.success && categoriesResponse.data.data && categoriesResponse.data.data.items) ? categoriesResponse.data.data.items : [];

    // 7. 종합 백업 데이터 생성
    const backupData = {
      backup_date: now.toISOString(),
      backup_type: 'automated_full',
      git_tag: 'v1.1.0-stable',
      statistics: {
        total_users: users.length,
        total_customers: customers.length,
        total_quotations: quotations.length,
        total_categories: categories.length,
        admins: users.filter(u => u.role === 'ADMIN').length,
        employees: users.filter(u => u.role === 'EMPLOYEE').length
      },
      data: {
        users: users,
        customers: customers,
        quotations: quotations,
        priceCategories: categories
      }
    };

    // 8. 백업 파일 저장
    const filename = `automated_full_backup_${dateString}_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

    console.log('💾 백업 완료!');
    console.log(`📄 파일명: ${filename}`);
    console.log(`📍 위치: ${filepath}`);
    console.log('📊 백업 통계:');
    console.log(`   - 사용자: ${backupData.statistics.total_users}명 (관리자: ${backupData.statistics.admins}명, 직원: ${backupData.statistics.employees}명)`);
    console.log(`   - 고객: ${backupData.statistics.total_customers}명`);
    console.log(`   - 견적: ${backupData.statistics.total_quotations}개`);
    console.log(`   - 가격 카테고리: ${backupData.statistics.total_categories}개`);

    return {
      success: true,
      filename: filename,
      filepath: filepath,
      statistics: backupData.statistics
    };

  } catch (error) {
    console.error('❌ 자동 백업 실패:', error.message);
    throw error;
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  createAutomatedBackup()
    .then((result) => {
      console.log('🎉 자동 백업 성공!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 자동 백업 실패:', error.message);
      process.exit(1);
    });
}

module.exports = createAutomatedBackup;