import { buildParkingDetailPage } from '@/app/parking-detail-page';
import { BrandColors, Spacing } from '@/constants/theme';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
    | null
  >(null);

  // Active Filter States
  const [hideFullSpaces, setHideFullSpaces] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(200); // 200 = Any Price
  const [minStars, setMinStars] = useState<number>(0); // 0 = Any
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

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
            fallback={<Text style={{ fontSize: 22 }}>🎛️</Text>}
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
});
