import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

let scene, camera, renderer, controls, model;
let isAnimating = true;
let isWireframe = false;
let entranceAnimation = { progress: 0, active: true };

// Initialize
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = null; // Transparent background
    scene.fog = new THREE.Fog(0x000000, 15, 60);

    // Camera - Start from dramatic angle
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(4, 3, 4);

    // Renderer
    const canvas = document.getElementById('canvas3d');
    renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        alpha: true // Enable transparency
    });
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NoToneMapping; // No tone mapping for maximum brightness
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3; // Fixed distance
    controls.maxDistance = 3; // Fixed distance - no zoom
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.enableZoom = false; // Disable zoom completely
    controls.enabled = false; // Disable during entrance animation

    // Lights
    setupLights();

    // Load Model
    loadModel();

    // Particles
    createParticles();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    setupNavigation();
    setupMobileMenu();

    // Start Animation
    animate();
}

function setupLights() {
    // Ambient Light - Maximum brightness
    const ambientLight = new THREE.AmbientLight(0xffffff, 8);
    scene.add(ambientLight);

    // Main Directional Light - Maximum
    const mainLight = new THREE.DirectionalLight(0xffffff, 10);
    mainLight.position.set(5, 10, 5);
    scene.add(mainLight);

    // Front light - Maximum
    const frontLight = new THREE.DirectionalLight(0xffffff, 8);
    frontLight.position.set(0, 5, 10);
    scene.add(frontLight);

    // Back light
    const backLight = new THREE.DirectionalLight(0xffffff, 6);
    backLight.position.set(0, 5, -10);
    scene.add(backLight);

    // Side lights
    const leftLight = new THREE.DirectionalLight(0xffffff, 6);
    leftLight.position.set(-10, 5, 0);
    scene.add(leftLight);

    const rightLight = new THREE.DirectionalLight(0xffffff, 6);
    rightLight.position.set(10, 5, 0);
    scene.add(rightLight);

    // Top light
    const topLight = new THREE.DirectionalLight(0xffffff, 8);
    topLight.position.set(0, 15, 0);
    scene.add(topLight);

    // Bottom light
    const bottomLight = new THREE.DirectionalLight(0xffffff, 6);
    bottomLight.position.set(0, -10, 0);
    scene.add(bottomLight);

    // Point Lights - Maximum brightness
    const pointLight1 = new THREE.PointLight(0xffffff, 10, 50);
    pointLight1.position.set(5, 3, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 10, 50);
    pointLight2.position.set(-5, 3, -5);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 8, 50);
    pointLight3.position.set(0, 5, 8);
    scene.add(pointLight3);

    const pointLight4 = new THREE.PointLight(0xffffff, 8, 50);
    pointLight4.position.set(0, -3, 5);
    scene.add(pointLight4);

    // Hemisphere Light - Maximum
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 6);
    scene.add(hemiLight);
}

function loadModel() {
    const loader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader();

    // Track loading progress
    let totalItems = 5; // 4 textures + 1 model
    let loadedItems = 0;

    const updateProgress = () => {
        loadedItems++;
        const progress = (loadedItems / totalItems) * 100;
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    };

    // Track texture loading
    const textures = {};

    const onTextureLoad = (name) => {
        return (texture) => {
            textures[name] = texture;
            updateProgress();
            console.log(`Texture ${name} loaded`);
        };
    };

    const onTextureError = (name) => {
        return (err) => {
            console.warn(`Texture ${name} loading error:`, err);
            updateProgress();
        };
    };

    // Load textures with error handling
    textureLoader.load(
        'gdgc/texture_diffuse_00.png',
        onTextureLoad('diffuse'),
        undefined,
        onTextureError('diffuse')
    );

    textureLoader.load(
        'gdgc/texture_normal_00.png',
        onTextureLoad('normal'),
        undefined,
        onTextureError('normal')
    );

    textureLoader.load(
        'gdgc/texture_roughness_00.png',
        onTextureLoad('roughness'),
        undefined,
        onTextureError('roughness')
    );

    textureLoader.load(
        'gdgc/texture_metallic_00.png',
        onTextureLoad('metallic'),
        undefined,
        onTextureError('metallic')
    );

    loader.load(
        'gdgc/base.obj',
        (object) => {
            model = object;

            // Apply materials with or without textures
            object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    // Use MeshBasicMaterial for maximum brightness and texture visibility
                    if (textures.diffuse) {
                        textures.diffuse.encoding = THREE.sRGBEncoding;
                        child.material = new THREE.MeshBasicMaterial({
                            map: textures.diffuse,
                            color: 0xffffff
                        });
                    } else {
                        // Fallback to standard material with maximum brightness
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xffffff,
                            metalness: 0,
                            roughness: 1,
                            emissive: 0xffffff,
                            emissiveIntensity: 1
                        });
                    }
                    
                    child.material.needsUpdate = true;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Center and scale model - Make it super tiny
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 0.12 / maxDim; // Super tiny size

            object.scale.setScalar(scale);
            object.position.sub(center.multiplyScalar(scale));
            object.position.y = 0;

            // Start hidden for entrance animation
            object.scale.setScalar(0);
            object.rotation.y = Math.PI * 2;

            scene.add(object);
            updateProgress();

            // Start entrance animation
            setTimeout(() => {
                startEntranceAnimation();
            }, 500);

            console.log('Model loaded successfully!');
        },
        (xhr) => {
            if (xhr.lengthComputable) {
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                console.log('Model ' + Math.round(percentComplete) + '% loaded');
            }
        },
        (error) => {
            console.error('Error loading model:', error);
            const loader = document.getElementById('loader');
            if (loader) {
                loader.innerHTML = 
                    '<div class="loader-content"><p style="color: #ef4444; font-size: 18px;">خطأ في تحميل المجسم</p><p style="color: #94a3b8; font-size: 14px;">تأكد من وجود ملف base.obj في مجلد gdgc</p></div>';
            }
        }
    );

    // Add environment map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x000000);
    const envMap = pmremGenerator.fromScene(envScene).texture;
    scene.environment = envMap;
}

function startEntranceAnimation() {
    entranceAnimation.active = true;
    entranceAnimation.progress = 0;
    
    // Hide loader after a moment
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
        controls.enabled = true;
    }, 2000);
}

function updateEntranceAnimation() {
    if (!entranceAnimation.active || !model) return;

    entranceAnimation.progress += 0.01;
    const progress = Math.min(entranceAnimation.progress, 1);

    // Easing function for smooth animation
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easedProgress = easeOutCubic(progress);

    // Scale animation - super tiny size
    const targetScale = 0.04; // Super tiny size (4% of original)
    const currentScale = easedProgress * targetScale;
    model.scale.setScalar(currentScale);

    // Rotation animation
    model.rotation.y = (1 - easedProgress) * Math.PI * 2;

    // Camera animation
    const startCamPos = { x: 4, y: 3, z: 4 };
    const endCamPos = { x: 1.5, y: 1.5, z: 3 };
    
    camera.position.x = startCamPos.x + (endCamPos.x - startCamPos.x) * easedProgress;
    camera.position.y = startCamPos.y + (endCamPos.y - startCamPos.y) * easedProgress;
    camera.position.z = startCamPos.z + (endCamPos.z - startCamPos.z) * easedProgress;
    camera.lookAt(0, 0, 0);

    if (progress >= 1) {
        entranceAnimation.active = false;
    }
}

function createParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    // Create particles with mixed colors (blue, red, yellow)
    for (let i = 0; i < particlesCount; i++) {
        // Position
        posArray[i * 3] = (Math.random() - 0.5) * 50;
        posArray[i * 3 + 1] = (Math.random() - 0.5) * 50;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 50;

        // Colors - randomly assign blue, red, or yellow
        const colorChoice = Math.random();
        if (colorChoice < 0.33) {
            // Blue
            colors[i * 3] = 0.15;
            colors[i * 3 + 1] = 0.39;
            colors[i * 3 + 2] = 0.92;
        } else if (colorChoice < 0.66) {
            // Red
            colors[i * 3] = 0.86;
            colors[i * 3 + 1] = 0.15;
            colors[i * 3 + 2] = 0.15;
        } else {
            // Yellow
            colors[i * 3] = 0.96;
            colors[i * 3 + 1] = 0.62;
            colors[i * 3 + 2] = 0.04;
        }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
}

function animate() {
    requestAnimationFrame(animate);

    // Update entrance animation
    updateEntranceAnimation();

    // Auto-rotate model (only after entrance animation)
    if (model && isAnimating && !entranceAnimation.active) {
        model.rotation.y += 0.005;
    }

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Close mobile menu if open
            const navLinksContainer = document.querySelector('.nav-links');
            if (navLinksContainer) {
                navLinksContainer.classList.remove('active');
            }
            
            // Smooth scroll to section
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Update active link on scroll and navbar style
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        const scrollPos = window.scrollY + 100;

        // Add scrolled class to navbar
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// Global functions for buttons
window.resetCamera = function() {
    camera.position.set(1.5, 1.5, 3);
    controls.target.set(0, 0, 0);
    controls.update();
}

window.toggleAnimation = function() {
    isAnimating = !isAnimating;
    const icon = document.getElementById('animIcon');
    if (icon) {
        icon.className = isAnimating ? 'fas fa-pause' : 'fas fa-play';
    }
}

window.toggleWireframe = function() {
    if (!model) return;
    
    isWireframe = !isWireframe;
    model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.material.wireframe = isWireframe;
        }
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) scale(1) rotate(0)';
                entry.target.style.filter = 'blur(0)';
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        section.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        observer.observe(section);
    });

    // Observe all cards
    document.querySelectorAll('.stat-card, .activity-card, .event-item, .benefit-item').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8) rotate(-5deg)';
        card.style.transition = `all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${index * 0.1}s`;
        observer.observe(card);
    });

    // Observe section headers
    document.querySelectorAll('.section-header').forEach(header => {
        header.style.opacity = '0';
        header.style.transform = 'translateY(30px)';
        header.style.filter = 'blur(5px)';
        header.style.transition = 'all 0.8s ease-out';
        observer.observe(header);
    });

    // Observe text content
    document.querySelectorAll('.about-text, .lead-text, .event-featured, .join-cta').forEach(text => {
        text.style.opacity = '0';
        text.style.transform = 'translateX(-30px)';
        text.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        observer.observe(text);
    });
}

// Start
init();

// Initialize scroll animations after page load
window.addEventListener('load', () => {
    setTimeout(initScrollAnimations, 500);
});
