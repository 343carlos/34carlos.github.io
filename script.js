// Variables globales para almacenar datos
let plantas = JSON.parse(localStorage.getItem('plantas')) || [];
let inspecciones = JSON.parse(localStorage.getItem('inspecciones')) || [];
let map;
let markers = L.featureGroup(); // Grupo para manejar todos los marcadores

// --- Funcionalidad de Login ---
function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');

    // Credenciales de ejemplo (¡EN UN ENTORNO REAL, ESTO SERÍA EN EL SERVIDOR!)
    const validUsername = 'robert';
    const validPassword = 'password987';

    if (usernameInput === validUsername && passwordInput === validPassword) {
        sessionStorage.setItem('loggedIn', 'true');
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        showTab('dashboard'); // Mostrar el dashboard por defecto al iniciar sesión
    } else {
        loginError.textContent = 'Usuario o contraseña incorrectos.';
        loginError.style.display = 'block';
    }
}

function checkLogin() {
    if (sessionStorage.getItem('loggedIn') === 'true') {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        showTab('dashboard'); // Mostrar el dashboard si ya está logueado
    } else {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'none';
    }
}

document.getElementById('loginForm').addEventListener('submit', handleLogin);

// --- Funcionalidad General de la UI ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    document.querySelectorAll('.nav-tab').forEach(tabButton => {
        tabButton.classList.remove('active');
    });
    document.querySelector(`.nav-tab[onclick="showTab('${tabId}')"]`).classList.add('active');

    // Si se activa el mapa, asegurar que se inicialice y se actualicen los marcadores
    if (tabId === 'mapa') {
        if (!map) {
            initMap();
        }
        // Pequeño retraso para asegurar que el contenedor del mapa sea visible y tenga sus dimensiones correctas.
        setTimeout(() => {
            map.invalidateSize(); // Necesario si el mapa estaba oculto
            updateMapMarkers(); // Asegura que los marcadores se actualicen al mostrar el mapa
        }, 250); // 100 milisegundos de retraso
    } else {
        // Si cambiamos de pestaña y el mapa existe, limpiar marcadores para evitar duplicados al volver
        if (map) {
            markers.clearLayers();
        }
    }
    updateDashboard();
    renderPlantas();
    renderInspecciones();
    updateAlerts();
    renderReportes();
}

function showMessage(type, message) {
    const successDiv = document.getElementById('successMessage');
    const errorDiv = document.getElementById('errorMessage');

    if (type === 'success') {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        setTimeout(() => successDiv.style.display = 'none', 5000);
    } else if (type === 'error') {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    if (modalId === 'plantaModal') {
        document.getElementById('plantaForm').reset();
        document.getElementById('plantaId').value = ''; // Clear ID for new entry
        // Reset select to default option if it exists
        document.getElementById('actividad').value = '';
        document.getElementById('mineralPrincipal').value = '';
        document.getElementById('estado').value = 'Operativa'; // Default state
    } else if (modalId === 'inspeccionModal') {
        document.getElementById('inspeccionForm').reset();
        document.getElementById('inspeccionId').value = ''; // Clear ID for new entry
        populatePlantasSelect('inspeccionPlantaId');
        document.getElementById('estadoInspeccion').value = 'Aprobada'; // Default state
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// --- Funciones para Plantas ---
function savePlanta(event) {
    event.preventDefault();

    const plantaId = document.getElementById('plantaId').value;
    const nombrePlanta = document.getElementById('nombrePlanta').value;
    const representanteLegal = document.getElementById('representanteLegal').value;
    const nit = document.getElementById('nit').value;
    const direccion = document.getElementById('direccion').value;
    const telefono = document.getElementById('telefono').value;
    const latitud = parseFloat(document.getElementById('latitud').value);
    const longitud = parseFloat(document.getElementById('longitud').value);
    const procedencia = document.getElementById('procedencia').value;
    const destino = document.getElementById('destino').value;
    const actividad = document.getElementById('actividad').value;
    const mineralPrincipal = document.getElementById('mineralPrincipal').value;
    const capacidadAutorizada = parseFloat(document.getElementById('capacidadAutorizada').value);
    const capacidadOperada = parseFloat(document.getElementById('capacidadOperada').value) || 0;
    const fechaUltimaInspeccion = document.getElementById('fechaUltimaInspeccion').value;
    const estado = document.getElementById('estado').value;
    const licenciaAmbiental = document.getElementById('licenciaAmbiental').value;
    const licenciadeFuncionamiento = document.getElementById('licenciadeFuncionamiento').value;
    const empadronamientominero = document.getElementById('empadronamientominero').value;
    const observacionesPlanta = document.getElementById('observacionesPlanta').value;

    const newPlanta = {
        id: plantaId || Date.now(), // Use existing ID or generate a new one
        nombrePlanta,
        representanteLegal,
        nit,
        direccion,
        telefono,
        latitud,
        longitud,
        procedencia,
        destino,
        actividad,
        mineralPrincipal,
        capacidadAutorizada,
        capacidadOperada,
        fechaUltimaInspeccion,
        estado,
        licenciaAmbiental,
        licenciadeFuncionamiento,
        empadronamientominero,
        observacionesPlanta
    };

    if (plantaId) {
        // Edit existing planta
        plantas = plantas.map(p => p.id == plantaId ? newPlanta : p);
        showMessage('success', 'Planta actualizada exitosamente.');
    } else {
        // Add new planta
        plantas.push(newPlanta);
        showMessage('success', 'Nueva planta agregada exitosamente.');
    }

    localStorage.setItem('plantas', JSON.stringify(plantas));
    renderPlantas();
    updateDashboard();
    updateMapMarkers(); // Update markers after adding/editing a plant
    closeModal('plantaModal');
}

function renderPlantas() {
    const plantasListDiv = document.getElementById('plantasList');
    plantasListDiv.innerHTML = ''; // Clear previous entries

    if (plantas.length === 0) {
        plantasListDiv.innerHTML = '<p style="text-align: center; color: #777;">No hay plantas registradas aún.</p>';
        return;
    }

    plantas.forEach(planta => {
        const plantaCard = document.createElement('div');
        plantaCard.className = 'planta-card';
        let statusClass = '';
        let statusIcon = '';

        switch (planta.estado) {
            case 'Operativa':
                statusClass = 'status-operativa';
                statusIcon = 'fa-solid fa-circle-check icon-operativa';
                break;
            case 'Suspendida':
                statusClass = 'status-suspendida';
                statusIcon = 'fa-solid fa-circle-xmark icon-suspendida';
                break;
            case 'Sin Actividad':
                statusClass = 'status-sin-actividad';
                statusIcon = 'fa-solid fa-circle icon-sin-actividad';
                break;
            case 'En Observaciones':
                statusClass = 'status-observaciones';
                statusIcon = 'fa-solid fa-triangle-exclamation icon-warning';
                break;
            default:
                statusClass = '';
                statusIcon = '';
        }

        plantaCard.innerHTML = `
            <h3><i class="${statusIcon} plant-icon"></i>${planta.nombrePlanta}</h3>
            <div class="info-row"><span class="info-label">Representante:</span> <span class="info-value">${planta.representanteLegal}</span></div>
            <div class="info-row"><span class="info-label">NIT:</span> <span class="info-value">${planta.nit}</span></div>
            <div class="info-row"><span class="info-label">Dirección:</span> <span class="info-value">${planta.direccion}</span></div>
            <div class="info-row"><span class="info-label">Teléfono:</span> <span class="info-value">${planta.telefono}</span></div>
            <div class="info-row"><span class="info-label">Actividad:</span> <span class="info-value">${planta.actividad}</span></div>
            <div class="info-row"><span class="info-label">Mineral Principal:</span> <span class="info-value">${planta.mineralPrincipal}</span></div>
            <div class="info-row"><span class="info-label">Capacidad Real:</span> <span class="info-value">${planta.capacidadAutorizada} TM/día</span></div>
            <div class="info-row"><span class="info-label">Capacidad Operada:</span> <span class="info-value">${planta.capacidadOperada || 'N/A'} TM/día</span></div>
            <div class="info-row"><span class="info-label">Última Inspección:</span> <span class="info-value">${planta.fechaUltimaInspeccion || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Estado:</span> <span class="status-badge ${statusClass}">${planta.estado}</span></div>
            <div class="info-row"><span class="info-label">Licencia Ambiental:</span> <span class="info-value">${planta.licenciaAmbiental || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Licencia de Funcionamiento:</span> <span class="info-value">${planta.licenciadeFuncionamiento || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Empadronamiento Minero:</span> <span class="info-value">${planta.empadronamientominero || 'N/A'}</span></div>
            <p><strong>Observaciones:</strong> ${planta.observacionesPlanta || 'Ninguna'}</p>
            <button class="btn btn-small btn-info" onclick="editPlanta(${planta.id})">?? Editar</button>
            <button class="btn btn-small btn-danger" onclick="deletePlanta(${planta.id})">??? Eliminar</button>
        `;
        plantasListDiv.appendChild(plantaCard);
    });
}

function editPlanta(id) {
    const planta = plantas.find(p => p.id == id);
    if (planta) {
        document.getElementById('plantaId').value = planta.id;
        document.getElementById('nombrePlanta').value = planta.nombrePlanta;
        document.getElementById('representanteLegal').value = planta.representanteLegal;
        document.getElementById('nit').value = planta.nit;
        document.getElementById('direccion').value = planta.direccion;
        document.getElementById('telefono').value = planta.telefono;
        document.getElementById('latitud').value = planta.latitud;
        document.getElementById('longitud').value = planta.longitud;
        document.getElementById('procedencia').value = planta.procedencia;
        document.getElementById('destino').value = planta.destino;
        document.getElementById('actividad').value = planta.actividad;
        document.getElementById('mineralPrincipal').value = planta.mineralPrincipal;
        document.getElementById('capacidadAutorizada').value = planta.capacidadAutorizada;
        document.getElementById('capacidadOperada').value = planta.capacidadOperada;
        document.getElementById('fechaUltimaInspeccion').value = planta.fechaUltimaInspeccion;
        document.getElementById('estado').value = planta.estado;
        document.getElementById('licenciaAmbiental').value = planta.licenciaAmbiental;
        document.getElementById('licenciadeFuncionamiento').value = planta.licenciadeFuncionamiento;
        document.getElementById('empadronamientominero').value = planta.empadronamientominero;
        document.getElementById('observacionesPlanta').value = planta.observacionesPlanta;
        showModal('plantaModal');
    }
}

function deletePlanta(id) {
    if (confirm('¿Está seguro de que desea eliminar esta planta?')) {
        plantas = plantas.filter(p => p.id != id);
        // Also delete related inspections
        inspecciones = inspecciones.filter(i => i.plantaId != id);
        localStorage.setItem('plantas', JSON.stringify(plantas));
        localStorage.setItem('inspecciones', JSON.stringify(inspecciones)); // Update inspections
        renderPlantas();
        updateDashboard();
        updateMapMarkers();
        renderInspecciones(); // Re-render inspections after deletion
        showMessage('success', 'Planta eliminada exitosamente.');
    }
}

function searchPlantas() {
    const searchTerm = document.getElementById('searchPlantas').value.toLowerCase();
    const filteredPlantas = plantas.filter(planta =>
        planta.nombrePlanta.toLowerCase().includes(searchTerm) ||
        planta.mineralPrincipal.toLowerCase().includes(searchTerm) ||
        planta.estado.toLowerCase().includes(searchTerm)
    );
    renderFilteredPlantas(filteredPlantas);
}

function renderFilteredPlantas(filteredPlantas) {
    const plantasListDiv = document.getElementById('plantasList');
    plantasListDiv.innerHTML = ''; // Clear previous entries

    if (filteredPlantas.length === 0) {
        plantasListDiv.innerHTML = '<p style="text-align: center; color: #777;">No se encontraron plantas que coincidan con su búsqueda.</p>';
        return;
    }

    filteredPlantas.forEach(planta => {
        const plantaCard = document.createElement('div');
        plantaCard.className = 'planta-card';
        let statusClass = '';
        let statusIcon = '';

        switch (planta.estado) {
            case 'Operativa':
                statusClass = 'status-operativa';
                statusIcon = 'fa-solid fa-circle-check icon-operativa';
                break;
            case 'Suspendida':
                statusClass = 'status-suspendida';
                statusIcon = 'fa-solid fa-circle-xmark icon-suspendida';
                break;
            case 'Sin Actividad':
                statusClass = 'status-sin-actividad';
                statusIcon = 'fa-solid fa-circle icon-sin-actividad';
                break;
            case 'En Observaciones':
                statusClass = 'status-observaciones';
                statusIcon = 'fa-solid fa-triangle-exclamation icon-warning';
                break;
            default:
                statusClass = '';
                statusIcon = '';
        }

        plantaCard.innerHTML = `
            <h3><i class="${statusIcon} plant-icon"></i>${planta.nombrePlanta}</h3>
            <div class="info-row"><span class="info-label">Representante:</span> <span class="info-value">${planta.representanteLegal}</span></div>
            <div class="info-row"><span class="info-label">NIT:</span> <span class="info-value">${planta.nit}</span></div>
            <div class="info-row"><span class="info-label">Dirección:</span> <span class="info-value">${planta.direccion}</span></div>
            <div class="info-row"><span class="info-label">Teléfono:</span> <span class="info-value">${planta.telefono}</span></div>
            <div class="info-row"><span class="info-label">Actividad:</span> <span class="info-value">${planta.actividad}</span></div>
            <div class="info-row"><span class="info-label">Mineral Principal:</span> <span class="info-value">${planta.mineralPrincipal}</span></div>
            <div class="info-row"><span class="info-label">Capacidad Real:</span> <span class="info-value">${planta.capacidadAutorizada} TM/día</span></div>
            <div class="info-row"><span class="info-label">Capacidad Operada:</span> <span class="info-value">${planta.capacidadOperada || 'N/A'} TM/día</span></div>
            <div class="info-row"><span class="info-label">Última Inspección:</span> <span class="info-value">${planta.fechaUltimaInspeccion || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Estado:</span> <span class="status-badge ${statusClass}">${planta.estado}</span></div>
            <div class="info-row"><span class="info-label">Licencia Ambiental:</span> <span class="info-value">${planta.licenciaAmbiental || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Licencia de Funcionamiento:</span> <span class="info-value">${planta.licenciadeFuncionamiento || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Empadronamiento Minero:</span> <span class="info-value">${planta.empadronamientominero || 'N/A'}</span></div>
            <p><strong>Observaciones:</strong> ${planta.observacionesPlanta || 'Ninguna'}</p>
            <button class="btn btn-small btn-info" onclick="editPlanta(${planta.id})">?? Editar</button>
            <button class="btn btn-small btn-danger" onclick="deletePlanta(${planta.id})">??? Eliminar</button>
        `;
        plantasListDiv.appendChild(plantaCard);
    });
}

document.getElementById('plantaForm').addEventListener('submit', savePlanta);

// --- Funciones para Inspecciones ---
function populatePlantasSelect(selectId) {
    const selectElement = document.getElementById(selectId);
    selectElement.innerHTML = '<option value="">Seleccione una Planta</option>'; // Clear existing options

    plantas.forEach(planta => {
        const option = document.createElement('option');
        option.value = planta.id;
        option.textContent = planta.nombrePlanta;
        selectElement.appendChild(option);
    });
}

function saveInspeccion(event) {
    event.preventDefault();

    const inspeccionId = document.getElementById('inspeccionId').value;
    const plantaId = document.getElementById('inspeccionPlantaId').value;
    const fecha = document.getElementById('fechaInspeccion').value;
    const inspector = document.getElementById('inspector').value;
    const estado = document.getElementById('estadoInspeccion').value;
    const observaciones = document.getElementById('observacionesInspeccion').value;
    const accionesRecomendadas = document.getElementById('accionesRecomendadas').value;
    const proximaInspeccion = document.getElementById('fechaProximaInspeccion').value;

    const newInspeccion = {
        id: inspeccionId || Date.now(),
        plantaId: parseInt(plantaId),
        fecha,
        inspector,
        estado,
        observaciones,
        accionesRecomendadas,
        proximaInspeccion
    };

    if (inspeccionId) {
        inspecciones = inspecciones.map(i => i.id == inspeccionId ? newInspeccion : i);
        showMessage('success', 'Inspección actualizada exitosamente.');
    } else {
        inspecciones.push(newInspeccion);
        showMessage('success', 'Nueva inspección registrada exitosamente.');
    }

    localStorage.setItem('inspecciones', JSON.stringify(inspecciones));
    renderInspecciones();
    updateDashboard();
    closeModal('inspeccionModal');
}

function renderInspecciones() {
    const inspeccionesBody = document.getElementById('inspeccionesBody');
    inspeccionesBody.innerHTML = '';

    if (inspecciones.length === 0) {
        // inspeccionesBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #777;">No hay inspecciones registradas aún.</td></tr>';
        return;
    }

    inspecciones.forEach(inspeccion => {
        const planta = plantas.find(p => p.id === inspeccion.plantaId);
        const plantaNombre = planta ? planta.nombrePlanta : 'Desconocida';

        const row = inspeccionesBody.insertRow();
        row.innerHTML = `
            <td>${inspeccion.fecha}</td>
            <td>${plantaNombre}</td>
            <td>${inspeccion.inspector}</td>
            <td>${inspeccion.estado}</td>
            <td>${inspeccion.observaciones || 'N/A'}</td>
            <td>
                <button class="btn btn-small btn-info" onclick="editInspeccion(${inspeccion.id})">??</button>
                <button class="btn btn-small btn-danger" onclick="deleteInspeccion(${inspeccion.id})">???</button>
            </td>
        `;
    });
}

function editInspeccion(id) {
    const inspeccion = inspecciones.find(i => i.id == id);
    if (inspeccion) {
        document.getElementById('inspeccionId').value = inspeccion.id;
        populatePlantasSelect('inspeccionPlantaId'); // Repopulate to ensure correct selection
        document.getElementById('inspeccionPlantaId').value = inspeccion.plantaId;
        document.getElementById('fechaInspeccion').value = inspeccion.fecha;
        document.getElementById('inspector').value = inspeccion.inspector;
        document.getElementById('estadoInspeccion').value = inspeccion.estado;
        document.getElementById('observacionesInspeccion').value = inspeccion.observaciones;
        document.getElementById('accionesRecomendadas').value = inspeccion.accionesRecomendadas;
        document.getElementById('fechaProximaInspeccion').value = inspeccion.proximaInspeccion;
        showModal('inspeccionModal');
    }
}

function deleteInspeccion(id) {
    if (confirm('¿Está seguro de que desea eliminar esta inspección?')) {
        inspecciones = inspecciones.filter(i => i.id != id);
        localStorage.setItem('inspecciones', JSON.stringify(inspecciones));
        renderInspecciones();
        updateDashboard();
        showMessage('success', 'Inspección eliminada exitosamente.');
    }
}

document.getElementById('inspeccionForm').addEventListener('submit', saveInspeccion);

// --- Funcionalidad del Mapa GIS (Leaflet) ---
function initMap() {
    map = L.map('map').setView([-19.5833, -65.75], 13); // Potosí coordinates

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    markers.addTo(map); // Add the feature group to the map
}

function updateMapMarkers() {
    markers.clearLayers(); // Clear existing markers

    plantas.forEach(planta => {
        if (planta.latitud && planta.longitud) {
            let markerColor = 'blue'; // Default color
            let iconHtml = '<i class="fa-solid fa-industry"></i>'; // Default icon

            switch (planta.estado) {
                case 'Operativa':
                    markerColor = 'green';
                    iconHtml = '<i class="fa-solid fa-industry" style="color: #27ae60;"></i>'; // Green for operativa
                    break;
                case 'Suspendida':
                    markerColor = 'red';
                    iconHtml = '<i class="fa-solid fa-industry" style="color: #e74c3c;"></i>'; // Red for suspendida
                    break;
                case 'Sin Actividad':
                    markerColor = 'gray';
                    iconHtml = '<i class="fa-solid fa-industry" style="color: #95a5a6;"></i>'; // Gray for sin actividad
                    break;
                case 'En Observaciones':
                    markerColor = 'orange';
                    iconHtml = '<i class="fa-solid fa-industry" style="color: #f39c12;"></i>'; // Orange for observaciones
                    break;
            }

            const customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: iconHtml,
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });

            const marker = L.marker([planta.latitud, planta.longitud], { icon: customIcon }).addTo(markers)
                .bindPopup(`<b>${planta.nombrePlanta}</b><br>Estado: ${planta.estado}<br>Mineral: ${planta.mineralPrincipal}`);
        }
    });
}

// --- Funcionalidad del Dashboard ---
function updateDashboard() {
    document.getElementById('totalPlantas').textContent = plantas.length;

    const operativas = plantas.filter(p => p.estado === 'Operativa').length;
    document.getElementById('plantasOperativas').textContent = operativas;

    const suspendidas = plantas.filter(p => p.estado === 'Suspendida').length;
    document.getElementById('plantasSuspendidas').textContent = suspendidas;

    const sinActividad = plantas.filter(p => p.estado === 'Sin Actividad').length;
    document.getElementById('plantasSinActividad').textContent = sinActividad;

    const now = new Date();
    let expiredDocsCount = 0;
    // Assuming each planta has a license expiration date to check (example: 'licenciaAmbiental' or another date field)
    // For simplicity, let's assume 'fechaUltimaInspeccion' can also imply a document status
    plantas.forEach(planta => {
        // This part would need actual document expiration dates to be accurate.
        // For demonstration, let's just count plants with no recent inspection (older than 1 year) as 'docs vencidos' conceptually.
        if (planta.fechaUltimaInspeccion) {
            const lastInspectionDate = new Date(planta.fechaUltimaInspeccion);
            const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
            if (lastInspectionDate < oneYearAgo) {
                expiredDocsCount++;
            }
        }
    });
    document.getElementById('documentosVencidos').textContent = expiredDocsCount;

    // Pending Inspections (Next inspection date passed or not set for long)
    const pendingInspections = inspecciones.filter(i => {
        if (i.proximaInspeccion) {
            return new Date(i.proximaInspeccion) < now;
        }
        return false; // If no next inspection date, it's not pending by this logic
    });

    const pendingList = document.getElementById('pendingInspectionsList');
    pendingList.innerHTML = '';
    if (pendingInspections.length > 0) {
        pendingInspections.forEach(insp => {
            const planta = plantas.find(p => p.id === insp.plantaId);
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-clock"></i> Inspección de <strong>${planta ? planta.nombrePlanta : 'Desconocida'}</strong> vencida el ${insp.proximaInspeccion}`;
            pendingList.appendChild(li);
        });
    } else {
        pendingList.innerHTML = '<li><i class="fa-solid fa-check-double"></i> No hay inspecciones pendientes.</li>';
    }

    document.getElementById('inspeccionesPendientes').textContent = `${pendingInspections.length} plantas requieren inspección`;

    // Dummy logic for 'documentos por vencer' and 'cumplimiento'
    document.getElementById('documentosPorVencer').textContent = `${Math.floor(plantas.length * 0.15)} documentos vencen en 30 días`;
    const compliancePercentage = plantas.length > 0 ? ((operativas / plantas.length) * 100).toFixed(1) : 0;
    document.getElementById('cumplimiento').textContent = `${compliancePercentage}% plantas en regla`;
}

// --- Funcionalidad de Alertas ---
function updateAlerts() {
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(now.getMonth() + 1);

    const documentosVencidosLista = document.getElementById('documentosVencidosLista');
    documentosVencidosLista.innerHTML = '';
    const proximosVencimientos = document.getElementById('proximosVencimientos');
    proximosVencimientos.innerHTML = '';
    const inspeccionesAtrasadas = document.getElementById('inspeccionesAtrasadas');
    inspeccionesAtrasadas.innerHTML = '';

    let hasExpiredDocs = false;
    let hasUpcomingDocs = false;
    let hasOverdueInspections = false;

    plantas.forEach(planta => {
        // Simulate document expiration check (replace with actual document fields)
        if (planta.licenciaAmbiental && new Date(planta.licenciaAmbiental) < now) {
            documentosVencidosLista.innerHTML += `<p><strong>${planta.nombrePlanta}</strong>: Licencia Ambiental vencida el ${planta.licenciaAmbiental}</p>`;
            hasExpiredDocs = true;
        }
        if (planta.licenciadeFuncionamiento && new Date(planta.licenciadeFuncionamiento) < now) {
            documentosVencidosLista.innerHTML += `<p><strong>${planta.nombrePlanta}</strong>: Licencia de Funcionamiento vencida el ${planta.licenciadeFuncionamiento}</p>`;
            hasExpiredDocs = true;
        }
        // Upcoming expirations (within next 30 days)
        if (planta.licenciaAmbiental && new Date(planta.licenciaAmbiental) > now && new Date(planta.licenciaAmbiental) < oneMonthFromNow) {
            proximosVencimientos.innerHTML += `<p><strong>${planta.nombrePlanta}</strong>: Licencia Ambiental vence el ${planta.licenciaAmbiental}</p>`;
            hasUpcomingDocs = true;
        }
        if (planta.licenciadeFuncionamiento && new Date(planta.licenciadeFuncionamiento) > now && new Date(planta.licenciadeFuncionamiento) < oneMonthFromNow) {
            proximosVencimientos.innerHTML += `<p><strong>${planta.nombrePlanta}</strong>: Licencia de Funcionamiento vence el ${planta.licenciadeFuncionamiento}</p>`;
            hasUpcomingDocs = true;
        }
    });

    if (!hasExpiredDocs) {
        documentosVencidosLista.innerHTML = '<p>No hay documentos vencidos.</p>';
    }
    if (!hasUpcomingDocs) {
        proximosVencimientos.innerHTML = '<p>No hay próximos vencimientos de documentos.</p>';
    }

    // Overdue inspections
    const overdueInspections = inspecciones.filter(i => i.proximaInspeccion && new Date(i.proximaInspeccion) < now);
    if (overdueInspections.length > 0) {
        overdueInspections.forEach(insp => {
            const planta = plantas.find(p => p.id === insp.plantaId);
            inspeccionesAtrasadas.innerHTML += `<p><strong>${planta ? planta.nombrePlanta : 'Desconocida'}</strong>: Inspección atrasada desde ${insp.proximaInspeccion}</p>`;
            hasOverdueInspections = true;
        });
    } else {
        inspeccionesAtrasadas.innerHTML = '<p>No hay inspecciones atrasadas.</p>';
    }
}

// --- Funcionalidad de Reportes y Exportación ---
function renderReportes() {
    // Pending Inspections for Reportes Tab
    const reportPendingList = document.getElementById('reportPendingList');
    reportPendingList.innerHTML = '';
    const now = new Date();
    const pendingInspectionsReport = inspecciones.filter(i => {
        if (i.proximaInspeccion) {
            return new Date(i.proximaInspeccion) < now;
        }
        return false;
    });

    if (pendingInspectionsReport.length > 0) {
        pendingInspectionsReport.forEach(insp => {
            const planta = plantas.find(p => p.id === insp.plantaId);
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-clock"></i> <strong>${planta ? planta.nombrePlanta : 'Desconocida'}</strong>: Próxima inspección vencida el ${insp.proximaInspeccion}`;
            reportPendingList.appendChild(li);
        });
    } else {
        reportPendingList.innerHTML = '<li><i class="fa-solid fa-check-double"></i> No hay plantas con inspecciones pendientes.</li>';
    }

    // Capacidades por Mineral Table
    const capacidadesBody = document.getElementById('capacidadesBody');
    capacidadesBody.innerHTML = '';
    const mineralCapacities = {}; // {mineral: {totalPlantas: X, totalReal: Y, totalOperada: Z}}

    plantas.forEach(planta => {
        if (planta.mineralPrincipal) {
            if (!mineralCapacities[planta.mineralPrincipal]) {
                mineralCapacities[planta.mineralPrincipal] = {
                    plantasCount: 0,
                    capacidadReal: 0,
                    capacidadOperada: 0
                };
            }
            mineralCapacities[planta.mineralPrincipal].plantasCount++;
            mineralCapacities[planta.mineralPrincipal].capacidadReal += planta.capacidadAutorizada;
            mineralCapacities[planta.mineralPrincipal].capacidadOperada += (planta.capacidadOperada || 0);
        }
    });

    for (const mineral in mineralCapacities) {
        const data = mineralCapacities[mineral];
        const utilization = data.capacidadReal > 0 ? ((data.capacidadOperada / data.capacidadReal) * 100).toFixed(2) : 0;
        const row = capacidadesBody.insertRow();
        row.innerHTML = `
            <td>${mineral}</td>
            <td>${data.plantasCount}</td>
            <td>${data.capacidadReal.toFixed(2)}</td>
            <td>${data.capacidadOperada.toFixed(2)}</td>
            <td>${utilization}%</td>
        `;
    }
}

// Export functions (Excel and PDF) using external libraries
function exportToExcel(dataType) {
    let data = [];
    let filename = '';
    let ws_name = '';

    if (dataType === 'plantas') {
        data = plantas.map(p => ({
            "Nombre/Razón Social": p.nombrePlanta,
            "Representante Legal": p.representanteLegal,
            "NIT": p.nit,
            "Dirección": p.direccion,
            "Teléfono": p.telefono,
            "Latitud": p.latitud,
            "Longitud": p.longitud,
            "Procedencia Mineral": p.procedencia,
            "Destino Mineral": p.destino,
            "Actividad": p.actividad,
            "Mineral Principal": p.mineralPrincipal,
            "Capacidad Real (TM/día)": p.capacidadAutorizada,
            "Capacidad Operada (TM/día)": p.capacidadOperada,
            "Fecha Última Inspección": p.fechaUltimaInspeccion,
            "Estado": p.estado,
            "Licencia Ambiental": p.licenciaAmbiental,
            "Licencia de Funcionamiento": p.licenciadeFuncionamiento,
            "Empadronamiento Minero": p.empadronamientominero,
            "Observaciones": p.observacionesPlanta
        }));
        filename = 'reporte_plantas.xlsx';
        ws_name = 'Plantas';
    } else if (dataType === 'inspecciones') {
        data = inspecciones.map(i => {
            const planta = plantas.find(p => p.id === i.plantaId);
            const plantaNombre = planta ? planta.nombrePlanta : 'Desconocida';
            return {
                "Fecha Inspección": i.fecha,
                "Planta": plantaNombre,
                "Inspector": i.inspector,
                "Estado": i.estado,
                "Observaciones": i.observaciones,
                "Acciones Recomendadas": i.accionesRecomendadas,
                "Próxima Inspección": i.proximaInspeccion || 'N/A'
            };
        });
        filename = 'reporte_inspecciones.xlsx';
        ws_name = 'Inspecciones';
    }

    if (data.length === 0) {
        showMessage('error', `No hay datos para exportar en ${dataType}.`);
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, filename);
    showMessage('success', `${dataType} exportado a Excel.`);
}

function exportToPDF(dataType) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let title = '';
    let headers = [];
    let tableData = [];
    let yPos = 20;
    const margin = 10;

    doc.setFontSize(18);
    doc.text("Sistema de Fiscalización de Plantas Metalúrgicas Mineras", doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    yPos += 15;
    doc.setFontSize(12);
    doc.text("Gobierno Autónomo Departamental de Potosí", doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    yPos += 20;

    if (dataType === 'plantas') {
        title = "Reporte de Plantas Metalúrgicas";
        headers = [['Nombre', 'NIT', 'Estado', 'Mineral', 'Cap. Real (TM/día)', 'Última Insp.']];
        tableData = plantas.map(p => [
            p.nombrePlanta,
            p.nit,
            p.estado,
            p.mineralPrincipal,
            p.capacidadAutorizada,
            p.fechaUltimaInspeccion || 'N/A'
        ]);
        doc.text(title, margin, yPos);
        yPos += 10;
        doc.autoTable({
            startY: yPos,
            head: headers,
            body: tableData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 10, cellPadding: 5 },
            headStyles: { fillColor: [37, 141, 25] } // Green color
        });
        doc.save('reporte_plantas.pdf');
    } else if (dataType === 'inspecciones') {
        title = "Reporte de Inspecciones";
        headers = [['Fecha', 'Planta', 'Inspector', 'Estado', 'Próxima Inspección']];
        tableData = inspecciones.map(i => {
            const planta = plantas.find(p => p.id === i.plantaId);
            const plantaNombre = planta ? planta.nombrePlanta : 'Desconocida';
            return [i.fecha, plantaNombre, i.inspector, i.estado, i.proximaInspeccion || 'N/A'];
        });
        doc.text(title, margin, yPos);
        yPos += 10;
        doc.autoTable({
            startY: yPos,
            head: headers,
            body: tableData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 10, cellPadding: 5 },
            headStyles: { fillColor: [37, 141, 25] } // Green color
        });
        doc.save('reporte_inspecciones.pdf');
    }
    showMessage('success', `${dataType} exportado a PDF.`);
}

function downloadTemplate() {
    const templateData = [{
        "Nombre/Razón Social": "",
        "Representante Legal": "",
        "NIT": "",
        "Dirección": "",
        "Teléfono": "",
        "Latitud": "",
        "Longitud": "",
        "Procedencia Mineral": "",
        "Destino Mineral": "",
        "Actividad": "Concentración/Fundición/Refinación/Lixiviación",
        "Mineral Principal": "Ag Pb Zn/Sn/Cu/W/Au",
        "Capacidad Real (TM/día)": "",
        "Capacidad Operada (TM/día)": "",
        "Fecha Última Inspección": "YYYY-MM-DD",
        "Estado": "Operativa/Suspendida/Sin Actividad/En Observaciones",
        "Licencia Ambiental": "",
        "Licencia de Funcionamiento": "",
        "Empadronamiento Minero": "",
        "Observaciones": ""
    }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Plantas");
    XLSX.writeFile(wb, "plantilla_carga_plantas.xlsx");
    showMessage('success', 'Plantilla Excel descargada.');
}

function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const importedCount = json.length;
        if (importedCount === 0) {
            showMessage('error', 'No se encontraron datos en el archivo Excel.');
            return;
        }

        // Map imported data to existing planta structure
        const newPlantas = json.map(row => ({
            id: Date.now() + Math.random(), // Generate unique ID
            nombrePlanta: row["Nombre/Razón Social"] || "N/A",
            representanteLegal: row["Representante Legal"] || "N/A",
            nit: row["NIT"] || "N/A",
            direccion: row["Dirección"] || "N/A",
            telefono: row["Teléfono"] || "N/A",
            latitud: parseFloat(row["Latitud"]) || 0,
            longitud: parseFloat(row["Longitud"]) || 0,
            procedencia: row["Procedencia Mineral"] || "N/A",
            destino: row["Destino Mineral"] || "N/A",
            actividad: row["Actividad"] || "N/A",
            mineralPrincipal: row["Mineral Principal"] || "N/A",
            capacidadAutorizada: parseFloat(row["Capacidad Real (TM/día)"]) || 0,
            capacidadOperada: parseFloat(row["Capacidad Operada (TM/día)"]) || 0,
            fechaUltimaInspeccion: row["Fecha Última Inspección"] || "",
            estado: row["Estado"] || "Sin Actividad",
            licenciaAmbiental: row["Licencia Ambiental"] || "N/A",
            licenciadeFuncionamiento: row["Licencia de Funcionamiento"] || "N/A",
            empadronamientominero: row["Empadronamiento Minero"] || "N/A",
            observacionesPlanta: row["Observaciones"] || "Ninguna"
        }));

        plantas = plantas.concat(newPlantas);
        localStorage.setItem('plantas', JSON.stringify(plantas));
        renderPlantas();
        updateDashboard();
        updateMapMarkers();
        showMessage('success', `${importedCount} plantas importadas exitosamente desde Excel.`);
    };
    reader.readAsArrayBuffer(file);
}

function exportPendingInspections() {
    const now = new Date();
    const pending = inspecciones.filter(i => i.proximaInspeccion && new Date(i.proximaInspeccion) < now);

    if (pending.length === 0) {
        showMessage('error', 'No hay inspecciones pendientes para exportar.');
        return;
    }

    const data = pending.map(i => {
        const planta = plantas.find(p => p.id === i.plantaId);
        const plantaName = planta ? planta.nombrePlanta : 'Desconocida';
        return {
            "Planta": plantaName,
            "Fecha Última Inspección": i.fecha,
            "Inspector": i.inspector,
            "Estado Inspección": i.estado,
            "Observaciones": i.observaciones,
            "Próxima Inspección Vencida": i.proximaInspeccion
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inspecciones_Pendientes");
    XLSX.writeFile(wb, "inspecciones_pendientes.xlsx");
    showMessage('success', 'Inspecciones pendientes exportadas a Excel.');
}

function exportExpiredDocuments() {
    const now = new Date();
    let expiredDocs = [];

    plantas.forEach(planta => {
        if (planta.licenciaAmbiental && new Date(planta.licenciaAmbiental) < now) {
            expiredDocs.push({
                "Planta": planta.nombrePlanta,
                "Tipo Documento": "Licencia Ambiental",
                "Fecha Vencimiento": planta.licenciaAmbiental,
                "Estado Planta": planta.estado
            });
        }
        if (planta.licenciadeFuncionamiento && new Date(planta.licenciadeFuncionamiento) < now) {
            expiredDocs.push({
                "Planta": planta.nombrePlanta,
                "Tipo Documento": "Licencia de Funcionamiento",
                "Fecha Vencimiento": planta.licenciadeFuncionamiento,
                "Estado Planta": planta.estado
            });
        }
        // Add other document types here as needed
    });

    if (expiredDocs.length === 0) {
        showMessage('error', 'No hay documentos vencidos para exportar.');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(expiredDocs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Documentos_Vencidos");
    XLSX.writeFile(wb, "documentos_vencidos.xlsx");
    showMessage('success', 'Documentos vencidos exportados a Excel.');
}

function exportPlantStatus() {
    const data = plantas.map(p => ({
        "Nombre Planta": p.nombrePlanta,
        "Estado": p.estado,
        "Mineral Principal": p.mineralPrincipal,
        "Capacidad Real (TM/día)": p.capacidadAutorizada,
        "Capacidad Operada (TM/día)": p.capacidadOperada || 'N/A',
        "Última Inspección": p.fechaUltimaInspeccion || 'N/A'
    }));

    if (data.length === 0) {
        showMessage('error', 'No hay datos de estado de plantas para exportar.');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estado_Plantas");
    XLSX.writeFile(wb, "estado_plantas.xlsx");
    showMessage('success', 'Estado de plantas exportado a Excel.');
}

function exportFullReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPos = 20;
    const margin = 10;

    doc.setFontSize(18);
    doc.text("Reporte Completo del Sistema de Fiscalización", doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    yPos += 15;
    doc.setFontSize(12);
    doc.text("Gobierno Autónomo Departamental de Potosí", doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    yPos += 20;

    // Sección de Resumen General
    doc.setFontSize(14);
    doc.text("Resumen General:", margin, yPos);
    yPos += 10;

    const totalPlantas = plantas.length;
    const operativas = plantas.filter(p => p.estado === 'Operativa').length;
    const suspendidas = plantas.filter(p => p.estado === 'Suspendida').length;
    const sinActividad = plantas.filter(p => p.estado === 'Sin Actividad').length;
    const enObservaciones = plantas.filter(p => p.estado === 'En Observaciones').length;

    const resumenData = [
        ['Total Plantas:', totalPlantas],
        ['Plantas Operativas:', operativas],
        ['Plantas Suspendidas:', suspendidas],
        ['Plantas Sin Actividad:', sinActividad],
        ['Plantas en Observaciones:', enObservaciones]
    ];

    doc.autoTable({
        startY: yPos,
        body: resumenData,
        theme: 'plain',
        margin: { left: margin, right: margin },
        styles: { fontSize: 11, cellPadding: 3, fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold' } },
        didDrawPage: function(data) {
            yPos = data.cursor.y + 20;
        }
    });

    // Sección de Plantas
    doc.setFontSize(14);
    doc.text("Detalle de Plantas:", margin, yPos);
    yPos += 20;

    const plantasTableData = plantas.map(p => [
        p.nombrePlanta,
        p.nit,
        p.estado,
        p.mineralPrincipal,
        `${p.capacidadAutorizada} TM/día`
    ]);
    const plantasHeaders = [['Nombre', 'NIT', 'Estado', 'Mineral', 'Capacidad Real']];

    doc.autoTable({
        startY: yPos,
        head: plantasHeaders,
        body: plantasTableData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [37, 141, 25] }, // Green color
        didDrawPage: function(data) {
            yPos = data.cursor.y + 20;
        }
    });

    // Sección de Inspecciones
    doc.setFontSize(14);
    doc.text("Detalle de Inspecciones:", margin, yPos);
    yPos += 20;

    const inspeccionesTableData = inspecciones.map(i => {
        const planta = plantas.find(p => p.id === i.plantaId);
        const plantaNombre = planta ? planta.nombrePlanta : 'Desconocida';
        return [i.fecha, plantaNombre, i.inspector, i.estado, i.proximaInspeccion || 'N/A'];
    });
    const inspeccionesHeaders = [['Fecha', 'Planta', 'Inspector', 'Estado', 'Próxima Inspección']];

    doc.autoTable({
        startY: yPos,
        head: inspeccionesHeaders,
        body: inspeccionesTableData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [37, 141, 25] }, // Green color
        didDrawPage: function(data) {
            yPos = data.cursor.y + 20;
        }
    });

    doc.save('reporte_completo.pdf');
    showMessage('success', 'Reporte completo exportado a PDF.');
}


// --- Inicialización al cargar la página ---
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    renderPlantas();
    renderInspecciones();
    updateDashboard();
    updateAlerts();
    renderReportes();
});