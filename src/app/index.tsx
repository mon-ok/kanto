import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  PanResponder,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';
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
      justify-content: center;
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

    /* Custom Parking Price Pin */
    .custom-parking-marker {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .price-marker {
      background-color: #f29221;
      color: white;
      padding: 5px 9px;
      border-radius: 14px;
      font-family: 'System', -apple-system, sans-serif;
      font-size: 11px;
      font-weight: 800;
      white-space: nowrap;
      box-shadow: 0 4px 10px rgba(242, 146, 33, 0.45);
      border: 2px solid white;
      position: relative;
      transform: translateY(-50%); /* Center vertically on anchor */
    }
    .price-marker::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      margin-left: -6px;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #f29221;
    }
    .price-marker::before {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      margin-left: -7px;
      width: 0;
      height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 8px solid white;
      z-index: -1;
    }
    
    /* Leaflet Popup Styling */
    .leaflet-popup-content-wrapper {
      background: #fffdeb !important;
      color: #263f4f !important;
      border: 2px solid #263f4f !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 12px rgba(38,63,79,0.15) !important;
    }
    .leaflet-popup-tip {
      background: #263f4f !important;
    } 
    .leaflet-popup-close-button {
      color: #263f4f !important;
      font-weight: bold !important;
      font-size: 14px !important;
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
    var activeMarkers = [];

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

    function handleSetMarkers(markersData) {
      // Clear existing markers except userMarker
      activeMarkers.forEach(function(m) {
        map.removeLayer(m);
      });
      activeMarkers = [];

      // Add new markers
      markersData.forEach(function(spot) {
        // Create custom orange price pin icon
        var customIcon = L.divIcon({
          className: 'custom-parking-marker',
          html: '<div class="price-marker">' + spot.price + '</div>',
          iconSize: [60, 30],
          iconAnchor: [30, 30] // anchor at the bottom middle of the tag
        });

        var m = L.marker([spot.latitude, spot.longitude], { icon: customIcon });
        
        // Add a beautiful custom popup
        var popupContent = 
          '<div style="font-family: sans-serif; min-width: 140px; padding: 4px 2px;">' +
            '<h4 style="margin: 0 0 6px 0; color: #263f4f; font-size: 14px; font-weight: 800;">' + spot.name + '</h4>' +
            '<p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600;">' +
              'Price: <span style="color: #f29221; font-weight: 800;">' + spot.price + '</span>' +
            '</p>' +
            '<p style="margin: 4px 0 0 0; color: #0a7c6e; font-size: 10px; font-weight: 700; text-transform: uppercase;">' +
              'Fits: ' + spot.vehicles.join(', ') +
            '</p>' +
          '</div>';

        m.bindPopup(popupContent);
        m.addTo(map);
        activeMarkers.push(m);
      });
    }

    // Message listener for web/iframe
    window.addEventListener('message', function(event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'setCenter') {
          handleSetCenter(data.lat, data.lng, data.zoom);
        } else if (data && data.type === 'setMarkers') {
          handleSetMarkers(data.markers);
        }
      } catch (e) {
        // Silent catch
      }
    });

    // Message listener for native WebView
    document.addEventListener('message', function(event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'setCenter') {
          handleSetCenter(data.lat, data.lng, data.zoom);
        } else if (data && data.type === 'setMarkers') {
          handleSetMarkers(data.markers);
        }
      } catch (e) {
        // Silent catch
      }
    });
  </script>
</body>
</html>
`;

const VEHICLES = [
  { id: 'motorcycle', name: 'Motorcycle', emoji: '🏍️', image: require('@/assets/images/vehicles/motorcycle.png') },
  { id: 'car', name: 'Car', emoji: '🚗', image: require('@/assets/images/vehicles/car.png') },
  { id: 'tricycle', name: 'Tricycle', emoji: '🛺', image: require('@/assets/images/vehicles/tricycle.png') },
  { id: 'bicycle', name: 'Bicycle', emoji: '🚲', image: require('@/assets/images/vehicles/bicycle.png') },
  { id: 'jeepney', name: 'Jeepney', emoji: '🚌', image: require('@/assets/images/vehicles/jeepney.png') },
  { id: 'truck', name: 'Truck', emoji: '🚚', image: require('@/assets/images/vehicles/truck.png') },
];

const BASE_PARKING_SPACES = [
  {
    id: 'spot-1',
    name: 'Kanto Central Parking',
    offsetLat: 0.0018,
    offsetLng: 0.0025,
    prices: {
      motorcycle: 15,
      car: 40,
      tricycle: 25,
      bicycle: 5,
      jeepney: 50,
      truck: 80,
    },
    slots: 8,
    description: 'Convenient outdoor parking lot right next to the central market. Safe, well-lit, and ideal for quick transactions.',
    amenities: ['CCTV Monitoring', 'Lighting', 'Cement Pavement'],
    image: 'https://images.unsplash.com/photo-1506521788723-8681148e22db?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'tricycle', 'bicycle', 'jeepney', 'truck'],
  },
  {
    id: 'spot-2',
    name: 'Kanto Plaza Basement',
    offsetLat: -0.0025,
    offsetLng: 0.0018,
    prices: {
      motorcycle: 20,
      car: 50,
      tricycle: 30,
      bicycle: 10,
      jeepney: 60,
      truck: 100,
    },
    slots: 15,
    description: 'Premium underground parking with strict automated security and clean bays. Complete protection from rain and sun.',
    amenities: ['Covered Roof', 'CCTV Monitoring', '24/7 Security', 'Elevator Access'],
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'jeepney', 'truck'],
  },
  {
    id: 'spot-3',
    name: 'Green Garden Deck',
    offsetLat: 0.0012,
    offsetLng: -0.0035,
    prices: {
      motorcycle: 10,
      car: 30,
      tricycle: 15,
      bicycle: 5,
      jeepney: 40,
      truck: 70,
    },
    slots: 5,
    description: 'Eco-friendly multi-level parking deck with hanging gardens. Offers beautiful views and solar-powered EV charging.',
    amenities: ['Covered Roof', 'CCTV Monitoring', 'EV Charging', 'Eco-friendly'],
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'tricycle', 'bicycle', 'jeepney'],
  },
  {
    id: 'spot-4',
    name: 'Legazpi Active Park Lot',
    offsetLat: -0.0015,
    offsetLng: -0.0012,
    prices: {
      motorcycle: 15,
      car: 45,
      tricycle: 20,
      bicycle: 8,
      jeepney: 55,
      truck: 90,
    },
    slots: 12,
    description: 'Located beside the park, perfect for weekend markets and morning jogs. Highly secure with regular security patrols.',
    amenities: ['CCTV Monitoring', '24/7 Security', 'Free Carwash', 'Handicap Friendly'],
    image: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=600&auto=format&fit=crop&q=60',
    vehicles: ['car', 'motorcycle', 'jeepney', 'tricycle', 'bicycle'],
  },
  {
    id: 'spot-5',
    name: 'Ayala Triangle Gardens Parking',
    offsetLat: 0.0032,
    offsetLng: -0.0022,
    prices: {
      motorcycle: 25,
      car: 60,
      tricycle: 35,
      bicycle: 12,
      jeepney: 70,
      truck: 120,
    },
    slots: 22,
    description: 'Modern parking garage with state-of-the-art layout under the business park. Quick walk to major restaurants and corporate offices.',
    amenities: ['Covered Roof', 'CCTV Monitoring', '24/7 Security', 'Fire Safety'],
    image: 'https://images.unsplash.com/photo-1545259742-b4fd8fea67e4?w=600&auto=format&fit=crop&q=60',
    vehicles: ['car', 'motorcycle', 'jeepney', 'truck'],
  },
  {
    id: 'spot-6',
    name: 'Rada St. Kerbside Parking',
    offsetLat: 0.0028,
    offsetLng: 0.0042,
    prices: {
      motorcycle: 10,
      car: 35,
      tricycle: 18,
      bicycle: 4,
      jeepney: 45,
      truck: 75,
    },
    slots: 3,
    description: 'Street-side parallel parking spots with dedicated parking attendants. Very convenient for quick coffee runs or dining.',
    amenities: ['Lighting', 'Parking Attendant'],
    image: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'tricycle', 'bicycle'],
  },
  {
    id: 'spot-7',
    name: 'Kanto Express Hub',
    offsetLat: -0.0032,
    offsetLng: -0.0035,
    prices: {
      motorcycle: 12,
      car: 30,
      tricycle: 15,
      bicycle: 5,
      jeepney: 40,
      truck: 75,
    },
    slots: 7,
    description: 'Express drop-off and short-term parking hub. Fast turnover and easy access to the main avenue.',
    amenities: ['CCTV Monitoring', 'Lighting', 'Express Lanes'],
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'tricycle', 'jeepney', 'bicycle', 'car'],
  },
  {
    id: 'spot-8',
    name: 'Metro North Covered Terminal',
    offsetLat: 0.0045,
    offsetLng: 0.0015,
    prices: {
      motorcycle: 15,
      car: 40,
      tricycle: 25,
      bicycle: 5,
      jeepney: 45,
      truck: 85,
    },
    slots: 18,
    description: 'Large covered terminal parking with high clearance, specifically optimized for public utility and large cargo vehicles.',
    amenities: ['Covered Roof', 'CCTV Monitoring', 'Free Carwash', 'Restrooms'],
    image: 'https://images.unsplash.com/photo-1520038410233-7141be7e6f97?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'tricycle', 'jeepney', 'truck'],
  },
  {
    id: 'spot-9',
    name: 'Baywalk Sunrise Parking',
    offsetLat: -0.0042,
    offsetLng: 0.0028,
    prices: {
      motorcycle: 10,
      car: 35,
      tricycle: 20,
      bicycle: 4,
      jeepney: 45,
      truck: 80,
    },
    slots: 10,
    description: 'Scenic outdoor parking along the baywalk. Features breezy seaside air, perfect for watching the famous sunset.',
    amenities: ['Seaside View', 'Lighting', 'CCTV Monitoring'],
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'tricycle', 'bicycle', 'jeepney', 'truck'],
  },
  {
    id: 'spot-10',
    name: 'San Lorenzo Compound',
    offsetLat: -0.0018,
    offsetLng: 0.0035,
    prices: {
      motorcycle: 15,
      car: 40,
      tricycle: 20,
      bicycle: 5,
      jeepney: 50,
      truck: 90,
    },
    slots: 6,
    description: 'Quiet gated residential compound parking. Extra secure with manual gates and 24/7 security guard checking.',
    amenities: ['Covered Roof', '24/7 Security', 'Manual Gate'],
    image: 'https://images.unsplash.com/photo-1506521788723-8681148e22db?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'tricycle', 'bicycle', 'jeepney', 'truck'],
  },
];

// A custom fallback location/target icon for Android/Web where SF Symbols are not available
function RecenterIcon({ tintColor, size }: { tintColor: string; size: number }) {
  const outerSize = size;
  const innerSize = size * 0.35;
  const crosshairLen = size * 0.2;
  const crosshairThick = 2;

  return (
    <View style={{ width: outerSize, height: outerSize, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      {/* Outer Circle */}
      <View
        style={{
          width: outerSize * 0.7,
          height: outerSize * 0.7,
          borderRadius: (outerSize * 0.7) / 2,
          borderWidth: 2,
          borderColor: tintColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Center Dot */}
        <View
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: tintColor,
          }}
        />
      </View>
      {/* Top Tick */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          width: crosshairThick,
          height: crosshairLen,
          backgroundColor: tintColor,
        }}
      />
      {/* Bottom Tick */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: crosshairThick,
          height: crosshairLen,
          backgroundColor: tintColor,
        }}
      />
      {/* Left Tick */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          width: crosshairLen,
          height: crosshairThick,
          backgroundColor: tintColor,
        }}
      />
      {/* Right Tick */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          width: crosshairLen,
          height: crosshairThick,
          backgroundColor: tintColor,
        }}
      />
    </View>
  );
}

export default function MapScreen() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('motorcycle');

  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});

  const toggleSpaceExpand = (spaceId: string) => {
    setExpandedSpaces((prev) => ({
      ...prev,
      [spaceId]: !prev[spaceId],
    }));
  };

  const handleBookPress = (space: any, price: number) => {
    const selectedVehicleObj = VEHICLES.find((v) => v.id === selectedVehicle);
    const selectedVehicleName = selectedVehicleObj ? selectedVehicleObj.name : 'Vehicle';
    
    Alert.alert(
      'Confirm Reservation',
      `Would you like to book a slot at ${space.name} for your ${selectedVehicleName} at ₱${price}/hr?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert(
              'Booking Confirmed! 🎉',
              `Successfully reserved a slot at ${space.name}.\n\nVehicle: ${selectedVehicleName}\nRate: ₱${price}/hr\n\nPlease arrive within 15 minutes.`,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const webviewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Bottom Sheet animations and gestures
  const sheetHeight = 440;
  const peekHeight = 120;
  const snapCollapsed = sheetHeight - peekHeight; // 320px translated down (120px visible)
  const snapExpanded = 0; // 0px translated (440px visible)

  const translateY = useRef(new Animated.Value(snapCollapsed)).current;
  const lastOffset = useRef(snapCollapsed);

  const toggleSheet = (expand: boolean) => {
    const target = expand ? snapExpanded : snapCollapsed;
    lastOffset.current = target;
    Animated.spring(translateY, {
      toValue: target,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  };

  const handleHeaderPress = () => {
    if (lastOffset.current === snapCollapsed) {
      toggleSheet(true);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        translateY.setOffset(lastOffset.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        let nextValue = lastOffset.current + gestureState.dy;
        
        // Organic rubber-band resistance when dragging beyond snap boundaries
        if (nextValue < snapExpanded) {
          nextValue = snapExpanded + (nextValue - snapExpanded) * 0.25;
        } else if (nextValue > snapCollapsed) {
          nextValue = snapCollapsed + (nextValue - snapCollapsed) * 0.25;
        }
        
        translateY.setValue(nextValue - lastOffset.current);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        // Detect tap: if the finger didn't move much (displacement < 5px)
        const isTap = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;
        if (isTap) {
          const expand = lastOffset.current === snapCollapsed;
          toggleSheet(expand);
          return;
        }

        const finalY = lastOffset.current + gestureState.dy;
        let targetY = snapCollapsed;
        // Snap up if swiped up fast or dragged more than halfway up
        if (gestureState.vy < -0.3 || (gestureState.vy <= 0.3 && finalY < snapCollapsed * 0.5)) {
          targetY = snapExpanded;
        }

        lastOffset.current = targetY;
        Animated.spring(translateY, {
          toValue: targetY,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
        }).start();
      },
    })
  ).current;

  const requestLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
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

  // Post filtered parking markers to Leaflet map
  const sendMarkersToMap = (markers: any[]) => {
    const message = JSON.stringify({ type: 'setMarkers', markers });
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

  // Whenever coords change or the map mounts, we push the coordinates and current markers
  const syncMapLocation = () => {
    if (coords) {
      setTimeout(() => {
        sendLocationToMap(coords.latitude, coords.longitude);
        const filtered = BASE_PARKING_SPACES
          .filter((spot) => spot.vehicles.includes(selectedVehicle))
          .map((spot) => ({
            id: spot.id,
            name: spot.name,
            latitude: coords.latitude + spot.offsetLat,
            longitude: coords.longitude + spot.offsetLng,
            price: `₱${(spot.prices as Record<string, number>)[selectedVehicle] ?? 0}/hr`,
            vehicles: spot.vehicles,
          }));
        sendMarkersToMap(filtered);
      }, 500);
    }
  };

  useEffect(() => {
    syncMapLocation();
  }, [coords]);

  // Dynamically update map markers when vehicle type selection changes
  useEffect(() => {
    if (coords) {
      const filtered = BASE_PARKING_SPACES
        .filter((spot) => spot.vehicles.includes(selectedVehicle))
        .map((spot) => ({
          id: spot.id,
          name: spot.name,
          latitude: coords.latitude + spot.offsetLat,
          longitude: coords.longitude + spot.offsetLng,
          price: `₱${(spot.prices as Record<string, number>)[selectedVehicle] ?? 0}/hr`,
          vehicles: spot.vehicles,
        }));
      
      const timer = setTimeout(() => {
        sendMarkersToMap(filtered);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedVehicle]);

  const handleRecenter = () => {
    requestLocation();
  };

  const handleSpacePress = (spaceName: string) => {
    console.log(`Clicked past space: ${spaceName}`);
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

        {/* Floating Controls - adjusted position to float above collapsed sheet */}
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={handleRecenter}
          activeOpacity={0.8}
        >
          <SymbolView
            name={{ ios: 'location.fill', android: 'my_location', web: 'my_location' } as any}
            size={22}
            tintColor={BrandColors.navy}
            fallback={<RecenterIcon tintColor={BrandColors.navy} size={22} />}
          />
        </TouchableOpacity>

        {/* Draggable Bottom Sheet */}
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHeaderWrapper} {...panResponder.panHandlers}>
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>
            <View style={styles.sheetHeader}>
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Hi! Anong gusto mong i-park?</Text>
                <TouchableOpacity onPress={() => toggleSheet(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.headerSubtitle}>Select vehicle type to filter parking spaces.</Text>
            </View>
          </View>

          <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={true}>
            {/* Horizontal Scrollable Vehicle List */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vehicleScrollContainer}
            >
              {VEHICLES.map((vehicle) => {
                const isSelected = selectedVehicle === vehicle.id;
                return (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[styles.vehicleCard, isSelected && styles.selectedVehicleCard]}
                    onPress={() => setSelectedVehicle(vehicle.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.imageWrapper}>
                      <Text style={styles.vehicleEmoji}>{vehicle.emoji}</Text>
                      <Image source={vehicle.image} style={styles.vehicleImage} />
                    </View>
                    <Text style={[styles.vehicleName, isSelected && styles.selectedText]}>
                      {vehicle.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.divider} />

            {/* Available Parking Spaces Section */}
            <View style={styles.pastSpacesSection}>
              <Text style={styles.sectionTitle}>Available Parking Spaces</Text>
              {BASE_PARKING_SPACES.filter((spot) => spot.vehicles.includes(selectedVehicle)).length === 0 ? (
                <Text style={styles.noSpacesText}>No available parking spaces for this vehicle type.</Text>
              ) : (
                BASE_PARKING_SPACES
                  .filter((spot) => spot.vehicles.includes(selectedVehicle))
                  .map((space) => {
                    const isExpanded = !!expandedSpaces[space.id];
                    const vehiclePrice = (space.prices as Record<string, number>)[selectedVehicle] ?? 0;
                    const vehicleName = VEHICLES.find((v) => v.id === selectedVehicle)?.name || 'Vehicle';
                    return (
                      <View key={space.id} style={styles.spaceCard}>
                        <TouchableOpacity
                          style={styles.spaceHeaderPressable}
                          onPress={() => toggleSpaceExpand(space.id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.spaceIconContainer}>
                            <Text style={styles.spaceIcon}>🅿️</Text>
                          </View>
                          <View style={styles.spaceInfo}>
                            <Text style={styles.spaceName}>{space.name}</Text>
                            <View style={styles.spaceMetaRow}>
                              <View style={styles.slotsBadge}>
                                <Text style={styles.slotsBadgeText}>{space.slots} slots left</Text>
                              </View>
                              <Text style={styles.spacePriceText}>
                                {vehicleName} Price: ₱{vehiclePrice}/hr
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.expandToggleText}>
                            {isExpanded ? 'Show Less ▲' : 'Show More ▼'}
                          </Text>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.expandedContent}>
                            <Image
                              source={{ uri: space.image }}
                              style={styles.spaceDetailImage}
                              contentFit="cover"
                              transition={200}
                            />
                            <Text style={styles.spaceDescriptionText}>
                              {space.description}
                            </Text>
                            <View style={styles.amenitiesContainer}>
                              {space.amenities.map((amenity, idx) => (
                                <View key={idx} style={styles.amenityBadge}>
                                  <Text style={styles.amenityBadgeText}>{amenity}</Text>
                                </View>
                              ))}
                            </View>
                            <TouchableOpacity
                              style={styles.bookButton}
                              onPress={() => handleBookPress(space, vehiclePrice)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.bookButtonText}>Book Now</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })
              )}
            </View>
          </ScrollView>
        </Animated.View>
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
    zIndex: 30,
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
    bottom: 140, // Floating above the collapsed sheet
    right: Spacing.three,
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
    zIndex: 15,
  },
  buttonText: {
    fontSize: 22,
  },

  // Bottom Sheet Styles
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 440,
    backgroundColor: BrandColors.white, // Reverted to clean white background
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 20,
    overflow: 'hidden',
  },
  sheetHeaderWrapper: {
    backgroundColor: BrandColors.white, // Reverted to clean white background
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  sheetHeader: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(38, 63, 79, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: BrandColors.navy,
    fontFamily: 'System',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(38, 63, 79, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: BrandColors.navy,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
  },
  sheetContent: {
    flex: 1,
    paddingTop: Spacing.three,
  },
  vehicleScrollContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.one,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  vehicleCard: {
    width: 105,
    height: 115,
    backgroundColor: BrandColors.white, // Inactive card is clean white
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(38, 63, 79, 0.08)', // Soft boundary border
    padding: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    // Subtle shadow
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedVehicleCard: {
    borderColor: BrandColors.orange, // Active border highlights with brand Orange
    backgroundColor: BrandColors.background, // Active background highlights with brand yellowish-cream
  },
  imageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.white, // Retain white background for the icon badge
    borderWidth: 1.5,
    borderColor: 'rgba(38, 63, 79, 0.12)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 2,
  },
  vehicleEmoji: {
    fontSize: 32,
    position: 'absolute',
  },
  vehicleImage: {
    width: 48,
    height: 48,
    position: 'absolute',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '900',
    color: BrandColors.navy,
    textAlign: 'center',
  },
  selectedText: {
    color: BrandColors.orange, // Active text highlights with brand Orange instead of Green
  },
  divider: {
    height: 1.5,
    backgroundColor: 'rgba(38, 63, 79, 0.08)',
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.three,
  },
  pastSpacesSection: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: BrandColors.navy,
    letterSpacing: 1.5,
    marginBottom: Spacing.two,
  },
  spaceCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(38, 63, 79, 0.08)',
    borderRadius: 16,
    backgroundColor: BrandColors.white,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  spaceHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  spaceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(38, 63, 79, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceIcon: {
    fontSize: 20,
  },
  spaceInfo: {
    flex: 1,
  },
  spaceName: {
    fontSize: 15,
    fontWeight: '900',
    color: BrandColors.navy,
  },
  spaceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  slotsBadge: {
    backgroundColor: 'rgba(10, 124, 110, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(10, 124, 110, 0.2)',
  },
  slotsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: BrandColors.teal,
  },
  spacePriceText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.orange,
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: BrandColors.navy,
    paddingHorizontal: 4,
  },
  expandedContent: {
    marginTop: Spacing.two,
    paddingTop: Spacing.three,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(38, 63, 79, 0.05)',
  },
  spaceDetailImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    marginBottom: Spacing.three,
  },
  spaceDescriptionText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
    fontWeight: '600',
    marginBottom: Spacing.three,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.four,
  },
  amenityBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amenityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  bookButton: {
    backgroundColor: BrandColors.teal,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BrandColors.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bookButtonText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  noSpacesText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
});
