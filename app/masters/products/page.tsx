"use client";
import React, { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, BoxPlotOutlined } from '@ant-design/icons';
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

interface ProductItem {
  ID: number;
  name: string;
  sku: string;
  oem: string;
  description: string;
  category_id: number;
  category: {
    name: string;
  };
}

const ProductManager: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<ProductItem | null>(null);

  const columns: ProColumns<ProductItem>[] = [
    {
      title: 'SKU / Internal Code',
      dataIndex: 'sku',
      copyable: true,
      render: (text) => <b style={{ color: '#1890ff' }}>{text}</b>,
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
    },
    {
      title: 'OEM Reference',
      dataIndex: 'oem',
    },
    {
      title: 'Category',
      dataIndex: ['category', 'name'],
      render: (_, record) => (
        <Tag color="blue">{record.category?.name || 'Uncategorized'}</Tag>
      ),
      // Search by category ID via select
      renderFormItem: () => {
        return <ProFormSelect 
          request={async () => {
            const res = await axiosInstance.get('/api/categories');
            return res.data.categories.map((c: any) => ({ label: c.name, value: c.ID }));
          }}
        />
      }
    },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
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
          title="Permanently delete this product?" 
          onConfirm={async () => {
            await axiosInstance.delete(`/api/products/${record.ID}`);
            actionRef.current?.reload();
            message.success('Product deleted');
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
      <ProTable<ProductItem>
        headerTitle="Product Catalog"
        actionRef={actionRef}
        scroll={{ x: 'max-content'}}
        rowKey="ID"
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button 
            key="button" 
            icon={<PlusOutlined />} 
            type="primary" 
            onClick={() => { setCurrentRow(null); setIsModalVisible(true); }}
          >
            Create Product
          </Button>,
        ]}
        request={async (params) => {
          const res = await axiosInstance.get('/api/products', { params });
          return { data: res.data.products, success: true };
        }}
        columns={columns}
      />

      <ModalForm
        title={currentRow ? "Edit Product Details" : "New Product Entry"}
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        initialValues={currentRow || {}}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          if (currentRow) {
            await axiosInstance.put(`/api/products/${currentRow.ID}`, values);
            message.success('Product updated');
          } else {
            await axiosInstance.post('/api/products', values);
            message.success('Product created successfully');
          }
          actionRef.current?.reload();
          return true;
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <ProFormText
            name="name"
            label="Product Name"
            placeholder="e.g. Spark Plug - Haojin"
            rules={[{ required: true }]}
          />
          <ProFormSelect
            name="category_id"
            label="Category"
            request={async () => {
              const res = await axiosInstance.get('/api/categories');
              return res.data.categories.map((c: any) => ({
                label: c.name,
                value: c.ID,
              }));
            }}
            rules={[{ required: true }]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <ProFormText
            name="sku"
            label="Internal SKU"
            placeholder="WE-MC-XXX"
            rules={[{ required: true }]}
          />
          <ProFormText
            name="oem"
            label="OEM Part Number"
            placeholder="Manufacturer Code"
          />
        </div>

        <ProFormTextArea
          name="description"
          label="Detailed Description"
          placeholder="Specifications, size, material, etc."
        />
      </ModalForm>
    </>
  );
};

export default ProductManager;