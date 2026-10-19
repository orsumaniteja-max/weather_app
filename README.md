# Weather App

## Setup

1. Install Python dependencies:

   ```powershell
   python -m pip install -r requirements.txt
   ```

2. Set `OPENWEATHER_API_KEY` in `.env` using a valid OpenWeather API key.
   The app uses OpenWeather geocoding, current weather, five-day forecast,
   and air pollution endpoints.

3. Start the app from the project directory:

   ```powershell
   python run.py
   ```

4. Open <http://127.0.0.1:8000>.

The app also loads its `.env` file and frontend files relative to the project,
so the server can be started from another working directory.