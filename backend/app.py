
from flask import Flask, request, jsonify
from flask_cors import CORS

import joblib
import pandas as pd
import numpy as np
import shap
import sqlite3
import os
import json
import threading
import time

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


app = Flask(__name__)
CORS(app)


# --------------------------------------------------
# PATHS AND DATABASE CONFIGURATION
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Keep runtime data outside the deployed source folder. Locally this remains
# the backend folder; in Railway, ECOSENSE_DATA_DIR is set to the /data volume.
DATA_DIR = os.environ.get("ECOSENSE_DATA_DIR", BASE_DIR)
os.makedirs(DATA_DIR, exist_ok=True)

# Reports should follow the project's local time, regardless of the server's
# timezone. The deployment guide sets this explicitly as well.
TIMEZONE_NAME = os.environ.get("ECOSENSE_TIMEZONE", "Asia/Kolkata")
try:
    APP_TIMEZONE = ZoneInfo(TIMEZONE_NAME)
except Exception:
    APP_TIMEZONE = ZoneInfo("UTC")


def current_time():
    return datetime.now(APP_TIMEZONE)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "classroom_model.pkl"
)

DATABASE_PATH = os.path.join(
    DATA_DIR,
    "classroom_history.db"
)


# --------------------------------------------------
# LOAD TRAINED RANDOM FOREST MODEL
# --------------------------------------------------

model = joblib.load(MODEL_PATH)

FEATURES = [
    "temperature",
    "humidity",
    "occupancy",
    "light",
    "air_quality",
    "board_active"
]

explainer = shap.TreeExplainer(model)


# --------------------------------------------------
# DATABASE CONNECTION
# --------------------------------------------------

def get_db_connection():

    connection = sqlite3.connect(DATABASE_PATH, timeout=30)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA busy_timeout = 30000")

    return connection


def initialize_database():

    connection = get_db_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS sensor_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            occupancy REAL NOT NULL,
            light REAL NOT NULL,
            air_quality REAL NOT NULL,
            board_active INTEGER NOT NULL
        )
    """)

    # Store generated daily and weekly reports
    connection.execute("""
        CREATE TABLE IF NOT EXISTS report_history (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            report_type TEXT NOT NULL,

            generated_at TEXT NOT NULL,

            period_start TEXT NOT NULL,

            period_end TEXT NOT NULL,

            readings_count INTEGER NOT NULL,

            report_json TEXT NOT NULL,

            schedule_key TEXT UNIQUE

        )
    """)

    connection.commit()
    connection.close()

    print("EcoSense AI database initialized successfully.")


initialize_database()


# --------------------------------------------------
# SENSOR INPUT VALIDATION
# --------------------------------------------------

def validate_sensor_data(data):

    if not data:
        raise ValueError("No sensor data received")

    values = {}

    for feature in FEATURES:

        if feature not in data:
            raise ValueError(
                "Missing sensor feature: " + feature
            )

        try:
            value = float(data[feature])

        except (TypeError, ValueError):
            raise ValueError(
                "Invalid value for " + feature
            )

        if not np.isfinite(value):
            raise ValueError(
                feature + " must be a finite number"
            )

        values[feature] = value

    if values["board_active"] not in (0, 1):
        raise ValueError(
            "board_active must be either 0 or 1"
        )

    return values


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "EcoSense AI Backend Running",
        "model": "Random Forest",
        "database": "SQLite Enabled",
        "automated_reports": "Enabled"
    })


@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "Online",
        "model": "Random Forest",
        "explainable_ai": "SHAP Enabled",
        "sensor_history": "SQLite Enabled",
        "automated_reports": "Enabled"
    })


# --------------------------------------------------
# SAVE SENSOR READING
# --------------------------------------------------

@app.route("/api/history", methods=["POST"])
def save_sensor_history():

    connection = None

    try:

        data = request.get_json(silent=True)
        values = validate_sensor_data(data)

        timestamp = current_time().isoformat(
            timespec="seconds"
        )

        connection = get_db_connection()

        cursor = connection.execute("""
            INSERT INTO sensor_history (
                timestamp,
                temperature,
                humidity,
                occupancy,
                light,
                air_quality,
                board_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            timestamp,
            values["temperature"],
            values["humidity"],
            values["occupancy"],
            values["light"],
            values["air_quality"],
            int(values["board_active"])
        ))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Sensor reading saved successfully",
            "id": cursor.lastrowid,
            "timestamp": timestamp
        }), 201

    except ValueError as error:

        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception as error:

        if connection:
            connection.rollback()

        print("History save error:", error)

        return jsonify({
            "success": False,
            "error": "Unable to save sensor history"
        }), 500

    finally:

        if connection:
            connection.close()


# --------------------------------------------------
# GET SENSOR HISTORY
# --------------------------------------------------

@app.route("/api/history", methods=["GET"])
def get_sensor_history():

    connection = None

    try:

        limit = request.args.get(
            "limit",
            default=100,
            type=int
        )

        if limit is None:
            limit = 100

        limit = max(1, min(limit, 1000))

        connection = get_db_connection()

        rows = connection.execute("""
            SELECT *
            FROM sensor_history
            WHERE id IN (
                SELECT id
                FROM sensor_history
                ORDER BY id DESC
                LIMIT ?
            )
            ORDER BY id ASC
        """, (limit,)).fetchall()

        readings = [
            dict(row)
            for row in rows
        ]

        return jsonify({
            "success": True,
            "count": len(readings),
            "readings": readings
        })

    except Exception as error:

        print("History retrieval error:", error)

        return jsonify({
            "success": False,
            "error": "Unable to retrieve sensor history"
        }), 500

    finally:

        if connection:
            connection.close()


# --------------------------------------------------
# SENSOR HISTORY STATISTICS
# --------------------------------------------------

@app.route("/api/history/stats", methods=["GET"])
def get_sensor_statistics():

    connection = None

    try:

        connection = get_db_connection()

        result = connection.execute("""
            SELECT
                COUNT(*) AS total_readings,

                AVG(temperature) AS avg_temperature,
                MIN(temperature) AS min_temperature,
                MAX(temperature) AS max_temperature,

                AVG(humidity) AS avg_humidity,
                MIN(humidity) AS min_humidity,
                MAX(humidity) AS max_humidity,

                AVG(occupancy) AS avg_occupancy,
                MIN(occupancy) AS min_occupancy,
                MAX(occupancy) AS max_occupancy,

                AVG(light) AS avg_light,
                MIN(light) AS min_light,
                MAX(light) AS max_light,

                AVG(air_quality) AS avg_air_quality,
                MIN(air_quality) AS min_air_quality,
                MAX(air_quality) AS max_air_quality

            FROM sensor_history
        """).fetchone()

        statistics = {}

        for key in result.keys():

            value = result[key]

            if value is None:
                statistics[key] = None

            elif key == "total_readings":
                statistics[key] = int(value)

            else:
                statistics[key] = round(float(value), 2)

        return jsonify({
            "success": True,
            "statistics": statistics
        })

    except Exception as error:

        print("Statistics error:", error)

        return jsonify({
            "success": False,
            "error": "Unable to calculate sensor statistics"
        }), 500

    finally:

        if connection:
            connection.close()


# --------------------------------------------------
# AUTOMATED REPORT GENERATION
# --------------------------------------------------

def parse_timestamp(timestamp):

    try:

        value = datetime.fromisoformat(timestamp)

        if value.tzinfo is None:
            value = value.replace(tzinfo=APP_TIMEZONE)

        return value

    except (ValueError, TypeError):
        return None


def generate_classroom_report(report_type, scheduled=False):

    if report_type not in ("daily", "weekly"):
        raise ValueError("Report type must be daily or weekly")

    now = current_time()

    if report_type == "daily":

        period_start = now - timedelta(days=1)

    else:

        period_start = now - timedelta(days=7)

    connection = get_db_connection()

    try:

        # Prevent duplicate scheduled reports
        schedule_key = None

        if scheduled:

            if report_type == "daily":

                schedule_key = "daily:" + now.strftime("%Y-%m-%d")

            else:

                schedule_key = "weekly:" + now.strftime("%Y-%m-%d")

            existing = connection.execute("""
                SELECT id
                FROM report_history
                WHERE schedule_key = ?
            """, (schedule_key,)).fetchone()

            if existing:

                return {
                    "success": True,
                    "message": "Scheduled report already exists",
                    "report_id": existing["id"]
                }

        rows = connection.execute("""
            SELECT *
            FROM sensor_history
            ORDER BY id ASC
        """).fetchall()

        readings = []

        for row in rows:

            reading = dict(row)

            reading_time = parse_timestamp(
                reading["timestamp"]
            )

            if reading_time is None:
                continue

            if period_start <= reading_time <= now:

                readings.append(reading)

        if not readings:

            return {
                "success": False,
                "message": "No sensor readings available for this reporting period",
                "readings_count": 0
            }

        # Calculate sensor statistics
        sensor_fields = [
            "temperature",
            "humidity",
            "occupancy",
            "light",
            "air_quality"
        ]

        statistics = {}

        for field in sensor_fields:

            values = [
                float(item[field])
                for item in readings
            ]

            statistics[field] = {
                "average": round(float(np.mean(values)), 2),
                "minimum": round(float(np.min(values)), 2),
                "maximum": round(float(np.max(values)), 2)
            }

        # Classroom condition observations.
        # These are configurable demonstration thresholds,
        # not certified health or safety standards.
        alerts = []

        avg_temp = statistics["temperature"]["average"]
        avg_humidity = statistics["humidity"]["average"]
        avg_occupancy = statistics["occupancy"]["average"]
        avg_light = statistics["light"]["average"]
        avg_air = statistics["air_quality"]["average"]

        if avg_temp > 30:
            alerts.append("Average classroom temperature is high.")

        if avg_temp < 18:
            alerts.append("Average classroom temperature is low.")

        if avg_humidity > 70:
            alerts.append("Average humidity is high.")

        if avg_humidity < 30:
            alerts.append("Average humidity is low.")

        if avg_occupancy > 50:
            alerts.append("Classroom occupancy is relatively high.")

        if avg_light < 100:
            alerts.append("Average light level is low.")

        if avg_air > 150:
            alerts.append("Air quality reading needs attention.")

        board_active_count = sum(
            int(item["board_active"])
            for item in readings
        )

        board_active_percentage = (
            board_active_count / len(readings)
        ) * 100

        report = {

            "report_type": report_type,

            "generated_at": now.isoformat(
                timespec="seconds"
            ),

            "period_start": period_start.isoformat(
                timespec="seconds"
            ),

            "period_end": now.isoformat(
                timespec="seconds"
            ),

            "readings_count": len(readings),

            "statistics": statistics,

            "board_active_percentage": round(
                board_active_percentage, 2
            ),

            "alerts": alerts,

            "classroom_status": (
                "Needs Attention"
                if alerts
                else "Normal"
            ),

            "summary": (
                "Classroom monitoring report generated successfully. "
                + str(len(readings))
                + " sensor readings were analyzed."
            ),

            "threshold_note": (
                "Classroom alert thresholds are configurable "
                "demonstration values."
            )
        }

        cursor = connection.execute("""
            INSERT INTO report_history (
                report_type,
                generated_at,
                period_start,
                period_end,
                readings_count,
                report_json,
                schedule_key
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            report_type,
            report["generated_at"],
            report["period_start"],
            report["period_end"],
            len(readings),
            json.dumps(report),
            schedule_key
        ))

        connection.commit()

        report["id"] = cursor.lastrowid

        print(
            report_type.capitalize()
            + " report generated successfully."
        )

        return {
            "success": True,
            "message": report_type.capitalize()
            + " report generated successfully",
            "report": report
        }

    finally:

        connection.close()


# --------------------------------------------------
# MANUALLY GENERATE DAILY OR WEEKLY REPORT
# --------------------------------------------------

@app.route("/api/reports/generate", methods=["POST"])
def generate_report_api():

    try:

        data = request.get_json(silent=True) or {}

        report_type = data.get("type", "").lower()

        if report_type not in ("daily", "weekly"):

            return jsonify({
                "success": False,
                "error": "Provide type as daily or weekly"
            }), 400

        result = generate_classroom_report(
            report_type,
            scheduled=False
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as error:

        print("Report generation error:", error)

        return jsonify({
            "success": False,
            "error": "Unable to generate classroom report"
        }), 500


# --------------------------------------------------
# GET GENERATED REPORT HISTORY
# --------------------------------------------------

@app.route("/api/reports", methods=["GET"])
def get_generated_reports():

    connection = None

    try:

        report_type = request.args.get("type")

        connection = get_db_connection()

        if report_type in ("daily", "weekly"):

            rows = connection.execute("""
                SELECT *
                FROM report_history
                WHERE report_type = ?
                ORDER BY id DESC
            """, (report_type,)).fetchall()

        else:

            rows = connection.execute("""
                SELECT *
                FROM report_history
                ORDER BY id DESC
            """).fetchall()

        reports = []

        for row in rows:

            item = dict(row)

            item["report"] = json.loads(
                item["report_json"]
            )

            del item["report_json"]
            del item["schedule_key"]

            reports.append(item)

        return jsonify({
            "success": True,
            "count": len(reports),
            "reports": reports
        })

    except Exception as error:

        print("Report history error:", error)

        return jsonify({
            "success": False,
            "error": "Unable to retrieve generated reports"
        }), 500

    finally:

        if connection:
            connection.close()


# --------------------------------------------------
# GET ONE GENERATED REPORT
# --------------------------------------------------

@app.route("/api/reports/<int:report_id>", methods=["GET"])
def get_single_report(report_id):

    connection = None

    try:

        connection = get_db_connection()

        row = connection.execute("""
            SELECT *
            FROM report_history
            WHERE id = ?
        """, (report_id,)).fetchone()

        if row is None:

            return jsonify({
                "success": False,
                "error": "Report not found"
            }), 404

        report = dict(row)

        report["report"] = json.loads(
            report["report_json"]
        )

        del report["report_json"]
        del report["schedule_key"]

        return jsonify({
            "success": True,
            "report": report
        })

    except Exception as error:

        print("Single report error:", error)

        return jsonify({
            "success": False,
            "error": "Unable to retrieve report"
        }), 500

    finally:

        if connection:
            connection.close()


# --------------------------------------------------
# AUTOMATIC DAILY AND WEEKLY REPORT SCHEDULER
# --------------------------------------------------

def automated_report_scheduler():

    print("EcoSense AI automated report scheduler started.")

    while True:

        try:

            now = current_time()

            # Generate a missed report as soon as the service is available
            # after its scheduled time. schedule_key prevents duplicates.
            if (now.hour, now.minute) >= (0, 5):

                generate_classroom_report(
                    "daily",
                    scheduled=True
                )

            # Weekly report every Monday at 12:10 AM.
            if (
                now.weekday() == 0
                and (now.hour, now.minute) >= (0, 10)
            ):

                generate_classroom_report(
                    "weekly",
                    scheduled=True
                )

        except Exception as error:

            print(
                "Automated scheduler error:",
                error
            )

        time.sleep(30)


def start_report_scheduler():

    scheduler_thread = threading.Thread(
        target=automated_report_scheduler,
        daemon=True
    )

    scheduler_thread.start()


# --------------------------------------------------
# SHAP EXPLANATION FUNCTION
# --------------------------------------------------

def generate_shap_explanation(input_data, class_index):

    shap_values = explainer.shap_values(
        input_data,
        check_additivity=False
    )

    classes = list(model.classes_)

    if isinstance(shap_values, list):

        selected_values = np.asarray(
            shap_values[class_index]
        )[0]

    else:

        values = np.asarray(shap_values)

        if values.ndim == 3:

            if (
                values.shape[0] == 1
                and values.shape[1] == len(FEATURES)
                and values.shape[2] == len(classes)
            ):

                selected_values = values[0, :, class_index]

            elif (
                values.shape[0] == len(classes)
                and values.shape[1] == 1
                and values.shape[2] == len(FEATURES)
            ):

                selected_values = values[class_index, 0, :]

            else:

                raise ValueError(
                    "Unexpected multi-class SHAP output shape: "
                    + str(values.shape)
                )

        elif values.ndim == 2:

            selected_values = values[0]

        else:

            raise ValueError(
                "Unexpected SHAP output dimensions"
            )

    selected_values = np.asarray(
        selected_values
    ).reshape(-1)

    if len(selected_values) != len(FEATURES):

        raise ValueError(
            "SHAP feature count does not match model features"
        )

    expected = np.asarray(
        explainer.expected_value
    )

    if expected.ndim == 0:

        base_value = float(expected)

    else:

        expected = expected.reshape(-1)

        if len(expected) == len(classes):

            base_value = float(
                expected[class_index]
            )

        else:

            base_value = float(expected[0])

    feature_explanations = []

    for index, feature_name in enumerate(FEATURES):

        contribution = float(
            selected_values[index]
        )

        feature_explanations.append({

            "feature": feature_name,

            "value": float(
                input_data.iloc[0][feature_name]
            ),

            "contribution": round(
                contribution, 6
            ),

            "direction": (
                "supports"
                if contribution > 0
                else "opposes"
                if contribution < 0
                else "neutral"
            )

        })

    feature_explanations.sort(
        key=lambda item: abs(
            item["contribution"]
        ),
        reverse=True
    )

    return {

        "available": True,

        "method": "SHAP TreeExplainer",

        "predicted_class": str(
            classes[class_index]
        ),

        "base_value": round(
            base_value, 6
        ),

        "features": feature_explanations

    }


# --------------------------------------------------
# AI PREDICTION + EXPLAINABLE AI
# --------------------------------------------------

@app.route("/api/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json(silent=True)

        values_dict = validate_sensor_data(data)

        values = [
            values_dict[feature]
            for feature in FEATURES
        ]

        input_data = pd.DataFrame(
            [values],
            columns=FEATURES
        )

        prediction = model.predict(
            input_data
        )[0]

        probabilities = model.predict_proba(
            input_data
        )[0]

        classes = list(model.classes_)

        predicted_class_index = classes.index(
            prediction
        )

        confidence = {

            str(classes[index]): round(
                float(probabilities[index]) * 100,
                2
            )

            for index in range(len(classes))

        }

        feature_importance = {

            feature: round(
                float(
                    model.feature_importances_[index]
                ),
                6
            )

            for index, feature in enumerate(FEATURES)

        }

        try:

            shap_explanation = generate_shap_explanation(
                input_data,
                predicted_class_index
            )

        except Exception as explain_error:

            print(
                "SHAP explanation error:",
                explain_error
            )

            shap_explanation = {

                "available": False,

                "method": "SHAP TreeExplainer",

                "message": str(explain_error),

                "features": []

            }

        return jsonify({

            "success": True,

            "prediction": str(prediction),

            "confidence": confidence,

            "feature_importance": feature_importance,

            "shap_explanation": shap_explanation,

            "model": "Random Forest"

        })

    except ValueError as error:

        return jsonify({

            "success": False,

            "error": "Invalid sensor input: " + str(error)

        }), 400

    except Exception as error:

        print("Prediction error:", error)

        return jsonify({

            "success": False,

            "error": str(error)

        }), 500


# --------------------------------------------------
# RUN FLASK SERVER
# --------------------------------------------------

# Gunicorn imports this module instead of running it as __main__. Start the
# scheduler here so deployment keeps generating reports. The Railway command
# deliberately uses one worker, which guarantees one scheduler instance.
if os.environ.get("ENABLE_REPORT_SCHEDULER", "true").lower() == "true":
    start_report_scheduler()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
        debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true",
        use_reloader=False
    )

