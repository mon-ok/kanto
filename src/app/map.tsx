import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import * as Location from 'expo-location';
import { BrandColors, Spacing } from '@/constants/theme';

// Safely require react-native-webview on native platforms only
let WebView: any;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('WebView failed to load on native platform:', e);
  }
}

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <style>
    body, html, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #fffdeb;
    }
    .leaflet-control-zoom {
      border: 2px solid #263f4f !important;
      box-shadow: 0 4px 12px rgba(38,63,79,0.15) !important;
      border-radius: 8px !important;
      overflow: hidden;
    }
    .leaflet-control-zoom-in, .leaflet-control-zoom-out {
      background-color: #ffffff !important;
      color: #263f4f !important;
      font-weight: bold !important;
      border: none !important;
    }
    .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
      background-color: #f5f2db !important;
    }
    /* Pulse effect for user location */
    .user-location-dot {
      display: flex;
      align-items: center;
      justifyContent: center;
    }
    .pulse {
      width: 14px;
      height: 14px;
      background-color: #0a7c6e;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 8px rgba(10,124,110,0.6);
      position: relative;
    }
    .pulse::after {
      content: '';
      width: 30px;
      height: 30px;
      border: 3px solid #0a7c6e;
      border-radius: 50%;
      position: absolute;
      top: -10px;
      left: -10px;
      opacity: 0;
      animation: pulsate 1.8s ease-out infinite;
    }
    @keyframes pulsate {
      0% {
        transform: scale(0.1);
        opacity: 0;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        transform: scale(1.2);
        opacity: 0;
      }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Manila, PH default coordinates
    var defaultLat = 14.5995;
    var defaultLng = 120.9842;
    var map = L.map('map', {
      zoomControl: false
    }).setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    var userMarker = null;

    function handleSetCenter(lat, lng, zoom) {
      map.setView([lat, lng], zoom || 16);
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        var markerIcon = L.divIcon({
          className: 'user-location-dot',
          html: '<div class="pulse"></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        userMarker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
      }
    }

    // Message listener for web/iframe
    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'setCenter') {
          handleSetCenter(data.lat, data.lng, data.zoom);
        }
      } catch (e) {
        // Silent catch
      }
    });

    // Message listener for native WebView
    document.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'setCenter') {
          handleSetCenter(data.lat, data.lng, data.zoom);
        }
      } catch (e) {
        // Silent catch
      }
    });
  </script>
</body>
</html>
`;

export default function MapScreen() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');

  const webviewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const requestLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== 'granted') {
        setErrorMsg('Location permission was denied. Defaulting to Manila.');
        setCoords({ latitude: 14.5995, longitude: 120.9842 }); // Manila PH
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg('Error fetching location. Defaulting to Manila.');
      setCoords({ latitude: 14.5995, longitude: 120.9842 }); // Manila PH
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Post location coordinates to Leaflet map inside iframe or Webview
  const sendLocationToMap = (lat: number, lng: number, zoom = 16) => {
    const message = JSON.stringify({ type: 'setCenter', lat, lng, zoom });
    if (Platform.OS === 'web') {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(message, '*');
      }
    } else {
      if (webviewRef.current) {
        webviewRef.current.postMessage(message);
      }
    }
  };

  // Whenever coords change or the map mounts, we push the coordinates
  const syncMapLocation = () => {
    if (coords) {
      // Small timeout to allow Leaflet scripts to finish loading inside webview/iframe
      setTimeout(() => {
        sendLocationToMap(coords.latitude, coords.longitude);
      }, 500);
    }
  };

  useEffect(() => {
    syncMapLocation();
  }, [coords]);

  const handleRecenter = () => {
    requestLocation();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={LEAFLET_HTML}
            style={styles.iframe}
            onLoad={syncMapLocation}
          />
        ) : (
          WebView && (
            <WebView
              ref={webviewRef}
              source={{ html: LEAFLET_HTML }}
              style={styles.webview}
              onLoadEnd={syncMapLocation}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
            />
          )
        )}

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.overlayContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator color={BrandColors.teal} size="large" />
              <Text style={styles.loadingText}>Fetching GPS location...</Text>
            </View>
          </View>
        )}

        {/* Status Toast */}
        {errorMsg && !loading && (
          <View style={styles.toastContainer}>
            <View style={styles.toastCard}>
              <Text style={styles.toastText}>{errorMsg}</Text>
            </View>
          </View>
        )}

        {/* Floating Controls */}
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={handleRecenter}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>🎯</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  iframe: {
    borderWidth: 0,
    width: '100%',
    height: '100%',
    backgroundColor: BrandColors.background,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(38, 63, 79, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: BrandColors.white,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    color: BrandColors.navy,
    fontWeight: '700',
    fontSize: 15,
  },
  toastContainer: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
    alignItems: 'center',
    zIndex: 10,
  },
  toastCard: {
    backgroundColor: '#fff0e6',
    borderWidth: 1.5,
    borderColor: BrandColors.orange,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toastText: {
    color: BrandColors.navy,
    fontSize: 13,
    fontWeight: '600',
  },
  recenterButton: {
    position: 'absolute',
    bottom: Spacing.three,
    left: Spacing.three,
    backgroundColor: BrandColors.white,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    fontSize: 22,
  },
});
