import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '@store/auth-store'

const RegisterScreen = () => {
  const navigation = useNavigation()
  const { register, isLoading, error } = useAuthStore()
  const [churchName, setChurchName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState<'basic' | 'pro'>('basic')

  const handleRegister = async () => {
    if (!churchName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    try {
      await register(churchName, email, password, plan)
    } catch (err) {
      Alert.alert('Registration Failed', error || 'An error occurred during registration')
    }
  }

  const handleBackToLogin = () => {
    navigation.goBack()
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register your church</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Church Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter church name"
                placeholderTextColor="#999"
                value={churchName}
                onChangeText={setChurchName}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plan</Text>
              <View style={styles.planContainer}>
                <TouchableOpacity
                  style={[styles.planButton, plan === 'basic' && styles.planButtonActive]}
                  onPress={() => setPlan('basic')}
                >
                  <Text style={[styles.planText, plan === 'basic' && styles.planTextActive]}>
                    Basic
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.planButton, plan === 'pro' && styles.planButtonActive]}
                  onPress={() => setPlan('pro')}
                >
                  <Text style={[styles.planText, plan === 'pro' && styles.planTextActive]}>
                    Pro
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity onPress={handleBackToLogin} disabled={isLoading}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  planContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  planButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  planButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  planText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  planTextActive: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: -8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  loginText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
})

export default RegisterScreen
