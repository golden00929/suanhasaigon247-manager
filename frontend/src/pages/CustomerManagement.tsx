import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useActivityLog } from '../contexts/ActivityLogContext';
import { Customer } from '../types';

const CustomerManagement: React.FC = () => {
  const { t } = useLanguage();
  const { addLog } = useActivityLog();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    repairHistory: '',
    customerType: 'individual' as 'individual' | 'business',
    businessNumber: '',
    companyName: '',
    representative: '',
    businessAddress: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      addLog('페이지 접속', '고객 관리 페이지에 접속했습니다.', '고객 관리', 'customer');
      // Mock data for demonstration
      const mockCustomers: Customer[] = [
        {
          id: '1',
          customerName: '김철수',
          name: '김철수',
          companyName: '김철수',
          phone: '010-1234-5678',
          address: '서울특별시 강남구 테헤란로 123',
          notes: '정기 고객, VIP 등급',
          repairHistory: '2024.01.15 - 화장실 수전 교체\n2023.11.20 - 싱크대 배수관 청소\n2023.09.10 - 보일러 점검 및 필터 교체',
          customerType: 'individual',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          addresses: []
        },
        {
          id: '2',
          customerName: '이영희',
          name: '이영희',
          companyName: '이영희',
          phone: '010-9876-5432',
          address: '부산광역시 해운대구 해운대로 456',
          notes: '신축 아파트, 정리정돈 깔끔함',
          repairHistory: '2024.02.03 - 에어컨 청소 및 가스 충전\n2023.12.18 - 세탁기 급수호스 교체',
          customerType: 'individual',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          addresses: []
        },
        {
          id: '3',
          customerName: '박민수',
          name: '박민수',
          companyName: '박민수 전기상사',
          phone: '010-5555-1234',
          address: '대구광역시 중구 동성로 789',
          notes: '상업용 건물, 24시간 운영',
          repairHistory: '2024.01.28 - 냉장고 컴프레서 수리\n2023.10.15 - 전기 콘센트 10개 교체\n2023.08.22 - 환풍기 모터 교체',
          customerType: 'business',
          businessNumber: '123-45-67890',
          representative: '박민수',
          businessAddress: '대구광역시 중구 동성로 789',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          addresses: []
        },
        {
          id: '4',
          customerName: '최수정',
          name: '최수정',
          companyName: '수정가스서비스',
          phone: '010-7777-8888',
          address: '인천광역시 연수구 송도동 321',
          notes: '빠른 서비스 선호, 오전 시간대 가능',
          repairHistory: '2024.02.10 - 가스레인지 점화장치 수리\n2024.01.05 - 샤워기 헤드 교체',
          customerType: 'business',
          businessNumber: '456-78-90123',
          representative: '최수정',
          businessAddress: '인천광역시 연수구 송도동 321',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          addresses: []
        }
      ];
      setCustomers(mockCustomers);
    } catch (err) {
      setError('고객 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        // Update existing customer
        const updatedCustomers = customers.map(customer =>
          customer.id === editingCustomer.id
            ? { ...customer, ...formData }
            : customer
        );
        setCustomers(updatedCustomers);
      } else {
        // Add new customer
        const newCustomer = {
          id: Date.now(),
          ...formData
        };
        setCustomers([...customers, newCustomer]);
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', address: '', notes: '', repairHistory: '', customerType: 'individual', businessNumber: '', companyName: '', representative: '', businessAddress: '' });
    } catch (err) {
      setError(t('customers.saveError'));
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
      repairHistory: customer.repairHistory || '',
      customerType: customer.customerType || 'individual',
      businessNumber: customer.businessNumber || '',
      companyName: customer.companyName || '',
      representative: customer.representative || '',
      businessAddress: customer.businessAddress || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('customers.deleteConfirm'))) {
      try {
        const updatedCustomers = customers.filter(customer => customer.id !== id);
        setCustomers(updatedCustomers);
      } catch (err) {
        setError(t('customers.deleteError'));
      }
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.repairHistory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.id.toString().includes(searchTerm) ||
    `#${customer.id}`.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{padding: '24px'}}>
      {/* Header Section */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
        <div>
          <h1 style={{fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0}}>{t('customers.title')}</h1>
          <p style={{fontSize: '16px', color: '#6b7280', marginTop: '4px'}}>{t('customers.subtitle')}</p>
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
          {t('customers.addNew')}
        </button>
      </div>

      {error && (
        <div style={{backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '16px', borderRadius: '8px', marginBottom: '24px'}}>
          {error}
        </div>
      )}

      {/* Search and Stats */}
      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px'}}>
        <div>
          <input
            type="text"
            placeholder={t('customers.searchPlaceholder')}
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
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{fontSize: '24px', fontWeight: '700', color: '#3b82f6'}}>{filteredCustomers.length}</div>
          <div style={{fontSize: '14px', color: '#6b7280'}}>{t('customers.totalCustomers')}</div>
        </div>
      </div>

      {/* Customer Table */}
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
                {t('customers.name')}
              </th>
              <th style={{
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('customers.phone')}
              </th>
              <th style={{
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('customers.customerType')}
              </th>
              <th style={{
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('customers.repairHistory')}
              </th>
              <th style={{
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('customers.address')}
              </th>
              <th style={{
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('customers.notes')}
              </th>
              <th style={{
                padding: '16px 20px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                width: '140px'
              }}>
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer, index) => (
              <tr
                key={customer.id}
                style={{
                  borderBottom: index < filteredCustomers.length - 1 ? '1px solid #f3f4f6' : 'none',
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
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{fontSize: '16px', fontWeight: '600', color: '#1f2937'}}>{customer.name}</div>
                      <div style={{fontSize: '12px', color: '#6b7280'}}>ID: #{customer.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{padding: '16px 20px', fontSize: '14px', color: '#374151'}}>
                  {customer.phone || (
                    <span style={{color: '#9ca3af', fontStyle: 'italic'}}>{t('customers.noPhone')}</span>
                  )}
                </td>
                <td style={{padding: '16px 20px', fontSize: '14px', color: '#374151'}}>
                  <span style={{
                    display: 'inline-flex',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '20px',
                    backgroundColor: customer.customerType === 'business' ? '#dbeafe' : '#f3f4f6',
                    color: customer.customerType === 'business' ? '#1d4ed8' : '#374151'
                  }}>
                    {t(`customers.${customer.customerType}`)}
                  </span>
                  {customer.customerType === 'business' && customer.businessNumber && (
                    <div style={{fontSize: '11px', color: '#6b7280', marginTop: '2px'}}>
                      {customer.businessNumber}
                    </div>
                  )}
                </td>
                <td style={{padding: '16px 20px', fontSize: '14px', color: '#374151', maxWidth: '250px'}}>
                  {customer.repairHistory ? (
                    <div style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={customer.repairHistory}>
                      {customer.repairHistory.split('\n')[0]}
                      {customer.repairHistory.split('\n').length > 1 && '...'}
                    </div>
                  ) : (
                    <span style={{color: '#9ca3af', fontStyle: 'italic'}}>{t('customers.noRepairHistory')}</span>
                  )}
                </td>
                <td style={{padding: '16px 20px', fontSize: '14px', color: '#374151', maxWidth: '200px'}}>
                  <div style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }} title={customer.address}>
                    {customer.address || (
                      <span style={{color: '#9ca3af', fontStyle: 'italic'}}>{t('customers.noAddress')}</span>
                    )}
                  </div>
                </td>
                <td style={{padding: '16px 20px', fontSize: '14px', color: '#374151', maxWidth: '200px'}}>
                  {customer.notes ? (
                    <div style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={customer.notes}>
                      {customer.notes}
                    </div>
                  ) : (
                    <span style={{color: '#9ca3af', fontStyle: 'italic'}}>-</span>
                  )}
                </td>
                <td style={{padding: '16px 20px', textAlign: 'center'}}>
                  <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                    <button
                      onClick={() => handleEdit(customer)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
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
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
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
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCustomers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{fontSize: '48px', marginBottom: '16px'}}>👥</div>
          <h3 style={{fontSize: '18px', color: '#374151', marginBottom: '8px'}}>{t('customers.noCustomers')}</h3>
          <p style={{fontSize: '14px', color: '#6b7280'}}>{t('customers.addNewMessage')}</p>
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
              setEditingCustomer(null);
              setFormData({ name: '', phone: '', address: '', notes: '', repairHistory: '', customerType: 'individual', businessNumber: '', companyName: '', representative: '', businessAddress: '' });
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '500px',
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
                setEditingCustomer(null);
                setFormData({ name: '', phone: '', address: '', notes: '', repairHistory: '', customerType: 'individual', businessNumber: '', companyName: '', representative: '', businessAddress: '' });
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
                {editingCustomer ? t('customers.editCustomer') : t('customers.addNew')}
              </h3>
              <form onSubmit={handleSubmit}>
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                    {t('customers.name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                      {t('customers.phone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  <div>
                    <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                      {t('customers.customerType')} *
                    </label>
                    <select
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value as 'individual' | 'business' })}
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
                      <option value="individual">{t('customers.individual')}</option>
                      <option value="business">{t('customers.business')}</option>
                    </select>
                  </div>
                </div>
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                    {t('customers.repairHistory')}
                  </label>
                  <textarea
                    value={formData.repairHistory}
                    onChange={(e) => setFormData({ ...formData, repairHistory: e.target.value })}
                    rows={4}
                    placeholder="예: 2024.03.15 - 화장실 수전 교체"
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

                {/* Business Information Section */}
                {formData.customerType === 'business' && (
                  <div style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px'}}>
                      {t('customers.businessInfo')}
                    </h4>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                      <div>
                        <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                          {t('customers.businessNumber')}
                        </label>
                        <input
                          type="text"
                          value={formData.businessNumber}
                          onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                          placeholder="123-45-67890"
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
                      <div>
                        <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                          {t('customers.companyName')}
                        </label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
                    <div style={{marginBottom: '16px'}}>
                      <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                        {t('customers.representative')}
                      </label>
                      <input
                        type="text"
                        value={formData.representative}
                        onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
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
                    <div>
                      <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                        {t('customers.businessAddress')}
                      </label>
                      <textarea
                        value={formData.businessAddress}
                        onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                        rows={2}
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
                  </div>
                )}

                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                    {t('customers.address')}
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                    {t('customers.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
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
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCustomer(null);
                      setFormData({ name: '', phone: '', address: '', notes: '', repairHistory: '', customerType: 'individual', businessNumber: '', companyName: '', representative: '', businessAddress: '' });
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
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;

