import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SmartTimeSlot } from '../types/schedule';

interface SmartTimeRecommendationModalProps {
  visible: boolean;
  onClose: () => void;
  recommendations: SmartTimeSlot[];
  onSelect: (slot: SmartTimeSlot) => void;
}

export const SmartTimeRecommendationModal: React.FC<SmartTimeRecommendationModalProps> = ({
  visible,
  onClose,
  recommendations,
  onSelect,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>智能时间推荐</Text>
          
          <ScrollView style={{ maxHeight: 350 }}>
            {recommendations.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recommendationItem}
                onPress={() => onSelect(slot)}
              >
                <Text style={styles.timeText}>
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </Text>
                <Text style={styles.explanationText}>{slot.explanation}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>关闭</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  recommendationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
  },
}); 