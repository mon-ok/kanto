# <img src="./kanto-logo.png" alt="Kanto Logo" width="280"/>

**Kanto** is a peer-to-peer (P2P) parking discovery and booking mobile application designed specifically for high-density community areas in the Philippines. It empowers local residents to rent out their vacant spaces (such as gated backyards, carports, driveways, or vacant lots) to drivers looking for affordable and secure parking.

The project is built on **React Native** and **Expo**, utilizing a high-performance interactive **Leaflet map** rendered inside native WebViews, requiring no commercial API keys (using OpenStreetMap).

---

## 🚀 Key Features

* **Interactive P2P Map:** Real-time visual exploration of local private/residential parking spots built using Leaflet and OpenStreetMap tiles (no Google Maps API key required).
* **Smart Coordinate Distribution:** Automatically distributes available spaces around the user's current GPS location, including spots directly below (south), north, east, and west.
* **Granular Vehicle Compatibility:** Filter and view tailored rates for multiple vehicle classes:
  * 🚗 Cars (Sedan/SUV)
  * 🏍️ Motorcycles
  * 🛺 Tricycles
  * 🚲 Bicycles
  * 🚙 Jeepneys
  * 🚛 Heavy Trucks
* **Rich Parking Profiles:** High-fidelity parking space pages detailing photos, hourly rates, available slots, descriptions, ratings, reviews, and amenities (e.g., Gated, CCTV, Covered Roof, Security Patrol).
* **Live Route Navigation:** Instantly plots routes (interactive polylines) on the map connecting the user to their booked spot.
* **Active Booking Workflow:** Built-in checkout sheet, countdown timers for active sessions, custom navigation instructions, and mock wallet integrations (GCash, Maya).

---

## 🛠️ Tech Stack

* **Framework:** React Native with [Expo SDK 54](https://expo.dev/)
* **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
* **Map Engine:** [Leaflet.js](https://leafletjs.com/) and [OpenStreetMap](https://www.openstreetmap.org/)
* **Platform Wrapper:** [React Native WebView](https://github.com/react-native-webview/react-native-webview) (safely handles the bridge between Native components and Leaflet JS context)
* **Styling:** Custom StyleSheet system with premium glassmorphism accents and a teal-brand design palette.

---

## 📦 Installation & Setup

Get the project running locally in just a few steps.

### 1. Prerequisites

Make sure you have the following installed on your machine:
* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (version 18 or above recommended)
* npm (bundled with Node.js)

### 2. Clone the Repository

Clone the project from GitHub and navigate into the directory:

```bash
git clone https://github.com/your-username/kanto.git
cd kanto
```

### 3. Install Dependencies

Install all required Node modules:

```bash
npm install
```

### 4. Run the Development Server

Start the Expo CLI server:

```bash
npm run start
```
*(Alternative: `npx expo start`)*

---

## 📱 How to Run the App

Once the development server is running, you can run the app on different platforms:

### A. Web Version (Fastest Preview)
Press **`w`** in the terminal running Expo, or open the link directly in your browser:
```
http://localhost:8081
```

### B. iOS Simulator or Android Emulator
* For iOS: Press **`i`** in the terminal (requires macOS and Xcode).
* For Android: Press **`a`** in the terminal (requires Android Studio and a running Virtual Device).

### C. Physical Mobile Device (Expo Go)
1. Download the **Expo Go** app from the [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or the [Apple App Store](https://apps.apple.com/us/app/expo-go/id984021056).
2. Ensure your phone and development machine are connected to the **same Wi-Fi network**.
3. Scan the **QR code** printed in the terminal:
   * **Android:** Scan using the Expo Go app.
   * **iOS:** Scan using the default Camera app, then tap the prompt to open in Expo Go.

---

## 📂 Project Structure

```
kanto/
├── assets/             # Graphics, logos, and parking images
├── src/
│   └── app/
│       ├── index.tsx                 # Main application landing + Leaflet Map View
│       └── parking-detail-page.ts    # Rich HTML detailing spot amenities and bookings
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

---

## 💬 Community & Feedback

* **Expo Documentation:** Read the [Expo docs](https://docs.expo.dev/) to learn more about the ecosystem.
* **Leaflet Documentation:** Check the [Leaflet API reference](https://leafletjs.com/reference.html) for customization of map markers, lines, and layers.
