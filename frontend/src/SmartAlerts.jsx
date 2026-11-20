
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  ShieldCheck
} from "lucide-react";

import "./SmartAlerts.css";

function SmartAlerts({
  temperature,
  humidity,
  occupancy,
  light,
  airQuality,
  board
}) {
  const alerts = [];

  // Temperature monitoring
  if (temperature > 35) {
    alerts.push({
      id: "temperature",
      type: "critical",
      title: "Critical Temperature",
      message: `Temperature is ${temperature}°C. Improve classroom ventilation or cooling.`,
      action: "Turn on cooling or improve ventilation."
    });
  } else if (temperature > 32) {
    alerts.push({
      id: "temperature",
      type: "warning",
      title: "High Temperature",
      message: `Temperature is ${temperature}°C. The classroom may feel uncomfortable.`,
      action: "Improve airflow and monitor the temperature."
    });
  }

  // Humidity monitoring
  if (humidity > 75) {
    alerts.push({
      id: "humidity",
      type: "warning",
      title: "High Humidity",
      message: `Humidity is ${humidity}%. The classroom may feel uncomfortable.`,
      action: "Improve ventilation and monitor humidity."
    });
  } else if (humidity < 30) {
    alerts.push({
      id: "humidity",
      type: "warning",
      title: "Low Humidity",
      message: `Humidity is ${humidity}%. The classroom air may be too dry.`,
      action: "Monitor indoor air conditions."
    });
  }

  // Occupancy monitoring
  if (occupancy > 50) {
    alerts.push({
      id: "occupancy",
      type: "critical",
      title: "High Classroom Occupancy",
      message: `${occupancy} students are present. Check classroom capacity and ventilation.`,
      action: "Check seating capacity and ventilation."
    });
  } else if (occupancy === 0) {
    alerts.push({
      id: "occupancy",
      type: "info",
      title: "Classroom Empty",
      message: "No students are currently detected in the classroom.",
      action: "Check whether electrical equipment can be switched off."
    });
  }

  // Air quality monitoring
  if (airQuality > 200) {
    alerts.push({
      id: "air-quality",
      type: "critical",
      title: "Very Poor Air Quality",
      message: `Air quality indicator is ${airQuality}. Immediate attention is recommended.`,
      action: "Improve ventilation and investigate the source."
    });
  } else if (airQuality > 150) {
    alerts.push({
      id: "air-quality",
      type: "warning",
      title: "Poor Air Quality",
      message: `Air quality indicator is ${airQuality}. Indoor air conditions need attention.`,
      action: "Increase fresh-air ventilation."
    });
  }

  // Lighting monitoring
  if (occupancy > 0 && light > 500) {
    alerts.push({
      id: "lighting",
      type: "warning",
      title: "Excessive Light Intensity",
      message: `Light intensity is ${light} lux. Check whether artificial lights can be reduced.`,
      action: "Reduce unnecessary lighting."
    });
  }

  // Board monitoring
  if (occupancy === 0 && board) {
    alerts.push({
      id: "board",
      type: "warning",
      title: "Smart Board Left ON",
      message: "The classroom is empty, but the smart board is still switched on.",
      action: "Switch off the smart board to save energy."
    });
  }

  const criticalCount = alerts.filter(
    alert => alert.type === "critical"
  ).length;

  const warningCount = alerts.filter(
    alert => alert.type === "warning"
  ).length;

  const getIcon = type => {
    if (type === "critical") return <AlertCircle size={21} />;
    if (type === "warning") return <AlertTriangle size={21} />;
    return <Info size={21} />;
  };

  return (
    <section className="smart-alerts-section">
      <div className="smart-alerts-heading">
        <div>
          <h2>
            <Bell size={23} />
            Smart Alerts & Notifications
          </h2>
          <p>
            Automatic classroom monitoring and safety recommendations.
          </p>
        </div>

        <span className="alert-live-status">
          <span className="live-dot"></span>
          Live Monitoring
        </span>
      </div>

      <div className="alert-summary-grid">
        <div className="alert-summary-card">
          <span className="summary-icon total-icon">
            <Bell size={22} />
          </span>
          <div>
            <p>Total Alerts</p>
            <h3>{alerts.length}</h3>
          </div>
        </div>

        <div className="alert-summary-card">
          <span className="summary-icon critical-icon">
            <AlertCircle size={22} />
          </span>
          <div>
            <p>Critical</p>
            <h3>{criticalCount}</h3>
          </div>
        </div>

        <div className="alert-summary-card">
          <span className="summary-icon warning-icon">
            <AlertTriangle size={22} />
          </span>
          <div>
            <p>Warnings</p>
            <h3>{warningCount}</h3>
          </div>
        </div>
      </div>

      <div className="alerts-list">
        <h3>Current Classroom Alerts</h3>

        {alerts.length === 0 ? (
          <div className="no-alerts">
            <CheckCircle size={38} />
            <h3>All Conditions Normal</h3>
            <p>
              No alert conditions have been detected from the current
              simulated classroom readings.
            </p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              className={`alert-item alert-${alert.type}`}
              key={alert.id}
            >
              <div className="alert-item-icon">
                {getIcon(alert.type)}
              </div>

              <div className="alert-item-content">
                <div className="alert-title-row">
                  <h4>{alert.title}</h4>
                  <span className={`alert-badge ${alert.type}`}>
                    {alert.type}
                  </span>
                </div>

                <p>{alert.message}</p>

                <div className="alert-action">
                  <strong>Recommended action:</strong> {alert.action}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="alert-footer">
        <ShieldCheck size={18} />
        <span>
          Alerts are generated automatically from the current simulator
          readings. They are rule-based recommendations, not certified
          safety measurements.
        </span>
      </div>
    </section>
  );
}

export default SmartAlerts;
