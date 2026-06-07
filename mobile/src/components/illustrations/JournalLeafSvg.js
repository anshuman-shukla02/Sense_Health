// Sense Health — Journal Leaf / Botanical SVG
// Calming fern/leaf motifs with soft gradients
import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path, Circle, Defs, LinearGradient as SvgGradient,
  Stop, G,
} from 'react-native-svg';

export default function JournalLeafSvg({ width = 200, height = 200, style, opacity = 0.3 }) {
  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox="0 0 200 200" opacity={opacity}>
        <Defs>
          <SvgGradient id="leaf1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#8CB369" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#B5D19A" stopOpacity="0.3" />
          </SvgGradient>
          <SvgGradient id="leaf2" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#52A8A2" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#85C7C3" stopOpacity="0.2" />
          </SvgGradient>
          <SvgGradient id="leaf3" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#40C057" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#82C91E" stopOpacity="0.2" />
          </SvgGradient>
        </Defs>

        {/* Main stem */}
        <Path
          d="M100,190 C100,190 98,150 95,120 C92,90 88,60 100,30"
          stroke="#8CB369"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Large leaf — right side */}
        <Path
          d="M98,120 C110,110 140,95 150,80 C155,72 145,75 135,80 C120,88 105,105 98,120Z"
          fill="url(#leaf1)"
        />
        {/* Leaf vein */}
        <Path
          d="M100,118 C115,105 135,90 148,82"
          stroke="#8CB369"
          strokeWidth="0.8"
          fill="none"
          opacity="0.4"
        />

        {/* Large leaf — left side */}
        <Path
          d="M97,100 C85,90 55,78 42,68 C35,62 45,65 55,70 C72,78 90,90 97,100Z"
          fill="url(#leaf2)"
        />
        <Path
          d="M96,98 C82,88 60,76 44,70"
          stroke="#52A8A2"
          strokeWidth="0.8"
          fill="none"
          opacity="0.4"
        />

        {/* Medium leaf — right upper */}
        <Path
          d="M96,80 C105,72 125,58 132,48 C136,42 128,46 122,50 C112,58 100,70 96,80Z"
          fill="url(#leaf3)"
        />

        {/* Medium leaf — left upper */}
        <Path
          d="M97,65 C88,58 70,48 58,42 C52,38 58,42 65,46 C78,54 92,60 97,65Z"
          fill="url(#leaf1)"
          opacity="0.8"
        />

        {/* Small leaf — right */}
        <Path
          d="M96,50 C102,45 115,36 120,30 C122,27 116,30 112,33 C105,38 98,45 96,50Z"
          fill="url(#leaf2)"
          opacity="0.7"
        />

        {/* Small leaf — left */}
        <Path
          d="M98,42 C93,38 82,32 76,28 C73,26 78,29 82,32 C88,36 95,40 98,42Z"
          fill="url(#leaf3)"
          opacity="0.7"
        />

        {/* Decorative berries / dots */}
        <Circle cx="150" cy="78" r="3" fill="#8CB369" opacity="0.5" />
        <Circle cx="42" cy="66" r="3" fill="#52A8A2" opacity="0.5" />
        <Circle cx="132" cy="46" r="2.5" fill="#40C057" opacity="0.4" />
        <Circle cx="58" cy="40" r="2" fill="#8CB369" opacity="0.4" />
        <Circle cx="120" cy="28" r="2" fill="#B5D19A" opacity="0.5" />

        {/* Floating pollen / sparkles */}
        <Circle cx="160" cy="60" r="1.5" fill="#8CB369" opacity="0.4" />
        <Circle cx="35" cy="85" r="1" fill="#52A8A2" opacity="0.3" />
        <Circle cx="170" cy="100" r="1.5" fill="#B5D19A" opacity="0.3" />
        <Circle cx="28" cy="55" r="1" fill="#82C91E" opacity="0.3" />
        <Circle cx="115" cy="140" r="1" fill="#8CB369" opacity="0.3" />
        <Circle cx="80" cy="150" r="1.5" fill="#52A8A2" opacity="0.25" />
      </Svg>
    </View>
  );
}
