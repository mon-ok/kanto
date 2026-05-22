import { buildParkingDetailPage } from '@/app/parking-detail-page';
import { BrandColors, Spacing } from '@/constants/theme';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Image as RNImage
} from 'react-native';

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
    .price-marker.unavailable {
      background-color: #94a3b8;
      box-shadow: 0 4px 10px rgba(148, 163, 184, 0.4);
    }
    .price-marker.unavailable::after {
      border-top-color: #94a3b8;
    }
    
    /* Leaflet Popup Styling */
    .leaflet-popup-content-wrapper {
      background: #fffdeb !important;
      color: #263f4f !important;
      border: 2px solid #263f4f !important;
      border-radius: 16px !important;
      box-shadow: 0 8px 24px rgba(38,63,79,0.18) !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    .leaflet-popup-content {
      margin: 0 !important;
      width: auto !important;
    }
    .leaflet-popup-tip {
      background: #263f4f !important;
    } 
    .leaflet-popup-close-button {
      color: #263f4f !important;
      font-weight: bold !important;
      font-size: 16px !important;
      top: 8px !important;
      right: 10px !important;
      z-index: 10 !important;
    }
    .popup-inner {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-width: 210px;
      max-width: 240px;
      padding: 14px 14px 10px 14px;
    }
    .popup-name {
      margin: 0 0 8px 0;
      color: #263f4f;
      font-size: 15px;
      font-weight: 800;
      line-height: 1.2;
      padding-right: 18px;
    }
    .popup-price {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
    }
    .popup-price-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
    }
    .popup-price-value {
      font-size: 13px;
      font-weight: 800;
      color: #f29221;
    }
    .popup-section-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #263f4f;
      margin-bottom: 4px;
    }
    .popup-vehicles {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 8px;
    }
    .popup-vehicle-badge {
      background: rgba(10,124,110,0.08);
      border: 1px solid rgba(10,124,110,0.2);
      border-radius: 8px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 700;
      color: #0a7c6e;
      white-space: nowrap;
    }
    .popup-slots {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
    }
    .popup-slots-badge {
      background: rgba(242,146,33,0.1);
      border: 1px solid rgba(242,146,33,0.25);
      border-radius: 8px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 800;
      color: #f29221;
    }
    .popup-slots-badge.unavailable {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      color: #ef4444;
    }
    .popup-amenities {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 10px;
    }
    .popup-amenity-badge {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 2px 7px;
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      white-space: nowrap;
    }
    .popup-view-more {
      display: block;
      width: 100%;
      box-sizing: border-box;
      background: #263f4f;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 800;
      text-align: center;
      cursor: pointer;
      letter-spacing: 0.3px;
      transition: background 0.15s;
    }
    .popup-view-more:hover {
      background: #0a7c6e;
    }
    .popup-divider {
      height: 1px;
      background: rgba(38,63,79,0.08);
      margin: 8px 0;
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
    var routePolyline = null;

    function handleSetCenter(lat, lng, zoom, shouldCenter) {
      if (shouldCenter !== false) {
        map.setView([lat, lng], zoom || 16);
      }
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

    function handleDrawRoute(userLat, userLng, spotLat, spotLng, fitBounds) {
      var latlngs = [
        [userLat, userLng],
        [spotLat, spotLng]
      ];
      if (routePolyline) {
        routePolyline.setLatLngs(latlngs);
      } else {
        routePolyline = L.polyline(latlngs, {
          color: '#0a7c6e',
          weight: 6,
          opacity: 0.8,
          dashArray: '8, 12',
          lineCap: 'round'
        }).addTo(map);
      }
      if (fitBounds) {
        var bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    }

    function handleClearRoute() {
      if (routePolyline) {
        map.removeLayer(routePolyline);
        routePolyline = null;
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
        var markerClass = 'price-marker';
        if (spot.slots === 0) {
          markerClass += ' unavailable';
        }
        // Create custom orange price pin icon
        var customIcon = L.divIcon({
          className: 'custom-parking-marker',
          html: '<div class="' + markerClass + '">' + spot.price + '</div>',
          iconSize: [60, 30],
          iconAnchor: [30, 30] // anchor at the bottom middle of the tag
        });

        var m = L.marker([spot.latitude, spot.longitude], { icon: customIcon });
        m.spotId = spot.id;
        m.spotData = spot;

        // Build vehicles badges
        var vehicleBadges = (spot.allVehicles || []).map(function(v) {
          return '<span class="popup-vehicle-badge">' + v + '</span>';
        }).join('');

        // Build amenity badges
        var amenityBadges = (spot.amenities || []).map(function(a) {
          return '<span class="popup-amenity-badge">' + a + '</span>';
        }).join('');

        var slotsBadgeClass = 'popup-slots-badge';
        var slotsText = spot.slots + ' available';
        if (spot.slots === 0) {
          slotsBadgeClass += ' unavailable';
          slotsText = 'No slots available';
        }

        // Build rich popup content
        var popupContent =
          '<div class="popup-inner">' +
            '<h4 class="popup-name">' + spot.name + '</h4>' +
            '<div class="popup-price">' +
              '<span class="popup-price-label">' + spot.vehicleLabel + ' Price:</span>' +
              '<span class="popup-price-value">&#8369;' + spot.priceNum + '/hr</span>' +
            '</div>' +
            '<div class="popup-divider"></div>' +
            '<div class="popup-section-label">Vehicles</div>' +
            '<div class="popup-vehicles">' + vehicleBadges + '</div>' +
            '<div class="popup-slots">' +
              '<span class="popup-section-label" style="margin-bottom:0">Slots:</span>' +
              '<span class="' + slotsBadgeClass + '">' + slotsText + '</span>' +
            '</div>' +
            '<div class="popup-divider"></div>' +
            '<div class="popup-section-label">Amenities & Features</div>' +
            '<div class="popup-amenities">' + amenityBadges + '</div>' +
            '<button class="popup-view-more" data-spot-id="' + spot.id + '">' +
              'View More &#8594;' +
            '</button>' +
          '</div>';

        m.bindPopup(popupContent, { maxWidth: 280 });
        m.addTo(map);
        activeMarkers.push(m);
      });
    }

    // Delegated click for View More buttons (avoids inline onclick escaping issues)
    document.getElementById('map').addEventListener('click', function(e) {
      var btn = e.target;
      if (btn && btn.classList && btn.classList.contains('popup-view-more')) {
        var spotId = btn.getAttribute('data-spot-id');
        if (spotId) handleViewMore(spotId);
      }
    });


    function handleViewMore(spotId) {
      var spot = null;
      for (var i = 0; i < activeMarkers.length; i++) {
        if (activeMarkers[i].spotId === spotId) { spot = activeMarkers[i].spotData; break; }
      }
      if (!spot) return;
      var payload = JSON.stringify({ type: 'viewMore', spot: spot });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(payload);
      } else {
        window.parent.postMessage(payload, '*');
      }
    }

    // Message listener for web/iframe
    window.addEventListener('message', function(event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'setCenter') {
          handleSetCenter(data.lat, data.lng, data.zoom, data.shouldCenter);
        } else if (data && data.type === 'setMarkers') {
          handleSetMarkers(data.markers);
        } else if (data && data.type === 'focusSpot') {
          map.invalidateSize();
          var targetMarker = activeMarkers.find(function(m) {
            return m.spotId === data.spotId;
          });
          if (targetMarker) {
            map.setView(targetMarker.getLatLng(), data.zoom || 16);
            targetMarker.openPopup();
          }
        } else if (data && data.type === 'drawRoute') {
          handleDrawRoute(data.userLat, data.userLng, data.spotLat, data.spotLng, data.fitBounds);
        } else if (data && data.type === 'clearRoute') {
          handleClearRoute();
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
          handleSetCenter(data.lat, data.lng, data.zoom, data.shouldCenter);
        } else if (data && data.type === 'setMarkers') {
          handleSetMarkers(data.markers);
        } else if (data && data.type === 'focusSpot') {
          map.invalidateSize();
          var targetMarker = activeMarkers.find(function(m) {
            return m.spotId === data.spotId;
          });
          if (targetMarker) {
            map.setView(targetMarker.getLatLng(), data.zoom || 16);
            targetMarker.openPopup();
          }
        } else if (data && data.type === 'drawRoute') {
          handleDrawRoute(data.userLat, data.userLng, data.spotLat, data.spotLng, data.fitBounds);
        } else if (data && data.type === 'clearRoute') {
          handleClearRoute();
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

const PARKING_IMAGES = [
  require('@/assets/images/parking/ps1.jpg'),
  require('@/assets/images/parking/ps2.jpg'),
  require('@/assets/images/parking/ps3.jpg'),
  require('@/assets/images/parking/ps4.jpg'),
  require('@/assets/images/parking/ps5.jpg'),
  require('@/assets/images/parking/ps6.jpg'),
  require('@/assets/images/parking/ps7.jpg'),
  require('@/assets/images/parking/ps8.jpg'),
  require('@/assets/images/parking/ps9.jpg'),
  require('@/assets/images/parking/ps10.jpg'),
];

const REMOTE_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80',
  'https://images.unsplash.com/photo-1573804630927-ea5a09a5bae4?w=800&q=80',
  'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?w=800&q=80',
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
];

function getRandomParkingImages(): string[] {
  try {
    const uris = PARKING_IMAGES.map((img) => RNImage.resolveAssetSource(img)?.uri).filter(Boolean) as string[];
    const sourcePool = uris.length > 0 ? uris : REMOTE_FALLBACK_IMAGES;
    
    // Pick 6 random images from the pool (with replacement / repeatedly allowed)
    const selected: string[] = [];
    for (let i = 0; i < 6; i++) {
      const idx = Math.floor(Math.random() * sourcePool.length);
      selected.push(sourcePool[idx]);
    }
    return selected;
  } catch (e) {
    console.warn('Failed to resolve local parking images:', e);
    // Return 6 random fallback images
    const selected: string[] = [];
    for (let i = 0; i < 6; i++) {
      const idx = Math.floor(Math.random() * REMOTE_FALLBACK_IMAGES.length);
      selected.push(REMOTE_FALLBACK_IMAGES[idx]);
    }
    return selected;
  }
}

const BASE_PARKING_SPACES = [
  {
    id: 'spot-1',
    name: "Mang Juan's Gated Bakuran",
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
    slots: 4,
    rating: 4.8,
    reviewCount: 12,
    description: 'Malawak at sementadong bakuran sa likod ng bahay ni Mang Juan. Safe, may gate, at malapit sa palengke. Bantay-sarado ng pamilya.',
    amenities: ['Gated Property', 'CCTV Monitoring', 'Lighting', 'Attendant (Mang Juan)', 'Cement Pavement'],
    image: 'https://images.unsplash.com/photo-1506521788723-8681148e22db?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'tricycle', 'bicycle', 'jeepney', 'truck'],
  },
  {
    id: 'spot-2',
    name: "Aling Nena's Gated Garaje",
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
    slots: 0,
    rating: 4.6,
    reviewCount: 9,
    description: 'Safe at saradong garahe sa tapat ng bahay ni Aling Nena. Protektado ang sasakyan mo sa init at ulan. Kasya ang SUV o Sedan.',
    amenities: ['Covered Roof', 'Gated Property', 'CCTV Monitoring', 'Flood-free'],
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'jeepney', 'truck'],
  },
  {
    id: 'spot-3',
    name: "Tito Boy's Covered Carport",
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
    slots: 2,
    rating: 4.2,
    reviewCount: 8,
    description: 'Driveway na may bubong sa isang secure na subdivision. Bantay-sarado ng mga aso ni Tito Boy (very friendly) at may village guards.',
    amenities: ['Covered Roof', 'Subdivision Security', 'Lighting', 'Pet Friendly'],
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'tricycle', 'bicycle', 'jeepney'],
  },
  {
    id: 'spot-4',
    name: "Kuya Jojo's Front Yard Space",
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
    slots: 3,
    rating: 4.5,
    reviewCount: 15,
    description: 'Pinasementuhang space sa tapat ng bahay at sari-sari store ni Kuya Jojo. Madaling parkingan at laging may tao sa tapat.',
    amenities: ['CCTV Monitoring', 'Lighting', 'Near Sari-Sari Store', 'Cement Pavement'],
    image: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=600&auto=format&fit=crop&q=60',
    vehicles: ['car', 'motorcycle', 'jeepney', 'tricycle', 'bicycle'],
  },
  {
    id: 'spot-5',
    name: "Ate Sarah's Gated Driveway",
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
    slots: 2,
    rating: 4.9,
    reviewCount: 20,
    description: 'Malilim at sementadong driveway ni Ate Sarah. 2 minutes walk lang mula sa parokya/simbahan. Perfect tuwing Linggo.',
    amenities: ['Covered Roof', 'CCTV Monitoring', 'Gated Property', 'Near Church'],
    image: 'https://images.unsplash.com/photo-1545259742-b4fd8fea67e4?w=600&auto=format&fit=crop&q=60',
    vehicles: ['car', 'motorcycle', 'jeepney', 'truck'],
  },
  {
    id: 'spot-6',
    name: "Mang Tomas' Vacant Lot",
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
    slots: 0,
    rating: 4.0,
    reviewCount: 7,
    description: 'Bakanteng lote sa tapat mismo ng Barangay Hall. Binabantayan ng mga barangay tanod kaya sigurado kang panatag ang loob mo.',
    amenities: ['Barangay Tanod Patrol', 'Lighting', 'Spacious Area'],
    image: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'tricycle', 'bicycle'],
  },
  {
    id: 'spot-7',
    name: "Lola Flor's Canopy Garage",
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
    slots: 2,
    rating: 4.3,
    reviewCount: 6,
    description: 'Malilim na garahe ni Lola Flor na may canopy sa harap. Laging may tao sa bahay kaya ligtas ang motor o trike mo.',
    amenities: ['Covered Roof', 'Attendant (Lola Flor)', 'Lighting'],
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'tricycle', 'jeepney', 'bicycle', 'car'],
  },
  {
    id: 'spot-8',
    name: "Kuya Cardo's Heavy Vehicle Space",
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
    slots: 4,
    rating: 4.7,
    reviewCount: 11,
    description: 'Malawak na lupain ni Kuya Cardo na kasya ang jeepney, delivery truck, o cargo vehicle. May sliding gate at CCTV.',
    amenities: ['Covered Roof', 'CCTV Monitoring', 'Truck Friendly', 'Gated Property'],
    image: 'https://images.unsplash.com/photo-1520038410233-7141be7e6f97?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'tricycle', 'jeepney', 'truck'],
  },
  {
    id: 'spot-9',
    name: "Ninong Bobby's Backyard Pave",
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
    slots: 3,
    rating: 4.4,
    reviewCount: 5,
    description: 'Sementadong gilid ng duplex house ni Ninong Bobby. Tahimik na eskinita, may gate, at babantayan din ng pamilya niya.',
    amenities: ['Gated Property', 'Lighting', 'Cement Pavement', 'Quiet Area'],
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&auto=format&fit=crop&q=60',
    vehicles: ['motorcycle', 'car', 'tricycle', 'bicycle', 'jeepney', 'truck'],
  },
  {
    id: 'spot-10',
    name: "Ate Grace's Covered Carport",
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
    slots: 3,
    rating: 4.5,
    reviewCount: 10,
    description: 'Covered carport sa tabi ng residential compound ni Ate Grace. May malaking bubong at safety steel sliding gate.',
    amenities: ['Covered Roof', '24/7 Security', 'Steel sliding gate', 'Lighting'],
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

// A custom fallback filter icon for Android/Web where SF Symbols are not available
function FilterIcon({ tintColor, size }: { tintColor: string; size: number }) {
  const lineThickness = Math.max(1.5, size * 0.08);
  const knobSize = Math.max(5, size * 0.28);
  
  const y1 = size * 0.25;
  const y2 = size * 0.5;
  const y3 = size * 0.75;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Row 1 */}
      <View
        style={{
          position: 'absolute',
          top: y1 - lineThickness / 2,
          left: 0,
          right: 0,
          height: lineThickness,
          backgroundColor: tintColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: y1 - knobSize / 2,
          left: size * 0.3 - knobSize / 2,
          width: knobSize,
          height: knobSize,
          borderRadius: knobSize / 2,
          backgroundColor: tintColor,
        }}
      />

      {/* Row 2 */}
      <View
        style={{
          position: 'absolute',
          top: y2 - lineThickness / 2,
          left: 0,
          right: 0,
          height: lineThickness,
          backgroundColor: tintColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: y2 - knobSize / 2,
          left: size * 0.7 - knobSize / 2,
          width: knobSize,
          height: knobSize,
          borderRadius: knobSize / 2,
          backgroundColor: tintColor,
        }}
      />

      {/* Row 3 */}
      <View
        style={{
          position: 'absolute',
          top: y3 - lineThickness / 2,
          left: 0,
          right: 0,
          height: lineThickness,
          backgroundColor: tintColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: y3 - knobSize / 2,
          left: size * 0.45 - knobSize / 2,
          width: knobSize,
          height: knobSize,
          borderRadius: knobSize / 2,
          backgroundColor: tintColor,
        }}
      />
    </View>
  );
}

// A custom fallback search icon for Android/Web where SF Symbols are not available
function SearchIcon({ tintColor, size }: { tintColor: string; size: number }) {
  const circleSize = size * 0.55;
  const borderThick = 2.5;
  const handleLen = size * 0.45;
  
  return (
    <View style={{ width: size, height: size, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        {/* Circle of magnifying glass */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.1,
            left: size * 0.1,
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderWidth: borderThick,
            borderColor: tintColor,
          }}
        />
        {/* Handle */}
        <View
          style={{
            position: 'absolute',
            bottom: size * 0.12,
            right: size * 0.12,
            width: borderThick,
            height: handleLen,
            backgroundColor: tintColor,
            borderRadius: borderThick / 2,
            transform: [{ rotate: '-45deg' }],
          }}
        />
      </View>
    </View>
  );
}

// A custom fallback back/left-arrow icon for Android/Web where SF Symbols are not available
function BackIcon({ tintColor, size }: { tintColor: string; size: number }) {
  const lineThickness = 2.5;
  const barLen = size * 0.45;
  
  return (
    <View style={{ width: size, height: size, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.6, height: size * 0.6, position: 'relative' }}>
        {/* Top Diagonal Arrowhead */}
        <View
          style={{
            position: 'absolute',
            top: '30%',
            left: '10%',
            width: barLen,
            height: lineThickness,
            backgroundColor: tintColor,
            borderRadius: lineThickness / 2,
            transform: [{ rotate: '-45deg' }],
          }}
        />
        {/* Bottom Diagonal Arrowhead */}
        <View
          style={{
            position: 'absolute',
            bottom: '30%',
            left: '10%',
            width: barLen,
            height: lineThickness,
            backgroundColor: tintColor,
            borderRadius: lineThickness / 2,
            transform: [{ rotate: '45deg' }],
          }}
        />
        {/* Shaft */}
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '10%',
            right: '10%',
            height: lineThickness,
            backgroundColor: tintColor,
            borderRadius: lineThickness / 2,
            marginTop: -lineThickness / 2,
          }}
        />
      </View>
    </View>
  );
}

// A custom fallback hamburger menu icon for Android/Web where SF Symbols are not available
function HamburgerIcon({ tintColor, size }: { tintColor: string; size: number }) {
  const lineThickness = 2.5;
  const gap = size * 0.22;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.75,
          height: lineThickness,
          backgroundColor: tintColor,
          borderRadius: lineThickness / 2,
          marginBottom: gap,
        }}
      />
      <View
        style={{
          width: size * 0.75,
          height: lineThickness,
          backgroundColor: tintColor,
          borderRadius: lineThickness / 2,
          marginBottom: gap,
        }}
      />
      <View
        style={{
          width: size * 0.75,
          height: lineThickness,
          backgroundColor: tintColor,
          borderRadius: lineThickness / 2,
        }}
      />
    </View>
  );
}

// A custom fallback user profile/account icon for Android/Web where SF Symbols are not available
function AccountIcon({ tintColor, size }: { tintColor: string; size: number }) {
  const headSize = size * 0.35;
  const borderThick = 2.5;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <View style={{ width: size, height: size, position: 'relative', alignItems: 'center' }}>
        {/* Head */}
        <View
          style={{
            width: headSize,
            height: headSize,
            borderRadius: headSize / 2,
            borderWidth: borderThick,
            borderColor: tintColor,
            position: 'absolute',
            top: size * 0.15,
          }}
        />
        {/* Shoulders */}
        <View
          style={{
            width: size * 0.75,
            height: size * 0.32,
            borderWidth: borderThick,
            borderColor: tintColor,
            borderBottomWidth: 0,
            borderTopLeftRadius: size * 0.28,
            borderTopRightRadius: size * 0.28,
            position: 'absolute',
            bottom: size * 0.12,
          }}
        />
      </View>
    </View>
  );
}

// A custom fallback wallet/card icon for Android/Web where SF Symbols are not available
function WalletIcon({ tintColor, size }: { tintColor: string; size: number }) {
  const borderThick = 2.5;
  const width = size * 0.8;
  const height = size * 0.6;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width,
          height,
          borderRadius: 4,
          borderWidth: borderThick,
          borderColor: tintColor,
          position: 'relative',
          justifyContent: 'center',
        }}
      >
        {/* Latch */}
        <View
          style={{
            position: 'absolute',
            right: -2,
            top: '30%',
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: 2,
            borderWidth: borderThick,
            borderColor: tintColor,
            backgroundColor: BrandColors.white,
          }}
        />
      </View>
    </View>
  );
}

// A custom fallback list/transactions/invoice icon for Android/Web where SF Symbols are not available
function TransactionsIcon({ tintColor, size }: { tintColor: string; size: number }) {
  const borderThick = 2.5;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.7,
          height: size * 0.8,
          borderRadius: 3,
          borderWidth: borderThick,
          borderColor: tintColor,
          padding: 3,
          justifyContent: 'space-around',
        }}
      >
        <View style={{ height: borderThick, backgroundColor: tintColor, width: '80%', borderRadius: borderThick / 2 }} />
        <View style={{ height: borderThick, backgroundColor: tintColor, width: '50%', borderRadius: borderThick / 2 }} />
        <View style={{ height: borderThick, backgroundColor: tintColor, width: '70%', borderRadius: borderThick / 2 }} />
      </View>
    </View>
  );
}

// A custom fallback settings/cog icon for Android/Web where SF Symbols are not available
function SettingsIcon({ tintColor, size }: { tintColor: string; size: number }) {
  const outerSize = size * 0.65;
  const innerSize = size * 0.22;
  const tickThick = 2.5;
  const tickLen = size * 0.18;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <View
        style={{
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          borderWidth: 2.5,
          borderColor: tintColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: tintColor,
          }}
        />
      </View>
      <View style={{ position: 'absolute', top: 0, width: tickThick, height: tickLen, backgroundColor: tintColor, borderRadius: tickThick / 2 }} />
      <View style={{ position: 'absolute', bottom: 0, width: tickThick, height: tickLen, backgroundColor: tintColor, borderRadius: tickThick / 2 }} />
      <View style={{ position: 'absolute', left: 0, width: tickLen, height: tickThick, backgroundColor: tintColor, borderRadius: tickThick / 2 }} />
      <View style={{ position: 'absolute', right: 0, width: tickLen, height: tickThick, backgroundColor: tintColor, borderRadius: tickThick / 2 }} />
    </View>
  );
}

// A custom fallback logout icon for Android/Web where SF Symbols are not available
function LogoutIcon({ tintColor, size }: { tintColor: string; size: number }) {
  const borderThick = 2.5;
  const frameWidth = size * 0.45;
  const frameHeight = size * 0.75;
  const arrowLength = size * 0.45;
  const arrowThick = 2.5;
  const headSize = size * 0.22;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      {/* Door frame / Bracket (left side) */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.15,
          width: frameWidth,
          height: frameHeight,
          borderWidth: borderThick,
          borderColor: tintColor,
          borderRightWidth: 0, // open on the right
          borderTopLeftRadius: 4,
          borderBottomLeftRadius: 4,
        }}
      />
      {/* Top/bottom short edges return towards right */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.15 + frameWidth - borderThick,
          top: (size - frameHeight) / 2,
          width: borderThick * 2,
          height: borderThick,
          backgroundColor: tintColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.15 + frameWidth - borderThick,
          bottom: (size - frameHeight) / 2,
          width: borderThick * 2,
          height: borderThick,
          backgroundColor: tintColor,
        }}
      />
      
      {/* Arrow Shaft (pointing right) */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.35,
          width: arrowLength,
          height: arrowThick,
          backgroundColor: tintColor,
          borderRadius: arrowThick / 2,
        }}
      />
      
      {/* Arrow Head (pointing right) */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.35 + arrowLength - headSize / 2 - 2,
          width: headSize,
          height: headSize,
          borderTopWidth: arrowThick,
          borderRightWidth: arrowThick,
          borderColor: tintColor,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}


function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatTimeToArrive(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatParkingTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const RECENT_SPACES_IDS = ['spot-1', 'spot-3'];

export default function MapScreen() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('motorcycle');
  const [viewMoreHtml, setViewMoreHtml] = useState<string | null>(null);

  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});

  // Active booking states
  const [bookedSpotId, setBookedSpotId] = useState<string | null>(null);
  const [bookedSpot, setBookedSpot] = useState<any | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [timeToArrive, setTimeToArrive] = useState(1800); // 30 mins
  const [parkingTime, setParkingTime] = useState(0);

  // Custom Modals State
  const [activeModal, setActiveModal] = useState<
    | 'confirm_book'
    | 'booking_confirmed'
    | 'cancel_confirm'
    | 'cancel_success'
    | 'arrived'
    | 'expired'
    | 'departure'
    | 'rate_parking'
    | 'review_success'
    | 'no_slots'
    | 'filter'
    | 'logout'
    | null
  >(null);

  // Active Tab navigation state
  const [activeTab, setActiveTab] = useState<'map' | 'account' | 'wallet' | 'transactions' | 'settings'>('map');

  // Wallet and Transactions states
  const [walletBalance, setWalletBalance] = useState<number>(250.00);
  const [txFilter, setTxFilter] = useState<'all' | 'parking' | 'wallet'>('all');
  const [txSearch, setTxSearch] = useState<string>('');
  const [transactionsList, setTransactionsList] = useState<any[]>([
    {
      id: 'tx-1',
      title: 'GCash Top-up',
      type: 'topup',
      provider: 'GCash',
      amount: 500.00,
      date: 'May 20, 2026 10:14 AM',
      status: 'Completed',
    },
    {
      id: 'tx-2',
      title: 'Parking Fee - Mang Juan\'s Gated Bakuran',
      type: 'parking',
      amount: 80.00,
      date: 'May 18, 2026 02:45 PM',
      status: 'Completed',
    },
    {
      id: 'tx-3',
      title: 'PayMaya Withdrawal',
      type: 'withdrawal',
      provider: 'PayMaya',
      amount: 150.00,
      date: 'May 15, 2026 11:30 AM',
      status: 'Completed',
    },
    {
      id: 'tx-4',
      title: 'Parking Fee - Tito Boy\'s Covered Carport',
      type: 'parking',
      amount: 20.00,
      date: 'May 12, 2026 09:15 AM',
      status: 'Completed',
    }
  ]);

  // Account states
  const [userProfile, setUserProfile] = useState<any>({
    name: 'Juan Dela Cruz',
    email: 'juandelacruz@gmail.com',
    phone: '+63 917 123 4567',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  });
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileEditName, setProfileEditName] = useState<string>('');
  const [profileEditEmail, setProfileEditEmail] = useState<string>('');
  const [profileEditPhone, setProfileEditPhone] = useState<string>('');
  const [registeredVehicles, setRegisteredVehicles] = useState<any[]>([
    {
      id: 'v-1',
      type: 'motorcycle',
      plateNumber: 'NUI 9821',
      brandModel: 'Yamaha Mio Aerox',
    },
    {
      id: 'v-2',
      type: 'car',
      plateNumber: 'NEQ 7289',
      brandModel: 'Toyota Vios XLE',
    }
  ]);
  const [newVehicleType, setNewVehicleType] = useState<string>('motorcycle');
  const [newVehiclePlate, setNewVehiclePlate] = useState<string>('');
  const [newVehicleModel, setNewVehicleModel] = useState<string>('');
  const [showAddVehicleForm, setShowAddVehicleForm] = useState<boolean>(false);

  // Wallet deposit/withdrawal operation states
  const [walletModal, setWalletModal] = useState<'add' | 'withdraw' | null>(null);
  const [walletAmount, setWalletAmount] = useState<string>('');
  const [walletProvider, setWalletProvider] = useState<'gcash' | 'paymaya' | null>(null);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);
  const [walletSuccess, setWalletSuccess] = useState<boolean>(false);
  const [walletPhone, setWalletPhone] = useState<string>('');

  // Settings states
  const [settingsNotifications, setSettingsNotifications] = useState<boolean>(true);
  const [settingsReceipts, setSettingsReceipts] = useState<boolean>(true);
  const [settingsDarkMode, setSettingsDarkMode] = useState<boolean>(false);
  const [settingsLocation, setSettingsLocation] = useState<boolean>(true);
  const [settingsLanguage, setSettingsLanguage] = useState<'en' | 'tl'>('en');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Active Filter States
  const [hideFullSpaces, setHideFullSpaces] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(200); // 200 = Any Price
  const [minStars, setMinStars] = useState<number>(0); // 0 = Any
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Map Search States
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Sidebar Drawer States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const sidebarTranslateX = useRef(new Animated.Value(-300)).current;

  // Temp Buffered Filter States (for modal)
  const [tempHideFullSpaces, setTempHideFullSpaces] = useState<boolean>(false);
  const [tempMaxPrice, setTempMaxPrice] = useState<number>(200);
  const [tempMinStars, setTempMinStars] = useState<number>(0);
  const [tempSelectedAmenities, setTempSelectedAmenities] = useState<string[]>([]);
  const [modalTargetSpace, setModalTargetSpace] = useState<any | null>(null);
  const [modalTargetPrice, setModalTargetPrice] = useState<number>(0);
  const [departurePhase, setDeparturePhase] = useState<'requesting' | 'confirmed'>('requesting');
  const [finalOccupiedTime, setFinalOccupiedTime] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [noSlotsSpotName, setNoSlotsSpotName] = useState<string>('');

  const hasCenteredInitial = useRef(false);
  const hasDrawnRoute = useRef(false);

  const toggleSpaceExpand = (spaceId: string) => {
    setExpandedSpaces((prev) => ({
      ...prev,
      [spaceId]: !prev[spaceId],
    }));
  };

  const handleBookPress = (space: any, price: number) => {
    setModalTargetSpace(space);
    setModalTargetPrice(price);
    setActiveModal('confirm_book');
  };

  const confirmBooking = () => {
    if (!modalTargetSpace) return;
    const space = modalTargetSpace;

    setBookedSpot(space);
    setBookedSpotId(space.id);
    setHasArrived(false);
    setTimeToArrive(1800);
    setParkingTime(0);
    hasDrawnRoute.current = false;

    // Zoom & Route
    setTimeout(() => {
      focusSpotOnMap(space.id);
      if (coords) {
        const spotLat = coords.latitude + space.offsetLat;
        const spotLng = coords.longitude + space.offsetLng;
        drawRouteOnMap(coords.latitude, coords.longitude, spotLat, spotLng, true);
        hasDrawnRoute.current = true;
      }
    }, 500);

    setActiveModal('booking_confirmed');
  };

  const openParkingDetails = (spot: any) => {
    const isBooked = spot.id === bookedSpotId;
    const detailHtml = buildParkingDetailPage(spot, isBooked, hasArrived, selectedVehicle);
    setViewMoreHtml(detailHtml);
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
        const fallback = { latitude: 14.5995, longitude: 120.9842 };
        setCoords(fallback);
        setLoading(false);
        return fallback;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const current = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCoords(current);
      setErrorMsg(null);
      return current;
    } catch (e) {
      setErrorMsg('Error fetching location. Defaulting to Manila.');
      const fallback = { latitude: 14.5995, longitude: 120.9842 };
      setCoords(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Assign 6 random resolved local images to each parking spot on mount
    BASE_PARKING_SPACES.forEach((spot) => {
      const randomImages = getRandomParkingImages();
      if (randomImages.length > 0) {
        (spot as any).images = randomImages;
        spot.image = randomImages[0];
      }
    });

    requestLocation();

    let subscription: any = null;
    const startWatching = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 2000,
              distanceInterval: 3,
            },
            (location) => {
              setCoords({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          );
        }
      } catch (e) {
        console.warn('Error starting position watcher:', e);
      }
    };

    startWatching();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Distance tracking useEffect to trigger automatic arrival
  useEffect(() => {
    if (coords && bookedSpotId && !hasArrived) {
      const spot = BASE_PARKING_SPACES.find(s => s.id === bookedSpotId);
      if (spot) {
        const spotLat = coords.latitude + spot.offsetLat;
        const spotLng = coords.longitude + spot.offsetLng;
        const dist = getDistanceInMeters(coords.latitude, coords.longitude, spotLat, spotLng);
        if (dist <= 35) { // 35 meters threshold
          setHasArrived(true);
          setActiveModal('arrived');
        }
      }
    }
  }, [coords, bookedSpotId, hasArrived]);

  // Timers useEffect
  useEffect(() => {
    if (!bookedSpotId) {
      setTimeToArrive(1500);
      setParkingTime(0);
      return;
    }

    const interval = setInterval(() => {
      if (!hasArrived) {
        setTimeToArrive((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setActiveModal('expired');
            handleCancelBooking(false);
            return 0;
          }
          return prev - 1;
        });
      } else {
        if (activeModal !== 'departure') {
          setParkingTime((prev) => prev + 1);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookedSpotId, hasArrived, activeModal]);

  // 3-second departure request watcher
  useEffect(() => {
    if (activeModal === 'departure' && departurePhase === 'requesting') {
      const timer = setTimeout(() => {
        setDeparturePhase('confirmed');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeModal, departurePhase]);

  const handleCancelBooking = (showFeedback = true) => {
    setBookedSpotId(null);
    setBookedSpot(null);
    setHasArrived(false);
    setTimeToArrive(1800);
    setParkingTime(0);
    hasDrawnRoute.current = false;
    clearRouteOnMap();
    if (coords) {
      const filtered = buildMarkersPayload(selectedVehicle, coords, null);
      sendMarkersToMap(filtered);
    }
    if (showFeedback) {
      setActiveModal('cancel_success');
    }
  };

  const handleCancelBookingPress = () => {
    setActiveModal('cancel_confirm');
  };

  const simulateArrival = () => {
    setHasArrived(true);
    setActiveModal('arrived');
  };

  const handleRequestDeparturePress = () => {
    if (!bookedSpot) return;
    setFinalOccupiedTime(parkingTime);

    const hourlyRate = (bookedSpot.prices as Record<string, number>)[selectedVehicle] ?? 0;
    // Reservation fee covers the first 30 minutes (1800 seconds) of parking free of charge
    const billableTime = Math.max(0, parkingTime - 1800);
    const computedFee = (billableTime / 3600) * hourlyRate;
    const amount = Number(computedFee.toFixed(2));
    setFinalAmount(amount);

    setDeparturePhase('requesting');
    setActiveModal('departure');
  };

  const handleDepartureComplete = () => {
    setActiveModal(null);
    setBookedSpotId(null);
    setBookedSpot(null);
    setHasArrived(false);
    setTimeToArrive(1800);
    setParkingTime(0);
    hasDrawnRoute.current = false;
    clearRouteOnMap();
    if (coords) {
      const filtered = buildMarkersPayload(selectedVehicle, coords, null);
      sendMarkersToMap(filtered);
    }
  };

  const submitReview = () => {
    setActiveModal('review_success');
  };

  // Post location coordinates to Leaflet map inside iframe or Webview
  const sendLocationToMap = (lat: number, lng: number, zoom = 16, shouldCenter = true) => {
    const message = JSON.stringify({ type: 'setCenter', lat, lng, zoom, shouldCenter });
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

  const drawRouteOnMap = (userLat: number, userLng: number, spotLat: number, spotLng: number, fitBounds = false) => {
    const message = JSON.stringify({ type: 'drawRoute', userLat, userLng, spotLat, spotLng, fitBounds });
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

  const clearRouteOnMap = () => {
    const message = JSON.stringify({ type: 'clearRoute' });
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

  // Send message to map to center on specific spot and open its details popup
  const focusSpotOnMap = (spaceId: string) => {
    const message = JSON.stringify({ type: 'focusSpot', spotId: spaceId, zoom: 17 });
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
  const buildMarkersPayload = (
    vehicleId: string,
    userCoords: { latitude: number; longitude: number },
    overrideBookedSpotId?: string | null
  ) => {
    const vehicleObj = VEHICLES.find((v) => v.id === vehicleId);
    const vehicleLabel = vehicleObj ? vehicleObj.name : 'Vehicle';

    const activeSpotId = overrideBookedSpotId !== undefined ? overrideBookedSpotId : bookedSpotId;

    // Only display the booked space if booked, otherwise filter by vehicle suitability and active filters
    let targetSpaces = activeSpotId
      ? BASE_PARKING_SPACES.filter(spot => spot.id === activeSpotId)
      : BASE_PARKING_SPACES.filter((spot) => spot.vehicles.includes(vehicleId));

    if (!activeSpotId) {
      if (hideFullSpaces) {
        targetSpaces = targetSpaces.filter((spot) => spot.slots > 0);
      }
      if (maxPrice < 200) {
        targetSpaces = targetSpaces.filter((spot) => {
          const price = (spot.prices as Record<string, number>)[vehicleId] ?? 0;
          return price <= maxPrice;
        });
      }
      if (minStars > 0) {
        targetSpaces = targetSpaces.filter((spot) => spot.rating >= minStars);
      }
      if (selectedAmenities.length > 0) {
        targetSpaces = targetSpaces.filter((spot) =>
          selectedAmenities.every((amenity) => spot.amenities.includes(amenity))
        );
      }
    }

    return targetSpaces
      .map((spot) => ({
        id: spot.id,
        name: spot.name,
        latitude: userCoords.latitude + spot.offsetLat,
        longitude: userCoords.longitude + spot.offsetLng,
        price: `₱${(spot.prices as Record<string, number>)[vehicleId] ?? 0}/hr`,
        priceNum: (spot.prices as Record<string, number>)[vehicleId] ?? 0,
        vehicleLabel,
        slots: spot.slots,
        amenities: spot.amenities,
        allVehicles: spot.vehicles.map((vid) => {
          const v = VEHICLES.find((vv) => vv.id === vid);
          return v ? `${v.emoji} ${v.name}` : vid;
        }),
        vehicles: spot.vehicles,
        prices: spot.prices,
        image: spot.image,
        images: (spot as any).images,
        description: spot.description,
        location: 'Metro Manila, Philippines',
        rating: spot.rating || 4.5,
        reviewCount: spot.reviewCount || 3,
      }));
  };

  const syncMapLocation = () => {
    if (coords) {
      setTimeout(() => {
        sendLocationToMap(coords.latitude, coords.longitude, 16, !hasCenteredInitial.current);
        if (!hasCenteredInitial.current) {
          hasCenteredInitial.current = true;
        }
        const filtered = buildMarkersPayload(selectedVehicle, coords);
        sendMarkersToMap(filtered);

        // Draw route if booked
        if (bookedSpotId) {
          const spot = BASE_PARKING_SPACES.find(s => s.id === bookedSpotId);
          if (spot) {
            const spotLat = coords.latitude + spot.offsetLat;
            const spotLng = coords.longitude + spot.offsetLng;
            drawRouteOnMap(coords.latitude, coords.longitude, spotLat, spotLng, !hasDrawnRoute.current);
            hasDrawnRoute.current = true;
          }
        }
      }, 500);
    }
  };

  useEffect(() => {
    if (coords) {
      sendLocationToMap(coords.latitude, coords.longitude, 16, !hasCenteredInitial.current);
      if (!hasCenteredInitial.current) {
        hasCenteredInitial.current = true;
      }
      const filtered = buildMarkersPayload(selectedVehicle, coords);
      sendMarkersToMap(filtered);

      if (bookedSpotId) {
        const spot = BASE_PARKING_SPACES.find(s => s.id === bookedSpotId);
        if (spot) {
          const spotLat = coords.latitude + spot.offsetLat;
          const spotLng = coords.longitude + spot.offsetLng;
          drawRouteOnMap(coords.latitude, coords.longitude, spotLat, spotLng, !hasDrawnRoute.current);
          hasDrawnRoute.current = true;
        }
      }
    }
  }, [coords, bookedSpotId]);

  // Dynamically update map markers when vehicle type selection or filters change
  useEffect(() => {
    if (coords) {
      const filtered = buildMarkersPayload(selectedVehicle, coords);
      const timer = setTimeout(() => {
        sendMarkersToMap(filtered);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedVehicle, hideFullSpaces, maxPrice, minStars, selectedAmenities.join(',')]);

  // Listen for viewMore messages from the iframe on web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'viewMore' && data.spot) {
          openParkingDetails(data.spot);
        } else if (data && data.type === 'viewDirections') {
          setViewMoreHtml(null); // Close the detail Modal
          if (data.spotId) {
            const spot = BASE_PARKING_SPACES.find(s => s.id === data.spotId);
            if (spot) {
              setBookedSpot(spot);
              setBookedSpotId(data.spotId);
              setHasArrived(false);
              setTimeToArrive(1800);
              setParkingTime(0);
              hasDrawnRoute.current = false;

              setTimeout(() => {
                focusSpotOnMap(data.spotId);
                if (coords) {
                  const spotLat = coords.latitude + spot.offsetLat;
                  const spotLng = coords.longitude + spot.offsetLng;
                  drawRouteOnMap(coords.latitude, coords.longitude, spotLat, spotLng, true);
                  hasDrawnRoute.current = true;
                }
              }, 500);
            }
          }
        } else if (data && data.type === 'cancelBooking') {
          setViewMoreHtml(null); // Close modal if open
          handleCancelBooking(false);
        } else if (data && data.type === 'requestDeparture') {
          setViewMoreHtml(null); // Close modal if open
          handleRequestDeparturePress();
        } else if (data && data.type === 'noSlotsError') {
          setViewMoreHtml(null); // Close modal if open
          setNoSlotsSpotName(data.spotName || '');
          setActiveModal('no_slots');
        }
      } catch (e) {
        // Silent catch
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [bookedSpotId, hasArrived, selectedVehicle, coords]);

  // Handle messages from native WebView
  const handleNativeMessage = (event: any) => {
    try {
      const data = typeof event.nativeEvent.data === 'string'
        ? JSON.parse(event.nativeEvent.data)
        : event.nativeEvent.data;
      if (data && data.type === 'viewMore' && data.spot) {
        openParkingDetails(data.spot);
      } else if (data && data.type === 'viewDirections') {
        setViewMoreHtml(null); // Close the detail Modal
        if (data.spotId) {
          const spot = BASE_PARKING_SPACES.find(s => s.id === data.spotId);
          if (spot) {
            setBookedSpot(spot);
            setBookedSpotId(data.spotId);
            setHasArrived(false);
            setTimeToArrive(1800);
            setParkingTime(0);
            hasDrawnRoute.current = false;

            setTimeout(() => {
              focusSpotOnMap(data.spotId);
              if (coords) {
                const spotLat = coords.latitude + spot.offsetLat;
                const spotLng = coords.longitude + spot.offsetLng;
                drawRouteOnMap(coords.latitude, coords.longitude, spotLat, spotLng, true);
                hasDrawnRoute.current = true;
              }
            }, 500);
          }
        }
      } else if (data && data.type === 'cancelBooking') {
        setViewMoreHtml(null); // Close modal if open
        handleCancelBooking(false);
      } else if (data && data.type === 'requestDeparture') {
        setViewMoreHtml(null); // Close modal if open
        handleRequestDeparturePress();
      } else if (data && data.type === 'noSlotsError') {
        setViewMoreHtml(null); // Close modal if open
        setNoSlotsSpotName(data.spotName || '');
        setActiveModal('no_slots');
      }
    } catch (e) {
      // Silent catch
    }
  };

  const handleRecenter = async () => {
    const freshCoords = await requestLocation();
    const activeCoords = freshCoords || coords;
    if (activeCoords) {
      sendLocationToMap(activeCoords.latitude, activeCoords.longitude, 16, true);
      if (bookedSpotId) {
        const spot = BASE_PARKING_SPACES.find(s => s.id === bookedSpotId);
        if (spot) {
          const spotLat = activeCoords.latitude + spot.offsetLat;
          const spotLng = activeCoords.longitude + spot.offsetLng;
          drawRouteOnMap(activeCoords.latitude, activeCoords.longitude, spotLat, spotLng, true);
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setSearchError(null);
    setSearchLoading(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchLoading(false);
      setSearchError("No Results Found");
    }, 3000);
  };

  const handleCollapseSearch = () => {
    Keyboard.dismiss();
    setIsSearchExpanded(false);
    setSearchQuery('');
    setSearchLoading(false);
    setSearchError(null);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const toggleSidebar = (open: boolean) => {
    if (open) {
      setIsSidebarOpen(true);
    }
    Animated.spring(sidebarTranslateX, {
      toValue: open ? 0 : -300,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) {
        setIsSidebarOpen(false);
      }
    });
  };

  const handleSpacePress = (spaceName: string) => {
    console.log(`Clicked past space: ${spaceName}`);
  };

  // Wallet functions
  const handleWalletAddMoney = () => {
    const amountNum = parseFloat(walletAmount);
    if (!walletProvider) {
      Alert.alert('Payment Provider Required', 'Please select either GCash or Maya.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to deposit.');
      return;
    }
    if (!walletPhone.trim() || walletPhone.trim().length < 10) {
      Alert.alert('Account Required', 'Please enter a valid mobile number for your payment provider account.');
      return;
    }

    setWalletLoading(true);
    setTimeout(() => {
      setWalletLoading(false);
      setWalletBalance(prev => prev + amountNum);
      const newTx = {
        id: `tx-${Date.now()}`,
        title: `${walletProvider === 'gcash' ? 'GCash' : 'Maya'} Top-up`,
        type: 'topup',
        provider: walletProvider === 'gcash' ? 'GCash' : 'Maya',
        amount: amountNum,
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        status: 'Completed',
      };
      setTransactionsList(prev => [newTx, ...prev]);
      setWalletSuccess(true);
    }, 3000);
  };

  const handleWalletWithdraw = () => {
    const amountNum = parseFloat(walletAmount);
    if (!walletProvider) {
      Alert.alert('Transfer Provider Required', 'Please select either GCash or Maya.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }
    if (amountNum > walletBalance) {
      Alert.alert('Insufficient Funds', 'Your withdrawal request exceeds your current wallet balance.');
      return;
    }
    if (!walletPhone.trim() || walletPhone.trim().length < 10) {
      Alert.alert('Account Required', 'Please enter a valid mobile number to transfer funds to.');
      return;
    }

    setWalletLoading(true);
    setTimeout(() => {
      setWalletLoading(false);
      setWalletBalance(prev => prev - amountNum);
      const newTx = {
        id: `tx-${Date.now()}`,
        title: `${walletProvider === 'gcash' ? 'GCash' : 'Maya'} Withdrawal`,
        type: 'withdrawal',
        provider: walletProvider === 'gcash' ? 'GCash' : 'Maya',
        amount: amountNum,
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        status: 'Completed',
      };
      setTransactionsList(prev => [newTx, ...prev]);
      setWalletSuccess(true);
    }, 3000);
  };

  // Account Functions
  const handleStartEditProfile = () => {
    setProfileEditName(userProfile.name);
    setProfileEditEmail(userProfile.email);
    setProfileEditPhone(userProfile.phone);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (!profileEditName.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    setUserProfile({
      ...userProfile,
      name: profileEditName.trim(),
      email: profileEditEmail.trim(),
      phone: profileEditPhone.trim(),
    });
    setIsEditingProfile(false);
  };

  const handleAddVehicle = () => {
    if (!newVehiclePlate.trim()) {
      Alert.alert('Validation Error', 'Please enter a vehicle plate number.');
      return;
    }
    if (!newVehicleModel.trim()) {
      Alert.alert('Validation Error', 'Please enter a brand and model name.');
      return;
    }

    const newV = {
      id: `v-${Date.now()}`,
      type: newVehicleType,
      plateNumber: newVehiclePlate.trim().toUpperCase(),
      brandModel: newVehicleModel.trim(),
    };

    setRegisteredVehicles(prev => [...prev, newV]);
    setNewVehiclePlate('');
    setNewVehicleModel('');
    setShowAddVehicleForm(false);
  };

  const handleDeleteVehicle = (id: string) => {
    if (registeredVehicles.length <= 1) {
      Alert.alert('Action Blocked', 'You must have at least one registered vehicle.');
      return;
    }
    Alert.alert(
      'Remove Vehicle',
      'Are you sure you want to remove this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setRegisteredVehicles(prev => prev.filter(v => v.id !== id));
          }
        }
      ]
    );
  };

  const renderWalletTab = () => {
    if (walletLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300, padding: 20 }}>
          <ActivityIndicator color={BrandColors.teal} size="large" />
          <Text style={{ marginTop: 20, fontSize: 16, fontWeight: '800', color: '#263f4f' }}>
            Processing Transaction...
          </Text>
          <Text style={{ marginTop: 8, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
            Please wait while we securely process your wallet update.
          </Text>
        </View>
      );
    }

    if (walletSuccess) {
      const isAdd = walletModal === 'add';
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 320, padding: 20 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(10,124,110,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 32, color: BrandColors.teal }}>✓</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#263f4f', marginBottom: 8, textAlign: 'center' }}>
            Transaction Successful!
          </Text>
          <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            Successfully {isAdd ? 'added' : 'withdrawn'} ₱{parseFloat(walletAmount).toFixed(2)} via {walletProvider === 'gcash' ? 'GCash' : 'Maya'}. Your new balance is ₱{walletBalance.toFixed(2)}.
          </Text>
          <TouchableOpacity
            style={[styles.modalPrimaryBtn, { width: '100%' }]}
            onPress={() => {
              setWalletSuccess(false);
              setWalletModal(null);
              setWalletAmount('');
              setWalletPhone('');
              setWalletProvider(null);
            }}
          >
            <Text style={styles.modalPrimaryText}>Got it</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (walletModal === 'add' || walletModal === 'withdraw') {
      const isAdd = walletModal === 'add';
      const canSubmit = walletProvider !== null && walletAmount.trim() !== '' && walletPhone.trim() !== '';

      return (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={styles.walletSectionHeader}>{isAdd ? 'Deposit Funds' : 'Withdraw Funds'}</Text>
            <TouchableOpacity onPress={() => { setWalletModal(null); setWalletAmount(''); setWalletProvider(null); setWalletPhone(''); }}>
              <Text style={{ color: BrandColors.orange, fontWeight: '800', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.walletFormCard}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Enter Amount (PHP)</Text>
            <View style={styles.walletInputContainer}>
              <Text style={styles.walletInputPrefix}>₱</Text>
              <TextInput
                style={styles.walletInput}
                placeholder="0.00"
                placeholderTextColor="#cbd5e1"
                keyboardType="numeric"
                value={walletAmount}
                onChangeText={setWalletAmount}
              />
            </View>

            {isAdd && (
              <View style={styles.quickAmountsRow}>
                {['100', '200', '500', '1000'].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.quickAmountPill}
                    onPress={() => setWalletAmount(amt)}
                  >
                    <Text style={styles.quickAmountText}>+ ₱{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 10, marginTop: 8 }}>
              Select Payment Provider
            </Text>
            <View style={styles.providerChooser}>
              <TouchableOpacity
                style={[styles.providerPill, walletProvider === 'gcash' && styles.activeProviderPill]}
                onPress={() => setWalletProvider('gcash')}
              >
                <Image
                  source={require('@/assets/images/gcash.png')}
                  style={styles.providerLogoImage}
                  contentFit="contain"
                />
                <Text style={styles.providerSubText}>E-Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.providerPill, walletProvider === 'paymaya' && styles.activeProviderPill]}
                onPress={() => setWalletProvider('paymaya')}
              >
                <Image
                  source={require('@/assets/images/paymaya.png')}
                  style={styles.providerLogoImage}
                  contentFit="contain"
                />
                <Text style={styles.providerSubText}>E-Wallet</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 }}>
              Mobile Account Number
            </Text>
            <TextInput
              style={styles.walletTextInput}
              placeholder="e.g. 09171234567"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={walletPhone}
              onChangeText={setWalletPhone}
            />

            <TouchableOpacity
              style={[
                styles.modalPrimaryBtn,
                { marginTop: 12, opacity: canSubmit ? 1 : 0.6 }
              ]}
              disabled={!canSubmit}
              onPress={isAdd ? handleWalletAddMoney : handleWalletWithdraw}
            >
              <Text style={styles.modalPrimaryText}>
                {isAdd ? 'Add Money' : 'Withdraw Money'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View>
        {/* Wallet Balance Card */}
        <View style={styles.walletBalanceCard}>
          <Text style={styles.walletBalanceLabel}>Available Wallet Balance</Text>
          <Text style={styles.walletBalanceVal}>₱{walletBalance.toFixed(2)}</Text>
          <Text style={{ position: 'absolute', right: 20, top: 20, fontSize: 36, opacity: 0.15 }}>💳</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.walletActionsRow}>
          <TouchableOpacity
            style={[styles.walletBtn, styles.walletAddBtn]}
            onPress={() => {
              setWalletModal('add');
              setWalletPhone(userProfile.phone.replace(/[^0-9]/g, ''));
            }}
          >
            <Text style={[styles.walletBtnText, { color: '#ffffff' }]}>➕ Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.walletBtn, styles.walletWithdrawBtn]}
            onPress={() => {
              setWalletModal('withdraw');
              setWalletPhone(userProfile.phone.replace(/[^0-9]/g, ''));
            }}
          >
            <Text style={[styles.walletBtnText, { color: '#263f4f' }]}>📤 Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* History Snippet */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={styles.walletSectionHeader}>Recent Activity</Text>
          <TouchableOpacity onPress={() => setActiveTab('transactions')}>
            <Text style={{ color: BrandColors.teal, fontWeight: '800', fontSize: 13 }}>View All</Text>
          </TouchableOpacity>
        </View>

        {transactionsList.slice(0, 3).map((tx) => {
          const isTopUp = tx.type === 'topup';
          return (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txLeft}>
                <View style={styles.txIconContainer}>
                  <Text style={{ fontSize: 18 }}>{isTopUp ? '📥' : '📤'}</Text>
                </View>
                <View>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmountText, { color: isTopUp ? '#0a7c6e' : BrandColors.orange }]}>
                  {isTopUp ? '+' : '-'} ₱{tx.amount.toFixed(2)}
                </Text>
                <Text style={styles.txStatusText}>{tx.status}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderTransactionsTab = () => {
    const filteredTransactions = transactionsList.filter((tx) => {
      const matchesSearch = tx.title.toLowerCase().includes(txSearch.toLowerCase());
      if (txFilter === 'all') return matchesSearch;
      if (txFilter === 'parking') return matchesSearch && tx.type === 'parking';
      if (txFilter === 'wallet') return matchesSearch && (tx.type === 'topup' || tx.type === 'withdrawal');
      return matchesSearch;
    });

    return (
      <View>
        {/* Search */}
        <View style={styles.txSearchContainer}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' } as any}
            size={18}
            tintColor="#94a3b8"
            fallback={<SearchIcon tintColor="#94a3b8" size={18} />}
          />
          <TextInput
            style={styles.txSearchInput}
            value={txSearch}
            onChangeText={setTxSearch}
            placeholder="Search by description..."
            placeholderTextColor="#94a3b8"
          />
          {txSearch.length > 0 && (
            <TouchableOpacity onPress={() => setTxSearch('')} style={{ padding: 4 }}>
              <Text style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 13 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.txFiltersRow}>
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'parking', label: 'Parking' },
            { id: 'wallet', label: 'E-Wallet' },
          ].map((pill) => {
            const isActive = txFilter === pill.id;
            return (
              <TouchableOpacity
                key={pill.id}
                style={[styles.txFilterPill, isActive && styles.activeTxFilterPill]}
                onPress={() => setTxFilter(pill.id as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.txFilterPillText, isActive && styles.activeTxFilterPillText]}>
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List */}
        {filteredTransactions.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '600' }}>No transactions match your search.</Text>
          </View>
        ) : (
          filteredTransactions.map((tx) => {
            const isTopUp = tx.type === 'topup';
            const isWithdraw = tx.type === 'withdrawal';
            return (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txLeft}>
                  <View style={styles.txIconContainer}>
                    <Text style={{ fontSize: 18 }}>
                      {isTopUp ? '📥' : isWithdraw ? '📤' : '🚗'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.txTitle} numberOfLines={2}>{tx.title}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmountText, { color: isTopUp ? '#0a7c6e' : BrandColors.orange }]}>
                    {isTopUp ? '+' : '-'} ₱{tx.amount.toFixed(2)}
                  </Text>
                  <Text style={styles.txStatusText}>{tx.status}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

  const renderAccountTab = () => {
    return (
      <View>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarContainer}>
            <Image
              source={{ uri: userProfile.avatar }}
              style={styles.profileAvatar}
            />
          </View>

          {isEditingProfile ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <TextInput
                style={styles.profileInput}
                placeholder="Full Name"
                placeholderTextColor="#cbd5e1"
                value={profileEditName}
                onChangeText={setProfileEditName}
              />
              <TextInput
                style={styles.profileInput}
                placeholder="Email Address"
                placeholderTextColor="#cbd5e1"
                keyboardType="email-address"
                autoCapitalize="none"
                value={profileEditEmail}
                onChangeText={setProfileEditEmail}
              />
              <TextInput
                style={styles.profileInput}
                placeholder="Mobile Number"
                placeholderTextColor="#cbd5e1"
                keyboardType="phone-pad"
                value={profileEditPhone}
                onChangeText={setProfileEditPhone}
              />
              <View style={styles.profileEditActions}>
                <TouchableOpacity
                  style={[styles.modalSecondaryBtn, { flex: 1 }]}
                  onPress={() => setIsEditingProfile(false)}
                >
                  <Text style={styles.modalSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalPrimaryBtn, { flex: 1.2 }]}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.modalPrimaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <Text style={styles.profileDetailText}>✉ {userProfile.email}</Text>
              <Text style={styles.profileDetailText}>📱 {userProfile.phone}</Text>
              <TouchableOpacity
                style={styles.profileEditBtn}
                onPress={handleStartEditProfile}
              >
                <Text style={styles.profileEditBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Registered Vehicles */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={styles.walletSectionHeader}>Registered Vehicles</Text>
          <TouchableOpacity onPress={() => setShowAddVehicleForm(prev => !prev)}>
            <Text style={{ color: BrandColors.teal, fontWeight: '800', fontSize: 13 }}>
              {showAddVehicleForm ? 'Cancel' : '+ Add Vehicle'}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddVehicleForm && (
          <View style={styles.vehicleFormContainer}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Vehicle Type</Text>
            <View style={styles.vehicleTypeSelector}>
              {VEHICLES.map((vehicle) => {
                const isActive = newVehicleType === vehicle.id;
                return (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[styles.vehicleTypeBtn, isActive && styles.activeVehicleTypeBtn]}
                    onPress={() => setNewVehicleType(vehicle.id)}
                  >
                    <Text style={[styles.vehicleTypeBtnText, isActive && styles.activeVehicleTypeBtnText]}>
                      {vehicle.emoji} {vehicle.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Plate Number</Text>
            <TextInput
              style={styles.profileInput}
              placeholder="e.g. NUI 9821"
              placeholderTextColor="#cbd5e1"
              autoCapitalize="characters"
              value={newVehiclePlate}
              onChangeText={setNewVehiclePlate}
            />

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Brand & Model</Text>
            <TextInput
              style={styles.profileInput}
              placeholder="e.g. Toyota Vios"
              placeholderTextColor="#cbd5e1"
              value={newVehicleModel}
              onChangeText={setNewVehicleModel}
            />

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 8 }]}
              onPress={handleAddVehicle}
            >
              <Text style={styles.modalPrimaryText}>Save Vehicle</Text>
            </TouchableOpacity>
          </View>
        )}

        {registeredVehicles.map((vehicle) => {
          const vObj = VEHICLES.find(v => v.id === vehicle.type);
          const emoji = vObj ? vObj.emoji : '🚗';
          return (
            <View key={vehicle.id} style={styles.vehicleCard}>
              <View style={styles.vehicleIconContainer}>
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
              </View>
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleBrand}>{vehicle.brandModel}</Text>
                <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>
              </View>
              <TouchableOpacity
                style={styles.vehicleDeleteBtn}
                onPress={() => handleDeleteVehicle(vehicle.id)}
              >
                <Text style={styles.vehicleDeleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Favorite Parking Spots */}
        <Text style={[styles.walletSectionHeader, { marginTop: 20, marginBottom: 12 }]}>Favorite Parking Spots</Text>
        {BASE_PARKING_SPACES.slice(0, 3).map((space) => (
          <TouchableOpacity
            key={space.id}
            style={styles.favSpotItem}
            onPress={() => {
              setActiveTab('map');
              setTimeout(() => {
                focusSpotOnMap(space.id);
              }, 100);
            }}
          >
            <View style={styles.favSpotIconContainer}>
              <Text style={{ fontSize: 16 }}>⭐</Text>
            </View>
            <Text style={styles.favSpotName}>{space.name}</Text>
            <Text style={styles.favSpotArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSettingsTab = () => {
    const faqList = [
      {
        q: 'How do I book a parking space?',
        a: 'Navigate back to the Map. Tap on any orange price badge on the map. This opens the parking space details sheet at the bottom. Tap "Book Slot", choose your vehicle, and tap "Confirm Booking". You will have 30 minutes to arrive.'
      },
      {
        q: 'Can I pay using GCash or Maya?',
        a: 'Yes! Navigate to the My Wallet tab, click "Add Money", choose either GCash or Maya, and enter your amount and phone number to simulate loading funds. When you depart from a space, the total parking fee is auto-debited from your wallet balance.'
      },
      {
        q: 'What happens if I do not arrive in 30 minutes?',
        a: 'Your slot booking reservation expires automatically after 30 minutes to allow other users to book the spot. The reservation fee is non-refundable.'
      },
      {
        q: 'How do I add or delete registered vehicles?',
        a: 'Go to the Account tab and scroll to "Registered Vehicles". Click "+ Add Vehicle" to add one, or press the red "✕" icon on any vehicle card to delete it. You must always keep at least one registered vehicle.'
      }
    ];

    const isEn = settingsLanguage === 'en';

    return (
      <View>
        <Text style={[styles.walletSectionHeader, { marginTop: 0 }]}>App Preferences</Text>
        <View style={styles.settingsSection}>
          {/* Notifications */}
          <View style={[styles.settingsRow, styles.settingsRowBorder]}>
            <View style={styles.settingsLabelContainer}>
              <Text style={styles.settingsLabel}>Push Notifications</Text>
              <Text style={styles.settingsSubLabel}>Receive updates about your booking status and receipts.</Text>
            </View>
            <Switch
              value={settingsNotifications}
              onValueChange={setSettingsNotifications}
              trackColor={{ false: '#cbd5e1', true: BrandColors.teal }}
            />
          </View>

          {/* Email Receipts */}
          <View style={[styles.settingsRow, styles.settingsRowBorder]}>
            <View style={styles.settingsLabelContainer}>
              <Text style={styles.settingsLabel}>Email Receipts</Text>
              <Text style={styles.settingsSubLabel}>Send detailed receipts to your registered email.</Text>
            </View>
            <Switch
              value={settingsReceipts}
              onValueChange={setSettingsReceipts}
              trackColor={{ false: '#cbd5e1', true: BrandColors.teal }}
            />
          </View>

          {/* Location Access */}
          <View style={[styles.settingsRow, styles.settingsRowBorder]}>
            <View style={styles.settingsLabelContainer}>
              <Text style={styles.settingsLabel}>Location Permission</Text>
              <Text style={styles.settingsSubLabel}>Allow Kanto to access your GPS location for navigation.</Text>
            </View>
            <Switch
              value={settingsLocation}
              onValueChange={setSettingsLocation}
              trackColor={{ false: '#cbd5e1', true: BrandColors.teal }}
            />
          </View>

          {/* Language Selection */}
          <View style={styles.settingsRow}>
            <View style={styles.settingsLabelContainer}>
              <Text style={styles.settingsLabel}>Language</Text>
              <Text style={styles.settingsSubLabel}>Toggle the preferred app interface language.</Text>
            </View>
            <View style={styles.langSelector}>
              <TouchableOpacity
                style={[styles.langBtn, isEn && styles.activeLangBtn]}
                onPress={() => setSettingsLanguage('en')}
              >
                <Text style={[styles.langBtnText, isEn && styles.activeLangBtnText]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, !isEn && styles.activeLangBtn]}
                onPress={() => setSettingsLanguage('tl')}
              >
                <Text style={[styles.langBtnText, !isEn && styles.activeLangBtnText]}>Tagalog</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.walletSectionHeader}>Frequently Asked Questions</Text>
        <View style={styles.settingsSection}>
          {faqList.map((faq, index) => {
            const isExpanded = expandedFaqIndex === index;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.faqItem, index === faqList.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => setExpandedFaqIndex(isExpanded ? null : index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Text style={styles.faqArrow}>{isExpanded ? '▲' : '▼'}</Text>
                </View>
                {isExpanded && (
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* App Info Footer */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appInfoText}>Kanto Parking App • v1.2.0</Text>
          <TouchableOpacity onPress={() => Alert.alert('Licensing', 'Kanto Parking is an open source initiative for smart city parking. © 2026.')}>
            <Text style={styles.appInfoLink}>Terms of Service & Licensing</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    let content = null;
    let title = '';

    switch (activeTab) {
      case 'account':
        content = renderAccountTab();
        title = 'Account';
        break;
      case 'wallet':
        content = renderWalletTab();
        title = 'My Wallet';
        break;
      case 'transactions':
        content = renderTransactionsTab();
        title = 'Transactions';
        break;
      case 'settings':
        content = renderSettingsTab();
        title = 'Settings';
        break;
      default:
        content = null;
        title = '';
    }

    return (
      <View style={styles.tabScreenContainer}>
        {/* Tab Header */}
        <View style={styles.tabScreenHeader}>
          <TouchableOpacity
            style={styles.tabScreenHeaderBackBtn}
            onPress={() => {
              setActiveTab('map');
              toggleSidebar(true);
            }}
            activeOpacity={0.7}
          >
            <SymbolView
              name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' } as any}
              size={18}
              tintColor={BrandColors.orange}
              fallback={<BackIcon tintColor={BrandColors.orange} size={18} />}
            />
            <Text style={styles.tabScreenHeaderBackText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.tabScreenHeaderTitle}>{title}</Text>
          <View style={{ width: 60 }} /> {/* balance back button */}
        </View>

        {/* Tab Content Body */}
        <ScrollView style={styles.tabScreenScroll} contentContainerStyle={styles.tabScreenContentContainer}>
          {content}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.mapContainer, activeTab !== 'map' && { display: 'none' }]}>
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
              onMessage={handleNativeMessage}
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

        {/* Search Panel / Search Button */}
        {isSearchExpanded ? (
          <View style={styles.searchBarContainer}>
            <View style={styles.searchRow}>
              <TouchableOpacity onPress={handleCollapseSearch} style={styles.searchRowBtn}>
                <SymbolView
                  name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' } as any}
                  size={20}
                  tintColor={BrandColors.navy}
                  fallback={<BackIcon tintColor={BrandColors.navy} size={20} />}
                />
              </TouchableOpacity>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (searchError) setSearchError(null);
                }}
                placeholder="Search location or area..."
                placeholderTextColor="#94a3b8"
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                autoFocus={true}
              />
              <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchRowBtn}>
                <SymbolView
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' } as any}
                  size={20}
                  tintColor={BrandColors.navy}
                  fallback={<SearchIcon tintColor={BrandColors.navy} size={20} />}
                />
              </TouchableOpacity>
            </View>
            
            {searchLoading && (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator color={BrandColors.teal} size="small" />
                <Text style={styles.searchLoadingText}>Searching for "{searchQuery}"...</Text>
              </View>
            )}
            
            {searchError && !searchLoading && (
              <View style={styles.searchErrorContainer}>
                <Text style={styles.searchErrorTitle}>{searchError}</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.hamburgerButton}
              onPress={() => toggleSidebar(true)}
              activeOpacity={0.8}
            >
              <SymbolView
                name={{ ios: 'line.3.horizontal', android: 'menu', web: 'menu' } as any}
                size={22}
                tintColor={BrandColors.navy}
                fallback={<HamburgerIcon tintColor={BrandColors.navy} size={22} />}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setIsSearchExpanded(true)}
              activeOpacity={0.8}
            >
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' } as any}
                size={22}
                tintColor={BrandColors.navy}
                fallback={<SearchIcon tintColor={BrandColors.navy} size={22} />}
              />
            </TouchableOpacity>
          </>
        )}

        {/* Sidebar Overlay and Drawer */}
        {isSidebarOpen && (
          <View style={styles.sidebarOverlay}>
            <TouchableWithoutFeedback onPress={() => toggleSidebar(false)}>
              <View style={styles.sidebarBackdrop} />
            </TouchableWithoutFeedback>
            
            <Animated.View style={[styles.sidebarDrawer, { transform: [{ translateX: sidebarTranslateX }] }]}>
              <View style={{ width: '100%' }}>
                {/* Drawer Header */}
                <View style={styles.sidebarHeader}>
                  <Text style={styles.sidebarLogoText}>kanto</Text>
                  <TouchableOpacity onPress={() => toggleSidebar(false)} style={styles.sidebarCloseBtn}>
                    <Text style={styles.sidebarCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Drawer Items */}
                <View style={styles.sidebarMenu}>
                  <TouchableOpacity style={styles.sidebarItem} onPress={() => { toggleSidebar(false); setActiveTab('account'); }}>
                    <View style={styles.sidebarIconWrapper}>
                      <SymbolView
                        name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' } as any}
                        size={30}
                        tintColor={BrandColors.navy}
                        fallback={<AccountIcon tintColor={BrandColors.navy} size={30} />}
                        style={{ width: 30, height: 30 }}
                      />
                    </View>
                    <Text style={styles.sidebarItemText}>Account</Text>
                  </TouchableOpacity>
 
                  <TouchableOpacity style={styles.sidebarItem} onPress={() => { toggleSidebar(false); setActiveTab('wallet'); }}>
                    <View style={styles.sidebarIconWrapper}>
                      <SymbolView
                        name={{ ios: 'creditcard', android: 'payment', web: 'payment' } as any}
                        size={30}
                        tintColor={BrandColors.navy}
                        fallback={<WalletIcon tintColor={BrandColors.navy} size={30} />}
                        style={{ width: 30, height: 30 }}
                      />
                    </View>
                    <Text style={styles.sidebarItemText}>My Wallet</Text>
                  </TouchableOpacity>
 
                  <TouchableOpacity style={styles.sidebarItem} onPress={() => { toggleSidebar(false); setActiveTab('transactions'); }}>
                    <View style={styles.sidebarIconWrapper}>
                      <SymbolView
                        name={{ ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' } as any}
                        size={30}
                        tintColor={BrandColors.navy}
                        fallback={<TransactionsIcon tintColor={BrandColors.navy} size={30} />}
                        style={{ width: 30, height: 30 }}
                      />
                    </View>
                    <Text style={styles.sidebarItemText}>Transactions</Text>
                  </TouchableOpacity>
 
                  <TouchableOpacity style={styles.sidebarItem} onPress={() => { toggleSidebar(false); setActiveTab('settings'); }}>
                    <View style={styles.sidebarIconWrapper}>
                      <SymbolView
                        name={{ ios: 'gearshape', android: 'settings', web: 'settings' } as any}
                        size={30}
                        tintColor={BrandColors.navy}
                        fallback={<SettingsIcon tintColor={BrandColors.navy} size={30} />}
                        style={{ width: 30, height: 30 }}
                      />
                    </View>
                    <Text style={styles.sidebarItemText}>Settings</Text>
                  </TouchableOpacity>
 
                  <TouchableOpacity
                    style={styles.sidebarLogoutItem}
                    onPress={() => {
                      toggleSidebar(false);
                      setActiveModal('logout');
                    }}
                  >
                    <View style={styles.sidebarIconWrapper}>
                      <SymbolView
                        name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' } as any}
                        size={30}
                        tintColor={BrandColors.orange}
                        fallback={<LogoutIcon tintColor={BrandColors.orange} size={30} />}
                        style={{ width: 30, height: 30 }}
                      />
                    </View>
                    <Text style={styles.sidebarLogoutText}>Log out</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Drawer Footer */}
              <View style={styles.sidebarFooter}>
                <Text style={styles.sidebarFooterText}>Kanto Parking v1.2.0</Text>
              </View>
            </Animated.View>
          </View>
        )}

        {/* Floating Controls - adjusted position to float above collapsed sheet */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setTempHideFullSpaces(hideFullSpaces);
            setTempMaxPrice(maxPrice);
            setTempMinStars(minStars);
            setTempSelectedAmenities([...selectedAmenities]);
            setActiveModal('filter');
          }}
          activeOpacity={0.8}
        >
          <SymbolView
            name={{ ios: 'slider.horizontal.3', android: 'filter_list', web: 'filter_list' } as any}
            size={22}
            tintColor={BrandColors.navy}
            fallback={<FilterIcon tintColor={BrandColors.navy} size={22} />}
          />
          {(hideFullSpaces || maxPrice < 200 || minStars > 0 || selectedAmenities.length > 0) && (
            <View style={styles.filterBadgeDot} />
          )}
        </TouchableOpacity>

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
            {bookedSpotId && bookedSpot ? (
              <View style={styles.sheetHeader}>
                <View style={styles.headerRow}>
                  <Text style={styles.headerTitle}>{bookedSpot.name}</Text>
                  <TouchableOpacity onPress={() => toggleSheet(false)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>Active Booking Details & Navigation</Text>
              </View>
            ) : (
              <View style={styles.sheetHeader}>
                <View style={styles.headerRow}>
                  <Text style={styles.headerTitle}>Hi! Ano'ng gusto mong i-park?</Text>
                  <TouchableOpacity onPress={() => toggleSheet(false)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>Select vehicle type to filter parking spaces.</Text>
              </View>
            )}
          </View>

          <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={true}>
            {bookedSpotId && bookedSpot ? (
              <View style={styles.bookedContainer}>
                {/* Space Info Card */}
                <TouchableOpacity
                  style={styles.bookedInfoCard}
                  onPress={() => openParkingDetails(bookedSpot)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: bookedSpot.image }}
                    style={styles.bookedSpaceImage}
                    contentFit="cover"
                  />
                  <View style={styles.bookedSpaceTextInfo}>
                    <Text style={styles.bookedSpaceName}>{bookedSpot.name}</Text>
                    <Text style={styles.bookedSpaceDescription} numberOfLines={2}>
                      {bookedSpot.description}
                    </Text>
                    <View style={styles.bookedRateRow}>
                      <Text style={styles.bookedRateLabel}>Rate: </Text>
                      <Text style={styles.bookedRateValue}>
                        ₱{(bookedSpot.prices as Record<string, number>)[selectedVehicle] ?? 0}/hr
                      </Text>
                    </View>
                    <View style={styles.bookedRateRow}>
                      <Text style={styles.bookedRateLabel}>Slots Available: </Text>
                      <Text style={[styles.bookedRateValue, { color: bookedSpot.slots > 0 ? BrandColors.teal : '#dc2626' }]}>
                        {bookedSpot.slots > 0 ? `${bookedSpot.slots} slots` : 'No slots'}
                      </Text>
                    </View>
                    <View style={styles.bookedVehicleRow}>
                      <Text style={styles.bookedVehicleLabel}>Vehicle: </Text>
                      <Text style={styles.bookedVehicleValue}>
                        {VEHICLES.find(v => v.id === selectedVehicle)?.emoji} {VEHICLES.find(v => v.id === selectedVehicle)?.name}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Timers Row */}
                <View style={styles.timerRow}>
                  {/* Countdown Timer */}
                  <View style={[styles.timerCard, hasArrived && styles.timerCardInactive]}>
                    <Text style={styles.timerCardTitle}>Time to Arrive</Text>
                    <Text style={[styles.timerCardValue, hasArrived && styles.timerValueDisabled]}>
                      {hasArrived ? 'Arrived 🅿️' : formatTimeToArrive(timeToArrive)}
                    </Text>
                    <Text style={styles.timerCardSubtitle}>
                      {hasArrived ? 'Arrived at space' : 'Arrive within 30 mins'}
                    </Text>
                  </View>

                  {/* Parking Stopwatch */}
                  <View style={[styles.timerCard, !hasArrived && styles.timerCardInactive]}>
                    <Text style={styles.timerCardTitle}>Parking Time</Text>
                    <Text style={[styles.timerCardValue, !hasArrived && styles.timerValueDisabled]}>
                      {hasArrived ? formatParkingTime(parkingTime) : '--:--:--'}
                    </Text>
                    <Text style={styles.timerCardSubtitle}>
                      {hasArrived ? 'Active session' : 'Starts upon arrival'}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  {!hasArrived ? (
                    <>
                      <TouchableOpacity
                        style={styles.simulateButton}
                        onPress={simulateArrival}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.simulateButtonText}>📍 Simulate GPS Arrival</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelBookingButton}
                        onPress={handleCancelBookingPress}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cancelBookingButtonText}>✕ Cancel Booking</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.departureButton}
                      onPress={handleRequestDeparturePress}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.departureButtonText}>🚗 Request for Departure</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <>
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

                {/* Recently Parked Spaces Section */}
                <View style={styles.pastSpacesSection}>
                  <Text style={styles.sectionTitle}>Recently Parked Spaces</Text>
                  {BASE_PARKING_SPACES.filter(
                    (spot) => RECENT_SPACES_IDS.includes(spot.id) && spot.vehicles.includes(selectedVehicle)
                  ).length === 0 ? (
                    <Text style={styles.noSpacesText}>No recently parked spaces for this vehicle type.</Text>
                  ) : (
                    BASE_PARKING_SPACES
                      .filter((spot) => RECENT_SPACES_IDS.includes(spot.id) && spot.vehicles.includes(selectedVehicle))
                      .map((space) => (
                        <TouchableOpacity
                          key={space.id}
                          style={styles.recentSpaceItem}
                          onPress={() => focusSpotOnMap(space.id)}
                          activeOpacity={0.75}
                        >
                          <View style={styles.recentSpaceLeft}>
                            <View style={styles.recentSpaceIconContainer}>
                              <Text style={styles.recentSpaceIcon}>🕒</Text>
                            </View>
                            <Text style={styles.recentSpaceName} numberOfLines={1}>
                              {space.name}
                            </Text>
                          </View>
                          <View style={styles.recentSpaceRight}>
                            <Text style={styles.recentSpaceArrow}>→</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
      {activeTab !== 'map' && renderTabContent()}
      {/* Full-screen parking detail modal */}
      {viewMoreHtml !== null && (Platform.OS === 'web' || WebView) && (
        <Modal
          visible={true}
          animationType="slide"
          onRequestClose={() => setViewMoreHtml(null)}
          statusBarTranslucent
        >
          <View style={{ flex: 1, backgroundColor: '#263f4f' }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingTop: Platform.OS === 'ios' ? 52 : Platform.OS === 'android' ? 44 : 16,
              paddingBottom: 12,
              paddingHorizontal: 16,
              backgroundColor: '#263f4f',
            }}>
              <TouchableOpacity
                onPress={() => setViewMoreHtml(null)}
                style={{
                  backgroundColor: 'rgba(242,146,33,0.15)',
                  borderWidth: 1.5, borderColor: 'rgba(242,146,33,0.4)',
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7,
                  marginRight: 12,
                }}
                activeOpacity={0.75}
              >
                <Text style={{ color: '#f29221', fontWeight: '800', fontSize: 13 }}>← Back</Text>
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, flex: 1 }} numberOfLines={1}>
                Parking Details
              </Text>
            </View>
            {Platform.OS === 'web' ? (
              <iframe
                srcDoc={viewMoreHtml}
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
                style={styles.iframe as any}
              />
            ) : (
              WebView && (
                <WebView
                  source={{ html: viewMoreHtml }}
                  style={{ flex: 1, backgroundColor: '#f1f5f9' }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  originWhitelist={['*']}
                  onMessage={handleNativeMessage}
                  mixedContentMode="always"
                  allowFileAccess={true}
                  allowUniversalAccessFromFileURLs={true}
                />
              )
            )}
          </View>
        </Modal>
      )}

      {/* Custom Modal overlay system */}
      {activeModal !== null && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <TouchableWithoutFeedback onPress={() => {
            if (activeModal === 'confirm_book' || activeModal === 'cancel_confirm' || activeModal === 'filter') {
              setActiveModal(null);
            }
          }}>
            <View style={styles.modalOverlayBackground} />
          </TouchableWithoutFeedback>

          <View style={styles.modalCard}>
            {activeModal === 'confirm_book' && modalTargetSpace && (
              <View>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Confirm Reservation</Text>
                  <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalDesc}>
                  Reserve a slot at <Text style={styles.boldText}>{modalTargetSpace.name}</Text> for your <Text style={styles.boldText}>{VEHICLES.find(v => v.id === selectedVehicle)?.name || 'vehicle'}</Text>. The reservation fee covers the first 30 minutes of parking free of charge.
                </Text>

                <View style={styles.bookingSummaryBox}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Vehicle Type:</Text>
                    <Text style={styles.summaryVal}>
                      {VEHICLES.find(v => v.id === selectedVehicle)?.emoji} {VEHICLES.find(v => v.id === selectedVehicle)?.name}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Hourly Rate:</Text>
                    <Text style={styles.summaryVal}>₱{modalTargetPrice}/hr</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Reservation Fee (30 mins):</Text>
                    <Text style={styles.summaryVal}>₱{(modalTargetPrice / 2).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryDivider]}>
                    <Text style={styles.summaryLabel}>Policy:</Text>
                    <Text style={[styles.summaryVal, { color: BrandColors.orange, fontWeight: '800' }]}>Non-refundable</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalSecondaryBtn, { flex: 1 }]} onPress={() => setActiveModal(null)}>
                    <Text style={styles.modalSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalPrimaryBtn, { flex: 1 }]} onPress={confirmBooking}>
                    <Text style={styles.modalPrimaryText}>Confirm & Pay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeModal === 'booking_confirmed' && (
              <View style={styles.centeredContent}>
                <View style={styles.modalIconContainer}>
                  <Text style={styles.modalSuccessIcon}>🎉</Text>
                </View>
                <Text style={styles.modalTitle}>Booking Confirmed!</Text>
                <Text style={[styles.modalDesc, { textAlign: 'center' }]}>
                  Successfully reserved a slot at <Text style={styles.boldText}>{bookedSpot?.name}</Text>. Please arrive within 30 minutes.
                </Text>

                <View style={[styles.bookingSummaryBox, { width: '100%', marginTop: Spacing.three, marginBottom: Spacing.one }]}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Parking Space:</Text>
                    <Text style={styles.summaryVal}>{bookedSpot?.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Vehicle Booked:</Text>
                    <Text style={styles.summaryVal}>
                      {VEHICLES.find(v => v.id === selectedVehicle)?.emoji} {VEHICLES.find(v => v.id === selectedVehicle)?.name}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={[styles.modalPrimaryBtn, { width: '100%', marginTop: Spacing.three }]} onPress={() => setActiveModal(null)}>
                  <Text style={styles.modalPrimaryText}>View Directions</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeModal === 'cancel_confirm' && (
              <View>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Cancel Reservation?</Text>
                  <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalDesc}>
                  Are you sure you want to cancel your slot reservation at <Text style={styles.boldText}>{bookedSpot?.name}</Text>?
                </Text>

                <View style={[styles.bookingSummaryBox, { borderColor: '#fca5a5', backgroundColor: '#fef2f2' }]}>
                  <Text style={{ color: '#dc2626', fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
                    ⚠️ Notice: Reservation fee (₱{bookedSpot ? ((bookedSpot.prices as Record<string, number>)[selectedVehicle] / 2).toFixed(2) : 0}) is non-refundable upon cancellation.
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalSecondaryBtn, { flex: 1 }]} onPress={() => setActiveModal(null)}>
                    <Text style={styles.modalSecondaryText}>Keep Booking</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalPrimaryBtn, { backgroundColor: '#dc2626', flex: 1 }]} onPress={() => handleCancelBooking(true)}>
                    <Text style={styles.modalPrimaryText}>Yes, Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeModal === 'cancel_success' && (
              <View style={styles.centeredContent}>
                <View style={[styles.modalIconContainer, { backgroundColor: '#fee2e2' }]}>
                  <Text style={[styles.modalSuccessIcon, { color: '#dc2626' }]}>✕</Text>
                </View>
                <Text style={styles.modalTitle}>Reservation Cancelled</Text>
                <Text style={[styles.modalDesc, { textAlign: 'center' }]}>
                  Your reservation was successfully cancelled. Note: The reservation fee is non-refundable.
                </Text>

                <TouchableOpacity style={[styles.modalPrimaryBtn, { width: '100%', marginTop: Spacing.three }]} onPress={() => setActiveModal(null)}>
                  <Text style={styles.modalPrimaryText}>Got it</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeModal === 'arrived' && (
              <View style={styles.centeredContent}>
                <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(10, 124, 110, 0.1)' }]}>
                  <Text style={styles.modalSuccessIcon}>🏁</Text>
                </View>
                <Text style={styles.modalTitle}>Arrived at Destination</Text>
                <Text style={[styles.modalDesc, { textAlign: 'center' }]}>
                  You have successfully arrived at your booked parking space at <Text style={styles.boldText}>{bookedSpot?.name}</Text>. Your parking duration stopwatch has started.
                </Text>

                <TouchableOpacity style={[styles.modalPrimaryBtn, { width: '100%', marginTop: Spacing.three }]} onPress={() => setActiveModal(null)}>
                  <Text style={styles.modalPrimaryText}>OK</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeModal === 'expired' && (
              <View style={styles.centeredContent}>
                <View style={[styles.modalIconContainer, { backgroundColor: '#fef3c7' }]}>
                  <Text style={styles.modalSuccessIcon}>⏰</Text>
                </View>
                <Text style={styles.modalTitle}>Booking Expired</Text>
                <Text style={[styles.modalDesc, { textAlign: 'center' }]}>
                  You did not arrive at <Text style={styles.boldText}>{bookedSpot?.name || 'the parking space'}</Text> in time. Your reservation has been cancelled. Note: Reservation fee is non-refundable.
                </Text>

                <TouchableOpacity style={[styles.modalPrimaryBtn, { width: '100%', marginTop: Spacing.three }]} onPress={() => setActiveModal(null)}>
                  <Text style={styles.modalPrimaryText}>Got it</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeModal === 'departure' && (
              <View style={styles.centeredContent}>
                {departurePhase === 'requesting' ? (
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={BrandColors.teal} style={{ marginBottom: Spacing.three }} />
                    <Text style={styles.modalTitle}>Requesting Departure</Text>
                    <Text style={[styles.modalDesc, { textAlign: 'center', marginBottom: Spacing.three }]}>
                      Waiting for Owner confirmation...
                    </Text>

                    <View style={[styles.bookingSummaryBox, { width: '100%' }]}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Vehicle Booked:</Text>
                        <Text style={styles.summaryVal}>
                          {VEHICLES.find(v => v.id === selectedVehicle)?.emoji} {VEHICLES.find(v => v.id === selectedVehicle)?.name}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Time Occupied:</Text>
                        <Text style={styles.summaryVal}>{formatParkingTime(finalOccupiedTime)}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Covered Time (Reservation):</Text>
                        <Text style={[styles.summaryVal, { color: BrandColors.teal }]}>First 30 mins (Free)</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Billable Time:</Text>
                        <Text style={styles.summaryVal}>
                          {formatParkingTime(Math.max(0, finalOccupiedTime - 1800))}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Hourly Rate:</Text>
                        <Text style={styles.summaryVal}>
                          ₱{bookedSpot ? (bookedSpot.prices as Record<string, number>)[selectedVehicle] ?? 0 : 0}/hr
                        </Text>
                      </View>
                      <View style={[styles.summaryRow, styles.summaryDivider]}>
                        <Text style={styles.summaryLabel}>Total Parking Fee:</Text>
                        <Text style={[styles.summaryVal, { color: BrandColors.teal, fontWeight: '900' }]}>
                          ₱{finalAmount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(10, 124, 110, 0.1)' }]}>
                      <Text style={styles.modalSuccessIcon}>
                        {VEHICLES.find(v => v.id === selectedVehicle)?.emoji || '🚗'}
                      </Text>
                    </View>
                    <Text style={styles.modalTitle}>Departure Approved!</Text>
                    <Text style={[styles.modalDesc, { textAlign: 'center', marginBottom: Spacing.three }]}>
                      Owner confirmed your departure and payment. Thank you for parking with us!
                    </Text>

                    <View style={[styles.bookingSummaryBox, { width: '100%' }]}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Vehicle Booked:</Text>
                        <Text style={styles.summaryVal}>
                          {VEHICLES.find(v => v.id === selectedVehicle)?.emoji} {VEHICLES.find(v => v.id === selectedVehicle)?.name}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Time Occupied:</Text>
                        <Text style={styles.summaryVal}>{formatParkingTime(finalOccupiedTime)}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Covered Time (Reservation):</Text>
                        <Text style={[styles.summaryVal, { color: BrandColors.teal }]}>First 30 mins (Free)</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Billable Time:</Text>
                        <Text style={styles.summaryVal}>
                          {formatParkingTime(Math.max(0, finalOccupiedTime - 1800))}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Paid:</Text>
                        <Text style={[styles.summaryVal, { color: BrandColors.teal, fontWeight: '900' }]}>
                          ₱{finalAmount.toFixed(2)}
                        </Text>
                      </View>
                      <View style={[styles.summaryRow, styles.summaryDivider]}>
                        <Text style={styles.summaryLabel}>Status:</Text>
                        <Text style={[styles.summaryVal, { color: BrandColors.teal, fontWeight: '900' }]}>
                          Paid & Complete
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.modalPrimaryBtn, { width: '100%' }]}
                      onPress={() => {
                        setRatingStars(5);
                        setRatingComment('');
                        setActiveModal('rate_parking');
                      }}
                    >
                      <Text style={styles.modalPrimaryText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {activeModal === 'rate_parking' && (
              <View style={styles.centeredContent}>
                <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(242, 146, 33, 0.1)' }]}>
                  <Text style={[styles.modalSuccessIcon, { color: BrandColors.orange }]}>⭐</Text>
                </View>
                <Text style={styles.modalTitle}>Rate Parking Space</Text>
                <Text style={[styles.modalDesc, { textAlign: 'center', marginBottom: Spacing.two }]}>
                  How was your experience at <Text style={styles.boldText}>{bookedSpot?.name || 'the parking space'}</Text>?
                </Text>

                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRatingStars(star)}
                      activeOpacity={0.7}
                      style={styles.starTouch}
                    >
                      <Text style={star <= ratingStars ? styles.starIconActive : styles.starIconInactive}>
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={[styles.commentInput, { width: '100%' }]}
                  placeholder="Share your experience (optional)..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  value={ratingComment}
                  onChangeText={setRatingComment}
                />

                <View style={[styles.modalActions, { width: '100%' }]}>
                  <TouchableOpacity style={[styles.modalSecondaryBtn, { flex: 1 }]} onPress={handleDepartureComplete}>
                    <Text style={styles.modalSecondaryText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalPrimaryBtn, { flex: 1.5 }]} onPress={submitReview}>
                    <Text style={styles.modalPrimaryText}>Submit Review</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeModal === 'review_success' && (
              <View style={styles.centeredContent}>
                <View style={styles.modalIconContainer}>
                  <Text style={styles.modalSuccessIcon}>🎉</Text>
                </View>
                <Text style={styles.modalTitle}>Review Submitted!</Text>
                <Text style={[styles.modalDesc, { textAlign: 'center' }]}>
                  Thank you for rating <Text style={styles.boldText}>{bookedSpot?.name || 'this space'}</Text> {ratingStars} stars!
                </Text>
                {ratingComment.trim().length > 0 && (
                  <View style={[styles.bookingSummaryBox, { width: '100%', marginTop: Spacing.two, marginBottom: Spacing.one, padding: Spacing.two }]}>
                    <Text style={[styles.summaryLabel, { marginBottom: 4 }]}>Your comment:</Text>
                    <Text style={[styles.summaryVal, { fontWeight: '500', color: '#475569', textAlign: 'left' }]} numberOfLines={3}>
                      "{ratingComment.trim()}"
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.modalPrimaryBtn, { width: '100%', marginTop: Spacing.three }]}
                  onPress={handleDepartureComplete}
                >
                  <Text style={styles.modalPrimaryText}>OK</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeModal === 'no_slots' && (
              <View style={styles.centeredContent}>
                <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(242, 146, 33, 0.1)', borderColor: BrandColors.orange }]}>
                  <Text style={[styles.modalSuccessIcon, { color: BrandColors.orange }]}>⚠️</Text>
                </View>
                <Text style={styles.modalTitle}>No Slots Available</Text>
                <Text style={[styles.modalDesc, { textAlign: 'center', marginBottom: Spacing.three }]}>
                  We are sorry, but <Text style={styles.boldText}>{noSlotsSpotName}</Text> is currently full. Please try booking another parking space.
                </Text>

                <TouchableOpacity
                  style={[styles.modalPrimaryBtn, { width: '100%', marginTop: Spacing.three }]}
                  onPress={() => setActiveModal(null)}
                >
                  <Text style={styles.modalPrimaryText}>OK</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeModal === 'filter' && (
              <View style={{ width: '100%' }}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filter Parking</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setTempHideFullSpaces(false);
                      setTempMaxPrice(200);
                      setTempMinStars(0);
                      setTempSelectedAmenities([]);
                    }}
                    style={styles.resetAllBtn}
                  >
                    <Text style={styles.resetAllText}>Reset All</Text>
                  </TouchableOpacity>
                </View>

                {/* Filter Section: Slots Toggle */}
                <View style={styles.filterRow}>
                  <View style={{ flex: 1, paddingRight: Spacing.two }}>
                    <Text style={styles.filterLabel}>Show Available Slots Only</Text>
                    <Text style={styles.filterSubLabel}>Hide parking spaces with 0 slots available</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#cbd5e1', true: BrandColors.teal }}
                    thumbColor={tempHideFullSpaces ? '#ffffff' : '#f4f3f4'}
                    ios_backgroundColor="#cbd5e1"
                    onValueChange={setTempHideFullSpaces}
                    value={tempHideFullSpaces}
                  />
                </View>

                <View style={styles.filterDivider} />

                {/* Filter Section: Price Range */}
                <View style={styles.filterSectionContainer}>
                  <Text style={styles.filterSectionTitle}>Max Price Per Hour</Text>
                  <View style={styles.priceAdjusterRow}>
                    <TouchableOpacity
                      style={styles.adjustBtn}
                      onPress={() => setTempMaxPrice((prev) => Math.max(10, prev === 200 ? 120 : prev - 5))}
                    >
                      <Text style={styles.adjustBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.adjustValue}>
                      {tempMaxPrice >= 200 ? 'Any Price' : `₱${tempMaxPrice}`}
                    </Text>
                    <TouchableOpacity
                      style={styles.adjustBtn}
                      onPress={() => setTempMaxPrice((prev) => (prev >= 120 ? 200 : prev + 5))}
                    >
                      <Text style={styles.adjustBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.presetRow}>
                    {[30, 50, 80, 200].map((val) => (
                      <TouchableOpacity
                        key={val}
                        style={[
                          styles.presetBtn,
                          tempMaxPrice === val && styles.activePresetBtn,
                        ]}
                        onPress={() => setTempMaxPrice(val)}
                      >
                        <Text
                          style={[
                            styles.presetBtnText,
                            tempMaxPrice === val && styles.activePresetBtnText,
                          ]}
                        >
                          {val === 200 ? 'Any' : `₱${val}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterDivider} />

                {/* Filter Section: Ratings */}
                <View style={styles.filterSectionContainer}>
                  <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                  <View style={styles.starsFilterRow}>
                    {[
                      { val: 0, label: 'Any' },
                      { val: 3, label: '3★+' },
                      { val: 4, label: '4★+' },
                      { val: 5, label: '5★' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.val}
                        style={[
                          styles.starFilterBtn,
                          tempMinStars === item.val && styles.activeStarFilterBtn,
                        ]}
                        onPress={() => setTempMinStars(item.val)}
                      >
                        <Text
                          style={[
                            styles.starFilterBtnText,
                            tempMinStars === item.val && styles.activeStarFilterBtnText,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterDivider} />

                {/* Filter Section: Amenities */}
                <View style={styles.filterSectionContainer}>
                  <Text style={styles.filterSectionTitle}>Amenities & Features</Text>
                  <View style={styles.amenitiesFilterGrid}>
                    {[
                      'Gated Property',
                      'CCTV Monitoring',
                      'Lighting',
                      'Covered Roof',
                      'Cement Pavement',
                      '24/7 Security',
                    ].map((amenity) => {
                      const isSelected = tempSelectedAmenities.includes(amenity);
                      return (
                        <TouchableOpacity
                          key={amenity}
                          style={[
                            styles.amenityFilterPill,
                            isSelected && styles.activeAmenityFilterPill,
                          ]}
                          onPress={() => {
                            if (isSelected) {
                              setTempSelectedAmenities((prev) =>
                                prev.filter((a) => a !== amenity)
                              );
                            } else {
                              setTempSelectedAmenities((prev) => [...prev, amenity]);
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.amenityFilterPillText,
                              isSelected && styles.activeAmenityFilterPillText,
                            ]}
                          >
                            {amenity}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={[styles.modalActions, { marginTop: Spacing.four }]}>
                  <TouchableOpacity
                    style={[styles.modalSecondaryBtn, { flex: 1 }]}
                    onPress={() => setActiveModal(null)}
                  >
                    <Text style={styles.modalSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalPrimaryBtn, { flex: 1.5 }]}
                    onPress={() => {
                      setHideFullSpaces(tempHideFullSpaces);
                      setMaxPrice(tempMaxPrice);
                      setMinStars(tempMinStars);
                      setSelectedAmenities(tempSelectedAmenities);
                      setActiveModal(null);
                    }}
                  >
                    <Text style={styles.modalPrimaryText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeModal === 'logout' && (
              <View>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Log out</Text>
                  <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalDesc}>
                  Are you sure you want to log out of <Text style={styles.boldText}>Kanto Parking</Text>?
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalSecondaryBtn, { flex: 1 }]} onPress={() => setActiveModal(null)}>
                    <Text style={styles.modalSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalPrimaryBtn, { backgroundColor: BrandColors.orange, flex: 1 }]} onPress={() => {
                    setActiveModal(null);
                    (global as any).updateAppState?.('auth');
                  }}>
                    <Text style={styles.modalPrimaryText}>Log out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
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
  recentSpaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(38, 63, 79, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: Spacing.two,
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  recentSpaceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recentSpaceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 124, 110, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSpaceIcon: {
    fontSize: 16,
  },
  recentSpaceName: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.navy,
    flex: 1,
  },
  recentSpaceRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSpaceArrow: {
    fontSize: 16,
    fontWeight: '900',
    color: BrandColors.teal,
  },
  noSpacesText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  // Active Booking Bottom Sheet Styles
  bookedContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  bookedInfoCard: {
    flexDirection: 'row',
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(38, 63, 79, 0.08)',
    padding: Spacing.three,
    gap: Spacing.three,
    marginBottom: Spacing.three,
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  bookedSpaceImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
  },
  bookedSpaceTextInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookedSpaceName: {
    fontSize: 16,
    fontWeight: '900',
    color: BrandColors.navy,
  },
  bookedSpaceDescription: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  bookedRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bookedRateLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  bookedRateValue: {
    fontSize: 13,
    color: BrandColors.orange,
    fontWeight: '900',
  },
  bookedVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bookedVehicleLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  bookedVehicleValue: {
    fontSize: 13,
    color: BrandColors.navy,
    fontWeight: '800',
  },
  timerRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  timerCard: {
    flex: 1,
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BrandColors.teal,
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  timerCardInactive: {
    borderColor: 'rgba(38, 63, 79, 0.08)',
    backgroundColor: '#f8fafc',
  },
  timerCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  timerCardValue: {
    fontSize: 18,
    fontWeight: '900',
    color: BrandColors.teal,
  },
  timerValueDisabled: {
    color: '#94a3b8',
  },
  timerCardSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  simulateButton: {
    backgroundColor: BrandColors.orange,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BrandColors.orange,
    shadowColor: BrandColors.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  simulateButtonText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  cancelBookingButton: {
    backgroundColor: '#fff5f5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fecaca',
  },
  cancelBookingButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '900',
  },
  departureButton: {
    backgroundColor: BrandColors.teal,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BrandColors.teal,
    shadowColor: BrandColors.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  departureButtonText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(38, 63, 79, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: Spacing.four,
  },
  modalOverlayBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: BrandColors.white,
    borderRadius: 24,
    padding: Spacing.four,
    borderWidth: 2,
    borderColor: 'rgba(38, 63, 79, 0.15)',
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: BrandColors.navy,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(38, 63, 79, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '900',
    color: BrandColors.navy,
  },
  modalDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: Spacing.three,
    fontWeight: '600',
  },
  boldText: {
    fontWeight: '900',
    color: BrandColors.navy,
  },
  bookingSummaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    flex: 1.2,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '900',
    color: BrandColors.navy,
    flex: 1,
    textAlign: 'right',
  },
  summaryDivider: {
    borderTopWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginTop: 8,
    paddingTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  modalSecondaryBtn: {
    backgroundColor: BrandColors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(38, 63, 79, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '800',
  },
  modalPrimaryBtn: {
    backgroundColor: BrandColors.teal,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(10, 124, 110, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalSuccessIcon: {
    fontSize: 32,
    color: BrandColors.teal,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.three,
  },
  starTouch: {
    padding: 4,
  },
  starIconActive: {
    fontSize: 38,
    color: BrandColors.orange,
  },
  starIconInactive: {
    fontSize: 38,
    color: '#cbd5e1',
  },
  commentInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: BrandColors.navy,
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
    height: 80,
    marginBottom: Spacing.four,
    fontWeight: '600',
  },
  filterButton: {
    position: 'absolute',
    bottom: 202,
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
  filterBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BrandColors.orange,
    borderWidth: 2,
    borderColor: BrandColors.white,
  },
  resetAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetAllText: {
    color: BrandColors.orange,
    fontSize: 13,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.navy,
  },
  filterSubLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  filterDivider: {
    height: 1,
    backgroundColor: 'rgba(38, 63, 79, 0.08)',
    marginVertical: Spacing.two,
  },
  filterSectionContainer: {
    paddingVertical: Spacing.one,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: BrandColors.navy,
    letterSpacing: 1,
    marginBottom: Spacing.two,
  },
  priceAdjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    marginBottom: Spacing.two,
  },
  adjustBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.navy,
    lineHeight: 22,
  },
  adjustValue: {
    fontSize: 18,
    fontWeight: '900',
    color: BrandColors.navy,
    minWidth: 100,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  activePresetBtn: {
    borderColor: BrandColors.orange,
    backgroundColor: 'rgba(242, 146, 33, 0.08)',
  },
  activePresetBtnText: {
    color: BrandColors.orange,
  },
  starsFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  starFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  starFilterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  activeStarFilterBtn: {
    borderColor: BrandColors.orange,
    backgroundColor: 'rgba(242, 146, 33, 0.08)',
  },
  activeStarFilterBtnText: {
    color: BrandColors.orange,
  },
  amenitiesFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  amenityFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  amenityFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  activeAmenityFilterPill: {
    borderColor: BrandColors.teal,
    backgroundColor: 'rgba(10, 124, 110, 0.08)',
  },
  activeAmenityFilterPillText: {
    color: BrandColors.teal,
  },
  hamburgerButton: {
    position: 'absolute',
    top: 48,
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
    zIndex: 20,
  },
  searchButton: {
    position: 'absolute',
    top: 48,
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
    zIndex: 20,
  },
  searchBarContainer: {
    position: 'absolute',
    top: 48,
    left: Spacing.three,
    right: Spacing.three,
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 20,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    height: 52,
  },
  searchRowBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: BrandColors.navy,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: Spacing.two,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  searchLoadingText: {
    marginLeft: Spacing.two,
    fontSize: 14,
    color: BrandColors.navy,
    fontWeight: '500',
  },
  searchErrorContainer: {
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#fee2e2',
    backgroundColor: '#fff5f5',
  },
  searchErrorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c53030',
    marginBottom: 0,
  },
  searchErrorText: {
    fontSize: 13,
    color: '#9b2c2c',
    lineHeight: 18,
  },
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(38, 63, 79, 0.4)',
  },
  sidebarDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    backgroundColor: BrandColors.white,
    borderRightWidth: 2,
    borderRightColor: BrandColors.navy,
    paddingTop: 48,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.five,
    width: '100%',
  },
  sidebarLogoText: {
    fontSize: 28,
    fontWeight: '900',
    color: BrandColors.navy,
    letterSpacing: -1,
  },
  sidebarCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  sidebarCloseText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BrandColors.navy,
  },
  sidebarMenu: {
    width: '100%',
    marginTop: Spacing.two,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    width: '100%',
    alignSelf: 'stretch',
  },
  sidebarIconWrapper: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarItemText: {
    fontSize: 19,
    fontWeight: '700',
    color: BrandColors.navy,
    marginLeft: 16,
  },
  sidebarLogoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    width: '100%',
    alignSelf: 'stretch',
  },
  sidebarLogoutText: {
    fontSize: 19,
    fontWeight: '700',
    color: BrandColors.orange,
    marginLeft: 16,
  },
  sidebarFooter: {
    paddingVertical: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  sidebarFooterText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  tabScreenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: BrandColors.navy,
    backgroundColor: BrandColors.white,
  },
  tabScreenHeaderBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabScreenHeaderBackText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.orange,
    marginLeft: 4,
  },
  tabScreenHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: BrandColors.navy,
  },
  tabScreenScroll: {
    flex: 1,
  },
  tabScreenContentContainer: {
    padding: Spacing.four,
    paddingBottom: 40,
  },
  bottomTabBar: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: BrandColors.white,
    borderTopWidth: 2,
    borderTopColor: BrandColors.navy,
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabBarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  tabBarItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 4,
  },
  activeTabBarItemText: {
    color: BrandColors.orange,
    fontWeight: '800',
  },
  walletSectionHeader: {
    fontSize: 17,
    fontWeight: '900',
    color: BrandColors.navy,
    marginBottom: Spacing.three,
    marginTop: Spacing.four,
  },
  walletFormCard: {
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  walletInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 52,
    marginBottom: 12,
  },
  walletInputPrefix: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.navy,
    marginRight: 6,
  },
  walletInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.navy,
    height: '100%',
  },
  quickAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  quickAmountPill: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.navy,
  },
  providerChooser: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  providerPill: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    padding: 12,
    alignItems: 'center',
  },
  activeProviderPill: {
    borderColor: BrandColors.teal,
    backgroundColor: 'rgba(10, 124, 110, 0.05)',
  },
  providerLogoImage: {
    width: 75,
    height: 24,
    marginBottom: 4,
  },
  providerSubText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  walletTextInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 52,
    fontSize: 15,
    fontWeight: '600',
    color: BrandColors.navy,
    marginBottom: 16,
  },
  walletBalanceCard: {
    backgroundColor: BrandColors.navy,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  walletBalanceLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletBalanceVal: {
    fontSize: 32,
    color: BrandColors.white,
    fontWeight: '900',
  },
  walletActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.four,
  },
  walletBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  walletAddBtn: {
    backgroundColor: BrandColors.teal,
    borderColor: BrandColors.navy,
  },
  walletWithdrawBtn: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.navy,
  },
  walletBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 14,
    marginBottom: 10,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.navy,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  txRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  txAmountText: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  txStatusText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  txSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  txSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.navy,
    marginLeft: 8,
  },
  txFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  txFilterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  activeTxFilterPill: {
    backgroundColor: 'rgba(10, 124, 110, 0.08)',
    borderColor: BrandColors.teal,
  },
  txFilterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  activeTxFilterPillText: {
    color: BrandColors.teal,
    fontWeight: '800',
  },
  profileCard: {
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileAvatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#e2e8f0',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  profileInput: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.navy,
    marginBottom: 12,
  },
  profileEditActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    color: BrandColors.navy,
    marginBottom: 8,
  },
  profileDetailText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
  },
  profileEditBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
    backgroundColor: '#f1f5f9',
  },
  profileEditBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.navy,
  },
  vehicleFormContainer: {
    backgroundColor: BrandColors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    padding: Spacing.four,
    marginBottom: 16,
  },
  vehicleTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  vehicleTypeBtn: {
    flexBasis: '47%',
    flexGrow: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  activeVehicleTypeBtn: {
    borderColor: BrandColors.teal,
    backgroundColor: 'rgba(10, 124, 110, 0.05)',
  },
  vehicleTypeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  activeVehicleTypeBtnText: {
    color: BrandColors.teal,
    fontWeight: '800',
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 14,
    marginBottom: 10,
  },
  vehicleIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleBrand: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.navy,
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: 12,
    color: BrandColors.orange,
    fontWeight: '800',
  },
  vehicleDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffeecf',
  },
  vehicleDeleteText: {
    color: BrandColors.orange,
    fontSize: 12,
    fontWeight: '900',
  },
  favSpotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 14,
    marginBottom: 10,
  },
  favSpotIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fffdf5',
    borderWidth: 1,
    borderColor: '#fef08a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favSpotName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.navy,
  },
  favSpotArrow: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '800',
  },
  settingsSection: {
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    marginBottom: 20,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingsLabelContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.navy,
    marginBottom: 2,
  },
  settingsSubLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    lineHeight: 14,
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeLangBtn: {
    backgroundColor: BrandColors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  activeLangBtnText: {
    color: BrandColors.teal,
    fontWeight: '800',
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.navy,
    flex: 1,
    paddingRight: 12,
  },
  faqArrow: {
    fontSize: 10,
    color: '#94a3b8',
  },
  faqAnswer: {
    marginTop: 8,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
});
