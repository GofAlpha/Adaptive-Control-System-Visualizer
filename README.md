# Adaptive Control System Visualizer

A beautiful web application for interactive parameter exploration and real-time graphing of adaptive control systems. Built with FastAPI backend and modern HTML/JavaScript frontend with Chart.js integration.

## Features

- 🎛️ **Interactive Parameter Controls** - Adjust all control parameters with real-time validation
- 📊 **Real-time Graphing** - Visualize system responses with Chart.js
- 🔄 **Parameter Sweep** - Generate graphs by varying any parameter across a range
- 🔌 **RapidAPI Integration** - Connect to the real Adaptive Control System API
- 🎨 **Modern UI** - Beautiful, responsive design with gradient backgrounds
- 📱 **Mobile Friendly** - Works on desktop, tablet, and mobile devices
// Removed: demo mode no longer available. Real API credentials are required.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python main.py
```

The application will start on `http://localhost:8000`

### 3. Configure API (Required)

Enter valid RapidAPI credentials in the configuration section at the top of the UI. Requests are blocked until all three are provided:

- Endpoint URL (FULL path to the upstream endpoint you want to call, e.g., `https://your-rapidapi-service.example.com/v1/calculate` or `.../calculate/batch`)
- RapidAPI Key
- RapidAPI Host header (e.g., `your-rapidapi-service.example.com`)

## Usage

### Single Calculations

1. Adjust parameters in the control panel
2. Click "Calculate" to get results
3. View results in the grid and single-point chart

### Parameter Sweep Graphs

1. Click "Generate Graph" 
2. Select which parameter to vary
3. Set start/end values and number of steps
4. Generate beautiful sweep graphs

### Real-time Preview

- Parameters update the preview chart automatically as you type
- 500ms debounce prevents excessive API calls
- Preview is disabled until valid credentials are provided

## API Configuration

This app requires per-request RapidAPI credentials. Nothing is persisted on the server.

To connect to the real Adaptive Control System API for your session:

1. Get your RapidAPI credentials
2. Enter them in the configuration section:
   - **Endpoint URL**: Full URL to the endpoint (e.g., `/calculate` or `/calculate/batch`)
   - **API Key**: Your RapidAPI key
   - **API Host**: Your RapidAPI host header
3. Click "Save Configuration" to validate inputs and update the status indicator. This does not persist anything; it only affects requests from your browser during this session.

Under the hood, the frontend sends your credentials as headers with each request:

- `X-RapidAPI-Base-Url` (now expected to be the full endpoint URL; the server does not append any path)
- `X-RapidAPI-Key`
- `X-RapidAPI-Host`

If any of the three are missing, the backend now rejects requests with HTTP 400. No demo/mock fallback exists.

## Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| Current H | 0.1 - 100.0 | Current input value |
| Previous H | 0.1 - 100.0 | Previous input value (optional) |
| Beta 0 | 0.1 - 5.0 | Base sensitivity parameter |
| Lambda Factor | 0.1 - 3.0 | Scaling factor |
| Alpha Param | 0.1 - 10.0 | Primary system coefficient |
| Gamma Param | 0.1 - 5.0 | Secondary system coefficient |
| Epsilon | 1e-12 - 1e-6 | Stability constant |

## Keyboard Shortcuts

- `Ctrl + Enter` - Calculate single point
- `Escape` - Close modal dialogs

## API Endpoints

The backend provides these endpoints:

- `GET /` - Serve the main application
- `POST /api/calculate` - Single calculation
- `POST /api/graph` - Parameter sweep data
- `POST /api/config` - Save API configuration
- `GET /api/config` - Get API configuration
- `GET /health` - Health check

## File Structure

```
APItest/
├── main.py              # FastAPI backend server
├── requirements.txt     # Python dependencies
├── README.md           # This file
└── static/
    ├── index.html      # Main HTML frontend
    └── app.js          # JavaScript application logic
```

## Technology Stack

- **Backend**: FastAPI, Pydantic, Uvicorn
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charting**: Chart.js
- **Styling**: Custom CSS with gradients and animations
- **Icons**: Font Awesome

## Development

### Adding New Parameters

1. Update the `ControlRequest` model in `main.py`
2. Add form fields in `index.html`
3. Update `getFormData()` function in `app.js`
4. Add parameter bounds in `updateParameterBounds()`

### Customizing Charts

Modify the Chart.js configuration in the `initializeChart()` function in `app.js`.

### Styling

All styles are in the `<style>` section of `static/index.html`. The design uses:
- CSS Grid for responsive layouts
- CSS Gradients for modern appearance
- CSS Transitions for smooth interactions

## Error Handling

- Input validation with helpful error messages
- If upstream API errors, server returns 502 with details
- User-friendly error notifications in the UI
- Basic logging

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This project is designed for integration with RapidAPI marketplace. Please ensure compliance with RapidAPI terms of service and any applicable licensing requirements.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify API configuration
3. Check network connectivity

---

**Version**: 1.0.0  
**Last Updated**: September 2025
