"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { Room } from "livekit-client";

const COUNT = 9000; // fewer particles = smoother animation

export default function VoiceSphere({ room }: { room: Room }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sphereRef = useRef<THREE.Points | null>(null);
  const originalPositionsRef = useRef<Float32Array | null>(null);

  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // 🔊 Listen for mute updates from parent
  useEffect(() => {
    function handleMuteEvent(event: any) {
      if (event.data?.type === "VOICE_AGENT_MIC_STATE") {
        setIsMuted(event.data.muted);
      }
    }
    window.addEventListener("message", handleMuteEvent);
    return () => window.removeEventListener("message", handleMuteEvent);
  }, []);

  // 🎤 MIC VOLUME DETECTION
  useEffect(() => {
    let analyser: AnalyserNode | null = null;
    let audioCtx: AudioContext | null = null;

    async function initMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);

        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        source.connect(analyser);

        const interval = setInterval(() => {
          if (!analyser || isMuted) {
            setVolume(0);
            return;
          }

          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);

          const avg = array.reduce((a, b) => a + b, 0) / array.length;
          setVolume(avg);
        }, 200);

        return () => clearInterval(interval);
      } catch (err) {
        console.error("Mic failed:", err);
      }
    }

    initMic();
  }, [isMuted]);

  const isSpeaking = volume > 20 && !isMuted;

  // 🎨 CREATE SPHERE
  useEffect(() => {
    if (!containerRef.current) return;

    // 🔥 FIX: Remove old canvases (React Strict Mode)
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);

    function spherical(i: number) {
      const phi = Math.acos(-1 + (2 * i) / COUNT);
      const theta = Math.sqrt(COUNT * Math.PI) * phi;
      return {
        x: 7 * Math.cos(theta) * Math.sin(phi),
        y: 7 * Math.sin(theta) * Math.sin(phi),
        z: 7 * Math.cos(phi),
      };
    }

    for (let i = 0; i < COUNT; i++) {
      const p = spherical(i);
      const id = i * 3;
      positions[id] = p.x;
      positions[id + 1] = p.y;
      positions[id + 2] = p.z;
    }

    originalPositionsRef.current = positions.slice();

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.07,
      color: "#7c3aed",
      opacity: 0.95,
      transparent: true,
    });

    const points = new THREE.Points(geometry, material);
    sphereRef.current = points;
    scene.add(points);

    // LOOP
    function animate() {
      requestAnimationFrame(animate);

      if (!isSpeaking) points.rotation.y += 0.002;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 🌊 SMOOTH WAVE DISTURBANCE
  const disturbWave = () => {
    const points = sphereRef.current;
    const original = originalPositionsRef.current;
    if (!points || !original) return;

    const pos = points.geometry.attributes.position.array;

    const strength = Math.min(volume / 80, 0.4); // small, smooth movement

    for (let i = 0; i < pos.length; i += 3) {
      const wave = Math.sin(i * 0.002 + volume * 0.2) * strength;
      pos[i] = original[i] + wave;
      pos[i + 1] = original[i + 1] + wave;
      pos[i + 2] = original[i + 2] + wave;
    }

    points.geometry.attributes.position.needsUpdate = true;
  };

  // 🔁 WAVE ANIMATION LOOP
  useEffect(() => {
    if (!sphereRef.current) return;

    if (isSpeaking) {
      const interval = setInterval(() => {
        disturbWave();
      }, 60);

      return () => clearInterval(interval);
    } else {
      restore();
    }
  }, [isSpeaking, volume]);

  // ✨ SMOOTH RESTORE
  const restore = () => {
    const points = sphereRef.current;
    const original = originalPositionsRef.current;
    if (!points || !original) return;

    const pos = points.geometry.attributes.position.array;

    for (let i = 0; i < pos.length; i++) {
      gsap.to(pos, {
        [i]: original[i],
        duration: 1.2,
        ease: "power2.out",
        onUpdate: () => {
          points.geometry.attributes.position.needsUpdate = true;
        },
      });
    }
  };

  return <div ref={containerRef} className="w-full h-full" />;
}
