
import numpy as np
import pandas as pd
import joblib
import json

from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# Create reproducible simulated classroom data
np.random.seed(42)

number_of_samples = 5000

data = pd.DataFrame({
    "temperature": np.random.uniform(18, 40, number_of_samples),
    "humidity": np.random.uniform(20, 90, number_of_samples),
    "occupancy": np.random.randint(0, 61, number_of_samples),
    "light": np.random.uniform(0, 600, number_of_samples),
    "air_quality": np.random.uniform(0, 500, number_of_samples),
    "board_active": np.random.randint(0, 2, number_of_samples)
})

# Assign classroom-state labels using documented rules
def classify_classroom(row):
    if row["occupancy"] == 0:
        return "Empty"

    elif row["air_quality"] > 200:
        return "Poor-Air-Quality"

    elif row["temperature"] >= 32 and row["occupancy"] >= 25:
        return "Occupied-High-Load"

    elif row["light"] >= 250:
        return "Bright-Daylight"

    elif row["board_active"] == 1:
        return "Board-Active"

    else:
        return "Occupied-Normal"


data["classroom_state"] = data.apply(classify_classroom, axis=1)

# Select input features and target
features = [
    "temperature",
    "humidity",
    "occupancy",
    "light",
    "air_quality",
    "board_active"
]

X = data[features]
y = data["classroom_state"]

# Split into training and testing data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

# Train Random Forest model
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=12,
    random_state=42,
    class_weight="balanced"
)

model.fit(X_train, y_train)

# Evaluate on unseen test data
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\n===== ECOSENSE AI MODEL RESULTS =====")
print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))
print("Accuracy:", round(accuracy * 100, 2), "%")

print("\nClassification Report:")
print(classification_report(y_test, predictions, zero_division=0))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, predictions))

# Display feature importance
print("\nFeature Importance:")

for name, importance in zip(
    features, model.feature_importances_
):
    print(name, ":", round(float(importance), 4))

# Save trained model and supporting files
output_folder = Path("model")
output_folder.mkdir(exist_ok=True)

joblib.dump(model, output_folder / "classroom_model.pkl")

data.to_csv(output_folder / "classroom_dataset.csv", index=False)

with open(output_folder / "model_metrics.json", "w") as file:
    json.dump({
        "accuracy": float(accuracy),
        "training_samples": len(X_train),
        "testing_samples": len(X_test),
        "features": features,
        "classes": model.classes_.tolist(),
        "feature_importance": {
            name: float(value)
            for name, value in zip(
                features, model.feature_importances_
            )
        }
    }, file, indent=4)

print("\nModel saved successfully!")
print("Files saved inside backend/model/")
