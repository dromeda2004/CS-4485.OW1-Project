import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addressPoints as staticAddressPoints } from "../addressPoints";
import {
  fetchAddressPoints,
  fetchTopPostsByLocation,
  fetchSearchLocation,
} from "../api/addressPointsApi";
import { fetchFirstResponders } from "../api/firstRespondersApi";
import "leaflet.heat";
import HeatmapLayer from "../components/HeatmapLayer";
import { Link } from "react-router-dom";

export default function Home() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [points, setPoints] = useState(staticAddressPoints);
  const [source, setSource] = useState("static");
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [responders, setResponders] = useState([]);
  const [responderFilters, setResponderFilters] = useState({
    police: true,
    fire: true,
    hospital: true,
    shelter: true,
  });
  const [topPost, setTopPost] = useState(null);
  const [loadingTopPost, setLoadingTopPost] = useState(false);
  const [topPostError, setTopPostError] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoadingPoints(true);
    fetchAddressPoints()
      .then(({ points: pnts, source: src }) => {
        if (!mounted) return;
        setPoints(pnts);
        setSource(src);
      })
      .catch((err) => {
        console.error("fetchAddressPoints failed", err);
      })
      .finally(() => mounted && setLoadingPoints(false));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchFirstResponders()
      .then((list) => {
        if (mounted) setResponders(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.warn("fetchFirstResponders failed", err));
    return () => {
      mounted = false;
    };
  }, []);

  // Map raw disaster type string to one of the UI filter categories
  function classifyDisasterType(type) {
    if (!type) return undefined;
    const t = String(type).toLowerCase();
    if (t.includes("wildfire")) return "Wildfires";
    if (t.includes("earthquake")) return "Earthquakes";
    if (t.includes("tsunami")) return "Tsunamis";
    if (t.includes("flood")) return "Floods";
    if (t.includes("tornado")) return "Tornado";
    // storm category includes cyclone, storm, typhoon, hurricane
    if (
      t.includes("storm") ||
      t.includes("cyclone") ||
      t.includes("typhoon") ||
      t.includes("hurricane")
    )
      return "Storms";
    return undefined;
  }

  // Filtered points according to the selected disaster category
  const filteredPoints = points.filter((p) => {
    if (!p || !Array.isArray(p)) return false;
    if (filter === "All") return true;
    const disasterType = p[3];
    const category = classifyDisasterType(disasterType);
    return category === filter;
  });

  // Icon cache to avoid recreating divIcons repeatedly
  const iconCache = {};
  function getCategoryIcon(category) {
    const key = category || "default";
    if (iconCache[key]) return iconCache[key];

    const emojiMap = {
      Wildfires: "🔥",
      Earthquakes: "🌎",
      Tsunamis: "🌊",
      Floods: "🌧️",
      Tornado: "🌪️",
      Storms: "⛈️",
      default: "📍",
    };

    const emoji = emojiMap[category] || emojiMap["default"];
    const html = `
      <div style="font-size:18px;line-height:18px;text-align:center;">
        ${emoji}
      </div>
    `;

    const icon = L.divIcon({
      html,
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    iconCache[key] = icon;
    return icon;
  }

  function getResponderIcon(type) {
    const key = `responder-${type}`;
    if (iconCache[key]) return iconCache[key];

    const emojiByType = {
      police: "🚓",
      fire: "🚒",
      hospital: "🏥",
      shelter: "🛖",
    };
    const emoji = emojiByType[type] || "🆘";
    const html = `
      <div style="font-size:18px;line-height:18px;text-align:center;">
        ${emoji}
      </div>
    `;
    const icon = L.divIcon({
      html,
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    iconCache[key] = icon;
    return icon;
  }

  function toRad(v) {
    return (v * Math.PI) / 180;
  }
  function haversineKm(a, b) {
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  const activeDisasterCoords = useMemo(
    () => filteredPoints.map((p) => [p[0], p[1]]),
    [filteredPoints]
  );

  const heatmapOptions = useMemo(
    () => ({
      radius: 45,
      blur: 35,
      gradient: {
        0.0: "darkblue",
        0.3: "blue",
        0.5: "green",
        0.7: "yellow",
        1.0: "red",
      },
    }),
    []
  );

  const visibleResponders = useMemo(() => {
    if (
      !responders ||
      responders.length === 0 ||
      activeDisasterCoords.length === 0
    )
      return [];
    const radiusKm = 200; // increased proximity radius to ensure visibility near active disasters
    const enabledTypes = Object.entries(responderFilters)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (enabledTypes.length === 0) return [];
    return responders
      .filter((r) => enabledTypes.includes(r.type))
      .map((r) => {
        let minDist = Infinity;
        for (const dc of activeDisasterCoords) {
          const d = haversineKm([r.lat, r.lng], dc);
          if (d < minDist) minDist = d;
        }
        return { ...r, distanceKm: minDist };
      })
      .filter((r) => r.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 300); // defensive cap
  }, [responders, activeDisasterCoords, responderFilters]);

  // Memoize heatmap points to prevent unnecessary re-renders
  const heatmapPoints = useMemo(() => {
    return filteredPoints.map((p) => [p[0], p[1], Number(p[2]) || 1]);
  }, [filteredPoints]);

  // const posts = [
  //   {
  //     user: "User1",
  //     time: "2h",
  //     text: "Massive flood in India displaces thousands of people.",
  //     hashtag: "#IndiaFlood",
  //     category: "Floods and Typhoons",
  //   },
  //   {
  //     user: "User2",
  //     time: "5h",
  //     text: "Tropical cyclone causes severe damage in Philippines.",
  //     hashtag: "#Typhoon",
  //     category: "Floods and Typhoons",
  //   },
  //   {
  //     user: "User3",
  //     time: "1d",
  //     text: "Strong earthquake hits California, shaking buildings.",
  //     hashtag: "#Earthquake",
  //     category: "Earthquakes",
  //   },
  //   {
  //     user: "User4",
  //     time: "3d",
  //     text: "Wildfires spread rapidly in Australia causing evacuations.",
  //     hashtag: "#Wildfire",
  //     category: "Wildfires",
  //   },
  // ];
  async function showTopPost(locationName) {
    setLoadingTopPost(true);
    setTopPostError(null);
    setTopPost(null);

    try {
      const data = await fetchTopPostsByLocation(locationName);
      if (data && data.top_posts && data.top_posts.length > 0) {
        setTopPost(data.top_posts[0]);
      } else {
        setTopPostError("No top posts found for this location.");
      }
    } catch (err) {
      setTopPostError(err.message || "Failed to fetch top post.");
    }
    setLoadingTopPost(false);
  }

  async function handleSearchSubmit(e) {
    if (e.key === "Enter") {
      setSearchLoading(true);
      setSearchError(null);
      setSearchResults(null);
      try {
        const result = await fetchSearchLocation(search);
        if (result) {
          setSearchResults(result);
        } else {
          setSearchError("No results found.");
        }
      } catch (err) {
        setSearchError("Search failed.");
      }
      setSearchLoading(false);
    }
  }
  async function triggerSearch() {
    if (!search) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const result = await fetchSearchLocation(search);
      if (result) {
        setSearchResults(result);

        // Fly to the searched coordinates on the map
        if (mapRef.current) {
          const map = mapRef.current;
          map.flyTo([result.coordinates.lat, result.coordinates.lng], 10); // zoom level 10 example
        }
      } else {
        setSearchError("No results found.");
      }
    } catch (err) {
      setSearchError("Search failed.");
    }
    setSearchLoading(false);
  }

  async function handleSearchSubmit(e) {
    if (e.key === "Enter") {
      await triggerSearch();
    }
  }
  function RecenterMap({ lat, lng, zoom }) {
    const map = useMap();

    useEffect(() => {
      if (lat && lng) {
        map.flyTo([lat, lng], zoom || 10);
      }
    }, [lat, lng, zoom, map]);

    return null; // This component does not render anything visible
  }

  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center p-6 font-sans">
      <header className="w-full max-w-6xl flex items-center justify-between mb-6">
        <h1 className="text-white font-bold text-3xl">DISASTER TRACKER</h1>
        <nav className="flex gap-3">
          <Link
            to="/"
            className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
          >
            Landing
          </Link>
          <Link
            to="/home"
            className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
          >
            Home
          </Link>
          <Link
            to="/breakingposts"
            className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
          >
            Breaking Posts
          </Link>
          <Link
            to="/firstresponders"
            className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
          >
            First Responders
          </Link>
          <Link
            to="/faq"
            className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
          >
            FAQ
          </Link>
          <Link
            to="/statistics"
            className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
          >
            Statistics
          </Link>
        </nav>
      </header>

      <div className="flex items-center bg-white rounded-lg shadow px-3 py-2 w-[400px] mb-4">
        <input
          type="text"
          placeholder="Search location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchSubmit}
          className="flex-1 outline-none text-gray-700"
        />
        <button
          onClick={triggerSearch}
          aria-label="Search"
          className="ml-2 text-gray-500 text-lg"
          style={{ cursor: "pointer", background: "none", border: "none" }}
          title="Search"
        >
          🔍
        </button>
      </div>

      <div className="text-white mb-4 flex gap-2 items-center">
        <span>Filter by disaster:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1 rounded-md text-gray-700"
        >
          <option>All</option>
          <option>Storms</option>
          <option>Tornado</option>
          <option>Floods</option>
          <option>Tsunamis</option>
          <option>Earthquakes</option>
          <option>Wildfires</option>
        </select>
        <span className="ml-4">First responders:</span>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={responderFilters.police}
            onChange={(e) =>
              setResponderFilters((f) => ({ ...f, police: e.target.checked }))
            }
          />
          <span>Police</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={responderFilters.fire}
            onChange={(e) =>
              setResponderFilters((f) => ({ ...f, fire: e.target.checked }))
            }
          />
          <span>Fire</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={responderFilters.hospital}
            onChange={(e) =>
              setResponderFilters((f) => ({ ...f, hospital: e.target.checked }))
            }
          />
          <span>Hospitals</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={responderFilters.shelter}
            onChange={(e) =>
              setResponderFilters((f) => ({ ...f, shelter: e.target.checked }))
            }
          />
          <span>Shelters</span>
        </label>
      </div>

      <div className="flex gap-6 w-full items-start">
        <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col items-center w-full">
          {/* larger map: use 90vh or calc to account for header/controls */}
          <div className="w-full h-[90vh] md:h-[80vh] rounded-lg overflow-hidden">
            <MapContainer
              center={[20, 0]} // Changed to world view
              zoom={2} // Zoomed out
              minZoom={2}
              maxZoom={15}
              maxBounds={[
                [-90, -180],
                [90, 180],
              ]}
              className="w-full h-full"
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              />
              <HeatmapLayer points={heatmapPoints} options={heatmapOptions} />

              {/*
                Overlay small interactive CircleMarkers (transparent) so we can show a Tooltip on hover.
                Adjust radius/pathOptions as needed. Assumes addressPoints entries: [lat, lng, weight, info?]
              */}
              {filteredPoints.map((p, idx) => {
                const [lat, lng, weight, disasterType, locationName] = p;
                const info = disasterType
                  ? `Intensity: ${weight} — ${disasterType}`
                  : `Intensity: ${weight}`;
                const category =
                  (disasterType && classifyDisasterType(disasterType)) ||
                  undefined;
                const icon = getCategoryIcon(category);

                return (
                  <Marker
                    key={`marker-${idx}`}
                    position={[lat, lng]}
                    icon={icon}
                  >
                    <Popup>
                      <div style={{ color: "#000", textAlign: "center" }}>
                        <strong>{locationName || "Unknown Location"}</strong>
                        <br />
                        {info}
                        <br />
                        <small>
                          {lat.toFixed(4)}, {lng.toFixed(4)}
                        </small>
                        <br />
                        <button
                          style={{
                            marginTop: "8px",
                            padding: "6px 16px",
                            background: "#517b9d",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            showTopPost(locationName || "Unknown Location")
                          }
                        >
                          Show Top Post
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {visibleResponders.map((r, idx) => (
                <Marker
                  key={`responder-${idx}`}
                  position={[r.lat, r.lng]}
                  icon={getResponderIcon(r.type)}
                >
                  <Popup>
                    <div style={{ color: "#000", textAlign: "center" }}>
                      <strong>{r.name}</strong>
                      <br />
                      <span>{r.address}</span>
                      <br />
                      {r.phone && <span>{r.phone}</span>}
                      <br />
                      <small>
                        {r.distanceKm.toFixed(1)} km from nearest disaster
                      </small>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {searchResults && (
                <RecenterMap
                  lat={searchResults.coordinates.lat}
                  lng={searchResults.coordinates.lng}
                  zoom={10}
                />
              )}
            </MapContainer>
          </div>
          {loadingTopPost && (
            <p className="text-sm mt-2 text-gray-500 animate-pulse">
              Loading top posts…
            </p>
          )}

          {topPostError && (
            <p className="text-sm text-red-500">{topPostError}</p>
          )}

          {topPost &&
            (() => {
              let title = topPost?.title || topPost?.text || "No title";
              let body =
                topPost?.text || topPost?.content || "No content available";
              let showBody = title?.trim() !== body?.trim();

              return (
                <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#517b9d] to-[#2f4f67] text-white px-4 py-3 flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <span>🔥</span> Top Post
                    </h3>
                    <span className="text-xs bg-white/20 backdrop-blur px-2 py-1 rounded-full">
                      {topPost.location_name || "Unknown"}
                    </span>
                  </div>

                  <div className="p-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 leading-snug">
                      {title}
                    </h2>

                    {showBody && (
                      <p className="text-gray-800 text-base leading-relaxed mb-4">
                        {body}
                      </p>
                    )}

                    <p className="text-xs text-gray-600 italic">
                      Posted: {topPost.created_at || topPost.ingested_at}
                    </p>
                  </div>
                </div>
              );
            })()}

          {searchLoading && (
            <p className="text-sm mt-2 text-gray-500 animate-pulse">
              Searching...
            </p>
          )}

          {searchError && (
            <div className="mt-2 bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">
              {searchError}
            </div>
          )}

          {searchResults && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.5rem",
                backgroundColor: "#f0f0f0",
                borderRadius: "6px",
              }}
            >
              <h4>Coordinates:</h4>
              <p>Lat: {searchResults.coordinates.lat}</p>
              <p>Lng: {searchResults.coordinates.lng}</p>
              <p>Location: {searchResults.coordinates.locationName}</p>
              {searchResults.nearby.length > 0 && (
                <>
                  <h4>Nearby Records:</h4>
                  <ul>
                    {searchResults.nearby.map((r, i) => (
                      <li key={i}>
                        {r.location_name || `Lat: ${r.lat}, Lng: ${r.lng}`} -
                        Disaster: {r.disaster || "N/A"}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 w-full">
            <span className="font-bold text-black text-lg">Heatmap</span>
            <div className="flex-1 h-[27px] rounded-[5px] bg-gradient-to-r from-yellow-300 to-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
