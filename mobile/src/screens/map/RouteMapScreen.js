import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, LoadingSpinner } from '../../components/common/SharedComponents';
import { routesAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const RouteMapScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const webViewRef = useRef(null);
  const [routes, setRoutes] = useState([]);
  const [busTerminals, setBusTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jeepneys'); // 'jeepneys' | 'buses'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [commuterLocation, setCommuterLocation] = useState({ lat: 16.0433, lng: 120.3342, isReal: false });
  const [locationStatus, setLocationStatus] = useState('Acquiring GPS...');

  // Real-time location tracking & watch position
  useEffect(() => {
    let isMounted = true;
    let locationSubscription = null;

    const requestLocation = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!isMounted) return;
              setCommuterLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                isReal: true,
              });
              setLocationStatus('Live GPS Active');
            },
            (err) => {
              console.warn('Browser geolocation fallback to Dagupan center:', err.message);
              setLocationStatus('Dagupan Center (GPS Simulated)');
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            setLocationStatus('Acquiring Satellite Lock...');
            try {
              const initialLoc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });
              if (!isMounted) return;
              setCommuterLocation({
                lat: initialLoc.coords.latitude,
                lng: initialLoc.coords.longitude,
                isReal: true,
              });
              setLocationStatus('Live GPS Active');
            } catch (posErr) {
              console.warn('Initial GPS position error, falling back to balanced:', posErr);
              const fallbackLoc = await Location.getLastKnownPositionAsync();
              if (fallbackLoc && isMounted) {
                setCommuterLocation({
                  lat: fallbackLoc.coords.latitude,
                  lng: fallbackLoc.coords.longitude,
                  isReal: true,
                });
                setLocationStatus('Live GPS Active');
              }
            }

            // Continuous subscription for real-time tracking
            locationSubscription = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.High,
                timeInterval: 4000,
                distanceInterval: 5,
              },
              (newLoc) => {
                if (!isMounted) return;
                setCommuterLocation({
                  lat: newLoc.coords.latitude,
                  lng: newLoc.coords.longitude,
                  isReal: true,
                });
                setLocationStatus('Live GPS Active');
              }
            );
          } else {
            setLocationStatus('GPS Permission Denied (Dagupan Center)');
          }
        }
      } catch (e) {
        console.warn('Location error:', e);
        setLocationStatus('Dagupan Center (Default)');
      }
    };

    requestLocation();
    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Fetch routes and bus terminals
  useEffect(() => {
    const loadData = async () => {
      try {
        const [routesRes, terminalsRes] = await Promise.all([
          routesAPI.getAllRoutes(),
          routesAPI.getBusTerminals(commuterLocation.isReal ? { lat: commuterLocation.lat, lng: commuterLocation.lng } : {}),
        ]);
        setRoutes(Array.isArray(routesRes.data?.data) ? routesRes.data.data : []);
        setBusTerminals(Array.isArray(terminalsRes.data?.data) ? terminalsRes.data.data : []);
      } catch (e) {
        console.error('Data load error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [commuterLocation.isReal]);

  const safeRoutes = Array.isArray(routes) ? routes : [];
  const filteredRoutes = selectedCategory === 'all'
    ? safeRoutes
    : safeRoutes.filter((r) => r.category === selectedCategory);

  // Generate HTML for the embedded Leaflet Map
  const generateLeafletHtml = () => {
    const lat = commuterLocation.lat || 16.0433;
    const lng = commuterLocation.lng || 120.3342;
    const isRealGPS = commuterLocation.isReal;

    const routesJson = JSON.stringify(
      routes.map(r => ({
        id: r._id,
        name: r.name,
        code: r.code,
        category: r.category,
        distanceKm: r.distanceKm,
        corridor: r.corridor || r.description || '',
        isLoop: r.isLoop !== false,
        path: r.path || [],
        startPoint: r.startPoint,
        endPoint: r.endPoint,
        waypoints: r.waypoints || [],
        terminalLocation: r.terminalLocation || null,
      }))
    );

    const terminalsJson = JSON.stringify(busTerminals);
    const selectedRouteId = selectedItem?._id || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #0f172a; }
          .leaflet-popup-content-wrapper { border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; }
          .commuter-marker {
            width: 24px; height: 24px; border-radius: 50%; background: #2563EB;
            border: 3px solid #ffffff; box-shadow: 0 0 16px rgba(37,99,235,1);
            display: flex; align-items: center; justify-content: center;
            animation: pulse-ring 2s infinite;
          }
          .commuter-inner {
            width: 8px; height: 8px; border-radius: 50%; background: #ffffff;
          }
          @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.8); }
            70% { box-shadow: 0 0 0 14px rgba(37,99,235,0); }
            100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
          }
          .bus-icon {
            background: #DC2626; color: white; width: 28px; height: 28px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; font-size: 14px;
            border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          }
          .station-pin {
            background: #10B981; color: white; width: 22px; height: 22px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; font-size: 11px;
            border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
          }).addTo(map);

          // 1. Live Commuter GPS Marker
          var commuterIcon = L.divIcon({
            className: 'commuter-beacon',
            html: '<div class="commuter-marker"><div class="commuter-inner"></div></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          L.marker([${lat}, ${lng}], { icon: commuterIcon, zIndexOffset: 2000 })
            .bindPopup('<strong>📍 Live Commuter GPS</strong><br/>${isRealGPS ? 'Active GPS Satellite Fix' : 'Dagupan City Center (GPS Simulated)'}')
            .addTo(map);

          var activeTab = '${activeTab}';
          var routes = ${routesJson};
          var busTerminals = ${terminalsJson};
          var selectedId = '${selectedRouteId}';

          // 2. Render Static Jeepney Routes (Polylines)
          if (activeTab === 'jeepneys') {
            var selectedBounds = null;

            var routeColorMap = {
              'CSI_LUCAO': '#2563EB', // Sapphire Blue
              'DOWNTOWN': '#8B5CF6',  // Vivid Purple
              'CALASIAO': '#059669',  // Emerald Green
              'BONUAN_TONDALIGAN': '#EA580C', // Sunset Orange / Coastal Coral
              'BOLOSAN_HIGHWAY': '#D97706', // Amber Gold
              'SALISAY_BOLOSAN_OLD_ROAD': '#DB2777', // Magenta / Rose
            };
            // When a route is selected, commuter only sees that route. Other routes are hidden!
            var routesToRender = selectedId
              ? routes.filter(function(r) { return r.id === selectedId; })
              : routes;

            routesToRender.forEach(function(route) {
              var isSelected = (selectedId && route.id === selectedId);
              var baseColor = routeColorMap[route.code] || (route.category === 'city' ? '#2563EB' : '#10B981');
              var color = isSelected ? '#F59E0B' : baseColor;
              var weight = isSelected ? 6 : (route.path && route.path.length > 0 ? 4 : 3);
              var opacity = 1.0;

              var pts = [];
              if (route.path && route.path.length > 0) {
                pts = route.path.map(function(p) { return [p.lat, p.lng]; });
              } else if (route.startPoint && route.endPoint) {
                pts = [
                  [route.startPoint.lat, route.startPoint.lng],
                  ...(route.waypoints || []).map(function(w) { return [w.lat, w.lng]; }),
                  [route.endPoint.lat, route.endPoint.lng]
                ];
              }

              if (pts.length > 0) {
                var poly = L.polyline(pts, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  dashArray: (route.path && route.path.length > 0) ? null : '5, 5'
                }).bindPopup(
                  '<div style="min-width:180px;">' +
                  '<div style="font-weight:800; font-size:13px; color:' + color + ';">🚐 ' + route.name + '</div>' +
                  (route.corridor ? '<div style="font-size:11px; margin-top:3px; color:#334155; font-weight:600;">' + route.corridor + '</div>' : '') +
                  '<div style="font-size:11px; color:#64748b; margin-top:4px;">Distance: ~' + route.distanceKm + ' km • ' + (route.isLoop ? 'Loop Corridor' : 'Static Corridor') + '</div>' +
                  '</div>'
                ).addTo(map);

                if (isSelected) {
                  selectedBounds = poly.getBounds();
                }
              }
            });

            // Central Downtown Dagupan Hub Pin (All jeepneys can be seen and boarded here)
            var downtownIcon = L.divIcon({
              className: 'downtown-pin',
              html: '<div style="background:#2563EB; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:bold; border:2px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.5);">📍</div>',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });
            L.marker([16.0433, 120.3342], { icon: downtownIcon, zIndexOffset: 1500 })
              .bindPopup('<div style="min-width:200px; font-family:-apple-system, BlinkMacSystemFont, sans-serif;"><strong style="color:#2563EB; font-size:13px;">📍 Downtown Dagupan (Central Hub)</strong><br/><div style="font-size:11px; color:#334155; margin-top:3px; font-weight:600;">Main Boarding Area & Staging</div><div style="font-size:11px; color:#64748b; margin-top:2px;">All Dagupan City jeepney routes converge and can be boarded here in Downtown (Perez Blvd & A.B. Fernandez Ave).</div></div>')
              .addTo(map);

            if (selectedBounds) {
              map.fitBounds(selectedBounds, { padding: [40, 40] });
            }
          }

          // 3. Render Provincial Bus Terminals
          if (activeTab === 'buses') {
            busTerminals.forEach(function(t) {
              var busIcon = L.divIcon({
                className: 'bus-pin',
                html: '<div class="bus-icon">🚌</div>',
                iconSize: [28, 28],
                iconAnchor: [14, 14]
              });
              L.marker([t.lat, t.lng], { icon: busIcon })
                .bindPopup('<div style="font-family:sans-serif; min-width: 190px;"><div style="background:#DC2626; color:white; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:bold; display:inline-block;">BUS TERMINAL</div><h4 style="margin:4px 0;">' + t.name + '</h4><div style="font-size:12px; color:#475569;">' + t.address + '</div><div style="font-size:11px; margin-top:4px; color:#16a34a; font-weight:600;">📞 ' + t.contactNumber + '</div><div style="font-size:11px; color:#64748b; margin-top:2px;">Destinations: ' + (t.destinations || []).slice(0,3).join(', ') + '</div></div>')
                .addTo(map);
            });
          }
        </script>
      </body>
      </html>
    `;
  };

  if (loading) return <LoadingSpinner text="Connecting to Dagupan Transit Grid..." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header: Real-time commuter GPS status */}
      <View style={[styles.gpsStatusBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.gpsRow}>
          <View style={[styles.gpsDot, { backgroundColor: commuterLocation.isReal ? '#10B981' : '#F59E0B' }]} />
          <Text style={[styles.gpsStatusText, { color: colors.textPrimary }]}>
            {locationStatus}
          </Text>
        </View>
        <Text style={[styles.gpsCoordsText, { color: colors.textMuted }]}>
          {commuterLocation.lat.toFixed(4)}°N, {commuterLocation.lng.toFixed(4)}°E
        </Text>
      </View>

      {/* Primary Switcher: Jeepney Routes vs Bus Terminals */}
      <View style={[styles.tabSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'jeepneys' && { backgroundColor: colors.primary }]}
          onPress={() => { setActiveTab('jeepneys'); setSelectedItem(null); }}
        >
          <MaterialCommunityIcons 
            name="van-passenger" 
            size={18} 
            color={activeTab === 'jeepneys' ? '#ffffff' : colors.textSecondary} 
          />
          <Text style={[styles.tabBtnText, { color: activeTab === 'jeepneys' ? '#ffffff' : colors.textSecondary }]}>
            Jeepney Routes ({routes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'buses' && { backgroundColor: '#DC2626' }]}
          onPress={() => { setActiveTab('buses'); setSelectedItem(null); }}
        >
          <MaterialCommunityIcons 
            name="bus" 
            size={18} 
            color={activeTab === 'buses' ? '#ffffff' : colors.textSecondary} 
          />
          <Text style={[styles.tabBtnText, { color: activeTab === 'buses' ? '#ffffff' : colors.textSecondary }]}>
            Bus Terminals Only ({busTerminals.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Embedded Interactive Leaflet Map (WebView on Android/iOS, iframe on Web) */}
      <View style={styles.mapContainer}>
        {selectedItem && (
          <View style={styles.selectedRouteOverlay}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <MaterialCommunityIcons name="target" size={16} color="#F59E0B" />
              <Text style={styles.selectedRouteOverlayText} numberOfLines={1}>
                Solo Route: <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>{selectedItem.name}</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedItem(null)}
              style={styles.showAllBtn}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="eye" size={13} color="#FFFFFF" />
              <Text style={styles.showAllBtnText}>Show All</Text>
            </TouchableOpacity>
          </View>
        )}
        {Platform.OS === 'web' ? (
          <iframe
            title="Dagupan Transit Leaflet Map"
            srcDoc={generateLeafletHtml()}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: generateLeafletHtml() }}
            style={{ flex: 1, backgroundColor: '#0f172a' }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Category Filter for Jeepney Routes */}
      {activeTab === 'jeepneys' && (
        <View style={styles.filterRow}>
          {['all', 'city', 'intercity'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedCategory === cat ? colors.primary : colors.surface,
                  borderColor: selectedCategory === cat ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={{
                  color: selectedCategory === cat ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: '600',
                  fontSize: FONTS.sizes.xs,
                  textTransform: 'capitalize',
                }}
              >
                {cat === 'all' ? 'All Static Routes' : `${cat} Corridors`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content List: Static Jeepney Corridors OR Bus Terminals */}
      {activeTab === 'jeepneys' ? (
        <FlatList
          data={filteredRoutes}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedItem?._id === item._id;
            const hasGpxPath = item.path && item.path.length > 0;

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedItem(isSelected ? null : item)}
              >
                <Card
                  style={[
                    styles.itemCard,
                    isSelected && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: item.category === 'city' ? '#DBEAFE' : '#FEF3C7' }]}>
                      <Text style={{ color: item.category === 'city' ? '#2563EB' : '#D97706', fontSize: FONTS.sizes.xs, fontWeight: '700' }}>
                        {item.category.toUpperCase()} JEEPNEY • {item.isLoop !== false ? 'LOOP' : 'CORRIDOR'}
                      </Text>
                    </View>
                    <Text style={[styles.distanceBadge, { color: colors.textMuted }]}>~{item.distanceKm} km</Text>
                  </View>

                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.name}</Text>

                  {/* Static Route Corridor (No Start / End) */}
                  <View style={styles.corridorContainer}>
                    <MaterialCommunityIcons name="transit-connection-variant" size={16} color={colors.primary} />
                    <Text style={[styles.corridorText, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.corridor || item.description || 'Static Dagupan transit corridor'}
                    </Text>
                  </View>

                  {/* Footer with badges and View Details */}
                  <View style={styles.cardFooterRow}>
                    <View style={styles.metaBadge}>
                      <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textMuted} />
                      <Text style={[styles.metaBadgeText, { color: colors.textMuted }]}>
                        {item.operatingHours?.start || '04:00'} - {item.operatingHours?.end || '21:00'}
                      </Text>
                    </View>

                    {hasGpxPath && (
                      <View style={[styles.metaBadge, { backgroundColor: '#ECFDF5' }]}>
                        <MaterialCommunityIcons name="map-marker-path" size={13} color="#10B981" />
                        <Text style={[styles.metaBadgeText, { color: '#059669', fontWeight: '700' }]}>
                          GPX Track Active
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.detailBtn}
                      onPress={() => navigation.navigate('RouteDetail', { route: item })}
                    >
                      <Text style={[styles.detailBtnText, { color: colors.primary }]}>Details</Text>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          data={busTerminals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card style={[styles.itemCard, { borderLeftWidth: 4, borderLeftColor: '#DC2626' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={{ color: '#DC2626', fontSize: FONTS.sizes.xs, fontWeight: '700' }}>
                    PROVINCIAL BUS TERMINAL
                  </Text>
                </View>
                {item.distanceKm !== undefined && (
                  <Text style={[styles.distanceBadge, { color: '#DC2626', fontWeight: '700' }]}>
                    {item.distanceKm} km from you
                  </Text>
                )}
              </View>

              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.terminalAddress, { color: colors.textSecondary }]}>
                📍 {item.address}
              </Text>

              <View style={styles.terminalMetaRow}>
                <Text style={[styles.terminalMetaText, { color: colors.textMuted }]}>
                  🕒 {item.operatingHours}
                </Text>
                <Text style={[styles.terminalMetaText, { color: colors.primary, fontWeight: '600' }]}>
                  📞 {item.contactNumber}
                </Text>
              </View>

              <View style={styles.destinationsBox}>
                <Text style={[styles.destinationsLabel, { color: colors.textMuted }]}>Major Bus Destinations:</Text>
                <Text style={[styles.destinationsText, { color: colors.textPrimary }]}>
                  {item.destinations.join(' • ')}
                </Text>
              </View>

              <View style={styles.amenitiesRow}>
                {item.amenities.slice(0, 3).map((amenity, idx) => (
                  <View key={idx} style={[styles.amenityChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.amenityText, { color: colors.textSecondary }]}>✓ {amenity}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gpsStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gpsDot: { width: 9, height: 9, borderRadius: 5 },
  gpsStatusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  gpsCoordsText: { fontSize: FONTS.sizes.xs, fontFamily: 'monospace' },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  tabBtnText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.32,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    elevation: 3,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  itemCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm },
  distanceBadge: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  itemTitle: { fontSize: FONTS.sizes.md, fontWeight: '800', marginBottom: 6 },
  corridorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 4,
  },
  corridorText: {
    fontSize: FONTS.sizes.xs + 1,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaBadgeText: { fontSize: 11 },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailBtnText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  terminalAddress: { fontSize: FONTS.sizes.xs, marginBottom: 6 },
  terminalMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  terminalMetaText: { fontSize: FONTS.sizes.xs },
  destinationsBox: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 8,
  },
  destinationsLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  destinationsText: { fontSize: FONTS.sizes.xs, fontWeight: '600', marginTop: 2 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  amenityChip: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  amenityText: { fontSize: 10 },
  selectedRouteOverlay: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 1000,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 10,
  },
  selectedRouteOverlayText: {
    color: '#F59E0B',
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
  },
  showAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  showAllBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default RouteMapScreen;
