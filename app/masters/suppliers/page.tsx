"use client";
import React, { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, ModalForm, ProFormText } from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import axiosInstance from '@/helpers/axios';

interface SupplierItem {
  ID: number;
  supplier_name: string;
  location: string;
  contact: string;
  CreatedAt: string;
}

const SupplierManager: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<SupplierItem | null>(null);

  const columns: ProColumns<SupplierItem>[] = [
    {
      title: 'Supplier Name',
      dataIndex: 'supplier_name',
      copyable: true,
      render: (text) => <span><ShopOutlined /> {text}</span>,
    },
    {
      title: 'Location / Hub',
      dataIndex: 'location',
    },
    {
      title: 'Contact Info',
      dataIndex: 'contact',
    },
    {
      title: 'Date Added',
      dataIndex: 'CreatedAt',
      valueType: 'date',
      search: false,
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 200,
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
          title="Are you sure you want to delete this supplier?" 
          onConfirm={async () => {
            await axiosInstance.delete(`/api/suppliers/${record.ID}`);
            actionRef.current?.reload();
            message.success('Supplier deleted');
          }}
        >
          <Button type="primary" danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<SupplierItem>
        headerTitle="Supplier Directory"
        actionRef={actionRef}
        scroll={{ x: 'max-content' }}
        rowKey="ID"
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button 
            key="button" 
            icon={<PlusOutlined />} 
            type="primary" 
            onClick={() => { setCurrentRow(null); setIsModalVisible(true); }}
          >
            Add New Supplier
          </Button>,
        ]}
        request={async (params) => {
          const res = await axiosInstance.get('/api/suppliers', { params });
          return { data: res.data.suppliers, success: true };
        }}
        columns={columns}
      />

      <ModalForm
        title={currentRow ? "Edit Supplier Info" : "Register New Supplier"}
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        initialValues={currentRow || {}}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await axiosInstance.put(`/api/suppliers/${currentRow.ID}`, values);
              message.success('Supplier updated successfully');
            } else {
              await axiosInstance.post('/api/suppliers', values);
              message.success('New supplier added');
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
          name="supplier_name"
          label="Business Name"
          placeholder="e.g. Njoroge Traders"
          rules={[{ required: true }]}
        />
        <ProFormText
          name="location"
          label="Physical Location"
          placeholder="e.g. River road Nrb"
          rules={[{ required: true }]}
        />
        <ProFormText
          name="contact"
          label="Contact Person & Number"
          placeholder="e.g. Njoroge - 0722..."
          rules={[{ required: true }]}
        />
      </ModalForm>
    </>
  );
};

export default SupplierManager;