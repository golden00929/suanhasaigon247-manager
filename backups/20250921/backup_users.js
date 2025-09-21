const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'https://suanhasaigon247-manager.onrender.com/api';

async function backupUsers() {
  try {
    console.log('🔍 관리자 로그인 중...');

    // 1. 관리자 로그인
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'system.admin@suanhasaigon247.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      throw new Error('로그인 실패');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ 로그인 성공');

    // 2. 사용자 목록 조회
    console.log('📋 사용자 목록 조회 중...');
    const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.data.success) {
      throw new Error('사용자 목록 조회 실패');
    }

    const users = usersResponse.data.data.items;
    console.log(`✅ ${users.length}명의 사용자 조회 완료`);

    // 3. 백업 데이터 생성
    const backupData = {
      backup_date: new Date().toISOString(),
      git_tag: 'v1.1.0-stable',
      total_users: users.length,
      users: users
    };

    // 4. JSON 파일로 저장
    const filename = `production_users_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));

    console.log('💾 백업 파일 저장됨:', filename);
    console.log('📊 백업 요약:');
    console.log(`   - 총 사용자: ${users.length}명`);
    console.log(`   - 관리자: ${users.filter(u => u.role === 'ADMIN').length}명`);
    console.log(`   - 직원: ${users.filter(u => u.role === 'EMPLOYEE').length}명`);

    return backupData;

  } catch (error) {
    console.error('❌ 백업 실패:', error.message);
    throw error;
  }
}

// 실행
backupUsers().catch(console.error);