import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { PriceCategory, PriceItem } from '../types';
import { priceAPI } from '../services/api';

const PriceCalculator: React.FC = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<PriceCategory[]>([]);
  const [items, setItems] = useState<PriceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showCategoryManagementModal, setShowCategoryManagementModal] = useState(false);
  const [showPriceModal, setPriceModalData] = useState<{ show: boolean; item?: PriceItem | null }>({ show: false, item: null });
  const [editingCategory, setEditingCategory] = useState<PriceCategory | null>(null);

  // 새 항목 추가 폼
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    unit: '',
    baseCost: 0,
    calculatedPrice: 0,
    description: ''
  });

  // 포맷된 입력값 상태
  const [formattedBaseCost, setFormattedBaseCost] = useState('');

  // 계산 요율 설정
  const [calculationRates, setCalculationRates] = useState({
    pitRate: 10, // PIT 요율 (%)
    profitRate: 30, // 기업이윤 요율 (%)
    vatRate: 8 // 부가세 요율 (%)
  });

  // 카테고리 추가 폼
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });

  // 카테고리 수정 폼
  const [editCategoryFormData, setEditCategoryFormData] = useState({
    name: '',
    description: ''
  });

  // 단가 설정 폼
  const [priceFormData, setPriceFormData] = useState({
    baseCost: 0,
    calculatedPrice: 0
  });

  // 단가 설정 폼의 포맷된 입력값
  const [formattedPriceBaseCost, setFormattedPriceBaseCost] = useState('');

  // 단가 수정시 사용할 요율
  const [priceCalculationRates, setPriceCalculationRates] = useState({
    pitRate: 10,
    profitRate: 30,
    vatRate: 8
  });

  useEffect(() => {
    fetchData();
  }, []);

  // 숫자를 천단위 점(.)으로 구분하여 포맷팅하는 함수
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // 입력값을 천단위 점(.)으로 포맷팅하는 함수
  const formatInputValue = (value: string): string => {
    const numValue = value.replace(/\./g, '');
    if (numValue === '' || isNaN(Number(numValue))) return '';
    return formatNumber(Number(numValue));
  };

  // 포맷된 문자열을 숫자로 변환하는 함수
  const parseFormattedNumber = (value: string): number => {
    return Number(value.replace(/\./g, '')) || 0;
  };

  // 원가 기반 판매 단가 계산 함수 (부가세 포함 최종 가격)
  const calculateSellingPrice = (baseCost: number, rates = calculationRates) => {
    // 1단계: 원가에 PIT 추가
    const afterPIT = baseCost * (1 + rates.pitRate / 100);
    // 2단계: PIT 적용 후 금액에 기업이윤 추가
    const afterProfit = afterPIT * (1 + rates.profitRate / 100);
    // 3단계: 공급가액에 부가세 추가
    const finalPrice = afterProfit * (1 + rates.vatRate / 100);

    // 천단위 올림 처리
    return Math.ceil(finalPrice / 1000) * 1000;
  };

  // 부가세를 제외한 순단가 계산 함수 (견적서에서 사용)
  const calculateNetPrice = (baseCost: number, rates = calculationRates) => {
    // 1단계: 원가에 PIT 추가
    const afterPIT = baseCost * (1 + rates.pitRate / 100);
    // 2단계: PIT 적용 후 금액에 기업이윤 추가 (부가세 제외)
    const afterProfit = afterPIT * (1 + rates.profitRate / 100);

    // 천단위 올림 처리 (부가세 제외한 순단가)
    return Math.ceil(afterProfit / 1000) * 1000;
  };

  // 상세 계산 과정을 반환하는 함수
  const getCalculationDetails = (baseCost: number, rates = calculationRates) => {
    const afterPIT = baseCost * (1 + rates.pitRate / 100);
    const pitAmount = afterPIT - baseCost;
    const afterProfit = afterPIT * (1 + rates.profitRate / 100);
    const profitAmount = afterProfit - afterPIT;
    const finalPrice = afterProfit * (1 + rates.vatRate / 100);
    const vatAmount = finalPrice - afterProfit;

    return {
      baseCost,
      pitRate: rates.pitRate,
      pitAmount,
      afterPIT,
      profitRate: rates.profitRate,
      profitAmount,
      afterProfit,
      vatRate: rates.vatRate,
      vatAmount,
      finalPrice: Math.ceil(finalPrice / 1000) * 1000
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('📊 단가 계산기 데이터 로딩 시작...');

      // 실제 API에서 카테고리와 가격 항목 데이터 가져오기
      const [categoriesResponse, itemsResponse] = await Promise.all([
        priceAPI.getCategories({ page: 1, limit: 100 }),
        priceAPI.getItems({ page: 1, limit: 500 })
      ]);

      console.log('📝 카테고리 API 응답:', categoriesResponse);
      console.log('🏷️ 가격 항목 API 응답:', itemsResponse);

      // 카테고리 데이터 처리
      if (categoriesResponse.success && categoriesResponse.data) {
        const categoriesData = categoriesResponse.data.categories || categoriesResponse.data;
        console.log('✅ 카테고리 로드 성공:', categoriesData.length, '개');
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } else {
        console.log('⚠️ 카테고리 API에서 빈 응답 또는 오류');
        setCategories([]);
      }

      // 가격 항목 데이터 처리
      if (itemsResponse.success && itemsResponse.data) {
        const itemsData = itemsResponse.data.items || itemsResponse.data;
        console.log('✅ 가격 항목 로드 성공:', itemsData.length, '개');

        // 데이터베이스 구조에 맞게 변환
        const transformedItems = itemsData.map((item: any) => {
          let baseCost = item.baseCost || 0;
          // 기존 데이터에 baseCost가 없으면 역산으로 추정
          if (baseCost === 0 && item.unitPrice > 0) {
            // 현재 단가가 부가세 포함 가격이라고 가정하고 역산
            // unitPrice = baseCost * 1.1 * 1.3 * 1.08 (PIT 10% + 기업이윤 30% + VAT 8%)
            baseCost = Math.round(item.unitPrice / (1.1 * 1.3 * 1.08));
          }

          return {
            id: item.id,
            categoryId: item.categoryId,
            name: item.itemName,
            unitPrice: item.unitPrice,
            unit: item.unit || '개',
            description: item.description || '',
            baseCost: baseCost
          };
        });

        setItems(transformedItems);
      } else {
        console.log('⚠️ 가격 항목 API에서 빈 응답 또는 오류');
        setItems([]);
      }

      console.log('🎉 단가 계산기 데이터 로드 완료');
    } catch (err) {
      console.error('❌ 단가 계산기 데이터 로드 실패:', err);
      setError(t('priceCalculator.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory
    ? items.filter(item => item.categoryId === selectedCategory)
    : items;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      setError(t('priceCalculator.errorSelectCategory'));
      return;
    }
    if (!formData.name.trim()) {
      setError(t('priceCalculator.errorEnterTaskName'));
      return;
    }
    if (!formData.unit.trim()) {
      setError(t('priceCalculator.errorEnterUnit'));
      return;
    }
    if (formData.baseCost <= 0) {
      setError(t('priceCalculator.errorBaseCostGreaterThanZero'));
      return;
    }

    try {
      console.log('📝 새 가격 항목 추가 시작...');
      const calculatedPrice = calculateNetPrice(formData.baseCost); // 부가세 제외 순단가 사용

      // 실제 API로 가격 항목 생성
      const createResponse = await priceAPI.createItem({
        categoryId: formData.categoryId,
        itemName: formData.name.trim(),
        unit: formData.unit.trim(),
        unitPrice: calculatedPrice,
        baseCost: formData.baseCost,
        description: formData.description.trim(),
        isActive: true
      });

      if (createResponse.success && createResponse.data) {
        console.log('✅ 가격 항목 생성 성공:', createResponse.data);

        // 로컬 상태 업데이트
        const newItem = {
          id: createResponse.data.id,
          categoryId: formData.categoryId,
          name: formData.name.trim(),
          unit: formData.unit.trim(),
          unitPrice: calculatedPrice,
          baseCost: formData.baseCost,
          description: formData.description.trim()
        };

        setItems([...items, newItem]);
        setShowAddModal(false);
        setFormData({ categoryId: '', name: '', unit: '', baseCost: 0, calculatedPrice: 0, description: '' });

        setError(`✅ "${newItem.name}" 작업이 성공적으로 추가되었습니다! 단가: ${formatNumber(calculatedPrice)} VND`);
        setTimeout(() => setError(null), 3000);
      } else {
        console.error('❌ 가격 항목 생성 실패:', createResponse);
        setError(t('priceCalculator.errorAddingTask'));
      }
    } catch (err) {
      console.error('❌ 가격 항목 추가 오류:', err);
      setError(t('priceCalculator.errorAddingTask'));
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryFormData.name.trim()) {
      setError(t('priceCalculator.errorEnterCategoryName'));
      return;
    }

    try {
      console.log('📁 새 카테고리 추가 시작...');

      // 실제 API로 카테고리 생성
      const createResponse = await priceAPI.createCategory({
        name: categoryFormData.name.trim(),
        description: categoryFormData.description.trim()
      });

      if (createResponse.success && createResponse.data) {
        console.log('✅ 카테고리 생성 성공:', createResponse.data);

        const newCategory = {
          id: createResponse.data.id,
          name: createResponse.data.name,
          description: createResponse.data.description || ''
        };

        setCategories([...categories, newCategory]);
        setShowCategoryModal(false);
        setCategoryFormData({ name: '', description: '' });

        // 새 작업 추가에서 호출된 경우에만 categoryId 설정
        if (showAddModal) {
          setFormData({ ...formData, categoryId: newCategory.id });
        }

        setError(`✅ "${newCategory.name}" 카테고리가 성공적으로 추가되었습니다!`);
        setTimeout(() => setError(null), 3000);
      } else {
        console.error('❌ 카테고리 생성 실패:', createResponse);
        setError(t('priceCalculator.errorAddingCategory'));
      }
    } catch (err) {
      console.error('❌ 카테고리 추가 오류:', err);
      setError(t('priceCalculator.errorAddingCategory'));
    }
  };

  const handlePriceUpdate = (item: PriceItem) => {
    // 저장된 baseCost가 있으면 사용하고, 없으면 역산으로 추정
    let baseCost = item.baseCost || 0;
    if (baseCost === 0 && item.unitPrice > 0) {
      // 현재 단가가 부가세 포함 가격이라고 가정하고 역산
      // unitPrice = baseCost * 1.1 * 1.3 * 1.08 (PIT 10% + 기업이윤 30% + VAT 8%)
      baseCost = Math.round(item.unitPrice / (1.1 * 1.3 * 1.08));
    }

    // 견적서에서 사용할 부가세 제외 순단가로 설정
    const netPrice = calculateNetPrice(baseCost, { pitRate: 10, profitRate: 30, vatRate: 8 });
    setPriceFormData({ baseCost, calculatedPrice: netPrice });
    setFormattedPriceBaseCost(baseCost > 0 ? formatNumber(baseCost) : '');
    // 기본 요율로 초기화
    setPriceCalculationRates({ pitRate: 10, profitRate: 30, vatRate: 8 });
    setPriceModalData({ show: true, item });
  };

  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!showPriceModal.item) return;

    try {
      console.log('💰 가격 항목 업데이트 시작...');
      const calculatedPrice = calculateNetPrice(priceFormData.baseCost, priceCalculationRates); // 부가세 제외 순단가 사용

      // 실제 API로 가격 항목 업데이트
      const updateResponse = await priceAPI.updateItem(showPriceModal.item.id, {
        unitPrice: calculatedPrice,
        baseCost: priceFormData.baseCost
      });

      if (updateResponse.success && updateResponse.data) {
        console.log('✅ 가격 항목 업데이트 성공:', updateResponse.data);

        // 로컬 상태 업데이트
        const updatedItems = items.map(item =>
          item.id === showPriceModal.item!.id
            ? { ...item, baseCost: priceFormData.baseCost, unitPrice: calculatedPrice }
            : item
        );

        setItems(updatedItems);
        setPriceModalData({ show: false, item: null });

        setError(`✅ "${showPriceModal.item.name}" 단가가 업데이트되었습니다! 새 단가: ${formatNumber(calculatedPrice)} VND`);
        setTimeout(() => setError(null), 3000);
      } else {
        console.error('❌ 가격 항목 업데이트 실패:', updateResponse);
        setError(t('priceCalculator.errorUpdatingPrice'));
      }
    } catch (err) {
      console.error('❌ 가격 항목 업데이트 오류:', err);
      setError(t('priceCalculator.errorUpdatingPrice'));
    }
  };

  const handleEditCategory = (category: PriceCategory) => {
    setEditingCategory(category);
    setEditCategoryFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowEditCategoryModal(true);
  };

  const handleEditCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCategory) return;

    if (!editCategoryFormData.name.trim()) {
      setError(t('priceCalculator.errorEnterCategoryName'));
      return;
    }

    try {
      console.log('📁 카테고리 수정 시작...', editingCategory.id);

      // 실제 API로 카테고리 업데이트
      const updateResponse = await priceAPI.updateCategory(editingCategory.id, {
        name: editCategoryFormData.name.trim(),
        description: editCategoryFormData.description.trim()
      });

      if (updateResponse.success && updateResponse.data) {
        console.log('✅ 카테고리 수정 성공:', updateResponse.data);

        const updatedCategory = {
          ...editingCategory,
          name: updateResponse.data.name,
          description: updateResponse.data.description || ''
        };

        const updatedCategories = categories.map(category =>
          category.id === editingCategory.id ? updatedCategory : category
        );

        setCategories(updatedCategories);
        setShowEditCategoryModal(false);
        setEditingCategory(null);
        setEditCategoryFormData({ name: '', description: '' });

        setError(`✅ "${updatedCategory.name}" 카테고리가 성공적으로 수정되었습니다!`);
        setTimeout(() => setError(null), 3000);
      } else {
        console.error('❌ 카테고리 수정 실패:', updateResponse);
        setError(t('priceCalculator.errorUpdatingCategory'));
      }
    } catch (err) {
      console.error('❌ 카테고리 수정 오류:', err);
      setError(t('priceCalculator.errorUpdatingCategory'));
    }
  };

  const handleDeleteCategory = async (category: PriceCategory) => {
    if (window.confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?\n이 카테고리에 속한 모든 작업도 함께 삭제됩니다.`)) {
      try {
        console.log('🗑️ 카테고리 삭제 시작...', category.id);

        // 실제 API로 카테고리 삭제
        const deleteResponse = await priceAPI.deleteCategory(category.id);

        if (deleteResponse.success) {
          console.log('✅ 카테고리 삭제 성공');

          // 로컬 상태에서 카테고리에 속한 작업들과 카테고리 제거
          const updatedItems = items.filter(item => item.categoryId !== category.id);
          const updatedCategories = categories.filter(cat => cat.id !== category.id);

          setItems(updatedItems);
          setCategories(updatedCategories);

          // 삭제된 카테고리가 선택되어 있었다면 전체 카테고리로 변경
          if (selectedCategory === category.id) {
            setSelectedCategory(null);
          }

          setError(`✅ "${category.name}" 카테고리가 삭제되었습니다.`);
          setTimeout(() => setError(null), 3000);
        } else {
          console.error('❌ 카테고리 삭제 실패:', deleteResponse);
          setError(t('priceCalculator.errorDeletingCategory'));
        }
      } catch (err) {
        console.error('❌ 카테고리 삭제 오류:', err);
        setError(t('priceCalculator.errorDeletingCategory'));
      }
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (window.confirm(`"${item.name}" 작업을 삭제하시겠습니까?`)) {
      try {
        console.log('🗑️ 가격 항목 삭제 시작...', item.id);

        // 실제 API로 가격 항목 삭제
        const deleteResponse = await priceAPI.deleteItem(item.id);

        if (deleteResponse.success) {
          console.log('✅ 가격 항목 삭제 성공');

          // 로컬 상태에서 제거
          const updatedItems = items.filter(i => i.id !== item.id);
          setItems(updatedItems);

          setError(`✅ "${item.name}" 작업이 삭제되었습니다.`);
          setTimeout(() => setError(null), 3000);
        } else {
          console.error('❌ 가격 항목 삭제 실패:', deleteResponse);
          setError(t('priceCalculator.errorDeletingTask'));
        }
      } catch (err) {
        console.error('❌ 가격 항목 삭제 오류:', err);
        setError(t('priceCalculator.errorDeletingTask'));
      }
    }
  };

  // 원가 입력시 실시간 판매가 계산
  useEffect(() => {
    if (formData.baseCost > 0) {
      setFormData(prev => ({ ...prev, calculatedPrice: calculateSellingPrice(prev.baseCost, calculationRates) }));
    }
  }, [formData.baseCost, calculationRates.pitRate, calculationRates.profitRate, calculationRates.vatRate]);

  useEffect(() => {
    if (priceFormData.baseCost > 0) {
      setPriceFormData(prev => ({ ...prev, calculatedPrice: calculateSellingPrice(prev.baseCost, priceCalculationRates) }));
    }
  }, [priceFormData.baseCost, priceCalculationRates.pitRate, priceCalculationRates.profitRate, priceCalculationRates.vatRate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">{t('priceCalculator.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('priceCalculator.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('priceCalculator.subtitle')}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg font-medium flex items-center space-x-2"
          >
            <span>➕</span>
            <span>{t('priceCalculator.addNewTask')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className={`border px-4 py-3 rounded mb-4 ${
          error.includes('✅')
            ? 'bg-green-100 border-green-400 text-green-700'
            : 'bg-red-100 border-red-400 text-red-700'
        }`}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 왼쪽: 카테고리 목록 */}
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{t('priceCalculator.taskCategories')}</h2>
            <button
              onClick={() => setShowCategoryManagementModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
            >
              <span>⚙️</span>
              <span>{t('priceCalculator.management')}</span>
            </button>
          </div>

          <div className="space-y-2">
            {/* 카테고리를 4개씩 그리드로 배치 */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm">{category.name}</div>
                  <div className="text-xs opacity-75 truncate">{category.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 작업 목록 */}
        <div className="lg:col-span-3 bg-blue-50 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {selectedCategory
                ? categories.find(c => c.id === selectedCategory)?.name + ' ' + t('priceCalculator.taskList')
                : t('priceCalculator.allTasksList')
              }
            </h2>
            <div className="text-sm text-gray-600">
              {t('priceCalculator.totalTasks')} {filteredItems.length}{t('priceCalculator.tasks')}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {t('priceCalculator.noTasksInCategory')}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded shrink-0">
                            {categories.find(c => c.id === item.categoryId)?.name}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 truncate">{item.description}</p>
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">{t('priceCalculator.baseCostLabel')}</span>
                        <span className="text-red-600 font-medium ml-1">{formatNumber(item.baseCost || 0)} VND</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">{t('priceCalculator.sellingLabel')}</span>
                        <span className="text-green-600 font-bold ml-1">{formatNumber(item.unitPrice)} VND</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4 shrink-0">
                      <button
                        onClick={() => handlePriceUpdate(item)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        {t('priceCalculator.editUnitPrice')}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        title={t('priceCalculator.deleteTask')}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 새 작업 추가 팝업 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-8 border w-[650px] shadow-2xl rounded-xl bg-white animate-in">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">➕</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{t('priceCalculator.addTask')}</h3>
                  <p className="text-sm text-gray-600">{t('priceCalculator.addTaskDescription')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ categoryId: '', name: '', unit: '', baseCost: 0, calculatedPrice: 0, description: '' });
                  setFormattedBaseCost('');
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('priceCalculator.categoryRequired')}
                    </label>
                  </div>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">{t('priceCalculator.selectCategory')}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('priceCalculator.unitRequired')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder={t('priceCalculator.unitPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('priceCalculator.taskNameRequired')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('priceCalculator.taskNamePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('priceCalculator.baseCostRequired')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formattedBaseCost}
                      onChange={(e) => {
                        const formatted = formatInputValue(e.target.value);
                        setFormattedBaseCost(formatted);
                        setFormData({ ...formData, baseCost: parseFormattedNumber(formatted) });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-red-50"
                      placeholder="850.000"
                    />
                  </div>
                  {formData.baseCost > 0 && (
                    <div className="text-xs text-red-600 mt-2">
                      {formatNumber(formData.baseCost)} VND ({t('priceCalculator.baseCostTag')})
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('priceCalculator.calculatedSellingPrice')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(formData.calculatedPrice)}
                      readOnly
                      className="w-full px-3 py-2 border border-green-200 rounded-lg bg-green-50 text-green-700 font-bold focus:outline-none"
                    />
                  </div>
                  {formData.calculatedPrice > 0 && (
                    <div className="text-xs text-green-600 mt-2">
                      {formatNumber(formData.calculatedPrice)} VND ({t('priceCalculator.autoCalculated')})
                    </div>
                  )}
                </div>
              </div>

              {/* 요율 설정 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="font-medium text-blue-800 mb-3">{t('priceCalculator.calculationRates')}</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">{t('priceCalculator.pitRate')}</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={calculationRates.pitRate}
                      onChange={(e) => setCalculationRates({...calculationRates, pitRate: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">{t('priceCalculator.profitRate')}</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={calculationRates.profitRate}
                      onChange={(e) => setCalculationRates({...calculationRates, profitRate: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">{t('priceCalculator.vatRate')}</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={calculationRates.vatRate}
                      onChange={(e) => setCalculationRates({...calculationRates, vatRate: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {formData.baseCost > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-sm text-yellow-800">
                    <div className="font-medium mb-2">{t('priceCalculator.detailedCalculation')}</div>
                    {(() => {
                      const details = getCalculationDetails(formData.baseCost);
                      return (
                        <div className="space-y-1">
                          <div>{t('priceCalculator.step1BaseCost')} <strong>{formatNumber(details.baseCost)} VND</strong></div>
                          <div className="ml-4 text-xs">{t('priceCalculator.pitApplied')} {details.pitRate}%: +{formatNumber(Math.round(details.pitAmount))} VND</div>
                          <div>{t('priceCalculator.step2AfterPIT')} <strong>{formatNumber(Math.round(details.afterPIT))} VND</strong></div>
                          <div className="ml-4 text-xs">{t('priceCalculator.profitApplied')} {details.profitRate}%: +{formatNumber(Math.round(details.profitAmount))} VND</div>
                          <div>{t('priceCalculator.step3AfterProfit')} <strong>{formatNumber(Math.round(details.afterProfit))} VND</strong></div>
                          <div className="ml-4 text-xs">{t('priceCalculator.vatApplied')} {details.vatRate}%: +{formatNumber(Math.round(details.vatAmount))} VND</div>
                          <div className="border-t pt-1 mt-2">
                            <div>{t('priceCalculator.step4FinalPrice')} <strong className="text-green-600">{formatNumber(details.finalPrice)} VND</strong></div>
                            <div className="text-blue-600 mt-1">{t('priceCalculator.quotationUnitPrice')} <strong>{formatNumber(Math.round(details.afterProfit))} VND</strong></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('priceCalculator.taskDescription')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('priceCalculator.taskDescriptionPlaceholder')}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ categoryId: '', name: '', unit: '', baseCost: 0, calculatedPrice: 0, description: '' });
                    setFormattedBaseCost('');
                    setError(null);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
                >
                  {t('priceCalculator.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <span>💾</span>
                  <span>{t('priceCalculator.saveTask')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 카테고리 추가 모달 */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-[400px] shadow-lg rounded-md bg-blue-50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {t('priceCalculator.addNewCategory')}
              </h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryFormData({ name: '', description: '' });
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('priceCalculator.categoryNameRequired')}
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('priceCalculator.categoryNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('priceCalculator.description')}
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('priceCalculator.categoryDescriptionPlaceholder')}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryFormData({ name: '', description: '' });
                    setError(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
                >
                  {t('priceCalculator.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 font-semibold shadow-md"
                >
                  <span>📁</span>
                  <span>{t('priceCalculator.addButton')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 카테고리 관리 팝업 모달 */}
      {showCategoryManagementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-8 border w-[700px] shadow-2xl rounded-xl bg-white animate-in">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">⚙️</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{t('priceCalculator.categoryManagement')}</h3>
                  <p className="text-sm text-gray-600">{t('priceCalculator.categoryManagementDescription')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryManagementModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* 새 카테고리 추가 버튼 */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowCategoryManagementModal(false);
                    setShowCategoryModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-semibold shadow-md"
                >
                  <span>➕</span>
                  <span>{t('priceCalculator.addNewCategoryButton')}</span>
                </button>
              </div>

              {/* 카테고리 목록 */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {categories.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {t('priceCalculator.noCategories')}
                  </div>
                ) : (
                  categories.map(category => (
                    <div key={category.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-600">{category.description || t('priceCalculator.noDescription')}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          {t('priceCalculator.tasks')}: {items.filter(item => item.categoryId === category.id).length}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setShowCategoryManagementModal(false);
                            handleEditCategory(category);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors font-medium shadow-sm"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors font-medium shadow-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCategoryManagementModal(false)}
                  className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all font-semibold shadow-sm"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 수정 팝업 모달 */}
      {showEditCategoryModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-8 border w-[500px] shadow-2xl rounded-xl bg-white animate-in">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">✏️</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">카테고리 수정</h3>
                  <p className="text-sm text-gray-600">"{editingCategory.name}" 카테고리를 수정합니다</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditCategoryModal(false);
                  setEditingCategory(null);
                  setEditCategoryFormData({ name: '', description: '' });
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <form onSubmit={handleEditCategorySubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리명 *
                </label>
                <input
                  type="text"
                  required
                  value={editCategoryFormData.name}
                  onChange={(e) => setEditCategoryFormData({ ...editCategoryFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="예: 난방 시스템"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={editCategoryFormData.description}
                  onChange={(e) => setEditCategoryFormData({ ...editCategoryFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="카테고리에 대한 설명을 입력하세요..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                    setEditCategoryFormData({ name: '', description: '' });
                    setError(null);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <span>✏️</span>
                  <span>수정 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 단가 수정 모달 */}
      {showPriceModal.show && showPriceModal.item && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-[500px] shadow-lg rounded-md bg-blue-50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                💰 단가 수정: {showPriceModal.item.name}
              </h3>
              <button
                onClick={() => {
                  setPriceModalData({ show: false, item: null });
                  setFormattedPriceBaseCost('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePriceSubmit} className="space-y-4">
              <div className="bg-gray-100 p-3 rounded-md">
                <div className="text-sm text-gray-600">
                  <div>작업명: <span className="font-medium">{showPriceModal.item.name}</span></div>
                  <div>현재 원가: <span className="font-medium text-red-600">{formatNumber(showPriceModal.item.baseCost || 0)} VND</span></div>
                  <div>현재 판매가: <span className="font-medium text-green-600">{formatNumber(showPriceModal.item.unitPrice)} VND</span></div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 원가 (기술자 비용) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formattedPriceBaseCost}
                    onChange={(e) => {
                      const formatted = formatInputValue(e.target.value);
                      setFormattedPriceBaseCost(formatted);
                      setPriceFormData({ ...priceFormData, baseCost: parseFormattedNumber(formatted) });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="850.000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계산된 새 판매 단가
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatNumber(priceFormData.calculatedPrice)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-green-700 font-bold"
                  />
                </div>
                {priceFormData.calculatedPrice > 0 && (
                  <div className="text-xs text-green-600 mt-2">
                    {formatNumber(priceFormData.calculatedPrice)} VND (자동 계산)
                  </div>
                )}
              </div>

              {/* 요율 설정 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="font-medium text-blue-800 mb-3">⚙️ 계산 요율 설정</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">PIT (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={priceCalculationRates.pitRate}
                      onChange={(e) => setPriceCalculationRates({...priceCalculationRates, pitRate: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">기업이윤 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={priceCalculationRates.profitRate}
                      onChange={(e) => setPriceCalculationRates({...priceCalculationRates, profitRate: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">부가세 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={priceCalculationRates.vatRate}
                      onChange={(e) => setPriceCalculationRates({...priceCalculationRates, vatRate: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {priceFormData.baseCost > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-sm text-yellow-800">
                    <div className="font-medium mb-2">💡 상세 계산 과정:</div>
                    {(() => {
                      const details = getCalculationDetails(priceFormData.baseCost, priceCalculationRates);
                      return (
                        <div className="space-y-1">
                          <div>1. 원가: <strong>{formatNumber(details.baseCost)} VND</strong></div>
                          <div className="ml-4 text-xs">+ PIT {details.pitRate}%: +{formatNumber(Math.round(details.pitAmount))} VND</div>
                          <div>2. PIT 적용 후: <strong>{formatNumber(Math.round(details.afterPIT))} VND</strong></div>
                          <div className="ml-4 text-xs">+ 기업이윤 {details.profitRate}%: +{formatNumber(Math.round(details.profitAmount))} VND</div>
                          <div>3. 기업이윤 적용 후: <strong>{formatNumber(Math.round(details.afterProfit))} VND</strong></div>
                          <div className="ml-4 text-xs">+ 부가세 {details.vatRate}%: +{formatNumber(Math.round(details.vatAmount))} VND</div>
                          <div className="border-t pt-1 mt-2">
                            <div>4. 최종 판매가 (부가세 포함): <strong className="text-green-600">{formatNumber(details.finalPrice)} VND</strong></div>
                            <div className="text-blue-600 mt-1">📋 견적서용 순단가 (부가세 제외): <strong>{formatNumber(Math.round(details.afterProfit))} VND</strong></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                  setPriceModalData({ show: false, item: null });
                  setFormattedPriceBaseCost('');
                }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <span>단가 업데이트</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceCalculator;