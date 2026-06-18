import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from '../../infrastructure/store/hooks';
import { loginStart, loginFailure, loginSuccess } from '../../infrastructure/store/slices/authSlice';
import { AuthService } from '../../infrastructure/services/AuthService';
import { connettiSocket } from '../../infrastructure/realtime/socketClient';
import { C } from '../theme/colors';

const authService = new AuthService();

export const AuthScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [modalita, setModalita] = useState<'login' | 'registra'>('login');
  const [nome, setNome]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleRegistra = async () => {
    setErrore(null);
    setIsLoading(true);
    dispatch(loginStart());
    try {
      authService.validaEmail(email);
      authService.validaPassword(password);
      // Registra sul server, ottiene JWT + utente e avvia la sessione
      const utente = await authService.registra(nome.trim(), email.trim(), password);
      dispatch(loginSuccess(utente));
      connettiSocket();
    } catch (e) {
      const msg = (e as Error).message;
      setErrore(msg);
      dispatch(loginFailure(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrore(null);
    setIsLoading(true);
    dispatch(loginStart());
    try {
      authService.validaEmail(email);
      // Login sul server, ottiene JWT + utente e avvia la sessione
      const utente = await authService.login(email.trim(), password);
      dispatch(loginSuccess(utente));
      connettiSocket();
    } catch (e) {
      const msg = (e as Error).message;
      setErrore(msg);
      dispatch(loginFailure(msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoBox}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🛡</Text>
            </View>
            <Text style={styles.brand}>SOSAround</Text>
            <Text style={styles.tagline}>La rete che ritrova</Text>
          </View>

          {/* Tab selector */}
          <View style={styles.tabs}>
            {(['login', 'registra'] as const).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, modalita === m && styles.tabAttivo]}
                onPress={() => { setModalita(m); setErrore(null); }}
              >
                <Text style={[styles.tabText, modalita === m && styles.tabTestoAttivo]}>
                  {m === 'login' ? 'Accedi' : 'Registrati'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {modalita === 'registra' && (
            <View style={styles.fieldBox}>
              <Text style={styles.label}>Nome utente</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="es. mario_rossi"
                placeholderTextColor={C.text3}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.fieldBox}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@esempio.it"
              placeholderTextColor={C.text3}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldBox}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder={modalita === 'registra' ? 'Min 8 car, Maiusc, numero, @#$' : '••••••••'}
                placeholderTextColor={C.text3}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(v => !v)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.text2} />
              </TouchableOpacity>
            </View>
          </View>

          {errore ? (
            <View style={styles.erroreBox}>
              <Text style={styles.erroreText}>{errore}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btnPrimario, isLoading && styles.btnDisabilitato]}
            onPress={modalita === 'login' ? handleLogin : handleRegistra}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.btnPrimarioText}>
                  {modalita === 'login' ? 'Accedi' : 'Crea account'}
                </Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.white },
  flex:  { flex: 1 },
  scroll: { padding: 24, paddingTop: 40 },

  logoBox: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  logoEmoji: { fontSize: 36 },
  brand:     { fontSize: 28, fontWeight: '800', fontStyle: 'italic', color: C.dark },
  tagline:   { fontSize: 14, color: C.text2, marginTop: 4 },

  tabs: {
    flexDirection: 'row', backgroundColor: C.bg,
    borderRadius: 12, padding: 4, marginBottom: 28,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabAttivo: {
    backgroundColor: C.white,
    shadowColor: C.shadow, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  tabText:        { fontSize: 14, fontWeight: '600', color: C.text2 },
  tabTestoAttivo: { color: C.primary, fontWeight: '700' },

  fieldBox: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: C.text1, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: C.text1, backgroundColor: C.white,
  },
  passwordRow:  { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 },
  eyeBtn: {
    borderWidth: 1.5, borderColor: C.border, borderLeftWidth: 0,
    borderTopRightRadius: 12, borderBottomRightRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.bg,
  },

  erroreBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, marginBottom: 16 },
  erroreText: { color: C.danger, fontSize: 13 },

  btnPrimario: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabilitato: { opacity: 0.6 },
  btnPrimarioText: { color: C.white, fontSize: 16, fontWeight: '700' },
});
