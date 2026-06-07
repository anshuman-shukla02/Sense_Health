// Sense Health — Wellness Hero SVG Illustration
// Abstract organic blobs with zen/meditation motifs
import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path, Circle, Defs, LinearGradient as SvgGradient,
  Stop, G, Ellipse, RadialGradient,
} from 'react-native-svg';

export default function WellnessHeroSvg({ width = 280, height = 220, style }) {
  const scale = width / 280;
  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox="0 0 280 220">
        <Defs>
          <SvgGradient id="blobPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#52A8A2" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#3A7D78" stopOpacity="0.15" />
          </SvgGradient>
          <SvgGradient id="blobAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9013FE" stopOpacity="0.20" />
            <Stop offset="100%" stopColor="#BD10E0" stopOpacity="0.08" />
          </SvgGradient>
          <SvgGradient id="blobWarm" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#8CB369" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#B5D19A" stopOpacity="0.10" />
          </SvgGradient>
          <RadialGradient id="glowCenter" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#52A8A2" stopOpacity="0.30" />
            <Stop offset="100%" stopColor="#52A8A2" stopOpacity="0" />
          </RadialGradient>
          <SvgGradient id="zenRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#52A8A2" stopOpacity="0.6" />
            <Stop offset="50%" stopColor="#85C7C3" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#4ECDC4" stopOpacity="0.6" />
          </SvgGradient>
        </Defs>

        {/* Background organic blobs */}
        <Path
          d="M60,40 C90,10 160,5 190,35 C220,65 230,120 200,155 C170,190 100,195 65,170 C30,145 30,70 60,40Z"
          fill="url(#blobPrimary)"
        />
        <Path
          d="M150,30 C185,15 240,25 255,65 C270,105 250,160 215,175 C180,190 135,170 125,140 C115,110 115,45 150,30Z"
          fill="url(#blobAccent)"
        />
        <Path
          d="M20,90 C35,55 80,40 110,60 C140,80 145,130 120,165 C95,200 40,195 20,160 C0,125 5,125 20,90Z"
          fill="url(#blobWarm)"
        />

        {/* Central glow */}
        <Ellipse cx="140" cy="110" rx="65" ry="55" fill="url(#glowCenter)" />

        {/* Zen circle / meditation ring */}
        <Circle
          cx="140" cy="108" r="38"
          fill="none"
          stroke="url(#zenRing)"
          strokeWidth="2"
          strokeDasharray="6,4"
        />
        <Circle
          cx="140" cy="108" r="28"
          fill="none"
          stroke="url(#zenRing)"
          strokeWidth="1.5"
          opacity="0.5"
        />

        {/* Meditation figure silhouette */}
        <G opacity="0.7">
          {/* Head */}
          <Circle cx="140" cy="96" r="6" fill="#52A8A2" opacity="0.8" />
          {/* Body — simple lotus position */}
          <Path
            d="M140,102 C140,102 132,114 128,118 C124,122 134,120 140,120 C146,120 156,122 152,118 C148,114 140,102 140,102Z"
            fill="#52A8A2"
            opacity="0.6"
          />
          {/* Arms — open/meditative pose */}
          <Path
            d="M134,108 C130,110 124,112 120,110"
            stroke="#52A8A2"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <Path
            d="M146,108 C150,110 156,112 160,110"
            stroke="#52A8A2"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
        </G>

        {/* Sparkle dots */}
        <Circle cx="80" cy="50" r="2" fill="#52A8A2" opacity="0.7" />
        <Circle cx="200" cy="45" r="1.5" fill="#9013FE" opacity="0.6" />
        <Circle cx="230" cy="90" r="2" fill="#8CB369" opacity="0.5" />
        <Circle cx="55" cy="140" r="1.5" fill="#4ECDC4" opacity="0.6" />
        <Circle cx="180" cy="175" r="2" fill="#BD10E0" opacity="0.4" />
        <Circle cx="105" cy="35" r="1" fill="#F4A261" opacity="0.5" />
        <Circle cx="245" cy="135" r="1.5" fill="#52A8A2" opacity="0.5" />

        {/* Small star accents */}
        <Path d="M95,70 L97,65 L99,70 L104,72 L99,74 L97,79 L95,74 L90,72Z" fill="#52A8A2" opacity="0.35" />
        <Path d="M185,60 L186.5,56 L188,60 L192,61.5 L188,63 L186.5,67 L185,63 L181,61.5Z" fill="#9013FE" opacity="0.3" />
        <Path d="M210,145 L211.5,141 L213,145 L217,146.5 L213,148 L211.5,152 L210,148 L206,146.5Z" fill="#8CB369" opacity="0.3" />

        {/* Floating circles — orbiting feel */}
        <Circle cx="100" cy="160" r="4" fill="none" stroke="#52A8A2" strokeWidth="0.8" opacity="0.3" />
        <Circle cx="190" cy="165" r="5" fill="none" stroke="#BD10E0" strokeWidth="0.8" opacity="0.2" />
        <Circle cx="60" cy="100" r="3" fill="none" stroke="#8CB369" strokeWidth="0.8" opacity="0.3" />
      </Svg>
    </View>
  );
}
