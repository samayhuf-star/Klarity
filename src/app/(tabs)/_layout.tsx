import { Tabs } from 'expo-router';
import { C } from '@/components/ui';
import { AppsIcon, InsightsIcon, SettingsIcon, TodayIcon } from '@/components/icons';

const icon = (Cmp: typeof TodayIcon) => ({ color }: { color: unknown }) => <Cmp color={String(color)} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.line, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
        tabBarActiveTintColor: C.acc,
        tabBarInactiveTintColor: C.mut,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon(TodayIcon), tabBarAccessibilityLabel: 'Today', tabBarButtonTestID: 'tab-today' }} />
      <Tabs.Screen name="apps" options={{ title: 'Apps', tabBarIcon: icon(AppsIcon), tabBarAccessibilityLabel: 'Apps and rules', tabBarButtonTestID: 'tab-apps' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: icon(InsightsIcon), tabBarAccessibilityLabel: 'Insights', tabBarButtonTestID: 'tab-insights' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon(SettingsIcon), tabBarAccessibilityLabel: 'Settings', tabBarButtonTestID: 'tab-settings' }} />
    </Tabs>
  );
}
