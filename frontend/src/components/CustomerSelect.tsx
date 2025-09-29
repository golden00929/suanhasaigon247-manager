import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Customer } from '../types';
import { customerAPI } from '../services/api';

interface CustomerSelectProps {
  value: string;
  onChange: (customerId: string) => void;
  required?: boolean;
}

const CustomerSelect: React.FC<CustomerSelectProps> = ({ value, onChange, required = false }) => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    // Find selected customer when value changes
    if (value && customers.length > 0) {
      const customer = customers.find(c => c.id.toString() === value);
      setSelectedCustomer(customer || null);
      if (customer) {
        setSearchTerm(customer.name);
      }
    } else {
      setSelectedCustomer(null);
      setSearchTerm('');
    }
  }, [value, customers]);

  useEffect(() => {
    // Filter customers based on search term
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers.slice(0, 20)); // Show first 20 customers
    } else {
      const filtered = customers.filter(customer => {
        const searchLower = searchTerm.toLowerCase();
        return (
          customer.name.toLowerCase().includes(searchLower) ||
          customer.phone?.toLowerCase().includes(searchLower) ||
          customer.email?.toLowerCase().includes(searchLower) ||
          (customer.customerType === 'business' && customer.companyName?.toLowerCase().includes(searchLower)) ||
          (customer.customerType === 'business' && customer.businessNumber?.toLowerCase().includes(searchLower))
        );
      });
      setFilteredCustomers(filtered.slice(0, 20));
    }
  }, [searchTerm, customers]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term to selected customer name if no selection was made
        if (selectedCustomer) {
          setSearchTerm(selectedCustomer.name);
        } else {
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedCustomer]);

  const transformCustomerData = (apiCustomer: any): Customer => {
    return {
      id: apiCustomer.id,
      name: apiCustomer.customerName || apiCustomer.name,
      phone: apiCustomer.phone,
      email: apiCustomer.email || '',
      address: apiCustomer.addresses?.[0]?.address || apiCustomer.address || '',
      customerType: apiCustomer.companyName ? 'business' : 'individual',
      companyName: apiCustomer.companyName,
      businessNumber: apiCustomer.businessNumber
    };
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getCustomers({ page: 1, limit: 1000 });
      if (response.success && response.data) {
        const transformedCustomers = response.data.items.map(transformCustomerData);
        setCustomers(transformedCustomers);
        setFilteredCustomers(transformedCustomers.slice(0, 20));
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      // Fallback to mock data if API fails
      const mockCustomers = [
        { id: 1, name: '김철수', phone: '010-1234-5678', address: '서울특별시 강남구 테헤란로 123', customerType: 'individual' as const, email: 'kim@example.com' },
        { id: 2, name: '이영희', phone: '010-9876-5432', address: '부산광역시 해운대구 해운대로 456', customerType: 'individual' as const, email: 'lee@example.com' },
        { id: 3, name: '박민수', phone: '010-5555-1234', address: '대구광역시 중구 동성로 789', customerType: 'individual' as const, email: 'park@example.com' },
        { id: 4, name: '최수정', phone: '010-7777-8888', address: '인천광역시 연수구 송도동 321', customerType: 'individual' as const, email: 'choi@example.com' }
      ];
      setCustomers(mockCustomers);
      setFilteredCustomers(mockCustomers);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);

    // Clear selection if user is typing
    if (selectedCustomer && newValue !== selectedCustomer.name) {
      setSelectedCustomer(null);
      onChange('');
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name);
    onChange(customer.id.toString());
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // Clear search term to show all customers when focusing
    if (!selectedCustomer) {
      setSearchTerm('');
    }
  };

  const refreshCustomers = async () => {
    await fetchCustomers();
  };

  const getCustomerDisplayText = (customer: Customer) => {
    if (customer.customerType === 'business') {
      return `${customer.companyName || customer.name} (${customer.businessNumber || ''}) - ${customer.phone}`;
    }
    return `${customer.name} (${t('customers.individual')}) - ${customer.phone}`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={t('quotations.selectCustomer')}
          required={required}
          style={{
            width: '100%',
            padding: '12px 40px 12px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '16px',
            outline: 'none',
            backgroundColor: 'white'
          }}
        />
        <div style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          gap: '4px',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={refreshCustomers}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              color: '#6b7280',
              padding: '2px'
            }}
            title={t('common.refresh')}
          >
            {loading ? '⟳' : '🔄'}
          </button>
          <span style={{
            fontSize: '12px',
            color: '#6b7280',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}>
            ▼
          </span>
        </div>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          {loading ? (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              {t('common.loading')}...
            </div>
          ) : filteredCustomers.length > 0 ? (
            <>
              {searchTerm && filteredCustomers.length < customers.length && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {filteredCustomers.length}개 고객 표시 (전체 {customers.length}개 중)
                </div>
              )}
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: selectedCustomer?.id === customer.id ? '#eff6ff' : 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = selectedCustomer?.id === customer.id ? '#eff6ff' : 'white';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '2px'
                      }}>
                        {customer.name}
                        {customer.customerType === 'business' && (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '10px',
                            backgroundColor: '#dbeafe',
                            color: '#1d4ed8',
                            padding: '2px 6px',
                            borderRadius: '10px'
                          }}>
                            {t('customers.business')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {customer.phone}
                        {customer.email && ` • ${customer.email}`}
                      </div>
                      {customer.customerType === 'business' && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {customer.companyName && `${customer.companyName} • `}
                          {customer.businessNumber}
                        </div>
                      )}
                      {customer.address && (
                        <div style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                          marginTop: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          📍 {customer.address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              {searchTerm ?
                `"${searchTerm}"에 대한 검색 결과가 없습니다.` :
                '등록된 고객이 없습니다.'
              }
            </div>
          )}
        </div>
      )}

      {/* Hidden input for form validation */}
      <input
        type="hidden"
        value={value}
        required={required}
      />
    </div>
  );
};

export default CustomerSelect;