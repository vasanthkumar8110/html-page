import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Share } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import DocumentPicker from 'react-native-document-picker';
import { uploadFile } from '../api/upload';
import { useState } from 'react';
import { Alert } from 'react-native';

export const HomeScreen = () => {
  const logout = useAuthStore((state) => state.logout);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['files'],
    queryFn: async () => {
      const { data } = await apiClient.get('/files/list');
      return data;
    },
  });

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });

      setIsUploading(true);
      await uploadFile({
        name: res.name || 'unnamed',
        uri: res.uri,
        type: res.type || 'application/octet-stream',
        size: res.size || 0,
      });

      Alert.alert('Success', 'File uploaded successfully');
      refetch();
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
      } else {
        Alert.alert('Upload Error', 'Failed to upload file');
        console.error(err);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleShare = async (fileId: string) => {
    try {
      const { data } = await apiClient.post(`/${fileId}/share`);
      await Share.share({
        message: `Check out this file on my Cloud: ${data.shareUrl}`,
        url: data.shareUrl,
      });
    } catch (err) {
      Alert.alert('Share Error', 'Failed to generate share link');
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.fileCard}>
      <Text style={styles.fileIcon}>{item.mimeType.includes('image') ? '🖼️' : '📄'}</Text>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.name}</Text>
        <Text style={styles.fileDetails}>{(item.size / 1024 / 1024).toFixed(2)} MB</Text>
      </View>
      <TouchableOpacity onPress={() => handleShare(item.id)} style={styles.shareButton}>
        <Text style={styles.shareText}>Share</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Files</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data?.files || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#8b5cf6" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No files yet. Tap + to upload.</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={handlePickFile}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.fabText}>+</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: space-between,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
  },
  list: {
    padding: 24,
  },
  fileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 12,
    color: '#94a3b8',
  },
  shareButton: {
    padding: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
  },
  shareText: {
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    width: 64,
    height: 64,
    backgroundColor: '#8b5cf6',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
