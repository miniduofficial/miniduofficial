#!/usr/bin/env python3
"""Build the Noble Homer animated coin logo as a self-contained GLB."""

import json
import math
import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parent
TEXTURE = ROOT / "logo1.png"
OUTPUT = ROOT / "assets" / "models" / "noble-homer-logo.glb"
SEGMENTS = 64
RADIUS = 1.0
HALF_DEPTH = 0.09


def floats(values):
    return struct.pack(f"<{len(values)}f", *values)


def ushorts(values):
    return struct.pack(f"<{len(values)}H", *values)


def png_chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def marble_texture(width=512, height=64):
    """Create a seamless cream-and-olive marble texture for the model edge."""
    rows = bytearray()
    for y in range(height):
        rows.append(0)
        for x in range(width):
            phase = (
                x * 0.026
                + 2.7 * math.sin(y * 0.115 + 1.1 * math.sin(x * 0.009))
                + 0.9 * math.sin(x * 0.031 + y * 0.073)
                + 0.34 * math.sin(x * 0.087 - y * 0.12)
            )
            fine_phase = x * 0.071 - y * 0.086 + 1.8 * math.sin(x * 0.014 + y * 0.16)
            vein = math.exp(-((math.sin(phase) / 0.07) ** 2))
            fine_vein = math.exp(-((math.sin(fine_phase) / 0.052) ** 2))
            cloud = 0.5 + 0.5 * math.sin(x * 0.017 + 0.8 * math.sin(y * 0.15) + math.sin(x * 0.006))
            base = (218 + 7 * cloud, 212 + 6 * cloud, 194 + 5 * cloud)
            olive = (73, 83, 66)
            mix = min(0.86, 0.7 * vein + 0.18 * fine_vein)
            rows.extend((*[max(0, min(255, round(base[i] * (1 - mix) + olive[i] * mix))) for i in range(3)], 255))
    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", header) + png_chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + png_chunk(b"IEND", b"")


def main():
    blob = bytearray()
    views = []
    accessors = []

    def add_view(data, target=None):
        while len(blob) % 4:
            blob.append(0)
        offset = len(blob)
        blob.extend(data)
        view = {"buffer": 0, "byteOffset": offset, "byteLength": len(data)}
        if target is not None:
            view["target"] = target
        views.append(view)
        return len(views) - 1

    def add_accessor(view, component_type, count, kind, minimum=None, maximum=None):
        accessor = {
            "bufferView": view,
            "componentType": component_type,
            "count": count,
            "type": kind,
        }
        if minimum is not None:
            accessor["min"] = minimum
        if maximum is not None:
            accessor["max"] = maximum
        accessors.append(accessor)
        return len(accessors) - 1

    def disc(z, normal_z, reverse_uv=False):
        positions = [0.0, 0.0, z]
        normals = [0.0, 0.0, normal_z]
        uvs = [0.5, 0.5]
        for i in range(SEGMENTS + 1):
            angle = 2 * math.pi * i / SEGMENTS
            x, y = RADIUS * math.cos(angle), RADIUS * math.sin(angle)
            positions.extend((x, y, z))
            normals.extend((0.0, 0.0, normal_z))
            u = (1.0 - x / RADIUS) / 2 if reverse_uv else (1.0 + x / RADIUS) / 2
            # glTF textures use a top-left UV origin, so positive model-space Y
            # must map toward V=0 to preserve the source artwork's orientation.
            uvs.extend((u, (1.0 - y / RADIUS) / 2))
        indices = []
        for i in range(SEGMENTS):
            if normal_z > 0:
                indices.extend((0, i + 1, i + 2))
            else:
                indices.extend((0, i + 2, i + 1))
        return positions, normals, uvs, indices

    def primitive(positions, normals, uvs, indices, material):
        vertex_count = len(positions) // 3
        position_view = add_view(floats(positions), 34962)
        normal_view = add_view(floats(normals), 34962)
        uv_view = add_view(floats(uvs), 34962)
        index_view = add_view(ushorts(indices), 34963)
        return {
            "attributes": {
                "POSITION": add_accessor(
                    position_view,
                    5126,
                    vertex_count,
                    "VEC3",
                    [-RADIUS, -RADIUS, -HALF_DEPTH],
                    [RADIUS, RADIUS, HALF_DEPTH],
                ),
                "NORMAL": add_accessor(normal_view, 5126, vertex_count, "VEC3"),
                "TEXCOORD_0": add_accessor(uv_view, 5126, vertex_count, "VEC2"),
            },
            "indices": add_accessor(index_view, 5123, len(indices), "SCALAR"),
            "material": material,
        }

    front = primitive(*disc(HALF_DEPTH, 1.0), material=0)
    back = primitive(*disc(-HALF_DEPTH, -1.0, reverse_uv=True), material=0)

    side_positions, side_normals, side_uvs, side_indices = [], [], [], []
    for i in range(SEGMENTS + 1):
        angle = 2 * math.pi * i / SEGMENTS
        x, y = RADIUS * math.cos(angle), RADIUS * math.sin(angle)
        for z, v in ((HALF_DEPTH, 1.0), (-HALF_DEPTH, 0.0)):
            side_positions.extend((x, y, z))
            side_normals.extend((math.cos(angle), math.sin(angle), 0.0))
            side_uvs.extend((i / SEGMENTS, v))
    for i in range(SEGMENTS):
        a, b, c, d = 2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 3
        side_indices.extend((a, b, d, a, d, c))
    side = primitive(side_positions, side_normals, side_uvs, side_indices, material=1)

    image_view = add_view(TEXTURE.read_bytes())
    marble_view = add_view(marble_texture())
    # Uneven spacing gives the rotation the weight of a carved object being
    # turned by hand rather than the constant velocity of a modern UI spinner.
    times = [0.0, 0.58, 1.48, 2.38, 2.94, 3.2]
    rotations = []
    for degrees in (0, 28, 132, 270, 342, 360):
        half_angle = math.radians(degrees) / 2
        rotations.extend((0.0, math.sin(half_angle), 0.0, math.cos(half_angle)))
    time_view = add_view(floats(times))
    rotation_view = add_view(floats(rotations))
    time_accessor = add_accessor(time_view, 5126, len(times), "SCALAR", [0.0], [3.2])
    rotation_accessor = add_accessor(rotation_view, 5126, len(times), "VEC4")

    gltf = {
        "asset": {"version": "2.0", "generator": "Noble Homer GLB Builder"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "Noble Homer Coin"}],
        "meshes": [{"name": "Noble Homer Logo", "primitives": [front, back, side]}],
        "materials": [
            {
                "name": "Logo Face",
                "pbrMetallicRoughness": {
                    "baseColorTexture": {"index": 0},
                    "metallicFactor": 0.0,
                    "roughnessFactor": 0.72,
                },
                "alphaMode": "BLEND",
            },
            {
                "name": "Veined Marble Edge",
                "pbrMetallicRoughness": {
                    "baseColorTexture": {"index": 1},
                    "baseColorFactor": [1.0, 1.0, 1.0, 1.0],
                    "metallicFactor": 0.0,
                    "roughnessFactor": 0.68,
                },
            },
        ],
        "textures": [{"sampler": 0, "source": 0}, {"sampler": 0, "source": 1}],
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
        "images": [
            {"bufferView": image_view, "mimeType": "image/png", "name": "Noble Homer Mark"},
            {"bufferView": marble_view, "mimeType": "image/png", "name": "Cream Olive Marble"},
        ],
        "animations": [
            {
                "name": "SpinOnce",
                "samplers": [{"input": time_accessor, "output": rotation_accessor, "interpolation": "LINEAR"}],
                "channels": [{"sampler": 0, "target": {"node": 0, "path": "rotation"}}],
            }
        ],
        "buffers": [{"byteLength": len(blob)}],
        "bufferViews": views,
        "accessors": accessors,
    }

    json_data = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_data += b" " * ((4 - len(json_data) % 4) % 4)
    blob += b"\x00" * ((4 - len(blob) % 4) % 4)
    total_length = 12 + 8 + len(json_data) + 8 + len(blob)
    glb = bytearray(struct.pack("<III", 0x46546C67, 2, total_length))
    glb.extend(struct.pack("<II", len(json_data), 0x4E4F534A))
    glb.extend(json_data)
    glb.extend(struct.pack("<II", len(blob), 0x004E4942))
    glb.extend(blob)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(glb)
    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({len(glb):,} bytes)")


if __name__ == "__main__":
    main()
