"use client";
import React, { useRef, useState } from 'react';
import { Form } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import axiosInstance from '@/helpers/axios';

interface LocationItem {
  ID: number;
  location_name: string; // Matches the dataIndex in your table
  country: string;
  status: number;
  CreatedAt: string;
}

const LocationManager: React.FC = () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<LocationItem | null>(null);
  const [form] = Form.useForm();

  // Region options
  const regions = [
    { label: 'Africa', value: 'Africa' },
    { label: 'Americas', value: 'Americas' },
    { label: 'Asia', value: 'Asia' },
    { label: 'Europe', value: 'Europe' },
    { label: 'Oceania', value: 'Oceania' },
  ];

  // Logic to fetch countries based on the region parameter
  const fetchCountriesByRegion = async (region: string) => {
    if (!region) return [];
    try {
      const cacheKey = `countries_${region}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);

      const res = await fetch(`https://restcountries.com/v3.1/region/${region}?fields=name`);
      if (!res.ok) throw new Error('Network response was not ok');
      
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      const sorted = data
        .map((country: any) => ({
          label: country.name.common,
          value: country.name.common,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      localStorage.setItem(cacheKey, JSON.stringify(sorted));
      return sorted;
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      return [];
    }
  };

  const columns: ProColumns<LocationItem>[] = [
    {
      title: 'Location ID',
      dataIndex: 'ID',
      width: 80,
      search: false,
      hideInTable: true,
    },
    {
      title: 'Location Name',
      dataIndex: 'location_name',
      render: (text) => (
        <span>
          <EnvironmentOutlined style={{ marginRight: 8, color: '#f5222d' }} /> 
          {text}
        </span>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'location_country',
      responsive: ['md'],
      render: (text) => <Tag color="volcano">{text as string}</Tag>,
    },
    {
      title: 'Created At',
      dataIndex: 'CreatedAt',
      valueType: 'dateTime',
      search: false,
      responsive: ['md'],
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <Button 
          key="edit" 
          type="primary" 
          size="small"
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
          title="Delete this location?" 
          onConfirm={async () => {
            try {
              await axiosInstance.delete(`/api/locations/${record.ID}`);
              actionRef.current?.reload();
              message.success('Location removed');
            } catch (err) {
              message.error('Failed to delete location');
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
        <ProTable<LocationItem>
          headerTitle="Locations"
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
              Add Location
            </Button>,
          ]}
          request={async (params) => {
            try {
              const res = await axiosInstance.get('/api/locations', { params });
              return { data: res.data.locations, success: true };
            } catch (err) {
              message.error('Failed to load locations');
              return { data: [], success: false };
            }
          }}
          columns={columns}
          scroll={{ x: 'max-content' }}
        />
      </div>

      <ModalForm
        form={form}
        title={currentRow ? "Edit Location" : "New Location"}
        open={isModalVisible}
        width={{ xs: '90vw', sm: '66vw', md: '50vw' }}
        onOpenChange={(visible) => {
          if (!visible) {
            form.resetFields();
            setCurrentRow(null);
          }
          setIsModalVisible(visible);
        }}
        style={{
            //make modal 2/3 of current screen
            maxWidth: '50vw',
        }}
        // Maps the table's "location_name" to the form's field "location_name"
        initialValues={currentRow ? { ...currentRow } : { status: 1 }}
        onValuesChange={(changedValues) => {
          // Reset country field if the region is changed to prevent cross-region errors
          if (changedValues.region) {
            form.setFieldsValue({ country: undefined });
          }
        }}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await axiosInstance.put(`/api/locations/${currentRow.ID}`, values);
              message.success('Location updated');
            } else {
              await axiosInstance.post('/api/locations', values);
              message.success('Location created');
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
          name="location_name"
          label="Location Name"
          placeholder="e.g. Nairobi Warehouse"
          rules={[{ required: true, message: 'Required' }]}
        />
        
        <ProFormSelect
          name="region"
          label="Region"
          options={regions}
          rules={[{ required: true, message: 'Please select a region' }]}
        />

        <ProFormSelect
          name="location_country"
          label="Country"
          dependencies={['region']}
          // request in ProFormSelect automatically receives watched dependencies in params
          request={async (params) => {
            if (!params.region) return [];
            return await fetchCountriesByRegion(params.region);
          }}
          fieldProps={{
            showSearch: true,
            optionFilterProp: "label",
          }}
          placeholder="Select a region first"
          rules={[{ required: true, message: 'Please select a country' }]}
        />

        {/* <ProFormSelect
          name="status"
          label="Status"
          options={[
            { label: 'Active', value: 1 },
            { label: 'Inactive', value: 2 },
          ]}
          rules={[{ required: true }]}
        /> */}
      </ModalForm>
    </>
  );
};

export default LocationManager;