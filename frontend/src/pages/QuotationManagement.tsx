import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Quotation, Customer } from '../types';
import { quotationAPI, customerAPI, priceAPI } from '../services/api';
import jsPDF from 'jspdf';

const QuotationManagement: React.FC = () => {
  const { t } = useLanguage();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // 숫자를 천단위 점(.)으로 구분하여 포맷팅하는 함수
  const formatNumber = (num: number): string => {
    // 소수점 제거하고 정수로 변환 후 포맷팅
    const integerNum = Math.round(num || 0);
    return integerNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // 포맷된 문자열을 숫자로 변환하는 함수
  const parseFormattedNumber = (value: string): number => {
    return Number(value.replace(/\./g, '')) || 0;
  };
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [priceItems, setPriceItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedCustomerAddresses, setSelectedCustomerAddresses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    customerAddressId: '',
    title: '',
    description: '',
    items: [{ priceItemId: '', itemName: '', quantity: 1, unitPrice: 0, formattedUnitPrice: '', total: 0 }],
    subtotal: 0,
    tax: 0,
    totalAmount: 0,
    taxRate: 10, // 부가세율 (기본 10%)
    status: 'draft' as const,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🚀 견적 및 고객 데이터 로드 시작');

      // 실제 API 호출
      const [quotationsResponse, customersResponse, categoriesResponse, priceItemsResponse] = await Promise.all([
        quotationAPI.getQuotations(),
        customerAPI.getCustomers(),
        priceAPI.getCategories({ page: 1, limit: 100 }),
        priceAPI.getItems({ page: 1, limit: 500 })
      ]);

      console.log('📡 견적 API 응답:', quotationsResponse);
      console.log('📡 고객 API 응답:', customersResponse);

      if (quotationsResponse.success && quotationsResponse.data) {
        const quotations = quotationsResponse.data.quotations || quotationsResponse.data.items || quotationsResponse.data;
        console.log('✅ 견적 목록 로드 성공:', quotations.length, '개');
        setQuotations(Array.isArray(quotations) ? quotations : []);
      } else {
        console.log('⚠️ 견적 API에서 빈 응답 또는 오류');
        setQuotations([]);
      }

      if (customersResponse.success && customersResponse.data) {
        const customers = customersResponse.data.customers || customersResponse.data.items || customersResponse.data;
        console.log('✅ 고객 목록 로드 성공:', customers.length, '개');
        setCustomers(Array.isArray(customers) ? customers : []);
      } else {
        console.log('⚠️ 고객 API에서 빈 응답 또는 오류');
        setCustomers([]);
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        const categories = categoriesResponse.data.categories || categoriesResponse.data.items || categoriesResponse.data;
        console.log('✅ 카테고리 목록 로드 성공:', categories.length, '개');
        setCategories(Array.isArray(categories) ? categories : []);
      } else {
        console.log('⚠️ 카테고리 API에서 빈 응답 또는 오류');
        setCategories([]);
      }

      if (priceItemsResponse.success && priceItemsResponse.data) {
        const priceItems = priceItemsResponse.data.items || priceItemsResponse.data;
        console.log('✅ 가격 항목 로드 성공:', priceItems.length, '개');
        setPriceItems(Array.isArray(priceItems) ? priceItems : []);
      } else {
        console.log('⚠️ 가격 항목 API에서 빈 응답 또는 오류');
        setPriceItems([]);
      }

      console.log('🎉 데이터 로드 완료');
    } catch (err: any) {
      console.error('💥 견적/고객 데이터 로드 오류:', err);
      setError('견적 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: any[], taxRate: number = 10) => {
    // 개별 항목의 total 값을 사용하여 소계 계산 (이미 반올림된 값)
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

    // 부가세 계산 (소계 × 부가세율 ÷ 100)
    const tax = Math.round(subtotal * taxRate / 100);

    // 총액 = 소계 + 부가세
    const totalAmount = subtotal + tax;

    return { subtotal, tax, totalAmount };
  };

  // 고객 검색 필터링
  const filteredCustomers = customers.filter(customer => {
    const customerName = customer.customerName || customer.name || '';
    const companyName = customer.companyName || '';
    const phone = customer.phone || '';

    return customerName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
           companyName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
           phone.includes(customerSearchTerm);
  });

  // 고객 선택 핸들러
  const handleCustomerSelect = (customer: any) => {
    const customerName = customer.customerName || customer.name || '';
    const addresses = customer.addresses || [];

    setFormData({
      ...formData,
      customerId: customer.id.toString(),
      customerAddressId: addresses.length > 0 ? addresses[0].id : '' // Default to first address
    });
    setSelectedCustomerName(customerName);
    setCustomerSearchTerm(customerName);
    setSelectedCustomerAddresses(addresses);
    setShowCustomerDropdown(false);
  };

  // 단가계산기의 가격을 부가세 제외 금액으로 사용
  // 견적서에서는 이 가격을 공급가액으로 사용하고, 별도로 부가세를 계산함

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // 가격 항목을 선택했을 때 자동으로 단가와 항목명 설정
    if (field === 'priceItemId' && value) {
      if (value === 'custom') {
        // 사용자 정의 항목 선택
        console.log('✏️ 사용자 정의 항목 선택됨');
        newItems[index] = {
          ...newItems[index],
          priceItemId: 'custom',
          itemName: '',
          unitPrice: 0
        };
      } else {
        // 기존 가격 항목 선택 - 단가계산기의 가격을 부가세 제외 금액으로 사용
        const selectedPriceItem = priceItems.find(item => item.id === value);
        if (selectedPriceItem) {
          console.log('🏷️ 가격 항목 선택됨:', selectedPriceItem);
          newItems[index] = {
            ...newItems[index],
            priceItemId: value,
            itemName: selectedPriceItem.itemName,
            unitPrice: selectedPriceItem.unitPrice, // 단가계산기의 원래 가격 (부가세 제외)
            formattedUnitPrice: formatNumber(selectedPriceItem.unitPrice)
          };
        }
      }
    }

    // 단가 직접 입력 처리
    if (field === 'formattedUnitPrice') {
      // 포맷된 입력값 처리
      const formattedValue = value.replace(/[^\d.]/g, ''); // 숫자와 점만 허용
      const numericValue = parseFormattedNumber(formattedValue);
      newItems[index] = {
        ...newItems[index],
        formattedUnitPrice: formatNumber(numericValue),
        unitPrice: numericValue
      };
    }

    if (field === 'quantity' || field === 'unitPrice' || field === 'formattedUnitPrice') {
      newItems[index].total = Math.round(newItems[index].quantity * newItems[index].unitPrice);
    }

    const totals = calculateTotals(newItems, formData.taxRate);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { priceItemId: '', itemName: '', quantity: 1, unitPrice: 0, formattedUnitPrice: '', total: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateTotals(newItems, formData.taxRate);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== QUOTATION FORM SUBMIT ===');
    console.log('formData:', formData);
    try {
      // Validate required fields
      console.log('🔍 Validating customerId:', formData.customerId);
      console.log('🔍 customerId type:', typeof formData.customerId);
      console.log('🔍 customerId length:', formData.customerId?.length);

      if (!formData.customerId) {
        console.log('❌ Customer ID missing:', formData.customerId);
        setError('❌ 고객을 선택해 주세요.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      if (!formData.customerAddressId && selectedCustomerAddresses.length > 0) {
        console.log('❌ Customer Address ID missing:', formData.customerAddressId);
        setError('❌ 고객 주소를 선택해 주세요.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // customerId가 문자열인 경우 그대로 사용 (UUID 형태)
      let customerId = formData.customerId;

      // 숫자형 ID인 경우에만 parseInt 사용
      if (!isNaN(Number(formData.customerId))) {
        customerId = parseInt(formData.customerId);
        console.log('🔍 Parsed customerId as number:', customerId);
        if (isNaN(customerId)) {
          console.log('❌ Parse failed for customerId:', formData.customerId);
          setError('❌ 유효하지 않은 고객 ID입니다.');
          setTimeout(() => setError(''), 3000);
          return;
        }
      } else {
        console.log('🔍 Using customerId as string (UUID):', customerId);
      }

      const quotationData = {
        customerId: customerId,
        customerAddressId: formData.customerAddressId || null,
        description: formData.description,
        items: formData.items.map(item => ({
          categoryId: item.priceItemId || null,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        materialCost: 0,
        laborCost: 0,
        travelCost: 0,
        marginRate: 0,
        taxRate: formData.taxRate,
        status: formData.status,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
        notes: formData.notes
      };

      console.log('📤 Sending quotation data:', JSON.stringify(quotationData, null, 2));

      if (editingQuotation) {
        const response = await quotationAPI.updateQuotation(editingQuotation.id.toString(), quotationData);
        console.log('✅ Update response:', response);
        setSuccess('✅ 견적서가 성공적으로 수정되었습니다.');
      } else {
        const response = await quotationAPI.createQuotation(quotationData);
        console.log('✅ Create response:', response);
        setSuccess('✅ 견적서가 성공적으로 생성되었습니다.');
      }

      // 데이터 다시 로드
      await fetchData();

      setShowModal(false);
      setEditingQuotation(null);
      resetForm();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('❌ Quotation save error:', err);
      console.error('❌ Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.message || '견적서 저장 중 오류가 발생했습니다.';
      setError('❌ ' + errorMsg);
      setTimeout(() => setError(''), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerAddressId: '',
      title: '',
      description: '',
      items: [{ priceItemId: '', itemName: '', quantity: 1, unitPrice: 0, formattedUnitPrice: '', total: 0 }],
      subtotal: 0,
      tax: 0,
      totalAmount: 0,
      taxRate: 10, // 기본 10% 부가세
      status: 'draft',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: ''
    });
    setCustomerSearchTerm('');
    setSelectedCustomerName('');
    setShowCustomerDropdown(false);
  };

  const handleEdit = (quotation: Quotation) => {
    console.log('🔧 EDIT 시작 - 원본 견적서 데이터:', quotation);
    console.log('🔧 견적서 항목들:', quotation.items);
    console.log('🔧 부가세율:', quotation.taxRate);
    setEditingQuotation(quotation);

    // 선택된 고객 정보 복원
    const selectedCustomer = customers.find(c => c.id.toString() === quotation.customerId.toString());
    if (selectedCustomer) {
      const customerName = selectedCustomer.customerName || selectedCustomer.name || '';
      const addresses = selectedCustomer.addresses || [];

      console.log('🔧 고객 정보 복원:', customerName, addresses.length + '개 주소');
      setSelectedCustomerName(customerName);
      setCustomerSearchTerm(customerName);
      setSelectedCustomerAddresses(addresses);
    }

    const newFormData = {
      customerId: quotation.customerId.toString(),
      customerAddressId: quotation.customerAddressId || '',
      title: quotation.title,
      description: quotation.description || '',
      items: quotation.items.length > 0 ? quotation.items.map((item: any) => {
        console.log('🔧 항목 매핑:', item);
        const unitPrice = item.unitPrice || 0;
        const quantity = item.quantity || 1;
        const total = item.amount || (quantity * unitPrice);

        return {
          priceItemId: item.priceItemId || item.categoryId || '',
          itemName: item.itemName || '',
          quantity: quantity,
          unitPrice: unitPrice,
          formattedUnitPrice: formatNumber(unitPrice),
          total: total
        };
      }) : [{ priceItemId: '', itemName: '', quantity: 1, unitPrice: 0, formattedUnitPrice: '', total: 0 }],
      materialCost: quotation.materialCost || 0, // 재료비
      laborCost: quotation.laborCost || 0, // 인건비
      travelCost: quotation.travelCost || 0, // 출장비
      marginRate: quotation.marginRate || 15, // 마진율
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      totalAmount: quotation.total,
      taxRate: quotation.taxRate, // 저장된 값 그대로 사용
      status: quotation.status,
      validUntil: quotation.validUntil || '',
      notes: quotation.notes || ''
    };

    console.log('🔧 설정할 폼 데이터:', newFormData);
    console.log('🔧 매핑된 항목들:', newFormData.items);
    setFormData(newFormData);
    setShowModal(true);
  };

  const handleDelete = async (id: string | number) => {
    if (window.confirm(t('quotations.deleteConfirm'))) {
      try {
        console.log('🗑️ 견적 삭제 시작:', id);

        // API 호출로 실제 데이터베이스에서 삭제
        const response = await quotationAPI.deleteQuotation(id.toString());

        if (response.success) {
          console.log('✅ 견적 삭제 성공');

          // 로컬 상태 업데이트
          const updatedQuotations = quotations.filter(q => q.id.toString() !== id.toString());
          setQuotations(updatedQuotations);

          setSuccess('✅ 견적이 성공적으로 삭제되었습니다.');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          throw new Error(response.message || '삭제 실패');
        }
      } catch (err: any) {
        console.error('💥 견적 삭제 오류:', err);
        setError('❌ ' + (t('quotations.deleteError') || '견적서 삭제에 실패했습니다.'));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return { backgroundColor: '#f3f4f6', color: '#374151' };
      case 'sent': return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
      case 'accepted': return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'rejected': return { backgroundColor: '#fee2e2', color: '#dc2626' };
      default: return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const generatePDF = (quotation: Quotation) => {
    const doc = new jsPDF();

    // 기본 폰트 설정
    doc.setFont('helvetica');

    // 제목 (영어로 대체)
    doc.setFontSize(20);
    doc.text('QUOTATION', 105, 25, { align: 'center' });

    // 공급자 정보 (좌측)
    doc.setFontSize(14);
    doc.text('Supplier Information:', 20, 45);
    doc.setFontSize(12);
    doc.text('Suanha Saigon 247', 20, 58);
    doc.text('Home Maintenance & Repair Service', 20, 68);
    doc.text('Phone: +84 xxx-xxx-xxxx', 20, 78);
    doc.text('Email: contact@suanhasaigon247.com', 20, 88);

    // 견적 정보 (우측)
    doc.setFontSize(12);
    doc.text(`Quote No: ${quotation.quotationNumber || `QT-${quotation.id.toString().padStart(4, '0')}`}`, 120, 58);
    doc.text(`Date: ${formatDate(quotation.createdAt)}`, 120, 68);

    if (quotation.validUntil) {
      doc.text(`Valid Until: ${formatDate(quotation.validUntil)}`, 120, 78);
    }

    // ${t('quotations.customerInfo')}
    doc.setFontSize(14);
    doc.text('Customer Information:', 20, 105);
    doc.setFontSize(12);
    doc.text(`Customer: ${quotation.customer?.customerName || '-'}`, 20, 118);
    if (quotation.customer?.phone) {
      doc.text(`Phone: ${quotation.customer.phone}`, 20, 128);
    }
    if (quotation.customer?.customerType === 'business' && quotation.customer?.businessNumber) {
      doc.text(`Tax ID: ${quotation.customer.businessNumber}`, 20, 138);
      if (quotation.customer.companyName) {
        doc.text(`Company: ${quotation.customer.companyName}`, 20, 148);
      }
    }

    // ${t('quotations.itemTable')} - 수동으로 그리기
    doc.setFontSize(14);
    doc.text('Items:', 20, 165);

    doc.setFontSize(10);
    let yPosition = 180;

    // 테이블 헤더 배경
    doc.setFillColor(66, 139, 202);
    doc.rect(20, yPosition - 8, 170, 12, 'F');

    // 헤더 텍스트 (흰색)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 25, yPosition - 2);
    doc.text('Qty', 95, yPosition - 2);
    doc.text('Unit Price', 115, yPosition - 2);
    doc.text('Total', 160, yPosition - 2);

    // 텍스트 색상을 다시 검은색으로
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    yPosition += 15;

    // 테이블 본문
    quotation.items.forEach((item, index) => {
      // 빈 항목은 PDF에 표시하지 않음
      if (!item.itemName || item.itemName.trim() === '') {
        return;
      }

      // 배경색 (홀짝 구분)
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(20, yPosition - 8, 170, 12, 'F');
      }

      // 아이템명 길이 제한 (너무 길면 자르기)
      const itemName = item.itemName || '-';
      const maxItemNameLength = 20; // 최대 20자
      const displayItemName = itemName.length > maxItemNameLength ?
        itemName.substring(0, maxItemNameLength) + '...' : itemName;
      doc.text(displayItemName, 25, yPosition - 2);
      doc.text((item.quantity || 0).toString(), 95, yPosition - 2);
      doc.text(formatNumber(item.unitPrice || 0) + ' VND', 115, yPosition - 2);
      doc.text(formatNumber(item.amount || item.total || 0) + ' VND', 160, yPosition - 2);

      yPosition += 12;
    });

    // 테이블 테두리
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, 162, 170, yPosition - 162);

    const finalY = yPosition + 20;

    // 합계 섹션
    doc.setFontSize(12);
    doc.text(`Subtotal: ${formatNumber(quotation.subtotal || 0)} VND`, 115, finalY);
    doc.text(`Tax (${quotation.taxRate || 10}%): ${formatNumber(quotation.tax || 0)} VND`, 115, finalY + 15);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${formatNumber(quotation.total || 0)} VND`, 115, finalY + 35);

    // 비고
    let currentY = finalY + 50;
    if (quotation.notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Notes:', 20, currentY);

      // 긴 텍스트를 여러 줄로 분할
      const splitNotes = doc.splitTextToSize(quotation.notes, 170);
      doc.text(splitNotes, 20, currentY + 15);
      currentY += 15 + (splitNotes.length * 5);
    }

    // 안내사항 추가
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Important Information:', 20, currentY + 20);

    const guidelines = [
      '• Payment terms: 50% deposit required, balance due upon completion',
      '• Quotation validity: 30 days from issue date',
      '• Additional work beyond scope will be charged separately',
      '• Materials are guaranteed for 1 year, labor for 6 months',
      '• Prices include VAT and are in Vietnamese Dong (VND)'
    ];

    guidelines.forEach((guideline, index) => {
      doc.text(guideline, 25, currentY + 30 + (index * 8));
    });

    // PDF 다운로드 (파일명도 영어로)
    const fileName = quotation.quotationNumber ?
      `Quotation_${quotation.quotationNumber}.pdf` :
      `Quotation_QT-${quotation.id.toString().padStart(4, '0')}.pdf`;
    doc.save(fileName);
  };

  const generateCurrentPDF = () => {
    if (!editingQuotation) return;

    const doc = new jsPDF();

    // 기본 폰트 설정
    doc.setFont('helvetica');

    // 제목
    doc.setFontSize(20);
    doc.text('QUOTATION', 105, 25, { align: 'center' });

    // 공급자 정보 (좌측)
    doc.setFontSize(14);
    doc.text('Supplier Information:', 20, 45);
    doc.setFontSize(12);
    doc.text('Suanha Saigon 247', 20, 58);
    doc.text('Home Maintenance & Repair Service', 20, 68);
    doc.text('Phone: +84 xxx-xxx-xxxx', 20, 78);
    doc.text('Email: contact@suanhasaigon247.com', 20, 88);

    // 견적 정보 (우측)
    doc.setFontSize(12);
    doc.text(`Quote No: ${editingQuotation.quotationNumber || `QT-${editingQuotation.id.toString().padStart(4, '0')}`}`, 120, 58);
    doc.text(`Date: ${formatDate(editingQuotation.createdAt)}`, 120, 68);

    if (formData.validUntil) {
      doc.text(`Valid Until: ${formatDate(formData.validUntil)}`, 120, 78);
    }

    // 고객 정보 (현재 선택된 고객 정보 사용)
    const currentCustomer = customers.find(c => c.id.toString() === formData.customerId);
    doc.setFontSize(14);
    doc.text('Customer Information:', 20, 105);
    doc.setFontSize(12);
    doc.text(`Customer: ${currentCustomer?.customerName || '-'}`, 20, 118);
    if (currentCustomer?.phone) {
      doc.text(`Phone: ${currentCustomer.phone}`, 20, 128);
    }
    if (currentCustomer?.customerType === 'business' && currentCustomer?.businessNumber) {
      doc.text(`Tax ID: ${currentCustomer.businessNumber}`, 20, 138);
      if (currentCustomer.companyName) {
        doc.text(`Company: ${currentCustomer.companyName}`, 20, 148);
      }
    }

    // 항목 테이블
    doc.setFontSize(14);
    doc.text('Items:', 20, 165);

    doc.setFontSize(10);
    let yPosition = 180;

    // 테이블 헤더 배경
    doc.setFillColor(66, 139, 202);
    doc.rect(20, yPosition - 8, 170, 12, 'F');

    // 헤더 텍스트 (흰색)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 25, yPosition - 2);
    doc.text('Qty', 95, yPosition - 2);
    doc.text('Unit Price', 115, yPosition - 2);
    doc.text('Total', 160, yPosition - 2);

    // 텍스트 색상을 다시 검은색으로
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    yPosition += 15;

    // 현재 formData의 항목들 사용
    formData.items.forEach((item, index) => {
      // 빈 항목은 PDF에 표시하지 않음
      if (!item.itemName || item.itemName.trim() === '') {
        return;
      }

      // 배경색 (홀짝 구분)
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(20, yPosition - 8, 170, 12, 'F');
      }

      // 아이템명 길이 제한 (너무 길면 자르기)
      const itemName = item.itemName || '-';
      const maxItemNameLength = 20; // 최대 20자
      const displayItemName = itemName.length > maxItemNameLength ?
        itemName.substring(0, maxItemNameLength) + '...' : itemName;
      doc.text(displayItemName, 25, yPosition - 2);
      doc.text((item.quantity || 0).toString(), 95, yPosition - 2);
      doc.text(formatNumber(item.unitPrice || 0) + ' VND', 115, yPosition - 2);
      doc.text(formatNumber(item.total || 0) + ' VND', 160, yPosition - 2);

      yPosition += 12;
    });

    // 테이블 테두리
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, 162, 170, yPosition - 162);

    const finalY = yPosition + 20;

    // 합계 섹션 (현재 formData 값 사용)
    doc.setFontSize(12);
    doc.text(`Subtotal: ${formatNumber(formData.subtotal || 0)} VND`, 115, finalY);
    doc.text(`Tax (${formData.taxRate || 10}%): ${formatNumber(formData.tax || 0)} VND`, 115, finalY + 15);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${formatNumber(formData.totalAmount || 0)} VND`, 115, finalY + 35);

    // 비고
    let currentY = finalY + 50;
    if (formData.notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Notes:', 20, currentY);

      // 긴 텍스트를 여러 줄로 분할
      const splitNotes = doc.splitTextToSize(formData.notes, 170);
      doc.text(splitNotes, 20, currentY + 15);
      currentY += 15 + (splitNotes.length * 5);
    }

    // 안내사항 추가
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Important Information:', 20, currentY + 20);

    const guidelines = [
      '• Payment terms: 50% deposit required, balance due upon completion',
      '• Quotation validity: 30 days from issue date',
      '• Additional work beyond scope will be charged separately',
      '• Materials are guaranteed for 1 year, labor for 6 months',
      '• Prices include VAT and are in Vietnamese Dong (VND)'
    ];

    guidelines.forEach((guideline, index) => {
      doc.text(guideline, 25, currentY + 30 + (index * 8));
    });

    // PDF 다운로드
    const fileName = editingQuotation.quotationNumber ?
      `Quotation_${editingQuotation.quotationNumber}.pdf` :
      `Quotation_QT-${editingQuotation.id.toString().padStart(4, '0')}.pdf`;
    doc.save(fileName);
  };

  const filteredQuotations = quotations.filter(quotation => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (quotation.quotationNumber?.toLowerCase().includes(searchLower)) ||
      (quotation.customer?.customerName?.toLowerCase().includes(searchLower)) ||
      (quotation.customer?.companyName?.toLowerCase().includes(searchLower)) ||
      quotation.id.toString().includes(searchTerm) ||
      `#${quotation.id}`.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px'}}>
        <div style={{fontSize: '18px'}}>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div style={{padding: '24px'}}>
      {/* Header Section */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
        <div>
          <h1 style={{fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0}}>{t('quotations.title')}</h1>
          <p style={{fontSize: '16px', color: '#6b7280', marginTop: '4px'}}>{t('quotations.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
        >
          <span>+</span>
          {t('quotations.createNew')}
        </button>
      </div>

      {error && (
        <div style={{backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '16px', borderRadius: '8px', marginBottom: '24px'}}>
          {error}
        </div>
      )}

      {success && (
        <div style={{backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '16px', borderRadius: '8px', marginBottom: '24px'}}>
          {success}
        </div>
      )}

      {/* Search and Stats */}
      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px', marginBottom: '24px'}}>
        <div>
          <input
            type="text"
            placeholder={t('quotations.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              backgroundColor: 'white'
            }}
          >
            <option value="all">{t('quotations.allStatuses')}</option>
            <option value="draft">{t('quotations.statuses.draft')}</option>
            <option value="sent">{t('quotations.statuses.sent')}</option>
            <option value="accepted">{t('quotations.statuses.accepted')}</option>
            <option value="rejected">{t('quotations.statuses.rejected')}</option>
          </select>
        </div>
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{fontSize: '24px', fontWeight: '700', color: '#3b82f6'}}>{filteredQuotations.length}</div>
          <div style={{fontSize: '14px', color: '#6b7280'}}>{t('quotations.totalQuotations')}</div>
        </div>
      </div>

      {/* Quotation Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb'}}>
              <th style={{
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('quotations.title')}
              </th>
              <th style={{
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('quotations.customer')}
              </th>
              <th style={{
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('quotations.totalAmount')}
              </th>
              <th style={{
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('quotations.status')}
              </th>
              <th style={{
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('quotations.createdAt')}
              </th>
              <th style={{
                padding: '16px 20px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                width: '160px'
              }}>
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.map((quotation, index) => (
              <tr
                key={quotation.id}
                style={{
                  borderBottom: index < filteredQuotations.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td style={{padding: '16px 20px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {quotation.quotationNumber ?
                        quotation.quotationNumber.split('-').pop() || index + 1 :
                        index + 1
                      }
                    </div>
                    <div>
                      <div style={{fontSize: '16px', fontWeight: '600', color: '#1f2937'}}>{quotation.title}</div>
                      <div style={{fontSize: '12px', color: '#6b7280'}}>
                        {quotation.quotationNumber || `#${quotation.id}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{padding: '16px 20px', fontSize: '14px', color: '#374151'}}>
                  {quotation.customer ? (
                    <div>
                      <div style={{fontWeight: '600'}}>{quotation.customer.name}</div>
                      <div style={{fontSize: '12px', color: '#6b7280'}}>
                        {quotation.customer.customerType === 'business' ? (
                          <>
                            <span style={{backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '10px', fontSize: '10px'}}>
                              {t('customers.business')}
                            </span>
                            {quotation.customer.businessNumber && (
                              <span style={{marginLeft: '8px'}}>{quotation.customer.businessNumber}</span>
                            )}
                          </>
                        ) : (
                          <span style={{backgroundColor: '#f3f4f6', color: '#374151', padding: '2px 6px', borderRadius: '10px', fontSize: '10px'}}>
                            {t('customers.individual')}
                          </span>
                        )}
                      </div>
                      <div style={{fontSize: '12px', color: '#6b7280', marginTop: '2px'}}>
                        {quotation.customer.customerName || quotation.customer.name || quotation.customer.phone}
                      </div>
                    </div>
                  ) : (
                    <span style={{color: '#9ca3af', fontStyle: 'italic'}}>-</span>
                  )}
                </td>
                <td style={{padding: '16px 20px', fontSize: '14px', color: '#374151', fontWeight: '600'}}>
                  {formatNumber(quotation.total || 0)} VND
                </td>
                <td style={{padding: '16px 20px'}}>
                  <span style={{
                    display: 'inline-flex',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '20px',
                    ...getStatusColor(quotation.status)
                  }}>
                    {t(`quotations.statuses.${quotation.status.toLowerCase()}`)}
                  </span>
                </td>
                <td style={{padding: '16px 20px', fontSize: '14px', color: '#374151'}}>
                  {formatDate(quotation.createdAt)}
                </td>
                <td style={{padding: '16px 20px', textAlign: 'center'}}>
                  <div style={{display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap'}}>
                    <button
                      onClick={() => generatePDF(quotation)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#f0fdf4',
                        color: '#166534',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#166534';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                        e.currentTarget.style.color = '#166534';
                      }}
                      title="PDF 다운로드"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => handleEdit(quotation)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#0369a1';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#e0f2fe';
                        e.currentTarget.style.color = '#0369a1';
                      }}
                      title="편집"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(quotation.id)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                        e.currentTarget.style.color = '#dc2626';
                      }}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredQuotations.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{fontSize: '48px', marginBottom: '16px'}}>📄</div>
          <h3 style={{fontSize: '18px', color: '#374151', marginBottom: '8px'}}>{t('quotations.noQuotations')}</h3>
          <p style={{fontSize: '14px', color: '#6b7280'}}>{t('quotations.addNewMessage')}</p>
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setEditingQuotation(null);
              resetForm();
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '95vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => {
                setShowModal(false);
                setEditingQuotation(null);
                resetForm();
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#6b7280',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}
            >
              ×
            </button>

            <div>
              <h3 style={{fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '24px'}}>
                {editingQuotation ? t('quotations.editQuotation') : t('quotations.createNew')}
              </h3>
              <form onSubmit={handleSubmit}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                      {t('quotations.customer')} *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        required
                        value={customerSearchTerm}
                        onChange={(e) => {
                          setCustomerSearchTerm(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder={t('quotations.selectCustomer')}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none',
                          backgroundColor: 'white'
                        }}
                      />
                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderTop: 'none',
                          borderRadius: '0 0 8px 8px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}>
                          {filteredCustomers.map(customer => (
                            <div
                              key={customer.id}
                              onClick={() => handleCustomerSelect(customer)}
                              style={{
                                padding: '12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f3f4f6',
                                fontSize: '14px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                              }}
                            >
                              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                                {customer.customerName || customer.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {customer.customerType === 'business'
                                  ? `${customer.companyName || ''} - ${customer.businessNumber || ''}`.trim().replace(/^-\s*$/, '')
                                  : t('customers.individual')
                                } - {customer.phone || '전화번호 없음'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Address Selection */}
                  {selectedCustomerAddresses.length > 0 && (
                    <div>
                      <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                        고객 주소 *
                      </label>
                      <select
                        required
                        value={formData.customerAddressId}
                        onChange={(e) => setFormData({ ...formData, customerAddressId: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">주소를 선택하세요</option>
                        {selectedCustomerAddresses.map(address => (
                          <option key={address.id} value={address.id}>
                            {address.name} - {address.address}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                      {t('quotations.title')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                    {t('quotations.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{marginBottom: '20px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                    <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151'}}>
                      {t('quotations.items')}
                    </label>
                    <button
                      type="button"
                      onClick={addItem}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>+</span>
                      {t('quotations.addItem')}
                    </button>
                  </div>

                  {/* Item Headers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1fr 2fr 2fr 60px',
                    gap: '12px',
                    marginBottom: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    <div>{t('quotations.itemName')}</div>
                    <div>{t('quotations.quantity')}</div>
                    <div>{t('quotations.unitPrice')}</div>
                    <div>{t('quotations.subtotal')}</div>
                    <div></div>
                  </div>

                  {/* Items */}
                  <div style={{border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden'}}>
                    {formData.items.map((item, index) => (
                      <div key={index} style={{
                        display: 'grid',
                        gridTemplateColumns: '3fr 1fr 2fr 2fr 60px',
                        gap: '12px',
                        padding: '12px',
                        alignItems: 'center',
                        borderBottom: index < formData.items.length - 1 ? '1px solid #f3f4f6' : 'none',
                        backgroundColor: 'white'
                      }}>
                        <div>
                          <select
                            value={item.priceItemId || ''}
                            onChange={(e) => handleItemChange(index, 'priceItemId', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              outline: 'none',
                              backgroundColor: 'white'
                            }}
                          >
                            <option value="">항목 선택 (단가계산기에서)</option>
                            {priceItems.map(priceItem => (
                              <option key={priceItem.id} value={priceItem.id}>
                                {priceItem.itemName} - {formatNumber(priceItem.unitPrice)}VND/{priceItem.unit}
                              </option>
                            ))}
                            <option value="custom">사용자 정의 항목</option>
                          </select>
                          {item.priceItemId === 'custom' && (
                            <input
                              type="text"
                              placeholder="항목명 입력"
                              value={item.itemName}
                              onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                marginTop: '8px'
                              }}
                            />
                          )}
                        </div>
                        <input
                          type="number"
                          placeholder="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none',
                            textAlign: 'center'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="0"
                          value={item.formattedUnitPrice || formatNumber(item.unitPrice || 0)}
                          onChange={(e) => handleItemChange(index, 'formattedUnitPrice', e.target.value)}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none',
                            textAlign: 'right'
                          }}
                        />
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          textAlign: 'right',
                          color: '#374151'
                        }}>
                          {formatNumber(item.total)} VND
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          style={{
                            padding: '6px',
                            backgroundColor: formData.items.length === 1 ? '#f3f4f6' : '#fef2f2',
                            color: formData.items.length === 1 ? '#9ca3af' : '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: formData.items.length === 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Section */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px'}}>
{t('quotations.quotationSummary')}
                  </h4>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px'}}>
                    <div>
                      <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px'}}>
                        {t('quotations.subtotal')}
                      </label>
                      <div style={{
                        padding: '12px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textAlign: 'right',
                        color: '#374151'
                      }}>
                        {formatNumber(formData.subtotal)} VND
                      </div>
                    </div>
                    <div>
                      <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px'}}>
                        부가세율 (%)
                      </label>
                      <input
                        type="number"
                        value={formData.taxRate}
                        onChange={(e) => {
                          const newTaxRate = parseFloat(e.target.value) || 0;
                          const totals = calculateTotals(formData.items, newTaxRate);
                          setFormData({ ...formData, taxRate: newTaxRate, ...totals });
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '16px',
                          fontWeight: '600',
                          textAlign: 'center',
                          color: '#374151',
                          outline: 'none'
                        }}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px'}}>
                        {t('quotations.tax')} ({formData.taxRate}%)
                      </label>
                      <div style={{
                        padding: '12px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textAlign: 'right',
                        color: '#dc2626'
                      }}>
                        {formatNumber(formData.tax)} VND
                      </div>
                    </div>
                    <div>
                      <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px'}}>
                        {t('quotations.totalAmount')}
                      </label>
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#3b82f6',
                        border: '1px solid #3b82f6',
                        borderRadius: '6px',
                        fontSize: '18px',
                        fontWeight: '700',
                        textAlign: 'right',
                        color: 'white'
                      }}>
                        {formatNumber(formData.totalAmount || 0)} VND
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                      {t('quotations.status')}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="draft">{t('quotations.statuses.draft')}</option>
                      <option value="sent">{t('quotations.statuses.sent')}</option>
                      <option value="accepted">{t('quotations.statuses.accepted')}</option>
                      <option value="rejected">{t('quotations.statuses.rejected')}</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                      {t('quotations.validUntil')}
                    </label>
                    <input
                      type="text"
                      value={formData.validUntil ? formatDate(formData.validUntil) : ''}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

                        // Format as dd/mm/yyyy while typing
                        if (value.length >= 2) {
                          value = value.substring(0, 2) + '/' + value.substring(2);
                        }
                        if (value.length >= 5) {
                          value = value.substring(0, 5) + '/' + value.substring(5, 9);
                        }

                        // Update display value
                        e.target.value = value;

                        // Convert complete dd/mm/yyyy to yyyy-mm-dd for internal storage
                        if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                          const [day, month, year] = value.split('/');
                          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                          setFormData({ ...formData, validUntil: isoDate });
                        } else if (value === '') {
                          setFormData({ ...formData, validUntil: '' });
                        }
                      }}
                      placeholder="dd/mm/yyyy"
                      pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                    {t('quotations.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    placeholder="추가 설명이나 특별 사항..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px'}}>
                  <div>
                    {editingQuotation && (
                      <button
                        type="button"
                        onClick={() => generateCurrentPDF()}
                        style={{
                          padding: '12px 20px',
                          backgroundColor: '#f0fdf4',
                          color: '#166534',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        📄 PDF 다운로드
                      </button>
                    )}
                  </div>
                  <div style={{display: 'flex', gap: '12px'}}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingQuotation(null);
                        resetForm();
                      }}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        console.log('💾 Save button clicked');
                        e.preventDefault();
                        handleSubmit(e);
                      }}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {t('common.save')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationManagement;

