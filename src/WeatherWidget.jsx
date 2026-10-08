import { useEffect, useState } from "react";
import "./WeatherWidget.css";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

function describeWeatherCode(code) {
  if (code === 0) return { label: "Giedra", icon: "☀️" };
  if ([1, 2].includes(code)) return { label: "Mažai debesuota", icon: "🌤️" };
  if (code === 3) return { label: "Debesuota", icon: "☁️" };
  if ([45, 48].includes(code)) return { label: "Rūkas", icon: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Dulksna", icon: "🌦️" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Lietus", icon: "🌧️" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Sniegas", icon: "❄️" };
  if ([95, 96, 99].includes(code)) return { label: "Perkūnija", icon: "⛈️" };
  return { label: "Oras", icon: "🌡️" };
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Nepavyko gauti orų duomenų.");
  return response.json();
}

function WeatherWidget() {
  const [cityInput, setCityInput] = useState("Vilnius");
  const [city, setCity] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWeather(cityName) {
    setLoading(true);
    setError("");
    try {
      const geocodingParams = new URLSearchParams({ name: cityName, count: "1", language: "lt", format: "json" });
      const locationData = await getJson(`${GEOCODING_URL}?${geocodingParams}`);
      const location = locationData.results?.[0];
      if (!location) throw new Error("Miestas nerastas. Patikrinkite pavadinimą.");

      const forecastParams = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        timezone: "auto",
        forecast_days: "3",
      });
      const forecast = await getJson(`${FORECAST_URL}?${forecastParams}`);
      setCity(location);
      setWeather(forecast);
    } catch (loadError) {
      setError(loadError.message || "Orų duomenų gauti nepavyko.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather("Vilnius");
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const cityName = cityInput.trim();
    if (cityName) loadWeather(cityName);
  }

  const current = weather?.current;
  const currentDescription = current ? describeWeatherCode(current.weather_code) : null;

  return (
    <section className="weather-card" aria-labelledby="weather-title">
      <header className="weather-card__header">
        <div>
          <p className="weather-card__eyebrow">Open-Meteo</p>
          <h2 id="weather-title">Oras</h2>
        </div>
        {city && <span className="weather-card__city">{city.name}{city.country ? `, ${city.country}` : ""}</span>}
      </header>

      <form className="weather-search" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="weather-city">Miestas</label>
        <input id="weather-city" value={cityInput} onChange={(event) => setCityInput(event.target.value)} placeholder="Įveskite miestą" />
        <button type="submit" disabled={loading}>{loading ? "..." : "Ieškoti"}</button>
      </form>

      {loading && <p className="weather-card__state">Kraunami orų duomenys...</p>}
      {!loading && error && <p className="weather-card__state weather-card__state--error" role="alert">{error}</p>}
      {!loading && current && (
        <>
          <div className="weather-current">
            <span className="weather-current__icon" aria-hidden="true">{currentDescription.icon}</span>
            <div>
              <p className="weather-current__temperature">{Math.round(current.temperature_2m)}°C</p>
              <p className="weather-current__description">{currentDescription.label}</p>
            </div>
          </div>
          <p className="weather-card__details">
            Jaučiama kaip {Math.round(current.apparent_temperature)}°C
            <span aria-hidden="true"> · </span>
            Vėjas {Math.round(current.wind_speed_10m)} km/h
          </p>
          <div className="weather-forecast">
            {weather.daily.time.map((date, index) => {
              const description = describeWeatherCode(weather.daily.weather_code[index]);
              return (
                <div className="weather-forecast__day" key={date}>
                  <span>{index === 0 ? "Šiandien" : new Intl.DateTimeFormat("lt-LT", { weekday: "short" }).format(new Date(`${date}T12:00:00`))}</span>
                  <span aria-hidden="true">{description.icon}</span>
                  <strong>{Math.round(weather.daily.temperature_2m_max[index])}°</strong>
                  <span>{Math.round(weather.daily.temperature_2m_min[index])}°</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default WeatherWidget;
