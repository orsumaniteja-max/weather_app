const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const errorMessage = document.getElementById("errorMessage");

const historyContainer =
    document.getElementById("history");

const weatherContainer =
    document.getElementById("weatherContainer");


// --------------------------------
// INIT
// --------------------------------

document.addEventListener("DOMContentLoaded", () => {

    renderHistory();

    loadWeather("Amsterdam");

});


// --------------------------------
// SEARCH
// --------------------------------

searchBtn.addEventListener("click", searchCity);

cityInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        searchCity();
    }

});


async function searchCity() {

    const city = cityInput.value.trim();

    if (!city) {
        showError("Please enter a city.");
        return;
    }

    await loadWeather(city);

    cityInput.value = "";
}


// --------------------------------
// LOAD WEATHER
// --------------------------------

async function loadWeather(city) {

    showLoading(true);
    hideError();

    try {

        const response = await fetch(
            `/api/weather?city=${encodeURIComponent(city)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Unable to get weather."
            );
        }

        renderWeather(data);

        addToHistory({
            city: data.location.city,
            country: data.location.country
        });

    } catch (error) {

        showError(error.message);

    } finally {

        showLoading(false);

    }
}


// --------------------------------
// LOCATION
// --------------------------------

locationBtn.addEventListener(
    "click",
    useCurrentLocation
);


function useCurrentLocation() {

    if (!navigator.geolocation) {

        showError(
            "Geolocation is not supported by your browser."
        );

        return;
    }

    showLoading(true);

    navigator.geolocation.getCurrentPosition(

        async position => {

            try {

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const response = await fetch(
                    `/api/weather/location?lat=${lat}&lon=${lon}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.detail || "Unable to get weather."
                    );
                }

                renderWeather(data);

                addToHistory({
                    city: data.location.city,
                    country: data.location.country
                });

            } catch (error) {

                showError(error.message);

            } finally {

                showLoading(false);

            }
        },

        () => {

            showLoading(false);

            showError(
                "Unable to access your location."
            );

        }
    );
}


// --------------------------------
// RENDER WEATHER
// --------------------------------

function renderWeather(data) {

    const location = data.location;
    const current = data.current;
    const sun = data.sun;
    const air = data.air_quality;


    document.getElementById("cityName").textContent =
        `${location.city}, ${location.country}`;


    document.getElementById("temperature").textContent =
        current.temperature;


    document.getElementById("description").textContent =
        capitalize(current.description);


    document.getElementById("weatherIcon").innerHTML =
        getWeatherIcon(current.icon);


    document.getElementById("humidity").textContent =
        `${current.humidity}%`;


    document.getElementById("wind").textContent =
        `${current.wind_speed} km/h`;


    document.getElementById("feelsLike").textContent =
        `${current.feels_like}°`;


    document.getElementById("pressure").textContent =
        `${current.pressure} hPa`;


    document.getElementById("visibility").textContent =
        `${current.visibility} km`;


    document.getElementById("sunrise").textContent =
        sun.sunrise;


    document.getElementById("sunset").textContent =
        sun.sunset;


    const airQuality =
        document.getElementById("airQuality");

    airQuality.textContent =
        air.label;

    airQuality.style.background =
        air.color;


    document.getElementById(
        "recommendation"
    ).textContent =
        air.recommendation;


    renderForecast(data.forecast);


    document.getElementById("date").textContent =
        new Date().toLocaleDateString(
            undefined,
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );
}


// --------------------------------
// FORECAST
// --------------------------------

function renderForecast(forecast) {

    const container =
        document.getElementById("forecast");

    container.innerHTML = "";


    forecast.forEach(day => {

        const date = new Date(
            `${day.date}T12:00:00`
        );

        const card =
            document.createElement("div");

        card.className = "forecast-card";


        card.innerHTML = `

            <div class="forecast-day">
                ${date.toLocaleDateString(
                    undefined,
                    { weekday: "short" }
                )}
            </div>

            <div class="forecast-icon">
                ${getWeatherIcon(day.icon)}
            </div>

            <div class="forecast-temp">
                ${day.temperature}°
            </div>

            <div class="forecast-min">
                ${day.min_temperature}°
            </div>

            <div class="forecast-description">
                ${capitalize(day.description)}
            </div>

        `;


        container.appendChild(card);

    });
}


// --------------------------------
// WEATHER ICONS
// --------------------------------

function getWeatherIcon(icon) {

    const icons = {

        "01d": "☀️",
        "01n": "🌙",

        "02d": "🌤️",
        "02n": "🌤️",

        "03d": "☁️",
        "03n": "☁️",

        "04d": "☁️",
        "04n": "☁️",

        "09d": "🌧️",
        "09n": "🌧️",

        "10d": "🌦️",
        "10n": "🌧️",

        "11d": "⛈️",
        "11n": "⛈️",

        "13d": "❄️",
        "13n": "❄️",

        "50d": "🌫️",
        "50n": "🌫️"

    };

    return icons[icon] || "🌤️";
}


// --------------------------------
// HISTORY
// --------------------------------

function getHistory() {

    return JSON.parse(
        localStorage.getItem("weatherHistory") || "[]"
    );

}


function saveHistory(history) {

    localStorage.setItem(
        "weatherHistory",
        JSON.stringify(history)
    );

}


function addToHistory(place) {

    let history = getHistory();


    history = history.filter(
        item =>
            !(
                item.city.toLowerCase() ===
                place.city.toLowerCase()
            )
    );


    history.unshift(place);


    history = history.slice(0, 5);


    saveHistory(history);

    renderHistory();

}


function renderHistory() {

    const history =
        getHistory();

    historyContainer.innerHTML = "";


    if (history.length === 0) {

        historyContainer.innerHTML =
            `<span class="no-history">
                No recent searches
            </span>`;

        return;
    }


    history.forEach(place => {

        const button =
            document.createElement("button");

        button.className =
            "history-item";


        button.innerHTML = `

            <span class="history-pin">
                📍
            </span>

            <span>
                <strong>${escapeHtml(place.city)}</strong>
                <small>${escapeHtml(place.country)}</small>
            </span>

        `;


        button.addEventListener(
            "click",
            () => loadWeather(place.city)
        );


        historyContainer.appendChild(button);

    });

}


// --------------------------------
// CLEAR HISTORY
// --------------------------------

document
    .getElementById("clearHistory")
    .addEventListener("click", () => {

        localStorage.removeItem(
            "weatherHistory"
        );

        renderHistory();

    });


// --------------------------------
// UI
// --------------------------------

function showLoading(show) {

    loading.classList.toggle(
        "hidden",
        !show
    );

}


function showError(message) {

    errorMessage.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );

}


function hideError() {

    errorBox.classList.add(
        "hidden"
    );

}


function capitalize(value) {

    if (!value) return "";

    return value.charAt(0).toUpperCase()
        + value.slice(1);

}


function escapeHtml(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
