import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import chrono from 'chrono-node';

interface Schedule {
  id: string;
  title: string;
  description: string;
  dateTime: FirebaseFirestoreTypes.Timestamp;
  tags: string[];
  userId: string;
}

interface FirestoreError extends Error {
  code?: string;
}

export const ScheduleList: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) {
      console.log('No user logged in');
      return;
    }

    // 监听日程变化
    const unsubscribe = firestore()
      .collection('schedules')
      .where('userId', '==', userId)
      .onSnapshot(
        snapshot => {
          const schedulesData: Schedule[] = [];
          const tagsSet = new Set<string>();

          snapshot.forEach(doc => {
            const data = doc.data() as Schedule;
            schedulesData.push({ ...data, id: doc.id });
            data.tags?.forEach(tag => tagsSet.add(tag));
          });

          // 在内存中按日期时间排序
          schedulesData.sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis());
          
          setSchedules(schedulesData);
          setAllTags(Array.from(tagsSet));
        },
        (error: FirestoreError) => {
          console.error('Error fetching schedules:', error);
          if (error.code === 'firestore/failed-precondition') {
            Alert.alert(
              '提示',
              '正在配置数据库，请稍后再试',
              [
                {
                  text: '确定',
                  onPress: () => {
                    // 可以选择是否打开索引创建页面
                    const indexUrl = error.message.match(/https:\/\/.*$/)?.[0];
                    if (indexUrl) {
                      Linking.openURL(indexUrl);
                    }
                  },
                },
              ]
            );
          } else {
            Alert.alert('错误', '获取日程列表失败');
          }
        }
      );

    return () => unsubscribe();
  }, []);

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await firestore().collection('schedules').doc(scheduleId).delete();
      Alert.alert('成功', '日程已删除');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      Alert.alert('错误', '删除日程失败');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = searchText
      ? schedule.title.toLowerCase().includes(searchText.toLowerCase()) ||
        schedule.description.toLowerCase().includes(searchText.toLowerCase())
      : true;

    const matchesTags = selectedTags.length
      ? selectedTags.every(tag => schedule.tags?.includes(tag))
      : true;

    return matchesSearch && matchesTags;
  });

  const renderScheduleItem = ({ item }: { item: Schedule }) => (
    <View style={styles.scheduleItem}>
      <View style={styles.scheduleHeader}>
        <Text style={styles.scheduleTitle}>{item.title}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteSchedule(item.id)}
        >
          <Text style={styles.deleteButtonText}>删除</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.scheduleDateTime}>
        {format(item.dateTime.toDate(), 'PPpp', { locale: zhCN })}
      </Text>
      <Text style={styles.scheduleDescription}>{item.description}</Text>
      <View style={styles.tagsContainer}>
        {item.tags?.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const parseQuickNote = (text: string) => {
    // 使用 chrono-node 解析时间
    const results = chrono.parse(text);
    if (results.length > 0) {
      const { start } = results[0];
      const date = start.date();
      // 提取事件内容
      const content = text.replace(results[0].text, '').trim();
      return { date, content };
    }
    return null;
  };

  const convertKoreanToChinese = (text: string) => {
    // 简单的正则替换示例
    return text.replace(/내일/g, '明天').replace(/오후/g, '下午').replace(/시에/g, '点');
  };

  const handleQuickNoteSubmit = (text: string) => {
    const convertedText = convertKoreanToChinese(text);
    const parsed = parseQuickNote(convertedText);
    if (parsed) {
      // 使用解析结果
      console.log('Date:', parsed.date);
      console.log('Content:', parsed.content);
    } else {
      console.log('无法解析输入');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={searchText}
        onChangeText={setSearchText}
        placeholder="搜索日程..."
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsScrollView}
      >
        {allTags.map((tag, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterTag,
              selectedTags.includes(tag) && styles.filterTagSelected,
            ]}
            onPress={() => toggleTag(tag)}
          >
            <Text
              style={[
                styles.filterTagText,
                selectedTags.includes(tag) && styles.filterTagTextSelected,
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filteredSchedules}
        renderItem={renderScheduleItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tagsScrollView: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTag: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterTagSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterTagText: {
    color: '#666',
  },
  filterTagTextSelected: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  scheduleItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  scheduleDateTime: {
    color: '#666',
    marginBottom: 8,
  },
  scheduleDescription: {
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#2196F3',
    fontSize: 12,
  },
}); 