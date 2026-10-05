import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CELL_ORGANELLES, Organelle } from '../data/cellData';
import { soundManager } from '../utils/audio';
import { 
  Camera, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Eye, 
  Sliders, 
  Sparkles, 
  Layers, 
  Info, 
  RefreshCw,
  Video,
  VideoOff
} from 'lucide-react';

interface CellARViewerProps {
  cellType: 'plant' | 'animal';
  selectedOrganelle: Organelle | null;
  highlightOrganelleId?: string | null;
  onSelectOrganelle: (organelle: Organelle | null) => void;
  onCaptureSnapshot?: (dataUrl: string) => void;
  enableCutaway?: boolean;
}

export const CellARViewer: React.FC<CellARViewerProps> = ({
  cellType,
  selectedOrganelle,
  highlightOrganelleId,
  onSelectOrganelle,
  onCaptureSnapshot,
  enableCutaway = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // AR & Camera State
  const [arMode, setArMode] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [cutawaySlice, setCutawaySlice] = useState<number>(enableCutaway ? 0.5 : 0.0);
  const [hoveredOrganelle, setHoveredOrganelle] = useState<Organelle | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [organelleTags, setOrganelleTags] = useState<{ organelle: Organelle; x: number; y: number; visible: boolean }[]>([]);
  const [showAllLabels, setShowAllLabels] = useState<boolean>(true);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cellGroupRef = useRef<THREE.Group | null>(null);
  const organelleMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const clipPlanesRef = useRef<THREE.Plane[]>([]);
  const particleSystemsRef = useRef<{ update: (delta: number) => void }[]>([]);

  // Drag & interaction state
  const isDraggingRef = useRef<boolean>(false);
  const prevPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.2, y: 0 });
  const zoomLevelRef = useRef<number>(1.0);

  // Initialize and handle WebCam for AR mode
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (arMode) {
      setCameraError(null);
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setCameraError('Camera access unavailable or declined. Running in Bio-Lab 3D mode.');
          setArMode(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [arMode, facingMode]);

  // Set up Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    // Clipping plane for cross-section / dissection
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 5);
    clipPlanesRef.current = [clipPlane];

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8);
    dirLight2.position.set(-6, -4, -4);
    scene.add(dirLight2);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.6);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    // Root Cell Group
    const cellGroup = new THREE.Group();
    cellGroup.rotation.x = 0.2;
    scene.add(cellGroup);
    cellGroupRef.current = cellGroup;

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
    };
  }, []);

  // Update clipping plane based on cutaway slider
  useEffect(() => {
    if (clipPlanesRef.current.length > 0) {
      if (cutawaySlice > 0) {
        // Normal pointing towards front, constant cuts from front to middle
        clipPlanesRef.current[0].normal.set(0, 0, 1);
        clipPlanesRef.current[0].constant = (1 - cutawaySlice * 2) * 2.2;
      } else {
        clipPlanesRef.current[0].constant = 10; // disable clipping
      }
    }
  }, [cutawaySlice]);

  // Build the 3D cell model whenever cellType changes
  useEffect(() => {
    if (!sceneRef.current || !cellGroupRef.current) return;

    const cellGroup = cellGroupRef.current;
    // Clear previous children
    while (cellGroup.children.length > 0) {
      const child = cellGroup.children[0];
      cellGroup.remove(child);
      if ('geometry' in child && (child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
    }
    organelleMeshesRef.current.clear();
    particleSystemsRef.current = [];

    const clippingPlanes = cutawaySlice > 0 ? clipPlanesRef.current : [];

    if (cellType === 'plant') {
      // ----------------------------------------------------
      // PLANT CELL (Hexagonal/Rectangular Rigid Architecture)
      // ----------------------------------------------------

      // 1. CELL WALL (Plants only: thick hexagonal prism scaffolding)
      const wallGroup = new THREE.Group();
      wallGroup.name = 'cell_wall';

      const wallGeo = new THREE.CylinderGeometry(2.35, 2.35, 2.8, 6, 1, false);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.35,
        wireframe: false,
        roughness: 0.3,
        metalness: 0.1,
        side: THREE.DoubleSide,
        clippingPlanes,
      });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallGroup.add(wallMesh);

      // Outer wireframe frame for cellulose fibers
      const wallWireMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        wireframe: true,
        transparent: true,
        opacity: 0.65,
        clippingPlanes,
      });
      const wallWireMesh = new THREE.Mesh(wallGeo, wallWireMat);
      wallWireMesh.scale.set(1.002, 1.002, 1.002);
      wallGroup.add(wallWireMesh);

      cellGroup.add(wallGroup);
      organelleMeshesRef.current.set('cell_wall', wallGroup);

      // 2. CELL MEMBRANE (Just inside cell wall)
      const memGroup = new THREE.Group();
      memGroup.name = 'cell_membrane';
      const memGeo = new THREE.CylinderGeometry(2.22, 2.22, 2.65, 6, 1, false);
      const memMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.32,
        roughness: 0.2,
        metalness: 0.2,
        side: THREE.DoubleSide,
        clippingPlanes,
      });
      const memMesh = new THREE.Mesh(memGeo, memMat);
      memGroup.add(memMesh);
      cellGroup.add(memGroup);
      organelleMeshesRef.current.set('cell_membrane', memGroup);

      // 3. CYTOPLASM (Jelly matrix filling interior)
      const cytoGroup = new THREE.Group();
      cytoGroup.name = 'cytoplasm';
      const cytoGeo = new THREE.CylinderGeometry(2.15, 2.15, 2.5, 6, 1, false);
      const cytoMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
        roughness: 0.5,
        clippingPlanes,
      });
      const cytoMesh = new THREE.Mesh(cytoGeo, cytoMat);
      cytoGroup.add(cytoMesh);

      // Cytoplasmic floating micro-particles
      const particleCount = 120;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 3.4;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2.1;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 3.4;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x7dd3fc,
        size: 0.05,
        transparent: true,
        opacity: 0.7,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      cytoGroup.add(particles);

      cellGroup.add(cytoGroup);
      organelleMeshesRef.current.set('cytoplasm', cytoGroup);

      // 4. VACUOLE (Plant central vacuole: huge translucent blue water reservoir)
      const vacGroup = new THREE.Group();
      vacGroup.name = 'vacuole';
      vacGroup.position.set(0.45, -0.15, 0.1);
      const vacGeo = new THREE.SphereGeometry(1.2, 32, 32);
      vacGeo.scale(1.25, 0.95, 1.1);
      const vacMat = new THREE.MeshPhysicalMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.55,
        roughness: 0.1,
        transmission: 0.75,
        ior: 1.33, // water index of refraction
        clippingPlanes,
      });
      const vacMesh = new THREE.Mesh(vacGeo, vacMat);
      vacGroup.add(vacMesh);
      cellGroup.add(vacGroup);
      organelleMeshesRef.current.set('vacuole', vacGroup);

      // 5. NUCLEUS (Pushed slightly to side by giant vacuole)
      const nucGroup = new THREE.Group();
      nucGroup.name = 'nucleus';
      nucGroup.position.set(-1.0, 0.45, -0.3);

      // Nuclear envelope
      const nucGeo = new THREE.SphereGeometry(0.68, 28, 28);
      const nucMat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        roughness: 0.35,
        metalness: 0.15,
        transparent: true,
        opacity: 0.88,
        clippingPlanes,
      });
      const nucMesh = new THREE.Mesh(nucGeo, nucMat);
      nucGroup.add(nucMesh);

      // Nucleolus core
      const nucleolusGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const nucleolusMat = new THREE.MeshStandardMaterial({
        color: 0x581c87,
        roughness: 0.4,
        clippingPlanes,
      });
      const nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
      nucleolus.position.set(0.05, 0.05, 0.05);
      nucGroup.add(nucleolus);

      // DNA Helix curve
      const dnaCurve = new THREE.CatmullRomCurve3(
        Array.from({ length: 14 }, (_, i) => {
          const t = i / 14;
          const angle = t * Math.PI * 4;
          return new THREE.Vector3(
            Math.cos(angle) * 0.35,
            (t - 0.5) * 0.8,
            Math.sin(angle) * 0.35
          );
        })
      );
      const dnaGeo = new THREE.TubeGeometry(dnaCurve, 20, 0.035, 8, false);
      const dnaMat = new THREE.MeshBasicMaterial({ color: 0xd8b4fe });
      const dnaMesh = new THREE.Mesh(dnaGeo, dnaMat);
      nucGroup.add(dnaMesh);

      cellGroup.add(nucGroup);
      organelleMeshesRef.current.set('nucleus', nucGroup);

      // 6. CHLOROPLASTS (Plants only: bright green discs with thylakoid coin stacks)
      const chlorGroup = new THREE.Group();
      chlorGroup.name = 'chloroplasts';

      const chlorPositions = [
        { pos: [-1.2, -0.6, 0.8], rot: [0.3, 0.5, 0] },
        { pos: [1.1, 0.7, 0.6], rot: [-0.2, 0.8, 0.4] },
        { pos: [-0.3, 0.85, 0.9], rot: [0.6, -0.4, 0.1] },
        { pos: [0.8, -0.85, -0.7], rot: [-0.5, 0.2, -0.3] },
      ];

      chlorPositions.forEach((cp, idx) => {
        const singleChlor = new THREE.Group();
        singleChlor.position.set(cp.pos[0], cp.pos[1], cp.pos[2]);
        singleChlor.rotation.set(cp.rot[0], cp.rot[1], cp.rot[2]);

        // Disc shape
        const discGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.22, 20);
        const discMat = new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          roughness: 0.25,
          clippingPlanes,
        });
        const discMesh = new THREE.Mesh(discGeo, discMat);
        singleChlor.add(discMesh);

        // Internal thylakoid stack visual (darker green rings)
        const ringGeo = new THREE.TorusGeometry(0.24, 0.04, 8, 16);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.y = 0.05;
        singleChlor.add(ring1);

        const ring2 = ring1.clone();
        ring2.position.y = -0.05;
        singleChlor.add(ring2);

        chlorGroup.add(singleChlor);
      });

      // Photosynthesis light sparkles
      const photoSparkleCount = 40;
      const photoGeo = new THREE.BufferGeometry();
      const photoPos = new Float32Array(photoSparkleCount * 3);
      for (let i = 0; i < photoSparkleCount; i++) {
        photoPos[i * 3] = (Math.random() - 0.5) * 3.5;
        photoPos[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
        photoPos[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
      }
      photoGeo.setAttribute('position', new THREE.BufferAttribute(photoPos, 3));
      const photoMat = new THREE.PointsMaterial({
        color: 0x86efac,
        size: 0.07,
        transparent: true,
        opacity: 0.9,
      });
      const photoSparkles = new THREE.Points(photoGeo, photoMat);
      chlorGroup.add(photoSparkles);

      particleSystemsRef.current.push({
        update: (delta) => {
          photoSparkles.rotation.y += delta * 0.4;
        },
      });

      cellGroup.add(chlorGroup);
      organelleMeshesRef.current.set('chloroplasts', chlorGroup);

      // 7. MITOCHONDRIA (Capsule with cristae folds)
      const mitoGroup = new THREE.Group();
      mitoGroup.name = 'mitochondria';

      const mitoPositions = [
        { pos: [-0.9, 0.2, 1.2], rot: [0.4, 0.8, -0.2] },
        { pos: [1.2, -0.4, 0.9], rot: [-0.5, 0.4, 0.6] },
        { pos: [-1.2, -0.5, -0.8], rot: [0.8, -0.2, 0.4] },
      ];

      mitoPositions.forEach((mp) => {
        const singleMito = new THREE.Group();
        singleMito.position.set(mp.pos[0], mp.pos[1], mp.pos[2]);
        singleMito.rotation.set(mp.rot[0], mp.rot[1], mp.rot[2]);

        const capGeo = new THREE.CapsuleGeometry(0.18, 0.45, 12, 16);
        const capMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          roughness: 0.3,
          clippingPlanes,
        });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        singleMito.add(capMesh);

        // Folded inner cristae visual
        const foldGeo = new THREE.TorusGeometry(0.13, 0.03, 8, 12);
        const foldMat = new THREE.MeshStandardMaterial({ color: 0xc2410c });
        [-0.14, 0, 0.14].forEach((yPos) => {
          const fold = new THREE.Mesh(foldGeo, foldMat);
          fold.rotation.x = Math.PI / 2;
          fold.position.y = yPos;
          singleMito.add(fold);
        });

        mitoGroup.add(singleMito);
      });

      // ATP energy spark particles
      const atpCount = 30;
      const atpGeo = new THREE.BufferGeometry();
      const atpPos = new Float32Array(atpCount * 3);
      for (let i = 0; i < atpCount; i++) {
        atpPos[i * 3] = (Math.random() - 0.5) * 3;
        atpPos[i * 3 + 1] = (Math.random() - 0.5) * 2;
        atpPos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      }
      atpGeo.setAttribute('position', new THREE.BufferAttribute(atpPos, 3));
      const atpMat = new THREE.PointsMaterial({
        color: 0xfde047,
        size: 0.08,
        transparent: true,
        opacity: 0.95,
      });
      const atpParticles = new THREE.Points(atpGeo, atpMat);
      mitoGroup.add(atpParticles);

      particleSystemsRef.current.push({
        update: (delta) => {
          atpParticles.rotation.y += delta * 0.6;
        },
      });

      cellGroup.add(mitoGroup);
      organelleMeshesRef.current.set('mitochondria', mitoGroup);

    } else {
      // ----------------------------------------------------
      // ANIMAL CELL (Flexible spherical/organic architecture)
      // Note: NO Cell Wall, NO Chloroplasts!
      // ----------------------------------------------------

      // 1. CELL MEMBRANE (Flexible organic outer perimeter)
      const memGroup = new THREE.Group();
      memGroup.name = 'cell_membrane';
      const memGeo = new THREE.SphereGeometry(2.35, 36, 36);
      // Soft organic deformation
      const posAttr = memGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const vz = posAttr.getZ(i);
        const noise = Math.sin(vx * 2.2) * Math.cos(vy * 2.2) * 0.12;
        posAttr.setXYZ(i, vx + noise * (vx / 2.35), vy + noise * (vy / 2.35), vz + noise * (vz / 2.35));
      }
      memGeo.computeVertexNormals();

      const memMat = new THREE.MeshPhysicalMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.38,
        roughness: 0.25,
        metalness: 0.1,
        transmission: 0.6,
        clippingPlanes,
      });
      const memMesh = new THREE.Mesh(memGeo, memMat);
      memGroup.add(memMesh);

      // Receptor nodule spheres on surface
      for (let i = 0; i < 24; i++) {
        const phi = Math.acos(-1 + (2 * i) / 24);
        const theta = Math.sqrt(24 * Math.PI) * phi;
        const noduleGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const noduleMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee });
        const nodule = new THREE.Mesh(noduleGeo, noduleMat);
        nodule.position.set(
          2.32 * Math.cos(theta) * Math.sin(phi),
          2.32 * Math.sin(theta) * Math.sin(phi),
          2.32 * Math.cos(phi)
        );
        memGroup.add(nodule);
      }

      cellGroup.add(memGroup);
      organelleMeshesRef.current.set('cell_membrane', memGroup);

      // 2. CYTOPLASM (Viscous internal matrix)
      const cytoGroup = new THREE.Group();
      cytoGroup.name = 'cytoplasm';
      const cytoGeo = new THREE.SphereGeometry(2.2, 32, 32);
      const cytoMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.18,
        roughness: 0.6,
        clippingPlanes,
      });
      const cytoMesh = new THREE.Mesh(cytoGeo, cytoMat);
      cytoGroup.add(cytoMesh);

      // Cytoskeleton filaments
      const filamentCount = 90;
      const filamentGeo = new THREE.BufferGeometry();
      const fPos = new Float32Array(filamentCount * 3);
      for (let i = 0; i < filamentCount; i++) {
        fPos[i * 3] = (Math.random() - 0.5) * 3.6;
        fPos[i * 3 + 1] = (Math.random() - 0.5) * 3.6;
        fPos[i * 3 + 2] = (Math.random() - 0.5) * 3.6;
      }
      filamentGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
      const filamentMat = new THREE.PointsMaterial({
        color: 0xbae6fd,
        size: 0.055,
        transparent: true,
        opacity: 0.75,
      });
      const filaments = new THREE.Points(filamentGeo, filamentMat);
      cytoGroup.add(filaments);

      cellGroup.add(cytoGroup);
      organelleMeshesRef.current.set('cytoplasm', cytoGroup);

      // 3. NUCLEUS (Centrally located in animal cells)
      const nucGroup = new THREE.Group();
      nucGroup.name = 'nucleus';
      nucGroup.position.set(0, 0, 0);

      const nucGeo = new THREE.SphereGeometry(0.85, 32, 32);
      const nucMat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        roughness: 0.35,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9,
        clippingPlanes,
      });
      const nucMesh = new THREE.Mesh(nucGeo, nucMat);
      nucGroup.add(nucMesh);

      // Nucleolus
      const nucleolusGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const nucleolusMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95 });
      const nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
      nucGroup.add(nucleolus);

      // DNA Helix inside
      const dnaCurve = new THREE.CatmullRomCurve3(
        Array.from({ length: 16 }, (_, i) => {
          const t = i / 16;
          const angle = t * Math.PI * 4;
          return new THREE.Vector3(
            Math.cos(angle) * 0.42,
            (t - 0.5) * 0.95,
            Math.sin(angle) * 0.42
          );
        })
      );
      const dnaGeo = new THREE.TubeGeometry(dnaCurve, 24, 0.04, 8, false);
      const dnaMat = new THREE.MeshBasicMaterial({ color: 0xe9d5ff });
      const dnaMesh = new THREE.Mesh(dnaGeo, dnaMat);
      nucGroup.add(dnaMesh);

      cellGroup.add(nucGroup);
      organelleMeshesRef.current.set('nucleus', nucGroup);

      // 4. MITOCHONDRIA (More numerous in animal cells)
      const mitoGroup = new THREE.Group();
      mitoGroup.name = 'mitochondria';

      const mitoPositions = [
        { pos: [1.3, 0.7, 0.5], rot: [0.5, 0.3, 0.8] },
        { pos: [-1.2, -0.8, 0.6], rot: [-0.6, 0.5, -0.3] },
        { pos: [-1.3, 0.8, -0.4], rot: [0.4, -0.7, 0.5] },
        { pos: [1.1, -1.0, -0.5], rot: [-0.3, 0.8, 0.2] },
        { pos: [0.2, 1.4, -0.7], rot: [0.8, 0.2, -0.6] },
      ];

      mitoPositions.forEach((mp) => {
        const singleMito = new THREE.Group();
        singleMito.position.set(mp.pos[0], mp.pos[1], mp.pos[2]);
        singleMito.rotation.set(mp.rot[0], mp.rot[1], mp.rot[2]);

        const capGeo = new THREE.CapsuleGeometry(0.19, 0.45, 12, 16);
        const capMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          roughness: 0.3,
          clippingPlanes,
        });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        singleMito.add(capMesh);

        // Folded inner cristae
        const foldGeo = new THREE.TorusGeometry(0.14, 0.03, 8, 12);
        const foldMat = new THREE.MeshStandardMaterial({ color: 0xc2410c });
        [-0.15, 0, 0.15].forEach((yPos) => {
          const fold = new THREE.Mesh(foldGeo, foldMat);
          fold.rotation.x = Math.PI / 2;
          fold.position.y = yPos;
          singleMito.add(fold);
        });

        mitoGroup.add(singleMito);
      });

      // ATP energy sparks
      const atpCount = 35;
      const atpGeo = new THREE.BufferGeometry();
      const atpPos = new Float32Array(atpCount * 3);
      for (let i = 0; i < atpCount; i++) {
        atpPos[i * 3] = (Math.random() - 0.5) * 3.5;
        atpPos[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
        atpPos[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
      }
      atpGeo.setAttribute('position', new THREE.BufferAttribute(atpPos, 3));
      const atpMat = new THREE.PointsMaterial({
        color: 0xfde047,
        size: 0.08,
        transparent: true,
        opacity: 0.95,
      });
      const atpParticles = new THREE.Points(atpGeo, atpMat);
      mitoGroup.add(atpParticles);

      particleSystemsRef.current.push({
        update: (delta) => {
          atpParticles.rotation.y += delta * 0.6;
        },
      });

      cellGroup.add(mitoGroup);
      organelleMeshesRef.current.set('mitochondria', mitoGroup);

      // 5. VACUOLES (Small and multiple in animal cells)
      const vacGroup = new THREE.Group();
      vacGroup.name = 'vacuole';

      const smallVacPositions = [
        { pos: [-0.9, 1.2, 0.7], r: 0.32 },
        { pos: [1.2, 0.2, -1.1], r: 0.28 },
        { pos: [-0.4, -1.3, -0.9], r: 0.35 },
      ];

      smallVacPositions.forEach((vp) => {
        const sVacGeo = new THREE.SphereGeometry(vp.r, 20, 20);
        const sVacMat = new THREE.MeshPhysicalMaterial({
          color: 0x0ea5e9,
          transparent: true,
          opacity: 0.6,
          roughness: 0.15,
          transmission: 0.7,
          clippingPlanes,
        });
        const sVacMesh = new THREE.Mesh(sVacGeo, sVacMat);
        sVacMesh.position.set(vp.pos[0], vp.pos[1], vp.pos[2]);
        vacGroup.add(sVacMesh);
      });

      cellGroup.add(vacGroup);
      organelleMeshesRef.current.set('vacuole', vacGroup);
    }
  }, [cellType, cutawaySlice]);

  // Highlight selected organelle
  useEffect(() => {
    const targetId = highlightOrganelleId || selectedOrganelle?.id;

    organelleMeshesRef.current.forEach((group, id) => {
      const isTarget = targetId === id;
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (isTarget) {
            // Apply pulse scale
            group.scale.set(1.12, 1.12, 1.12);
          } else {
            group.scale.set(1.0, 1.0, 1.0);
          }
        }
      });
    });
  }, [selectedOrganelle, highlightOrganelleId]);

  // Main Animation Loop
  useEffect(() => {
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();

      if (cellGroupRef.current) {
        // Auto-rotation if enabled and not dragging
        if (isRotating && !isDraggingRef.current) {
          targetRotationRef.current.y += delta * 0.35;
        }

        // Smooth damping rotation
        cellGroupRef.current.rotation.y +=
          (targetRotationRef.current.y - cellGroupRef.current.rotation.y) * 0.1;
        cellGroupRef.current.rotation.x +=
          (targetRotationRef.current.x - cellGroupRef.current.rotation.x) * 0.1;

        // Smooth zoom
        if (cameraRef.current) {
          const targetZ = 7.5 / zoomLevelRef.current;
          cameraRef.current.position.z += (targetZ - cameraRef.current.position.z) * 0.1;
        }
      }

      // Update particle systems
      particleSystemsRef.current.forEach((ps) => ps.update(delta));

      // Update 2D Screen-space labels if enabled
      if (
        showAllLabels &&
        cameraRef.current &&
        containerRef.current &&
        organelleMeshesRef.current.size > 0
      ) {
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        const newTags: { organelle: Organelle; x: number; y: number; visible: boolean }[] = [];

        CELL_ORGANELLES.forEach((organelle) => {
          if (cellType === 'animal' && organelle.plantsOnly) return;
          const group = organelleMeshesRef.current.get(organelle.id);
          if (group && cameraRef.current) {
            const worldPos = new THREE.Vector3();
            group.getWorldPosition(worldPos);

            // Project to screen space
            const projected = worldPos.clone().project(cameraRef.current);
            const isFront = projected.z < 1;

            const screenX = ((projected.x + 1) * containerW) / 2;
            const screenY = ((-projected.y + 1) * containerH) / 2;

            newTags.push({
              organelle,
              x: screenX,
              y: screenY,
              visible: isFront && screenX > 20 && screenX < containerW - 20 && screenY > 20 && screenY < containerH - 20,
            });
          }
        });
        setOrganelleTags(newTags);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRotating, showAllLabels, cellType]);

  // Raycasting helper to detect clicked/hovered organelle
  const getIntersectedOrganelle = useCallback(
    (clientX: number, clientY: number): Organelle | null => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return null;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const meshesToTest: { mesh: THREE.Mesh; organelleId: string }[] = [];
      organelleMeshesRef.current.forEach((group, organelleId) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshesToTest.push({ mesh: child, organelleId });
          }
        });
      });

      const intersects = raycaster.intersectObjects(
        meshesToTest.map((m) => m.mesh),
        false
      );

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const entry = meshesToTest.find((m) => m.mesh === hitMesh);
        if (entry) {
          const org = CELL_ORGANELLES.find((o) => o.id === entry.organelleId);
          return org || null;
        }
      }
      return null;
    },
    []
  );

  // Mouse & Touch Interaction handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - prevPointerRef.current.x;
      const deltaY = e.clientY - prevPointerRef.current.y;

      targetRotationRef.current.y += deltaX * 0.007;
      targetRotationRef.current.x += deltaY * 0.007;

      // Restrict vertical pitch to prevent flipping upside down
      targetRotationRef.current.x = Math.max(
        -Math.PI / 2.5,
        Math.min(Math.PI / 2.5, targetRotationRef.current.x)
      );

      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    } else {
      // Hover detection
      const hit = getIntersectedOrganelle(e.clientX, e.clientY);
      setHoveredOrganelle(hit);
      if (hit && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        setHoverPos(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const movedDist = Math.hypot(
      e.clientX - prevPointerRef.current.x,
      e.clientY - prevPointerRef.current.y
    );
    isDraggingRef.current = false;

    // If it was a clean click (minimal movement), handle selection
    if (movedDist < 6) {
      const hit = getIntersectedOrganelle(e.clientX, e.clientY);
      if (hit) {
        soundManager.playOrganelleTone(hit.soundFrequency);
        onSelectOrganelle(hit);
      }
    }
  };

  // Zoom control via wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    zoomLevelRef.current = Math.max(0.6, Math.min(2.2, zoomLevelRef.current + zoomDelta));
  };

  // Reset 3D camera orientation
  const handleResetCamera = () => {
    targetRotationRef.current = { x: 0.2, y: 0 };
    zoomLevelRef.current = 1.0;
  };

  // Take Snapshot of the AR view (merging webcam feed with WebGL canvas)
  const handleCaptureSnapshot = () => {
    soundManager.playCameraShutter();
    if (!canvasRef.current) return;

    // Create an offscreen canvas to combine webcam and 3D WebGL
    const offCanvas = document.createElement('canvas');
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    offCanvas.width = width;
    offCanvas.height = height;
    const ctx = offCanvas.getContext('2d');

    if (ctx) {
      // If AR video is active, draw the video frame first
      if (arMode && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
      } else {
        // Draw laboratory backdrop
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);
      }

      // Draw Three.js WebGL canvas over it
      ctx.drawImage(canvasRef.current, 0, 0);

      // Watermark with CellAR branding and biology details
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(20, height - 70, 360, 50);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.fillText('CellAR Bio-Explorer', 35, height - 42);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      const typeLabel = cellType === 'plant' ? 'Plant Cell (with Wall & Chloroplasts)' : 'Animal Cell';
      ctx.fillText(`${typeLabel} · Augmented Reality Specimen`, 35, height - 26);

      const dataUrl = offCanvas.toDataURL('image/png');
      if (onCaptureSnapshot) {
        onCaptureSnapshot(dataUrl);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] overflow-hidden select-none bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      style={{ touchAction: 'none' }}
    >
      {/* Real WebCam Video Feed for Augmented Reality */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 pointer-events-none ${
          arMode ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Bio-Lab Backdrop if AR is disabled */}
      {!arMode && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 pointer-events-none transition-opacity duration-500"
          style={{
            backgroundImage: `url('/src/assets/images/microscope_lab_backdrop_1791186918357.jpg')`,
          }}
        >
          {/* Subtle grid lines overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>
      )}

      {/* Three.js 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* AR Surface Reticle / Alignment Ring in AR Mode */}
      {arMode && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-40">
          <div className="w-64 h-64 rounded-full border border-dashed border-emerald-400/60 animate-[spin_25s_linear_infinite]" />
          <div className="absolute w-4 h-4 rounded-full bg-emerald-400/80 animate-ping" />
        </div>
      )}

      {/* Floating 3D Organelle Labels (Screen-space projection) */}
      {showAllLabels &&
        organelleTags.map((tag) => {
          if (!tag.visible) return null;
          const isSelected = selectedOrganelle?.id === tag.organelle.id;
          const isHighlighted = highlightOrganelleId === tag.organelle.id;

          return (
            <button
              key={tag.organelle.id}
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playOrganelleTone(tag.organelle.soundFrequency);
                onSelectOrganelle(tag.organelle);
              }}
              style={{
                left: `${tag.x}px`,
                top: `${tag.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute z-20 px-2.5 py-1 text-xs font-semibold rounded-lg shadow-lg backdrop-blur-md transition-all duration-200 cursor-pointer pointer-events-auto flex items-center gap-1.5 whitespace-nowrap ${
                isSelected || isHighlighted
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 scale-110 shadow-amber-500/30'
                  : 'bg-slate-900/80 text-slate-200 border border-slate-700/80 hover:bg-slate-800 hover:text-white hover:scale-105'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: tag.organelle.color }}
              />
              <span>{tag.organelle.name}</span>
              {tag.organelle.plantsOnly && (
                <span className="text-[10px] text-emerald-400 font-medium">🌿</span>
              )}
            </button>
          );
        })}

      {/* Hover Tooltip when pointer hovers over an organelle */}
      {hoveredOrganelle && hoverPos && !selectedOrganelle && (
        <div
          style={{
            left: `${hoverPos.x + 14}px`,
            top: `${hoverPos.y - 10}px`,
          }}
          className="absolute z-30 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg px-3 py-1.5 text-xs shadow-xl max-w-xs transition-opacity"
        >
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: hoveredOrganelle.color }}
            />
            {hoveredOrganelle.name}
            {hoveredOrganelle.plantsOnly && (
              <span className="text-[10px] text-emerald-400 font-normal">· Plants only</span>
            )}
          </div>
          <div className="text-slate-300 text-[11px] mt-0.5 line-clamp-2">
            {hoveredOrganelle.function}
          </div>
        </div>
      )}

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Mode Indicators */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setArMode(!arMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-md transition-colors cursor-pointer ${
              arMode
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-slate-900/80 text-slate-200 border border-slate-700/80 hover:bg-slate-800'
            }`}
            title="Toggle Live Camera AR mode"
          >
            {arMode ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            <span>{arMode ? 'AR Camera Active' : 'Enable AR Camera'}</span>
          </button>

          {arMode && (
            <button
              onClick={() =>
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
              }
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900/80 text-slate-200 border border-slate-700/80 hover:bg-slate-800 backdrop-blur-md flex items-center gap-1 cursor-pointer"
              title="Switch Front/Rear Camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flip Camera</span>
            </button>
          )}

          <div className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900/80 text-slate-300 border border-slate-700/80 backdrop-blur-md">
            <span>{cellType === 'plant' ? '🌿 Plant Cell' : '🔬 Animal Cell'}</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Label Visibility Toggle */}
          <button
            onClick={() => setShowAllLabels(!showAllLabels)}
            className={`p-2 rounded-lg text-xs border backdrop-blur-md transition-colors cursor-pointer ${
              showAllLabels
                ? 'bg-slate-800 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle 3D Organelle Labels"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Auto-Rotation Toggle */}
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-2 rounded-lg text-xs border backdrop-blur-md transition-colors cursor-pointer ${
              isRotating
                ? 'bg-slate-800 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle 360° Auto-Rotation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Reset Camera Button */}
          <button
            onClick={handleResetCamera}
            className="p-2 rounded-lg text-xs bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800 backdrop-blur-md cursor-pointer"
            title="Reset View Orientation"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          {/* AR Snapshot Camera Capture Button */}
          <button
            onClick={handleCaptureSnapshot}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Capture Photo with AR Cell"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Snapshot</span>
          </button>
        </div>
      </div>

      {/* Camera Access Notice Banner if error */}
      {cameraError && (
        <div className="absolute top-16 left-4 right-4 z-20 p-2.5 rounded-lg bg-amber-950/80 border border-amber-600/60 text-amber-200 text-xs backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={() => setCameraError(null)}
            className="px-2 py-0.5 rounded text-[11px] bg-amber-900/80 hover:bg-amber-800 text-amber-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bottom Floating Control Bar: Cutaway Slicer & Zoom */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Dissection Cross-Section Slider */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 pointer-events-auto text-xs text-slate-200 shadow-xl">
          <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium whitespace-nowrap">Cross-Section:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={cutawaySlice}
            onChange={(e) => setCutawaySlice(parseFloat(e.target.value))}
            className="w-24 sm:w-32 accent-cyan-400 cursor-pointer"
          />
          <span className="font-mono text-cyan-300 w-8 tabular-nums">
            {Math.round(cutawaySlice * 100)}%
          </span>
        </div>

        {/* Interaction hints */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[11px] text-slate-400">
          <span>Drag to orbit</span>
          <span aria-hidden="true">·</span>
          <span>Scroll to zoom</span>
          <span aria-hidden="true">·</span>
          <span>Click organelle to inspect</span>
        </div>
      </div>
    </div>
  );
};
