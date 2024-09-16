import "./style.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import "ol/ol.css";
import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style } from "ol/style";
import { Vector as VectorSource } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import { get as getProjection, fromLonLat } from "ol/proj";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import Draw from "ol/interaction/Draw";

// Define the projection for EPSG:32638
proj4.defs("EPSG:32638", "+proj=utm +zone=38 +datum=WGS84 +units=m +no_defs");
register(proj4);

// Define your GeoServer URL and workspace
const geoServerUrl = "http://localhost:8080/geoserver/CreateData/ows";
const workspace = "CreateData";

// Construct the transformed URLs to request data in EPSG:32638
const nakvetiUrl = `${geoServerUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=${workspace}%3ANakveTi&maxFeatures=50&outputFormat=application%2Fjson&srsName=EPSG:32638`;
const shenobaUrl = `${geoServerUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=${workspace}%3ASenoba&maxFeatures=50&outputFormat=application%2Fjson&srsName=EPSG:32638`;
const topoLineUrl = `${geoServerUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=${workspace}%3ATopo_Line&maxFeatures=50&outputFormat=application%2Fjson&srsName=EPSG:32638`;
const topoPointUrl = `${geoServerUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=${workspace}%3ATopo_Point&maxFeatures=50&outputFormat=application%2Fjson&srsName=EPSG:32638`;

// Define styles for each layer
const nakvetiStyle = new Style({
  stroke: new Stroke({
    color: "blue", // Red border
    width: 1.5, // Border width
  }),
});

// Function to create a canvas pattern with parallel lines
function createPattern() {
  const canvas = document.createElement("canvas");
  canvas.width = 8; // Width of one line segment
  canvas.height = 8; // Height of one line segment
  const context = canvas.getContext("2d");

  // Define the pattern
  context.strokeStyle = "#422006"; // Line color (matches your fill color)
  context.lineWidth = 1.5; // Line width

  // Draw parallel lines on the canvas
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(canvas.width, canvas.height);
  context.stroke();

  // Return the pattern as a CanvasPattern object
  return context.createPattern(canvas, "repeat");
}

// Define the shenobaStyle with a pattern fill
const shenobaStyle = new Style({
  stroke: new Stroke({
    color: "black",
    width: 1.5,
  }),
  fill: new Fill({
    color: createPattern(), // Use the custom pattern fill
  }),
});

const topoLineStyle = new Style({
  stroke: new Stroke({
    color: "red", // Blue border for lines
    width: 2, // Border width
  }),
});

const topoPointStyle = new Style({
  image: new Circle({
    radius: 4, // Circle radius for point features
    fill: new Fill({
      color: "rgba(0, 255, 0, 0.7)", // Semi-transparent green fill for points
    }),
    stroke: new Stroke({
      color: "black", // Black outline for the circle
      width: 2, // Width of the circle outline
    }),
  }),
});

// Initialize map layers for each dataset
const nakvetiLayer = new VectorLayer({
  source: new VectorSource({
    url: nakvetiUrl,
    format: new GeoJSON(),
  }),
  style: nakvetiStyle,
});

const shenobaLayer = new VectorLayer({
  source: new VectorSource({
    url: shenobaUrl,
    format: new GeoJSON(),
  }),
  style: shenobaStyle,
});

const topoLineLayer = new VectorLayer({
  source: new VectorSource({
    url: topoLineUrl,
    format: new GeoJSON(),
  }),
  style: topoLineStyle,
});

const topoPointLayer = new VectorLayer({
  source: new VectorSource({
    url: topoPointUrl,
    format: new GeoJSON(),
  }),
  style: topoPointStyle,
});

// Create the OpenLayers map with a proper View
const map = new Map({
  target: "map", // Ensure this matches the ID of your map container in the HTML
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    nakvetiLayer,
    shenobaLayer,
    topoLineLayer,
    topoPointLayer,
  ],
  view: new View({
    center: fromLonLat([45, 42], "EPSG:32638"), // Center of the UTM Zone 38N (you may adjust this)
    zoom: 12, // Initial zoom level
    projection: getProjection("EPSG:32638"), // Set the projection to EPSG:32638
  }),
});

// Function to handle layer visibility toggling
function toggleLayerVisibility(layerId) {
  const layer = map
    .getLayers()
    .getArray()
    .find((l) => l === eval(layerId));
  layer.setVisible(document.getElementById(layerId).checked);
}

// Function to zoom to a layer's extent
function zoomToLayer(layerId) {
  const layer = map
    .getLayers()
    .getArray()
    .find((l) => l === eval(layerId));
  const source = layer.getSource();
  source.once("change", () => {
    if (source.getState() === "ready") {
      map.getView().fit(source.getExtent(), { duration: 1000 });
    }
  });
  if (source.getState() === "ready") {
    map.getView().fit(source.getExtent(), { duration: 1000 });
  }
}

document.querySelectorAll(".draw-pen").forEach((button) => {
  button.addEventListener("click", (event) => {
    const layerId = event.target.getAttribute("data-layer");
    addDrawInteraction(layerId);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  function createLayerControl(layerId, layerName) {
    const layerControlHtml = `
      <div class="layer-control">
        <div>
          <input type="checkbox" id="${layerId}" checked />
          <label for="${layerId}">${layerName}</label>
        </div>
        <div>
          <button class="${layerId}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="7" stroke="black" stroke-width="2" />
              <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="black" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
          <button class="draw-pen" data-layer="${layerId}" title="Draw on ${layerName}">✏️</button>
          <!-- Add an Attributes button -->
          <button class="show-attributes" data-layer="${layerId}" title="Show Attributes of ${layerName}">
            📋 <!-- Unicode character for clipboard icon -->
          </button>
        </div>
      </div>
    `;
    document.getElementById('sidebar').insertAdjacentHTML('beforeend', layerControlHtml);
  }

  // Create layer controls
  createLayerControl('nakvetiLayer', 'Nakveti Layer');
  createLayerControl('shenobaLayer', 'Shenoba Layer');
  createLayerControl('topoLineLayer', 'Topo Line Layer');
  createLayerControl('topoPointLayer', 'Topo Point Layer');

  // Handle the Attributes button click
  document.querySelectorAll('.show-attributes').forEach(button => {
    button.addEventListener('click', (event) => {
      const layerId = event.target.getAttribute('data-layer');
      showLayerAttributes(layerId);
    });
  });

  function showLayerAttributes(layerId) {
    const layer = map.getLayers().getArray().find(l => l === eval(layerId));
    const features = layer.getSource().getFeatures();

    // Check if there are features to display
    if (features.length === 0) {
      alert('No features available for this layer.');
      return;
    }

    // Extract attributes from the features
    const data = features.map(feature => feature.getProperties());
    const fields = Object.keys(data[0]).filter(key => key !== 'geometry').map(key => ({ name: key, type: 'text' }));

    // Configure jsGrid
    $('#attributeGrid').jsGrid({
      width: "100%",
      height: "400px",
      inserting: false,
      editing: false,
      sorting: true,
      paging: true,
      data: data,
      fields: fields
    });

    // Ensure the grid element is present and display it
    const gridContainer = document.getElementById('attributeGridContainer');
    if (gridContainer) {
      gridContainer.style.display = 'block';
    } else {
      console.error('Element with id "attributeGridContainer" not found.');
    }
  }

  // Close button functionality
  document.getElementById('closeGridBtn').addEventListener('click', () => {
    const gridContainer = document.getElementById('attributeGridContainer');
    if (gridContainer) {
      gridContainer.style.display = 'none';
    }
  });

  // Event listeners for draw button
  document.querySelectorAll('.draw-pen').forEach(button => {
    button.addEventListener('click', (event) => {
      const layerId = event.target.getAttribute('data-layer');
      addDrawInteraction(layerId);
    });
  });

  // Other event listeners
  document.getElementById('nakvetiLayer').addEventListener('change', () => toggleLayerVisibility('nakvetiLayer'));
  document.getElementById('shenobaLayer').addEventListener('change', () => toggleLayerVisibility('shenobaLayer'));
  document.getElementById('topoLineLayer').addEventListener('change', () => toggleLayerVisibility('topoLineLayer'));
  document.getElementById('topoPointLayer').addEventListener('change', () => toggleLayerVisibility('topoPointLayer'));

  document.querySelector('.nakvetiLayer').addEventListener('click', () => zoomToLayer('nakvetiLayer'));
  document.querySelector('.shenobaLayer').addEventListener('click', () => zoomToLayer('shenobaLayer'));
  document.querySelector('.topoLineLayer').addEventListener('click', () => zoomToLayer('topoLineLayer'));
  document.querySelector('.topoPointLayer').addEventListener('click', () => zoomToLayer('topoPointLayer'));
});


