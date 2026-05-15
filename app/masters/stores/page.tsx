"use client";
import React, { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import axiosInstance from '@/helpers/axios';

interface StoreItem {
  ID: number;
  store_name: string;
  location_id: number;
  location: {
    location_name: string;
  };
  area: string;
  company_id: number;
  company: {
    company_name: string;
  };
  storetype_id: number;
  storetype: {
    storetype_name: string;
  };
  status: number;
  CreatedAt: string;
}

const StoreManager: React.FC = () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<StoreItem | null>(null);

  const columns: ProColumns<StoreItem>[] = [
    {
      title: 'Store ID',
      dataIndex: 'ID',
      width: 100,
      search: false,
      hideInTable: true,
    },
    {
      title: 'Store Name',
      dataIndex: 'store_name',
      render: (text) => <span><ShopOutlined style={{ marginRight: 8, color: '#1890ff' }} /> {text}</span>,
    },
    {
      title: 'Location',
      dataIndex: ['location', 'location_name'],
      responsive: ['md'],
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Area',
      dataIndex: 'area',
      responsive: ['lg'],
    },
    {
      title: 'Company',
      dataIndex: ['company', 'company_name'],
      responsive: ['lg'],
      render: (text) => <Tag color="cyan">{text}</Tag>,
    },
    {
      title: 'Store Type',
      dataIndex: ['storetype', 'storetype_name'],
      responsive: ['md'],
      render: (text) => <Tag color="green">{text}</Tag>,
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
          title="Are you sure? This may affect store operations." 
          onConfirm={async () => {
            try {
              await axiosInstance.delete(`/api/stores/${record.ID}`);
              actionRef.current?.reload();
              message.success('Store removed');
            } catch (err) {
              message.error('Failed to delete store');
            }
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
        <ProTable<StoreItem>
          headerTitle="Stores"
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
              Add Store
            </Button>,
          ]}
          request={async (params) => {
            try {
              const res = await axiosInstance.get('/api/stores', { params });
              return { data: res.data.stores, success: true };
            } catch (err) {
              message.error('Failed to load stores');
              return { data: [], success: false };
            }
          }}
          columns={columns}
          scroll={{ x: 600 }}
        />
      </div>

      <ModalForm
        title={currentRow ? "Edit Store" : "New Store"}
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        initialValues={currentRow ? {
          store_name: currentRow.store_name,
          location_id: currentRow.location.location_name,
          area: currentRow.area,
          company_id: currentRow.company.company_name,
          storetype_id: currentRow.storetype.storetype_name,
          status: currentRow.status,
        } : {}}
        modalProps={{
          destroyOnClose: true,
          style: { maxWidth: '95vw' },
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await axiosInstance.put(`/api/stores/${currentRow.ID}`, values);
              message.success('Store updated');
            } else {
              await axiosInstance.post('/api/stores', values);
              message.success('Store created');
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
          name="store_name"
          label="Store Name"
          placeholder="e.g. Nairobi Main Branch, CBD Store"
          rules={[{ required: true, message: 'Please enter a store name' }]}
        />
        <ProFormSelect
          name="location_id"
          label="Location"
          placeholder="Select a location"
          request={async () => {
            try {
              const res = await axiosInstance.get('/api/locations');
              return res.data.locations.map((location: any) => ({
                label: location.location_name,
                value: location.ID,
              }));
            } catch (err) {
              message.error('Failed to load locations');
              return [];
            }
          }}
          rules={[{ required: true, message: 'Please select a location' }]}
        />
        <ProFormText
          name="area"
          label="Area / District"
          placeholder="e.g. CBD, Industrial Area, Residential"
          rules={[{ required: true, message: 'Please enter an area' }]}
        />
        <ProFormSelect
          name="company_id"
          label="Company"
          placeholder="Select a company"
          request={async () => {
            try {
              const res = await axiosInstance.get('/api/companies');
              return res.data.companies.map((company: any) => ({
                label: company.company_name,
                value: company.ID,
              }));
            } catch (err) {
              message.error('Failed to load companies');
              return [];
            }
          }}
          rules={[{ required: true, message: 'Please select a company' }]}
        />
        <ProFormSelect
          name="store_type_id"
          label="Store Type"
          placeholder="Select a store type"
          request={async () => {
            try {
              const res = await axiosInstance.get('/api/storetypes');
              return res.data.storetypes.map((storetype: any) => ({
                label: storetype.storetype_name,
                value: storetype.ID,
              }));
            } catch (err) {
              message.error('Failed to load store types');
              return [];
            }
          }}
          rules={[{ required: true, message: 'Please select a store type' }]}
        />
        {currentRow && (
          <ProFormSelect
            name="status"
            label="Status"
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ]}
            rules={[{ required: true }]}
          />
        )}
      </ModalForm>
    </>
  );
};

export default StoreManager;
