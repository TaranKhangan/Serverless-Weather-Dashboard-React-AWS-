import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Heart, Settings, Wind, Droplets, Eye, Gauge, X, XCircle, Cloud, Sun, CloudRain, CloudSnow, CloudDrizzle } from 'lucide-react';


const BACKEND_URL = "https://0exlns5936.execute-api.ap-south-1.amazonaws.com/weather";



export default function WeatherDashboard() {
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherData, setWeatherData] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [unit, setUnit] = useState('metric');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (initialLoad) {
      ['New Delhi, IN', 'Mumbai, IN', 'Amritsar, Punjab, IN'].forEach(city => fetchWeather(city));
      setInitialLoad(false);
    }
  }, [initialLoad]);

  const fetchWeather = async (city, showError = false) => {
  try {
    const response = await fetch(
      `${BACKEND_URL}?type=weather&city=${encodeURIComponent(city)}&units=${unit}`
    );

    if (response.ok) {
      const data = await response.json();
      setWeatherData(prev => {
        const filtered = prev.filter(w => w.id !== data.id);
        return [...filtered, data];
      });
      setError('');
      return true;
    } else {
      const errorData = await response.json();
      if (showError) {
        if (errorData.cod === '404') {
          setError(`❌ "${city}" not found. Try format: "Mumbai, IN"`);
        } else {
          setError(`⚠️ Error: ${errorData.message || 'Unable to fetch weather data'}`);
        }
        setTimeout(() => setError(''), 6000);
      }
      return false;
    }
  } catch (error) {
    console.error("Error fetching weather:", error);
    if (showError) {
      setError('🌐 Network error. Check your internet connection.');
      setTimeout(() => setError(''), 4000);
    }
    return false;
  }
};

  const fetchForecast = async (city) => {
  try {
    const response = await fetch(
      `${BACKEND_URL}?type=forecast&city=${encodeURIComponent(city)}&units=${unit}`
    );

    if (response.ok) {
      const data = await response.json();
      setForecastData(data.list ? data : data.forecast ? { list: data.forecast } : null);

    }
  } catch (error) {
    console.error("Error fetching forecast:", error);
  }
};

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const success = await fetchWeather(searchQuery, true);
      if (success) {
        setSearchQuery('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const removeCity = (cityId, cityName) => {
    setWeatherData(weatherData.filter(w => w.id !== cityId));
    if (favorites.includes(cityName)) {
      setFavorites(favorites.filter(f => f !== cityName));
    }
  };

  const toggleFavorite = (cityName) => {
    if (favorites.includes(cityName)) {
      setFavorites(favorites.filter(f => f !== cityName));
    } else {
      setFavorites([...favorites, cityName]);
    }
  };

  const handleCityClick = (city) => {
    setSelectedCity(city);
    const cityQuery = city.sys.country ? `${city.name}, ${city.sys.country}` : city.name;
fetchForecast(cityQuery);

  };

  const toggleUnit = () => {
  const newUnit = unit === 'metric' ? 'imperial' : 'metric';
  setUnit(newUnit);

  weatherData.forEach(w => {
    const cityQuery = w.sys.country ? `${w.name}, ${w.sys.country}` : w.name;

    fetch(`${BACKEND_URL}?type=weather&city=${encodeURIComponent(cityQuery)}&units=${newUnit}`)
      .then(res => res.json())
      .then(data => {
        setWeatherData(prev => {
          const filtered = prev.filter(city => city.id !== data.id);
          return [...filtered, data];
        });
      })
      .catch(err => console.error('Error updating weather:', err));
  });

  if (selectedCity) {
    const cityQuery = selectedCity.sys.country ? `${selectedCity.name}, ${selectedCity.sys.country}` : selectedCity.name;

    fetch(`${BACKEND_URL}?type=forecast&city=${encodeURIComponent(cityQuery)}&units=${newUnit}`)
      .then(res => res.json())
      .then(data => setForecastData(data))
      .catch(err => console.error('Error updating forecast:', err));
  }
};


const getChartData = () => {
  if (!forecastData || !forecastData.list || !Array.isArray(forecastData.list)) {
    return [];
  }

  return forecastData.list.slice(0, 8).map(item => ({
    time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
    temp: Math.round(item.main.temp),
    feels: Math.round(item.main.feels_like)
  }));
};

  const getWeatherIcon = (weatherCode, iconCode) => {
    const size = 100;
    const isDay = iconCode && iconCode.includes('d');
    
    if (weatherCode >= 200 && weatherCode < 300) {
      return <CloudRain size={size} color="#a78bfa" strokeWidth={1.5} />;
    }
    if (weatherCode >= 300 && weatherCode < 400) {
      return <CloudDrizzle size={size} color="#60a5fa" strokeWidth={1.5} />;
    }
    if (weatherCode >= 500 && weatherCode < 600) {
      return <CloudRain size={size} color="#3b82f6" strokeWidth={1.5} />;
    }
    if (weatherCode >= 600 && weatherCode < 700) {
      return <CloudSnow size={size} color="#e0e7ff" strokeWidth={1.5} />;
    }
    if (weatherCode >= 700 && weatherCode < 800) {
      return <Wind size={size} color="#94a3b8" strokeWidth={1.5} />;
    }
    if (weatherCode === 800) {
      return <Sun size={size} color="#fbbf24" strokeWidth={1.5} />;
    }
    if (weatherCode > 800) {
      return <Cloud size={size} color="#64748b" strokeWidth={1.5} />;
    }
    
    return <Cloud size={size} color="#94a3b8" strokeWidth={1.5} />;
  };

  const tempUnit = unit === 'metric' ? '°C' : '°F';

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-25px) translateX(10px) rotate(5deg); }
          66% { transform: translateY(-15px) translateX(-10px) rotate(-5deg); }
          100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        .weather-card {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .weather-card:nth-child(1) { animation-delay: 0.1s; }
        .weather-card:nth-child(2) { animation-delay: 0.2s; }
        .weather-card:nth-child(3) { animation-delay: 0.3s; }
        .weather-card:nth-child(4) { animation-delay: 0.4s; }
        .weather-card:nth-child(5) { animation-delay: 0.5s; }
        .weather-card:nth-child(6) { animation-delay: 0.6s; }
        .floating-icon {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{...styles.titleContainer, animation: mounted ? 'slideInRight 0.8s ease-out' : 'none'}}>
            <h1 style={styles.title}>🌤️ Weather Analytics</h1>
            <p style={styles.subtitle}>Real-time weather data from around the world</p>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} style={styles.settingsBtn}>
            <Settings size={24} />
          </button>
        </div>
      </header>

      <div style={styles.floatingElements}>
        <div className="floating-icon" style={{...styles.floatingIcon, animationDelay: '0s', top: '60px', left: '8%'}}>
          <Sun size={50} color="#fbbf24" opacity={0.25} />
        </div>
        <div className="floating-icon" style={{...styles.floatingIcon, animationDelay: '1.5s', top: '140px', left: '85%'}}>
          <Cloud size={65} color="#94a3b8" opacity={0.2} />
        </div>
        <div className="floating-icon" style={{...styles.floatingIcon, animationDelay: '3s', top: '220px', left: '12%'}}>
          <CloudRain size={45} color="#60a5fa" opacity={0.22} />
        </div>
        <div className="floating-icon" style={{...styles.floatingIcon, animationDelay: '4.5s', top: '100px', left: '45%'}}>
          <CloudDrizzle size={40} color="#8b5cf6" opacity={0.18} />
        </div>
        <div className="floating-icon" style={{...styles.floatingIcon, animationDelay: '2.5s', top: '180px', left: '75%'}}>
          <Wind size={42} color="#94a3b8" opacity={0.2} />
        </div>
        <div className="floating-icon" style={{...styles.floatingIcon, animationDelay: '5s', top: '90px', left: '92%'}}>
          <CloudSnow size={38} color="#e0e7ff" opacity={0.15} />
        </div>
        <div className="floating-icon" style={{...styles.floatingIcon, animationDelay: '1s', top: '250px', left: '35%'}}>
          <Sun size={35} color="#fbbf24" opacity={0.15} />
        </div>
      </div>

      {showSettings && (
        <div style={styles.modal} onClick={() => setShowSettings(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Settings</h2>
              <button onClick={() => setShowSettings(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.settingItem}>
              <span>Temperature Unit</span>
              <button onClick={toggleUnit} style={styles.toggleBtn}>
                {unit === 'metric' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.searchContainer}>
        <div style={styles.searchBox}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search: Mumbai, Goa IN, Amritsar Punjab IN, London UK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            style={styles.searchInput}
          />
          <button onClick={handleSearch} style={styles.searchBtn}>Search</button>
        </div>
        {error && (
          <div style={styles.errorMessage}>
            <XCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <div style={styles.searchHint}>
          💡 <strong>Pro Tip:</strong> For Indian cities try: "Ludhiana, IN" • "Chandigarh, IN" • "Jalandhar, Punjab, IN"
        </div>
      </div>

      <div style={styles.mainContent}>
        {!selectedCity ? (
          <div style={styles.dashboard}>
            <h2 style={styles.sectionTitle}>
              Your Cities {weatherData.length > 0 && `(${weatherData.length})`}
            </h2>
            {weatherData.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{animation: 'pulse 3s ease-in-out infinite'}}>
                  <Cloud size={80} color="#94a3b8" opacity={0.4} />
                </div>
                <p style={styles.emptyText}>🔍 Search for any city, village, or district!</p>
                <p style={styles.emptySubtext}>Try: Delhi, Mumbai, Amritsar, London, New York</p>
              </div>
            ) : (
              <div style={styles.cardsGrid}>
                {weatherData.map((city) => (
                  <div
                    key={city.id}
                    className="weather-card"
                    style={styles.card}
                    onClick={() => handleCityClick(city)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.borderColor = '#334155';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.2)';
                    }}
                  >
                    <div style={styles.cardHeader}>
                      <h3 style={styles.cityName}>
                        {city.name}
                        {city.sys.country && <span style={styles.countryCode}>, {city.sys.country}</span>}
                      </h3>
                      <div style={styles.cardActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(city.name);
                          }}
                          style={styles.favoriteBtn}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2) rotate(10deg)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
                        >
                          <Heart
                            size={18}
                            fill={favorites.includes(city.name) ? '#ff6b6b' : 'none'}
                            color={favorites.includes(city.name) ? '#ff6b6b' : '#94a3b8'}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCity(city.id, city.name);
                          }}
                          style={styles.removeBtn}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.2) rotate(90deg)';
                            e.currentTarget.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                            e.currentTarget.style.opacity = '0.7';
                          }}
                        >
                          <XCircle size={18} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                    <div style={styles.weatherIcon}>
                      {city.weather && city.weather[0] && city.weather[0].icon ? (
                        <img
                          src={`https://openweathermap.org/img/wn/${city.weather[0].icon}@2x.png`}
                          alt={city.weather[0].description}
                          style={styles.iconImg}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent && !parent.querySelector('svg')) {
                              const iconContainer = document.createElement('div');
                              iconContainer.style.display = 'flex';
                              iconContainer.style.justifyContent = 'center';
                              parent.appendChild(iconContainer);
                            }
                          }}
                        />
                      ) : (
                        getWeatherIcon(city.weather[0]?.id, city.weather[0]?.icon)
                      )}
                    </div>
                    <div style={styles.temperature}>
                      {Math.round(city.main.temp)}{tempUnit}
                    </div>
                    <div style={styles.description}>
                      {city.weather[0]?.description || 'Clear'}
                    </div>
                    <div style={styles.stats}>
                      <div style={styles.stat}>
                        <Droplets size={16} />
                        <span>{city.main.humidity}%</span>
                      </div>
                      <div style={styles.stat}>
                        <Wind size={16} />
                        <span>{Math.round(city.wind.speed)} m/s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={styles.detailView}>
            <button 
              onClick={() => setSelectedCity(null)} 
              style={styles.backBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#334155';
                e.currentTarget.style.transform = 'translateX(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e293b';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              ← Back to Dashboard
            </button>
            <div style={styles.detailHeader}>
              <div>
                <h2 style={styles.detailCity}>{selectedCity.name}, {selectedCity.sys.country}</h2>
                <p style={styles.detailDesc}>{selectedCity.weather[0].description}</p>
              </div>
              {selectedCity.weather[0].icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${selectedCity.weather[0].icon}@4x.png`}
                  alt={selectedCity.weather[0].description}
                  style={styles.detailIcon}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>

            <div style={styles.detailTemp}>
              {Math.round(selectedCity.main.temp)}{tempUnit}
            </div>

            <div style={styles.detailStats}>
              <div style={styles.detailStat}>
                <div style={styles.statIcon}><Droplets size={24} /></div>
                <div>
                  <div style={styles.statLabel}>Humidity</div>
                  <div style={styles.statValue}>{selectedCity.main.humidity}%</div>
                </div>
              </div>
              <div style={styles.detailStat}>
                <div style={styles.statIcon}><Wind size={24} /></div>
                <div>
                  <div style={styles.statLabel}>Wind Speed</div>
                  <div style={styles.statValue}>{Math.round(selectedCity.wind.speed)} m/s</div>
                </div>
              </div>
              <div style={styles.detailStat}>
                <div style={styles.statIcon}><Eye size={24} /></div>
                <div>
                  <div style={styles.statLabel}>Visibility</div>
                  <div style={styles.statValue}>{(selectedCity.visibility / 1000).toFixed(1)} km</div>
                </div>
              </div>
              <div style={styles.detailStat}>
                <div style={styles.statIcon}><Gauge size={24} /></div>
                <div>
                  <div style={styles.statLabel}>Pressure</div>
                  <div style={styles.statValue}>{selectedCity.main.pressure} hPa</div>
                </div>
              </div>
            </div>

            {forecastData && (
              <div style={styles.chartContainer}>
                <h3 style={styles.chartTitle}>Temperature Forecast (Next 24 Hours)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Temperature"
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="feels"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Feels Like"
                      dot={{ fill: '#8b5cf6', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: '2.5rem',
    position: 'relative',
    overflow: 'hidden'
  },
  header: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #2563eb 100%)',
    padding: '2rem 1.25rem',
    boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.3)',
    position: 'relative',
    overflow: 'hidden'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: '700',
    textShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.3)'
  },
  subtitle: {
    margin: 0,
    fontSize: '0.875rem',
    opacity: 0.9,
    fontWeight: '400'
  },
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '320px',
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden'
  },
  floatingIcon: {
    position: 'absolute'
  },
  settingsBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    cursor: 'pointer',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s',
    backdropFilter: 'blur(10px)'
  },
  searchContainer: {
    maxWidth: '1200px',
    margin: '32px auto',
    padding: '0 20px',
    position: 'relative',
    zIndex: 1
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    color: '#64748b',
    pointerEvents: 'none',
    zIndex: 1
  },
  searchInput: {
    flex: 1,
    padding: '16px 16px 16px 48px',
    backgroundColor: '#1e293b',
    border: '2px solid #334155',
    borderRadius: '12px',
    color: '#e2e8f0',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.3s'
  },
  searchBtn: {
    padding: '1rem 1.4rem',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  searchHint: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#94a3b8',
    paddingLeft: '4px'
  },
  errorMessage: {
    marginTop: '12px',
    padding: '12px 16px',
    backgroundColor: '#7f1d1d',
    border: '1px solid #991b1b',
    borderRadius: '8px',
    color: '#fecaca',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    position: 'relative',
    zIndex: 1
  },
  dashboard: {},
  sectionTitle: {
    fontSize: '26px',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#f1f5f9'
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    border: '2px dashed #334155',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  emptyText: {
    fontSize: '20px',
    color: '#e2e8f0',
    margin: 0,
    fontWeight: '500'
  },
  emptySubtext: {
    fontSize: '15px',
    color: '#94a3b8',
    margin: 0
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px'
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '1.25rem',
    padding: '1.75rem',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '0.125rem solid #334155',
    boxShadow: '0 0.25rem 0.375rem rgba(0, 0, 0, 0.2)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  cityName: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    flex: 1
  },
  countryCode: {
    fontSize: '16px',
    color: '#94a3b8',
    fontWeight: '400'
  },
  cardActions: {
    display: 'flex',
    gap: '8px'
  },
  favoriteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    transition: 'all 0.3s'
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    transition: 'all 0.3s',
    opacity: 0.7
  },
  weatherIcon: {
    textAlign: 'center',
    marginBottom: '12px',
    minHeight: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconImg: {
  width: '6.25rem',
  height: '6.25rem',
  objectFit: 'contain',
  filter: 'drop-shadow(0 0.125rem 0.25rem rgba(0,0,0,0.3))',
  transition: 'transform 0.3s ease',
},
temperature: {
    fontSize: '3.25rem',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '0.5rem',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  description: {
    textAlign: 'center',
    color: '#94a3b8',
    textTransform: 'capitalize',
    marginBottom: '20px',
    fontSize: '15px',
    fontWeight: '500'
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    paddingTop: '16px',
    borderTop: '1px solid #334155'
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    fontSize: '14px'
  },
  detailView: {},
  backBtn: {
    background: '#1e293b',
    border: '2px solid #334155',
    color: '#e2e8f0',
    padding: '14px 28px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    marginBottom: '28px',
    transition: 'all 0.3s',
    fontWeight: '500'
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  detailCity: {
    fontSize: '36px',
    fontWeight: '700',
    margin: '0 0 8px 0'
  },
  detailDesc: {
    color: '#94a3b8',
    textTransform: 'capitalize',
    fontSize: '18px',
    margin: 0
  },
  detailIcon: {
    width: '140px',
    height: '140px',
    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))'
  },
  detailTemp: {
    fontSize: '80px',
    fontWeight: '700',
    marginBottom: '32px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  detailStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  },
  detailStat: {
    backgroundColor: '#1e293b',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '2px solid #334155'
  },

  statIcon: {
    color: '#3b82f6'
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '600'
  },
  chartContainer: {
    backgroundColor: '#1e293b',
    padding: '24px',
    borderRadius: '16px',
    border: '2px solid #334155'
  },
  chartTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#f1f5f9'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
    border: '2px solid #334155'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  modalTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8'
  },
  toggleBtn: {
    padding: '1rem 1.4rem',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    margin: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  }
}