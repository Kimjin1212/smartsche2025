import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, TouchableOpacity, Text, Modal, Alert } from 'react-native';
import { NLPService } from '../../services/nlpService';

interface QuickNoteInputProps {
  onNoteProcessed: (date: Date | null, content: string) => void;
}

const QuickNoteInput: React.FC<QuickNoteInputProps> = ({ onNoteProcessed }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');

  const handleSubmit = () => {
    try {
      if (!noteText.trim()) {
        Alert.alert('错误', '请输入内容');
        return;
      }
      
      // 使用NLP服务解析输入
      const nlpService = NLPService.getInstance();
      const result = nlpService.parse(noteText);
      
      // 回调处理结果
      onNoteProcessed(result.date, result.content);
      
      // 重置状态
      setNoteText('');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error processing quick note:', error);
      Alert.alert('错误', '无法处理输入内容，请重试');
    }
  };

  return (
    <View>
      {/* 快速笔记按钮 */}
      <TouchableOpacity 
        style={styles.quickNoteButton} 
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.buttonText}>随手记</Text>
      </TouchableOpacity>

      {/* 快速笔记输入模态框 */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>随手记</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="输入事件描述（例如：明天下午三点去医院）"
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.buttonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.submitButton]} 
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  quickNoteButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
    margin: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#888',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
});

export default QuickNoteInput; 