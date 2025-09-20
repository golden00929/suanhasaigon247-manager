import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Quotation, Customer } from '../types';
import { quotationAPI, customerAPI } from '../services/api';
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
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    customerId: '',
    title: '',
    description: '',
    items: [{ name: '', quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    tax: 0,
    totalAmount: 0,
    status: 'draft' as const,
    validUntil: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockCustomers = [
        { id: 1, name: '김철수', phone: '010-1234-5678', address: '서울특별시 강남구 테헤란로 123' },
        { id: 2, name: '이영희', phone: '010-9876-5432', address: '부산광역시 해운대구 해운대로 456' },
        { id: 3, name: '박민수', phone: '010-5555-1234', address: '대구광역시 중구 동성로 789' },
        { id: 4, name: '최수정', phone: '010-7777-8888', address: '인천광역시 연수구 송도동 321' }
      ];

      const mockQuotations = [
        {
          id: 1,
          customerId: 1,
          customer: { id: 1, name: '김철수', phone: '010-1234-5678' },
          title: '화장실 수전 교체 작업',
          description: '기존 수전 제거 및 신규 수전 설치',
          items: [
            { name: '고급 수전', quantity: 1, unitPrice: 3500000, total: 3500000 },
            { name: '작업비', quantity: 1, unitPrice: 2000000, total: 2000000 }
          ],
          subtotal: 5500000,
          tax: 550000,
          totalAmount: 6050000,
          status: 'sent',
          createdAt: '2024-03-15T09:00:00Z',
          validUntil: '2024-03-30T23:59:59Z',
          notes: '오전 작업 선호'
        },
        {
          id: 2,
          customerId: 2,
          customer: { id: 2, name: '이영희', phone: '010-9876-5432' },
          title: '에어컨 청소 및 가스 충전',
          description: '벽걸이 에어컨 2대 청소 및 냉매 충전',
          items: [
            { name: '에어컨 청소', quantity: 2, unitPrice: 1200000, total: 2400000 },
            { name: '냉매 충전', quantity: 1, unitPrice: 2400000, total: 2400000 }
          ],
          subtotal: 4800000,
          tax: 480000,
          totalAmount: 5280000,
          status: 'accepted',
          createdAt: '2024-03-14T14:30:00Z',
          validUntil: '2024-03-28T23:59:59Z',
          notes: '신축 아파트'
        },
        {
          id: 3,
          customerId: 3,
          customer: { id: 3, name: '박민수', phone: '010-5555-1234' },
          title: '냉장고 컴프레서 수리',
          description: '상업용 냉장고 컴프레서 교체 작업',
          items: [
            { name: '컴프레서', quantity: 1, unitPrice: 10000000, total: 10000000 },
            { name: '교체 작업비', quantity: 1, unitPrice: 4000000, total: 4000000 }
          ],
          subtotal: 14000000,
          tax: 1400000,
          totalAmount: 15400000,
          status: 'draft',
          createdAt: '2024-03-13T11:15:00Z',
          validUntil: '2024-03-27T23:59:59Z',
          notes: '상업용 건물, 24시간 운영'
        },
        {
          id: 4,
          customerId: 4,
          customer: { id: 4, name: '최수정', phone: '010-7777-8888' },
          title: '가스레인지 점화장치 수리',
          description: '3구 가스레인지 점화장치 전체 교체',
          items: [
            { name: '점화장치 부품', quantity: 3, unitPrice: 600000, total: 1800000 },
            { name: '수리비', quantity: 1, unitPrice: 1400000, total: 1400000 }
          ],
          subtotal: 3200000,
          tax: 320000,
          totalAmount: 3520000,
          status: 'sent',
          createdAt: '2024-03-12T16:45:00Z',
          validUntil: '2024-03-26T23:59:59Z',
          notes: '오전 시간대 가능'
        }
      ];

      setCustomers(mockCustomers);
      setQuotations(mockQuotations);
    } catch (err) {
      setError(t('quotations.noQuotations'));
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.1; // 10% VAT
    const totalAmount = subtotal + tax;
    return { subtotal, tax, totalAmount };
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    const totals = calculateTotals(newItems);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 1, unitPrice: 0, total: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateTotals(newItems);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCustomer = customers.find(c => c.id === parseInt(formData.customerId));
      const quotationData = {
        ...formData,
        id: editingQuotation?.id || Date.now(),
        customerId: parseInt(formData.customerId),
        customer: selectedCustomer,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
        createdAt: editingQuotation?.createdAt || new Date().toISOString()
      };

      if (editingQuotation) {
        const updatedQuotations = quotations.map(q =>
          q.id === editingQuotation.id ? quotationData : q
        );
        setQuotations(updatedQuotations);
      } else {
        setQuotations([...quotations, quotationData]);
      }

      setShowModal(false);
      setEditingQuotation(null);
      resetForm();
    } catch (err) {
      setError(t('quotations.quotationAdded'));
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      title: '',
      description: '',
      items: [{ name: '', quantity: 1, unitPrice: 0, total: 0 }],
      subtotal: 0,
      tax: 0,
      totalAmount: 0,
      status: 'draft',
      validUntil: '',
      notes: ''
    });
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setFormData({
      customerId: quotation.customerId.toString(),
      title: quotation.title,
      description: quotation.description || '',
      items: quotation.items.length > 0 ? quotation.items : [{ name: '', quantity: 1, unitPrice: 0, total: 0 }],
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      totalAmount: quotation.totalAmount,
      status: quotation.status,
      validUntil: quotation.validUntil || '',
      notes: quotation.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('quotations.deleteConfirm'))) {
      try {
        const updatedQuotations = quotations.filter(q => q.id !== id);
        setQuotations(updatedQuotations);
      } catch (err) {
        setError(t('quotations.deleteError') || '견적서 삭제에 실패했습니다.');
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
    doc.text('QUOTATION', 105, 30, { align: 'center' });

    // ${t('quotations.quotationNumber')} 및 ${t('quotations.quotationDate')}
    doc.setFontSize(12);
    doc.text(`Quote No: QT-${quotation.id.toString().padStart(4, '0')}`, 20, 50);
    doc.text(`Date: ${formatDate(quotation.createdAt)}`, 20, 60);

    if (quotation.validUntil) {
      doc.text(`Valid Until: ${formatDate(quotation.validUntil)}`, 20, 70);
    }

    // ${t('quotations.customerInfo')}
    doc.setFontSize(14);
    doc.text('Customer Information:', 20, 90);
    doc.setFontSize(12);
    doc.text(`Customer: ${quotation.customer?.name || '-'}`, 20, 105);
    if (quotation.customer?.phone) {
      doc.text(`Phone: ${quotation.customer.phone}`, 20, 115);
    }
    if (quotation.customer?.customerType === 'business' && quotation.customer?.businessNumber) {
      doc.text(`Tax ID: ${quotation.customer.businessNumber}`, 20, 125);
      if (quotation.customer.companyName) {
        doc.text(`Company: ${quotation.customer.companyName}`, 20, 135);
      }
    }

    // ${t('quotations.itemTable')} - 수동으로 그리기
    doc.setFontSize(14);
    doc.text('Items:', 20, 155);

    doc.setFontSize(10);
    let yPosition = 170;

    // 테이블 헤더 배경
    doc.setFillColor(66, 139, 202);
    doc.rect(20, yPosition - 8, 170, 12, 'F');

    // 헤더 텍스트 (흰색)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 25, yPosition - 2);
    doc.text('Qty', 110, yPosition - 2);
    doc.text('Unit Price', 130, yPosition - 2);
    doc.text('Total', 170, yPosition - 2);

    // 텍스트 색상을 다시 검은색으로
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    yPosition += 15;

    // 테이블 본문
    quotation.items.forEach((item, index) => {
      // 배경색 (홀짝 구분)
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(20, yPosition - 8, 170, 12, 'F');
      }

      doc.text(item.name || '-', 25, yPosition - 2);
      doc.text(item.quantity.toString(), 110, yPosition - 2);
      doc.text(item.unitPrice.toLocaleString() + ' VND', 130, yPosition - 2);
      doc.text(item.total.toLocaleString() + ' VND', 170, yPosition - 2);

      yPosition += 12;
    });

    // 테이블 테두리
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, 162, 170, yPosition - 162);

    const finalY = yPosition + 20;

    // 합계 섹션
    doc.setFontSize(12);
    doc.text(`Subtotal: ${quotation.subtotal.toLocaleString()} VND`, 130, finalY);
    doc.text(`Tax (10%): ${quotation.tax.toLocaleString()} VND`, 130, finalY + 15);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${quotation.totalAmount.toLocaleString()} VND`, 130, finalY + 35);

    // 비고
    if (quotation.notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Notes:', 20, finalY + 50);

      // 긴 텍스트를 여러 줄로 분할
      const splitNotes = doc.splitTextToSize(quotation.notes, 170);
      doc.text(splitNotes, 20, finalY + 65);
    }

    // PDF 다운로드 (파일명도 영어로)
    doc.save(`Quotation_QT-${quotation.id.toString().padStart(4, '0')}.pdf`);
  };

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = quotation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      {quotation.id}
                    </div>
                    <div>
                      <div style={{fontSize: '16px', fontWeight: '600', color: '#1f2937'}}>{quotation.title}</div>
                      <div style={{fontSize: '12px', color: '#6b7280'}}>ID: #{quotation.id}</div>
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
                        {quotation.customer.phone}
                      </div>
                    </div>
                  ) : (
                    <span style={{color: '#9ca3af', fontStyle: 'italic'}}>-</span>
                  )}
                </td>
                <td style={{padding: '16px 20px', fontSize: '14px', color: '#374151', fontWeight: '600'}}>
                  {quotation.totalAmount.toLocaleString()}VND
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
                    {t(`quotations.statuses.${quotation.status}`)}
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
            padding: '32px',
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '90vh',
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
                    <select
                      required
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
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
                      <option value="">{t('quotations.selectCustomer')}</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.customerType === 'business' ?
                            `${customer.companyName || customer.name} - ${customer.businessNumber || ''}` :
                            t('customers.individual')}) - {customer.phone}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 80px',
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
                        gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 80px',
                        gap: '12px',
                        padding: '12px',
                        alignItems: 'center',
                        borderBottom: index < formData.items.length - 1 ? '1px solid #f3f4f6' : 'none',
                        backgroundColor: 'white'
                      }}>
                        <input
                          type="text"
                          placeholder={t('quotations.itemName')}
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        />
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
                          type="number"
                          placeholder="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
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
                          {item.total.toLocaleString()} VND
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
                          \u00d7
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
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px'}}>
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
                        {formData.subtotal.toLocaleString()}VND
                      </div>
                    </div>
                    <div>
                      <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px'}}>
                        {t('quotations.tax')} (10%)
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
                        {formData.tax.toLocaleString()}VND
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
                        {formData.totalAmount.toLocaleString()}VND
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
                        onClick={() => generatePDF(editingQuotation)}
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
                      type="submit"
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

