import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useActivityLog } from '../contexts/ActivityLogContext';
import { userAPI } from '../services/api';

interface UserAccount {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  // 직원 정보 추가
  fullName: string;
  phone: string;
  position: string;
  department: string;
  birthDate?: string;
  hireDate: string;
  address?: string;
  profileImage?: string;
  notes?: string;
}

const AccountManagement: React.FC = () => {
  const { } = useLanguage();
  const { addLog } = useActivityLog();

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };


  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [detailPopupWindow, setDetailPopupWindow] = useState<Window | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []); // 초기 한번만 실행

  useEffect(() => {
    // 팝업창으로부터 메시지 받기
    const handleMessage = (event: MessageEvent) => {
      console.log('메시지 수신:', event.data);

      if (event.data.type === 'NEW_EMPLOYEE') {
        const newEmployeeData = event.data.data;
        console.log('NEW_EMPLOYEE 메시지 처리 시작');
        console.log('메인 창에서 받은 직원 데이터:', {
          ...newEmployeeData,
          profileImage: newEmployeeData.profileImage ? '사진 데이터 있음' : '사진 데이터 없음'
        });

        // 필수 데이터 검증
        if (!newEmployeeData.fullName || !newEmployeeData.email || !newEmployeeData.username) {
          console.error('필수 데이터가 누락되었습니다:', newEmployeeData);
          setError('❌ 필수 데이터가 누락되어 직원 추가에 실패했습니다.');
          return;
        }

        // 날짜 형식 변환 (dd/mm/yyyy -> yyyy-mm-dd)
        const convertDate = (dateStr: string) => {
          if (!dateStr) return '';
          if (dateStr.length !== 10 || !dateStr.includes('/')) return dateStr;
          const parts = dateStr.split('/');
          if (parts.length !== 3) return dateStr;
          const [day, month, year] = parts;
          if (!day || !month || !year) return dateStr;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        };

        // 백엔드에 새 직원 추가
        const addUserToBackend = async () => {
          try {
            // 필수 데이터 검증
            if (!newEmployeeData.username || !newEmployeeData.email || !newEmployeeData.password || !newEmployeeData.fullName) {
              throw new Error('필수 정보 (사용자명, 이메일, 비밀번호, 성명)를 모두 입력해주세요.');
            }

            const newUserData = {
              username: newEmployeeData.username.trim(),
              email: newEmployeeData.email.trim(),
              password: newEmployeeData.password,
              role: newEmployeeData.role,
              isActive: newEmployeeData.isActive,
              fullName: newEmployeeData.fullName.trim(),
              phone: newEmployeeData.phone || '',
              position: newEmployeeData.position || '',
              department: newEmployeeData.department || '',
              birthDate: convertDate(newEmployeeData.birthDate),
              hireDate: convertDate(newEmployeeData.hireDate),
              address: newEmployeeData.address || '',
              profileImage: newEmployeeData.profileImage || '',
              notes: newEmployeeData.notes || ''
            };

            console.log('백엔드로 전송할 직원 데이터:', newUserData);

            const response = await userAPI.createUser(newUserData);
            if (response.success && response.data) {
              console.log('백엔드 응답:', response.data);

              // 성공시 사용자 목록 새로고침
              await fetchUsers();

              addLog('직원 추가', `새 직원 '${newEmployeeData.fullName}'을 추가했습니다.`, '계정 관리', 'account');
              setError('✅ 새 직원이 성공적으로 추가되었습니다.');
              setTimeout(() => setError(null), 3000);
            } else {
              throw new Error(response.message || '직원 추가에 실패했습니다.');
            }
          } catch (error) {
            console.error('직원 추가 중 오류:', error);
            const errorMessage = (error as any)?.response?.data?.message || (error as Error).message || '알 수 없는 오류';
            console.error('상세 에러 정보:', errorMessage);

            if (errorMessage.includes('Email already exists')) {
              setError(`❌ 이메일 '${newEmployeeData.email}'은 이미 사용 중입니다. 다른 이메일을 사용해주세요.`);
            } else if (errorMessage.includes('Username already exists')) {
              setError(`❌ 사용자명 '${newEmployeeData.username}'은 이미 사용 중입니다. 다른 사용자명을 사용해주세요.`);
            } else if (errorMessage.includes('required')) {
              setError('❌ 필수 정보가 누락되었습니다. 모든 필드를 입력해주세요.');
            } else {
              setError('❌ 직원 추가에 실패했습니다: ' + errorMessage);
            }
          }
        };

        addUserToBackend();

        // 팝업 창 상태 정리
        setPopupWindow(null);

        // URL에서 쿼리 파라미터 제거 (팝업창으로 인한 ? 제거)
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      } else if (event.data.type === 'UPDATE_EMPLOYEE') {
        const updatedEmployeeData = event.data.data;
        console.log('메인 창에서 받은 수정된 직원 데이터:', updatedEmployeeData);

        // 날짜 형식 변환 (dd/mm/yyyy -> yyyy-mm-dd)
        const convertDate = (dateStr: string) => {
          if (!dateStr) return '';
          if (dateStr.length !== 10 || !dateStr.includes('/')) return dateStr;
          const parts = dateStr.split('/');
          if (parts.length !== 3) return dateStr;
          const [day, month, year] = parts;
          if (!day || !month || !year) return dateStr;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        };

        // 기존 사용자 업데이트
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === updatedEmployeeData.id
              ? {
                  ...user,
                  fullName: updatedEmployeeData.fullName,
                  email: updatedEmployeeData.email,
                  phone: updatedEmployeeData.phone,
                  position: updatedEmployeeData.position,
                  department: updatedEmployeeData.department,
                  role: updatedEmployeeData.role,
                  birthDate: convertDate(updatedEmployeeData.birthDate),
                  hireDate: convertDate(updatedEmployeeData.hireDate),
                  isActive: updatedEmployeeData.isActive,
                  address: updatedEmployeeData.address,
                  profileImage: updatedEmployeeData.profileImage || user.profileImage,
                  notes: updatedEmployeeData.notes,
                  updatedAt: new Date().toISOString()
                }
              : user
          )
        );

        addLog('직원 수정', `직원 '${updatedEmployeeData.fullName}'의 정보를 수정했습니다.`, '계정 관리', 'account');
        setError('✅ 직원 정보가 성공적으로 업데이트되었습니다.');
        setTimeout(() => setError(null), 3000);
        setDetailPopupWindow(null);
      } else if (event.data.type === 'POPUP_CLOSED') {
        console.log('팝업 창이 닫혔습니다.');
        setPopupWindow(null);
        setDetailPopupWindow(null);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // 의존성 배열에서 users.length 제거

  const openEmployeeDetailPopup = (user: UserAccount) => {
    // 기존 상세보기 팝업이 열려있다면 포커스만 주기
    if (detailPopupWindow && !detailPopupWindow.closed) {
      detailPopupWindow.focus();
      return;
    }

    const popup = window.open(
      'about:blank',
      'employeeDetail_' + Date.now(),
      'width=900,height=700,scrollbars=yes,resizable=yes,toolbar=no,location=no,directories=no,status=no,menubar=no'
    );

    if (popup) {
      setDetailPopupWindow(popup);
      setEditingUser(user);

      // 팝업 창에 HTML 내용 작성
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>직원 상세 정보</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <meta charset="UTF-8">
        </head>
        <body class="bg-gray-50 p-6">
          <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-900">직원 상세 정보</h2>
              <div class="space-x-2">
                <button id="editToggleBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                  수정
                </button>
                <button id="closeBtn" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                  닫기
                </button>
              </div>
            </div>

            <form id="employeeDetailForm" class="space-y-6">
              <!-- 프로필 사진 -->
              <div class="flex justify-center mb-6">
                <div class="relative">
                  <div class="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg">
                    ${user.profileImage ?
                      `<img id="previewImage" src="${user.profileImage}" alt="프로필 사진" class="w-full h-full object-cover">` :
                      `<div id="photoPlaceholder" class="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                        ${user.fullName ? user.fullName.charAt(0) : user.username.charAt(0)}
                      </div>`
                    }
                  </div>
                  <button type="button" id="photoButton" class="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-colors hidden">
                    📷
                  </button>
                  <input type="file" id="profilePhoto" accept="image/*" class="hidden">
                </div>
              </div>

              <!-- 기본 정보 섹션 -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">기본 정보</h3>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">사용자명</label>
                    <input type="text" id="username" value="${user.username}" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input type="text" id="fullName" value="${user.fullName || ''}" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <input type="email" id="email" value="${user.email}" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                    <input type="text" id="phone" value="${user.phone || ''}" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                  </div>
                </div>

                <div class="space-y-4">
                  <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">직무 정보</h3>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">직급</label>
                    <input type="text" id="position" value="${user.position || ''}" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">부서</label>
                    <input type="text" id="department" value="${user.department || ''}" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">역할</label>
                    <select id="role" disabled class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                      <option value="EMPLOYEE" ${user.role === 'EMPLOYEE' ? 'selected' : ''}>직원</option>
                      <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>관리자</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">입사일</label>
                    <input type="text" id="hireDate" value="${user.hireDate || ''}" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                  </div>
                </div>
              </div>

              <!-- 추가 정보 섹션 -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">추가 정보</h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                    <input type="text" id="birthDate" value="${user.birthDate || ''}" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">계정 상태</label>
                    <select id="isActive" disabled class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                      <option value="true" ${user.isActive ? 'selected' : ''}>활성</option>
                      <option value="false" ${!user.isActive ? 'selected' : ''}>비활성</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">주소</label>
                  <input type="text" id="address" value="${user.address || ''}" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">메모</label>
                  <textarea id="notes" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 h-20">${user.notes || ''}</textarea>
                </div>
              </div>

              <!-- 버튼 그룹 -->
              <div class="flex justify-end space-x-3 pt-6 border-t">
                <button type="button" id="cancelBtn" class="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors hidden">
                  취소
                </button>
                <button type="submit" id="saveBtn" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors hidden">
                  저장
                </button>
              </div>
            </form>
          </div>

          <script>
            let isEditing = false;
            let selectedPhotoDataUrl = null;

            const editToggleBtn = document.getElementById('editToggleBtn');
            const closeBtn = document.getElementById('closeBtn');
            const cancelBtn = document.getElementById('cancelBtn');
            const saveBtn = document.getElementById('saveBtn');
            const photoButton = document.getElementById('photoButton');
            const form = document.getElementById('employeeDetailForm');

            // 필드들
            const fields = {
              username: document.getElementById('username'),
              fullName: document.getElementById('fullName'),
              email: document.getElementById('email'),
              phone: document.getElementById('phone'),
              position: document.getElementById('position'),
              department: document.getElementById('department'),
              role: document.getElementById('role'),
              hireDate: document.getElementById('hireDate'),
              birthDate: document.getElementById('birthDate'),
              isActive: document.getElementById('isActive'),
              address: document.getElementById('address'),
              notes: document.getElementById('notes')
            };

            // 수정/읽기 모드 전환
            function toggleEditMode() {
              isEditing = !isEditing;

              if (isEditing) {
                // 수정 모드
                editToggleBtn.textContent = '읽기 모드';
                editToggleBtn.className = 'bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors';
                photoButton.classList.remove('hidden');
                cancelBtn.classList.remove('hidden');
                saveBtn.classList.remove('hidden');

                // 필드들을 편집 가능하게
                Object.entries(fields).forEach(([key, field]) => {
                  if (key !== 'username') { // 사용자명은 편집 불가
                    field.readOnly = false;
                    field.disabled = false;
                    field.className = field.className.replace('bg-gray-100', 'bg-white');
                  }
                });
              } else {
                // 읽기 모드
                editToggleBtn.textContent = '수정';
                editToggleBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors';
                photoButton.classList.add('hidden');
                cancelBtn.classList.add('hidden');
                saveBtn.classList.add('hidden');

                // 필드들을 읽기 전용으로
                Object.values(fields).forEach(field => {
                  field.readOnly = true;
                  field.disabled = true;
                  field.className = field.className.replace('bg-white', 'bg-gray-100');
                });
              }
            }

            // 사진 업로드 처리
            function initPhotoUpload() {
              const photoInput = document.getElementById('profilePhoto');
              const previewImage = document.getElementById('previewImage');
              const photoPlaceholder = document.getElementById('photoPlaceholder');

              photoButton.addEventListener('click', function(e) {
                e.preventDefault();
                photoInput.click();
              });

              photoInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function(e) {
                  selectedPhotoDataUrl = e.target.result;
                  if (previewImage) {
                    previewImage.src = selectedPhotoDataUrl;
                  } else {
                    // 새 이미지 요소 생성
                    const newImg = document.createElement('img');
                    newImg.id = 'previewImage';
                    newImg.src = selectedPhotoDataUrl;
                    newImg.alt = '프로필 사진';
                    newImg.className = 'w-full h-full object-cover';

                    const container = photoPlaceholder ? photoPlaceholder.parentNode : document.querySelector('.w-32.h-32');
                    container.innerHTML = '';
                    container.appendChild(newImg);
                  }
                };
                reader.readAsDataURL(file);
              });
            }

            // 이벤트 리스너
            editToggleBtn.addEventListener('click', toggleEditMode);
            closeBtn.addEventListener('click', () => window.close());
            cancelBtn.addEventListener('click', () => {
              if (confirm('변경사항을 취소하시겠습니까?')) {
                window.location.reload();
              }
            });

            // 폼 제출 처리
            form.addEventListener('submit', function(e) {
              e.preventDefault();

              const updatedUser = {
                id: '${user.id}',
                username: fields.username.value,
                fullName: fields.fullName.value,
                email: fields.email.value,
                phone: fields.phone.value,
                position: fields.position.value,
                department: fields.department.value,
                role: fields.role.value,
                hireDate: fields.hireDate.value,
                birthDate: fields.birthDate.value,
                isActive: fields.isActive.value === 'true',
                address: fields.address.value,
                notes: fields.notes.value,
                profileImage: selectedPhotoDataUrl || '${user.profileImage || ""}'
              };

              // 부모 창에 업데이트된 정보 전송
              if (window.opener) {
                window.opener.postMessage({
                  type: 'UPDATE_EMPLOYEE',
                  data: updatedUser
                }, '*');
              }

              window.close();
            });

            // 초기화
            initPhotoUpload();
          </script>
        </body>
        </html>
      `;

      popup.document.write(htmlContent);
      popup.document.close();
    }
  };

  const openAddEmployeePopup = () => {
    // 기존 팝업이 열려있다면 포커스만 주기
    if (popupWindow && !popupWindow.closed) {
      popupWindow.focus();
      return;
    }

    const popup = window.open(
      'about:blank',
      'addEmployee_' + Date.now(),
      'width=900,height=700,scrollbars=yes,resizable=yes,toolbar=no,location=no,directories=no,status=no,menubar=no'
    );

    if (popup) {
      setPopupWindow(popup);

      // 팝업 창에 HTML 내용 작성 - 문자열 연결 방식 사용
      let htmlContent = '<!DOCTYPE html><html><head><title>새 직원 추가</title>';
      htmlContent += '<script src="https://cdn.tailwindcss.com"></script>';
      htmlContent += '<meta charset="UTF-8"></head>';
      htmlContent += '<body class="bg-gray-50 p-6">';
      htmlContent += '<div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">';
      htmlContent += '<h2 class="text-2xl font-bold text-gray-900 mb-6">새 직원 추가</h2>';
      htmlContent += '<form id="employeeForm" class="space-y-6">';

      // 기본 정보 섹션
      htmlContent += '<div class="bg-gray-50 p-6 rounded-lg">';
      htmlContent += '<h3 class="font-semibold text-gray-900 mb-4">기본 정보</h3>';

      // 프로필 사진 업로드
      htmlContent += '<div class="flex flex-col items-center mb-6">';
      htmlContent += '<div class="relative">';
      htmlContent += '<div id="photoPreview" class="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-gray-300 overflow-hidden cursor-pointer" onclick="document.getElementById(\'profilePhoto\').click()">';
      htmlContent += '<span id="photoPlaceholder" class="text-gray-500 text-sm text-center px-2 pointer-events-none">사진을<br>선택하세요</span>';
      htmlContent += '<img id="previewImage" class="w-full h-full object-cover hidden pointer-events-none" alt="Profile Preview">';
      htmlContent += '</div>';
      htmlContent += '<button type="button" id="photoButton" class="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors text-lg font-bold" onclick="document.getElementById(\'profilePhoto\').click()">+</button>';
      htmlContent += '</div>';
      htmlContent += '<input type="file" id="profilePhoto" accept="image/*" class="hidden" onchange="handlePhotoChange(this)">';
      htmlContent += '<p class="text-sm text-gray-500 mt-2">JPG, PNG 파일만 업로드 가능 (최대 5MB)</p>';
      htmlContent += '</div>';

      // 입력 필드들
      htmlContent += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
      htmlContent += '<div><label class="block text-sm font-medium text-gray-700 mb-2">성명 *</label>';
      htmlContent += '<input type="text" id="fullName" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div>';
      htmlContent += '<div><label class="block text-sm font-medium text-gray-700 mb-2">전화번호 *</label>';
      htmlContent += '<input type="tel" id="phone" required placeholder="010-1234-5678" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div>';
      htmlContent += '<div><label class="block text-sm font-medium text-gray-700 mb-2">생년월일</label>';
      htmlContent += '<input type="text" id="birthDate" placeholder="dd/mm/yyyy" maxlength="10" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div>';
      htmlContent += '<div><label class="block text-sm font-medium text-gray-700 mb-2">이메일 *</label>';
      htmlContent += '<input type="email" id="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div>';
      htmlContent += '</div>';
      htmlContent += '<div class="mt-4"><label class="block text-sm font-medium text-gray-700 mb-2">주소</label>';
      htmlContent += '<input type="text" id="address" placeholder="서울시 강남구 테헤란로 123" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div>';
      htmlContent += '</div>';

      // 회사 정보 섹션
      htmlContent += '<div class="bg-blue-50 p-6 rounded-lg">';
      htmlContent += '<h3 class="font-semibold text-gray-900 mb-4">회사 정보</h3>';
      htmlContent += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
      htmlContent += '<div><label class="block text-sm font-medium text-gray-700 mb-2">부서 *</label>';
      htmlContent += '<input type="text" id="department" required placeholder="영업팀, 기술팀, IT팀 등" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div>';
      htmlContent += '<div><label class="block text-sm font-medium text-gray-700 mb-2">직급 *</label>';
      htmlContent += '<input type="text" id="position" required placeholder="팀장, 주임, 대리 등" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div>';
      htmlContent += '<div><label class="block text-sm font-medium text-gray-700 mb-2">입사일 *</label>';
      htmlContent += '<input type="text" id="hireDate" required placeholder="dd/mm/yyyy" maxlength="10" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div>';
      htmlContent += '<div><label class="block text-sm font-medium text-gray-700 mb-2">권한 *</label>';
      htmlContent += '<select id="role" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">';
      htmlContent += '<option value="EMPLOYEE">직원</option><option value="ADMIN">관리자</option></select></div>';
      htmlContent += '</div>';
      htmlContent += '<div class="mt-4"><label class="block text-sm font-medium text-gray-700 mb-2">메모</label>';
      htmlContent += '<textarea id="notes" rows="3" placeholder="직원에 대한 추가 정보나 메모를 입력하세요..." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>';
      htmlContent += '</div>';

      // 계정 정보 섹션
      htmlContent += '<div class="bg-yellow-50 p-6 rounded-lg">';
      htmlContent += '<h3 class="font-semibold text-gray-900 mb-4">계정 정보</h3>';
      htmlContent += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
      htmlContent += '<div><label class="block text-sm font-medium text-gray-700 mb-2">아이디 *</label>';
      htmlContent += '<input type="text" id="username" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div>';
      htmlContent += '<div><label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 *</label>';
      htmlContent += '<input type="password" id="password" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div>';
      htmlContent += '</div>';
      htmlContent += '<div class="mt-4"><label class="flex items-center">';
      htmlContent += '<input type="checkbox" id="isActive" checked class="mr-2">';
      htmlContent += '<span class="text-sm font-medium text-gray-700">계정 활성화</span></label></div>';
      htmlContent += '</div>';

      // 버튼들
      htmlContent += '<div class="flex justify-end space-x-4 pt-6 border-t">';
      htmlContent += '<button type="button" onclick="window.close()" class="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors">취소</button>';
      htmlContent += '<button type="submit" class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">추가</button>';
      htmlContent += '</div>';
      htmlContent += '</form></div>';

      // JavaScript 추가
      htmlContent += '<script>';
      htmlContent += 'let selectedPhotoDataUrl = "";';
      htmlContent += 'function handlePhotoChange(input) {';
      htmlContent += 'const file = input.files[0];';
      htmlContent += 'if (!file) return;';
      htmlContent += 'if (file.size > 5 * 1024 * 1024) { alert("파일 크기가 너무 큽니다. 5MB 이하의 파일을 선택해주세요."); input.value = ""; return; }';
      htmlContent += 'if (!file.type.startsWith("image/")) { alert("이미지 파일만 업로드 가능합니다."); input.value = ""; return; }';
      htmlContent += 'const reader = new FileReader();';
      htmlContent += 'reader.onload = function(e) {';
      htmlContent += 'selectedPhotoDataUrl = e.target.result;';
      htmlContent += 'const previewImage = document.getElementById("previewImage");';
      htmlContent += 'const photoPlaceholder = document.getElementById("photoPlaceholder");';
      htmlContent += 'if (previewImage && photoPlaceholder) {';
      htmlContent += 'previewImage.src = selectedPhotoDataUrl;';
      htmlContent += 'previewImage.classList.remove("hidden");';
      htmlContent += 'photoPlaceholder.classList.add("hidden");';
      htmlContent += '}};';
      htmlContent += 'reader.readAsDataURL(file); }';

      // 폼 제출 처리
      htmlContent += 'document.getElementById("employeeForm").addEventListener("submit", function(e) {';
      htmlContent += 'e.preventDefault();';
      htmlContent += 'console.log("폼 제출 시작");';

      // 필수 필드 검증
      htmlContent += 'const fullName = document.getElementById("fullName").value.trim();';
      htmlContent += 'const email = document.getElementById("email").value.trim();';
      htmlContent += 'const phone = document.getElementById("phone").value.trim();';
      htmlContent += 'const department = document.getElementById("department").value.trim();';
      htmlContent += 'const position = document.getElementById("position").value.trim();';
      htmlContent += 'const hireDate = document.getElementById("hireDate").value.trim();';
      htmlContent += 'const username = document.getElementById("username").value.trim();';
      htmlContent += 'const password = document.getElementById("password").value.trim();';

      htmlContent += 'if (!fullName || !email || !phone || !department || !position || !hireDate || !username || !password) {';
      htmlContent += 'alert("필수 항목을 모두 입력해주세요.\\n\\n필수 항목:\\n- 성명\\n- 이메일\\n- 전화번호\\n- 부서\\n- 직급\\n- 입사일\\n- 아이디\\n- 비밀번호");';
      htmlContent += 'return;';
      htmlContent += '}';

      // 이메일 형식 검증
      htmlContent += 'const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;';
      htmlContent += 'if (!emailRegex.test(email)) {';
      htmlContent += 'alert("올바른 이메일 형식을 입력해주세요.");';
      htmlContent += 'return;';
      htmlContent += '}';

      htmlContent += 'const formData = {';
      htmlContent += 'fullName: fullName,';
      htmlContent += 'phone: phone,';
      htmlContent += 'birthDate: document.getElementById("birthDate").value,';
      htmlContent += 'email: email,';
      htmlContent += 'address: document.getElementById("address").value,';
      htmlContent += 'department: department,';
      htmlContent += 'position: position,';
      htmlContent += 'hireDate: hireDate,';
      htmlContent += 'role: document.getElementById("role").value,';
      htmlContent += 'notes: document.getElementById("notes").value,';
      htmlContent += 'username: username,';
      htmlContent += 'password: password,';
      htmlContent += 'isActive: document.getElementById("isActive").checked,';
      htmlContent += 'profileImage: selectedPhotoDataUrl || "" };';

      htmlContent += 'console.log("전송할 데이터:", formData);';
      htmlContent += 'if (window.opener) { ';
      htmlContent += 'console.log("부모 창에 메시지 전송 중...");';
      htmlContent += 'window.opener.postMessage({ type: "NEW_EMPLOYEE", data: formData }, "*"); ';
      htmlContent += 'console.log("메시지 전송 완료");';
      htmlContent += '} else { ';
      htmlContent += 'console.error("부모 창을 찾을 수 없습니다.");';
      htmlContent += 'alert("오류: 부모 창과의 연결이 끊어졌습니다. 창을 닫고 다시 시도해주세요.");';
      htmlContent += 'return;';
      htmlContent += '}';
      htmlContent += 'setTimeout(() => window.close(), 100); });';
      htmlContent += '</script></body></html>';

      popup.document.write(htmlContent);
      popup.document.close();
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      addLog('페이지 접속', '계정 관리 페이지에 접속했습니다.', '계정 관리', 'account');

      const response = await userAPI.getUsers();
      if (response.success && response.data) {
        setUsers(response.data.items || []);
      } else {
        setError('사용자 목록을 불러오는 데 실패했습니다.');
      }
      setLoading(false);
    } catch (err) {
      console.error('사용자 데이터 로딩 중 오류:', err);
      setError('사용자 목록을 불러오는 데 실패했습니다.');
      setLoading(false);
    }
  };

  const handleViewDetails = (user: UserAccount) => {
    openEmployeeDetailPopup(user);
  };

  const handleDelete = async (id: string) => {
    const userToDelete = users.find(user => user.id === id);
    if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      try {
        // 백엔드 API 호출로 실제 데이터베이스에서 삭제
        await userAPI.deleteUser(id);

        // 성공 시 프론트엔드 상태 업데이트
        setUsers(users.filter(user => user.id !== id));
        addLog('직원 삭제', `직원 '${userToDelete?.fullName || userToDelete?.username}'을 삭제했습니다.`, '계정 관리', 'account');
        setError('✅ 사용자가 성공적으로 삭제되었습니다.');
        setTimeout(() => setError(null), 3000);
      } catch (error) {
        console.error('사용자 삭제 실패:', error);
        setError('❌ 사용자 삭제에 실패했습니다.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const userToToggle = users.find(user => user.id === id);
    try {
      setUsers(users.map(user =>
        user.id === id ? { ...user, isActive: !user.isActive } : user
      ));
      addLog('직원 상태 변경', `직원 '${userToToggle?.fullName || userToToggle?.username}'의 상태를 ${userToToggle?.isActive ? '비활성' : '활성'}으로 변경했습니다.`, '계정 관리', 'account');
      setError('✅ 사용자 상태가 성공적으로 변경되었습니다.');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError('❌ 사용자 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">계정 관리</h1>
        <p className="text-gray-600">직원 계정을 관리하고 권한을 설정합니다.</p>
      </div>

      {error && (
        <div className={`mb-4 p-4 rounded-lg ${
          error.includes('✅')
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <input
            type="text"
            placeholder="이름, 사용자명, 이메일, 부서, 직급으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">모든 권한</option>
            <option value="ADMIN">관리자</option>
            <option value="EMPLOYEE">직원</option>
          </select>
        </div>
        <button
          onClick={openAddEmployeePopup}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          새 직원 추가
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-6 text-sm text-gray-600">
        <span>전체: {filteredUsers.length}명</span>
        <span>활성: {filteredUsers.filter(u => u.isActive).length}</span>
        <span>비활성: {filteredUsers.filter(u => !u.isActive).length}</span>
        <span>관리자: {filteredUsers.filter(u => u.role === 'ADMIN').length}</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-16 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">사진</th>
                <th className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">사용자명</th>
                <th className="w-48 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                <th className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">전화번호</th>
                <th className="w-40 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">부서/직급</th>
                <th className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태/권한</th>
                <th className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                <th className="w-40 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium">
                          {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <div className="text-sm font-medium text-gray-900">{user.department}</div>
                      <div className="text-sm text-gray-500">{user.position}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? '활성' : '비활성'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'ADMIN' ? '관리자' : '직원'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center space-y-2.5">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 min-w-[60px] shadow-sm hover:shadow-md"
                      >
                        상세보기
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`${
                            user.isActive
                              ? 'bg-orange-500 hover:bg-orange-600 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          } px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 min-w-[50px] shadow-sm hover:shadow-md`}
                        >
                          {user.isActive ? '비활성' : '활성화'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 min-w-[50px] shadow-sm hover:shadow-md"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          검색 조건에 맞는 사용자가 없습니다.
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
