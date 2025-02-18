import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface Activity {
  id: string;
  name: string;
  points: number;
  description: string;
}

interface ActivitySelectorProps {
  onSelect: (activity: Activity) => void;
  onCancel: () => void;
}

export default function ActivitySelector({ onSelect, onCancel }: ActivitySelectorProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#ff3b7f" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadActivities}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Activity</Text>
          <Pressable style={styles.closeButton} onPress={onCancel}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
        
        <View style={styles.activities}>
          {activities.map((activity) => (
            <Pressable
              key={activity.id}
              style={styles.activityButton}
              onPress={() => onSelect(activity)}
            >
              <View style={styles.activityContent}>
                <View>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityDescription}>
                    {activity.description}
                  </Text>
                </View>
                <View style={styles.pointsContainer}>
                  <Ionicons name="star" size={16} color="#ff3b7f" />
                  <Text style={styles.pointsText}>{activity.points}</Text>
                </View>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color="#666"
                style={styles.chevron}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  activities: {
    gap: 10,
  },
  activityButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#999',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,59,127,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    color: '#ff3b7f',
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  retryButton: {
    backgroundColor: '#ff3b7f',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 