// Sense Health — Brain Wave / Neural Network SVG
// Glowing nodes connected by flowing neural pathways
import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path, Circle, Defs, LinearGradient as SvgGradient,
  Stop, G, Ellipse,
} from 'react-native-svg';

export default function BrainWaveSvg({ width = 300, height = 160, style }) {
  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox="0 0 300 160">
        <Defs>
          <SvgGradient id="neuralLine1" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#9013FE" stopOpacity="0.5" />
            <Stop offset="50%" stopColor="#BD10E0" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#FF6B6B" stopOpacity="0.5" />
          </SvgGradient>
          <SvgGradient id="neuralLine2" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00C9FF" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#92FE9D" stopOpacity="0.4" />
          </SvgGradient>
          <SvgGradient id="nodeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF6B6B" />
            <Stop offset="100%" stopColor="#EE5A24" />
          </SvgGradient>
          <SvgGradient id="nodeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9013FE" />
            <Stop offset="100%" stopColor="#BD10E0" />
          </SvgGradient>
          <SvgGradient id="nodeGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00C9FF" />
            <Stop offset="100%" stopColor="#92FE9D" />
          </SvgGradient>
        </Defs>

        {/* Neural pathway lines — curved connections */}
        <G opacity="0.6">
          {/* Primary pathways */}
          <Path
            d="M30,80 C60,40 90,50 120,60 C150,70 170,30 200,45 C230,60 250,50 280,70"
            stroke="url(#neuralLine1)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M20,100 C50,90 80,110 120,90 C160,70 190,100 230,85 C260,75 275,90 290,80"
            stroke="url(#neuralLine2)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M40,120 C70,100 110,130 150,110 C190,90 210,120 250,105 C270,95 285,110 295,100"
            stroke="url(#neuralLine1)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Secondary subtle pathways */}
          <Path
            d="M60,50 C80,70 100,45 130,65"
            stroke="#9013FE"
            strokeWidth="0.8"
            fill="none"
            strokeDasharray="3,5"
            opacity="0.3"
          />
          <Path
            d="M170,40 C200,55 220,35 260,55"
            stroke="#00C9FF"
            strokeWidth="0.8"
            fill="none"
            strokeDasharray="3,5"
            opacity="0.3"
          />
          <Path
            d="M100,100 C130,80 160,100 200,85"
            stroke="#FF6B6B"
            strokeWidth="0.8"
            fill="none"
            strokeDasharray="3,5"
            opacity="0.25"
          />
        </G>

        {/* Neural nodes — key intersection points */}
        {/* Large primary nodes */}
        <Circle cx="120" cy="60" r="7" fill="url(#nodeGrad1)" opacity="0.9" />
        <Circle cx="120" cy="60" r="12" fill="none" stroke="#FF6B6B" strokeWidth="0.8" opacity="0.3" />

        <Circle cx="200" cy="45" r="6" fill="url(#nodeGrad2)" opacity="0.9" />
        <Circle cx="200" cy="45" r="10" fill="none" stroke="#9013FE" strokeWidth="0.8" opacity="0.3" />

        <Circle cx="150" cy="110" r="7" fill="url(#nodeGrad3)" opacity="0.9" />
        <Circle cx="150" cy="110" r="12" fill="none" stroke="#00C9FF" strokeWidth="0.8" opacity="0.3" />

        {/* Medium secondary nodes */}
        <Circle cx="60" cy="50" r="4" fill="#FF6B6B" opacity="0.7" />
        <Circle cx="230" cy="85" r="4" fill="#9013FE" opacity="0.7" />
        <Circle cx="80" cy="110" r="3.5" fill="#00C9FF" opacity="0.6" />
        <Circle cx="260" cy="55" r="3.5" fill="#92FE9D" opacity="0.6" />

        {/* Small tertiary dots */}
        <Circle cx="30" cy="80" r="2.5" fill="#EE5A24" opacity="0.5" />
        <Circle cx="280" cy="70" r="2.5" fill="#BD10E0" opacity="0.5" />
        <Circle cx="40" cy="120" r="2" fill="#FF6B6B" opacity="0.4" />
        <Circle cx="250" cy="105" r="2" fill="#00C9FF" opacity="0.4" />
        <Circle cx="170" cy="30" r="1.5" fill="#9013FE" opacity="0.4" />
        <Circle cx="100" cy="90" r="1.5" fill="#92FE9D" opacity="0.4" />

        {/* Glow halos around primary nodes */}
        <Circle cx="120" cy="60" r="18" fill="#FF6B6B" opacity="0.06" />
        <Circle cx="200" cy="45" r="16" fill="#9013FE" opacity="0.06" />
        <Circle cx="150" cy="110" r="18" fill="#00C9FF" opacity="0.06" />

        {/* Spark / synapse flashes */}
        <Circle cx="90" cy="55" r="1" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="160" cy="50" r="1" fill="#FFFFFF" opacity="0.6" />
        <Circle cx="215" cy="65" r="1" fill="#FFFFFF" opacity="0.5" />
        <Circle cx="130" cy="100" r="1" fill="#FFFFFF" opacity="0.5" />
      </Svg>
    </View>
  );
}
