import React, { useEffect, useRef, useState } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, 
  ListRenderItemInfo, Animated, Easing, Modal, Button, Alert, 
  TextInput,
  ScrollView
} from "react-native";

interface Package {
  id: string;
  coins: number;
  price: string;
}

interface TopUser {
  id: string;
  username: string;
  rechargeAmount: number;
}

const packages: Package[] = [
  { id: "1", coins: 100, price: "$0.99" },
  { id: "2", coins: 550, price: "$4.99" },
  { id: "3", coins: 1200, price: "$9.99" },
  { id: "4", coins: 2500, price: "$18.99" },
  { id: "5", coins: 5000, price: "$45.99" },
];

const topUsers: TopUser[] = [
  { id: "u1", username: "Mohamed", rechargeAmount: 3500 },
  { id: "u2", username: "Ali", rechargeAmount: 2800 },
  { id: "u3", username: "Sara", rechargeAmount: 2300 },
];
const paymentMethods = [
  { id: "pm1", name: "PayPal", icon: require("../../assets/images/paypal.jpg") },
  { id: "pm2", name: "Visa", icon: require("../../assets/images/visa.jpg") },
  { id: "pm3", name: "Wallet", icon: require("../../assets/images/visa.jpg") },
];
const CoinStoreScreen: React.FC = () => {
  const [balance, setBalance] = useState<number>(1000); // رصيد المستخدم (نبدأ بـ 1000)
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
    ]).start();
  }, []);

  // عند الضغط على باقة، نفتح النافذة مع تعيين الباقة المختارة
  const onPackagePress = (pkg: Package) => {
    setSelectedPackage(pkg);
    setModalVisible(true);
  };

  // عند تأكيد الشراء - نزيد الرصيد ونغلق النافذة
  const confirmPurchase = () => {
    if (selectedPackage) {
      setBalance(prev => prev + selectedPackage.coins);
      setModalVisible(false);
      Alert.alert("تم الشراء", `تم إضافة ${selectedPackage.coins.toLocaleString()} عملة إلى رصيدك.`);
    }
  };

  // عند إلغاء الشراء
  const cancelPurchase = () => {
    setModalVisible(false);
  };

  const renderItem = ({ item }: ListRenderItemInfo<Package>) => (
    <TouchableOpacity style={styles.card} onPress={() => onPackagePress(item)}>
      <View style={styles.iconContainer}>
        <Image
          source={require("../../assets/images/coin.jpg")}
          style={styles.coinIcon}
        />
        <Text style={styles.coinText}>{item.coins.toLocaleString()} Coins</Text>
      </View>
      <Text style={styles.price}>{item.price}</Text>
    </TouchableOpacity>
  );

  const renderTopUser = (item: TopUser, index: number) => (
    <View style={styles.topUserCard} key={item.id}>
      <Text style={styles.topUserRank}>{index + 1}.</Text>
      <Text style={styles.topUserName}>{item.username}</Text>
      <Text style={styles.topUserAmount}>{item.rechargeAmount.toLocaleString()} CPX</Text>
    </View>
  );
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // طريقة الدفع المختارة
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]);

  // المبلغ المدخل
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  // حساب الكوينز بناءً على المبلغ (مثلاً 100 كوين = 1 دولار)
  // نفترض نسبة ثابتة 1 دولار = 100 كوينز (يمكن تعديلها حسب الحاجة)
  const calculateCoins = (amountStr: string) => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return 0;
    return Math.floor(amount * 100); 
  };

  // فتح مودال الدفع عند الضغط على زر الدفع
  const onPayPress = () => {
    setPaymentAmount("");
    setSelectedPaymentMethod(paymentMethods[0]);
    setPaymentModalVisible(true);
  };

  // تأكيد الدفع
  const confirmPayment = () => {
    const coinsToAdd = calculateCoins(paymentAmount);
    if (coinsToAdd <= 0) {
      Alert.alert("خطأ", "يرجى إدخال مبلغ صحيح أكبر من صفر.");
      return;
    }
    // في الواقع هنا يتم استدعاء API للدفع... الآن نضيف الكوينز مباشرةً
    setBalance(prev => prev + coinsToAdd);
    setPaymentModalVisible(false);
    Alert.alert("تم الدفع", `تم إضافة ${coinsToAdd.toLocaleString()} عملة إلى رصيدك.`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recharge</Text>

      <View style={styles.balanceContainer}>
        <Image
          source={require("../../assets/images/coin.jpg")}
          style={styles.balanceIcon}
        />
        <Text style={styles.balanceText}>{balance.toLocaleString()} CPX</Text>
      </View>

      <Animated.View
        style={[
          styles.topUsersContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.topUsersHeader}>Top 3 Rechargers This Month</Text>
        {topUsers.map(renderTopUser)}
      </Animated.View>

      <FlatList
        data={packages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
      />

      {/* نافذة الشراء */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelPurchase}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Purchase</Text>
            {selectedPackage && (
              <>
                <Text style={styles.modalText}>
                  هل تريد شراء {selectedPackage.coins.toLocaleString()} عملة بسعر {selectedPackage.price}؟
                </Text>
                <View style={styles.modalButtons}>
                  <Button title="إلغاء" onPress={cancelPurchase} color="#999" />
                  <Button title="شراء" onPress={confirmPurchase} color="#FF9900" />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

  <TouchableOpacity style={styles.payButton} onPress={onPayPress}>
        <Text style={styles.payButtonText}>Payment</Text>
      </TouchableOpacity>
       {/* مودال الدفع */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContent}>
            <Text style={styles.modalTitle}>اختيار طريقة الدفع</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paymentMethodsList}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethod.id === method.id && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setSelectedPaymentMethod(method)}
                >
                  <Image source={method.icon} style={styles.paymentMethodIcon} />
                  <Text style={styles.paymentMethodName}>{method.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.amountInputContainer}>
              <Text style={styles.modalText}>أدخل المبلغ بالدولار:</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="مثلاً 4.99"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />
            </View>

            <Text style={styles.coinsCalculated}>
              سيتم إضافة {calculateCoins(paymentAmount).toLocaleString()} عملة عند الدفع
            </Text>

            <View style={styles.modalButtons}>
              <Button title="إلغاء" onPress={() => setPaymentModalVisible(false)} color="#999" />
              <Button title="دفع" onPress={confirmPayment} color="#FF9900" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5E1",
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#FF9900",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  balanceIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  balanceText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#444",
  },
  topUsersContainer: {
    marginBottom: 20,
    backgroundColor: "#FFF8E7",
    padding: 15,
    borderRadius: 12,
  },
  topUsersHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#FF9900",
    textAlign: "center",
  },
  topUserCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5B4",
  },
  topUserRank: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF6600",
    width: 24,
  },
  topUserName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    color: "#333",
  },
  topUserAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF9900",
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  coinIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  coinText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  price: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FF9900",
  },
  payButton: {
    marginTop: 20,
    backgroundColor: "#FF9900",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
    paymentModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentMethodsList: {
    marginVertical: 10,
  },
  paymentMethodCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 10,
    alignItems: "center",
    width: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentMethodSelected: {
    borderColor: "#FF9900",
    borderWidth: 2,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    marginBottom: 8,
    resizeMode: "contain",
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  amountInputContainer: {
    marginVertical: 15,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#333",
    marginTop: 6,
  },
  coinsCalculated: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
    color: "#FF6600",
  },
});

export default CoinStoreScreen;
