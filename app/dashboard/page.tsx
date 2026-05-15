"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AutoComplete,
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  Drawer,
  Empty,
  Form,
  Grid,
  Input,
  InputNumber,
  List,
  Modal,
  Pagination,
  Radio,
  Row,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import axiosInstance from "@/helpers/axios";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

type ProductItem = {
  ID: number;
  name: string;
  sku: string;
  category_id: number;
  category?: {
    name: string;
  };
};

type PriceListItem = {
  ID: number;
  product_id: number;
  retailprice: number;
};

type InventoryItem = {
  ID: number;
  product_id: number;
  stock_quantity: number;
};

type StoreItem = {
  productId: number;
  categoryId: number;
  categoryName: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
};

type CartLine = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
};

type CheckoutCartPayload = {
  cart_id: string;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  user_id: number;
};

type CheckoutSummaryItem = {
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  name?: string;
};

type CheckoutRecordPayload = {
  cart_id: string;
  payment_type: number;
  client_fname: string;
  client_lname: string;
  delivery_city: string;
  delivery_street_address: string;
  delivery_country: string;
  delivery_notes?: string;
  client_phone?: string;
  total_amount: number;
  company_id: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const [deliveryForm] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [selectedQty, setSelectedQty] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [userId, setUserId] = useState<number | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutCartId, setCheckoutCartId] = useState("");
  const [checkoutItems, setCheckoutItems] = useState<CheckoutSummaryItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cod">("cod");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [checkoutRecordSubmitting, setCheckoutRecordSubmitting] = useState(false);
  const [checkoutRecordCreated, setCheckoutRecordCreated] = useState(false);
  const [paymentConfirmModalOpen, setPaymentConfirmModalOpen] = useState(false);
  const [cashOrderCartId, setCashOrderCartId] = useState("");
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartAddCount, setCartAddCount] = useState(0);
  const [productSearch, setProductSearch] = useState("");

  const pageSize = 10;
  const deliveryValues = Form.useWatch([], deliveryForm);

  const parseUserIdFromToken = (token: string): number | null => {
    try {
      const tokenParts = token.split(".");
      if (tokenParts.length < 2) {
        return null;
      }

      const base64Payload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payloadJson = atob(base64Payload);
      const payload = JSON.parse(payloadJson);

      const candidate = payload.user_id ?? payload.userId ?? payload.id ?? payload.ID ?? payload.sub;
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const resolveUserId = (): number | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const directValue = localStorage.getItem("user_id") || localStorage.getItem("userId");
    if (directValue) {
      const parsed = Number(directValue);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return null;
    }

    return parseUserIdFromToken(token);
  };

  const generateCartId = (): string => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const normalizeCheckoutItems = (rawItems: any[]): CheckoutSummaryItem[] => {
    const normalized: CheckoutSummaryItem[] = [];

    for (const item of rawItems) {
      const productId = Number(item.product_id ?? item.productId);
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unit_price ?? item.unitPrice ?? item.price ?? 0);
      const totalPrice = Number(item.total_price ?? item.totalPrice ?? quantity * unitPrice);
      const name = item.name ?? item.product?.name;

      if (!Number.isFinite(productId) || productId <= 0) {
        continue;
      }

      normalized.push({
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        name,
      });
    }

    return normalized;
  };

  useEffect(() => {
    const loadStoreData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productsRes, priceRes, inventoryRes] = await Promise.all([
          axiosInstance.get("/api/products"),
          axiosInstance.get("/api/pricelists"),
          axiosInstance.get("/api/inventory"),
        ]);

        const products: ProductItem[] = productsRes.data?.products ?? [];
        const prices: PriceListItem[] = priceRes.data?.price_list_items ?? [];
        const inventory: InventoryItem[] = inventoryRes.data?.inventory_items ?? [];

        const priceByProductId = new Map<number, number>();
        prices.forEach((item) => {
          if (!priceByProductId.has(item.product_id)) {
            priceByProductId.set(item.product_id, Number(item.retailprice) || 0);
          }
        });

        const stockByProductId = new Map<number, number>();
        inventory.forEach((item) => {
          stockByProductId.set(item.product_id, Number(item.stock_quantity) || 0);
        });

        const mappedItems: StoreItem[] = [];

        products.forEach((product) => {
          const categoryId = product.category_id;
          const price = priceByProductId.get(product.ID);
          const stock = stockByProductId.get(product.ID) ?? 0;

          if (!categoryId || price === undefined || stock <= 0) {
            return;
          }

          mappedItems.push({
            productId: product.ID,
            categoryId,
            categoryName: product.category?.name || `Category ${categoryId}`,
            name: product.name,
            sku: product.sku,
            price,
            stock,
          });
        });

        const items = mappedItems.sort((a, b) => a.name.localeCompare(b.name));

        setStoreItems(items);

        const initialQty: Record<number, number> = {};
        items.forEach((item) => {
          initialQty[item.productId] = 1;
        });
        setSelectedQty(initialQty);
      } catch (e) {
        setError("Could not load store data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, []);

  useEffect(() => {
    setUserId(resolveUserId());
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [storeItems.length]);

  const handleAddToCart = (item: StoreItem) => {
    const qty = selectedQty[item.productId] ?? 1;

    if (qty <= 0) {
      message.warning("Please select a valid quantity.");
      return;
    }

    if (qty > item.stock) {
      message.warning(`Only ${item.stock} in stock for ${item.name}.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((line) => line.productId === item.productId);

      if (!existing) {
        return [
          ...prev,
          {
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: qty,
            stock: item.stock,
          },
        ];
      }

      const updatedQty = existing.quantity + qty;
      if (updatedQty > item.stock) {
        message.warning(`Cannot exceed stock (${item.stock}) for ${item.name}.`);
        return prev;
      }

      return prev.map((line) =>
        line.productId === item.productId
          ? {
              ...line,
              quantity: updatedQty,
            }
          : line
      );
    });

    setCartAddCount((prev) => prev + 1);
    message.success(`${item.name} added to cart.`);
  };

  const handleCartQtyChange = (productId: number, qty: number | null) => {
    setCart((prev) =>
      prev.map((line) => {
        if (line.productId !== productId) {
          return line;
        }

        const normalized = Math.max(1, Math.min(line.stock, qty ?? 1));
        return {
          ...line,
          quantity: normalized,
        };
      })
    );
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  };

  const cartTotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [cart]
  );

  const cartQtyTotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart]
  );

  const searchOptions = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const source = query
      ? storeItems.filter((item) => {
          return (
            item.name.toLowerCase().includes(query) ||
            item.sku.toLowerCase().includes(query) ||
            item.categoryName.toLowerCase().includes(query)
          );
        })
      : storeItems;

    return source.slice(0, 5).map((item) => ({
      value: item.name,
      label: `${item.name} (${item.sku})`,
    }));
  }, [storeItems, productSearch]);

  const filteredStoreItems = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) {
      return storeItems;
    }

    return storeItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query)
      );
    });
  }, [storeItems, productSearch]);

  const pagedStoreItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStoreItems.slice(start, start + pageSize);
  }, [filteredStoreItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [productSearch]);

  const handleCheckout = async () => {
    if (!cart.length) {
      message.warning("Your cart is empty.");
      return;
    }

    const currentUserId = userId ?? 0;
    if (!currentUserId) {
      message.warning("User not detected. Please log in before checkout.");
      return;
    }

    const sharedCartId = generateCartId();
    const payload: CheckoutCartPayload[] = [];

    for (const line of cart) {
      payload.push({
        cart_id: sharedCartId,
        product_id: line.productId,
        quantity: line.quantity,
        unit_price: Number(line.price.toFixed(2)),
        total_price: Number((line.price * line.quantity).toFixed(2)),
        user_id: currentUserId,
      });
    }

    try {
      setCheckoutSubmitting(true);
      await axiosInstance.post("/api/carts/multiple", payload);

      const fallbackSummary = payload.map((item) => {
        const lineMatch = cart.find((line) => line.productId === item.product_id);
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          name: lineMatch?.name,
        };
      });

      let fetchedSummary = fallbackSummary;
      try {
        const fetchRes = await axiosInstance.get(`/carts/${sharedCartId}/items`);
        const itemsFromApi =
          fetchRes.data?.items ??
          fetchRes.data?.cart_items ??
          fetchRes.data?.cartItems ??
          fetchRes.data;

        if (Array.isArray(itemsFromApi)) {
          const normalized = normalizeCheckoutItems(itemsFromApi);
          if (normalized.length) {
            fetchedSummary = normalized.map((item) => {
              const lineMatch = cart.find((line) => line.productId === item.product_id);
              return {
                ...item,
                name: item.name || lineMatch?.name,
              };
            });
          }
        }
      } catch {
        message.info("Cart saved. Using local summary since fetch endpoint response was unavailable.");
      }

      setCheckoutCartId(sharedCartId);
      setCheckoutItems(fetchedSummary);
      setCheckoutRecordCreated(false);
      setMpesaNumber("");
      deliveryForm.resetFields();
      setCheckoutModalOpen(true);
      message.success("Cart items saved successfully.");
    } catch {
      message.error("Failed to submit cart items.");
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleSubmitCheckoutRecord = async () => {
    if (checkoutRecordCreated) {
      if (paymentMethod === "mpesa") {
        setCheckoutModalOpen(false);
        setPaymentConfirmModalOpen(true);
      }
      return;
    }

    if (!checkoutCartId) {
      message.error("Missing cart ID. Please retry checkout.");
      return;
    }

    if (!checkoutItems.length) {
      message.error("No checkout items found.");
      return;
    }

    try {
      await deliveryForm.validateFields();

      if (paymentMethod === "mpesa") {
        const mpesaTrimmed = mpesaNumber.trim();
        if (!/^\+?[0-9]{7,14}$/.test(mpesaTrimmed)) {
          message.warning("Enter a valid M-Pesa number (7-14 digits, optional +)." );
          return;
        }
      }

      const values = deliveryForm.getFieldsValue();
      const payload: CheckoutRecordPayload = {
        cart_id: checkoutCartId,
        payment_type: paymentMethod === "mpesa" ? 1 : 2,
        client_fname: values.client_fname.trim(),
        client_lname: values.client_lname.trim(),
        delivery_city: values.delivery_city.trim(),
        delivery_street_address: values.delivery_street_address.trim(),
        delivery_country: values.delivery_country.trim(),
        delivery_notes: (values.delivery_notes || "").trim(),
        client_phone: (values.client_phone || (paymentMethod === "mpesa" ? mpesaNumber : "")).trim(),
        total_amount: Number(checkoutTotal.toFixed(2)),
        company_id: Number(values.company_id),
      };

      setCheckoutRecordSubmitting(true);
      const response = await axiosInstance.post("/api/checkout", payload);
      //console.log("Checkout record response:", response.data);
      //console.log("Submitted checkout record payload:", payload);
      setCheckoutRecordCreated(true);

      if (paymentMethod === "mpesa") {
        setCheckoutModalOpen(false);
        setPaymentConfirmModalOpen(true);
        message.success("Checkout record created. Confirming payment...");
        return;
      }

      setCheckoutModalOpen(false);
      setCashOrderCartId(checkoutCartId);
      setCart([]);
      setCartAddCount(0);
      setCartDrawerOpen(false);
      message.success("Order placed successfully.");
    } catch {
      message.warning("Please complete all required checkout fields.");
    } finally {
      setCheckoutRecordSubmitting(false);
    }
  };

  const checkoutTotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.total_price, 0),
    [checkoutItems]
  );

  const deliveryFormReady = useMemo(() => {
    const val = deliveryValues || {};
    const nameRegex = /^[A-Za-z\s'-]+$/;
    const phoneRegex = /^$|^\+?[0-9]{7,14}$/;

    const first = String(val.client_fname || "").trim();
    const last = String(val.client_lname || "").trim();
    const city = String(val.delivery_city || "").trim();
    const street = String(val.delivery_street_address || "").trim();
    const country = String(val.delivery_country || "").trim();
    const notes = String(val.delivery_notes || "");
    const phone = String(val.client_phone || "").trim();
    const company = Number(val.company_id);

    return (
      first.length > 0 &&
      first.length <= 20 &&
      nameRegex.test(first) &&
      last.length > 0 &&
      last.length <= 20 &&
      nameRegex.test(last) &&
      city.length > 0 &&
      city.length <= 20 &&
      nameRegex.test(city) &&
      street.length > 0 &&
      street.length <= 60 &&
      country.length > 0 &&
      country.length <= 20 &&
      nameRegex.test(country) &&
      notes.length <= 100 &&
      phoneRegex.test(phone) &&
      Number.isInteger(company) &&
      company > 0
    );
  }, [deliveryValues]);

  const mpesaValid = /^\+?[0-9]{7,14}$/.test(mpesaNumber.trim());
  const checkoutActionsDisabled =
    !deliveryFormReady ||
    checkoutRecordSubmitting ||
    checkoutItems.length === 0 ||
    (paymentMethod === "mpesa" && !mpesaValid);

  if (cashOrderCartId) {
    return (
      <div style={{ padding: screens.xs ? 16 : 24 }}>
        <Card style={{ maxWidth: 760, margin: "0 auto" }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Title level={3} style={{ marginBottom: 0 }}>
              Thank you for placing your order.
            </Title>
            <Text>
              The order will be reviewed soon and processed.
            </Text>
            <Text strong>
              Your order ID is {cashOrderCartId}
            </Text>
            <Button
              type="primary"
              onClick={() => {
                setCashOrderCartId("");
                router.push("/dashboard");
              }}
            >
              Back to Dashboard
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          position: "fixed",
          top: screens.xs ? 72 : 80,
          right: screens.xs ? 12 : 18,
          zIndex: 1000,
        }}
      >
        <Badge count={cartAddCount} size="small" overflowCount={999}>
          <Button
            type="primary"
            shape="circle"
            size={screens.xs ? "middle" : "large"}
            style={{ width: screens.xs ? 44 : 52, height: screens.xs ? 44 : 52, fontSize: screens.xs ? 20 : 24 }}
            onClick={() => setCartDrawerOpen(true)}
            disabled={loading}
            aria-label="Open cart"
          >
            🛒
          </Button>
        </Badge>
      </div>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            Store
          </Title>
          <Text type="secondary">
            Products from your catalog, with pricing from pricelist and stock from inventory.
          </Text>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <AutoComplete
            value={productSearch}
            options={searchOptions}
            style={{ width: "min(100%, 560px)" }}
            filterOption={(inputValue, option) =>
              String(option?.label || option?.value || "")
                .toLowerCase()
                .includes(inputValue.toLowerCase())
            }
            onSearch={(value) => setProductSearch(value)}
            onSelect={(value) => setProductSearch(value)}
            onChange={(value) => setProductSearch(value)}
            placeholder="Search products by name, SKU, or category"
            allowClear
          />
        </div>

        {error ? <Alert type="error" showIcon message={error} /> : null}

        {loading ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Row gutter={[16, 16]}>
                  {filteredStoreItems.length === 0 ? (
                    <Col span={24}>
                      <Empty description="No products found for this search." />
                    </Col>
                  ) : (
                    pagedStoreItems.map((item) => (
                      <Col xs={24} sm={24} md={12} xl={8} key={item.productId}>
                        <Card
                          title={item.name}
                          extra={<Text type="secondary">{item.categoryName}</Text>}
                          style={{ height: "100%" }}
                        >
                          <Space direction="vertical" style={{ width: "100%" }}>
                            <Text>SKU: {item.sku}</Text>
                            <Text>Price: KES {item.price.toFixed(2)}</Text>
                            <Text>In Stock: {item.stock}</Text>

                            <Space
                              direction={screens.sm ? "horizontal" : "vertical"}
                              style={{ width: screens.sm ? undefined : "100%" }}
                            >
                              <InputNumber
                                min={1}
                                max={item.stock}
                                value={selectedQty[item.productId] ?? 1}
                                onChange={(val) =>
                                  setSelectedQty((prev) => ({
                                    ...prev,
                                    [item.productId]: Math.max(1, Math.min(item.stock, Number(val) || 1)),
                                  }))
                                }
                              />
                              <Button
                                type="primary"
                                onClick={() => handleAddToCart(item)}
                                block={!screens.sm}
                              >
                                Add to Cart
                              </Button>
                            </Space>
                          </Space>
                        </Card>
                      </Col>
                    ))
                  )}
                </Row>
                {filteredStoreItems.length > pageSize ? (
                  <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                    <Pagination
                      current={currentPage}
                      total={filteredStoreItems.length}
                      pageSize={pageSize}
                      showSizeChanger={false}
                      onChange={(page) => setCurrentPage(page)}
                    />
                  </div>
                ) : null}
              </Col>
            </Row>
          </>
        )}
      </Space>

      <Drawer
        title="Cart"
        placement="right"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        width={screens.xs ? "92vw" : 420}
      >
        {cart.length === 0 ? (
          <Empty description="Your cart is empty" />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {cart.map((line) => (
              <Card key={line.productId} size="small">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text strong>{line.name}</Text>
                  <Text>Unit Price: KES {line.price.toFixed(2)}</Text>
                  <Text>Line Total: KES {(line.price * line.quantity).toFixed(2)}</Text>
                  <Space wrap>
                    <Text>Qty:</Text>
                    <InputNumber
                      min={1}
                      max={line.stock}
                      value={line.quantity}
                      onChange={(val) => handleCartQtyChange(line.productId, val)}
                    />
                    <Button danger onClick={() => handleRemoveFromCart(line.productId)}>
                      Remove
                    </Button>
                  </Space>
                </Space>
              </Card>
            ))}

            <Card size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Total Units: {cartQtyTotal}</Text>
                <Text strong style={{ fontSize: 16 }}>
                  Grand Total: KES {cartTotal.toFixed(2)}
                </Text>
                <Button
                  type="primary"
                  onClick={handleCheckout}
                  loading={checkoutSubmitting}
                  disabled={!cart.length || !userId || checkoutSubmitting || loading}
                  block
                >
                  Checkout
                </Button>
              </Space>
            </Card>
          </Space>
        )}
      </Drawer>

      <Modal
        open={checkoutModalOpen}
        onCancel={() => setCheckoutModalOpen(false)}
        footer={null}
        title="Checkout Summary"
        width={screens.xs ? "calc(100vw - 24px)" : 820}
        styles={{
          body: {
            maxHeight: "78vh",
            overflowY: "auto",
          },
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Card size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Cart ID: {checkoutCartId}</Text>
              <Text>Items in this order:</Text>

              <div
                style={{
                  maxHeight: 280,
                  overflowY: "auto",
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  padding: 8,
                }}
              >
                <List
                  dataSource={checkoutItems}
                  locale={{ emptyText: "No submitted cart items found" }}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" size={0} style={{ width: "100%" }}>
                        <Text strong>{item.name || `Product #${item.product_id}`}</Text>
                        <Text type="secondary">
                          Qty: {item.quantity} | Unit: KES {item.unit_price.toFixed(2)} | Total: KES {item.total_price.toFixed(2)}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>

              <Text strong style={{ fontSize: 16 }}>
                Checkout Total: KES {checkoutTotal.toFixed(2)}
              </Text>
            </Space>
          </Card>

          <Collapse
            defaultActiveKey={["delivery", "payment"]}
            items={[
              {
                key: "delivery",
                label: "Delivery Address",
                children: (
                  <Form form={deliveryForm} layout="vertical">
                    <Row gutter={[12, 0]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="First Name"
                          name="client_fname"
                          rules={[
                            { required: true, message: "Enter first name" },
                            { max: 20, message: "First name must be at most 20 characters" },
                            { pattern: /^[A-Za-z\s'-]+$/, message: "Use letters only" },
                          ]}
                        >
                          <Input placeholder="First name" maxLength={20} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Last Name"
                          name="client_lname"
                          rules={[
                            { required: true, message: "Enter last name" },
                            { max: 20, message: "Last name must be at most 20 characters" },
                            { pattern: /^[A-Za-z\s'-]+$/, message: "Use letters only" },
                          ]}
                        >
                          <Input placeholder="Last name" maxLength={20} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Company ID"
                          name="company_id"
                          rules={[
                            { required: true, message: "Enter company ID" },
                            {
                              validator: (_, value) => {
                                const numeric = Number(value);
                                if (Number.isInteger(numeric) && numeric > 0) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(new Error("Company ID must be a positive whole number"));
                              },
                            },
                          ]}
                        >
                          <InputNumber placeholder="Company ID" min={1} precision={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          label="Street Address"
                          name="delivery_street_address"
                          rules={[
                            { required: true, message: "Enter street address" },
                            { max: 60, message: "Street address must be at most 60 characters" },
                          ]}
                        >
                          <Input placeholder="Street address" maxLength={60} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="City"
                          name="delivery_city"
                          rules={[
                            { required: true, message: "Enter city" },
                            { max: 20, message: "City must be at most 20 characters" },
                            { pattern: /^[A-Za-z\s'-]+$/, message: "Use letters only" },
                          ]}
                        >
                          <Input placeholder="City" maxLength={20} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Country"
                          name="delivery_country"
                          rules={[
                            { required: true, message: "Enter country" },
                            { max: 20, message: "Country must be at most 20 characters" },
                            { pattern: /^[A-Za-z\s'-]+$/, message: "Use letters only" },
                          ]}
                        >
                          <Input placeholder="Country" maxLength={20} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Client Phone"
                          name="client_phone"
                          rules={[
                            {
                              pattern: /^$|^\+?[0-9]{7,14}$/,
                              message: "Phone must be 7-14 digits, optional +",
                            },
                          ]}
                        >
                          <Input placeholder="e.g. +254712345678" maxLength={14} />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          label="Delivery Notes"
                          name="delivery_notes"
                          rules={[{ max: 100, message: "Notes must be at most 100 characters" }]}
                        >
                          <Input.TextArea placeholder="Optional notes" maxLength={100} rows={3} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                ),
              },
              {
                key: "payment",
                label: "Payment Method",
                children: (
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Radio.Group
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    >
                      <Space direction={screens.xs ? "vertical" : "horizontal"}>
                        <Radio value="mpesa">M-Pesa</Radio>
                        <Radio value="cod">Cash on Delivery</Radio>
                      </Space>
                    </Radio.Group>

                    {paymentMethod === "mpesa" ? (
                      <Space direction={screens.xs ? "vertical" : "horizontal"} style={{ width: "100%" }}>
                        <Input
                          placeholder="Enter M-Pesa Number"
                          value={mpesaNumber}
                          onChange={(event) => setMpesaNumber(event.target.value)}
                          maxLength={14}
                        />
                        <Button
                          type="primary"
                          onClick={handleSubmitCheckoutRecord}
                          loading={checkoutRecordSubmitting}
                          disabled={checkoutActionsDisabled}
                        >
                          Pay Now
                        </Button>
                      </Space>
                    ) : (
                      <Text type="secondary">You selected cash on delivery.</Text>
                    )}
                  </Space>
                ),
              },
            ]}
          />

          <Divider style={{ margin: "8px 0" }} />
          <Button
            type="primary"
            block
            onClick={handleSubmitCheckoutRecord}
            loading={checkoutRecordSubmitting}
            disabled={checkoutActionsDisabled}
          >
            Complete Order
          </Button>
        </Space>
      </Modal>

      <Modal
        open={paymentConfirmModalOpen}
        footer={null}
        closable={true}
        maskClosable={false}
        title="M-Pesa Payment"
      >
        <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
          <Spin size="large" />
          <Text strong>Confirming payment...</Text>
          <Text type="secondary">This will remain here until backend payment confirmation is ready.</Text>
        </Space>
      </Modal>
    </div>
  );
}