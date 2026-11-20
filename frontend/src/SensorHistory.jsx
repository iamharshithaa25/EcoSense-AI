
import { useCallback, useEffect, useState } from "react";

import {
  Activity,
  RefreshCw,
  Thermometer,
  Droplets,
  Users,
  Lightbulb,
  Wind,
  Database
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

import "./SensorHistory.css";
import { API_URL } from "./config";

const metrics = [
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    color: "#f97316",
    Icon: Thermometer
  },
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    color: "#0ea5e9",
    Icon: Droplets
  },
  {
    key: "occupancy",
    label: "Occupancy",
    unit: "students",
    color: "#8b5cf6",
    Icon: Users
  },
  {
    key: "light",
    label: "Light Intensity",
    unit: "lux",
    color: "#eab308",
    Icon: Lightbulb
  },
  {
    key: "air_quality",
    label: "Air Quality",
    unit: "AQI",
    color: "#10b981",
    Icon: Wind
  }
];

function getHistoryArray(data) {
  if (Array.isArray(data.readings)) return data.readings;
  if (Array.isArray(data.history)) return data.history;
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function getMetricValue(record, key) {
  const value = Number(record[key]);
  return Number.isFinite(value) ? value : null;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "Unknown";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return String(timestamp);
  }

  return date.toLocaleString();
}

function calculateStats(records, key) {
  const values = records
    .map(record => getMetricValue(record, key))
    .filter(value => value !== null);

  if (values.length === 0) {
    return {
      average: "--",
      minimum: "--",
      maximum: "--"
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    average: (total / values.length).toFixed(1),
    minimum: Math.min(...values).toFixed(1),
    maximum: Math.max(...values).toFixed(1)
  };
}

function SensorHistory() {
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [historyResponse, statsResponse] = await Promise.all([
        fetch(`${API_URL}/api/history?limit=100`),
        fetch(`${API_URL}/api/history/stats`)
      ]);

      if (!historyResponse.ok) {
        throw new Error("Unable to load sensor history.");
      }

      const historyData = await historyResponse.json();

      if (historyData.success === false) {
        throw new Error(
          historyData.error || "History request failed."
        );
      }

      // IMPORTANT: Backend returns the records inside "readings".
      const historyRecords = getHistoryArray(historyData);

      const sortedRecords = [...historyRecords].sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateA - dateB;
      });

      setRecords(sortedRecords);

      let count = sortedRecords.length;

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();

        // IMPORTANT: Backend returns total_readings inside statistics.
        count = Number(
          statsData.statistics?.total_readings ?? count
        );
      }

      setTotalCount(count);
      setLastUpdated(new Date());

    } catch (err) {
      setError(
        `${err.message} Check that the Flask backend is running.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const chartData = records.map((record, index) => ({
    ...record,
    chartTime: record.timestamp
      ? new Date(record.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      : `Reading ${index + 1}`,
    temperature: getMetricValue(record, "temperature"),
    humidity: getMetricValue(record, "humidity"),
    occupancy: getMetricValue(record, "occupancy"),
    light: getMetricValue(record, "light"),
    air_quality: getMetricValue(record, "air_quality")
  }));

  return (
    <section className="history-section" id="sensor-history">

      <div className="history-heading">
        <div>
          <span className="history-eyebrow">
            <Database size={15} />
            SQLITE DATABASE
          </span>

          <h2>Sensor Data History</h2>

          <p>
            Review previously recorded classroom sensor readings
            and monitor changes over time.
          </p>
        </div>

        <button
          className="history-refresh"
          onClick={loadHistory}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "history-spinning" : ""}
          />
          {loading ? "Loading..." : "Refresh History"}
        </button>
      </div>

      <div className="history-summary">

        <div className="history-summary-card">
          <Database size={23} />
          <div>
            <span>Total Stored Readings</span>
            <strong>{totalCount}</strong>
          </div>
        </div>

        <div className="history-summary-card">
          <Activity size={23} />
          <div>
            <span>Readings Displayed</span>
            <strong>{records.length}</strong>
          </div>
        </div>

        <div className="history-summary-card">
          <RefreshCw size={23} />
          <div>
            <span>Last Refreshed</span>
            <strong className="history-time">
              {lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "--"}
            </strong>
          </div>
        </div>

      </div>

      {error && (
        <div className="history-error">
          <strong>Unable to load history</strong>
          <p>{error}</p>
          <button onClick={loadHistory}>Try Again</button>
        </div>
      )}

      {loading && records.length === 0 && !error && (
        <div className="history-empty">
          Loading sensor records...
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="history-empty">
          <Database size={35} />
          <h3>No sensor readings found</h3>
          <p>
            Change a classroom simulator value and wait one second.
            Then refresh this section to view the saved reading.
          </p>
        </div>
      )}

      {records.length > 0 && (
        <>
          <h3 className="history-subtitle">
            Sensor Statistics
          </h3>

          <div className="history-metric-grid">
            {metrics.map(metric => {
              const Icon = metric.Icon;
              const stats = calculateStats(records, metric.key);

              return (
                <div className="history-metric-card" key={metric.key}>
                  <div className="history-metric-title">
                    <Icon size={21} style={{ color: metric.color }} />
                    <span>{metric.label}</span>
                  </div>

                  <div className="history-average">
                    {stats.average}
                    <small> {metric.unit}</small>
                  </div>

                  <div className="history-min-max">
                    <span>Min: {stats.minimum}</span>
                    <span>Max: {stats.maximum}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <h3 className="history-subtitle">
            Sensor Trends
          </h3>

          <div className="history-charts">
            {metrics.map(metric => (
              <div className="history-chart-card" key={metric.key}>
                <div className="history-chart-heading">
                  <h3>{metric.label}</h3>
                  <span>{metric.unit}</span>
                </div>

                <div className="history-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 0,
                        bottom: 5
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                      />

                      <XAxis
                        dataKey="chartTime"
                        tick={{ fontSize: 11 }}
                        minTickGap={25}
                      />

                      <YAxis
                        tick={{ fontSize: 11 }}
                        width={42}
                      />

                      <Tooltip />
                      <Legend />

                      <Line
                        type="monotone"
                        dataKey={metric.key}
                        name={metric.label}
                        stroke={metric.color}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>

          <h3 className="history-subtitle">
            Recent Sensor Readings
          </h3>

          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Temperature</th>
                  <th>Humidity</th>
                  <th>Occupancy</th>
                  <th>Light</th>
                  <th>Air Quality</th>
                  <th>Smart Board</th>
                </tr>
              </thead>

              <tbody>
                {[...records].reverse().map((record, index) => (
                  <tr key={record.id ?? `${record.timestamp}-${index}`}>
                    <td>{formatTimestamp(record.timestamp)}</td>
                    <td>{record.temperature} °C</td>
                    <td>{record.humidity} %</td>
                    <td>{record.occupancy}</td>
                    <td>{record.light} lux</td>
                    <td>{record.air_quality}</td>
                    <td>
                      <span
                        className={
                          Number(record.board_active) === 1
                            ? "board-status board-on"
                            : "board-status board-off"
                        }
                      >
                        {Number(record.board_active) === 1
                          ? "ON"
                          : "OFF"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="history-note">
            Showing the latest {records.length} records returned by
            the database. Statistics above are calculated from these
            displayed records.
          </p>
        </>
      )}

    </section>
  );
}

export default SensorHistory;
