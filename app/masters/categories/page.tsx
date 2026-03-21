"use client";
import React, { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOpenOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import axiosInstance from '@/helpers/axios';

interface CategoryItem {
  ID: number;
  name: string;
  description: string;
  CreatedAt: string;
}

const CategoryManager: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<CategoryItem | null>(null);

  const columns: ProColumns<CategoryItem>[] = [
    {
      title: 'Category ID',
      dataIndex: 'ID',
      width: 100,
      search: false,
    },
    {
      title: 'Category Name',
      dataIndex: 'name',
      render: (text) => <span><FolderOpenOutlined style={{ marginRight: 8, color: '#faad14' }} /> {text}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: 'Created At',
      dataIndex: 'CreatedAt',
      valueType: 'dateTime',
      search: false,
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
          icon={<EditOutlined />} 
          onClick={() => { setCurrentRow(record); setIsModalVisible(true); }}
        >
          Edit
        </Button>,
        <Popconfirm 
          key="delete" 
          title="Are you sure? This may affect products linked to this category." 
          onConfirm={async () => {
            await axiosInstance.delete(`/api/categories/${record.ID}`);
            actionRef.current?.reload();
            message.success('Category removed');
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
      <ProTable<CategoryItem>
        headerTitle="Product Categories"
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
            Add Category
          </Button>,
        ]}
        request={async (params) => {
          const res = await axiosInstance.get('/api/categories', { params });
          return { data: res.data.categories, success: true };
        }}
        columns={columns}
      />

      <ModalForm
        title={currentRow ? "Edit Category" : "New Category"}
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        // Mapping lowercase GET fields to PascalCase POST fields...
        initialValues={currentRow ? {
          Name: currentRow.name,
          Description: currentRow.description,
        } : {}}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await axiosInstance.put(`/api/categories/${currentRow.ID}`, values);
              message.success('Category updated');
            } else {
              await axiosInstance.post('/api/categories', values);
              message.success('Category created');
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
          name="Name"
          label="Category Name"
          placeholder="e.g. Engine Parts, Brake Systems"
          rules={[{ required: true, message: 'Please enter a category name' }]}
        />
        <ProFormTextArea
          name="Description"
          label="Category Description"
          placeholder="Briefly describe what parts belong here"
          rules={[{ required: true }]}
        />
        {currentRow && (
          <ProFormSelect
            name="Status"
            label="status"
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

export default CategoryManager;