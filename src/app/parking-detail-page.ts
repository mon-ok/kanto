/** Builds a full premium parking space detail page HTML string */
export function buildParkingDetailPage(spot: any, initiallyBooked: boolean = false, initiallyArrived: boolean = false, selectedVehicle: string = 'motorcycle'): string {
  const SAMPLE_REVIEWS = [
    { id: 1, author: 'Maria Santos',   initials: 'MS', color: '#0a7c6e', stars: 5, date: 'May 18, 2026', text: 'Sobrang convenient ng location! Laging may slot, safe, malinis, at helpful ang attendant. Highly recommended!', helpful: 12 },
    { id: 2, author: 'Juan dela Cruz', initials: 'JC', color: '#f29221', stars: 4, date: 'May 15, 2026', text: 'Good parking spot. Malapit sa mga tindahan at accessible. May CCTV kaya safe. Konting improvement lang sa signages.', helpful: 7 },
    { id: 3, author: 'Ana Reyes',      initials: 'AR', color: '#263f4f', stars: 5, date: 'May 10, 2026', text: 'Best parking sa area! Laging may slot, hindi ka mahihirapan. Plus yung attendant sobrang helpful. Will park here again!', helpful: 19 },
    { id: 4, author: 'Carlo Mendoza',  initials: 'CM', color: '#7c3aed', stars: 3, date: 'May 5, 2026',  text: 'Okay lang yung parking. Medyo mahal pero malapit naman. Sana mag-dagdag ng covered area para hindi mabasa ang sasakyan.', helpful: 4 },
    { id: 5, author: 'Liza Pangilinan',initials: 'LP', color: '#dc2626', stars: 5, date: 'Apr 28, 2026', text: 'Perfect parking spot! Malawak, malinis, at may CCTV. Very affordable para sa location. Dito na ako palagi mag-park!', helpful: 23 },
    { id: 6, author: 'Renz Aquino',    initials: 'RA', color: '#0369a1', stars: 4, date: 'Apr 20, 2026', text: 'Great spot overall. The staff are very accommodating and the area is well-maintained. Would recommend to friends.', helpful: 9 },
  ];

  const AMENITY_ICONS: Record<string, string> = {
    'CCTV Monitoring':    '&#128247;',
    'Lighting':           '&#128161;',
    'Covered Roof':       '&#127968;',
    '24/7 Security':      '&#128110;',
    'Free Carwash':       '&#128695;',
    'EV Charging':        '&#9889;',
    'Restrooms':          '&#128699;',
    'Elevator Access':    '&#128703;',
    'Fire Safety':        '&#129519;',
    'Eco-friendly':       '&#127807;',
    'Express Lanes':      '&#128640;',
    'Handicap Friendly':  '&#9855;',
    'Parking Attendant':  '&#129489;',
    'Cement Pavement':    '&#129522;',
    'Seaside View':       '&#127754;',
    'Manual Gate':        '&#128272;',
  };

  const FALLBACK_IMAGES: string[] = [
    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',
    'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80',
    'https://images.unsplash.com/photo-1573804630927-ea5a09a5bae4?w=800&q=80',
    'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?w=800&q=80',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
  ];
  const allImages: string[] = Array.isArray(spot.images) && spot.images.length > 0
    ? spot.images
    : [spot.image, ...FALLBACK_IMAGES].filter(Boolean);
  const ratingNum = (spot.rating || 4.5).toFixed(1);
  const reviewCount = SAMPLE_REVIEWS.length;
  const location = spot.location || 'Metro Manila, Philippines';

  /* ── Image slides ── */
  const slidesHtml = allImages.map((img: string) =>
    `<div class="slide"><img src="${img}" alt="Parking space photo" /></div>`
  ).join('');

  const dotHtml = allImages.map((_: string, idx: number) =>
    `<button class="dot${idx === 0 ? ' active' : ''}" onclick="goTo(${idx})" aria-label="Slide ${idx + 1}"></button>`
  ).join('');

  /* ── Amenity cards ── */
  const amenityCardsHtml = (spot.amenities || []).map((a: string) => {
    const icon = AMENITY_ICONS[a] || '&#9989;';
    return `<div class="amenity-card"><span class="amenity-icon">${icon}</span><span class="amenity-label">${a}</span></div>`;
  }).join('');

  /* ── Vehicle rates ── */
  const VEHICLE_META: Record<string, { name: string, emoji: string }> = {
    motorcycle: { name: 'Motorcycle', emoji: '🏍️' },
    car: { name: 'Car', emoji: '🚗' },
    tricycle: { name: 'Tricycle', emoji: '🛺' },
    bicycle: { name: 'Bicycle', emoji: '🚲' },
    jeepney: { name: 'Jeepney', emoji: '🚌' },
    truck: { name: 'Truck', emoji: '🚚' },
  };

  const selectedVehicleMeta = VEHICLE_META[selectedVehicle] || { name: selectedVehicle, emoji: '🚗' };

  const supportedVehicles = spot.vehicles || Object.keys(spot.prices || {});
  const pricesObj = spot.prices || {};

  const vehicleRatesHtml = supportedVehicles.map((vehicleId: string) => {
    const meta = VEHICLE_META[vehicleId] || { name: vehicleId, emoji: '🅿️' };
    const price = pricesObj[vehicleId] ?? 0;
    return `<div class="rate-item">
      <div class="rate-vehicle">
        <span class="rate-emoji">${meta.emoji}</span>
        <span class="rate-name">${meta.name}</span>
      </div>
      <div class="rate-val">&#8369;${price}/hr</div>
    </div>`;
  }).join('');

  /* ── Review cards ── */
  const reviewCardsHtml = SAMPLE_REVIEWS.map((r) => {
    const starsHtml = [1,2,3,4,5].map((i) =>
      `<span style="color:${i <= r.stars ? '#f29221' : '#d1d5db'};font-size:15px;">&#9733;</span>`
    ).join('');
    return `<div class="review-card" data-stars="${r.stars}">
      <div class="review-header">
        <div class="avatar" style="background:${r.color};">${r.initials}</div>
        <div class="reviewer-info">
          <div class="reviewer-name">${r.author}</div>
          <div class="review-date">${r.date}</div>
        </div>
        <div class="review-stars">${starsHtml}</div>
      </div>
      <p class="review-text">${r.text}</p>
      <div class="review-footer">
        <button class="helpful-btn" onclick="toggleHelpful(this, ${r.helpful})">&#128077; Helpful (${r.helpful})</button>
      </div>
    </div>`;
  }).join('');

  /* ── Rating bars ── */
  const starCounts = [5,4,3,2,1].map((s) => ({
    star: s,
    count: SAMPLE_REVIEWS.filter((r) => r.stars === s).length,
  }));

  const ratingBarsHtml = starCounts.map(({ star, count }) => {
    const pct = Math.round((count / reviewCount) * 100);
    const barColor = star >= 4 ? '#f29221' : star === 3 ? '#fbbf24' : '#94a3b8';
    return `<div class="rating-bar-row">
      <span class="bar-label">${star} &#9733;</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${barColor};"></div></div>
      <span class="bar-count">${count}</span>
    </div>`;
  }).join('');

  /* ── Big stars ── */
  const bigStarsHtml = [1,2,3,4,5].map((i) =>
    `<span style="font-size:22px;color:${i <= Math.floor(spot.rating || 4.5) ? '#f29221' : '#d1d5db'};">&#9733;</span>`
  ).join('');

  /* ── Filter tabs ── */
  const filterTabsHtml = `<button class="filter-tab active" onclick="filterReviews(0,this)">All (${reviewCount})</button>`
    + [5,4,3,2,1].map((s) => {
        const cnt = SAMPLE_REVIEWS.filter((r) => r.stars === s).length;
        return `<button class="filter-tab" onclick="filterReviews(${s},this)">${s} &#9733; (${cnt})</button>`;
      }).join('');

  /* ── CSS ── */
  const css = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',sans-serif;background:#f1f5f9;color:#263f4f;min-height:100vh}

    /* Topbar */
    .topbar{background:#263f4f;padding:14px 20px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:100;box-shadow:0 2px 16px rgba(38,63,79,.3)}
    .close-btn{background:rgba(242,146,33,.15);border:1.5px solid rgba(242,146,33,.4);color:#f29221;font-size:12px;font-weight:800;padding:7px 16px;border-radius:10px;cursor:pointer;white-space:nowrap;transition:all .15s;font-family:inherit}
    .close-btn:hover{background:rgba(242,146,33,.28);transform:translateX(-2px)}
    .topbar-name{font-size:16px;font-weight:900;color:#fff;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    /* Gallery */
    .gallery{position:relative;overflow:hidden;background:#1e293b;max-height:300px}
    .slides-wrap{display:flex;transition:transform .42s cubic-bezier(.4,0,.2,1)}
    .slide{min-width:100%;height:300px;overflow:hidden}
    .slide img{width:100%;height:100%;object-fit:cover;display:block}
    .gallery-dots{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:5}
    .dot{width:8px;height:8px;border-radius:50%;border:none;background:rgba(255,255,255,.4);cursor:pointer;transition:all .22s;padding:0;outline:none}
    .dot.active{background:#fff;width:22px;border-radius:4px}
    .gallery-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.38);border:none;color:#fff;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;z-index:5;transition:background .15s;outline:none;font-family:inherit}
    .gallery-nav:hover{background:rgba(0,0,0,.65)}
    .gallery-nav.prev{left:14px}.gallery-nav.next{right:14px}

    /* Page layout */
    .page{max-width:740px;margin:0 auto;padding:0 0 100px}

    /* Cards */
    .card{background:#fff;margin:16px;border-radius:22px;padding:22px;box-shadow:0 2px 16px rgba(38,63,79,.07);border:1.5px solid rgba(38,63,79,.06)}

    /* Info */
    .space-title{font-size:22px;font-weight:900;color:#263f4f;margin-bottom:8px;line-height:1.25}
    .location-pill{display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;color:#64748b;margin-bottom:18px}
    .space-desc-text{font-size:14px;color:#475569;font-weight:500;line-height:1.6;margin-bottom:14px}
    .details-price-slots{display:flex;gap:16px;margin-bottom:18px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:16px;padding:12px 16px}
    .details-price,.details-slots{flex:1;display:flex;flex-direction:column;gap:4px}
    .details-price{border-right:1.5px solid #e2e8f0;padding-right:16px}
    .details-label{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
    .details-value{font-size:16px;font-weight:900;color:#263f4f}
    .divider{height:1px;background:#f1f5f9;margin:16px 0}

    /* Rating summary */
    .rating-summary{display:flex;align-items:flex-start;gap:0}
    .big-num{font-size:50px;font-weight:900;color:#263f4f;line-height:1;text-align:center}
    .review-cnt{font-size:11px;color:#94a3b8;font-weight:600;text-align:center;margin-top:5px}
    .left-rating{text-align:center;padding-right:18px;border-right:1.5px solid #f1f5f9;min-width:90px}
    .rating-bars{flex:1;padding-left:18px}
    .rating-bar-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
    .bar-label{font-size:11px;font-weight:700;color:#64748b;width:34px;text-align:right;white-space:nowrap}
    .bar-track{flex:1;height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden}
    .bar-fill{height:100%;border-radius:4px;transition:width .5s ease}
    .bar-count{font-size:11px;font-weight:600;color:#94a3b8;width:18px;text-align:right}

    /* Book button */
    .book-btn{display:block;width:calc(100% - 32px);margin:0 16px 16px;background:linear-gradient(135deg,#0a7c6e 0%,#12b0a0 100%);color:#fff;border:none;border-radius:18px;padding:18px 24px;font-size:16px;font-weight:900;cursor:pointer;text-align:center;box-shadow:0 8px 24px rgba(10,124,110,.38);transition:all .2s;letter-spacing:.3px;font-family:inherit}
    .book-btn:hover{transform:translateY(-3px);box-shadow:0 14px 32px rgba(10,124,110,.48)}
    .book-btn:active{transform:translateY(0);box-shadow:0 4px 12px rgba(10,124,110,.25)}

    /* Section title */
    .section-title{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:#263f4f;margin-bottom:16px}

    /* Amenities */
    .amenities-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:10px}
    .amenity-card{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:13px 11px;display:flex;align-items:center;gap:10px;transition:all .15s;cursor:default}
    .amenity-card:hover{background:#fff;border-color:#0a7c6e;box-shadow:0 2px 10px rgba(10,124,110,.14);transform:translateY(-1px)}
    .amenity-icon{font-size:22px;flex-shrink:0}
    .amenity-label{font-size:12px;font-weight:700;color:#263f4f;line-height:1.3}

    /* Vehicle Rates */
    .rates-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:10px}
    .rate-item{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;transition:all .15s}
    .rate-item:hover{background:#fff;border-color:#0a7c6e;box-shadow:0 2px 10px rgba(10,124,110,.14);transform:translateY(-1px)}
    .rate-vehicle{display:flex;align-items:center;gap:8px}
    .rate-emoji{font-size:20px}
    .rate-name{font-size:12px;font-weight:700;color:#263f4f}
    .rate-val{font-size:14px;font-weight:900;color:#f29221}

    /* Filter tabs */
    .filter-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:18px;scrollbar-width:none}
    .filter-tabs::-webkit-scrollbar{display:none}
    .filter-tab{background:#f1f5f9;border:1.5px solid #e2e8f0;color:#64748b;font-size:12px;font-weight:800;padding:7px 16px;border-radius:20px;cursor:pointer;white-space:nowrap;transition:all .15s;flex-shrink:0;font-family:inherit}
    .filter-tab:hover{background:#e8edf2;border-color:#cbd5e1}
    .filter-tab.active{background:#263f4f;border-color:#263f4f;color:#fff}

    /* Review cards */
    .review-card{background:#f8fafc;border:1.5px solid #e8edf2;border-radius:18px;padding:18px;margin-bottom:12px;transition:all .2s}
    .review-card:hover{background:#fff;box-shadow:0 4px 20px rgba(38,63,79,.09);border-color:#cbd5e1;transform:translateY(-1px)}
    .review-header{display:flex;align-items:center;gap:13px;margin-bottom:11px}
    .avatar{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;flex-shrink:0;letter-spacing:.5px;box-shadow:0 2px 8px rgba(0,0,0,.15)}
    .reviewer-info{flex:1;min-width:0}
    .reviewer-name{font-size:14px;font-weight:800;color:#263f4f}
    .review-date{font-size:11px;color:#94a3b8;font-weight:600;margin-top:3px}
    .review-stars{display:flex;gap:1px;flex-shrink:0}
    .review-text{font-size:13px;line-height:1.7;color:#475569;margin-bottom:13px}
    .review-footer{display:flex;align-items:center}
    .helpful-btn{font-size:12px;font-weight:700;color:#94a3b8;cursor:pointer;padding:6px 14px;border-radius:20px;background:#f1f5f9;border:1.5px solid #e2e8f0;transition:all .15s;font-family:inherit}
    .helpful-btn:hover{background:#e2e8f0;color:#64748b}
    .helpful-btn.liked{color:#0a7c6e;background:rgba(10,124,110,.09);border-color:rgba(10,124,110,.28)}
    .no-reviews{text-align:center;padding:36px 0;color:#94a3b8;font-size:14px;font-weight:600}

    /* WebView Native Integration */
    .in-webview .topbar {
      display: none !important;
    }

    /* Modal Overlays & Cards */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(38, 63, 79, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      padding: 20px;
    }
    .modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .modal-card {
      background: #fff;
      border-radius: 24px;
      padding: 28px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(38,63,79,0.25);
      border: 1.5px solid rgba(38,63,79,0.1);
      transform: translateY(20px) scale(0.95);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .modal-overlay.active .modal-card {
      transform: translateY(0) scale(1);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .modal-header h3 {
      font-size: 18px;
      font-weight: 900;
      color: #263f4f;
    }
    .modal-close {
      background: rgba(38,63,79,0.06);
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      color: #263f4f;
      font-size: 16px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .modal-close:hover {
      background: rgba(38,63,79,0.12);
    }
    .modal-desc {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 20px;
      font-weight: 600;
    }

    /* Payment Buttons */
    .payment-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .payment-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-radius: 16px;
      border: 2px solid #e2e8f0;
      background: #f8fafc;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: inherit;
      outline: none;
    }
    .payment-btn:hover {
      border-color: #0a7c6e;
      background: #fff;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(10,124,110,0.12);
    }
    .payment-btn:active {
      transform: translateY(0);
    }
    .payment-btn-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .payment-btn span {
      font-size: 15px;
      font-weight: 800;
      color: #263f4f;
    }
    .payment-logo {
      height: 24px;
      width: auto;
      object-fit: contain;
    }
    .payment-arrow {
      font-size: 16px;
      color: #94a3b8;
      font-weight: 800;
      transition: color 0.15s;
    }
    .payment-btn:hover .payment-arrow {
      color: #0a7c6e;
    }

    /* Success Confirmation Modal */
    .success-card {
      text-align: center;
      align-items: center;
    }
    .success-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(10,124,110,0.1);
      border: 2px dashed #0a7c6e;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
    }
    .success-icon {
      font-size: 36px;
      color: #0a7c6e;
    }
    .success-card h2 {
      font-size: 20px;
      font-weight: 900;
      color: #263f4f;
      margin-bottom: 8px;
    }
    .success-msg {
      font-size: 13px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 18px;
      font-weight: 600;
    }
    .booking-summary-box {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
      width: 100%;
      text-align: left;
      margin-bottom: 22px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
    }
    .summary-row span.val {
      color: #263f4f;
      font-weight: 800;
    }
    .modal-done-btn {
      width: 100%;
      background: #263f4f;
      color: #fff;
      border: none;
      border-radius: 14px;
      padding: 14px 20px;
      font-size: 14px;
      font-weight: 900;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    .modal-done-btn:hover {
      background: #0a7c6e;
    }

    /* Cancel Confirmation Modal */
    .cancel-card {
      text-align: center;
      align-items: center;
    }
    .warning-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(220,38,38,0.1);
      border: 2px dashed #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
    }
    .warning-icon {
      font-size: 36px;
      color: #dc2626;
    }
    .cancel-card h2 {
      font-size: 20px;
      font-weight: 900;
      color: #263f4f;
      margin-bottom: 8px;
    }
    .cancel-desc {
      font-size: 13px;
      line-height: 1.6;
      color: #64748b;
      margin-bottom: 22px;
      font-weight: 600;
    }
    .cancel-actions {
      display: flex;
      gap: 12px;
      width: 100%;
    }
    .cancel-btn-action {
      flex: 1;
      padding: 13px;
      border: none;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .cancel-btn-action.keep {
      background: #f1f5f9;
      color: #475569;
      border: 1.5px solid #e2e8f0;
    }
    .cancel-btn-action.keep:hover {
      background: #e2e8f0;
    }
    .cancel-btn-action.confirm {
      background: #dc2626;
      color: #fff;
    }
    .cancel-btn-action.confirm:hover {
      background: #b91c1c;
    }

    /* Cancel Booking button style */
    .book-btn.booked {
      background: linear-gradient(135deg,#dc2626 0%,#f43f5e 100%);
      box-shadow: 0 8px 24px rgba(220,38,38,.38);
    }
    .book-btn.booked:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 32px rgba(220,38,38,.48);
    }
    .book-btn.booked:active {
      transform: translateY(0);
      box-shadow: 0 4px 12px rgba(220,38,38,.25);
    }

    /* Request for Departure button style */
    .book-btn.departure {
      background: linear-gradient(135deg,#0a7c6e 0%,#0f9f8c 100%);
      box-shadow: 0 8px 24px rgba(10,124,110,.38);
    }
    .book-btn.departure:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 32px rgba(10,124,110,.48);
    }
    .book-btn.departure:active {
      transform: translateY(0);
      box-shadow: 0 4px 12px rgba(10,124,110,.25);
    }

    /* Unavailable button style */
    .book-btn.unavailable {
      background: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
    }
    .book-btn.unavailable:hover, .book-btn.unavailable:active {
      transform: none;
      box-shadow: none;
    }
  `;

  /* ── Inline JS ── */
  const js = `
    var cur = 0, tot = ${allImages.length};
    function goTo(n) {
      cur = n;
      document.getElementById('sw').style.transform = 'translateX(-' + (n * 100) + '%)';
      document.querySelectorAll('.dot').forEach(function(d, i) { d.classList.toggle('active', i === n); });
    }
    function shiftSlide(d) { goTo((cur + d + tot) % tot); }
    function filterReviews(stars, btn) {
      document.querySelectorAll('.filter-tab').forEach(function(t) { t.classList.remove('active'); });
      btn.classList.add('active');
      var cards = document.querySelectorAll('.review-card'), shown = 0;
      cards.forEach(function(c) {
        var s = parseInt(c.getAttribute('data-stars')), show = (stars === 0 || s === stars);
        c.style.display = show ? 'block' : 'none';
        if (show) shown++;
      });
      var el = document.getElementById('emptyR');
      if (el) el.style.display = shown === 0 ? 'block' : 'none';
    }
    function toggleHelpful(btn, base) {
      btn.classList.toggle('liked');
      var liked = btn.classList.contains('liked');
      btn.innerHTML = '&#128077; Helpful (' + (liked ? base + 1 : base) + ')';
    }

    // WebView Detection & Inject Body Class
    if (window.ReactNativeWebView) {
      document.body.classList.add('in-webview');
    }

    // Booking Flow State & Functions
    var isBooked = ${initiallyBooked ? 'true' : 'false'};
    var hasArrived = ${initiallyArrived ? 'true' : 'false'};
    var walletBalance = 150.00;
    var reservationFee = ${spot.priceNum / 2};

    function updateWalletDisplay() {
      var reserveBalEl = document.getElementById('reserveWalletBalance');
      var reserveRemEl = document.getElementById('reserveRemainingBalance');
      if (reserveBalEl) reserveBalEl.innerText = '₱' + walletBalance.toFixed(2);
      if (reserveRemEl) reserveRemEl.innerText = '₱' + (walletBalance - reservationFee).toFixed(2);
    }

    function handleBookClick() {
      if (isBooked) {
        if (hasArrived) {
          // Trigger departure request
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestDeparture', spotId: '${spot.id}' }));
          } else {
            if (window.opener) {
              window.opener.postMessage(JSON.stringify({ type: 'requestDeparture', spotId: '${spot.id}' }), '*');
              if (window.opener.parent) {
                window.opener.parent.postMessage(JSON.stringify({ type: 'requestDeparture', spotId: '${spot.id}' }), '*');
              }
            }
          }
        } else {
          openModal('cancelModal');
        }
      } else {
        if (${spot.slots === 0}) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'noSlotsError', spotName: '${spot.name}' }));
          } else {
            openModal('noSlotsModal');
          }
          return;
        }
        updateWalletDisplay();
        openModal('reserveModal');
      }
    }

    function openModal(id) {
      var el = document.getElementById(id);
      if (el) el.classList.add('active');
    }

    function closeModal(id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('active');
    }

    function confirmReservation() {
      closeModal('reserveModal');
      
      // Deduct balance
      walletBalance -= reservationFee;
      
      // Update success wallet display
      var successBalEl = document.getElementById('successWalletBalance');
      if (successBalEl) successBalEl.innerText = '₱' + walletBalance.toFixed(2);
      
      // Open success modal
      openModal('successModal');
    }

    function finalizeBooking() {
      closeModal('successModal');
      isBooked = true;
      hasArrived = false;
      
      // Change book button to Cancel Booking state
      var btn = document.getElementById('mainBookBtn');
      if (btn) {
        btn.innerHTML = '&#10006;&nbsp;&nbsp;Cancel Booking';
        btn.className = 'book-btn booked';
      }
    }

    function onViewDirectionsClick() {
      finalizeBooking();
      
      // Send message to close native Modal and trigger centering on map
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'viewDirections', spotId: '${spot.id}' }));
      } else {
        if (window.opener) {
          window.opener.postMessage(JSON.stringify({ type: 'viewDirections', spotId: '${spot.id}' }), '*');
          if (window.opener.parent) {
            window.opener.parent.postMessage(JSON.stringify({ type: 'viewDirections', spotId: '${spot.id}' }), '*');
          }
        }
        window.close();
      }
    }

    function confirmCancelBooking() {
      closeModal('cancelModal');
      
      // Refund balance - DO NOT REFUND
      // walletBalance += reservationFee;
      isBooked = false;
      hasArrived = false;
      
      // Revert book button to original state
      var btn = document.getElementById('mainBookBtn');
      if (btn) {
        btn.innerHTML = '&#128336;&nbsp;&nbsp;Book a Slot Now';
        btn.className = 'book-btn';
      }
      
      // Premium Toast feedback
      showNotificationToast('Reservation cancelled. Reservation fee is non-refundable.');

      // Synchronize back to parent
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cancelBooking', spotId: '${spot.id}' }));
      } else {
        if (window.opener) {
          window.opener.postMessage(JSON.stringify({ type: 'cancelBooking', spotId: '${spot.id}' }), '*');
          if (window.opener.parent) {
            window.opener.parent.postMessage(JSON.stringify({ type: 'cancelBooking', spotId: '${spot.id}' }), '*');
          }
        }
      }
    }

    function showNotificationToast(msg) {
      var toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = '#263f4f';
      toast.style.color = '#fff';
      toast.style.padding = '12px 24px';
      toast.style.borderRadius = '12px';
      toast.style.fontSize = '13px';
      toast.style.fontWeight = '800';
      toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
      toast.style.zIndex = '300';
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s, transform 0.25s';
      toast.style.transform = 'translate(-50%, 10px)';
      toast.innerText = msg;
      
      document.body.appendChild(toast);
      
      // trigger reflow & animate
      setTimeout(function() {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, 0)';
      }, 50);
      
      setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 10px)';
        setTimeout(function() {
          document.body.removeChild(toast);
        }, 300);
      }, 2500);
    }

    window.addEventListener('DOMContentLoaded', function() {
      if (isBooked) {
        var btn = document.getElementById('mainBookBtn');
        if (btn) {
          if (hasArrived) {
            btn.innerHTML = '&#128663;&nbsp;&nbsp;Request for Departure';
            btn.className = 'book-btn departure';
          } else {
            btn.innerHTML = '&#10006;&nbsp;&nbsp;Cancel Booking';
            btn.className = 'book-btn booked';
          }
        }
      }
    });
  `;

  let bookBtnText = '&#128336;&nbsp;&nbsp;Book a Slot Now';
  let bookBtnClass = 'book-btn';
  if (initiallyBooked) {
    if (initiallyArrived) {
      bookBtnText = '&#128663;&nbsp;&nbsp;Request for Departure';
      bookBtnClass = 'book-btn departure';
    } else {
      bookBtnText = '&#10006;&nbsp;&nbsp;Cancel Booking';
      bookBtnClass = 'book-btn booked';
    }
  } else if (spot.slots === 0) {
    bookBtnText = '&#10060;&nbsp;&nbsp;No Slots Available';
    bookBtnClass = 'book-btn unavailable';
  }

  /* ── Assemble ── */
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${spot.name} - Kanto Parking</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  <div class="page">
    <!-- Gallery -->
    <div class="gallery">
      <button class="gallery-nav prev" onclick="shiftSlide(-1)">&#8249;</button>
      <div class="slides-wrap" id="sw">${slidesHtml}</div>
      <button class="gallery-nav next" onclick="shiftSlide(1)">&#8250;</button>
      <div class="gallery-dots">${dotHtml}</div>
    </div>

    <!-- Info card -->
    <div class="card">
      <h1 class="space-title">${spot.name}</h1>
      <div class="location-pill">&#128205;&nbsp;${location}</div>
      <div class="details-price-slots">
        <div class="details-price">
          <span class="details-label">Selected Rate (${selectedVehicleMeta.emoji} ${selectedVehicleMeta.name})</span>
          <span class="details-value">&#8369;${pricesObj[selectedVehicle] ?? 0}/hr</span>
        </div>
        <div class="details-slots">
          <span class="details-label">Available Slots</span>
          <span class="details-value" style="color: ${spot.slots > 0 ? '#0a7c6e' : '#dc2626'}">${spot.slots > 0 ? spot.slots + ' available' : 'No slots available'}</span>
        </div>
      </div>
      <p class="space-desc-text">${spot.description || ''}</p>
      <div class="divider"></div>
      <div class="rating-summary">
        <div class="left-rating">
          <div class="big-num">${ratingNum}</div>
          <div style="display:flex;justify-content:center;gap:2px;margin-top:6px;">${bigStarsHtml}</div>
          <div class="review-cnt">${reviewCount} reviews</div>
        </div>
        <div class="rating-bars">${ratingBarsHtml}</div>
      </div>
    </div>

    <!-- Vehicle Rates -->
    <div class="card">
      <div class="section-title">&#128181;&nbsp; Vehicle Rates (Per Hour)</div>
      <div class="rates-grid">${vehicleRatesHtml}</div>
    </div>

    <!-- Book Now -->
    <button class="${bookBtnClass}" id="mainBookBtn" onclick="handleBookClick()">
      ${bookBtnText}
    </button>

    <!-- Amenities -->
    <div class="card">
      <div class="section-title">&#127775;&nbsp; Amenities &amp; Features</div>
      <div class="amenities-grid">${amenityCardsHtml}</div>
    </div>

    <!-- Reviews -->
    <div class="card">
      <div class="section-title">&#9734;&nbsp; Reviews &amp; Ratings</div>
      <div class="filter-tabs">${filterTabsHtml}</div>
      <div id="reviewsList">
        ${reviewCardsHtml}
        <p id="emptyR" class="no-reviews" style="display:none;">No reviews for this rating.</p>
      </div>
    </div>
  </div>

  <!-- Reserve Confirmation Modal -->
  <div id="reserveModal" class="modal-overlay">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Confirm Reservation</h3>
        <button class="modal-close" onclick="closeModal('reserveModal')">&times;</button>
      </div>
      <p class="modal-desc">Reserve a slot at <strong>${spot.name}</strong>. The reservation fee covers the first 30 minutes of parking free of charge.</p>
      
      <div class="booking-summary-box">
        <div class="summary-row">
          <span>Vehicle Type:</span>
          <span class="val">${selectedVehicleMeta.emoji} ${selectedVehicleMeta.name}</span>
        </div>
        <div class="summary-row">
          <span>My Wallet Balance:</span>
          <span class="val" id="reserveWalletBalance">&#8369;150.00</span>
        </div>
        <div class="summary-row">
          <span>Reservation Fee (30 mins):</span>
          <span class="val">&#8369;${(spot.priceNum / 2).toFixed(2)}</span>
        </div>
        <div class="summary-row" style="margin-top: 4px; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
          <span>Remaining Wallet Balance:</span>
          <span class="val" id="reserveRemainingBalance">&#8369;${(150 - spot.priceNum / 2).toFixed(2)}</span>
        </div>
        <div class="summary-row" style="margin-top: 4px; padding-top: 4px;">
          <span>Arrival Time Limit:</span>
          <span class="val" style="color: #0a7c6e; font-weight: 900;">30 minutes</span>
        </div>
      </div>
      
      <div class="cancel-actions">
        <button class="cancel-btn-action keep" onclick="closeModal('reserveModal')">Cancel</button>
        <button class="cancel-btn-action confirm" style="background:#0a7c6e;" onclick="confirmReservation()">Confirm &amp; Pay</button>
      </div>
    </div>
  </div>

  <!-- Success Confirmation Modal -->
  <div id="successModal" class="modal-overlay">
    <div class="modal-card success-card">
      <div class="success-icon-wrap">
        <span class="success-icon">&#10004;</span>
      </div>
      <h2>Booking Confirmed! 🎉</h2>
      <p class="success-msg">Your parking slot is successfully reserved at <strong>${spot.name}</strong>.</p>
      
      <div class="booking-summary-box">
        <div class="summary-row">
          <span>Parking Space:</span>
          <span class="val">${spot.name}</span>
        </div>
        <div class="summary-row">
          <span>Vehicle Type:</span>
          <span class="val">${selectedVehicleMeta.emoji} ${selectedVehicleMeta.name}</span>
        </div>
        <div class="summary-row">
          <span>Reservation Cost:</span>
          <span class="val">&#8369;${(spot.priceNum / 2).toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>New Wallet Balance:</span>
          <span class="val" id="successWalletBalance">&#8369;${(150 - spot.priceNum / 2).toFixed(2)}</span>
        </div>
        <div class="summary-row" style="margin-top: 4px; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
          <span>Arrival Policy:</span>
          <span class="val" style="color: #0a7c6e;">Please arrive within 30 mins</span>
        </div>
      </div>
      
      <button class="modal-done-btn" onclick="onViewDirectionsClick()">View Directions</button>
    </div>
  </div>

  <!-- Cancellation Confirmation Modal -->
  <div id="cancelModal" class="modal-overlay">
    <div class="modal-card cancel-card">
      <div class="warning-icon-wrap">
        <span class="warning-icon">&#10006;</span>
      </div>
      <h2>Cancel Reservation?</h2>
      <p class="cancel-desc">Are you sure you want to cancel your slot reservation at <strong>${spot.name}</strong>? Please note that reservation fees are non-refundable upon cancellation.</p>
      
      <div class="cancel-actions">
        <button class="cancel-btn-action keep" onclick="closeModal('cancelModal')">Keep Reservation</button>
        <button class="cancel-btn-action confirm" onclick="confirmCancelBooking()">Yes, Cancel Booking</button>
      </div>
    </div>
  </div>

  <!-- No Slots Warning Modal -->
  <div id="noSlotsModal" class="modal-overlay">
    <div class="modal-card success-card">
      <div class="warning-icon-wrap" style="background: rgba(242, 146, 33, 0.1); border-color: #f29221;">
        <span class="warning-icon" style="color: #f29221;">&#9888;</span>
      </div>
      <h2>No Slots Available</h2>
      <p class="success-msg">We are sorry, but <strong>${spot.name}</strong> is currently full. Please try booking another parking space.</p>
      
      <button class="modal-done-btn" onclick="closeModal('noSlotsModal')">OK</button>
    </div>
  </div>

  <script>${js}<\/script>
</body>
</html>`;
}
