import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Animated,
  PanResponder,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Text as RNText,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
type Message = {
  _id: string; // معرف حقيقي أو وهمي يبدأ بـ "temp-"
  type: 'text' | 'image' | 'audio';
  text: string;
  sender: {
    _id: string;
    username: string;
  }
  timestamp: number;
  isTemporary?: boolean;
  senderType?: 'user' | 'system'; // ← أضف هذا الحقل هنا

};
type Props = {
  messages: Message[];  // قائمة الرسائل الفعلية (مطلوبة)
  onSearchPress?: () => void; // غير ضروري حسب كودك
};


const dummyMessages = [
  'هذه هي الرسالة الأولى عن React Native',
  'تعلم البحث في الرسائل شيء مهم',
  'هل تريد البحث في الرسائل؟ هذا مثال',
  'هذا النص يحتوي على كلمة بحث',
  'رسالة أخرى بدون كلمة البحث',
];

export default function DraggableFAB({ messages, onSearchPress }: Props) {
  const pan = useRef(new Animated.ValueXY({ x: 300, y: 500 })).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchMode, setSearchMode] = useState(false); // هل نحن في وضع البحث؟
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // التحكم بالـ position (كالشرح السابق)
  const panPosition = useRef({ x: 300, y: 500 });
  useEffect(() => {
    const idX = pan.x.addListener(({ value }) => {
      panPosition.current.x = value;
    });
    const idY = pan.y.addListener(({ value }) => {
      panPosition.current.y = value;
    });
    return () => {
      pan.x.removeListener(idX);
      pan.y.removeListener(idY);
    };
  }, [pan]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset(panPosition.current);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // دالة لتحديث نتائج البحث بناءً على النص
 const handleSearch = (text: string) => {
  setSearchText(text);
  if (text.trim() === '') {
    setResults([]);
    setCurrentIndex(0);
    return;
  }
const filteredMessages = messages.filter((msg: { text: string; }) =>
  msg.text.toLowerCase().includes(text.toLowerCase())
);
// ثم تخزن filteredMessages أو نصوصها حسب حاجتك

setResults(filteredMessages.map(msg => msg.text));  // خزن النصوص فقط
  setCurrentIndex(0);
};

  // التنقل بين النتائج
  const goNext = () => {
    if (results.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % results.length);
  };
  const goPrev = () => {
    if (results.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + results.length) % results.length);
  };

  // دالة لتظليل نص البحث في الرسالة
  const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight) return <Text>{text}</Text>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return (
      <Text>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <Text key={i} style={{ backgroundColor: 'yellow' }}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  return (
    <>
      <Animated.View
        style={[styles.fabContainer, { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={() => {
            setMenuVisible(true);
            setSearchMode(false); // عرض القائمة العادية أولاً
            setSearchText('');
            setResults([]);
            setCurrentIndex(0);
          }}
          style={styles.fabButton}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        >
          {!searchMode ? (
            <View style={styles.menu}>
              <TouchableOpacity
                onPress={() => setSearchMode(true)}
                style={styles.menuItem}
              >
                <Ionicons name="search" size={20} color="#000" />
                <Text style={{ marginLeft: 8 }}>بحث في الرسائل</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.menu, { width: 300 }]}>
              <TextInput
                placeholder="اكتب كلمة البحث هنا..."
                value={searchText}
                onChangeText={handleSearch}
                autoFocus
                style={styles.searchInput}
                onSubmitEditing={() => {
                  if (results.length > 0) setCurrentIndex(0);
                }}
              />

              {results.length > 0 ? (
                <>
                  <View style={styles.resultContainer}>
                    <HighlightedText
                      text={results[currentIndex]}
                      highlight={searchText}
                    />
                  </View>

                  <View style={styles.navButtons}>
                    <TouchableOpacity onPress={goPrev} style={styles.navButton}>
                      <Ionicons name="arrow-back" size={24} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goNext} style={styles.navButton}>
                      <Ionicons name="arrow-forward" size={24} color="#2196F3" />
                    </TouchableOpacity>
                  </View>
                  
                  
                  <Text style={{ textAlign: 'center', marginTop: 8 }}>
                    نتيجة {currentIndex + 1} من {results.length}
                  </Text>
                </>
              ) : (
                <Text style={{ marginTop: 10, textAlign: 'center' }}>
                  لا توجد نتائج
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  fabButton: {
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    width: 180,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
  },
  resultContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    minHeight: 50,
    justifyContent: 'center',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  navButton: {
    padding: 8,
  },
});
