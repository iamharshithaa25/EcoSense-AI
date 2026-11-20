
import { useState } from "react";
import {
  Zap,
  IndianRupee,
  TrendingDown,
  Lightbulb,
  Fan,
  Monitor,
  Leaf
} from "lucide-react";

import "./EnergyAnalytics.css";

function EnergyAnalytics({
  occupancy,
  temperature,
  light,
  board
}) {
  const [tariff, setTariff] = useState(8);

  // Illustrative appliance power ratings
  const fanWatts = occupancy > 0 ? 150 : 0;
  const lightWatts = occupancy > 0 && light < 300 ? 120 : 0;
  const boardWatts = board ? 150 : 0;

  const totalWatts = fanWatts + lightWatts + boardWatts;

  // Assumed classroom operating time: 6 hours/day
  const operatingHours = 6;

  const dailyEnergy = (totalWatts * operatingHours) / 1000;
  const weeklyEnergy = dailyEnergy * 7;
  const monthlyEnergy = dailyEnergy * 30;

  const dailyCost = dailyEnergy * tariff;
  const monthlyCost = monthlyEnergy * tariff;

  // Illustrative efficiency score, not a measured building score
  const efficiencyScore = Math.max(
    0,
    Math.min(100, Math.round(100 - dailyEnergy * 8))
  );

  // Simulated weekly variation
  const weeklyFactors = [
    { day: "Mon", factor: 0.85 },
    { day: "Tue", factor: 1.0 },
    { day: "Wed", factor: 0.92 },
    { day: "Thu", factor: 1.12 },
    { day: "Fri", factor: 1.05 },
    { day: "Sat", factor: 0.75 },
    { day: "Sun", factor: 0.65 }
  ];

  const weeklyData = weeklyFactors.map(item => ({
    day: item.day,
    energy: dailyEnergy * item.factor
  }));

  const maxEnergy = Math.max(
    ...weeklyData.map(item => item.energy),
    0.1
  );

  // Smart recommendations
  const recommendations = [];

  if (occupancy === 0) {
    recommendations.push(
      "The classroom is unoccupied. Switch off unnecessary appliances."
    );
  }

  if (light >= 300) {
    recommendations.push(
      "Natural light is sufficient according to the simulated light reading. Keep classroom lights off where possible."
    );
  }

  if (board && occupancy === 0) {
    recommendations.push(
      "Turn off the smart board when the classroom is not in use."
    );
  }

  if (temperature > 30) {
    recommendations.push(
      "Classroom temperature is high. Review ventilation and cooling requirements."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Classroom conditions look reasonable. Continue monitoring energy usage."
    );
  }

  return (
    <section className="energy-section">

      <div className="energy-heading">
        <div>
          <h2>
            <Zap size={25} />
            Energy Analytics
          </h2>

          <p>
            Estimated classroom energy consumption and cost analysis
          </p>
        </div>

        <span className="energy-tag">
          <Leaf size={15} />
          Smart Energy
        </span>
      </div>

      {/* Summary Cards */}
      <div className="energy-cards">

        <div className="energy-card">
          <div className="energy-icon">
            <Zap />
          </div>

          <p>Daily Consumption</p>

          <h3>{dailyEnergy.toFixed(2)} kWh</h3>

          <small>Estimated per day</small>
        </div>

        <div className="energy-card">
          <div className="energy-icon">
            <TrendingDown />
          </div>

          <p>Weekly Consumption</p>

          <h3>{weeklyEnergy.toFixed(2)} kWh</h3>

          <small>Estimated per week</small>
        </div>

        <div className="energy-card">
          <div className="energy-icon">
            <IndianRupee />
          </div>

          <p>Monthly Cost</p>

          <h3>₹{monthlyCost.toFixed(2)}</h3>

          <small>Estimated electricity cost</small>
        </div>

        <div className="energy-card">
          <div className="energy-icon">
            <Leaf />
          </div>

          <p>Efficiency Score</p>

          <h3>{efficiencyScore}/100</h3>

          <small>Illustrative score</small>
        </div>

      </div>

      {/* Appliance Consumption */}
      <div className="energy-panel">
        <h3>Appliance Energy Breakdown</h3>

        <p className="energy-description">
          Estimated power consumption based on assumed appliance ratings.
        </p>

        <div className="appliance-row">
          <div className="appliance-name">
            <Fan size={20} />
            <span>Fans</span>
          </div>

          <strong>{fanWatts} W</strong>
        </div>

        <div className="appliance-row">
          <div className="appliance-name">
            <Lightbulb size={20} />
            <span>Classroom Lights</span>
          </div>

          <strong>{lightWatts} W</strong>
        </div>

        <div className="appliance-row">
          <div className="appliance-name">
            <Monitor size={20} />
            <span>Smart Board</span>
          </div>

          <strong>{boardWatts} W</strong>
        </div>

        <div className="total-power">
          <span>Total Estimated Power</span>
          <strong>{totalWatts} W</strong>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="energy-panel">
        <h3>Weekly Energy Usage</h3>

        <p className="energy-description">
          Simulated weekly consumption pattern, not actual historical readings.
        </p>

        <div className="energy-chart">
          {weeklyData.map(item => (
            <div className="chart-column" key={item.day}>
              <strong>
                {item.energy.toFixed(2)}
              </strong>

              <div className="chart-bar-area">
                <div
                  className="chart-bar"
                  style={{
                    height: `${
                      (item.energy / maxEnergy) * 100
                    }%`
                  }}
                />
              </div>

              <span>{item.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Electricity Tariff */}
      <div className="energy-panel tariff-panel">
        <h3>Electricity Cost Calculator</h3>

        <label htmlFor="energy-tariff">
          Electricity tariff (₹ per kWh)
        </label>

        <input
          id="energy-tariff"
          type="number"
          min="0"
          step="0.5"
          value={tariff}
          onChange={e => {
            const value = Number(e.target.value);
            setTariff(value >= 0 ? value : 0);
          }}
        />

        <div className="cost-results">
          <div>
            <span>Daily Estimated Cost</span>
            <strong>₹{dailyCost.toFixed(2)}</strong>
          </div>

          <div>
            <span>Monthly Estimated Cost</span>
            <strong>₹{monthlyCost.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="energy-panel recommendation-panel">
        <h3>
          <Lightbulb size={21} />
          Smart Energy Recommendations
        </h3>

        {recommendations.map((item, index) => (
          <div className="recommendation-item" key={index}>
            <span>✓</span>
            <p>{item}</p>
          </div>
        ))}
      </div>

      <p className="energy-disclaimer">
        Note: Energy values are illustrative estimates using assumed
        appliance power ratings and 6 operating hours per day.
        Actual consumption requires physical energy-meter readings.
      </p>

    </section>
  );
}

export default EnergyAnalytics;

