import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth';
import { ApiError } from '@/lib/api/api-error';
import { useColors } from '@/theme/app-theme';

import { CampusCard } from './components/CampusCard';
import { CampusScreen } from './components/CampusScreen';
import {
  claimFoodCodPaymentApi,
  createFoodOrderApi,
  fetchFoodBusinessesApi,
  fetchFoodProductsApi,
  fetchFoodStatusApi,
  fetchMyFoodOrdersApi,
  formatPaise,
  newCheckoutId,
  updateFoodCartApi,
} from './food-api';
import { FoodBusiness, FoodOrder, FoodProduct, LocalCartLine } from './food-types';
import { Banner, Note } from './parts';

type Step = 'stores' | 'menu' | 'cart' | 'orders';

export function FoodScreen() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { user } = useAuthSession();
  const token = user?.token || '';
  const tenantId = user?.tenantId || 'nmit';

  const [step, setStep] = useState<Step>('stores');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<FoodBusiness[]>([]);
  const [selected, setSelected] = useState<FoodBusiness | null>(null);
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [cart, setCart] = useState<LocalCartLine[]>([]);
  const [note, setNote] = useState('');
  const [serverTotalPaise, setServerTotalPaise] = useState<number | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<FoodOrder[]>([]);

  const loadStores = useCallback(async () => {
    if (!token) {
      setError('Sign in to order food.');
      setEnabled(false);
      setStores([]);
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const status = await fetchFoodStatusApi(token, tenantId);
      setEnabled(status.enabled);
      if (!status.enabled) {
        setStores([]);
        setOrders([]);
        setError(
          'ChangePay is not configured on the backend. Add CHANGEPAY_BASE_URL, CHANGEPAY_THIRD_PARTY_ID, CHANGEPAY_EXTERNAL_TOKEN, and CHANGEPAY_CLUSTER_ID, then restart the API.',
        );
        return;
      }
      const [list, myOrders] = await Promise.all([
        fetchFoodBusinessesApi(token, tenantId),
        fetchMyFoodOrdersApi(token, tenantId).catch(() => [] as FoodOrder[]),
      ]);
      setStores(list);
      setOrders(myOrders);
      if (!list.length) {
        setError('No ChangePay businesses found for this cluster yet.');
      }
    } catch (err) {
      setEnabled(false);
      setStores([]);
      setOrders([]);
      setError(err instanceof ApiError ? err.message : 'Could not load food stores.');
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  const openStore = async (store: FoodBusiness) => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const catalog = await fetchFoodProductsApi(token, tenantId, store.business_id);
      setSelected(store);
      setProducts(catalog.results ?? []);
      setCart([]);
      setServerTotalPaise(null);
      setLastOrderId(null);
      setStep('menu');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load menu.');
    } finally {
      setBusy(false);
    }
  };

  const addSku = (product: FoodProduct) => {
    const sku =
      product.skus?.find((s) => s.is_active !== false && s.in_stock !== false) ?? product.skus?.[0];
    if (!sku) {
      Alert.alert('Unavailable', 'No sellable size is available for this item.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((line) => line.skuId === sku.sku_id);
      if (existing) {
        return prev.map((line) =>
          line.skuId === sku.sku_id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          skuId: sku.sku_id,
          productName: product.product_name,
          quantity: 1,
          unitPricePaise: sku.base_price ?? 0,
        },
      ];
    });
    setServerTotalPaise(null);
  };

  const changeQty = (skuId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) =>
          line.skuId === skuId ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line,
        )
        .filter((line) => line.quantity > 0),
    );
    setServerTotalPaise(null);
  };

  const priceCart = async () => {
    if (!token || !selected || cart.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const priced = await updateFoodCartApi(token, tenantId, {
        business_id: selected.business_id,
        delivery_type: 'SELF_PICK_UP',
        order_items: cart.map((line) => ({ sku_id: line.skuId, quantity: line.quantity })),
        customer_note: note.trim() || undefined,
      });
      setServerTotalPaise(priced.order_total ?? null);
      if (Array.isArray(priced.errors) && priced.errors.length > 0) {
        setError('Cart has pricing warnings. Check items and try again.');
      }
      setStep('cart');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not price cart.');
    } finally {
      setBusy(false);
    }
  };

  const placeOrder = async () => {
    if (!token || !selected || cart.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await updateFoodCartApi(token, tenantId, {
        business_id: selected.business_id,
        delivery_type: 'SELF_PICK_UP',
        order_items: cart.map((line) => ({ sku_id: line.skuId, quantity: line.quantity })),
        customer_note: note.trim() || undefined,
      });
      const order = await createFoodOrderApi(token, tenantId, {
        business_id: selected.business_id,
        checkout_id: newCheckoutId(),
        delivery_type: 'SELF_PICK_UP',
        payment_type: 'COD',
        order_items: cart.map((line) => ({ sku_id: line.skuId, quantity: line.quantity })),
        customer_note: note.trim() || undefined,
      });
      try {
        await claimFoodCodPaymentApi(token, tenantId, order.order_id);
      } catch {
        // COD claim may be rejected by store policy; order can still exist.
      }
      setLastOrderId(order.order_id);
      setCart([]);
      Alert.alert(
        'Order placed',
        `Order ${order.order_short_number || order.order_id.slice(0, 8)} created. Pay on pickup unless the store requires online payment.`,
      );
      setStep('stores');
      setSelected(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not place order.');
    } finally {
      setBusy(false);
    }
  };

  const localTotal = cart.reduce((sum, line) => sum + line.unitPricePaise * line.quantity, 0);

  return (
    <CampusScreen title="Campus dining" subtitle="Same Campus. Healthier You." activeTab="services">
      <Banner
        kicker="FOOD FOR YOU"
        title={
          step === 'stores'
            ? 'Campus kitchens'
            : step === 'orders'
              ? 'Your orders'
              : selected?.business_name || 'Menu'
        }
        body={
          step === 'stores'
            ? 'Order from ChangePay campus cafes. Self pickup first.'
            : step === 'menu'
              ? 'Tap + to add items, then review your cart.'
              : step === 'orders'
                ? 'Recent ChangePay orders for this account.'
                : 'Confirm ChangePay totals, then place your self-pickup order.'
        }
      />

      {loading ? (
        <ActivityIndicator color={Colors.primary.main} style={{ marginVertical: 24 }} />
      ) : null}

      {error ? <Note>{error}</Note> : null}
      {lastOrderId ? <Note>{`Last order id: ${lastOrderId}`}</Note> : null}

      {!loading && step === 'stores' ? (
        <>
          {enabled && stores.length === 0 ? (
            <Note>No food businesses found for this ChangePay cluster yet.</Note>
          ) : null}
          {stores.map((store) => (
            <CampusCard
              key={store.business_id}
              icon="restaurant"
              title={store.business_name}
              detail={store.has_self_pick_up ? 'Self pickup available' : 'Check fulfilment options'}
              meta={store.is_open === false ? 'Closed' : 'Open'}
              accent="#F59E0B"
              onPress={() => void openStore(store)}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => setStep('orders')}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
            <Text style={styles.secondaryBtnText}>
              {orders.length ? `My orders (${orders.length})` : 'My orders'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadStores()}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
            <Text style={styles.secondaryBtnText}>{busy ? 'Loading…' : 'Refresh stores'}</Text>
          </Pressable>
        </>
      ) : null}

      {!loading && step === 'orders' ? (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => setStep('stores')}
            style={styles.backLink}>
            <Ionicons name="chevron-back" size={16} color={Colors.text.accent} />
            <Text style={styles.backLinkText}>All stores</Text>
          </Pressable>
          {orders.length === 0 ? <Note>No food orders yet. Place a self-pickup order to see it here.</Note> : null}
          {orders.map((order) => {
            const itemNames = (order.order_items || [])
              .map((item) => item.product_name)
              .filter(Boolean)
              .join(', ');
            const orderNo = order.order_short_number || order.order_id.slice(0, 8);
            return (
              <View key={order.order_id} style={styles.orderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productTitle}>
                    {order.business_name || 'Campus cafe'}
                  </Text>
                  <Text style={styles.productMeta}>
                    {itemNames || 'Food order'} · #{orderNo}
                  </Text>
                  <Text style={styles.productMeta}>
                    {order.order_status || 'UNKNOWN'} · {order.payment_info?.payment_type || '—'} ·{' '}
                    {formatPaise(order.order_total)}
                  </Text>
                </View>
              </View>
            );
          })}
        </>
      ) : null}

      {!loading && step === 'menu' && selected ? (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setStep('stores');
              setSelected(null);
            }}
            style={styles.backLink}>
            <Ionicons name="chevron-back" size={16} color={Colors.text.accent} />
            <Text style={styles.backLinkText}>All stores</Text>
          </Pressable>

          {products.length === 0 ? <Note>No products listed for this store.</Note> : null}
          {products.map((product) => {
            const sku =
              product.skus?.find((s) => s.is_active !== false && s.in_stock !== false) ??
              product.skus?.[0];
            return (
              <Pressable
                key={product.product_id}
                accessibilityRole="button"
                onPress={() => addSku(product)}
                style={({ pressed }) => [styles.productRow, pressed && styles.pressed]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productTitle}>{product.product_name}</Text>
                  <Text style={styles.productMeta}>
                    {formatPaise(sku?.base_price)}
                    {product.is_available === false ? ' · Unavailable' : ''}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={22} color={Colors.primary.main} />
              </Pressable>
            );
          })}

          {cart.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void priceCart()}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
                busy && styles.disabled,
              ]}>
              <Text style={styles.primaryBtnText}>
                {busy
                  ? 'Pricing…'
                  : `Review cart · ${cart.reduce((n, l) => n + l.quantity, 0)} items`}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {!loading && step === 'cart' && selected ? (
        <>
          <Pressable accessibilityRole="button" onPress={() => setStep('menu')} style={styles.backLink}>
            <Ionicons name="chevron-back" size={16} color={Colors.text.accent} />
            <Text style={styles.backLinkText}>Back to menu</Text>
          </Pressable>

          {cart.map((line) => (
            <View key={line.skuId} style={styles.cartRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productTitle}>{line.productName}</Text>
                <Text style={styles.productMeta}>{formatPaise(line.unitPricePaise)} each</Text>
              </View>
              <View style={styles.qtyRow}>
                <Pressable onPress={() => changeQty(line.skuId, -1)} hitSlop={8}>
                  <Ionicons name="remove-circle-outline" size={22} color={Colors.text.secondary} />
                </Pressable>
                <Text style={styles.qtyText}>{line.quantity}</Text>
                <Pressable onPress={() => changeQty(line.skuId, 1)} hitSlop={8}>
                  <Ionicons name="add-circle-outline" size={22} color={Colors.primary.main} />
                </Pressable>
              </View>
            </View>
          ))}

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Note for the kitchen (optional)"
            placeholderTextColor={Colors.text.tertiary}
            style={styles.noteInput}
          />

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Catalog estimate</Text>
            <Text style={styles.totalValue}>{formatPaise(localTotal)}</Text>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>ChangePay total</Text>
            <Text style={styles.totalValue}>{formatPaise(serverTotalPaise)}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={busy || cart.length === 0}
            onPress={() => void priceCart()}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
            <Text style={styles.secondaryBtnText}>{busy ? 'Updating…' : 'Reprice cart'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={busy || cart.length === 0}
            onPress={() => void placeOrder()}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.pressed,
              busy && styles.disabled,
            ]}>
            <Text style={styles.primaryBtnText}>
              {busy ? 'Placing order…' : 'Place self-pickup order (COD)'}
            </Text>
          </Pressable>
        </>
      ) : null}
    </CampusScreen>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
    backLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 12,
    },
    backLinkText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: Colors.text.accent,
    },
    productRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      backgroundColor: Colors.background.surface,
      marginBottom: 10,
    },
    productTitle: {
      fontFamily: Typography.semiBold,
      fontSize: 15,
      color: Colors.text.primary,
    },
    productMeta: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    cartRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
    },
    orderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      backgroundColor: Colors.background.surface,
      marginBottom: 10,
    },
    qtyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    qtyText: {
      fontFamily: Typography.semiBold,
      fontSize: 14,
      color: Colors.text.primary,
      minWidth: 18,
      textAlign: 'center',
    },
    noteInput: {
      marginTop: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: Colors.text.primary,
      backgroundColor: Colors.background.input,
      fontFamily: Typography.regular,
      fontSize: 14,
    },
    totalBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 4,
    },
    totalLabel: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.secondary,
    },
    totalValue: {
      fontFamily: Typography.semiBold,
      fontSize: 14,
      color: Colors.text.primary,
    },
    primaryBtn: {
      marginTop: 16,
      backgroundColor: Colors.primary.main,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: Colors.text.onBrand ?? '#fff',
    },
    secondaryBtn: {
      marginTop: 12,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      backgroundColor: Colors.background.surface,
    },
    secondaryBtnText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: Colors.text.accent,
    },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.55 },
  });
}
