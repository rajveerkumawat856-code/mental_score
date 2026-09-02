const form = document.getElementById('predict-form');
const submitBtn = document.getElementById('submit-btn');
const errorMsg = document.getElementById('error-msg');
const resultNumber = document.getElementById('result-number');
const resultHint = document.getElementById('result-hint');
const gaugeFill = document.getElementById('gauge-fill');

const ARC_LENGTH = 283; // approx length of the semicircle path in the SVG
const SCORE_MAX = 10;   // adjust if your model's target scale differs

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.hidden = true;

  const apiUrl = document.getElementById('api-url').value.trim();

  const payload = {
    age: Number(document.getElementById('age').value),
    gender: document.getElementById('gender').value,
    country: document.getElementById('country').value.trim(),
    academic_level: document.getElementById('academic_level').value,
    most_used_platform: document.getElementById('most_used_platform').value,
    purpose_of_use: document.getElementById('purpose_of_use').value,
    avg_daily_usage_hours: Number(document.getElementById('avg_daily_usage_hours').value),
    daily_unlocks: Number(document.getElementById('daily_unlocks').value),
    study_hours: Number(document.getElementById('study_hours').value),
    physical_activity_hours: Number(document.getElementById('physical_activity_hours').value),
    sleep_hours_per_night: Number(document.getElementById('sleep_hours_per_night').value),
    stress_level: document.getElementById('stress_level').value,
  };

  setLoading(true);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log(response);

    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(detail || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    renderScore(data.predicted_mental_health_score);
  } catch (err) {
    showError(err);
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? 'Estimating…' : 'Estimate my score';
}

async function safeReadError(response) {
  try {
    const body = await response.json();
    if (body?.detail) {
      return typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    }
  } catch (_) {
    // response wasn't JSON, ignore
  }
  return null;
}

function renderScore(score) {
  resultNumber.textContent = score;
  resultHint.textContent = 'Based on the habits you entered, via your model.';

  const fraction = Math.min(Math.max(score / SCORE_MAX, 0), 1);
  gaugeFill.setAttribute('stroke-dasharray', `${fraction * ARC_LENGTH} ${ARC_LENGTH}`);

  // low score -> warm/warning colour, high score -> calm accent
  const hue = 8 + fraction * 150; // roughly coral (8) to teal (158)
  gaugeFill.setAttribute('stroke', `hsl(${hue}, 45%, 48%)`);
}

function showError(err) {
  console.error(err);
  let message = 'Something went wrong reaching the API.';
  if (err instanceof TypeError) {
    message = 'Could not reach the API. Check the endpoint URL, that uvicorn is running, and that CORS is enabled.';
  } else if (err?.message) {
    message = err.message;
  }
  errorMsg.textContent = message;
  errorMsg.hidden = false;
  resultHint.textContent = 'Estimate failed — see the error message on the left.';
}
