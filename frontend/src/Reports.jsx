
import { useEffect, useMemo, useState } from "react";

import {
  FileText,
  Download,
  FileSpreadsheet,
  RefreshCw,
  CalendarDays,
  Thermometer,
  Droplets,
  Users,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  X,
  CalendarRange
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Reports.css";
import { API_URL } from "./config";

const API = API_URL;

function Reports({ prediction }) {

  const [history, setHistory] = useState([]);
  const [generatedReports, setGeneratedReports] = useState([]);

  const [period, setPeriod] = useState("7");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);

  // --------------------------------------------------
  // LOAD SENSOR HISTORY AND GENERATED REPORTS
  // --------------------------------------------------

  const loadReportData = async () => {

    setLoading(true);
    setError("");

    try {

      const [historyResponse, reportsResponse] =
        await Promise.all([

          fetch(`${API}/api/history?limit=1000`),

          fetch(`${API}/api/reports`)

        ]);

      if (!historyResponse.ok || !reportsResponse.ok) {
        throw new Error("Unable to retrieve report information.");
      }

      const historyData = await historyResponse.json();
      const reportsData = await reportsResponse.json();

      if (!historyData.success) {
        throw new Error(
          historyData.error || "Unable to load sensor readings."
        );
      }

      if (!reportsData.success) {
        throw new Error(
          reportsData.error || "Unable to load generated reports."
        );
      }

      setHistory(historyData.readings || []);
      setGeneratedReports(reportsData.reports || []);

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadReportData();

  }, []);


  // --------------------------------------------------
  // FILTER SENSOR HISTORY
  // --------------------------------------------------

  const filteredHistory = useMemo(() => {

    if (period === "all") {
      return history;
    }

    const cutoff =
      Date.now() - Number(period) * 24 * 60 * 60 * 1000;

    return history.filter((record) => {

      const date = new Date(record.timestamp).getTime();

      return Number.isFinite(date) && date >= cutoff;

    });

  }, [history, period]);


  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const calculateAverage = (key) => {

    const values = filteredHistory
      .map((record) => Number(record[key]))
      .filter(Number.isFinite);

    if (!values.length) return "—";

    return (
      values.reduce((sum, value) => sum + value, 0) /
      values.length
    ).toFixed(1);

  };


  const getRange = (key) => {

    const values = filteredHistory
      .map((record) => Number(record[key]))
      .filter(Number.isFinite);

    if (!values.length) return "—";

    return `${Math.min(...values).toFixed(1)} – ${Math.max(...values).toFixed(1)}`;

  };


  const formatDate = (value) => {

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Unknown"
      : date.toLocaleString();

  };


  // --------------------------------------------------
  // DAILY AND WEEKLY REPORT COUNTS
  // --------------------------------------------------

  const dailyReports = generatedReports.filter(
    (report) => report.report_type === "daily"
  );

  const weeklyReports = generatedReports.filter(
    (report) => report.report_type === "weekly"
  );

  const latestDailyReport = dailyReports[0];
  const latestWeeklyReport = weeklyReports[0];


  // --------------------------------------------------
  // GENERATE DAILY OR WEEKLY REPORT
  // --------------------------------------------------

  const generateReport = async (type) => {

    setGenerating(type);
    setError("");
    setMessage("");

    try {

      const response = await fetch(
        `${API}/api/reports/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            type: type
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {

        throw new Error(
          data.message ||
          data.error ||
          "Unable to generate report."
        );

      }

      setMessage(
        `${type === "daily" ? "Daily" : "Weekly"} report generated successfully!`
      );

      await loadReportData();

      if (data.report) {
        setSelectedReport(data.report);
      }

    } catch (err) {

      setError(err.message);

    } finally {

      setGenerating("");

    }

  };


  // --------------------------------------------------
  // CSV EXPORT
  // --------------------------------------------------

  const exportCSV = () => {

    if (!filteredHistory.length) {

      alert("No sensor readings available for this period.");

      return;
    }

    const columns = [
      "id",
      "timestamp",
      "temperature",
      "humidity",
      "occupancy",
      "light",
      "air_quality",
      "board_active"
    ];

    const rows = [

      columns.join(","),

      ...filteredHistory.map((record) =>

        columns.map((column) => {

          const value = record[column] ?? "";

          return `"${String(value).replace(/"/g, '""')}"`;

        }).join(",")

      )

    ];

    const blob = new Blob(
      ["\uFEFF" + rows.join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "EcoSense_Classroom_Report.csv";

    link.click();

    URL.revokeObjectURL(url);

  };


  // --------------------------------------------------
  // PDF EXPORT
  // --------------------------------------------------

  const exportPDF = () => {

    if (!filteredHistory.length) {

      alert("No sensor readings available for this period.");

      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("EcoSense AI", 14, 20);

    doc.setFontSize(13);
    doc.text("Automated Classroom Report", 14, 29);

    doc.setFontSize(9);

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      37
    );

    doc.text(
      `Period: ${
        period === "all"
          ? "All available records"
          : `Last ${period} days`
      }`,
      14,
      43
    );

    autoTable(doc, {

      startY: 51,

      head: [[
        "Classroom Metric",
        "Average",
        "Minimum - Maximum"
      ]],

      body: [

        [
          "Temperature (°C)",
          calculateAverage("temperature"),
          getRange("temperature")
        ],

        [
          "Humidity (%)",
          calculateAverage("humidity"),
          getRange("humidity")
        ],

        [
          "Occupancy",
          calculateAverage("occupancy"),
          getRange("occupancy")
        ],

        [
          "Light (lux)",
          calculateAverage("light"),
          getRange("light")
        ],

        [
          "Air Quality",
          calculateAverage("air_quality"),
          getRange("air_quality")
        ]

      ],

      theme: "grid",

      headStyles: {
        fillColor: [29, 78, 216]
      }

    });

    let y = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(12);
    doc.text("Report Summary", 14, y);

    y += 8;

    doc.setFontSize(10);

    [

      `Total sensor readings: ${filteredHistory.length}`,

      `Latest reading: ${formatDate(
        filteredHistory[filteredHistory.length - 1].timestamp
      )}`,

      `Latest AI prediction: ${prediction || "Not run"}`

    ].forEach((line) => {

      doc.text(line, 14, y);

      y += 7;

    });

    y += 5;

    doc.setFontSize(12);
    doc.text("Recent Sensor Readings", 14, y);

    autoTable(doc, {

      startY: y + 5,

      head: [[
        "Date",
        "Temperature",
        "Humidity",
        "Occupancy",
        "Light",
        "Air Quality",
        "Board"
      ]],

      body: [...filteredHistory]
        .reverse()
        .slice(0, 30)
        .map((record) => [

          formatDate(record.timestamp),

          record.temperature,

          record.humidity,

          record.occupancy,

          record.light,

          record.air_quality,

          record.board_active ? "ON" : "OFF"

        ]),

      styles: {
        fontSize: 7
      },

      headStyles: {
        fillColor: [29, 78, 216]
      }

    });

    doc.save("EcoSense_Classroom_Report.pdf");

  };


  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------

  if (loading) {

    return (

      <section className="reports-container" id="reports">

        <h2>Automated Classroom Reports</h2>

        <p>Loading classroom report data...</p>

      </section>

    );

  }


  // --------------------------------------------------
  // MAIN REPORT DASHBOARD
  // --------------------------------------------------

  return (

    <section className="reports-container" id="reports">

      {/* HEADER */}

      <div className="reports-header">

        <div>

          <h2>Automated Classroom Reports</h2>

          <p>
            Generate, monitor and download classroom performance reports.
          </p>

        </div>

        <button
          className="reports-refresh"
          onClick={loadReportData}
          disabled={loading}
        >

          <RefreshCw size={17} />

          Refresh

        </button>

      </div>


      {/* SUCCESS AND ERROR MESSAGES */}

      {error && (

        <div className="reports-error">

          <AlertCircle size={18} />

          {error}

        </div>

      )}

      {message && (

        <div className="reports-success">

          <CheckCircle size={18} />

          {message}

        </div>

      )}


      {/* AUTOMATED REPORT GENERATION */}

      <div className="reports-summary">

        <h3>

          <CalendarRange size={20} />

          Automated Report Generation

        </h3>

        <p>
          Generate daily and weekly summaries using saved classroom sensor data.
        </p>

        <div className="reports-stats">

          <div className="report-stat-card">

            <CalendarDays size={25} />

            <span>Daily Reports</span>

            <h3>{dailyReports.length}</h3>

            <small>Generated reports</small>

          </div>


          <div className="report-stat-card">

            <CalendarRange size={25} />

            <span>Weekly Reports</span>

            <h3>{weeklyReports.length}</h3>

            <small>Generated reports</small>

          </div>

        </div>


        <div className="reports-download">

          <button
            className="pdf-button"
            onClick={() => generateReport("daily")}
            disabled={Boolean(generating)}
          >

            {generating === "daily" ? (
              <RefreshCw size={18} />
            ) : (
              <CalendarDays size={18} />
            )}

            {generating === "daily"
              ? "Generating..."
              : "Generate Daily Report"}

          </button>


          <button
            className="csv-button"
            onClick={() => generateReport("weekly")}
            disabled={Boolean(generating)}
          >

            {generating === "weekly" ? (
              <RefreshCw size={18} />
            ) : (
              <CalendarRange size={18} />
            )}

            {generating === "weekly"
              ? "Generating..."
              : "Generate Weekly Report"}

          </button>

        </div>

        <small>
          Scheduled generation: Daily at 12:05 AM and weekly on Monday at 12:10 AM,
          while the backend is running.
        </small>

      </div>


      {/* LATEST DAILY AND WEEKLY REPORTS */}

      <div className="reports-stats">

        <div className="report-stat-card">

          <CalendarDays size={23} />

          <span>Latest Daily Report</span>

          <h3>
            {latestDailyReport
              ? formatDate(latestDailyReport.generated_at)
              : "Not generated"}
          </h3>

          {latestDailyReport && (

            <button
              className="reports-refresh"
              onClick={() =>
                setSelectedReport(
                  latestDailyReport.report
                )
              }
            >

              <Eye size={16} />

              View Report

            </button>

          )}

        </div>


        <div className="report-stat-card">

          <CalendarRange size={23} />

          <span>Latest Weekly Report</span>

          <h3>
            {latestWeeklyReport
              ? formatDate(latestWeeklyReport.generated_at)
              : "Not generated"}
          </h3>

          {latestWeeklyReport && (

            <button
              className="reports-refresh"
              onClick={() =>
                setSelectedReport(
                  latestWeeklyReport.report
                )
              }
            >

              <Eye size={16} />

              View Report

            </button>

          )}

        </div>

      </div>


      {/* SENSOR REPORT FILTER */}

      <div className="reports-filter">

        <CalendarDays size={19} />

        <label htmlFor="report-period">
          Sensor report period:
        </label>

        <select
          id="report-period"
          value={period}
          onChange={(event) =>
            setPeriod(event.target.value)
          }
        >

          <option value="1">Last 24 hours</option>

          <option value="7">Last 7 days</option>

          <option value="30">Last 30 days</option>

          <option value="all">All available records</option>

        </select>

      </div>


      {/* SENSOR STATISTICS */}

      <div className="reports-stats">

        <div className="report-stat-card">

          <FileText size={24} />

          <span>Total Readings</span>

          <h3>{filteredHistory.length}</h3>

        </div>


        <div className="report-stat-card">

          <Thermometer size={24} />

          <span>Average Temperature</span>

          <h3>{calculateAverage("temperature")} °C</h3>

        </div>


        <div className="report-stat-card">

          <Droplets size={24} />

          <span>Average Humidity</span>

          <h3>{calculateAverage("humidity")} %</h3>

        </div>


        <div className="report-stat-card">

          <Users size={24} />

          <span>Average Occupancy</span>

          <h3>{calculateAverage("occupancy")}</h3>

        </div>

      </div>


      {/* CLASSROOM STATISTICS TABLE */}

      <div className="reports-summary">

        <h3>

          <Activity size={20} />

          Classroom Statistics

        </h3>

        <div className="reports-table-wrapper">

          <table className="reports-table">

            <thead>

              <tr>

                <th>Metric</th>

                <th>Average</th>

                <th>Minimum – Maximum</th>

              </tr>

            </thead>

            <tbody>

              {[

                ["Temperature (°C)", "temperature"],

                ["Humidity (%)", "humidity"],

                ["Occupancy", "occupancy"],

                ["Light (lux)", "light"],

                ["Air Quality", "air_quality"]

              ].map(([label, key]) => (

                <tr key={key}>

                  <td>{label}</td>

                  <td>{calculateAverage(key)}</td>

                  <td>{getRange(key)}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>


      {/* GENERATED REPORT HISTORY */}

      <div className="reports-summary">

        <h3>

          <Clock size={20} />

          Generated Report History

        </h3>

        {generatedReports.length > 0 ? (

          <div className="reports-table-wrapper">

            <table className="reports-table">

              <thead>

                <tr>

                  <th>Report ID</th>

                  <th>Report Type</th>

                  <th>Generated At</th>

                  <th>Sensor Readings</th>

                  <th>Action</th>

                </tr>

              </thead>

              <tbody>

                {generatedReports.map((item) => (

                  <tr key={item.id}>

                    <td>#{item.id}</td>

                    <td>

                      {item.report_type.toUpperCase()}

                    </td>

                    <td>

                      {formatDate(item.generated_at)}

                    </td>

                    <td>{item.readings_count}</td>

                    <td>

                      <button
                        className="reports-refresh"
                        onClick={() =>
                          setSelectedReport(item.report)
                        }
                      >

                        <Eye size={15} />

                        View

                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        ) : (

          <p>
            No generated reports available yet. Generate your first daily or weekly report.
          </p>

        )}

      </div>


      {/* LATEST AI PREDICTION */}

      <div className="reports-latest">

        <h3>Latest AI Prediction</h3>

        <p>
          {prediction || "No AI prediction has been generated yet."}
        </p>

        <small>
          This is the latest prediction from the current dashboard session,
          not a historical prediction record.
        </small>

      </div>


      {/* PDF AND CSV DOWNLOADS */}

      <div className="reports-download">

        <div>

          <h3>Download Your Report</h3>

          <p>
            Export the selected period's sensor readings and summary.
          </p>

        </div>

        <button
          className="pdf-button"
          onClick={exportPDF}
          disabled={!filteredHistory.length}
        >

          <Download size={18} />

          Download PDF

        </button>


        <button
          className="csv-button"
          onClick={exportCSV}
          disabled={!filteredHistory.length}
        >

          <FileSpreadsheet size={18} />

          Export CSV

        </button>

      </div>


      {/* STATUS */}

      {filteredHistory.length > 0 ? (

        <p className="reports-success">

          <CheckCircle size={16} />

          {filteredHistory.length} sensor readings ready for reporting.

        </p>

      ) : (

        <p className="reports-empty">

          No readings found for the selected period.

        </p>

      )}


      {/* REPORT DETAILS MODAL */}

      {selectedReport && (

        <div className="report-modal-overlay">

          <div className="report-modal">

            <div className="reports-header">

              <div>

                <h2>
                  {selectedReport.report_type?.toUpperCase()} CLASSROOM REPORT
                </h2>

                <p>
                  Generated: {formatDate(selectedReport.generated_at)}
                </p>

              </div>

              <button
                className="reports-refresh"
                onClick={() => setSelectedReport(null)}
              >

                <X size={20} />

                Close

              </button>

            </div>


            <div className="report-detail-status">

              <h3>
                Classroom Status: {selectedReport.classroom_status}
              </h3>

              <p>{selectedReport.summary}</p>

              <p>
                Total Sensor Readings: {selectedReport.readings_count}
              </p>

              <p>
                Board Active: {selectedReport.board_active_percentage}%
              </p>

            </div>


            <h3>Sensor Statistics</h3>

            <div className="reports-table-wrapper">

              <table className="reports-table">

                <thead>

                  <tr>

                    <th>Metric</th>

                    <th>Average</th>

                    <th>Minimum</th>

                    <th>Maximum</th>

                  </tr>

                </thead>

                <tbody>

                  {Object.entries(
                    selectedReport.statistics || {}
                  ).map(([key, value]) => (

                    <tr key={key}>

                      <td>{key.replace("_", " ").toUpperCase()}</td>

                      <td>{value.average}</td>

                      <td>{value.minimum}</td>

                      <td>{value.maximum}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>


            <h3>Classroom Alerts</h3>

            {selectedReport.alerts?.length > 0 ? (

              selectedReport.alerts.map((alert, index) => (

                <p className="reports-error" key={index}>

                  <AlertCircle size={17} />

                  {alert}

                </p>

              ))

            ) : (

              <p className="reports-success">

                <CheckCircle size={17} />

                No configured classroom threshold alerts were detected.

              </p>

            )}

            <small>
              {selectedReport.threshold_note}
            </small>

          </div>

        </div>

      )}

    </section>

  );

}

export default Reports;

