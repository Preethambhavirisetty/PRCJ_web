import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useTryOnStore } from '@/stores/tryonStore';
function JewelryModel({ glbUrl, modelConfig }) {
    const groupRef = useRef(null);
    const { scene } = useGLTF(glbUrl);
    const { landmarks, adjustments } = useTryOnStore();
    const { size } = useThree();
    // Clone scene to avoid shared state
    const clonedScene = scene.clone(true);
    // Apply PBR material properties
    useEffect(() => {
        const { material_properties: mat } = modelConfig;
        if (!mat)
            return;
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                const mesh = child;
                if (mesh.material instanceof THREE.MeshStandardMaterial) {
                    if (mat.metalness !== undefined)
                        mesh.material.metalness = mat.metalness;
                    if (mat.roughness !== undefined)
                        mesh.material.roughness = mat.roughness;
                    if (mat.envMapIntensity !== undefined)
                        mesh.material.envMapIntensity = mat.envMapIntensity;
                    if (mat.clearcoat !== undefined) {
                        mesh.material.clearcoat = mat.clearcoat;
                    }
                }
            }
        });
    }, [glbUrl]);
    useFrame(() => {
        if (!groupRef.current || !landmarks)
            return;
        // Map normalized landmark coords to Three.js world space
        const scaleX = adjustments.scaleX * modelConfig.scale_x;
        const scaleY = adjustments.scaleY * modelConfig.scale_y;
        const scaleZ = modelConfig.scale_z;
        groupRef.current.scale.set(scaleX, scaleY, scaleZ);
        groupRef.current.rotation.set(THREE.MathUtils.degToRad(modelConfig.rotation_x), THREE.MathUtils.degToRad(modelConfig.rotation_y), THREE.MathUtils.degToRad(modelConfig.rotation_z));
        // Convert normalized [0,1] coords to NDC [-1,1]
        const ndcX = (landmarks.anchor_x * 2 - 1) + adjustments.offsetX * 0.01;
        const ndcY = -(landmarks.anchor_y * 2 - 1) + adjustments.offsetY * 0.01;
        // Project to world space at z=0 plane
        const vec = new THREE.Vector3(ndcX, ndcY, 0);
        vec.unproject(groupRef.current.parent?.parent ? groupRef.current.parent.parent.camera ?? new THREE.Camera() : new THREE.Camera());
        groupRef.current.position.set(ndcX * 3 + modelConfig.anchor_offset.x, ndcY * 3 + modelConfig.anchor_offset.y, modelConfig.anchor_offset.z);
    });
    return (_jsx("group", { ref: groupRef, children: _jsx("primitive", { object: clonedScene }) }));
}
export function TryOnCanvas({ modelConfig, videoRef, className }) {
    return (_jsx("div", { className: className, style: { position: 'absolute', inset: 0, pointerEvents: 'none' }, children: _jsxs(Canvas, { camera: { fov: 75, near: 0.1, far: 1000, position: [0, 0, 5] }, gl: { alpha: true, antialias: true, premultipliedAlpha: false }, style: { background: 'transparent' }, children: [_jsx("ambientLight", { intensity: 0.8 }), _jsx("directionalLight", { position: [5, 10, 5], intensity: 1.2, castShadow: true }), _jsx("pointLight", { position: [-5, 5, -5], intensity: 0.5, color: "#E8C97A" }), _jsxs(Suspense, { fallback: null, children: [modelConfig.glb_url && (_jsx(JewelryModel, { glbUrl: modelConfig.glb_url, modelConfig: modelConfig })), _jsx(Environment, { preset: modelConfig.lighting_preset ?? 'sunset' })] })] }) }));
}
