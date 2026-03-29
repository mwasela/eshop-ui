'use client';

import React, { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import axiosInstance from '@/helpers/axios';

interface UserItem {
  ID: number;
  username: string;
  email: string;
  phone: string;
  type: number;
  CreatedAt: string;
}

const UserManager: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<UserItem | null>(null);

  const columns: ProColumns<UserItem>[] = [
    {
      title: 'User ID',
      dataIndex: 'ID',
      width: 80,
      search: false,
    },
    {
      title: 'User Name',
      dataIndex: 'username',
      render: (text) => <span><UserOutlined style={{ marginRight: 8, color: '#1890ff' }} /> {text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      responsive: ['md'],
    },
    {
      title: 'Created At',
      dataIndex: 'CreatedAt',
      valueType: 'dateTime',
      search: false,
      responsive: ['md'],
    },
    {
      title: 'Type',
      dataIndex: 'type',
      valueEnum: {
        0: { text: 'Site Admin', status: 'Success' },
        1: { text: 'Company Admin', status: 'Processing' },
        2: { text: 'Store Manager', status: 'Warning' },
        3: { text: 'Customer', status: 'Default' },
      },
      render: (_, record) => {
        const typeMap: Record<number, { text: string; status: string }> = {
          0: { text: 'Site Admin', status: 'Success' },
          1: { text: 'Company Admin', status: 'Processing' },
          2: { text: 'Store Manager', status: 'Warning' },
          3: { text: 'Customer', status: 'Default' },
        };
        const type = typeMap[record.type] || { text: 'Unknown', status: 'Default' };
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong>{type.text}</strong>
            <small style={{ color: '#8c8c8c' }}>{type.status}</small>
          </div>
        );
      },
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
          title="Are you sure? This may affect other records linked to this user."
          onConfirm={async () => {
            await axiosInstance.delete(`/api/users/${record.ID}`);
            actionRef.current?.reload();
            message.success('User removed');
          }}
        >
          <Button type="primary" danger icon={<DeleteOutlined />} size="small">
            Delete
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<UserItem>
        headerTitle="User Management"
        actionRef={actionRef}
        rowKey="ID"
        scroll={{x:'max-content'}}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button
            key="button"
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => { setCurrentRow(null); setIsModalVisible(true); }}
          >
            Add User
          </Button>,
        ]}
        request={async (params) => {
          const res = await axiosInstance.get('/api/users', { params });
          return { data: res.data.users || res.data.data || [], success: true };
        }}
        columns={columns}
      />

      <ModalForm
        title={currentRow ? "Edit User" : "New User"}
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        initialValues={currentRow ? {
          username: currentRow.username,
          email: currentRow.email,
          phone: currentRow.phone,
          type: currentRow.type,
        } : { type: 1 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          //console.log('Form values:', values);
          try {
            if (currentRow) {
              await axiosInstance.put(`/api/users/${currentRow.ID}`, values);
              //console.log('User updated:', values);
              message.success('User updated');
            } else {
              await axiosInstance.post('/api/users', values);
                //console.log('User created:', values);
              message.success('User created');
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
          name="username"
          label="User Name"
          placeholder="Enter full name"
          rules={[{ required: true, message: 'Please enter user name' }]}
        />
        <ProFormText
          name="email"
          label="Email"
          placeholder="Enter email address"
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Invalid email format' },
          ]}
        />
        {!currentRow && (
          <ProFormText.Password
            name="password"
            label="Password"
            placeholder="Enter password"
            rules={[{ required: true, message: 'Please enter password' }]}
          />
        )}
        <ProFormText
          name="phone"
          label="Phone"
          placeholder="Enter phone number"
        />
        <ProFormSelect
          name="type"
          label="Type"
          options={[
            { label: 'Site Admin', value: 0 },
            { label: 'Company Admin', value: 1 },
            { label: 'Store Manager', value: 2 },
            { label: 'Customer', value: 3 },
          ]}
          rules={[{ required: true }]}
        />
      </ModalForm>
    </>
  );
};

export default UserManager;
    