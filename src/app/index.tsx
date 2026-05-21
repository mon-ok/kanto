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
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';
import { BrandColors, Spacing } from '@/constants/theme';
import { buildParkingDetailPage } from '@/app/parking-detail-page';

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
        // Create custom orange price pin icon
        var customIcon = L.divIcon({
          className: 'custom-parking-marker',
          html: '<div class="price-marker">' + spot.price + '</div>',
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
              '<span class="popup-slots-badge">' + spot.slots + ' available</span>' +
            '</div>' +
            '<div class="popup-divider"></div>' +
            '<div class="popup-section-label">Description</div>' +
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
      if (window.ReactNativeWebView) {
        // Native: postMessage for Alert fallback
        var spot = null;
        for (var i = 0; i < activeMarkers.length; i++) {
          if (activeMarkers[i].spotId === spotId) { spot = activeMarkers[i].spotData; break; }
        }
        if (spot) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'viewMore', spot: spot }));
        return;
      }
      // Web: open the prebuilt Blob URL from parent window directly (user-gesture context)
      var urls = window.parent && window.parent.__kantoDetailUrls;
      var url = urls && urls[spotId];
      if (url) {
        window.open(url, '_blank');
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
  const [timeToArrive, setTimeToArrive] = useState(1500); // 25 mins
  const [parkingTime, setParkingTime] = useState(0);

  // Custom Modals State
  const [activeModal, setActiveModal] = useState<'confirm_book' | 'booking_confirmed' | 'cancel_confirm' | 'cancel_success' | 'arrived' | 'expired' | 'departure' | null>(null);
  const [modalTargetSpace, setModalTargetSpace] = useState<any | null>(null);
  const [modalTargetPrice, setModalTargetPrice] = useState<number>(0);
  const [departurePhase, setDeparturePhase] = useState<'requesting' | 'confirmed'>('requesting');
  const [finalOccupiedTime, setFinalOccupiedTime] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);

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
    setTimeToArrive(1500);
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
        setParkingTime((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookedSpotId, hasArrived]);

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
    setTimeToArrive(1500);
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
    const computedFee = (parkingTime / 3600) * hourlyRate;
    const amount = Math.max(5.00, Number(computedFee.toFixed(2)));
    setFinalAmount(amount);
    
    setDeparturePhase('requesting');
    setActiveModal('departure');
  };

  const handleDepartureComplete = () => {
    setActiveModal(null);
    setBookedSpotId(null);
    setBookedSpot(null);
    setHasArrived(false);
    setTimeToArrive(1500);
    setParkingTime(0);
    hasDrawnRoute.current = false;
    clearRouteOnMap();
    if (coords) {
      const filtered = buildMarkersPayload(selectedVehicle, coords, null);
      sendMarkersToMap(filtered);
    }
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
      // Precompute detail pages as Blob URLs stored on parent window (reliable new-tab open)
      const prevUrls: Record<string, string> = (window as any).__kantoDetailUrls || {};
      Object.values(prevUrls).forEach((u: any) => { try { URL.revokeObjectURL(u); } catch(_) {} });
      const urls: Record<string, string> = {};
      markers.forEach((spot: any) => {
        const html = buildParkingDetailPage(spot, spot.id === bookedSpotId);
        const blob = new Blob([html], { type: 'text/html' });
        urls[spot.id] = URL.createObjectURL(blob);
      });
      (window as any).__kantoDetailUrls = urls;
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

    // Only display the booked space if booked, otherwise filter by vehicle suitability
    const targetSpaces = activeSpotId
      ? BASE_PARKING_SPACES.filter(spot => spot.id === activeSpotId)
      : BASE_PARKING_SPACES.filter((spot) => spot.vehicles.includes(vehicleId));

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
        image: spot.image,
        location: 'Metro Manila, Philippines',
        rating: 4.5,
        reviewCount: 3,
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

  // Dynamically update map markers when vehicle type selection changes
  useEffect(() => {
    if (coords) {
      const filtered = buildMarkersPayload(selectedVehicle, coords);
      const timer = setTimeout(() => {
        sendMarkersToMap(filtered);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedVehicle]);

  // Listen for viewMore messages from the iframe on web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'viewMore' && data.spot) {
          const detailHtml = buildParkingDetailPage(data.spot);
          const newTab = window.open('', '_blank');
          if (newTab) {
            newTab.document.write(detailHtml);
            newTab.document.close();
          }
        } else if (data && data.type === 'viewDirections') {
          if (data.spotId) {
            const spot = BASE_PARKING_SPACES.find(s => s.id === data.spotId);
            if (spot) {
              setBookedSpot(spot);
              setBookedSpotId(data.spotId);
              setHasArrived(false);
              setTimeToArrive(1500);
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
          handleCancelBooking(false);
        }
      } catch (e) {
        // Silent catch
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle messages from native WebView
  const handleNativeMessage = (event: any) => {
    try {
      const data = typeof event.nativeEvent.data === 'string'
        ? JSON.parse(event.nativeEvent.data)
        : event.nativeEvent.data;
      if (data && data.type === 'viewMore' && data.spot) {
        setViewMoreHtml(buildParkingDetailPage(data.spot));
      } else if (data && data.type === 'viewDirections') {
        setViewMoreHtml(null); // Close the detail Modal
        if (data.spotId) {
          const spot = BASE_PARKING_SPACES.find(s => s.id === data.spotId);
          if (spot) {
            setBookedSpot(spot);
            setBookedSpotId(data.spotId);
            setHasArrived(false);
            setTimeToArrive(1500);
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
      }
    } catch (e) {
      // Silent catch
    }
  };

  const handleRecenter = () => {
    requestLocation();
    if (coords && bookedSpotId) {
      const spot = BASE_PARKING_SPACES.find(s => s.id === bookedSpotId);
      if (spot) {
        const spotLat = coords.latitude + spot.offsetLat;
        const spotLng = coords.longitude + spot.offsetLng;
        drawRouteOnMap(coords.latitude, coords.longitude, spotLat, spotLng, true);
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
                  <Text style={styles.headerTitle}>Hi! Anong gusto mong i-park?</Text>
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
                <View style={styles.bookedInfoCard}>
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
                  </View>
                </View>

                {/* Timers Row */}
                <View style={styles.timerRow}>
                  {/* Countdown Timer */}
                  <View style={[styles.timerCard, hasArrived && styles.timerCardInactive]}>
                    <Text style={styles.timerCardTitle}>Time to Arrive</Text>
                    <Text style={[styles.timerCardValue, hasArrived && styles.timerValueDisabled]}>
                      {hasArrived ? 'Arrived 🅿️' : formatTimeToArrive(timeToArrive)}
                    </Text>
                    <Text style={styles.timerCardSubtitle}>
                      {hasArrived ? 'Arrived at space' : 'Arrive within 25 mins'}
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
                          onPress={() => {
                            toggleSpaceExpand(space.id);
                            focusSpotOnMap(space.id);
                          }}
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
            </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
      {/* Full-screen parking detail modal (native) */}
      {Platform.OS !== 'web' && viewMoreHtml !== null && WebView && (
        <Modal
          visible={true}
          animationType="slide"
          onRequestClose={() => setViewMoreHtml(null)}
          statusBarTranslucent
        >
          <View style={{ flex: 1, backgroundColor: '#263f4f' }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingTop: 52, paddingBottom: 12,
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
            <WebView
              source={{ html: viewMoreHtml }}
              style={{ flex: 1, backgroundColor: '#f1f5f9' }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
              onMessage={handleNativeMessage}
            />
          </View>
        </Modal>
      )}

      {/* Custom Modal overlay system */}
      {activeModal !== null && (
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {
            if (activeModal === 'confirm_book' || activeModal === 'cancel_confirm') {
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
                  Reserve a slot at <Text style={styles.boldText}>{modalTargetSpace.name}</Text> for your <Text style={styles.boldText}>{VEHICLES.find(v => v.id === selectedVehicle)?.name || 'vehicle'}</Text>.
                </Text>
                
                <View style={styles.bookingSummaryBox}>
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
                  Successfully reserved a slot at <Text style={styles.boldText}>{bookedSpot?.name}</Text>. Please arrive within 25 minutes.
                </Text>
                
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
                  <Text style={styles.modalPrimaryText}>OK, Let's Park</Text>
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
                        <Text style={styles.summaryLabel}>Time Occupied:</Text>
                        <Text style={styles.summaryVal}>{formatParkingTime(finalOccupiedTime)}</Text>
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
                      <Text style={styles.modalSuccessIcon}>🚗</Text>
                    </View>
                    <Text style={styles.modalTitle}>Departure Approved!</Text>
                    <Text style={[styles.modalDesc, { textAlign: 'center', marginBottom: Spacing.three }]}>
                      Owner confirmed your departure and payment. Thank you for parking with us!
                    </Text>

                    <View style={[styles.bookingSummaryBox, { width: '100%' }]}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Time Occupied:</Text>
                        <Text style={styles.summaryVal}>{formatParkingTime(finalOccupiedTime)}</Text>
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

                    <TouchableOpacity style={[styles.modalPrimaryBtn, { width: '100%' }]} onPress={handleDepartureComplete}>
                      <Text style={styles.modalPrimaryText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
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
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '900',
    color: BrandColors.navy,
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
});
