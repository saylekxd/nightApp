import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { validateQRCode, acceptVisit, acceptReward, QRValidationResult } from '@/lib/admin';
import { useCameraPermissions } from 'expo-camera';
import WebScanner from './scanner/components/WebScanner';
import CameraScanner from './scanner/components/CameraScanner';
import ScanResult from './scanner/components/ScanResult';
import ErrorView from './scanner/components/ErrorView';
import PermissionDenied from './scanner/components/PermissionDenied';

const ScanScreen = () => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<QRValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [webScanner, setWebScanner] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setError(null);
        setIsInitializing(true);

        if (Platform.OS === 'web') {
          // Web permissions are handled differently
        } else {
          if (!permission?.granted) {
            const result = await requestPermission();
            if (mounted && !result.granted) {
              setError('Camera permission was denied');
            }
          }
        }
      } catch (err) {
        console.error('Scanner initialization error:', err);
        if (mounted) {
          setError('Failed to initialize scanner');
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (Platform.OS === 'web' && webScanner) {
        webScanner.stop().catch(() => {
          // Ignore stop errors during cleanup
        });
      }
    };
  }, [permission, requestPermission]);

  const handleScan = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    try {
      setScanned(true);
      setError(null);
      const validationResult = await validateQRCode(data);
      setResult(validationResult);

      if (Platform.OS === 'web' && webScanner) {
        try {
          await webScanner.pause();
        } catch (err) {
          console.error('Error pausing scanner:', err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate QR code');
      setScanned(false);
    }
  };

  const handleAccept = async () => {
    if (!result?.valid || !result.data) return;

    try {
      setAccepting(true);
      setError(null);

      if (result.data.type === 'visit') {
        await acceptVisit(result.data.code);
      } else {
        await acceptReward(result.data.code);
      }

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept code');
    } finally {
      setAccepting(false);
    }
  };

  const handleClose = () => {
    if (Platform.OS === 'web' && webScanner) {
      webScanner.stop().catch(() => {
        // Ignore stop errors during cleanup
      });
    }
    router.back();
  };

  const handleRetry = () => {
    setScanned(false);
    setError(null);
    setResult(null);
    
    if (Platform.OS === 'web' && webScanner) {
      webScanner.resume().catch(console.error);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a1a', '#000']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.text}>Initializing scanner...</Text>
      </View>
    );
  }

  if (!permission?.granted && Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a1a', '#000']}
          style={StyleSheet.absoluteFill}
        />
        <PermissionDenied />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#000']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Scan QR Code</Text>
      </View>

      {!scanned && (permission?.granted || Platform.OS === 'web') && (
        <View style={styles.scannerContainer}>
          {Platform.OS === 'web' ? (
            <WebScanner
              onScan={handleScan}
              onInitialized={setWebScanner}
              onError={setError}
            />
          ) : (
            <CameraScanner
              onScan={handleScan}
              scanned={scanned}
            />
          )}
        </View>
      )}

      {error && (
        <ErrorView
          message={error}
          onRetry={handleRetry}
        />
      )}

      {result && (
        <ScanResult
          result={result}
          accepting={accepting}
          onAccept={handleAccept}
          onRetry={handleRetry}
        />
      )}
    </View>
  );
};

export default ScanScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
});