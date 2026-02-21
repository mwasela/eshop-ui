"use client";
import React, { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { 
  ProTable, 
  ModalForm, 
  ProFormDigit, 
  ProFormSelect, 
  ProFormDependency 
} from '@ant-design/pro-components';
import { Button, message, Popconfirm, Form } from 'antd';
import axiosInstance from '@/helpers/axios';

interface OrderItem {
  ID: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    name: string;
    sku: string;
  };
}

const OrderItemsManager: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<OrderItem | null>(null);
  const [form] = Form.useForm();

  const columns: ProColumns<OrderItem>[] = [
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      render: (text) => <a>#{text}</a>,
    },
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <small style={{ color: '#8c8c8c' }}>{record.product?.sku}</small>
        </div>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      search: false,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      valueType: 'money',
      search: false,
    },
    {
      title: 'Total Price',
      dataIndex: 'total_price',
      valueType: 'money',
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
          onClick={() => { 
            setCurrentRow(record); 
            setIsModalVisible(true); 
          }}
        >
          Edit
        </Button>,
        <Popconfirm 
          key="delete" 
          title="Remove this item from the order?" 
          onConfirm={async () => {
            await axiosInstance.delete(`/api/orderitems/${record.ID}`);
            actionRef.current?.reload();
            message.success('Item removed');
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
      <ProTable<OrderItem>
        headerTitle="Sales Order Items"
        actionRef={actionRef}
        rowKey="ID"
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button 
            key="button" 
            icon={<PlusOutlined />} 
            type="primary" 
            onClick={() => { 
              setCurrentRow(null); 
              setIsModalVisible(true); 
            }}
          >
            Add Item to Order
          </Button>,
        ]}
        request={async (params) => {
          const res = await axiosInstance.get('/api/orderitems', { params });
          return { data: res.data.order_items, success: true };
        }}
        columns={columns}
      />

      <ModalForm
        title={currentRow ? "Edit Order Item" : "Add Item to Order"}
        open={isModalVisible}
        form={form}
        onOpenChange={setIsModalVisible}
        initialValues={currentRow || {}}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          if (currentRow) {
            await axiosInstance.put(`/api/orderitems/${currentRow.ID}`, values);
          } else {
            await axiosInstance.post('/api/orderitems', values);
          }
          actionRef.current?.reload();
          message.success('Order item saved');
          return true;
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <ProFormDigit 
            name="order_id" 
            label="Order Reference #" 
            rules={[{ required: true }]} 
            placeholder="Enter Order ID"
          />
          <ProFormSelect
            name="product_id"
            label="Product"
            showSearch
            request={async () => {
              const res = await axiosInstance.get('/api/products');
              return res.data.products.map((p: any) => ({
                label: `${p.sku} - ${p.name}`,
                value: p.ID,
              }));
            }}
            rules={[{ required: true }]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <ProFormDigit 
            name="quantity" 
            label="Quantity" 
            min={1} 
            rules={[{ required: true }]} 
          />
          <ProFormDigit 
            name="unit_price" 
            label="Unit Price" 
            min={0} 
            rules={[{ required: true }]} 
          />
          
          {/* Automatically calculate Total Price */}
          <ProFormDependency name={['quantity', 'unit_price']}>
            {({ quantity, unit_price }) => {
              const total = (quantity || 0) * (unit_price || 0);
              return (
                <ProFormDigit
                  name="total_price"
                  label="Total Price"
                  readonly
                  initialValue={total}
                  fieldProps={{ value: total }}
                />
              );
            }}
          </ProFormDependency>
        </div>
      </ModalForm>
    </>
  );
};

export default OrderItemsManager;