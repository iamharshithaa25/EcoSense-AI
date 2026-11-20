
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Info
} from "lucide-react";

import "./XAIExplanation.css";

function formatFeatureName(name) {
  return name
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function XAIExplanation({ explanation }) {

  if (!explanation) {
    return null;
  }

  if (!explanation.available) {
    return (
      <section className="xai-section">
        <h2>
          <BrainCircuit size={23} />
          Explainable AI
        </h2>

        <p className="xai-error">
          The prediction was generated, but its SHAP explanation
          is currently unavailable.
        </p>

        <small>{explanation.message}</small>
      </section>
    );
  }

  const features = explanation.features || [];

  const maxContribution = Math.max(
    ...features.map(item =>
      Math.abs(item.contribution)
    ),
    0.000001
  );

  const positiveFeatures = features.filter(
    item => item.contribution > 0
  ).length;

  const negativeFeatures = features.filter(
    item => item.contribution < 0
  ).length;

  return (
    <section className="xai-section">

      <div className="xai-heading">
        <div>
          <h2>
            <BrainCircuit size={25} />
            Explainable AI (XAI)
          </h2>

          <p>
            Understand how the Random Forest model arrived
            at its prediction using SHAP.
          </p>
        </div>

        <span className="xai-method">
          SHAP Analysis
        </span>
      </div>

      <div className="xai-prediction-card">
        <span>EXPLAINED PREDICTION</span>

        <h3>{explanation.predicted_class}</h3>

        <p>
          This explanation shows how each input feature
          contributed to the selected class output.
        </p>
      </div>

      <div className="xai-stat-grid">

        <div className="xai-stat">
          <TrendingUp size={22} />
          <p>Supporting Features</p>
          <h3>{positiveFeatures}</h3>
        </div>

        <div className="xai-stat">
          <TrendingDown size={22} />
          <p>Opposing Features</p>
          <h3>{negativeFeatures}</h3>
        </div>

        <div className="xai-stat">
          <BrainCircuit size={22} />
          <p>Analysed Features</p>
          <h3>{features.length}</h3>
        </div>

      </div>

      <div className="xai-chart-panel">

        <h3>Individual Feature Contributions</h3>

        <p className="xai-description">
          Positive SHAP values support the selected class.
          Negative values oppose it. Bar lengths show
          absolute contribution magnitude.
        </p>

        {features.map(item => {

          const positive = item.contribution > 0;

          const barWidth =
            Math.abs(item.contribution) /
            maxContribution * 100;

          return (
            <div
              className="xai-feature"
              key={item.feature}
            >

              <div className="xai-feature-top">

                <div>
                  <strong>
                    {formatFeatureName(item.feature)}
                  </strong>

                  <small>
                    Input value: {item.value}
                  </small>
                </div>

                <span
                  className={
                    positive
                      ? "xai-positive"
                      : item.contribution < 0
                      ? "xai-negative"
                      : "xai-neutral"
                  }
                >
                  {positive ? "+" : ""}
                  {item.contribution.toFixed(5)}
                </span>

              </div>

              <div className="xai-bar-background">
                <div
                  className={
                    positive
                      ? "xai-bar xai-bar-positive"
                      : "xai-bar xai-bar-negative"
                  }
                  style={{
                    width: `${barWidth}%`
                  }}
                />
              </div>

              <small className="xai-direction">
                {positive
                  ? "Supports this prediction"
                  : item.contribution < 0
                  ? "Opposes this prediction"
                  : "Neutral contribution"}
              </small>

            </div>
          );
        })}

      </div>

      <div className="xai-base-card">
        <strong>SHAP Base Value</strong>

        <h3>{explanation.base_value.toFixed(5)}</h3>

        <p>
          This is the expected model output used as the
          reference point for the feature contributions.
        </p>
      </div>

      <div className="xai-information">
        <Info size={18} />

        <p>
          SHAP explains the contribution of each feature
          to the selected class output. These values are
          model explanations, not proof of causation.
          The base value plus the feature contributions
          reconstructs the model output in the explainer's
          output space.
        </p>
      </div>

    </section>
  );
}

export default XAIExplanation;
