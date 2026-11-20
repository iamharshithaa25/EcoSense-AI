
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Users,
  Thermometer,
  Lightbulb,
  Wind,
  Monitor,
  BrainCircuit,
  Zap,
  Activity,
  RotateCcw,
  Database,
  RefreshCw,
  FileText 
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import EnergyAnalytics from "./EnergyAnalytics";
import SmartAlerts from "./SmartAlerts";
import XAIExplanation from "./XAIExplanation";
import SmartRecommendations from "./SmartRecommendations";
import SmartBoardManagement from "./SmartBoardManagement";
import ClassroomOverview from "./ClassroomOverview";
import Reports from "./Reports";
import { API_URL } from "./config";

import "./App.css";

const API = API_URL;

function SensorHistory() {
  const [readings, setReadings] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const [historyResponse, statsResponse] = await Promise.all([
        fetch(`${API}/api/history?limit=100`),
        fetch(`${API}/api/history/stats`)
      ]);

      if (!historyResponse.ok || !statsResponse.ok) {
        throw new Error("Unable to load sensor history.");
      }

      const historyData = await historyResponse.json();
      const statsData = await statsResponse.json();

      if (!historyData.success || !statsData.success) {
        throw new Error("The server could not return history data.");
      }

      setReadings(historyData.readings || []);
      setStatistics(statsData.statistics || {});
      setLastUpdated(new Date().toLocaleTimeString());

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const chartData = readings.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }),
    temperature: Number(item.temperature),
    humidity: Number(item.humidity),
    occupancy: Number(item.occupancy),
    light: Number(item.light),
    airQuality: Number(item.air_quality)
  }));

  const summaryCards = statistics
    ? [
        ["Total Readings", statistics.total_readings ?? readings.length],
        ["Average Temperature", `${Number(statistics.avg_temperature || 0).toFixed(1)} °C`],
        ["Average Humidity", `${Number(statistics.avg_humidity || 0).toFixed(1)}%`],
        ["Average Occupancy", Number(statistics.avg_occupancy || 0).toFixed(1)]
      ]
    : [];

  return (
    <section className="history-section">
      <div className="history-heading">
        <div>
          <span className="history-label">
            <Database size={17} /> SQLITE DATABASE
          </span>
          <h2>Sensor Data History</h2>
          <p>Review recorded classroom readings and monitor changes over time.</p>
        </div>

        <button
          className="history-refresh"
          onClick={loadHistory}
          disabled={loading}
        >
          <RefreshCw size={17} />
          {loading ? "Refreshing..." : "Refresh History"}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="history-stats">
        {summaryCards.map(([label, value]) => (
          <div className="history-stat-card" key={label}>
            <Database size={23} />
            <div>
              <p>{label}</p>
              <h3>{value}</h3>
            </div>
          </div>
        ))}
      </div>

      <p className="history-updated">
        Last refreshed: {lastUpdated || "Not yet refreshed"}
      </p>

      {readings.length === 0 ? (
        <div className="history-empty">
          <Database size={42} />
          <h3>No sensor readings found</h3>
          <p>Change a simulator value, wait one second, and refresh this section.</p>
        </div>
      ) : (
        <>
          <div className="history-chart-card">
            <h3>Temperature and Humidity Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#0d9488"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (%)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="history-chart-card">
            <h3>Occupancy and Air Quality Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="occupancy"
                  name="Student Occupancy"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="airQuality"
                  name="Air Quality"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="history-table-card">
            <h3>Recent Sensor Readings</h3>

            <div className="history-table-scroll">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Time</th>
                    <th>Temperature</th>
                    <th>Humidity</th>
                    <th>Occupancy</th>
                    <th>Light</th>
                    <th>Air Quality</th>
                    <th>Board</th>
                  </tr>
                </thead>
                <tbody>
                  {[...readings].reverse().slice(0, 20).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{new Date(item.timestamp).toLocaleString()}</td>
                      <td>{item.temperature} °C</td>
                      <td>{item.humidity}%</td>
                      <td>{item.occupancy}</td>
                      <td>{item.light} lux</td>
                      <td>{item.air_quality}</td>
                      <td>{item.board_active ? "ON" : "OFF"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function App() {
  const [connection, setConnection] = useState("Checking...");

  const [temperature, setTemperature] = useState(29);
  const [humidity, setHumidity] = useState(65);
  const [occupancy, setOccupancy] = useState(35);
  const [light, setLight] = useState(120);
  const [airQuality, setAirQuality] = useState(100);
  const [board, setBoard] = useState(true);

  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState({});
  const [importance, setImportance] = useState({});
  const [explanation, setExplanation] = useState(null);

  const [loading, setLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");

  const [activeSection, setActiveSection] = useState("dashboard");

  const menuItems = [
    ["Dashboard", LayoutDashboard, "dashboard"],
    ["Classroom Monitoring", Users, "classroom-monitoring"],
    ["AI Predictions", BrainCircuit, "ai-predictions"],
    ["Explainable AI", Activity, "explainable-ai"],
    ["Board Management", Monitor, "board-management"],
    ["Energy Analytics", Zap, "energy-analytics"],
    ["Sensor Data History", Database, "sensor-history"],
    ["Automated Reports", FileText, "reports"]
  ];

  // Backend connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API}/api/health`);

        if (!response.ok) {
          throw new Error("Backend connection failed");
        }

        const data = await response.json();
        setConnection(data.status || "Online");
      } catch {
        setConnection("Offline");
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);

    return () => clearInterval(interval);
  }, []);

  // Automatically save sensor readings
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${API}/api/history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            temperature,
            humidity,
            occupancy,
            light,
            air_quality: airQuality,
            board_active: board ? 1 : 0
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "History save failed");
        }

        console.log("Sensor history saved:", data);
      } catch (error) {
        console.error("Sensor history error:", error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [temperature, humidity, occupancy, light, airQuality, board]);

  // Sidebar navigation
  const handleNavigation = (sectionId) => {
    setActiveSection(sectionId);

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  // Reset simulator
  const reset = () => {
    setTemperature(29);
    setHumidity(65);
    setOccupancy(35);
    setLight(120);
    setAirQuality(100);
    setBoard(true);

    setPrediction(null);
    setConfidence({});
    setImportance({});
    setExplanation(null);
    setPredictionError("");
  };

  // Apply smart optimization
  const applyOptimization = (settings) => {
    setTemperature(settings.temperature);
    setHumidity(settings.humidity);
    setLight(settings.light);
    setBoard(settings.board);
  };

  // Smart board control
  const handleBoardChange = (value) => {
    setBoard(value);
  };

  // AI prediction
  const runPrediction = async () => {
    setLoading(true);
    setPredictionError("");

    try {
      const response = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          temperature,
          humidity,
          occupancy,
          light,
          air_quality: airQuality,
          board_active: board ? 1 : 0
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to generate prediction");
      }

      setPrediction(data.prediction);
      setConfidence(data.confidence || {});
      setImportance(data.feature_importance || {});
      setExplanation(data.shap_explanation || null);
    } catch (error) {
      setPredictionError(error.message);
      setExplanation(null);
    } finally {
      setLoading(false);
    }
  };

  const controls = [
    {
      name: "Temperature",
      value: temperature,
      unit: "°C",
      min: 18,
      max: 40,
      set: setTemperature
    },
    {
      name: "Humidity",
      value: humidity,
      unit: "%",
      min: 20,
      max: 90,
      set: setHumidity
    },
    {
      name: "Student Occupancy",
      value: occupancy,
      unit: "students",
      min: 0,
      max: 60,
      set: setOccupancy
    },
    {
      name: "Light Intensity",
      value: light,
      unit: "lux",
      min: 0,
      max: 600,
      set: setLight
    },
    {
      name: "Air Quality Indicator",
      value: airQuality,
      unit: "AQI units",
      min: 0,
      max: 500,
      set: setAirQuality
    }
  ];

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>🌿 EcoSense AI</h2>

        <p className="subtitle">
          Smart Classroom Intelligence
        </p>

        <nav className="sidebar-navigation">
          {menuItems.map(([name, Icon, sectionId]) => (
            <div
              key={sectionId}
              className={`menu-item ${
                activeSection === sectionId ? "active" : ""
              }`}
              role="button"
              tabIndex={0}
              aria-current={
                activeSection === sectionId ? "page" : undefined
              }
              onClick={() => handleNavigation(sectionId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleNavigation(sectionId);
                }
              }}
            >
              <Icon size={19} />
              <span>{name}</span>
            </div>
          ))}
        </nav>

        <p className="footer">
          AI-Powered Classroom Management
        </p>
      </aside>

      {/* MAIN DASHBOARD */}
      <main className="main" id="dashboard">

        {/* HEADER */}
        <header className="topbar">
          <div>
            <h1>Smart Classroom Dashboard</h1>
            <p>
              Monitor and manage your classroom intelligently.
            </p>
          </div>

          <span className="connection">
            ● {connection}
          </span>
        </header>

        {/* WELCOME */}
        <section className="welcome">
          <div>
            <h2>Welcome to EcoSense AI</h2>
            <p>Your intelligent classroom monitoring system.</p>
          </div>
          <BrainCircuit size={55} />
        </section>

        {/* CLASSROOM MONITORING */}
        <section id="classroom-monitoring" className="navigation-section">
          <ClassroomOverview
            temperature={temperature}
            humidity={humidity}
            occupancy={occupancy}
            light={light}
            airQuality={airQuality}
            board={board}
            prediction={prediction}
            connection={connection}
          />

          <h2 className="section-title">
            Live Classroom Readings
          </h2>

          <section className="sensor-grid">
            {[
              ["Temperature", temperature + "°C", Thermometer],
              ["Occupancy", occupancy + " Students", Users],
              ["Light Intensity", light + " Lux", Lightbulb],
              ["Humidity", humidity + "%", Wind]
            ].map(([name, value, Icon]) => (
              <div className="sensor-card" key={name}>
                <Icon size={28} />
                <p>{name}</p>
                <h2>{value}</h2>
                <small>Simulated sensor reading</small>
              </div>
            ))}
          </section>

          <h2 className="section-title">
            Virtual Classroom Simulator
          </h2>

          <section className="simulator">
            <div className="simulator-heading">
              <div>
                <h3>Adjust Classroom Conditions</h3>
                <p>
                  Change the values to simulate different classroom environments.
                </p>
              </div>

              <button className="reset-btn" onClick={reset}>
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            {controls.map((item) => (
              <div className="control" key={item.name}>
                <div className="control-label">
                  <label>{item.name}</label>
                  <strong>
                    {item.value} {item.unit}
                  </strong>
                </div>

                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  value={item.value}
                  onChange={(event) =>
                    item.set(Number(event.target.value))
                  }
                />
              </div>
            ))}

            <div className="control">
              <div className="control-label">
                <label>Smart Board</label>
                <strong>{board ? "ON" : "OFF"}</strong>
              </div>

              <button
                className="reset-btn"
                onClick={() => setBoard(!board)}
              >
                {board ? "Turn Board OFF" : "Turn Board ON"}
              </button>
            </div>
          </section>
        </section>

        {/* AI PREDICTIONS */}
        <section id="ai-predictions" className="navigation-section">
          <h2 className="section-title">
            AI Classroom Prediction
          </h2>

          <section className="ai-card">
            <BrainCircuit size={35} />

            <div>
              <h3>Random Forest Intelligence</h3>
              <p>
                Analyse your current classroom sensor readings using
                the trained machine learning model.
              </p>

              <button
                className="predict-btn"
                onClick={runPrediction}
                disabled={loading || connection === "Offline"}
              >
                {loading ? "Analysing Classroom..." : "Run AI Prediction"}
              </button>

              {predictionError && (
                <p className="error-message">{predictionError}</p>
              )}

              {prediction && (
                <div className="prediction-result">
                  <h2>Predicted Classroom State</h2>
                  <h3 className="prediction-value">{prediction}</h3>

                  <h4>Class Confidence</h4>

                  {Object.entries(confidence).map(([name, value]) => (
                    <div className="confidence-row" key={name}>
                      <span>{name}</span>
                      <strong>{value}%</strong>
                    </div>
                  ))}

                  <h4>Global Feature Importance</h4>

                  {Object.entries(importance)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, value]) => (
                      <div className="confidence-row" key={name}>
                        <span>{name.replaceAll("_", " ")}</span>
                        <strong>{(value * 100).toFixed(2)}%</strong>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>
        </section>

        {/* EXPLAINABLE AI */}
        <section id="explainable-ai" className="navigation-section">
          <h2 className="section-title">Explainable AI - SHAP</h2>
          {prediction ? (
            <XAIExplanation explanation={explanation} />
          ) : (
            <p className="note">
              Run an AI prediction to view its SHAP explanation.
            </p>
          )}
        </section>

        {/* SMART RECOMMENDATIONS */}
        <section className="navigation-section">
          <SmartRecommendations
            temperature={temperature}
            humidity={humidity}
            occupancy={occupancy}
            light={light}
            airQuality={airQuality}
            board={board}
            onApplyOptimization={applyOptimization}
          />
        </section>

        {/* BOARD MANAGEMENT */}
        <section id="board-management" className="navigation-section">
          <SmartBoardManagement
            occupancy={occupancy}
            board={board}
            onBoardChange={handleBoardChange}
          />
        </section>

        {/* SMART ALERTS */}
        <section className="navigation-section">
          <SmartAlerts
            temperature={temperature}
            humidity={humidity}
            occupancy={occupancy}
            light={light}
            airQuality={airQuality}
            board={board}
          />
        </section>

        {/* ENERGY ANALYTICS */}
        <section id="energy-analytics" className="navigation-section">
          <EnergyAnalytics
            occupancy={occupancy}
            temperature={temperature}
            light={light}
            board={board}
          />
        </section>

        {/* SENSOR HISTORY */}
        <section id="sensor-history" className="navigation-section">
          <SensorHistory />
        </section>
        {/* AUTOMATED CLASSROOM REPORTS */}
<section id="reports" className="navigation-section">
  <Reports prediction={prediction} />
</section>

      </main>
    </div>
  );
}

export default App;
