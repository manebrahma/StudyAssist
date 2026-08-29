import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { RootTabParamList, RootStackParamList } from "../types";

import HomeScreen from "../screens/HomeScreen";
import CameraScreen from "../screens/CameraScreen";
import SubjectsScreen from "../screens/SubjectsScreen";
import HistoryScreen from "../screens/HistoryScreen";
import PreviewScreen from "../screens/PreviewScreen";
import ChatScreen from "../screens/ChatScreen";
import SessionDetailScreen from "../screens/SessionDetailScreen";
import SubjectSessionsScreen from "../screens/SubjectSessionsScreen";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: "🏠",
    Camera: "📷",
    Subjects: "📚",
    History: "📋",
    Progress: "📊",
  };
  return (
    <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || "📄"}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#1a1a2e" },
        headerTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#1a1a2e",
          borderTopColor: "#2a2a4e",
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#4A90D9",
        tabBarInactiveTintColor: "#888",
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "StudyAssist" }} />
      <Tab.Screen name="Camera" component={CameraScreen} options={{ title: "Capture" }} />
      <Tab.Screen name="Subjects" component={SubjectsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Preview" component={PreviewScreen} options={{ title: "Preview" }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.title })} />
        <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: "Session" }} />
        <Stack.Screen
          name="SubjectSessions"
          component={SubjectSessionsScreen}
          options={({ route }) => ({
            title: route.params.topicName
              ? `${route.params.subjectName} › ${route.params.topicName}`
              : route.params.subjectName,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
