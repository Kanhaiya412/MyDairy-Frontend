import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  View,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { registerUser } from '../services/authService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

type Props = {
  navigation: RegisterScreenNavigationProp;
};

const { width, height } = Dimensions.get('window');

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('FARMER'); // Default role
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('⚠️ Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Now using centralized registerUser service (uses correct backend IP)
      const data = await registerUser({
        username,
        email,
        password,
        role,
      });

      if (data.success) {
        Alert.alert('✅ Success', data.message, [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('⚠️ Registration Failed', data.message);
      }
    } catch (error: any) {
      console.error('Register Error:', error);
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Something went wrong. Please try again.';
      Alert.alert('❌ Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Decorative background elements */}
      <View style={styles.backgroundDecor}>
        <View style={styles.circleOne} />
        <View style={styles.circleTwo} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.appName}>MyDairy</Text>
          <Text style={styles.tagline}>Join our farming community</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🐄</Text>
          </View>
          
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Fill in your details to get started</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              style={styles.inputField}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              style={styles.inputField}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              style={styles.inputField}
              secureTextEntry
            />
          </View>

          {/* 🔽 Dropdown for Role Selection */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Select Role</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={role}
                onValueChange={(itemValue) => setRole(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Farmer" value="FARMER" />
                <Picker.Item label="Dairy Owner" value="DAIRY_OWNER" />
                <Picker.Item label="Admin" value="ADMIN" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleRegister} 
            style={[styles.registerButton, isLoading && { opacity: 0.7 }]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLinkContainer}
          >
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default RegisterScreen;

// BACKUP: original styles above
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFF',
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    minHeight: height,
  },
  backgroundDecor: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circleOne: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(15, 98, 254, 0.1)',
    top: -50,
    right: -50,
  },
  circleTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
    bottom: -30,
    left: -30,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F62FE',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    elevation: 8,
    shadowColor: '#0F62FE',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0F62FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 45,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0B1A3A',
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: '#6B7280',
    marginBottom: 30,
    fontSize: 16,
    lineHeight: 24,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#0B1A3A',
    marginBottom: 10,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  inputField: {
    width: '100%',
    backgroundColor: '#FBFCFF',
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    color: '#0B1A3A',
    fontWeight: '500',
  },
  dropdownContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 25,
  },
  dropdownLabel: {
    fontSize: 16,
    color: '#0B1A3A',
    marginBottom: 10,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  pickerWrapper: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FBFCFF',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  picker: {
    height: 55,
    width: '100%',
  },
  registerButton: {
    width: '100%',
    backgroundColor: '#0F62FE',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#0F62FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  loginLinkContainer: {
    alignItems: 'center',
  },
  linkText: {
    textAlign: "center",
    color: '#6B7280',
    fontSize: 16,
  },
  linkHighlight: {
    color: '#0F62FE',
    fontWeight: "700",
  },
});

export { styles };