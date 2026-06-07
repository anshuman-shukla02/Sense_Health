// Sense Health — Shield Check SVG
// Trust/privacy shield with organic accents for Permissions screen
import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path, Circle, Defs, LinearGradient as SvgGradient,
  Stop, G, Rect,
} from 'react-native-svg';

export default function ShieldCheckSvg({ width = 120, height = 140, style }) {
  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox="0 0 120 140">
        <Defs>
          <SvgGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#52A8A2" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#3A7D78" stopOpacity="0.9" />
          </SvgGradient>
          <SvgGradient id="shieldInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#85C7C3" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#52A8A2" stopOpacity="0.2" />
          </SvgGradient>
          <SvgGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#E8F4F3" />
          </SvgGradient>
        </Defs>

        {/* Outer glow */}
        <Path
          d="M60,8 L100,24 C100,24 105,65 100,85 C92,112 60,132 60,132 C60,132 28,112 20,85 C15,65 20,24 20,24 Z"
          fill="#52A8A2"
          opacity="0.08"
        />

        {/* Shield body */}
        <Path
          d="M60,15 L95,28 C95,28 99,64 95,82 C88,106 60,124 60,124 C60,124 32,106 25,82 C21,64 25,28 25,28 Z"
          fill="url(#shieldGrad)"
        />

        {/* Inner shield highlight */}
        <Path
          d="M60,22 L88,33 C88,33 91,62 88,77 C82,97 60,112 60,112 C60,112 38,97 32,77 C29,62 32,33 32,33 Z"
          fill="url(#shieldInner)"
        />

        {/* Checkmark */}
        <Path
          d="M42,68 L54,80 L78,52"
          stroke="url(#checkGrad)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Sparkle accents around shield */}
        <Circle cx="12" cy="40" r="2" fill="#52A8A2" opacity="0.5" />
        <Circle cx="108" cy="35" r="1.5" fill="#8CB369" opacity="0.4" />
        <Circle cx="15" cy="90" r="1.5" fill="#4ECDC4" opacity="0.4" />
        <Circle cx="105" cy="85" r="2" fill="#85C7C3" opacity="0.4" />
        <Circle cx="60" cy="3" r="1.5" fill="#52A8A2" opacity="0.5" />

        {/* Small star accents */}
        <Path d="M108,55 L110,51 L112,55 L116,57 L112,59 L110,63 L108,59 L104,57Z" fill="#52A8A2" opacity="0.3" />
        <Path d="M8,65 L10,61 L12,65 L16,67 L12,69 L10,73 L8,69 L4,67Z" fill="#8CB369" opacity="0.25" />
      </Svg>
    </View>
  );
}
