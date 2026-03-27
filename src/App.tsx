import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { 
  Folder, 
  User, 
  Briefcase, 
  Mail, 
  X, 
  Minus, 
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Search,
  Globe,
  Music,
  Camera,
  Phone,
  Trash2,
  Star as StarIcon,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  File
} from 'lucide-react';

// --- Types ---

interface StarState {
  id: number;
  color: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  rotation: number;
  scale: number;
}

interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  type: 'folder' | 'gallery' | 'about' | 'contact' | 'stars' | 'project-folder' | 'video-player';
  width: number;
  height: number;
  x: number;
  y: number;
  files?: string[];
  videoUrl?: string;
  folderName?: string;
}

interface GalleryItem {
  id: string;
  url: string;
  title: string;
  height: string; // For masonry effect
}

interface ProjectData {
  id: string;
  title: string;
  folderName: string;
  files: string[];
}

const GALLERY_HEIGHTS = ['h-40', 'h-48', 'h-52', 'h-60', 'h-64', 'h-72', 'h-80'];
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif']);
const CONTACT_EMAIL = 'paula.stankiute@gmail.com';
const CONTACT_PHONE = '+370 654 62 840';
const CONTACT_LINKEDIN = 'https://www.linkedin.com/in/paula-stankiute/';

const buildGalleryItems = (projects: ProjectData[]): GalleryItem[] => {
  const items: GalleryItem[] = [];
  let index = 0;

  projects.forEach((project) => {
    project.files.forEach((fileName) => {
      const ext = fileName.toLowerCase().split('.').pop() || '';
      if (!IMAGE_EXTENSIONS.has(ext)) return;

      items.push({
        id: `${project.folderName}-${fileName}-${index}`,
        url: `/Projects/${project.folderName}/${fileName}`,
        title: `${project.title} - ${fileName}`,
        height: GALLERY_HEIGHTS[index % GALLERY_HEIGHTS.length]
      });
      index += 1;
    });
  });

  return items;
};

// --- Components ---

interface MacWindowProps {
  window: WindowState;
  onClose: () => void;
  onFocus: () => void;
  onUpdate: (id: string, updates: Partial<WindowState>) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  canNavigate?: boolean;
  children: React.ReactNode;
}

const MacWindow: React.FC<MacWindowProps> = ({ 
  window: win, 
  onClose, 
  onFocus, 
  onUpdate,
  onNavigatePrev,
  onNavigateNext,
  canNavigate = false,
  children 
}) => {
  const dragControls = useDragControls();

  const handleResizeStart = (e: React.MouseEvent, direction: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = win.width;
    const startHeight = win.height;
    const startPos = { x: win.x, y: win.y };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPos.x;
      let newY = startPos.y;

      if (direction.includes('e')) {
        newWidth = Math.max(300, startWidth + dx);
      } else if (direction.includes('w')) {
        const potentialWidth = Math.max(300, startWidth - dx);
        newX = startPos.x + (startWidth - potentialWidth);
        newWidth = potentialWidth;
      }

      if (direction.includes('s')) {
        newHeight = Math.max(200, startHeight + dy);
      } else if (direction.includes('n')) {
        const potentialHeight = Math.max(200, startHeight - dy);
        newY = startPos.y + (startHeight - potentialHeight);
        newHeight = potentialHeight;
      }

      onUpdate(win.id, { width: newWidth, height: newHeight, x: newX, y: newY });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragListener={false}
      initial={false}
      animate={{ 
        x: win.x,
        y: win.y,
        width: win.width, 
        height: win.height,
        scale: 1,
        opacity: 1
      }}
      onDrag={(e, info) => {
        onUpdate(win.id, { x: win.x + info.delta.x, y: win.y + info.delta.y });
      }}
      onMouseDown={onFocus}
      style={{ zIndex: win.zIndex, position: 'absolute' }}
      className="bg-white/40 backdrop-blur-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col border border-white/30"
    >
      {/* Resize Handles (Corners) */}
      <div onMouseDown={(e) => handleResizeStart(e, 'nw')} className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-50" />
      <div onMouseDown={(e) => handleResizeStart(e, 'ne')} className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-50" />
      <div onMouseDown={(e) => handleResizeStart(e, 'sw')} className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-50" />
      <div onMouseDown={(e) => handleResizeStart(e, 'se')} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50" />

      {/* Title Bar (Drag Handle) */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="h-10 bg-white/50 border-b border-black/5 flex items-center px-4 justify-between select-none cursor-grab active:cursor-grabbing"
      >
        <div className="flex gap-2 items-center">
          <div className="flex gap-1.5 group">
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/5 flex items-center justify-center">
              <X size={8} className="text-black/40 opacity-0 group-hover:opacity-100" />
            </button>
            <button className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/5 flex items-center justify-center">
              <Minus size={8} className="text-black/40 opacity-0 group-hover:opacity-100" />
            </button>
            <button className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/5 flex items-center justify-center">
              <Maximize2 size={8} className="text-black/40 opacity-0 group-hover:opacity-100" />
            </button>
          </div>
          <span
            className="ml-4 font-medium text-black/60 flex items-center"
            style={{
              gap: 'clamp(0.35rem, 0.6vw, 0.6rem)',
              fontSize: 'clamp(11px, 0.72vw, 14px)'
            }}
          >
            {win.type === 'folder' && <Folder className="w-[clamp(13px,0.95vw,18px)] h-[clamp(13px,0.95vw,18px)]" />}
            {win.type === 'gallery' && <ImageIcon className="text-blue-400 w-[clamp(13px,0.95vw,18px)] h-[clamp(13px,0.95vw,18px)]" />}
            {win.type === 'about' && <User className="w-[clamp(13px,0.95vw,18px)] h-[clamp(13px,0.95vw,18px)]" />}
            {win.type === 'contact' && <Mail className="w-[clamp(13px,0.95vw,18px)] h-[clamp(13px,0.95vw,18px)]" />}
            {win.type === 'video-player' && <Camera className="text-red-400 w-[clamp(13px,0.95vw,18px)] h-[clamp(13px,0.95vw,18px)]" />}
            {win.title}
          </span>
        </div>
        <div className="flex gap-2 text-black/40 items-center">
          <Search size={14} />
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onNavigatePrev?.();
            }}
            disabled={!canNavigate}
            className={`p-1 rounded transition-colors ${canNavigate ? 'hover:bg-black/10 text-black/60' : 'text-black/20 cursor-not-allowed'}`}
            aria-label="Previous item"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateNext?.();
            }}
            disabled={!canNavigate}
            className={`p-1 rounded transition-colors ${canNavigate ? 'hover:bg-black/10 text-black/60' : 'text-black/20 cursor-not-allowed'}`}
            aria-label="Next item"
            title="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 text-black">
        {children}
      </div>
    </motion.div>
  );
};

const MasonryGallery = ({ items }: { items: GalleryItem[] }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-black/50 text-sm">
        No images found in your project folders.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="columns-2 md:columns-3 gap-4 space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02 }}
            className={`relative break-inside-avoid rounded-lg overflow-hidden cursor-pointer shadow-sm border border-black/5 bg-gray-100 ${item.height}`}
            onClick={() => setSelectedImageIndex(index)}
          >
            <img 
              src={item.url} 
              alt={item.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-3">
              <span className="text-white text-xs font-medium">{item.title}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox / Swipe View */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button className="absolute top-4 right-4 text-white/60 hover:text-white">
              <X size={32} />
            </button>
            <motion.img 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={items[selectedImageIndex]?.url} 
              className="max-w-full max-h-full rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-10 flex gap-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => {
                    if (prev === null) return 0;
                    return prev > 0 ? prev - 1 : items.length - 1;
                  });
                }}
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => {
                    if (prev === null) return 0;
                    return prev < items.length - 1 ? prev + 1 : 0;
                  });
                }}
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NeonCameraView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError('Camera is not supported in this browser.');
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        setCameraError('Camera access blocked. Please allow camera permission.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-black rounded-lg overflow-hidden">
      <div className="flex-1 relative overflow-hidden bg-[#090312]">
        {cameraError ? (
          <div className="h-full w-full flex items-center justify-center text-center text-fuchsia-200/80 px-8 text-sm">
            {cameraError}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{
               filter: 'contrast(2) brightness(1.1) saturate(1.5) hue-rotate(-50deg)',
                mixBlendMode: 'screen'
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(rgba(255,0,255,0.08) 50%, rgba(0,255,255,0.08) 50%), radial-gradient(circle at 50% 50%, rgba(255, 40, 140, 0.2), rgba(0, 220, 255, 0.1) 45%, rgba(0, 0, 0, 0.35) 100%)',
                backgroundSize: '100% 4px, 100% 100%'
              }}
            />
          </>
        )}
      </div>
      <div className="p-4 bg-zinc-900 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-fuchsia-500/20 rounded-lg border border-fuchsia-400/30">
            <Camera size={20} className="text-fuchsia-300" />
          </div>
          <div>
            <p className="text-sm font-bold truncate max-w-[200px]">Camera View</p>
            <p className="text-[10px] text-fuchsia-200/70 uppercase tracking-wider font-bold">Neon Mode</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
          <span className="text-[9px] font-mono text-fuchsia-100/80">LIVE</span>
        </div>
      </div>
    </div>
  );
};

//const CheckeredBackground = () => null;

const ThreeWorld = ({ windows, stars, onStarDrag }: { 
  windows: WindowState[], 
  stars: StarState[],
  onStarDrag: (id: number, x: number, y: number) => void
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const starMeshesRef = useRef<Map<number, { main: THREE.Mesh, border: THREE.Mesh, baseScale: number, hoverScale: number, pulse: number }>>(new Map());
  const backgroundMeshesRef = useRef<Map<string, { mesh: THREE.Mesh, baseScale: THREE.Vector3, hoverScale: number, type: 'square' | 'image' | 'text' }>>(new Map());
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const draggingStarId = useRef<number | null>(null);
  const draggingBgId = useRef<string | null>(null);
  const hoveredStarId = useRef<number | null>(null);

  // Sound Effect
  const playChime = (freq: number = 440) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio not supported or blocked');
    }
  };

  useEffect(() => {
    if (!containerRef.current || rendererRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Use PerspectiveCamera as requested in user snippet
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
    camera.position.z = 580;



    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'auto';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing setup
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Add FilmPass for noise/grain to "glue" 2D and 3D together
    const filmPass = new FilmPass(0.15, false);
    composer.addPass(filmPass);
    composerRef.current = composer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(hemiLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(0, 0, 300);
    scene.add(mainLight);

    const pointLight = new THREE.PointLight(0xffffff, 15, 1000);
    pointLight.position.set(0, 0, 100);
    scene.add(pointLight);

    const orbitLight = new THREE.PointLight(0xffffff, 15, 2000);
    scene.add(orbitLight);

    const rimLight = new THREE.PointLight(0xffffff, 4, 800);
    rimLight.position.set(-100, 100, 50);
    scene.add(rimLight);

    // Environment map for reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x444444);
    const envLight1 = new THREE.PointLight(0xffffff, 100, 100);
    envLight1.position.set(10, 10, 10);
    envScene.add(envLight1);
    const envMap = pmremGenerator.fromScene(envScene).texture;
    scene.environment = envMap;

    // --- Background Elements ---
    const bgGroup = new THREE.Group();
    scene.add(bgGroup);

    const gridSize = 1200;
    const gridDivisions = 48; // 2400 / 50 = 48 divisions
    const cellSize = 50;

    // 1. Base Plane (White)
    const baseGeo = new THREE.PlaneGeometry(gridSize * 2, gridSize * 2);
    const baseMat = new THREE.MeshBasicMaterial({ color: 0xfdfdfd });
    const basePlane = new THREE.Mesh(baseGeo, baseMat);
    basePlane.position.z = -50;
    bgGroup.add(basePlane);

    // 2. Checkered Grid (Shader)
    const gridGeo = new THREE.PlaneGeometry(gridSize * 2, gridSize * 2);
    const gridMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uSize: { value: cellSize },
        uColor: { value: new THREE.Color(0x000000) },
        uOpacity: { value: 0.2 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uSize;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          // 48 divisions. Offset to ensure lines are at cell boundaries
          // We want the lines at 0.0, 1.0... in the fract space
          vec2 grid = abs(fract(vUv * 48.0) - 0.5) / fwidth(vUv * 48.0);
          // Standard grid: lines at 0, 1, 2...
          vec2 grid2 = abs(fract(vUv * 48.0 + 0.5) - 0.5) / fwidth(vUv * 48.0);
          float line = min(grid2.x, grid2.y);
          float alpha = (1.0 - min(line, 1.0)) * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `
    });
    const gridPlane = new THREE.Mesh(gridGeo, gridMat);
    gridPlane.position.z = -49;
    bgGroup.add(gridPlane);

    // 3. Random Colored Squares (Aligned to Grid)
    const colors = [0xffb7ce, 0xaec6cf, 0xb3e5be, 0xe0bbe4, 0xfff9b1, 0xffdab9];
    for (let i = 0; i < 12; i++) {
      const squareGeo = new THREE.PlaneGeometry(cellSize, cellSize);
      const squareMat = new THREE.MeshBasicMaterial({ 
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 0.8
      });
      const square = new THREE.Mesh(squareGeo, squareMat);
      
      // Place them in a crossword-like pattern or scattered
      const gx = Math.floor(Math.random() * 20 - 10);
      const gy = Math.floor(Math.random() * 10 - 8); // Lower part
      
      square.position.set(gx * cellSize + cellSize/2, gy * cellSize + cellSize/2, -48);
      
      const id = `square-${i}`;
      (square as any).bgId = id;
      backgroundMeshesRef.current.set(id, {
        mesh: square,
        baseScale: new THREE.Vector3(1, 1, 1),
        hoverScale: 1.0,
        type: 'square'
      });
      bgGroup.add(square);
    }

    // 4. Ransom Images (Aligned to Grid)
    const textureLoader = new THREE.TextureLoader();
    const imageUrls = [
    '/Photos/aplate.png',
      '/Photos/cantop.png',
      '/Photos/chips).png',
      '/Photos/egg.png',
      '/Photos/gum).png',
      '/Photos/karpis.png',
      '/Photos/leaf.png',
      '/Photos/tomato.png',
       '/Photos/Eyeglasses.png'
    ];

    imageUrls.forEach((url, i) => {
      // Images take 2x2 cells
      const imgGeo = new THREE.PlaneGeometry(cellSize * 2, cellSize * 2);
      const texture = textureLoader.load(url);
      const imgMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const imgMesh = new THREE.Mesh(imgGeo, imgMat);

      const gx = Math.floor(Math.random() * 18 - 2);
      const gy = Math.floor(Math.random() * 7 - 5);
      
      // Position at the corner of 4 cells to stay aligned
      imgMesh.position.set(gx * cellSize, gy * cellSize, -2);

      const id = `image-${i}`;
      (imgMesh as any).bgId = id;
      backgroundMeshesRef.current.set(id, {
        mesh: imgMesh,
        baseScale: new THREE.Vector3(1, 1, 1),
        hoverScale: 1.0,
        type: 'image'
      });
      bgGroup.add(imgMesh);
    });

    // 5. Crossword Text "Paula Stankiute Creative Copyrighter"
    const createTextTexture = (text: string, color: string = 'black') => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      canvas.width = 256;
      canvas.height = 256;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 256, 256);
      
      // Add pink border
      ctx.strokeStyle = '#ffb7ce';
      ctx.lineWidth = 7;
      ctx.strokeRect(6, 6, 244, 244);

      ctx.fillStyle = color;
      ctx.font = 'bold 180px "SF Pro Display","SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 128);
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    // Crossword Layout
    // PAULA (H) intersects STANKIUTE (V) at 'U'
    // CREATIVE (H) intersects COPYRIGHTER (V) at 'R'
    const words = [
      // Row 1: Paula & Stankiute (Safe Area - Right)
      { text: "PAULA", x: -19, y: 0, dir: 'h' },
      { text: "STANKIUTE", x: -17, y: 6, dir: 'v' }, // Intersects at 'U' (index 2 of PAULA)
      
      // Row 2: Creative & Copyrighter (Safe Area - Right)
      { text: "CREATIVE", x: 4, y: 7, dir: 'h' },
      { text: "COPYWRITER", x: 4, y: 7, dir: 'v' } // Intersects at 'O' (index 1 of COPYRIGHTER)
    ];

    words.forEach((word, wordIdx) => {
      for (let i = 0; i < word.text.length; i++) {
        const char = word.text[i];
        const texture = createTextTexture(char);
        if (!texture) continue;

        const charGeo = new THREE.PlaneGeometry(cellSize, cellSize);
        const charMat = new THREE.MeshBasicMaterial({ map: texture });
        const charMesh = new THREE.Mesh(charGeo, charMat);

        const cx = word.dir === 'h' ? word.x + i : word.x;
        const cy = word.dir === 'v' ? word.y - i : word.y;

        charMesh.position.set(cx * cellSize + cellSize/2, cy * cellSize + cellSize/2, -46);
        
        const id = `char-${wordIdx}-${i}`;
        (charMesh as any).bgId = id;
        backgroundMeshesRef.current.set(id, {
          mesh: charMesh,
          baseScale: new THREE.Vector3(1, 1, 1),
          hoverScale: 1.0,
          type: 'text'
        });
        bgGroup.add(charMesh);
      }
    });

    let animationFrameId: number;
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      
      const time = performance.now() * 0.001;
      const w = rendererRef.current.domElement.clientWidth;
      const h = rendererRef.current.domElement.clientHeight;

      // Orbit light
      const radius = 100;
      const sunX = Math.cos(time * 0.3) * radius;
      const sunY = Math.sin(time * 0.3) * radius;
      orbitLight.position.set(sunX, sunY, 100);

      pointLight.position.set((mouse.current.x - 0.5) * 200, -(mouse.current.y - 0.5) * 200, 120);
      
      // Animate Background Elements
      backgroundMeshesRef.current.forEach((bg, id) => {
        const isHovered = (raycaster.current as any).hoveredBgId === id;
        const targetScale = isHovered ? 1.15 : 1.0;
        bg.hoverScale = THREE.MathUtils.lerp(bg.hoverScale, targetScale, 0.1);
        bg.mesh.scale.set(
          bg.baseScale.x * bg.hoverScale,
          bg.baseScale.y * bg.hoverScale,
          1
        );
        
        if (isHovered) {
          bg.mesh.rotation.z += 0.01;
        } else {
          bg.mesh.rotation.z = THREE.MathUtils.lerp(bg.mesh.rotation.z, 0, 0.05);
        }
      });

      starMeshesRef.current.forEach((star, id) => {
        const { main, border, baseScale } = star;
        const isHovered = hoveredStarId.current === id;
        
        const targetHoverScale = isHovered ? 1.2 : 1.0;
        star.hoverScale = THREE.MathUtils.lerp(star.hoverScale, targetHoverScale, 0.1);
        
        if (star.pulse > 0) {
          star.pulse -= 0.05;
        } else {
          star.pulse = 0;
        }
        
        const finalScale = baseScale * star.hoverScale * (1 + Math.sin(star.pulse * Math.PI) * 0.3);
        main.scale.setScalar(finalScale);
        if (border) border.scale.setScalar(finalScale);

        const rotY = Math.sin(time * 0.5 + (main as any).starId) * 0.15 + (isHovered ? time * 2 : 0);
        const rotX = Math.cos(time * 0.3 + (main as any).starId) * 0.15;
        main.rotation.y = rotY;
        main.rotation.x = rotX;
        if (border) {
          border.rotation.y = rotY;
          border.rotation.x = rotX;
        }
      });

      if (composerRef.current) {
        composerRef.current.render();
      } else {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !rendererRef.current || !cameraRef.current) return;
      const { width: w, height: h } = entries[0].contentRect;
      rendererRef.current.setSize(w, h);
      if (composerRef.current) {
        composerRef.current.setSize(w, h);
      }
      if (cameraRef.current instanceof THREE.PerspectiveCamera) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
      }
    });

    resizeObserver.observe(containerRef.current);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.current.x = (e.clientX - rect.left) / rect.width;
      mouse.current.y = (e.clientY - rect.top) / rect.height;

      const mouseCoords = new THREE.Vector2((mouse.current.x * 2) - 1, -(mouse.current.y * 2) + 1);
      raycaster.current.setFromCamera(mouseCoords, cameraRef.current);
      
      // Check Stars
      const starMeshes = Array.from(starMeshesRef.current.values()).map(s => (s as { main: THREE.Mesh }).main);
      const starIntersects = raycaster.current.intersectObjects(starMeshes);
      
      const newHoveredStarId = starIntersects.length > 0 ? (starIntersects[0].object as any).starId : null;
      if (newHoveredStarId !== hoveredStarId.current) {
        if (newHoveredStarId !== null) playChime(660 + Math.random() * 220);
        hoveredStarId.current = newHoveredStarId;
      }

      // Check Background Elements
      const bgMeshes = Array.from(backgroundMeshesRef.current.values()).map((b: any) => b.mesh);
      const bgIntersects = raycaster.current.intersectObjects(bgMeshes);
      const hoveredBg = bgIntersects.length > 0 ? backgroundMeshesRef.current.get((bgIntersects[0].object as any).bgId) : null;
      (raycaster.current as any).hoveredBgId = hoveredBg ? (bgIntersects[0].object as any).bgId : null;

      // Update cursor
      if (containerRef.current) {
        if (newHoveredStarId !== null || (hoveredBg && (hoveredBg.type === 'square' || hoveredBg.type === 'image'))) {
          containerRef.current.style.cursor = 'pointer';
        } else {
          containerRef.current.style.cursor = 'default';
        }
      }

      if (draggingStarId.current !== null) {
        onStarDrag(draggingStarId.current, e.clientX, e.clientY);
      }

      if (draggingBgId.current !== null) {
        const bg = backgroundMeshesRef.current.get(draggingBgId.current);
        if (bg) {
          const aspect = window.innerWidth / window.innerHeight;
          const camZ = cameraRef.current?.position.z || 400;
          const visibleHeight = 2 * Math.tan((75 * Math.PI) / 360) * camZ;
          const visibleWidth = visibleHeight * aspect;
          
          const targetX = (mouse.current.x - 0.5) * visibleWidth;
          const targetY = -(mouse.current.y - 0.5) * visibleHeight;
          
          // Snap to grid
          const gridSize = 1200;
          const cellSize = 50;
          const gx = Math.floor(targetX / cellSize);
          const gy = Math.floor(targetY / cellSize);
          
          if (bg.type === 'image') {
            // Images are 2x2, snap to corner
            bg.mesh.position.x = Math.round(targetX / cellSize) * cellSize;
            bg.mesh.position.y = Math.round(targetY / cellSize) * cellSize;
          } else {
            bg.mesh.position.x = gx * cellSize + cellSize / 2;
            bg.mesh.position.y = gy * cellSize + cellSize / 2;
          }
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseCoords = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.current.setFromCamera(mouseCoords, cameraRef.current);
      
      // Check Stars
      const starMeshes = Array.from(starMeshesRef.current.values()).map(s => (s as { main: THREE.Mesh }).main);
      const starIntersects = raycaster.current.intersectObjects(starMeshes);
      if (starIntersects.length > 0) {
        const id = (starIntersects[0].object as any).starId;
        draggingStarId.current = id;
        const star = starMeshesRef.current.get(id);
        if (star) {
          star.pulse = 1.0;
          playChime(440 + Math.random() * 110);
        }
        return;
      }

      // Check Background Elements (Squares and Images)
      const bgMeshes = Array.from(backgroundMeshesRef.current.values())
        .filter((b: any) => b.type === 'square' || b.type === 'image')
        .map((b: any) => b.mesh);
      const bgIntersects = raycaster.current.intersectObjects(bgMeshes);
      if (bgIntersects.length > 0) {
        const id = (bgIntersects[0].object as any).bgId;
        draggingBgId.current = id;
        playChime(330 + Math.random() * 50);
      }
    };

    const handleMouseUp = () => { 
      draggingStarId.current = null; 
      draggingBgId.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
      if (composerRef.current) {
        composerRef.current = null;
      }
      backgroundMeshesRef.current.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      backgroundMeshesRef.current.clear();
      starMeshesRef.current.forEach(({ main, border }) => {
        main.geometry.dispose();
        (main.material as THREE.Material).dispose();
        if (border) {
          border.geometry.dispose();
          (border.material as THREE.Material).dispose();
        }
      });
      starMeshesRef.current.clear();
    };
  }, []);

  // Sync stars with scene
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove stars that are no longer in the array
    const currentIds = new Set(stars.map(s => s.id));
    starMeshesRef.current.forEach((group, id) => {
      if (!currentIds.has(id)) {
        sceneRef.current?.remove(group.main);
        sceneRef.current?.remove(group.border);
        group.main.geometry.dispose();
        (group.main.material as THREE.Material).dispose();
        group.border.geometry.dispose();
        (group.border.material as THREE.Material).dispose();
        starMeshesRef.current.delete(id);
      }
    });

    stars.forEach((star) => {
      let starGroup = starMeshesRef.current.get(star.id);

      if (!starGroup) {
        const starShape = new THREE.Shape();
        const points = 5;
        const outerRadius = 15;
        const innerRadius = 6;
        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i / (points * 2)) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) starShape.moveTo(x, y);
          else starShape.lineTo(x, y);
        }
        starShape.closePath();

        const borderShape = new THREE.Shape();
        const borderScale = 1.0;
        for (let i = 0; i < points * 2; i++) {
          const radius = (i % 2 === 0 ? 15 : 6) * borderScale;
          const angle = (i / (points * 2)) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) borderShape.moveTo(x, y);
          else borderShape.lineTo(x, y);
        }
        borderShape.closePath();

        const extrudeSettings = {
          depth: 10,
          bevelEnabled: true,
          bevelThickness: 15,
          bevelSize: 15,
          bevelSegments: 20
        };

        const mainGeometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
        const borderGeometry = new THREE.ExtrudeGeometry(borderShape, { ...extrudeSettings, depth: 6 });

        const mainMaterial = new THREE.MeshPhysicalMaterial({
          color: star.color,
          metalness: 0.2,
          roughness: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          reflectivity: 0.9,
          emissive: star.color,
          emissiveIntensity: 0.2
        });

        const borderMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          metalness: 0.0,
          roughness: 0.9,
          emissive: 0xffffff,
          emissiveIntensity: 0.9
        });

        const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
        const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);

        (mainMesh as any).starId = star.id;

      //  sceneRef.current!.add(borderMesh);
        sceneRef.current!.add(mainMesh);

        starGroup = {
          main: mainMesh,
          border: borderMesh,
          baseScale: star.scale,
          hoverScale: 1.0,
          pulse: 0
        };
        starMeshesRef.current.set(star.id, starGroup);
      }

      const { main, border } = starGroup;
      // Map screen coordinates to 3D space for PerspectiveCamera
      const aspect = window.innerWidth / window.innerHeight;
      const camZ = cameraRef.current?.position.z || 500;
      const visibleHeight = 2 * Math.tan((75 * Math.PI) / 360) * camZ;
      const visibleWidth = visibleHeight * aspect;
      
      const x = (star.x / window.innerWidth - 0.5) * visibleWidth;
      const y = -(star.y / window.innerHeight - 0.5) * visibleHeight;
      const z = star.z;

      main.position.set(x, y, z);
      main.rotation.z = star.rotation;
      if (border) {
        border.position.set(x, y, z - 2);
        border.rotation.z = star.rotation;
      }
      starGroup.baseScale = star.scale;
    });
  }, [stars]);

  return <div ref={containerRef} className="absolute inset-0 pointer-events-none z-[1]" />;
};

export default function App() {
  const desktopRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stars, setStars] = useState<StarState[]>(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    color: ['#FFB7CE', '#AEC6CF', '#B3E5BE', '#E0BBE4', '#FFF9B1', '#FFDAB9', '#C8A2C8', '#87CEEB'][Math.floor(Math.random() * 8)],
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    z: Math.random() * 50 - 25,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    rotation: Math.random() * Math.PI * 2,
    scale: 0.25 + Math.random() * 0.25
  })));

  const [desktopIcons, setDesktopIcons] = useState<any[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const galleryItems = useMemo(() => buildGalleryItems(projects), [projects]);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [dockScale, setDockScale] = useState(1);

  const getFileUrl = (win: WindowState, file: string) =>
    `/Projects/${win.folderName || win.title.toLowerCase().replace(' ', '-')}/${file}`;

  const getCurrentFileUrl = (win: WindowState) =>
    win.videoUrl || (win.files?.[0] ? getFileUrl(win, win.files[0]) : null);

  const getProjectFolderIndex = (win: WindowState) =>
    projects.findIndex((project) => project.folderName === win.folderName);

  const navigateProjectWindow = (winId: string, direction: -1 | 1) => {
    if (projects.length === 0) return;
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== winId || w.type !== 'project-folder') return w;
        const currentIndexRaw = getProjectFolderIndex(w);
        const currentIndex = currentIndexRaw >= 0 ? currentIndexRaw : 0;
        const nextFolderIndex = (currentIndex + direction + projects.length) % projects.length;
        const nextProject = projects[nextFolderIndex];

        return {
          ...w,
          title: nextProject.title,
          folderName: nextProject.folderName,
          files: nextProject.files,
          videoUrl: undefined
        };
      })
    );
  };

  const firstDockVideo = useMemo(() => {
    for (const project of projects) {
      const videoFile = project.files.find((file) => ['mp4', 'mov', 'webm'].includes((file.toLowerCase().split('.').pop() || '')));
      if (videoFile) {
        return {
          title: videoFile,
          url: `/Projects/${project.folderName}/${videoFile}`
        };
      }
    }
    return null;
  }, [projects]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const fetchProjectsFrom = async (url: string) => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Request failed for ${url}: ${response.status}`);
          }
          const data = await response.json();
          if (!Array.isArray(data)) {
            throw new Error(`Response is not an array for ${url}`);
          }
          return data;
        };

        let projects: any[] = [];
        try {
          projects = await fetchProjectsFrom('/api/projects');
        } catch (primaryError) {
          if (window.location.port !== '3000') {
            projects = await fetchProjectsFrom('http://localhost:3000/api/projects');
          } else {
            throw primaryError;
          }
        }
        setProjects(projects);
        
        const aboutIcon = { 
          id: 'about', 
          type: 'about' as const, 
          title: 'About Me', 
          label: 'About Me',
          icon: <User className="text-blue-400" size={48} />
        };

        const projectIcons = projects.map((p: any, i: number) => ({
          ...p,
          type: 'project-folder' as const,
          label: p.title,
          icon: <Folder className={`text-${['yellow', 'green', 'blue', 'pink'][i % 4]}-400 fill-${['yellow', 'green', 'blue', 'pink'][i % 4]}-400/20`} size={48} />
        }));

        const allBaseIcons = [aboutIcon, ...projectIcons];
        const iconStepX = 98;
        const iconStepY = 108;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const maxRowsByViewport = viewportWidth < 900 ? 4 : (viewportWidth < 1300 ? 3 : 2);
        const startY = 55;
        const bottomReserved = 150; // keep clear of dock area
        const usableHeight = Math.max(120, viewportHeight - startY - bottomReserved);
        const maxRowsByHeight = Math.max(1, Math.floor(usableHeight / iconStepY) + 1);
        const rows = Math.min(maxRowsByViewport, maxRowsByHeight, Math.max(1, allBaseIcons.length));
        const columns = Math.max(1, Math.ceil(allBaseIcons.length / rows));
        const gridWidth = ((columns - 1) * iconStepX) + 80;
        const horizontalBias = Math.max(320, viewportWidth * 0.08);
        const startX = Math.max(20, ((viewportWidth - gridWidth) / 2) - horizontalBias);

        const allIcons = allBaseIcons.map((icon, i) => {
          const row = i % rows;
          const col = Math.floor(i / rows);
          return {
            ...icon,
            x: startX + (col * iconStepX),
            y: startY + (row * iconStepY)
          };
        });

        const projectIconIndexes = allIcons
          .map((icon, index) => (icon.type === 'project-folder' ? index : -1))
          .filter((index) => index >= 0);

        // Push two random project icons slightly away from the cluster for a more organic desktop layout.
        const displacedIndexes = projectIconIndexes
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(2, projectIconIndexes.length));

        displacedIndexes.forEach((index) => {
          const xOffset = (Math.random() < 0.5 ? -1 : 1) * (22 + Math.random() * 30);
          const yOffset = (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 22);
          const displacedIcon = allIcons[index];
          if (!displacedIcon) return;

          displacedIcon.x = Math.max(200, Math.min(displacedIcon.x + xOffset, viewportWidth - 90));
          displacedIcon.y = Math.max(300, Math.min(displacedIcon.y + yOffset, viewportHeight - 140));
        });

        setDesktopIcons(allIcons);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchProjects();
  }, []);

  const handleIconDragEnd = (id: string, info: { offset: { x: number, y: number } }) => {
    setDesktopIcons(prev => prev.map(icon => {
      if (icon.id === id) {
        let nx = icon.x + info.offset.x;
        let ny = icon.y + info.offset.y;
        
        // Clamp to window boundaries
        // Icon width is ~80px, height is ~80px
        // Menu bar is 28px, Dock is ~80px
        nx = Math.max(10, Math.min(nx, window.innerWidth - 90));
        ny = Math.max(40, Math.min(ny, window.innerHeight - 140));
        
        return { ...icon, x: nx, y: ny };
      }
      return icon;
    }));
  };

  useEffect(() => {
    const driftInterval = setInterval(() => {
      setStars(prev => prev.map(s => {
        let nx = s.x + s.vx;
        let ny = s.y + s.vy;
        
        if (nx < 0) nx = window.innerWidth;
        if (nx > window.innerWidth) nx = 0;
        if (ny < 0) ny = window.innerHeight;
        if (ny > window.innerHeight) ny = 0;
        
        return { ...s, x: nx, y: ny };
      }));
    }, 16);
    return () => clearInterval(driftInterval);
  }, []);

  const handleStarDrag = (id: number, x: number, y: number) => {
    setStars(prev => prev.map(s => s.id === id ? { ...s, x, y } : s));
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fitDockToViewport = () => {
      if (!dockRef.current) return;
      const dockWidth = dockRef.current.scrollWidth;
      const dockHeight = dockRef.current.scrollHeight;
      const availableWidth = Math.max(1, window.innerWidth - 16);
      const availableHeight = Math.max(1, window.innerHeight - 16);
      const widthScale = availableWidth / Math.max(1, dockWidth);
      const heightScale = availableHeight / Math.max(1, dockHeight);
      const nextScale = Math.min(1, widthScale, heightScale);
      setDockScale(nextScale);
    };

    fitDockToViewport();
    window.addEventListener('resize', fitDockToViewport);

    const observer = new ResizeObserver(() => fitDockToViewport());
    if (dockRef.current) observer.observe(dockRef.current);

    return () => {
      window.removeEventListener('resize', fitDockToViewport);
      observer.disconnect();
    };
  }, []);

  const openWindow = (type: WindowState['type'], title: string, files?: string[], videoUrl?: string, folderName?: string) => {
    const id = type === 'project-folder' ? `${type}-${title}` : (type === 'video-player' ? `${type}-${title}` : type);
    const existing = windows.find(w => w.id === id);
    if (existing) {
      focusWindow(id);
      return;
    }

    const newWindow: WindowState = {
      id,
      title,
      isOpen: true,
      isMinimized: false,
      zIndex: maxZIndex + 1,
      type,
      width: type === 'video-player' ? 800 : 600,
      height: type === 'video-player' ? 500 : (type === 'about' ? 560 : 450),
      x: 100 + (windows.length * 30),
      y: 100 + (windows.length * 30),
      files,
      videoUrl,
      folderName
    };

    setWindows([...windows, newWindow]);
    setMaxZIndex(maxZIndex + 1);
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
  };

  const focusWindow = (id: string) => {
    setWindows(windows.map(w => {
      if (w.id === id) {
        return { ...w, zIndex: maxZIndex + 1 };
      }
      return w;
    }));
    setMaxZIndex(maxZIndex + 1);
  };

  const handleUpdate = (id: string, updates: Partial<WindowState>) => {
    setWindows(windows.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const addStar = () => {
    const newStar: StarState = {
      id: Date.now(),
      color: ['#FFB7CE', '#AEC6CF', '#B3E5BE', '#E0BBE4', '#FFF9B1', '#FFDAB9', '#C8A2C8', '#87CEEB'][Math.floor(Math.random() * 8)],
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random() * 50 - 25,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      rotation: Math.random() * Math.PI * 2,
      scale: 0.25 + Math.random() * 0.7
    };
    setStars(prev => [...prev, newStar]);
  };

  return (
    <div ref={desktopRef} className="relative w-full h-screen overflow-hidden bg-[#fdfdfd] selection:bg-blue-500/30">
      {/* <CheckeredBackground /> */}
      <ThreeWorld windows={windows} stars={stars} onStarDrag={handleStarDrag} />

      {/* Top Menu Bar */}
      <div className="absolute top-0 w-full h-7 bg-black/20 backdrop-blur-md flex items-center justify-between px-4 text-[13px] font-medium text-white/90 z-[100]">
        <div className="flex gap-4 items-center">
          <span className="font-bold">Portfolio</span>
          <span className="hidden md:inline">File</span>
          <span className="hidden md:inline">Edit</span>
          <span className="hidden md:inline">View</span>
          <span className="hidden md:inline">Go</span>
          <span className="hidden md:inline">Window</span>
          <span className="hidden md:inline">Help</span>
        </div>
        <div className="flex gap-4 items-center">
          <Globe size={14} />
          <Search size={14} />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Desktop Icons */}
      {desktopIcons.map(icon => (
        <motion.div 
          key={icon.id} 
          drag
          dragMomentum={false}
          dragConstraints={desktopRef}
          dragElastic={0}
          animate={{ x: 0, y: 0 }}
          transition={{ duration: 0 }}
          onDragEnd={(_, info) => handleIconDragEnd(icon.id, info)}
          className="absolute z-10"
          style={{ left: icon.x, top: icon.y }}
        >
          <DesktopIcon 
            icon={icon.icon} 
            label={icon.label} 
            onClick={() => openWindow(icon.type, icon.title, (icon as any).files, undefined, (icon as any).folderName)}
          />
        </motion.div>
      ))}

      {/* Windows Layer */}
      <div className="relative w-full h-full pt-7 pb-20">
        <AnimatePresence>
          {windows.map(win => (
            <MacWindow 
              key={win.id} 
              window={win} 
              onClose={() => closeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
              onUpdate={handleUpdate}
              onNavigatePrev={() => navigateProjectWindow(win.id, -1)}
              onNavigateNext={() => navigateProjectWindow(win.id, 1)}
              canNavigate={win.type === 'project-folder' && projects.length > 1}
            >
                {win.type === 'stars' && (
                  <div className="flex flex-col items-center justify-center h-full gap-6">
                    <div className="p-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg animate-pulse">
                      <StarIcon size={64} className="text-white" />
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold">Star Factory</h2>
                      <p className="text-gray-500">Create more metallic stars for your desktop</p>
                    </div>
                    <button 
                      onClick={addStar}
                      className="px-8 py-3 bg-black text-white rounded-full font-bold hover:scale-105 transition-transform active:scale-95"
                    >
                      Spawn New Star
                    </button>
                  </div>
                )}
                {win.type === 'gallery' && <MasonryGallery items={galleryItems} />}
                {win.type === 'about' && (
             <div className="space-y-4">
             <h1 className="text-2xl font-bold ">Hello, I'm Paula.</h1>
             <p className="text-gray-600 leading-relaxed">
               I am a creative copywriter and narrative strategist who builds worlds with words. 
               This portfolio is a digital study of how language and interface intersect—a tribute 
               to the classic desktops where my first stories were typed.
             </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
               <div className="p-4 bg-gray-50 rounded-lg border border-black/5">
                 <h3 className="font-bold text-sm mb-1 uppercase tracking-wider text-black/40">Expertise</h3>
                 <p className="text-xs text-gray-500 font-medium">Concepting, Brand Voice, Storytelling, UX Writing</p>
               </div>
               <div className="p-4 bg-gray-50 rounded-lg border border-black/5">
                 <h3 className="font-bold text-sm mb-1 uppercase tracking-wider text-black/40">Home Base</h3>
                 <p className="text-xs text-gray-500 font-medium">Vilnius, Lithuania</p>
               </div>
             </div>
            <div className="pt-2">
              <img
                src="/Photos/hi.JPG"
                alt="Paula portrait"
                className="w-full h-auto max-h-[280px] object-cover rounded-[26px] border border-black/5 shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
           </div>
                )}
                {win.type === 'project-folder' && (
                  <div className="flex flex-col h-full gap-4">
                    <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-2xl relative group border border-white/10">
                      {(() => {
                        const currentFile = getCurrentFileUrl(win);
                        if (!currentFile) return <div className="flex items-center justify-center h-full text-white/20">Empty Folder</div>;
                        
                        const ext = currentFile.toLowerCase().split('.').pop();
                        const isVideo = ['mp4', 'mov', 'webm'].includes(ext || '');
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
                        const isPdf = ext === 'pdf';

                        if (isVideo) {
                          return (
                            <video 
                              key={currentFile}
                              controls 
                              autoPlay 
                              muted
                              playsInline
                              preload="auto"
                              className="w-full h-full object-contain"
                            >
                              <source src={currentFile} type={ext === 'mov' ? 'video/quicktime' : 'video/mp4'} />
                              <source src={currentFile} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          );
                        } else if (isImage) {
                          return (
                            <button
                              onClick={() => setExpandedImageUrl(currentFile)}
                              className="w-full h-full cursor-zoom-in"
                              title="Click to expand image"
                            >
                              <img 
                                key={currentFile}
                                src={currentFile} 
                                alt="Project Content" 
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </button>
                          );
                        } else if (isPdf) {
                          return (
                            <object 
                              key={currentFile}
                              data={currentFile} 
                              type="application/pdf"
                              className="w-full h-full bg-white"
                            >
                              <iframe 
                                src={currentFile} 
                                className="w-full h-full bg-white"
                                title="PDF Viewer"
                              />
                            </object>
                          );
                        } else {
                          return (
                            <div className="flex flex-col items-center justify-center h-full text-white/40 gap-4">
                              <File size={64} />
                              <p className="text-sm font-medium">{currentFile.split('/').pop()}</p>
                              <a 
                                href={currentFile} 
                                download 
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
                              >
                                Download File
                              </a>
                            </div>
                          );
                        }
                      })()}
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-lg px-4 py-2 rounded-full text-white text-[11px] font-bold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 border border-white/10">
                        {win.videoUrl ? win.videoUrl.split('/').pop() : (win.files?.[0] || win.title)}
                      </div>
                    </div>
                    <div className="h-28 flex gap-6 p-4 items-center overflow-x-auto custom-scrollbar bg-white/5 rounded-xl border border-white/10">
                      {win.files?.map((file, i) => {
                        const ext = file.toLowerCase().split('.').pop();
                        const isVideo = ['mp4', 'mov', 'webm'].includes(ext || '');
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
                        const isPdf = ext === 'pdf';
                        
                        const fileUrl = getFileUrl(win, file);
                        const isActive = (getCurrentFileUrl(win) || '').includes(file);

                        return (
                          <div 
                            key={i} 
                            className="flex flex-col items-center gap-2 min-w-[90px] group cursor-pointer"
                            onClick={() => handleUpdate(win.id, { videoUrl: fileUrl })}
                          >
                            <div className={`p-3 rounded-2xl transition-all duration-200 shadow-sm ${
                              isActive
                                ? 'bg-blue-500 scale-105 shadow-blue-500/50' 
                                : 'bg-blue-500/10 group-hover:bg-blue-500/20 group-active:scale-95'
                            }`}>
                              {isVideo && <Camera size={28} className={isActive ? 'text-white' : 'text-blue-500'} />}
                              {isImage && <ImageIcon size={28} className={isActive ? 'text-white' : 'text-blue-500'} />}
                              {isPdf && <FileText size={28} className={isActive ? 'text-white' : 'text-blue-500'} />}
                              {!isVideo && !isImage && !isPdf && <File size={28} className={isActive ? 'text-white' : 'text-blue-500'} />}
                            </div>
                            <span className={`text-[10px] font-medium text-center truncate w-full px-1 ${
                              isActive
                                ? 'text-blue-600 font-bold'
                                : 'text-black/60'
                            }`}>{file}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {win.type === 'video-player' && (
                  <NeonCameraView />
                )}
                {win.type === 'folder' && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <Folder size={64} className="opacity-20" />
                    <p>This folder is empty</p>
                  </div>
                )}
                {win.type === 'contact' && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold">Contacts</h2>
                    <div className="space-y-3">
                      <a
                        href={CONTACT_LINKEDIN}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-100 rounded border border-black/5 hover:bg-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <MessageSquare size={18} className="text-blue-500" />
                          <div>
                            <p className="text-sm font-semibold">LinkedIn</p>
                            <p className="text-xs text-black/60">Open LinkedIn profile</p>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 font-semibold">Open</span>
                      </a>
                      <a
                        href={`tel:${CONTACT_PHONE.replace(/\s+/g, '')}`}
                        className="flex items-center justify-between p-3 bg-gray-100 rounded border border-black/5 hover:bg-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Phone size={18} className="text-emerald-500" />
                          <div>
                            <p className="text-sm font-semibold">Phone</p>
                            <p className="text-xs text-black/60">{CONTACT_PHONE}</p>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-600 font-semibold">Call</span>
                      </a>
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="flex items-center justify-between p-3 bg-gray-100 rounded border border-black/5 hover:bg-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Mail size={18} className="text-blue-500" />
                          <div>
                            <p className="text-sm font-semibold">Email</p>
                            <p className="text-xs text-black/60">{CONTACT_EMAIL}</p>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 font-semibold">Compose</span>
                      </a>
                    </div>
                  </div>
                )}
              </MacWindow>
          ))}
        </AnimatePresence>
      </div>


      {/* Dock */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-[200]"
        style={{ bottom: 'clamp(8px, 3vh, 24px)' }}
      >
        <div
          ref={dockRef}
          className="bg-white/10 backdrop-blur-3xl border border-white/30 flex items-end shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
          style={{
            padding: 'clamp(6px, 1.05vh, 12px) clamp(8px, 1.2vh, 14px)',
            borderRadius: 'clamp(12px, 2.1vh, 22px)',
            gap: 'clamp(4px, 0.8vh, 10px)',
            transform: `scale(${dockScale})`,
            transformOrigin: 'bottom center'
          }}
        >
          <DockIcon icon={<Globe className="text-blue-400" />} label="Safari" onClick={() => {}} />
          <DockIcon icon={<MessageSquare className="text-green-400" />} label="Messages" onClick={() => openWindow('contact', 'Contacts')} />
          <DockIcon icon={<Mail className="text-blue-300" />} label="Mail" onClick={() => window.open(`mailto:${CONTACT_EMAIL}`, '_self')} />
          <DockIcon icon={<ImageIcon className="text-pink-400" />} label="Photos" onClick={() => openWindow('gallery', 'Photos')} />
          <DockIcon icon={<StarIcon className="text-yellow-400" />} label="Star Factory" onClick={() => openWindow('stars', 'Star Factory')} />
          <DockIcon
            icon={<Camera className="text-red-400" />}
            label="Media Player"
            onClick={() => {
              if (firstDockVideo) {
                openWindow('video-player', firstDockVideo.title, undefined, firstDockVideo.url);
              } else {
                openWindow('video-player', 'Media Player', undefined, '/Projects/unititled-4/olve1.mov');
              }
            }}
          />
          <DockIcon icon={<Music className="text-red-400" />} label="Music" onClick={() => {}} />
          <div className="w-[1px] bg-white/20 self-center" style={{ height: 'clamp(24px, 4vh, 40px)', marginInline: 'clamp(3px, 0.6vh, 8px)' }} />
          <DockIcon icon={<Folder className="text-yellow-400" />} label="Downloads" onClick={() => openWindow('folder', 'Downloads')} />
          <DockIcon icon={<Trash2 className="text-gray-400" />} label="Trash" onClick={() => {}} />
        </div>
      </div>

      <AnimatePresence>
        {expandedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setExpandedImageUrl(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/60 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedImageUrl(null);
              }}
            >
              <X size={32} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={expandedImageUrl}
              alt="Expanded project image"
              className="max-w-full max-h-full rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DesktopIcon = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="group flex flex-col items-center outline-none"
    style={{
      gap: 'clamp(0.2rem, 0.4vw, 0.4rem)',
      width: 'clamp(72px, 6.8vw, 122px)'
    }}
  >
    <div
      className="rounded-lg group-active:bg-blue-500/30 transition-colors flex items-center justify-center [&_svg]:w-full [&_svg]:h-full"
      style={{
        width: 'clamp(40px, 3.8vw, 70px)',
        height: 'clamp(40px, 3.8vw, 70px)',
        padding: 'clamp(2px, 0.25vw, 6px)'
      }}
    >
      {icon}
    </div>
    <span
      className="font-medium text-white drop-shadow-md bg-black/20 rounded group-hover:bg-blue-500 group-active:bg-blue-600 transition-colors"
      style={{
        fontSize: 'clamp(10px, 0.7vw, 14px)',
        padding: 'clamp(2px, 0.25vw, 4px) clamp(4px, 0.5vw, 8px)'
      }}
    >
      {label}
    </span>
  </button>
);

const DockIcon = ({ icon, label, onClick, noBackground = false }: { icon: React.ReactNode, label: string, onClick: () => void, noBackground?: boolean }) => (
  <motion.button
    whileHover={{ y: -12, scale: 1.15 }}
    onClick={onClick}
    className={`relative group flex items-center justify-center transition-all [&_svg]:w-[clamp(18px,8.5vh,30px)] [&_svg]:h-[clamp(18px,8.5vh,30px)] ${noBackground ? '' : 'bg-white/10 border border-white/10 shadow-sm'}`}
    style={{
      width: 'clamp(40px, 9.5vh, 62px)',
      height: 'clamp(40px, 9.5vh, 62px)',
      borderRadius: 'clamp(8px, 1.4vh, 14px)'
    }}
  >
    {icon}
    <div
      className="absolute left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
      style={{
        top: 'clamp(-38px, -5.8vh, -24px)',
        fontSize: 'clamp(9px, 1.05vh, 12px)',
        padding: 'clamp(3px, 0.45vh, 5px) clamp(6px, 0.9vh, 10px)'
      }}
    >
      {label}
    </div>
  </motion.button>
);
