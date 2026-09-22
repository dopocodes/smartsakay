import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { EmptyState, LoadingSpinner } from '../../components/common/SharedComponents';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const NOTIF_ICONS = {
  fare_update: { icon: 'cash', color: '#F59E0B' },
  weather_alert: { icon: 'weather-lightning', color: '#EF4444' },
  complaint_update: { icon: 'clipboard-check', color: '#10B981' },
  system: { icon: 'cog', color: '#6B7280' },
  broadcast: { icon: 'bullhorn', color: '#3B82F6' },
};

const NotificationsScreen = () => {
  const { colors } = useTheme();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  useEffect(() => { fetchNotifications(); }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState icon="bell-off-outline" title="No notifications" message="You're all caught up!" />
        }
        renderItem={({ item }) => {
          const iconConfig = NOTIF_ICONS[item.type] || NOTIF_ICONS.system;
          return (
            <TouchableOpacity
              style={[
                styles.notifCard,
                {
                  backgroundColor: item.isRead ? colors.surface : colors.primary + '08',
                  borderColor: item.isRead ? colors.border : colors.primary + '30',
                },
              ]}
              onPress={() => markAsRead(item._id)}
            >
              <View style={[styles.iconCircle, { backgroundColor: iconConfig.color + '20' }]}>
                <MaterialCommunityIcons name={iconConfig.icon} size={20} color={iconConfig.color} />
              </View>
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.notifMsg, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={[styles.notifTime, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
              </View>
              {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl, paddingTop: SPACING.lg },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  markAll: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  listContent: { padding: SPACING.xl, paddingTop: 0 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm, gap: SPACING.md },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: FONTS.sizes.md, fontWeight: '600' },
  notifMsg: { fontSize: FONTS.sizes.sm, marginTop: 2, lineHeight: 20 },
  notifTime: { fontSize: FONTS.sizes.xs, marginTop: SPACING.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});

export default NotificationsScreen;
