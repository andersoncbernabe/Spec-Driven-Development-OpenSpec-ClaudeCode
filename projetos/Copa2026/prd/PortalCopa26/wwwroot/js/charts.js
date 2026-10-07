const _charts = new Map();

export function renderChart(canvasId, config) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const instance = new window.Chart(canvas, config);
    _charts.set(canvasId, instance);
}

export function destroyChart(canvasId) {
    const instance = _charts.get(canvasId);
    if (instance) {
        instance.destroy();
        _charts.delete(canvasId);
    }
}
