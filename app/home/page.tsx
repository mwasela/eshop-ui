"use client";
import axiosInstance from "@/helpers/axios";
import React, { useMemo } from "react";
import { ProCard, ProTable, StatisticCard } from "@ant-design/pro-components";
import { Button, Tag, Space, Typography, Progress, Badge, Avatar } from "antd";
import { PageContainer } from "@ant-design/pro-components";
import { 
  ShoppingCartOutlined, 
  WarningOutlined, 
  StockOutlined, 
  UserOutlined, 
  ArrowUpOutlined,
  PlusOutlined,
  HistoryOutlined
} from "@ant-design/icons";

const { Text, Title } = Typography;

export default function HomePage() {
  const [data, setData] = React.useState({
    products: [], inventory: [], orders: [], categories: [], suppliers: [], customers: []
  });

  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodRes, invRes, ordRes, catRes, supRes, custRes] = await Promise.all([
          axiosInstance.get("/api/products"),
          axiosInstance.get("/api/inventory"),
          axiosInstance.get("/api/orderitems"),
          axiosInstance.get("/api/categories"),
          axiosInstance.get("/api/suppliers"),
          axiosInstance.get("/api/customers"),
        ]);
        setData({
          products: prodRes.data.products || [],
          inventory: invRes.data.inventory || [],
          orders: ordRes.data.order_items || [],
          categories: catRes.data.categories || [],
          suppliers: supRes.data.suppliers || [],
          customers: custRes.data.customers || []
        });
      } catch (error) { console.error(error); }
    };
    fetchAll();
  }, []);

  const metrics = useMemo(() => {
    const totalSales = data.orders.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const lowStock = data.inventory.filter(item => item.stock_on_hand <= item.min_stock_level);
    return { totalSales, lowStock };
  }, [data]);

  return (
    <PageContainer 
      subTitle="Real-time performance metrics for your spares shop"
      extra={[
        <Button key="2" icon={<HistoryOutlined />}>Audit Logs</Button>,
        <Button key="1" type="primary" icon={<PlusOutlined />}>New Sale</Button>,
      ]}
    >
      
      {/* SECTION 1: HIGH-IMPACT KPIS */}
      <StatisticCard.Group direction={'row'} gutter={16}>
        <StatisticCard
          statistic={{
            title: 'Gross Revenue',
            value: metrics.totalSales,
            suffix: 'KES',
            icon: <Avatar style={{ backgroundColor: '#f6ffed' }} icon={<StockOutlined style={{ color: '#52c41a' }} />} />,
          }}
          chart={
            <div style={{ marginTop: 8 }}>
                <Text type="secondary">Growth <ArrowUpOutlined style={{ color: '#52c41a' }} /> 12%</Text>
            </div>
          }
          style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        />
        <StatisticCard
          statistic={{
            title: 'Inventory Health',
            value: data.inventory.length - metrics.lowStock.length,
            suffix: `/ ${data.inventory.length}`,
            description: <Text type="secondary">Healthy Stock Levels</Text>,
          }}
          chart={<Progress percent={85} size="small" status="active" strokeColor="#1890ff" />}
          style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        />
        <StatisticCard
          statistic={{
            title: 'Active Customers',
            value: data.customers.length,
            icon: <Avatar style={{ backgroundColor: '#e6f7ff' }} icon={<UserOutlined style={{ color: '#1890ff' }} />} />,
          }}
          footer={
            <div className="flex gap-2">
                <Tag color="green">New: +3</Tag>
                <Tag color="gold">VIP: 12</Tag>
            </div>
          }
          style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        />
      </StatisticCard.Group>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* SECTION 2: VISUAL TABLES */}
        <div className="lg:col-span-2 space-y-6">
          <ProTable
            headerTitle={<Space><ShoppingCartOutlined /> <Title level={5} style={{ margin: 0 }}>Recent Orders</Title></Space>}
            dataSource={data.orders.slice(0, 6)}
            search={false}
            options={false}
            pagination={false}
            cardProps={{ bodyStyle: { padding: 0 }, style: { borderRadius: '8px' } }}
            columns={[
              {
                title: 'Item Details',
                render: (_, record) => (
                  <Space>
                    <div style={{ width: 40, height: 40, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <StockOutlined style={{ color: '#bfbfbf' }} />
                    </div>
                    <div>
                      <Text strong>{record.product?.name}</Text><br/>
                      <Text type="secondary" style={{ fontSize: '11px' }}>SKU: {record.product?.sku}</Text>
                    </div>
                  </Space>
                )
              },
              { title: 'Qty', dataIndex: 'quantity', align: 'center' },
              { 
                title: 'Price', 
                dataIndex: 'total_price', 
                valueType: 'money',
                render: (val) => <Text strong style={{ color: '#2f54eb' }}>{val}</Text>
              },
              { 
                title: 'Status', 
                render: () => <Badge status="processing" text="Completed" /> 
              },
            ]}
          />
        </div>

        {/* SECTION 3: SIDEBAR ANALYTICS */}
        <div className="space-y-6">
          <ProCard 
            title="Stock Alerts" 
            extra={<Tag color="red">{metrics.lowStock.length} Critical</Tag>} 
            bordered 
            style={{ borderRadius: '8px' }}
          >
            {metrics.lowStock.slice(0, 4).map((item, idx) => (
              <div key={idx} style={{ marginBottom: 12, padding: '8px', background: '#fff2f0', borderRadius: '4px', borderLeft: '4px solid #ff4d4f' }}>
                <div className="flex justify-between">
                  <Text strong>{item.product?.name}</Text>
                  <Text danger>{item.stock_on_hand} left</Text>
                </div>
                <Progress percent={(item.stock_on_hand / item.min_stock_level) * 100} size="small" showInfo={false} status="exception" />
              </div>
            ))}
            <Button type="link" block danger>View All Alerts</Button>
          </ProCard>

          <ProCard title="Category Mix" bordered style={{ borderRadius: '8px' }}>
            {data.categories.map((cat, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between mb-1">
                  <Text type="secondary">{cat.name}</Text>
                  <Text strong>{Math.floor(Math.random() * 40 + 10)}%</Text>
                </div>
                <Progress percent={Math.floor(Math.random() * 40 + 10)} size="small" strokeColor={['#1890ff', '#52c41a', '#722ed1', '#faad14'][i % 4]} showInfo={false} />
              </div>
            ))}
          </ProCard>
        </div>
      </div>
    </PageContainer>
  );
}