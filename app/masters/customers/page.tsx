"use client";
import React, { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { 
  ProTable, 
  ModalForm, 
  ProFormText, 
  ProFormSelect, 
  ProFormTextArea 
} from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import axiosInstance from '@/helpers/axios';

// Types based on your Customer JSON
interface CustomerItem {
  ID: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: number;
  CreatedAt: string;
}

const CustomerManager: React.FC = () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<CustomerItem | null>(null);

  const columns: ProColumns<CustomerItem>[] = [
    {
      title: 'Customer Name',
      dataIndex: 'name',
      copyable: true,
      render: (text) => <a><UserOutlined /> {text}</a>,
    },
    {
      title: 'Contact Details',
      search: false,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <small>{record.phone}</small>
          <small style={{ color: '#8c8c8c' }}>{record.email}</small>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      hideInTable: true, // Only show in search
    },
    {
      title: 'Address',
      dataIndex: 'address',
      search: false,
    },
    {
      title: 'Customer Type',
      dataIndex: 'type',
      valueEnum: {
        1: { text: 'Retail', status: 'Default' },
        2: { text: 'Wholesale / Mechanic', status: 'Success' },
      },
      render: (_, record) => (
        <Tag color={record.type === 2 ? 'blue' : 'geekblue'}>
          {record.type === 2 ? 'WHOLESALE' : 'RETAIL'}
        </Tag>
      ),
    },
    {
      title: 'Join Date',
      dataIndex: 'CreatedAt',
      valueType: 'date',
      search: false,
    },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => [
        <Button 
          key="edit" 
          type="primary"
          icon={<EditOutlined />} 
          onClick={() => { setCurrentRow(record); setIsModalVisible(true); }}
        >
          Edit
        </Button>,
        <Popconfirm 
          key="delete" 
          title="Delete customer?" 
          onConfirm={async () => {
            await axiosInstance.delete(`/api/customers/${record.ID}`);
            actionRef.current?.reload();
            message.success('Customer removed');
          }}
        >
          <Button type="primary" danger icon={<DeleteOutlined />} />
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<CustomerItem>
        headerTitle="Customer Database"
        actionRef={actionRef}
        scroll={{x: 'max-content'}}
        rowKey="ID"
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button 
            key="button" 
            icon={<PlusOutlined />} 
            type="primary" 
            onClick={() => { setCurrentRow(null); setIsModalVisible(true); }}
          >
            Register Customer
          </Button>,
        ]}
        request={async (params) => {
          const res = await axiosInstance.get('/api/customers', { params });
          return { data: res.data.customers, success: true };
        }}
        columns={columns}
      />

      <ModalForm
        title={currentRow ? "Update Customer Profile" : "New Customer Registration"}
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        // Matching the PascalCase in your POST payload vs camelCase in GET
        initialValues={currentRow ? {
          Name: currentRow.name,
          Email: currentRow.email,
          Phone: currentRow.phone,
          Address: currentRow.address,
          Type: currentRow.type,
        } : { Type: 1 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          if (currentRow) {
            await axiosInstance.put(`/api/customers/${currentRow.ID}`, values);
            message.success('Profile updated');
          } else {
            await axiosInstance.post('/api/customers', values);
            message.success('Customer registered');
          }
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText
          name="Name"
          label="Full Name"
          placeholder="e.g. Omar Mwinyi"
          rules={[{ required: true }]}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <ProFormText
            name="Phone"
            label="Phone Number"
            placeholder="+254..."
            rules={[{ required: true }]}
          />
          <ProFormText
            name="Email"
            label="Email Address"
            placeholder="example@mail.com"
          />
        </div>
        <ProFormSelect
          name="Type"
          label="Account Category"
          options={[
            { label: 'Retail (Standard)', value: 1 },
            { label: 'Wholesale / Mechanic', value: 2 },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormTextArea
          name="Address"
          label="Delivery/Physical Address"
          placeholder="Building, Street, Town"
        />
      </ModalForm>
    </>
  );
};

export default CustomerManager;