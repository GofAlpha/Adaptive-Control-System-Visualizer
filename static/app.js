// Global variables
let chart = null;
let apiConfigured = false; // credentials present in inputs
let isConnected = false;   // verified successful call to backend/upstream

// Optional remote backend base (e.g., when hosting frontend on GCS)
// Configure one of the following in production:
// 1) Set window.BACKEND_BASE = 'https://your-backend.example.com';
// 2) Or set localStorage.setItem('BACKEND_BASE', 'https://your-backend.example.com');
const BACKEND_BASE = (typeof window !== 'undefined' && window.BACKEND_BASE)
  || (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('BACKEND_BASE'))
  || '';
const apiUrl = (p) => `${BACKEND_BASE}${p}`;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    initializeChart();
    await loadApiConfig();
    
    // Add event listeners for real-time parameter updates
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.id !== 'apiUrl' && input.id !== 'apiKey' && input.id !== 'apiHost') {
            input.addEventListener('input', debounce(updatePreview, 500));
        }
    });

    // If credentials are already present on load, attempt verification
    if (apiConfigured) {
        updateApiStatus();
        await verifyRapidApiConnection();
    }
});

// Initialize Chart.js
function initializeChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Output Gain',
                data: [],
                borderColor: 'rgb(102, 126, 234)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Control Parameter',
                data: [],
                borderColor: 'rgb(118, 75, 162)',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                tension: 0.4,
                fill: false
            }, {
                label: 'Processing Factor',
                data: [],
                borderColor: 'rgb(72, 187, 120)',
                backgroundColor: 'rgba(72, 187, 120, 0.1)',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Adaptive Control System Response'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Parameter Value'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Response Value'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// API Configuration functions
async function saveApiConfig() {
    // Validate current inputs and update UI.
    const baseUrl = document.getElementById('apiUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const apiHost = document.getElementById('apiHost').value.trim();
    apiConfigured = !!(baseUrl && apiKey && apiHost);
    isConnected = false;
    updateApiStatus();
    if (!apiConfigured) {
        showMessage('Incomplete credentials. Enter Endpoint URL, RapidAPI Key, and Host header.', 'error');
        return;
    }
    // Verify connectivity by performing a lightweight calculate call
    await verifyRapidApiConnection();
}

async function loadApiConfig() {
    // No server-side storage. Leave fields as-is and compute status.
    const baseUrl = document.getElementById('apiUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const apiHost = document.getElementById('apiHost').value.trim();
    apiConfigured = !!(baseUrl && apiKey && apiHost);
    isConnected = false; // must verify after page load
    updateApiStatus();
}

function getApiHeaders() {
    const baseUrl = document.getElementById('apiUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const apiHost = document.getElementById('apiHost').value.trim();
    const headers = { 'Content-Type': 'application/json' };
    if (baseUrl && apiKey && apiHost) {
        headers['X-RapidAPI-Base-Url'] = baseUrl;
        headers['X-RapidAPI-Key'] = apiKey;
        headers['X-RapidAPI-Host'] = apiHost;
    }
    return headers;
}

function updateApiStatus() {
    const statusElement = document.getElementById('apiStatus');
    const indicator = statusElement.querySelector('.status-indicator');

    if (!apiConfigured) {
        if (indicator) indicator.className = 'status-indicator status-disconnected';
        statusElement.innerHTML = '<span class="status-indicator status-disconnected"></span>Not connected. Enter RapidAPI Endpoint URL, Key, and Host to enable.';
        return;
    }

    if (isConnected) {
        if (indicator) indicator.className = 'status-indicator status-connected';
        statusElement.innerHTML = '<span class="status-indicator status-connected"></span>Connected to RapidAPI';
    } else {
        if (indicator) indicator.className = 'status-indicator status-disconnected';
        statusElement.innerHTML = '<span class="status-indicator status-disconnected"></span>Credentials provided. Verifying connection…';
    }
}

// Attempt a minimal call to verify the upstream API via backend
async function verifyRapidApiConnection() {
    try {
        const testPayload = {
            current_h: 1.0,
            beta_0: 1.0,
            lambda_factor: 1.0,
            epsilon: 1e-10,
            base_output: [1.0],
            alpha_param: 1.0,
            gamma_param: 1.0
        };

        const resp = await fetch(apiUrl('/api/calculate'), {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify(testPayload)
        });

        if (resp.ok) {
            isConnected = true;
            showMessage('Verified connection to RapidAPI.', 'success');
        } else {
            isConnected = false;
            const err = await safeJson(resp);
            showMessage('RapidAPI verification failed: ' + (err.detail || resp.statusText), 'error');
        }
    } catch (e) {
        isConnected = false;
        showMessage('RapidAPI verification error: ' + e.message, 'error');
    } finally {
        updateApiStatus();
    }
}

// Get form data
function getFormData() {
    const baseOutputText = document.getElementById('baseOutput').value;
    const outputLabelsText = document.getElementById('outputLabels').value;
    
    const baseOutput = baseOutputText.split(',').map(val => parseFloat(val.trim())).filter(val => !isNaN(val));
    const outputLabels = outputLabelsText.trim() ? outputLabelsText.split(',').map(val => val.trim()) : null;
    
    const data = {
        current_h: parseFloat(document.getElementById('currentH').value),
        beta_0: parseFloat(document.getElementById('beta0').value),
        lambda_factor: parseFloat(document.getElementById('lambdaFactor').value),
        epsilon: parseFloat(document.getElementById('epsilon').value),
        base_output: baseOutput,
        alpha_param: parseFloat(document.getElementById('alphaParam').value),
        gamma_param: parseFloat(document.getElementById('gammaParam').value)
    };

    const previousH = document.getElementById('previousH').value;
    if (previousH) {
        data.previous_h = parseFloat(previousH);
    }

    const systemId = document.getElementById('systemId').value;
    if (systemId) {
        data.system_id = systemId;
    }

    if (outputLabels && outputLabels.length === baseOutput.length) {
        data.output_labels = outputLabels;
    }

    return data;
}

// Single calculation
async function calculateSingle() {
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
    button.disabled = true;

    try {
        if (!apiConfigured || !isConnected) {
            showMessage('Please configure and verify RapidAPI connectivity (Endpoint URL, Key, Host) before making requests.', 'error');
            return;
        }
        const data = getFormData();
        const response = await fetch(apiUrl('/api/calculate'), {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            displayResults(result);
            updateSinglePointChart(result);
        } else {
            const error = await response.json();
            showMessage('Calculation failed: ' + (error.detail || 'Unknown error'), 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Display results
function displayResults(result) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.style.display = 'grid';
    
    const fields = [
        { key: 'h_value', label: 'H Value' },
        { key: 'delta_h', label: 'Delta H' },
        { key: 'processing_factor', label: 'Processing Factor' },
        { key: 'control_parameter', label: 'Control Parameter' },
        { key: 'output_gain', label: 'Output Gain' },
        { key: 'timestamp', label: 'Timestamp' }
    ];

    resultsDiv.innerHTML = fields.map(field => {
        const value = result[field.key];
        const displayValue = typeof value === 'number' ? value.toFixed(6) : value;
        return `
            <div class="result-item">
                <h4>${field.label}</h4>
                <div class="value">${displayValue}</div>
            </div>
        `;
    }).join('');

    // Add processed output array
    if (result.processed_output) {
        resultsDiv.innerHTML += `
            <div class="result-item" style="grid-column: 1 / -1;">
                <h4>Processed Output Array</h4>
                <div class="value">[${result.processed_output.map(v => v.toFixed(3)).join(', ')}]</div>
            </div>
        `;
    }

    // Add output mapping if available
    if (result.output_mapping) {
        const mappingHtml = Object.entries(result.output_mapping)
            .map(([key, value]) => `${key}: ${value.toFixed(3)}`)
            .join('<br>');
        
        resultsDiv.innerHTML += `
            <div class="result-item" style="grid-column: 1 / -1;">
                <h4>Output Mapping</h4>
                <div class="value" style="font-size: 14px;">${mappingHtml}</div>
            </div>
        `;
    }
}

// Update chart with single point
function updateSinglePointChart(result) {
    const paramValue = result.h_value;
    
    chart.data.labels = [paramValue];
    chart.data.datasets[0].data = [result.output_gain];
    chart.data.datasets[1].data = [result.control_parameter];
    chart.data.datasets[2].data = [result.processing_factor];
    
    chart.options.plugins.title.text = 'Single Point Calculation Result';
    chart.update();
}

// Graph generation modal functions
function showGraphModal() {
    document.getElementById('graphModal').style.display = 'block';
    
    // Set default values based on selected parameter
    const paramSelect = document.getElementById('parameterSelect');
    updateParameterBounds();
    
    paramSelect.addEventListener('change', updateParameterBounds);
}

function hideGraphModal() {
    document.getElementById('graphModal').style.display = 'none';
}

function updateParameterBounds() {
    const parameter = document.getElementById('parameterSelect').value;
    const startInput = document.getElementById('startValue');
    const endInput = document.getElementById('endValue');
    
    const bounds = {
        'current_h': { min: 0.1, max: 100, start: 0.5, end: 5.0 },
        'beta_0': { min: 0.1, max: 5.0, start: 0.1, end: 5.0 },
        'lambda_factor': { min: 0.1, max: 3.0, start: 0.1, end: 3.0 },
        'alpha_param': { min: 0.1, max: 10.0, start: 0.1, end: 10.0 },
        'gamma_param': { min: 0.1, max: 5.0, start: 0.1, end: 5.0 },
        'epsilon': { min: 1e-12, max: 1e-6, start: 1e-12, end: 1e-6 }
    };
    
    const bound = bounds[parameter];
    if (bound) {
        startInput.min = bound.min;
        startInput.max = bound.max;
        endInput.min = bound.min;
        endInput.max = bound.max;
        startInput.value = bound.start;
        endInput.value = bound.end;
        
        if (parameter === 'epsilon') {
            startInput.step = 1e-12;
            endInput.step = 1e-12;
        } else {
            startInput.step = 0.1;
            endInput.step = 0.1;
        }
    }
}

// Generate parameter sweep graph
async function generateGraph() {
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    button.disabled = true;

    try {
        if (!apiConfigured || !isConnected) {
            showMessage('Please configure and verify RapidAPI connectivity (Endpoint URL, Key, Host) before generating graphs.', 'error');
            return;
        }
        const baseRequest = getFormData();
        const graphRequest = {
            parameter_name: document.getElementById('parameterSelect').value,
            start_value: parseFloat(document.getElementById('startValue').value),
            end_value: parseFloat(document.getElementById('endValue').value),
            steps: parseInt(document.getElementById('steps').value),
            base_request: baseRequest
        };

        const response = await fetch(apiUrl('/api/graph'), {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify(graphRequest)
        });

        if (response.ok) {
            const data = await response.json();
            updateChart(data);
            hideGraphModal();
        } else {
            const error = await response.json();
            showMessage('Graph generation failed: ' + (error.detail || 'Unknown error'), 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Update chart with sweep data
function updateChart(data) {
    const { parameter_values, results, parameter_name } = data;
    
    chart.data.labels = parameter_values;
    chart.data.datasets[0].data = results.map(r => r.output_gain);
    chart.data.datasets[1].data = results.map(r => r.control_parameter);
    chart.data.datasets[2].data = results.map(r => r.processing_factor);
    
    chart.options.plugins.title.text = `Parameter Sweep: ${parameter_name}`;
    chart.options.scales.x.title.text = parameter_name.replace('_', ' ').toUpperCase();
    
    chart.update();
}

// Real-time preview update (debounced)
async function updatePreview() {
    try {
        if (!apiConfigured || !isConnected) {
            return; // Avoid spamming the backend with 400s when not configured
        }
        const data = getFormData();
        const response = await fetch(apiUrl('/api/calculate'), {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            updateSinglePointChart(result);
        }
    } catch (error) {
        console.error('Preview update failed:', error);
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    
    // Add to the first card
    const firstCard = document.querySelector('.card');
    firstCard.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Safely parse a Response as JSON without throwing on non-JSON bodies
async function safeJson(response) {
    try {
        return await response.json();
    } catch (_) {
        return {};
    }
}

// Handle modal clicks outside content
document.addEventListener('click', function(event) {
    const modal = document.getElementById('graphModal');
    if (event.target === modal) {
        hideGraphModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        hideGraphModal();
    }
    
    if (event.ctrlKey && event.key === 'Enter') {
        calculateSingle();
    }
});
