import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SmartTimeSlot } from '../../types/schedule';
import { translations, Language } from '../../i18n/translations';

interface SmartTimeRecommendationModalProps {
  visible: boolean;
  onClose: () => void;
  recommendations: SmartTimeSlot[];
  onSelect: (slot: SmartTimeSlot) => void;
  language?: Language;
}

const SmartTimeRecommendationModal: React.FC<SmartTimeRecommendationModalProps> = ({
  visible,
  onClose,
  recommendations,
  onSelect,
  language = 'zh'
}) => {
  const t = translations[language];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language === 'en'
    });
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
          <Text style={styles.title}>{t.smartRecommend}</Text>
          
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

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t.cancel}</Text>
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
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  recommendationItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
});

export default SmartTimeRecommendationModal; 