// Sense Health — Health Pulse / Heartbeat SVG
// Animated-ready pulse line with gradient
import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path, Circle, Defs, LinearGradient as SvgGradient,
  Stop, G, Rect,
} from 'react-native-svg';

export default function HealthPulseSvg({ width = 300, height = 80, style, color = '#52A8A2' }) {
  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox="0 0 300 80">
        <Defs>
          <SvgGradient id="pulseLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.1" />
            <Stop offset="25%" stopColor={color} stopOpacity="0.5" />
            <Stop offset="50%" stopColor={color} stopOpacity="0.8" />
            <Stop offset="75%" stopColor={color} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </SvgGradient>
          <SvgGradient id="pulseGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Subtle grid lines */}
        <G opacity="0.08">
          {[20, 40, 60].map(y => (
            <Rect key={y} x="0" y={y} width="300" height="0.5" fill={color} />
          ))}
        </G>

        {/* Main pulse path — classic ECG waveform */}
        <Path
          d="M0,40 L30,40 L40,40 L50,38 L55,42 L60,40 L80,40 L90,40 L95,15 L100,65 L105,10 L110,55 L115,40 L130,40 L140,40 L150,38 L155,42 L160,40 L180,40 L190,40 L195,18 L200,62 L205,12 L210,58 L215,40 L230,40 L240,40 L245,36 L250,44 L255,40 L270,40 L280,40 L285,38 L290,42 L295,40 L300,40"
          stroke="url(#pulseLine)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Secondary fainter pulse behind */}
        <Path
          d="M0,42 L30,42 L50,40 L60,42 L80,42 L95,20 L100,60 L105,15 L110,52 L115,42 L140,42 L160,42 L195,22 L200,58 L205,16 L210,54 L215,42 L240,42 L255,42 L300,42"
          stroke={color}
          strokeWidth="1"
          fill="none"
          opacity="0.15"
          strokeLinecap="round"
        />

        {/* Glow area under primary peaks */}
        <Path
          d="M85,40 L95,15 L100,65 L105,10 L110,55 L120,40 Z"
          fill="url(#pulseGlow)"
          opacity="0.5"
        />
        <Path
          d="M185,40 L195,18 L200,62 L205,12 L210,58 L220,40 Z"
          fill="url(#pulseGlow)"
          opacity="0.5"
        />

        {/* Active pulse dots at peaks */}
        <Circle cx="105" cy="10" r="3" fill={color} opacity="0.8" />
        <Circle cx="105" cy="10" r="6" fill={color} opacity="0.15" />
        <Circle cx="205" cy="12" r="3" fill={color} opacity="0.8" />
        <Circle cx="205" cy="12" r="6" fill={color} opacity="0.15" />
      </Svg>
    </View>
  );
}
