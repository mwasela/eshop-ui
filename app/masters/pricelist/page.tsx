"use client";
import React, { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, ModalForm, ProFormDigit, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space } from 'antd';
import axiosInstance from '@/helpers/axios';
import { error } from 'console';

// Types based on your JSON
interface PriceListItem {
  ID: number;
  product_id: number;
  costprice: number;
  wholsaleprice: number;
  retailprice: number;
  product: {
    name: string;
    sku: string;
    oem: string;
    category: { name: string };
  };
}

const PriceListManager: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<PriceListItem | null>(null);

  const columns: ProColumns<PriceListItem>[] = [
    {
      title: 'SKU / Part No',
      dataIndex: ['product', 'sku'],
      copyable: true,
    },
    {
      title: 'Product Name',
      dataIndex: ['product', 'name'],
    },
    {
      title: 'OEM Ref',
      dataIndex: ['product', 'oem'],
      search: false,
    },
    {
      title: 'Cost (KES)',
      dataIndex: 'costprice',
      //valueType: 'money',
      search: false,
    },
    {
      title: 'Wholesale (KES)',
      dataIndex: 'wholsaleprice',
      //valueType: 'money',
      search: false,
    },
    {
      title: 'Retail Price',
      dataIndex: 'retailprice',
      //valueType: 'money',
      search: false,
      render: (val) => <span style={{ color: val > 0 ? 'green' : 'red' }}>KES {val}</span>,
    },
     {
    },
    {
      title: 'Profit Margin',
      render: (_, record) => {
        const margin = record.retailprice - record.costprice;
        return <span style={{ color: margin > 0 ? 'green' : 'red' }}>KES {margin}</span>;
      },
      search: false,
    },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => [
        <Button key="edit" onClick={() => { setCurrentRow(record); setIsModalVisible(true); }}>
          <EditOutlined /> Edit
        </Button>,
        <Popconfirm 
          key="delete" 
          title="Delete this price record?" 
          onConfirm={async () => {
            await axiosInstance.delete(`/api/pricelists/${record.ID}`);
            actionRef.current?.reload();
            message.success('Deleted successfully');
          }}
        >
          <Button style={{ color: '#ff4d4f' }}><DeleteOutlined /></Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<PriceListItem>
        headerTitle="Master Price List"
        actionRef={actionRef}
        scroll={{x:'max-content'}}
        rowKey="ID"
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button key="button" icon={<PlusOutlined />} type="primary" onClick={() => { setCurrentRow(null); setIsModalVisible(true); }}>
            Add New Price
          </Button>,
        ]}
        // Replace with your actual API call
        request={async (params) => {
           const res = await axiosInstance.get('/api/pricelists', { params });
           return { data: res.data.price_list_items, success: true };
        }}
        columns={columns}
      />

      <ModalForm
        title={currentRow ? "Edit Price" : "New Price Entry"}
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        initialValues={currentRow || {}}
        onFinish={async (values) => {

          //post or PUT to API based on whether currentRow is null

          if (currentRow) {
            await axiosInstance.put(`/api/pricelists/${currentRow.ID}`, values);
          } else {
            await axiosInstance.post('/api/pricelists', values);
          }

          actionRef.current?.reload();
         
          message.success('Price list updated');
          return true;
        }}
      >
        <ProFormSelect
          name="product_id"
          label="Select Product"
          placeholder="Search by Part Number or Name"
          showSearch
          request={async () => {
            try {
              const request = await axiosInstance.get('/api/products');
              return request.data.products.map((product: any) => ({
                label: `${product.sku} - ${product.name}`,
                value: product.ID,
              }));
            } catch (error) {
              console.error('Error fetching products:', error);
              return [];
            }
          }}
          rules={[{ required: true, message: 'Please select a product' }]}
          />

          
        <Space size="large">
          <ProFormDigit name="costprice" label="Cost Price" width="sm" min={0} />
          <ProFormDigit name="wholsaleprice" label="Wholesale Price" width="sm" min={0} />
          <ProFormDigit name="retailprice" label="Retail Price" width="sm" min={0} />
        </Space>
      </ModalForm>
    </>
  );
};

export default PriceListManager;