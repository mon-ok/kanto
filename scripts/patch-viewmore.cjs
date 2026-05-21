const fs = require('fs');
let content = fs.readFileSync('src/app/index.tsx', 'utf8');

// 1. Add Modal to react-native imports
content = content.replace(
  `  Alert,\n} from 'react-native';`,
  `  Alert,\n  Modal,\n} from 'react-native';`
);
console.log('✓ Added Modal import');

// 2. Add viewMoreHtml state after selectedVehicle state
const oldState = `  const [selectedVehicle, setSelectedVehicle] = useState<string>('motorcycle');`;
const newState = `  const [selectedVehicle, setSelectedVehicle] = useState<string>('motorcycle');
  const [viewMoreHtml, setViewMoreHtml] = useState<string | null>(null);`;
content = content.replace(oldState, newState);
console.log('✓ Added viewMoreHtml state');

// 3. Replace handleNativeMessage to setViewMoreHtml instead of Alert
const oldNative = `  // Handle messages from native WebView
  const handleNativeMessage = (event: any) => {
    try {
      const data = typeof event.nativeEvent.data === 'string'
        ? JSON.parse(event.nativeEvent.data)
        : event.nativeEvent.data;
      if (data && data.type === 'viewMore' && data.spot) {
        const spot = data.spot;
        Alert.alert(
          spot.name,
          \`📍 \${spot.location || 'Metro Manila, Philippines'}\\n\\n⭐ \${spot.rating || 4.5}/5 (\${spot.reviewCount || 3} reviews)\\n\\n🏷️ Amenities: \${(spot.amenities || []).join(', ')}\`,
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      // Silent catch
    }
  };`;

const newNative = `  // Handle messages from native WebView
  const handleNativeMessage = (event: any) => {
    try {
      const data = typeof event.nativeEvent.data === 'string'
        ? JSON.parse(event.nativeEvent.data)
        : event.nativeEvent.data;
      if (data && data.type === 'viewMore' && data.spot) {
        setViewMoreHtml(buildParkingDetailPage(data.spot));
      }
    } catch (e) {
      // Silent catch
    }
  };`;

if (content.includes(oldNative)) {
  content = content.replace(oldNative, newNative);
  console.log('✓ Replaced handleNativeMessage');
} else {
  console.log('✗ handleNativeMessage not found');
  process.exit(1);
}

// 4. Update sendMarkersToMap to use Blob URLs on web (more reliable than about:blank)
const oldSend = `      // Precompute detail pages and store on window for direct-open (no popup blocker)
      const details: Record<string, string> = {};
      markers.forEach((spot: any) => { details[spot.id] = buildParkingDetailPage(spot); });
      (window as any).__kantoDetails = details;`;

const newSend = `      // Precompute detail pages as Blob URLs stored on parent window (reliable new-tab open)
      const prevUrls: Record<string, string> = (window as any).__kantoDetailUrls || {};
      Object.values(prevUrls).forEach((u: any) => { try { URL.revokeObjectURL(u); } catch(_) {} });
      const urls: Record<string, string> = {};
      markers.forEach((spot: any) => {
        const html = buildParkingDetailPage(spot);
        const blob = new Blob([html], { type: 'text/html' });
        urls[spot.id] = URL.createObjectURL(blob);
      });
      (window as any).__kantoDetailUrls = urls;`;

if (content.includes(oldSend)) {
  content = content.replace(oldSend, newSend);
  console.log('✓ Updated sendMarkersToMap to use Blob URLs');
} else {
  console.log('✗ sendMarkersToMap precompute block not found');
  process.exit(1);
}

// 5. Update handleViewMore inside LEAFLET_HTML to use Blob URL
const oldViewMore = `      // Web: open the prebuilt detail page from parent window directly (user-gesture context)
      var html = window.parent && window.parent.__kantoDetails && window.parent.__kantoDetails[spotId];
      if (html) {
        var newTab = window.open('about:blank', '_blank');
        if (newTab) {
          newTab.document.write(html);
          newTab.document.close();
        }
      }`;

const newViewMore2 = `      // Web: open the prebuilt Blob URL from parent window directly (user-gesture context)
      var urls = window.parent && window.parent.__kantoDetailUrls;
      var url = urls && urls[spotId];
      if (url) {
        window.open(url, '_blank');
      }`;

if (content.includes(oldViewMore)) {
  content = content.replace(oldViewMore, newViewMore2);
  console.log('✓ Updated handleViewMore to use Blob URL');
} else {
  console.log('✗ handleViewMore web block not found');
  process.exit(1);
}

// 6. Add full-screen detail Modal JSX just before </SafeAreaView>
const oldClose = `    </SafeAreaView>
  );
}`;

const newClose = `      {/* Full-screen parking detail modal (native) */}
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
                <Text style={{ color: '#f29221', fontWeight: '800', fontSize: 13 }}>✕ Close</Text>
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
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}`;

if (content.includes(oldClose)) {
  content = content.replace(oldClose, newClose);
  console.log('✓ Added full-screen detail Modal JSX');
} else {
  console.log('✗ </SafeAreaView> close not found');
  process.exit(1);
}

fs.writeFileSync('src/app/index.tsx', content, 'utf8');
console.log('Done. Lines: ' + content.split('\n').length);
