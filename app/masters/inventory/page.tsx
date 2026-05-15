"use client";
import axiosInstance from "@/helpers/axios";
import React, { useRef, useState, useEffect } from "react";
import {
  ProCard,
  ProFormText,
  ProTable,
  ProFormSelect,
  ModalForm,
  PageContainer,
  ProFormDigit
} from "@ant-design/pro-components";
import { Button, Form, message } from "antd";
import moment from "moment";

export default function InventoryPage() {
  const tableRef = useRef<any>();
  const [form] = Form.useForm(); // This is the key to fixing initialValues
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  // Sync form values when editingRecord changes
  useEffect(() => {
    if (editingRecord) {
      // Flatten the nested product data so the form can read it
      form.setFieldsValue({
        ...editingRecord,
        oem: editingRecord.product?.oem,
        sku: editingRecord.product?.sku,
        category: editingRecord.product?.category?.name,
      });
    } else {
      form.resetFields();
    }
  }, [editingRecord, form]);

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleFinish = async (values: any) => {

    //console.log("Form values on submit:", values);

    try {
      let response;
      if (editingRecord) {
        response = await axiosInstance.put(`/api/inventory/${editingRecord.ID}`, values);
        if (response.status === 200 && response.data) {
          message.success("Inventory updated");
        } else {
          throw new Error(response.data?.message || "Failed to update inventory.");
        }
      } else {
        response = await axiosInstance.post(`/api/inventory`, values);
        if ((response.status === 200 || response.status === 201) && response.data) {
          message.success("Item added to inventory");
        } else {
          throw new Error(response.data?.message || "Failed to add inventory item.");
        }
      }
      setModalOpen(false);
      tableRef.current?.reload();
      return true;
    } catch (error: any) {
      // Extract error message from axios error
      let errMsg = "Operation failed";
      if (error.response && error.response.data && error.response.data.message) {
        errMsg = error.response.data.message;
      } else if (error.message) {
        errMsg = error.message;
      }
      console.error("Error saving inventory item:", error);
      message.error(errMsg);
      return false;
    }
  };

  return (
    <PageContainer
      header={{
        title: "Inventory Management",
      }}
    >
      <Button key="add" type="primary" onClick={handleAdd}>
        Add Inventory
      </Button>

      <ProTable
        actionRef={tableRef}
        rowKey="ID"
        //search={false}
        scroll={{ x: 'max-content' }}
        toolBarRender={() => [

        ]}
        columns={[
          { title: 'Product', search: true, dataIndex: ['product', 'name'] },
          { title: 'SKU', search: true, dataIndex: ['product', 'sku'] },
          { title: 'OEM', search: false, dataIndex: ['product', 'oem'] },
          { title: 'Threshold', search: false, dataIndex: 'threshold', valueType: 'digit' },
          { title: 'Bin Location', search: false, dataIndex: 'bin_location' },
          { title: 'Stock Balance', search: true, dataIndex: 'stock_quantity', valueType: 'digit' },
          {
            title: 'Created At',
            dataIndex: 'CreatedAt',
            render: (text: any) => moment(text).format('DD MMM YYYY')
          },
          {
            title: 'Actions',
            valueType: 'option',
            render: (_, record) => [
              <Button key="edit" onClick={() => handleEdit(record)}>
                Edit
              </Button>,
              <Button key="delete" danger onClick={async () => {
                await axiosInstance.delete(`/api/inventory/${record.ID}`);
                tableRef.current?.reload();
              }}>
                Delete
              </Button>,
            ],
          }
        ]}
        request={async (params) => {
          const res = await axiosInstance.get('/api/inventory', { params });
          return {
            data: res.data.inventory_items,
            success: true,
            total: res.data.total,
          };
        }}
      />

      <ModalForm
        title={editingRecord ? 'Edit Inventory Item' : 'New Inventory Item'}
        open={modalOpen}
        form={form} // Passes the form instance
        onOpenChange={setModalOpen}
        onFinish={async (values) => await handleFinish(values)}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => setEditingRecord(null),
        }}
      >
        <ProFormSelect
          name="product_id"
          label="Select Product"
          rules={[{ required: true }]}
          request={async () => {
            const res = await axiosInstance.get('/api/products');
            return res.data.products.map((p: any) => ({
              label: `${p.name} (${p.sku})`,
              value: p.ID,
            }));
          }}
        />

        {/* Fields for viewing/editing related product details
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProFormText name="oem" label="OEM" disabled={!!editingRecord} />
          <ProFormText name="sku" label="SKU" disabled={!!editingRecord} />
        </div> */}

        <ProFormText name="bin_location" label="Bin Location" rules={[{ required: true }]} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <ProFormDigit
            name="stock_quantity"
            label="Stock Quantity"
            min={0}
            rules={[{ required: true }]}
          />
          <ProFormDigit
            name="threshold"
            label="Low Stock Threshold"
            min={0}
          />
          <ProFormSelect
            name="store_id"
            label="Select Store"
            rules={[{ required: true }]}
            request={async () => {
              const res = await axiosInstance.get('/api/stores');
              return res.data.stores.map((s: any) => ({
                label: s.store_name,
                value: s.id,
              }));
            }}
          />
        </div>
      </ModalForm>
    </PageContainer>
  );
}