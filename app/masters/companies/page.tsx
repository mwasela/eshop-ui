"use client";
import React, { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, BuildOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import axiosInstance from '@/helpers/axios';

interface CompanyItem {
  ID: number;
  company_name: string;
  address: string;
  email: string;
  phone: string;
  status: number;
  CreatedAt: string;
}

const CompanyManager: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<CompanyItem | null>(null);

  const columns: ProColumns<CompanyItem>[] = [
    {
      title: 'Company ID',
      dataIndex: 'ID',
      width: 100,
      search: false,
      hideInTable: true,
    },
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      render: (text) => <span><BuildOutlined style={{ marginRight: 8, color: '#1890ff' }} /> {text}</span>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      ellipsis: true,
      responsive: ['md'],
    },
    {
      title: 'Email',
      dataIndex: 'email',
      render: (text) => <span><Tag color="blue" style={{ marginRight: 8 }}>{text}</Tag></span>,
      responsive: ['lg'],
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      render: (text) => <span><Tag color="green" style={{ marginRight: 8 }}>{text}</Tag></span>,
      responsive: ['lg'],
    },
    {
      title: 'Created At',
      dataIndex: 'CreatedAt',
      valueType: 'dateTime',
      search: false,
      responsive: ['md'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      valueEnum: {
        1: { text: 'Active', status: 'Success' },
        2: { text: 'Inactive', status: 'Error' },
      },
      render: (_, record) => (
        record.status === 1 ? (
          <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: '12px', padding: '4px 8px' }}>
            Active
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: '12px', padding: '4px 8px' }}>
            Inactive
          </Tag>
        )
      ),
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 200,
      render: (_, record) => [
        <Button 
          key="edit" 
          type="primary" 
          size="small"
          icon={<EditOutlined />} 
          onClick={() => { setCurrentRow(record); setIsModalVisible(true); }}
        >
          Edit
        </Button>,
        <Popconfirm 
          key="delete" 
          title="Are you sure? This may affect other records linked to this company." 
          onConfirm={async () => {
            await axiosInstance.delete(`/api/companies/${record.ID}`);
            actionRef.current?.reload();
            message.success('Company removed');
          }}
        >
          <Button type="primary" danger size="small" icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <div style={{ padding: '0 8px' }}>
        <ProTable<CompanyItem>
          headerTitle="Companies"
          actionRef={actionRef}
          rowKey="ID"
          search={{ labelWidth: 'auto' }}
          toolBarRender={() => [
            <Button 
              key="button" 
              icon={<PlusOutlined />} 
              type="primary" 
              onClick={() => { setCurrentRow(null); setIsModalVisible(true); }}
            >
              Add Company
            </Button>,
          ]}
          request={async (params) => {
            const res = await axiosInstance.get('/api/companies', { params });
            return { data: res.data.companies, success: true };
          }}
          columns={columns}
          scroll={{ x: 600 }}
        />
      </div>

      <ModalForm
        title={currentRow ? "Edit Company" : "New Company"}
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        initialValues={currentRow ? {
          company_name: currentRow.company_name,
          address: currentRow.address,
          email: currentRow.email,
          phone: currentRow.phone,
          status: currentRow.status,
        } : {}}
        modalProps={{
          destroyOnClose: true,
          style: { maxWidth: '95vw' },
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await axiosInstance.put(`/api/companies/${currentRow.ID}`, values);
              message.success('Company updated');
            } else {
              await axiosInstance.post('/api/companies', values);
              message.success('Company created');
            }
            actionRef.current?.reload();
            return true;
          } catch (err) {
            message.error('Operation failed');
            return false;
          }
        }}
      >
        <ProFormText
          name="company_name"
          label="Company Name"
          placeholder="e.g. AutoSpares Ltd"
          rules={[{ required: true, message: 'Please enter a company name' }]}
        />
        <ProFormTextArea
          name="address"
          label="Address"
          placeholder="Street address, city, state, postal code"
          rules={[{ required: true, message: 'Please enter the address' }]}
        />
        <ProFormText
          name="email"
          label="Email"
          //type="email"
          placeholder="contact@company.com"
          rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
        />
        <ProFormText
          name="phone"
          label="Phone"
          placeholder="+1 (555) 123-4567"
          rules={[{ required: true, message: 'Please enter a phone number' }]}
        />
        {currentRow && (
          <ProFormSelect
            name="status"
            label="Status"
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 2 },
            ]}
            rules={[{ required: true }]}
          />
        )}
      </ModalForm>
    </>
  );
};

export default CompanyManager;
