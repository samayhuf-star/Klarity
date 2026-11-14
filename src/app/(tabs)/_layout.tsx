import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { C } from '@/components/ui';

const icon = (e: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{e}</Text>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.line },
        tabBarActiveTintColor: C.acc,
        tabBarInactiveTintColor: C.mut,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('🌿'), tabBarAccessibilityLabel: 'Today', tabBarButtonTestID: 'tab-today' }} />
      <Tabs.Screen name="apps" options={{ title: 'Apps', tabBarIcon: icon('📱'), tabBarAccessibilityLabel: 'Apps and rules', tabBarButtonTestID: 'tab-apps' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: icon('📊'), tabBarAccessibilityLabel: 'Insights', tabBarButtonTestID: 'tab-insights' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('⚙️'), tabBarAccessibilityLabel: 'Settings', tabBarButtonTestID: 'tab-settings' }} />
    </Tabs>
  );
}
