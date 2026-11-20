
import {
  Activity,
  Thermometer,
  Droplets,
  Users,
  Lightbulb,
  Wind,
  Monitor,
  BrainCircuit,
  Wifi
} from "lucide-react";

import "./ClassroomOverview.css";

function ClassroomOverview({
  temperature,
  humidity,
  occupancy,
  light,
  airQuality,
  board,
  prediction,
  connection
}) {
  // Basic classroom health assessment using simulated readings
  const issues = [];

  if (temperature > 30 || temperature < 18) {
    issues.push("Temperature needs attention");
  }

  if (humidity > 70 || humidity < 30) {
    issues.push("Humidity is outside the preferred range");
  }

  if (light < 200) {
    issues.push("Lighting may be insufficient");
  }

  if (light > 500) {
    issues.push("Lighting may be too high");
  }

  if (airQuality > 150) {
    issues.push("Air quality needs attention");
  }

  const healthStatus =
    issues.length === 0
      ? "Good"
      : issues.length <= 2
      ? "Needs Attention"
      : "Critical";

  const healthClass =
    issues.length === 0
      ? "good"
      : issues.length <= 2
      ? "warning"
      : "critical";

  const sensorCards = [
    {
      title: "Temperature",
      value: `${temperature}°C`,
      icon: Thermometer,
      description: "Classroom temperature"
    },
    {
      title: "Humidity",
      value: `${humidity}%`,
      icon: Droplets,
      description: "Relative humidity"
    },
    {
      title: "Occupancy",
      value: `${occupancy}`,
      icon: Users,
      description: "Students in classroom"
    },
    {
      title: "Light Intensity",
      value: `${light} lux`,
      icon: Lightbulb,
      description: "Available lighting"
    },
    {
      title: "Air Quality",
      value: `${airQuality}`,
      icon: Wind,
      description: "Simulated AQI indicator"
    }
  ];

  return (
    <section className="eco-overview">

      <div className="eco-overview-heading">
        <div>
          <span className="eco-overview-tag">
            CLASSROOM CONTROL CENTER
          </span>

          <h2>Unified Classroom Intelligence</h2>

          <p>
            A combined overview of classroom conditions,
            AI insights and smart device status.
          </p>
        </div>

        <div className="eco-overview-live">
          <span className="eco-live-dot"></span>
          Simulation Active
        </div>
      </div>

      {/* Main Summary Cards */}
      <div className="eco-overview-grid">

        <div className={`eco-summary-card health-${healthClass}`}>
          <div className="eco-summary-icon">
            <Activity size={23} />
          </div>

          <div>
            <p>Classroom Health</p>
            <h3>{healthStatus}</h3>
            <small>
              {issues.length === 0
                ? "No threshold issues detected"
                : `${issues.length} condition(s) need attention`}
            </small>
          </div>
        </div>

        <div className="eco-summary-card">
          <div className="eco-summary-icon purple">
            <BrainCircuit size={23} />
          </div>

          <div>
            <p>AI Prediction</p>
            <h3 className="eco-prediction-text">
              {prediction || "Not Run Yet"}
            </h3>
            <small>
              {prediction
                ? "Latest model prediction"
                : "Run AI prediction to view results"}
            </small>
          </div>
        </div>

        <div className="eco-summary-card">
          <div className="eco-summary-icon blue">
            <Monitor size={23} />
          </div>

          <div>
            <p>Smart Board</p>
            <h3 className={board ? "eco-on" : "eco-off"}>
              {board ? "ON" : "OFF"}
            </h3>
            <small>
              {board
                ? "Board is currently active"
                : "Board is currently inactive"}
            </small>
          </div>
        </div>

        <div className="eco-summary-card">
          <div className="eco-summary-icon green">
            <Wifi size={23} />
          </div>

          <div>
            <p>Backend Connection</p>
            <h3 className={
              connection === "Offline" ? "eco-off" : "eco-on"
            }>
              {connection}
            </h3>
            <small>Flask API connection status</small>
          </div>
        </div>

      </div>

      {/* Sensor Overview */}
      <div className="eco-sensor-overview">

        <div className="eco-subheading">
          <div>
            <h3>Classroom Environment Overview</h3>
            <p>Current simulated sensor values</p>
          </div>

          <span>LIVE SIMULATION</span>
        </div>

        <div className="eco-sensor-grid">

          {sensorCards.map((sensor) => {
            const Icon = sensor.icon;

            return (
              <div
                className="eco-sensor-item"
                key={sensor.title}
              >
                <div className="eco-sensor-icon">
                  <Icon size={21} />
                </div>

                <div>
                  <p>{sensor.title}</p>
                  <h4>{sensor.value}</h4>
                  <small>{sensor.description}</small>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Health Information */}
      <div className={`eco-health-message ${healthClass}`}>

        <Activity size={21} />

        <div>
          <h4>
            {issues.length === 0
              ? "Classroom conditions look good"
              : "Classroom attention required"}
          </h4>

          {issues.length === 0 ? (
            <p>
              The current simulated readings are within the
              dashboard's configured thresholds.
            </p>
          ) : (
            <ul>
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>

      </div>

      <p className="eco-overview-note">
        Note: All classroom sensor values are simulated.
        Classroom health is an indicative assessment based
        on configured thresholds, not a medical or safety certification.
      </p>

    </section>
  );
}

export default ClassroomOverview;
