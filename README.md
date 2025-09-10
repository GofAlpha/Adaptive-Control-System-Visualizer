# Adaptive Control System Visualizer

A beautiful web application for interactive parameter exploration and real-time graphing of adaptive control systems. Built with FastAPI backend and modern HTML/JavaScript frontend with Chart.js integration.

## Features

- 🎛️ **Interactive Parameter Controls** - Adjust all control parameters with real-time validation
- 📊 **Real-time Graphing** - Visualize system responses with Chart.js
- 🔄 **Parameter Sweep** - Generate graphs by varying any parameter across a range
- 🔌 **RapidAPI Integration** - Connect to the real Adaptive Control System API
- 🎨 **Modern UI** - Beautiful, responsive design with gradient backgrounds
- 📱 **Mobile Friendly** - Works on desktop, tablet, and mobile devices
- 🔧 **Demo Mode** - Works with mock data when API is not configured

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

### 3. Configure API (Optional)

- Enter your RapidAPI credentials in the configuration section
- Without API configuration, the app runs in demo mode with mock data

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

## API Configuration

This app now uses per-request RapidAPI credentials. Nothing is stored on the server or in the browser.

To connect to the real Adaptive Control System API for your session only:

1. Get your RapidAPI credentials
2. Enter them in the configuration section:
   - **Base URL**: Your RapidAPI host URL
   - **API Key**: Your RapidAPI key
   - **API Host**: Your RapidAPI host header
3. Click "Save Configuration" to validate inputs and update the status indicator. This does not persist anything; it just affects requests sent from your browser.

Under the hood, the frontend sends your credentials as headers with each request:

- `X-RapidAPI-Base-Url`
- `X-RapidAPI-Key`
- `X-RapidAPI-Host`

If any of the three are missing, the backend falls back to demo mode with mock data.

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

All styles are in the `<style>` section of `index.html`. The design uses:
- CSS Grid for responsive layouts
- CSS Gradients for modern appearance
- CSS Transitions for smooth interactions

## Error Handling

- Input validation with helpful error messages
- Graceful fallback to demo mode if API fails
- User-friendly error notifications
- Comprehensive logging

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
3. Test with demo mode first
4. Check network connectivity

---

**Version**: 1.0.0  
**Last Updated**: September 2025
