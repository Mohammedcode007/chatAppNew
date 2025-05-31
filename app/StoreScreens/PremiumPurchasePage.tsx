import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Button,
  ScrollView,
  Image,
} from "react-native";
import ColorPicker from "react-native-wheel-color-picker";

interface Feature {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}

// مميزات للمستخدم
const userPremiumFeatures: Feature[] = [
  {
    id: "1",
    name: "✨ Special Welcome Message",
    description: "Unique welcome message with colorful emojis and text.",
    price: 100,
    icon: "🎉",
  },
  {
    id: "2",
    name: "✔️ Verification Badge",
    description: "Get a verified badge next to your username.",
    price: 200,
    icon: "👑",
  },
  {
    id: "3",
    name: "🎨 Custom Username Color",
    description: "Choose a special color for your username.",
    price: 150,
    icon: "🌈",
  },
  {
    id: "4",
    name: "🏅 Custom Badge",
    description: "Select and display a custom badge next to your username.",
    price: 180,
    icon: "🎖️",
  },
];

// شارات مخصصة للمستخدم (باستثناء التوثيق)
const userCustomBadges = [
  { id: "star", icon: "⭐", label: "Star" },
  { id: "vip", icon: "💎", label: "VIP" },
  { id: "special", icon: "🔥", label: "Special" },
  { id: "champion", icon: "🏆", label: "Champion" },
];

// مميزات للغرفة
const roomPremiumFeatures: Feature[] = [
  {
    id: "r1",
    name: "🚀 Increase Max Members",
    description: "Increase room member limit from 50 to 100.",
    price: 300,
    icon: "👥",
  },
  {
    id: "r2",
    name: "🔒 Private Mode",
    description: "Make the room private and visible by invitation only.",
    price: 400,
    icon: "🔐",
  },
  {
    id: "r3",
    name: "🏅 Room Custom Badge",
    description: "Add a special badge displayed on your room.",
    price: 350,
    icon: "🎗️",
  },
];

// شارات مخصصة للغرفة
const roomCustomBadges = [
  { id: "r_star", icon: "⭐", label: "Star Room" },
  { id: "r_vip", icon: "💎", label: "VIP Room" },
  { id: "r_special", icon: "🔥", label: "Special Room" },
  { id: "r_champion", icon: "🏆", label: "Champion Room" },
];

// صور محتملة للافتارات (avatars)
const availableAvatars = [
  { id: "avatar1", uri: "https://i.pravatar.cc/100?img=1" },
  { id: "avatar2", uri: "https://i.pravatar.cc/100?img=2" },
  { id: "avatar3", uri: "https://i.pravatar.cc/100?img=3" },
  { id: "avatar4", uri: "https://i.pravatar.cc/100?img=4" },
];

// إطارات حول الصورة الشخصية (يمكن استبدالها بصور حقيقية)
const availableFrames = [
  { id: "frame1", label: "Gold Frame", color: "gold" },
  { id: "frame2", label: "Silver Frame", color: "silver" },
  { id: "frame3", label: "Red Frame", color: "red" },
];

// تأثيرات خاصة (أسماء تمثيلية)
const availableEffects = [
  { id: "effect1", label: "Glow" },
  { id: "effect2", label: "Shadow" },
  { id: "effect3", label: "Blur" },
];

// خلفيات صورة (backgrounds)
const availableBackgrounds = [
  { id: "bg1", uri: "https://picsum.photos/id/1015/400/300" },
  { id: "bg2", uri: "https://picsum.photos/id/1016/400/300" },
  { id: "bg3", uri: "https://picsum.photos/id/1018/400/300" },
  { id: "bg4", uri: "https://picsum.photos/id/1020/400/300" },
];

export default function PremiumPurchaseScreen() {
  // حالات المستخدم
  const [selectedUserFeature, setSelectedUserFeature] = useState<Feature | null>(null);
  const [usernameColor, setUsernameColor] = useState("#1E90FF");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [purchasedUserBadges, setPurchasedUserBadges] = useState<string[]>([]);
  const [selectedUserBadge, setSelectedUserBadge] = useState<string | null>(null);

  // حالات الإضافات الجديدة
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);

  // حالات الغرفة
  const [selectedRoomFeature, setSelectedRoomFeature] = useState<Feature | null>(null);
  const [purchasedRoomBadges, setPurchasedRoomBadges] = useState<string[]>([]);
  const [selectedRoomBadge, setSelectedRoomBadge] = useState<string | null>(null);
  const [purchasedRoomFeatures, setPurchasedRoomFeatures] = useState<string[]>([]);

  // لعرض القسم الحالي (مستخدم أو غرفة)
  const [activeSection, setActiveSection] = useState<"user" | "room">("user");

  // دالة شراء ميزة مستخدم
  const handlePurchaseUserFeature = (feature: Feature) => {
    Alert.alert(
      "Purchase Confirmation",
      `You purchased user feature: ${feature.name} for ${feature.price} points`,
      [{ text: "OK" }]
    );

    if (feature.id === "4" && !purchasedUserBadges.includes("customBadge")) {
      setPurchasedUserBadges([...purchasedUserBadges, "customBadge"]);
      setSelectedUserBadge(userCustomBadges[0].id);
    }
    // تحديث قاعدة البيانات هنا حسب الحاجة
  };

  // دالة شراء ميزة غرفة
  const handlePurchaseRoomFeature = (feature: Feature) => {
    Alert.alert(
      "Purchase Confirmation",
      `You purchased room feature: ${feature.name} for ${feature.price} points`,
      [{ text: "OK" }]
    );

    if (feature.id === "r3" && !purchasedRoomBadges.includes("roomCustomBadge")) {
      setPurchasedRoomBadges([...purchasedRoomBadges, "roomCustomBadge"]);
      setSelectedRoomBadge(roomCustomBadges[0].id);
    }

    if (!purchasedRoomFeatures.includes(feature.id)) {
      setPurchasedRoomFeatures([...purchasedRoomFeatures, feature.id]);
    }
    // تحديث قاعدة البيانات هنا حسب الحاجة
  };

  const renderFeatureItem = (
    item: Feature,
    selectedFeature: Feature | null,
    setSelectedFeature: React.Dispatch<React.SetStateAction<Feature | null>>
  ) => (
    <TouchableOpacity
      style={[
        styles.featureItem,
        selectedFeature?.id === item.id && styles.selectedItem,
      ]}
      onPress={() => {
        setSelectedFeature(item);
        setShowColorPicker(false);
      }}
    >
      <Text style={styles.featureIcon}>{item.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureName}>{item.name}</Text>
        <Text style={styles.featureDesc}>{item.description}</Text>
      </View>
      <Text style={styles.featurePrice}>{item.price} pts</Text>
    </TouchableOpacity>
  );

  const renderBadgeItem = (
    badge: typeof userCustomBadges[0] | typeof roomCustomBadges[0],
    selectedBadge: string | null,
    setSelectedBadge: React.Dispatch<React.SetStateAction<string | null>>
  ) => (
    <TouchableOpacity
      key={badge.id}
      style={[
        styles.badgeItem,
        selectedBadge === badge.id && styles.badgeSelected,
      ]}
      onPress={() => setSelectedBadge(badge.id)}
    >
      <Text style={styles.badgeIcon}>{badge.icon}</Text>
      <Text>{badge.label}</Text>
    </TouchableOpacity>
  );

  // عرض قائمة الصور للافتار
  const renderAvatarItem = (avatar: typeof availableAvatars[0]) => (
    <TouchableOpacity
      key={avatar.id}
      style={[
        styles.avatarItem,
        selectedAvatar === avatar.id && styles.avatarSelected,
      ]}
      onPress={() => setSelectedAvatar(avatar.id)}
    >
      <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
    </TouchableOpacity>
  );

  // عرض قائمة الإطارات
  const renderFrameItem = (frame: typeof availableFrames[0]) => (
    <TouchableOpacity
      key={frame.id}
      style={[
        styles.frameItem,
        selectedFrame === frame.id && styles.frameSelected,
        { borderColor: frame.color },
      ]}
      onPress={() => setSelectedFrame(frame.id)}
    >
      <Text>{frame.label}</Text>
    </TouchableOpacity>
  );

  // عرض قائمة التأثيرات
  const renderEffectItem = (effect: typeof availableEffects[0]) => (
    <TouchableOpacity
      key={effect.id}
      style={[
        styles.effectItem,
        selectedEffect === effect.id && styles.effectSelected,
      ]}
      onPress={() => setSelectedEffect(effect.id)}
    >
      <Text>{effect.label}</Text>
    </TouchableOpacity>
  );

  // عرض قائمة الخلفيات
  const renderBackgroundItem = (bg: typeof availableBackgrounds[0]) => (
    <TouchableOpacity
      key={bg.id}
      style={[
        styles.backgroundItem,
        selectedBackground === bg.id && styles.backgroundSelected,
      ]}
      onPress={() => setSelectedBackground(bg.id)}
    >
      <Image source={{ uri: bg.uri }} style={styles.backgroundImage} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* اختيار القسم: مستخدم أو غرفة */}
      <View style={styles.toggleSection}>
        <Button
          title="User Features"
          onPress={() => setActiveSection("user")}
          color={activeSection === "user" ? "#1E90FF" : "gray"}
        />
        <Button
          title="Room Features"
          onPress={() => setActiveSection("room")}
          color={activeSection === "room" ? "#1E90FF" : "gray"}
        />
      </View>

      {/* القسم الخاص بالمستخدم */}
      {activeSection === "user" && (
        <>
          <Text style={styles.sectionTitle}>User Premium Features</Text>
          {userPremiumFeatures.map((feature) =>
            renderFeatureItem(feature, selectedUserFeature, setSelectedUserFeature)
          )}

          {/* اختيار لون اسم المستخدم */}
          {selectedUserFeature?.id === "3" && (
            <>
              <Button
                title={showColorPicker ? "Close Color Picker" : "Pick Username Color"}
                onPress={() => setShowColorPicker(!showColorPicker)}
              />
              {showColorPicker && (
                <ColorPicker
                  color={usernameColor}
                  onColorChangeComplete={(color) => setUsernameColor(color)}
                  thumbSize={30}
                  sliderSize={30}
                  noSnap={true}
                  row={false}
                  swatches={false}
                />
              )}
              <View style={{ marginVertical: 10 }}>
                <Text style={{ color: usernameColor, fontWeight: "bold" }}>
                  Sample Username
                </Text>
              </View>
            </>
          )}

          {/* شراء ميزة */}
          {selectedUserFeature && (
            <Button
              title={`Purchase: ${selectedUserFeature.name} for ${selectedUserFeature.price} pts`}
              onPress={() => handlePurchaseUserFeature(selectedUserFeature)}
            />
          )}

          {/* اختيار شارة مخصصة */}
          {purchasedUserBadges.includes("customBadge") && (
            <>
              <Text style={styles.sectionTitle}>Select Custom Badge</Text>
              <View style={styles.badgesContainer}>
                {userCustomBadges.map((badge) =>
                  renderBadgeItem(badge, selectedUserBadge, setSelectedUserBadge)
                )}
              </View>
            </>
          )}

          {/* اختيار الصورة الشخصية (avatar) */}
          <Text style={styles.sectionTitle}>Select Avatar</Text>
          <View style={styles.avatarContainer}>
            {availableAvatars.map(renderAvatarItem)}
          </View>

          {/* اختيار الإطار (frame) */}
          <Text style={styles.sectionTitle}>Select Frame</Text>
          <View style={styles.framesContainer}>
            {availableFrames.map(renderFrameItem)}
          </View>

          {/* اختيار التأثير */}
          <Text style={styles.sectionTitle}>Select Effect</Text>
          <View style={styles.effectsContainer}>
            {availableEffects.map(renderEffectItem)}
          </View>

          {/* اختيار الخلفية */}
          <Text style={styles.sectionTitle}>Select Background</Text>
          <View style={styles.backgroundsContainer}>
            {availableBackgrounds.map(renderBackgroundItem)}
          </View>

          {/* معاينة الصورة الشخصية مع الإطار والتأثير */}
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            {selectedBackground ? (
              <Image
                source={{ uri: availableBackgrounds.find(bg => bg.id === selectedBackground)?.uri }}
                style={styles.backgroundPreview}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.backgroundPreview, { backgroundColor: "#eee" }]} />
            )}
            <View style={styles.avatarPreviewWrapper}>
              {selectedAvatar ? (
                <Image
                  source={{ uri: availableAvatars.find(av => av.id === selectedAvatar)?.uri }}
                  style={[
                    styles.avatarPreview,
                    selectedFrame
                      ? {
                          borderColor: availableFrames.find(f => f.id === selectedFrame)?.color,
                          borderWidth: 4,
                        }
                      : {},
                    selectedEffect === "effect1" && { shadowColor: "yellow", shadowRadius: 10, shadowOpacity: 0.8, shadowOffset: { width: 0, height: 0 } },
                    selectedEffect === "effect2" && { shadowColor: "black", shadowRadius: 5, shadowOpacity: 0.7, shadowOffset: { width: 2, height: 2 } },
                    selectedEffect === "effect3" && { opacity: 0.7 },
                  ]}
                />
              ) : (
                <View style={[styles.avatarPreview, { backgroundColor: "#ccc" }]} />
              )}
              {/* عرض الشارة إذا تم اختيارها */}
              {selectedUserBadge && (
                <View style={styles.badgePreview}>
                  <Text style={{ fontSize: 24 }}>
                    {userCustomBadges.find((b) => b.id === selectedUserBadge)?.icon}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}

      {/* القسم الخاص بالغرفة */}
      {activeSection === "room" && (
        <>
          <Text style={styles.sectionTitle}>Room Premium Features</Text>
          {roomPremiumFeatures.map((feature) =>
            renderFeatureItem(feature, selectedRoomFeature, setSelectedRoomFeature)
          )}

          {/* شراء ميزة الغرفة */}
          {selectedRoomFeature && (
            <Button
              title={`Purchase: ${selectedRoomFeature.name} for ${selectedRoomFeature.price} pts`}
              onPress={() => handlePurchaseRoomFeature(selectedRoomFeature)}
            />
          )}

          {/* اختيار شارة الغرفة */}
          {purchasedRoomBadges.includes("roomCustomBadge") && (
            <>
              <Text style={styles.sectionTitle}>Select Room Badge</Text>
              <View style={styles.badgesContainer}>
                {roomCustomBadges.map((badge) =>
                  renderBadgeItem(badge, selectedRoomBadge, setSelectedRoomBadge)
                )}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  toggleSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  selectedItem: {
    borderColor: "#1E90FF",
    backgroundColor: "#E6F0FF",
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  featureName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  featureDesc: {
    fontSize: 12,
    color: "#555",
  },
  featurePrice: {
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 10,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 5,
  },
  badgeSelected: {
    backgroundColor: "#1E90FF",
    borderColor: "#1E90FF",
  },
  badgeIcon: {
    marginRight: 6,
    fontSize: 18,
  },
  avatarContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  avatarItem: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarSelected: {
    borderColor: "#1E90FF",
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  framesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  frameItem: {
    padding: 10,
    borderWidth: 2,
    borderRadius: 10,
  },
  frameSelected: {
    backgroundColor: "#E6F0FF",
  },
  effectsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  effectItem: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#aaa",
  },
  effectSelected: {
    backgroundColor: "#1E90FF",
    borderColor: "#1E90FF",
  },
  backgroundsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  backgroundItem: {
    margin: 5,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "transparent",
    overflow: "hidden",
  },
  backgroundSelected: {
    borderColor: "#1E90FF",
  },
  backgroundImage: {
    width: 80,
    height: 60,
  },
  previewContainer: {
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
    height: 220,
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
  },
  backgroundPreview: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  avatarPreviewWrapper: {
    position: "relative",
    alignItems: "center",
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ccc",
  },
  badgePreview: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#1E90FF",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
