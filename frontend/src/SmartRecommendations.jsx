
import {
  useMemo,
  useState
} from "react";

import {
  BrainCircuit,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Thermometer,
  Droplets,
  Wind,
  Users,
  Monitor,
  Zap,
  Settings,
  RefreshCw
} from "lucide-react";

import "./SmartRecommendations.css";

function SmartRecommendations({
  temperature,
  humidity,
  occupancy,
  light,
  airQuality,
  board,
  onApplyOptimization
}) {
  const [applied, setApplied] = useState(false);

  const optimization = useMemo(() => {
    const targetTemperature =
      temperature > 28 ? 26 :
      temperature < 24 ? 25 :
      temperature;

    const targetHumidity =
      humidity > 60 ? 55 :
      humidity < 40 ? 45 :
      humidity;

    const targetLight =
      light < 300 ? 350 :
      light > 500 ? 400 :
      light;

    const targetBoard = occupancy === 0 ? false : board;

    return {
      temperature: targetTemperature,
      humidity: targetHumidity,
      light: targetLight,
      board: targetBoard
    };
  }, [
    temperature,
    humidity,
    occupancy,
    light,
    board
  ]);

  const recommendations = useMemo(() => {
    const items = [];

    if (temperature > 28) {
      items.push({
        title: "High Classroom Temperature",
        message:
          "The classroom temperature is above the recommended simulation range. Improve ventilation or cooling.",
        action: "Set simulated temperature target to 26°C.",
        icon: Thermometer,
        type: "warning"
      });
    } else if (temperature < 24) {
      items.push({
        title: "Low Classroom Temperature",
        message:
          "The classroom temperature is below the preferred simulation range.",
        action: "Set simulated temperature target to 25°C.",
        icon: Thermometer,
        type: "info"
      });
    }

    if (humidity > 60) {
      items.push({
        title: "High Humidity",
        message:
          "Humidity is elevated. Improve air circulation and ventilation.",
        action: "Set simulated humidity target to 55%.",
        icon: Droplets,
        type: "warning"
      });
    } else if (humidity < 40) {
      items.push({
        title: "Low Humidity",
        message:
          "Humidity is below the preferred range.",
        action: "Set simulated humidity target to 45%.",
        icon: Droplets,
        type: "info"
      });
    }

    if (light < 300) {
      items.push({
        title: "Insufficient Lighting",
        message:
          "Light intensity is low for classroom activities and reading.",
        action: "Set simulated light target to 350 lux.",
        icon: Lightbulb,
        type: "warning"
      });
    } else if (light > 500) {
      items.push({
        title: "Excessive Lighting",
        message:
          "Light intensity is high. Reduce unnecessary lighting to save energy.",
        action: "Set simulated light target to 400 lux.",
        icon: Lightbulb,
        type: "info"
      });
    }

    if (airQuality > 200) {
      items.push({
        title: "Poor Air Quality",
        message:
          "The air quality indicator is very high. Increase ventilation and investigate the source.",
        action:
          "Ventilate the classroom and recheck the indicator. This cannot be corrected automatically by the simulator.",
        icon: Wind,
        type: "danger"
      });
    } else if (airQuality > 150) {
      items.push({
        title: "Air Quality Needs Attention",
        message:
          "The air quality indicator is elevated. Fresh air circulation is recommended.",
        action:
          "Increase ventilation and monitor the indicator again.",
        icon: Wind,
        type: "warning"
      });
    }

    if (occupancy > 50) {
      items.push({
        title: "High Student Occupancy",
        message:
          "The classroom is approaching its simulated occupancy limit.",
        action:
          "Consider redistributing students or using another classroom.",
        icon: Users,
        type: "danger"
      });
    } else if (occupancy === 0) {
      items.push({
        title: "Classroom Unoccupied",
        message:
          "No students are currently detected in the simulated classroom.",
        action:
          "Turn off unnecessary equipment and save energy.",
        icon: Users,
        type: "info"
      });
    }

    if (occupancy === 0 && board) {
      items.push({
        title: "Smart Board Left ON",
        message:
          "The smart board is running even though the classroom is empty.",
        action:
          "Automatically switch OFF the simulated smart board.",
        icon: Monitor,
        type: "warning"
      });
    }

    if (items.length === 0) {
      items.push({
        title: "Classroom Conditions Look Good",
        message:
          "The current simulated readings are within the configured target ranges.",
        action:
          "Continue monitoring classroom conditions.",
        icon: CheckCircle,
        type: "success"
      });
    }

    return items;
  }, [
    temperature,
    humidity,
    occupancy,
    light,
    airQuality,
    board
  ]);

  const applyOptimization = () => {
    onApplyOptimization(optimization);
    setApplied(true);
  };

  const hasChanges =
    optimization.temperature !== temperature ||
    optimization.humidity !== humidity ||
    optimization.light !== light ||
    optimization.board !== board;

  return (
    <section className="sr-container">

      <div className="sr-heading">
        <div className="sr-heading-icon">
          <BrainCircuit size={27} />
        </div>

        <div>
          <h2>Smart Recommendations</h2>
          <p>
            AI-assisted classroom improvement suggestions
            based on simulated sensor readings.
          </p>
        </div>
      </div>

      <div className="sr-summary">
        <div>
          <span className="sr-summary-label">
            Recommendations
          </span>
          <h2>{recommendations.length}</h2>
        </div>

        <div>
          <span className="sr-summary-label">
            Optimization Status
          </span>
          <h3>
            {hasChanges ? "Improvement Available" : "Within Targets"}
          </h3>
        </div>
      </div>

      <div className="sr-recommendation-list">

        {recommendations.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              className={`sr-recommendation ${item.type}`}
              key={index}
            >
              <div className="sr-rec-icon">
                <Icon size={23} />
              </div>

              <div className="sr-rec-content">
                <h3>{item.title}</h3>

                <p>{item.message}</p>

                <div className="sr-rec-action">
                  <Lightbulb size={15} />
                  <span>{item.action}</span>
                </div>
              </div>
            </div>
          );
        })}

      </div>

      <div className="sr-optimization">

        <div className="sr-optimization-heading">
          <Settings size={25} />

          <div>
            <h2>Automated Classroom Optimization</h2>
            <p>
              Recommended simulated settings based on
              the current classroom conditions.
            </p>
          </div>
        </div>

        <div className="sr-target-grid">

          <div className="sr-target-card">
            <Thermometer size={21} />
            <span>Temperature Target</span>
            <strong>
              {optimization.temperature}°C
            </strong>
          </div>

          <div className="sr-target-card">
            <Droplets size={21} />
            <span>Humidity Target</span>
            <strong>
              {optimization.humidity}%
            </strong>
          </div>

          <div className="sr-target-card">
            <Lightbulb size={21} />
            <span>Lighting Target</span>
            <strong>
              {optimization.light} lux
            </strong>
          </div>

          <div className="sr-target-card">
            <Monitor size={21} />
            <span>Smart Board</span>
            <strong className={
              optimization.board ? "sr-on" : "sr-off"
            }>
              {optimization.board ? "ON" : "OFF"}
            </strong>
          </div>

        </div>

        <div className="sr-optimization-note">
          <Zap size={17} />
          <p>
            Applying optimization updates the virtual simulator
            values. Air quality and occupancy are monitored,
            not automatically changed. No physical devices
            are controlled.
          </p>
        </div>

        <button
          className="sr-apply-btn"
          onClick={applyOptimization}
          disabled={!hasChanges}
        >
          <RefreshCw size={18} />
          Apply Optimized Settings
        </button>

        {applied && (
          <div className="sr-success">
            <CheckCircle size={18} />
            Optimized simulation settings applied successfully!
          </div>
        )}

        {!hasChanges && (
          <p className="sr-no-change">
            Your current simulator values already match the
            recommended settings.
          </p>
        )}

      </div>

    </section>
  );
}

export default SmartRecommendations;
