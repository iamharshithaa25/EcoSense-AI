
import { useEffect, useState } from "react";

import {
  Monitor,
  Power,
  Users,
  Zap,
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  Settings
} from "lucide-react";

import "./SmartBoardManagement.css";

function SmartBoardManagement({
  occupancy,
  board,
  onBoardChange
}) {
  const [autoMode, setAutoMode] = useState(true);
  const [lastAction, setLastAction] = useState(
    "Smart board monitoring is active."
  );

  const boardPower = 150;
  const electricityRate = 8;
  const operatingHours = 6;

  useEffect(() => {
    if (!autoMode) return;

    if (occupancy === 0 && board) {
      onBoardChange(false);

      setLastAction(
        "Classroom empty: Smart board automatically switched OFF."
      );
    }
  }, [autoMode, occupancy, board, onBoardChange]);

  const potentialEnergySavings =
    (boardPower / 1000) * operatingHours;

  const potentialCostSavings =
    potentialEnergySavings * electricityRate;

  const handleManualToggle = () => {
    if (occupancy === 0 && autoMode && board) {
      setLastAction(
        "Automatic mode is active. The board will remain OFF while the classroom is empty."
      );
      return;
    }

    onBoardChange(!board);

    setLastAction(
      board
        ? "Smart board manually switched OFF."
        : "Smart board manually switched ON."
    );
  };

  return (
    <section className="sbm-container">

      <div className="sbm-heading">
        <div className="sbm-heading-icon">
          <Monitor size={27} />
        </div>

        <div>
          <h2>Smart Board Management</h2>
          <p>
            Intelligent simulated board control based on
            classroom occupancy.
          </p>
        </div>
      </div>

      <div className="sbm-status-grid">

        <div className="sbm-status-card">
          <Monitor size={23} />

          <span>Board Status</span>

          <strong className={board ? "sbm-on" : "sbm-off"}>
            {board ? "ON" : "OFF"}
          </strong>
        </div>

        <div className="sbm-status-card">
          <Users size={23} />

          <span>Current Occupancy</span>

          <strong>{occupancy} Students</strong>
        </div>

        <div className="sbm-status-card">
          <Settings size={23} />

          <span>Automatic Mode</span>

          <strong className={autoMode ? "sbm-on" : "sbm-off"}>
            {autoMode ? "ENABLED" : "DISABLED"}
          </strong>
        </div>

      </div>

      <div className={`sbm-classroom-message ${
        occupancy === 0 ? "sbm-empty" : "sbm-occupied"
      }`}>
        {occupancy === 0 ? (
          <>
            <AlertTriangle size={21} />
            <div>
              <strong>Classroom is Empty</strong>
              <p>
                {autoMode
                  ? "Automatic mode will switch OFF the smart board."
                  : "Enable automatic mode to switch OFF the board when the classroom is empty."}
              </p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle size={21} />
            <div>
              <strong>Students Detected</strong>
              <p>
                The classroom currently has {occupancy} students.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="sbm-controls">

        <div className="sbm-control-row">
          <div>
            <h3>Automatic Board Control</h3>
            <p>
              Switch OFF the board when occupancy reaches zero.
            </p>
          </div>

          <button
            className={`sbm-toggle ${
              autoMode ? "active" : ""
            }`}
            onClick={() => {
              const nextMode = !autoMode;
              setAutoMode(nextMode);

              setLastAction(
                nextMode
                  ? "Automatic board management enabled."
                  : "Automatic board management disabled."
              );
            }}
            aria-label="Toggle automatic board management"
          >
            <span />
          </button>
        </div>

        <div className="sbm-control-row">
          <div>
            <h3>Manual Board Control</h3>
            <p>
              Switch the simulated smart board ON or OFF.
            </p>
          </div>

          <button
            className={`sbm-power-btn ${
              board ? "power-on" : "power-off"
            }`}
            onClick={handleManualToggle}
          >
            <Power size={17} />
            {board ? "Turn OFF" : "Turn ON"}
          </button>
        </div>

      </div>

      <div className="sbm-savings">

        <div className="sbm-savings-heading">
          <Zap size={23} />
          <div>
            <h3>Estimated Energy Savings</h3>
            <p>
              Based on an assumed smart board power of 150 watts.
            </p>
          </div>
        </div>

        <div className="sbm-savings-grid">

          <div>
            <span>Potential Daily Energy Savings</span>
            <strong>
              {potentialEnergySavings.toFixed(2)} kWh
            </strong>
          </div>

          <div>
            <span>Potential Daily Cost Savings</span>
            <strong>
              <IndianRupee size={17} />
              {potentialCostSavings.toFixed(2)}
            </strong>
          </div>

        </div>

        <small>
          Illustrative estimate assuming the board remains OFF
          for 6 hours. Actual savings depend on the real device,
          usage and electricity tariff.
        </small>

      </div>

      <div className="sbm-last-action">
        <CheckCircle size={18} />
        <span>{lastAction}</span>
      </div>

      <div className="sbm-disclaimer">
        This feature controls the virtual simulator only.
        It does not connect to or switch any physical smart board.
      </div>

    </section>
  );
}

export default SmartBoardManagement;
